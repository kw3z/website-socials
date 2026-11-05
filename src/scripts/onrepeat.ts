import songsData from './songs.json';

interface Track {
    id: string; title: string; artist: string;
    onrepeat?: boolean; cover?: string; lyrics?: [number, string][];
}

declare global { interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void } }

const tracks = (songsData as Track[]).filter((t) => t.onrepeat && t.id);

function loadYT(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.YT?.Player) return resolve();
        window.onYouTubeIframeAPIReady = () => resolve();
        const s = document.createElement('script');
        s.src = 'https://www.youtube.com/iframe_api';
        s.onerror = () => reject(new Error('YouTube failed to load'));
        document.head.appendChild(s);
    });
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const ICON = {
    play: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.4-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5Z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6" y="5" width="4.2" height="14" rx="1.4"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.4"/></svg>',
    prev: '<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><rect x="5" y="5" width="2.4" height="14" rx="1.2"/><path d="M19 6.2v11.6a.9.9 0 0 1-1.4.75l-8.4-5.8a.9.9 0 0 1 0-1.5l8.4-5.8A.9.9 0 0 1 19 6.2Z"/></svg>',
    next: '<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><rect x="16.6" y="5" width="2.4" height="14" rx="1.2"/><path d="M5 6.2v11.6a.9.9 0 0 0 1.4.75l8.4-5.8a.9.9 0 0 0 0-1.5l-8.4-5.8A.9.9 0 0 0 5 6.2Z"/></svg>',
    volume: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    lyrics: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m18 6-12 12M6 6l12 12"/></svg>',
};

export function initOnRepeat() {
    if (!tracks.length || document.getElementById('onrepeat')) return;

    const style = document.createElement('style');
    style.textContent = `
  #onrepeat{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);width:min(520px,calc(100vw - 24px));height:78px;z-index:900;
    border-radius:20px;overflow:hidden;color:var(--text);font-family:'Geist Sans',system-ui,sans-serif;
    background:linear-gradient(145deg,color-mix(in srgb,var(--surface) 94%,var(--text) 6%),var(--surface));
    backdrop-filter:blur(24px) saturate(145%);-webkit-backdrop-filter:blur(24px) saturate(145%);
    border:1px solid var(--border);
    box-shadow:var(--elev-3)}
  #onrepeat .row{height:62px;display:flex;align-items:center;gap:10px;padding:0 12px 6px 10px}
  #onrepeat img.cover{width:48px;height:48px;min-width:48px;max-width:none;border-radius:12px !important;object-fit:cover;flex:none;
    background:var(--surface-sunken);box-shadow:0 3px 12px color-mix(in srgb,var(--text) 22%,transparent);display:block;transition:transform .35s cubic-bezier(.2,.8,.2,1)}
  #onrepeat.playing .cover{transform:scale(1.025)}
  #onrepeat .meta{min-width:0;flex:1;line-height:1.25}
  #onrepeat .title{font-family:'Geist Sans',system-ui,sans-serif;font-weight:600;font-size:13px;letter-spacing:-.01em;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #onrepeat .sub{font-family:'Geist Sans',system-ui,sans-serif;font-weight:400;font-size:11px;letter-spacing:.01em;opacity:.68;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:14px}
  #onrepeat .ctl{display:flex;align-items:center;gap:2px;flex:none}
  #onrepeat button{all:unset;box-sizing:border-box;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;
    cursor:pointer;color:var(--text);opacity:.84;transition:background .18s ease,opacity .18s ease,transform .18s cubic-bezier(.2,.8,.2,1),color .18s ease}
  #onrepeat button:hover{background:var(--accent-subtle);color:var(--accent);opacity:1;transform:scale(1.08)}
  #onrepeat button:active{transform:scale(.88);transition-duration:70ms}
  #onrepeat button:focus-visible,#onrepeat input:focus-visible{outline:2px solid var(--focus-ring);outline-offset:1px}
  #onrepeat .play{position:relative;width:38px;height:38px;opacity:1;background:var(--accent-subtle)}
  #onrepeat .play-icon{position:absolute;inset:0;display:grid;place-items:center;transition:opacity .2s ease,transform .28s cubic-bezier(.2,.8,.2,1)}
  #onrepeat .play-icon svg{width:18px;height:18px}
  #onrepeat .play-icon.play-shape svg{transform:translateX(-1px)}
  #onrepeat .play-icon.pause-shape{opacity:0;transform:scale(.72) rotate(-12deg)}
  #onrepeat.playing .play-icon.play-shape{opacity:0;transform:scale(.72) rotate(12deg)}
  #onrepeat.playing .play-icon.pause-shape{opacity:1;transform:scale(1) rotate(0)}
  #onrepeat .volume{display:flex;align-items:center;gap:6px;width:92px;flex:none;color:var(--text);opacity:.82}
  #onrepeat .volume-icon{width:18px;height:18px;flex:none}
  #onrepeat input.volume-slider{appearance:none;width:66px;height:16px;margin:0;background:transparent;cursor:pointer;transition:filter .18s ease}
  #onrepeat input.volume-slider:hover{filter:brightness(1.18)}
  #onrepeat input.volume-slider:active{filter:brightness(1.3)}
  #onrepeat input.volume-slider::-webkit-slider-runnable-track{height:3px;border-radius:99px;background:linear-gradient(to right,var(--accent) 0 var(--volume,70%),color-mix(in srgb,var(--text) 22%,transparent) var(--volume,70%) 100%)}
  #onrepeat input.volume-slider::-moz-range-track{height:3px;border-radius:99px;background:color-mix(in srgb,var(--text) 22%,transparent)}
  #onrepeat input.volume-slider::-moz-range-progress{height:3px;border-radius:99px;background:var(--accent)}
  #onrepeat input.volume-slider::-webkit-slider-thumb{appearance:none;width:11px;height:11px;margin-top:-4px;border:1px solid var(--border);border-radius:50%;background:var(--surface);box-shadow:0 1px 4px color-mix(in srgb,var(--text) 38%,transparent);transition:transform .16s cubic-bezier(.2,.8,.2,1)}
  #onrepeat input.volume-slider::-moz-range-thumb{width:11px;height:11px;border:1px solid var(--border);border-radius:50%;background:var(--surface);box-shadow:0 1px 4px color-mix(in srgb,var(--text) 38%,transparent);transition:transform .16s cubic-bezier(.2,.8,.2,1)}
  #onrepeat input.volume-slider:hover::-webkit-slider-thumb{transform:scale(1.2)}
  #onrepeat input.volume-slider:active::-webkit-slider-thumb{transform:scale(.88)}
  #onrepeat input.volume-slider:hover::-moz-range-thumb{transform:scale(1.2)}
  #onrepeat input.volume-slider:active::-moz-range-thumb{transform:scale(.88)}
  #onrepeat .seek-row{position:absolute;inset-inline:0;bottom:0;height:16px;display:flex;align-items:center;gap:8px;padding:0 12px}
  #onrepeat .seek{position:relative;flex:1;min-width:0;height:14px;display:flex;align-items:center;cursor:pointer;touch-action:none}
  #onrepeat .track{position:relative;width:100%;height:2px;background:color-mix(in srgb,var(--text) 22%,transparent);transition:height .18s cubic-bezier(.2,.8,.2,1),filter .18s ease}
  #onrepeat .fill{position:absolute;left:0;top:0;bottom:0;width:0;background:var(--accent)}
  #onrepeat .knob{position:absolute;top:50%;width:12px;height:12px;border:1px solid var(--border);border-radius:50%;background:var(--surface);transform:translate(-50%,-50%) scale(0);
    transition:transform .15s;box-shadow:0 1px 4px color-mix(in srgb,var(--text) 38%,transparent);left:0}
  #onrepeat .time{position:static;z-index:1;flex:none;font-size:10px;line-height:1;font-variant-numeric:tabular-nums;pointer-events:none;
    color:var(--text-muted)}
  #onrepeat:hover .track,#onrepeat.scrub .track{height:6px;filter:brightness(1.12)}
  #onrepeat:hover .knob,#onrepeat.scrub .knob{transform:translate(-50%,-50%) scale(1)}
  @media (hover:none){#onrepeat .track{height:4px}#onrepeat .knob{transform:translate(-50%,-50%) scale(1)}}
  #onrepeat .yt-host{position:absolute;width:2px;height:2px;opacity:.01;pointer-events:none}
  #lyrics-panel{position:fixed;z-index:899;left:50%;bottom:100px;transform:translateX(-50%) translateY(8px);width:min(430px,calc(100vw - 24px));max-height:min(65vh,560px);display:flex;flex-direction:column;
    color:var(--text);background:var(--surface);border:1px solid var(--border);border-radius:20px;box-shadow:var(--elev-4);backdrop-filter:blur(24px);opacity:0;pointer-events:none;transition:opacity .2s ease,transform .2s ease}
  #lyrics-panel.open{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0)}
  #lyrics-panel .ly-head{display:flex;align-items:center;gap:12px;padding:16px 16px 12px;border-bottom:1px solid var(--border)}
  #lyrics-panel .ly-meta{min-width:0;flex:1}.ly-title{font:600 14px/1.3 'Geist Sans',system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #lyrics-panel .ly-artist{font:400 12px/1.4 'Geist Sans',system-ui,sans-serif;opacity:.65;margin-top:3px}
  #lyrics-panel .ly-actions{display:flex;align-items:center;gap:4px}
  #lyrics-panel .ly-actions button{width:32px;height:32px}
  #lyrics-panel button,#lyrics-panel a{transition:transform .18s cubic-bezier(.2,.8,.2,1),background .18s ease,opacity .18s ease,color .18s ease}
  #lyrics-panel button:hover,#lyrics-panel a:hover{transform:translateY(-1px) scale(1.04);opacity:1}
  #lyrics-panel button:active,#lyrics-panel a:active{transform:translateY(1px) scale(.94);transition-duration:70ms}
  #lyrics-panel :focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px}
  .ly-source{border:0;background:none;color:inherit;font:500 11px 'Geist Sans',system-ui,sans-serif;opacity:.65;cursor:pointer;padding:8px 11px;border-radius:99px;white-space:nowrap}
  .ly-sources{display:flex;gap:2px;padding:10px 12px 4px;overflow-x:auto}.ly-source:hover,.ly-source.active{background:var(--accent-subtle);color:var(--accent);opacity:1}
  .ly-body{padding:10px 20px 20px;overflow:auto;overflow-wrap:anywhere;white-space:pre-wrap;font:400 14px/1.9 'Geist Sans',system-ui,sans-serif;color:var(--text)}
  .ly-status{padding:16px 20px 22px;font:400 12px/1.5 'Geist Sans',system-ui,sans-serif;opacity:.62}
  @media(max-width:430px){#onrepeat .row{gap:7px;padding-inline:8px}#onrepeat img.cover{width:44px;height:44px;min-width:44px}#onrepeat .ctl{gap:0}#onrepeat button{width:30px;height:34px}#onrepeat .volume{width:65px;gap:3px}#onrepeat input.volume-slider{width:42px}}
  @media (prefers-reduced-motion:reduce){#onrepeat *,#lyrics-panel{transition:none!important;animation:none!important}}
  `;
    document.head.appendChild(style);

    const root = document.createElement('div');
    root.id = 'onrepeat';
    root.innerHTML = `
    <div class="row">
      <img class="cover" alt="" />
      <div class="meta"><div class="title"></div><div class="sub"></div></div>
      <div class="ctl">
        <button class="prev" aria-label="Previous track">${ICON.prev}</button>
        <button class="play" aria-label="Play" aria-pressed="false"><span class="play-icon play-shape">${ICON.play}</span><span class="play-icon pause-shape">${ICON.pause}</span></button>
        <button class="next" aria-label="Next track">${ICON.next}</button>
        <button class="lyrics-toggle" aria-label="Show lyrics" aria-expanded="false">${ICON.lyrics}</button>
      </div>
      <label class="volume" aria-label="Volume"><span class="volume-icon">${ICON.volume}</span><input class="volume-slider" type="range" min="0" max="100" value="70" aria-label="Volume" /></label>
    </div>
    <div class="seek-row">
      <span class="time l">0:00</span>
      <div class="seek" role="slider" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <div class="track"><div class="fill"></div><div class="knob"></div></div>
      </div>
      <span class="time r">0:00</span>
    </div>
    <div class="yt-host"></div>`;
    document.body.appendChild(root);

    const panel = document.createElement('section');
    panel.id = 'lyrics-panel';
    panel.setAttribute('aria-label', 'Track details and lyrics');
    panel.inert = true;
    panel.innerHTML = `<div class="ly-head"><div class="ly-meta"><div class="ly-title"></div><div class="ly-artist"></div></div><div class="ly-actions"><a class="ly-genius ly-source" target="_blank" rel="noopener noreferrer">Genius ↗</a><a class="ly-mxm ly-source" target="_blank" rel="noopener noreferrer">Musixmatch ↗</a><button class="ly-close" aria-label="Close lyrics">${ICON.close}</button></div></div><div class="ly-sources"><button class="ly-source active" data-provider="lrclib">LRCLIB</button><button class="ly-source" data-provider="lyricsovh">Lyrics.ovh</button></div><div class="ly-status" role="status">Choose a source to load lyrics.</div><div class="ly-body" hidden></div>`;
    document.body.appendChild(panel);

    const $ = <T extends Element>(q: string) => root.querySelector(q) as T;
    const cover = $<HTMLImageElement>('.cover'), title = $<HTMLElement>('.title'), sub = $<HTMLElement>('.sub');
    const play = $<HTMLButtonElement>('.play');
    const seek = $<HTMLElement>('.seek'), fill = $<HTMLElement>('.fill'), knob = $<HTMLElement>('.knob');
    const tl = $<HTMLElement>('.time.l'), tr = $<HTMLElement>('.time.r');
    const lyricsToggle = $<HTMLButtonElement>('.lyrics-toggle');
    const volume = $<HTMLInputElement>('.volume-slider');
    const lyTitle = panel.querySelector('.ly-title') as HTMLElement, lyArtist = panel.querySelector('.ly-artist') as HTMLElement;
    const lyStatus = panel.querySelector('.ly-status') as HTMLElement, lyBody = panel.querySelector('.ly-body') as HTMLElement;
    const sourceButtons = [...panel.querySelectorAll<HTMLButtonElement>('[data-provider]')];
    let lyricsRequest = 0;

    function setLyricsOpen(open: boolean) {
        panel.classList.toggle('open', open);
        panel.inert = !open;
        panel.setAttribute('aria-hidden', String(!open));
        lyricsToggle.setAttribute('aria-expanded', String(open));
        if (open) void loadLyrics('lrclib');
    }

    async function loadLyrics(provider: string) {
        const requestId = ++lyricsRequest;
        const t = tracks[i]!;
        sourceButtons.forEach((b) => b.classList.toggle('active', b.dataset.provider === provider));
        lyStatus.hidden = false; lyBody.hidden = true; lyStatus.textContent = 'Looking for lyrics…';
        try {
            let lyrics = '';
            let synced: string | null = null;
            if (provider === 'lrclib') {
                const params = new URLSearchParams({ artist_name: t.artist, track_name: t.title });
                const response = await fetch(`https://lrclib.net/api/get?${params}`);
                if (response.ok) {
                    const data = await response.json() as { plainLyrics?: string | null; syncedLyrics?: string | null; instrumental?: boolean };
                    lyrics = data.plainLyrics || '';
                    synced = data.syncedLyrics || null;
                    if (!lyrics && synced) lyrics = synced.replace(/^\[\d{2}:\d{2}(?:\.\d+)?\]\s?/gm, '');
                    if (!lyrics && data.instrumental) lyrics = 'This track is marked as instrumental.';
                }
                if (!lyrics || lyrics.trim().length < 120) {
                    const search = await fetch(`https://lrclib.net/api/search?${params}`);
                    if (!search.ok && !lyrics) throw new Error(search.status === 429 ? 'LRCLIB is busy right now. Try again shortly.' : 'LRCLIB could not find lyrics for this track.');
                    if (search.ok) {
                    const results = await search.json() as Array<{ trackName?: string; artistName?: string; plainLyrics?: string | null; syncedLyrics?: string | null; instrumental?: boolean }>;
                    const normalize = (value: string) => value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
                    const wantedTitle = normalize(t.title);
                    const wantedArtist = normalize(t.artist);
                    const exactMatches = results.filter((item) => normalize(item.trackName ?? '') === wantedTitle && normalize(item.artistName ?? '').includes(wantedArtist));
                    exactMatches.sort((a, b) => `${b.plainLyrics ?? ''}${b.syncedLyrics ?? ''}`.length - `${a.plainLyrics ?? ''}${a.syncedLyrics ?? ''}`.length);
                    const match = exactMatches[0] ?? results.find((item) => normalize(item.trackName ?? '') === wantedTitle);
                    if (match) {
                        let candidate = match.plainLyrics || '';
                        const candidateSynced = match.syncedLyrics || null;
                        if (!candidate && candidateSynced) candidate = candidateSynced.replace(/^\[\d{2}:\d{2}(?:\.\d+)?\]\s?/gm, '');
                        if (candidate.length > lyrics.length) {
                            lyrics = candidate;
                            synced = candidateSynced;
                        }
                        if (!lyrics && match.instrumental) lyrics = 'This track is marked as instrumental.';
                    }
                    }
                }
            } else {
                const response = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(t.artist)}/${encodeURIComponent(t.title)}`);
                if (!response.ok) throw new Error(response.status === 404 ? 'No lyrics found in Lyrics.ovh for this track.' : 'Lyrics.ovh could not load lyrics right now.');
                const data = await response.json() as { lyrics?: string };
                lyrics = data.lyrics || '';
            }
            if (requestId !== lyricsRequest) return;
            lyrics = lyrics
                .replace(/\\n/g, '\n')
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/\r\n?/g, '\n')
                .trim();
            if (!lyrics) throw new Error('No lyrics found for this track.');
            lyStatus.hidden = true; lyBody.hidden = false; lyBody.textContent = lyrics;
            panel.dataset.syncedLyrics = synced || '';
        } catch (error) {
            if (requestId !== lyricsRequest) return;
            lyStatus.hidden = false; lyBody.hidden = true;
            lyStatus.textContent = error instanceof Error ? error.message : 'Lyrics are unavailable right now.';
        }
    }

    let i = Math.floor(Math.random() * tracks.length), player: any = null, ready = false, playing = false, scrubbing = false;
    let playerReadyPromise: Promise<void> | null = null;
    let lyricLine = '';

    window.addEventListener('quesz:pause-onrepeat', () => {
        if (player && ready) player.pauseVideo();
    });

    const subText = () => lyricLine || tracks[i]!.artist;

    function show() {
        const t = tracks[i]!;
        cover.src = t.cover || `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg`;
        title.textContent = t.title;
        lyricLine = '';
        sub.textContent = subText();
        lyTitle.textContent = t.title; lyArtist.textContent = t.artist;
        (panel.querySelector('.ly-genius') as HTMLAnchorElement).href = `https://genius.com/search?q=${encodeURIComponent(`${t.artist} ${t.title}`)}`;
        (panel.querySelector('.ly-mxm') as HTMLAnchorElement).href = `https://www.musixmatch.com/search/${encodeURIComponent(`${t.artist} ${t.title}`)}`;
        if (panel.classList.contains('open')) void loadLyrics('lrclib');
        setProgress(0); tl.textContent = '0:00'; tr.textContent = '0:00';
    }

    function setProgress(p: number) {
        const pct = Math.max(0, Math.min(1, p)) * 100;
        fill.style.width = pct + '%'; knob.style.left = pct + '%';
        seek.setAttribute('aria-valuenow', String(Math.round(pct)));
    }

    function setPlaying(v: boolean) {
        playing = v;
        root.classList.toggle('playing', v);
        play.setAttribute('aria-label', v ? 'Pause' : 'Play');
        play.setAttribute('aria-pressed', String(v));
    }

    async function ensurePlayer() {
        if (ready) return;
        if (playerReadyPromise) return playerReadyPromise;
        playerReadyPromise = (async () => {
            await loadYT();
            await new Promise<void>((resolve) => {
                player = new window.YT.Player(root.querySelector('.yt-host'), {
                    width: 200, height: 200, videoId: tracks[i]!.id,
                    playerVars: { playsinline: 1, controls: 0 },
                    events: {
                        onReady: () => { ready = true; player.setVolume(Number(volume.value)); resolve(); },
                        onStateChange: (e: any) => {
                            setPlaying(e.data === 1);
                            if (e.data === 0) void go(1, true);
                        },
                    },
                });
            });
        })();
        return playerReadyPromise;
    }

    async function toggle() {
        await ensurePlayer();
        if (!ready) return;
        playing ? player.pauseVideo() : player.playVideo();
    }

    async function go(d: number, autoplay = playing) {
        i = (i + d + tracks.length) % tracks.length;
        show();
        if (player && ready) {
            if (autoplay) player.loadVideoById(tracks[i]!.id);
            else player.cueVideoById(tracks[i]!.id);
        }
    }

    function seekTo(clientX: number) {
        const r = seek.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
        setProgress(p);
        if (ready) player.seekTo(p * (player.getDuration() || 0), true);
    }

    play.addEventListener('click', () => void toggle());
    $('.prev').addEventListener('click', () => void go(-1));
    $('.next').addEventListener('click', () => void go(1));
    volume.addEventListener('input', () => {
        volume.style.setProperty('--volume', `${volume.value}%`);
        if (ready) player.setVolume(Number(volume.value));
    });
    lyricsToggle.addEventListener('click', () => setLyricsOpen(!panel.classList.contains('open')));
    panel.querySelector('.ly-close')!.addEventListener('click', () => setLyricsOpen(false));
    sourceButtons.forEach((button) => button.addEventListener('click', () => void loadLyrics(button.dataset.provider!)));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && panel.classList.contains('open')) setLyricsOpen(false); });

    seek.addEventListener('pointerdown', (e) => {
        scrubbing = true; root.classList.add('scrub');
        seek.setPointerCapture(e.pointerId); seekTo(e.clientX);
    });
    seek.addEventListener('pointermove', (e) => { if (scrubbing) seekTo(e.clientX); });
    const stop = () => { scrubbing = false; root.classList.remove('scrub'); };
    seek.addEventListener('pointerup', stop);
    seek.addEventListener('pointercancel', stop);
    seek.addEventListener('keydown', (e) => {
        if (!ready) return;
        if (e.key === 'ArrowRight') player.seekTo(player.getCurrentTime() + 5, true);
        if (e.key === 'ArrowLeft') player.seekTo(Math.max(0, player.getCurrentTime() - 5), true);
    });
    seek.tabIndex = 0;

    setInterval(() => {
        if (!ready || !player) return;
        let t = 0, d = 0;
        try { t = player.getCurrentTime(); d = player.getDuration(); } catch { return; }
        if (!scrubbing && d > 0) setProgress(t / d);
        tl.textContent = fmt(t); tr.textContent = fmt(d);
        const lines = tracks[i]!.lyrics;
        if (lines?.length) {
            let line = '';
            for (const [at, text] of lines) { if (t >= at) line = text; else break; }
            if (line !== lyricLine) { lyricLine = line; sub.textContent = subText(); }
        }
    }, 250);

    volume.style.setProperty('--volume', `${volume.value}%`);
    show();
    void ensurePlayer().catch(() => { /* The player remains available if YouTube is temporarily blocked. */ });
}
