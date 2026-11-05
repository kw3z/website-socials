import metaData from '../assets/badapple/meta.json';
import chunk0 from '../assets/badapple/chunk-0.json.gz?url';
import chunk1 from '../assets/badapple/chunk-1.json.gz?url';
import chunk2 from '../assets/badapple/chunk-2.json.gz?url';
import chunk3 from '../assets/badapple/chunk-3.json.gz?url';
import chunk4 from '../assets/badapple/chunk-4.json.gz?url';
import chunk5 from '../assets/badapple/chunk-5.json.gz?url';
import chunk6 from '../assets/badapple/chunk-6.json.gz?url';
import chunk7 from '../assets/badapple/chunk-7.json.gz?url';
import chunk8 from '../assets/badapple/chunk-8.json.gz?url';
import chunk9 from '../assets/badapple/chunk-9.json.gz?url';

interface BadAppleFrame { index: number; time: number; rows: string[] }
interface BadAppleMeta { frameRate: number; frameCount: number; chunkSize: number; chunkCount: number }

const release = 'https://github.com/kw3z/website-socials/releases/download/badapple-assets-v1';
const audioSources = [
  'https://quesz.vercel.app/api/badapple/BadApple-sound.mp3',
  `${release}/BadApple-sound.mp3`,
];
const meta = metaData as BadAppleMeta;
const frameChunks = [chunk0, chunk1, chunk2, chunk3, chunk4, chunk5, chunk6, chunk7, chunk8, chunk9];

async function decodeFrames(response: Response): Promise<BadAppleFrame[]> {
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;
  if (!isGzip) return JSON.parse(new TextDecoder().decode(bytes)) as BadAppleFrame[];
  if (!('DecompressionStream' in window)) throw new Error('This browser cannot decompress the video frames.');
  const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).json() as Promise<BadAppleFrame[]>;
}

export function initBadApple() {
  const root = document.querySelector<HTMLElement>('[data-bad-apple]');
  if (!root) return;

  const screen = root.querySelector<HTMLElement>('.screen')!;
  const frameDisplay = root.querySelector<HTMLElement>('.frame')!;
  const play = root.querySelector<HTMLButtonElement>('.toggle')!;
  const playGlyph = root.querySelector<HTMLElement>('.play-glyph')!;
  const status = root.querySelector<HTMLElement>('.status')!;
  const volume = root.querySelector<HTMLInputElement>('.volume-control input')!;
  const audio = root.querySelector<HTMLAudioElement>('.audio')!;

  let index = 0;
  let playing = false;
  let frameStart = 0;
  let animation = 0;
  const chunks = new Map<number, BadAppleFrame[]>();
  const loading = new Map<number, Promise<BadAppleFrame[]>>();

  const secondsAt = (frame: number) => meta ? frame / meta.frameRate : 0;

  function setStatus(message: string) {
    status.textContent = message;
  }

  function setPlaying(value: boolean) {
    playing = value;
    root!.classList.toggle('playing', value);
    playGlyph.textContent = value ? 'Ⅱ' : '▶';
    play.setAttribute('aria-label', value ? 'Pause Bad Apple' : 'Play Bad Apple');
    if (value) setStatus('Playing · 24 fps ASCII video');
    else if (meta && index >= meta.frameCount - 1) setStatus('Video ended · press play to restart');
    else if (meta) setStatus('Paused · press play to continue');
  }

  function drawFrame(frameIndex: number) {
    if (!meta) return false;
    const chunkIndex = Math.floor(frameIndex / meta.chunkSize);
    const frame = chunks.get(chunkIndex)?.[frameIndex % meta.chunkSize];
    if (!frame) return false;
    frameDisplay.textContent = frame.rows.join('\n');
    index = frameIndex;
    return true;
  }

  function loadChunk(chunkIndex: number): Promise<BadAppleFrame[]> {
    const cached = chunks.get(chunkIndex);
    if (cached) return Promise.resolve(cached);
    const pending = loading.get(chunkIndex);
    if (pending) return pending;
    const chunkUrl = frameChunks[chunkIndex];
    if (!chunkUrl) return Promise.reject(new Error(`Frame chunk ${chunkIndex} is missing from the build.`));
    const request = fetch(chunkUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`Frame download failed (${response.status}).`);
        return decodeFrames(response);
      })
      .then((frames) => {
        chunks.set(chunkIndex, frames);
        for (const oldChunk of chunks.keys()) if (oldChunk < chunkIndex - 1) chunks.delete(oldChunk);
        return frames;
      })
      .finally(() => loading.delete(chunkIndex));
    loading.set(chunkIndex, request);
    return request;
  }

  function pauseForVisibility() {
    if (!playing) return;
    playing = false;
    cancelAnimationFrame(animation);
    audio.pause();
    root!.classList.remove('playing');
    playGlyph.textContent = '▶';
    play.setAttribute('aria-label', 'Play Bad Apple');
    setStatus('Paused while off screen');
  }

  function tick(now: number) {
    if (!meta || !playing) return;
    const target = Math.min(Math.floor((now - frameStart) * meta.frameRate / 1000), meta.frameCount - 1);
    const chunkIndex = Math.floor(target / meta.chunkSize);
    void loadChunk(chunkIndex).then(() => {
      if (playing) drawFrame(target);
    }).catch(() => setStatus('A frame chunk failed to load. Press play to retry.'));
    if (chunkIndex + 1 < meta.chunkCount && target % meta.chunkSize > meta.chunkSize * .72) void loadChunk(chunkIndex + 1).catch(() => {});
    if (target >= meta.frameCount - 1) {
      void loadChunk(chunkIndex).then(() => drawFrame(meta!.frameCount - 1)).catch(() => {});
      setPlaying(false);
      audio.pause();
      return;
    }
    animation = requestAnimationFrame(tick);
  }

  async function toggle() {
    if (!meta) return;
    if (playing) {
      playing = false;
      cancelAnimationFrame(animation);
      audio.pause();
      setPlaying(false);
      return;
    }
    window.dispatchEvent(new Event('quesz:pause-onrepeat'));
    try {
      if (index >= meta.frameCount - 1) {
        index = 0;
        audio.currentTime = 0;
        await loadChunk(0);
        drawFrame(0);
      } else {
        await loadChunk(Math.floor(index / meta.chunkSize));
      }
      const time = secondsAt(index);
      if (Math.abs(audio.currentTime - time) > .35) audio.currentTime = time;
      setPlaying(true);
      frameStart = performance.now() - time * 1000;
      await audio.play();
      animation = requestAnimationFrame(tick);
    } catch {
      setPlaying(false);
      setStatus('Could not play the video. Check the connection and try again.');
    }
  }

  async function init() {
    try {
      const response = meta;
      if (!response.frameRate || !response.chunkSize || !response.frameCount) throw new Error('Video metadata is incomplete.');
      if (frameChunks.length !== response.chunkCount) throw new Error('Not all video frame chunks were included in the build.');
      audio.dataset.sourceIndex = '0';
      audio.src = audioSources[0]!;
      audio.volume = Number(volume.value);
      await loadChunk(0);
      drawFrame(0);
      play.disabled = false;
      setStatus('Ready · press play');
    } catch (error) {
      console.error('Bad Apple failed to initialize:', error);
      frameDisplay.textContent = 'Bad Apple frames are unavailable right now.';
      setStatus(error instanceof Error ? error.message : 'Could not load the Bad Apple assets.');
    }
  }

  play.addEventListener('click', () => void toggle());
  volume.addEventListener('input', () => { audio.volume = Number(volume.value); });
  audio.addEventListener('ended', () => setPlaying(false));
  audio.addEventListener('error', () => {
    if (!meta) return;
    const nextSource = Number(audio.dataset.sourceIndex ?? 0) + 1;
    if (nextSource < audioSources.length) {
      audio.dataset.sourceIndex = String(nextSource);
      audio.src = audioSources[nextSource]!;
      audio.load();
      return;
    }
    setStatus('The video is ready, but its soundtrack could not load.');
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseForVisibility(); });
  const observer = new IntersectionObserver(([entry]) => {
    if (entry && !entry.isIntersecting) pauseForVisibility();
  }, { threshold: .05 });
  observer.observe(screen);
  void init();
}

initBadApple();
