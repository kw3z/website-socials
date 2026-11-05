export {};

type Status = 'online' | 'idle' | 'dnd' | 'offline';

interface Activity {
  type: number; name: string; details?: string; state?: string;
  application_id?: string;
  assets?: { large_image?: string; large_text?: string };
  timestamps?: { start?: number; end?: number };
}
interface SpotifyData {
  track_id: string; song: string; artist: string; album: string; album_art_url: string;
  timestamps: { start: number; end: number };
}
interface Presence {
  discord_status: Status;
  listening_to_spotify: boolean;
  spotify: SpotifyData | null;
  activities: Activity[];
}

const rootEl = document.getElementById('presence');
if (rootEl) init(rootEl);

const LAST_SPOTIFY_KEY = 'quesz.lastSpotifyTrack';

function init(root: HTMLElement) {
  const id = (root.dataset.discordId ?? '').trim();
  const host = root.dataset.host ?? 'api.lanyard.rest';
  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;

  const statusText = $('#status-text');
  const activityRow = $('#activity'), activityImg = $<HTMLImageElement>('#activity-img');
  const activityKind = $('#activity-kind'), activityName = $('#activity-name'), activityDetail = $('#activity-detail');
  const spotifyRow = $('#spotify'), spotifyArt = $<HTMLImageElement>('#spotify-art');
  const spotifyTrack = $<HTMLAnchorElement>('#spotify-track'), spotifyArtist = $('#spotify-artist');
  const spotifyLabel = $('#spotify-label'), spotifyEq = $('#spotify-eq'), spotifyBar = $('#spotify-bar');
  const bar = $('.bar'), fill = $('#spotify-fill'), live = $('#presence-live');

  function readLastSpotify(): SpotifyData | null {
    try {
      const raw = localStorage.getItem(LAST_SPOTIFY_KEY);
      if (!raw) return null;
      const track = JSON.parse(raw) as SpotifyData;
      return track.track_id && track.song && track.artist && track.album_art_url ? track : null;
    } catch { return null; }
  }

  function showSpotify(s: SpotifyData, playing: boolean) {
    spotifyTrack.textContent = s.song;
    spotifyTrack.href = `https://open.spotify.com/track/${encodeURIComponent(s.track_id)}`;
    spotifyArtist.textContent = s.artist.replace(/;\s*/g, ', ');
    if (spotifyArt.src !== s.album_art_url) spotifyArt.src = s.album_art_url;
    spotifyLabel.textContent = playing ? 'Listening now' : 'Last played';
    spotifyLabel.title = playing ? '' : 'Most recent Spotify track this browser has seen';
    spotifyEq.hidden = !playing;
    spotifyBar.hidden = !playing;
    spotifyRow.hidden = false;
    if (playing) startProgress(s);
    else stopProgress();
  }

  const cachedTrack = readLastSpotify();
  if (cachedTrack) showSpotify(cachedTrack, false);

  if (!/^\d{15,22}$/.test(id)) {
    root.dataset.state = 'error';
    statusText.textContent = 'Discord · add your user ID in profile.ts';
    console.warn('[presence] profile.discordId must be a 15-22 digit number. Got:', JSON.stringify(id));
    return;
  }

  const LABEL: Record<Status, string> = { online: 'Online', idle: 'Idle', dnd: 'Do not disturb', offline: 'Offline' };
  const KIND: Record<number, string> = { 0: 'Playing', 1: 'Streaming', 3: 'Watching', 5: 'Competing in' };

  let current: Presence | null = null;
  let ws: WebSocket | null = null;
  let hb: number | undefined, poll: number | undefined, tick: number | undefined, retry: number | undefined;
  let failures = 0, announced = '';

  function render(p: Presence) {
    current = p;
    root.dataset.state = 'ready';
    root.dataset.status = p.discord_status;
    statusText.textContent = `Discord · ${LABEL[p.discord_status] ?? 'Offline'}`;

    const act = p.activities.find((a) => a.type !== 2 && a.type !== 4);
    if (act) {
      activityKind.textContent = KIND[act.type] ?? 'Activity';
      activityName.textContent = act.name;
      activityDetail.textContent = [act.details, act.state].filter(Boolean).join(' · ');
      const img = resolveAsset(act);
      if (img) { activityImg.src = img; activityImg.hidden = false; }
      else { activityImg.hidden = true; activityImg.removeAttribute('src'); }
      activityRow.hidden = false;
    } else {
      activityRow.hidden = true;
    }

    if (p.listening_to_spotify && p.spotify) {
      const s = p.spotify;
      try { localStorage.setItem(LAST_SPOTIFY_KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
      showSpotify(s, true);
    } else {
      const last = readLastSpotify();
      if (last) showSpotify(last, false);
      else { spotifyRow.hidden = true; stopProgress(); }
    }

    const headline = p.listening_to_spotify && p.spotify
      ? `Now playing ${p.spotify.song} by ${p.spotify.artist.replace(/;\s*/g, ', ')}`
      : act ? `${KIND[act.type] ?? 'Activity'} ${act.name}` : '';
    if (headline && headline !== announced) { announced = headline; live.textContent = headline; }
  }

  function resolveAsset(a: Activity): string {
    const img = a.assets?.large_image ?? '';
    if (!img) return '';
    if (img.startsWith('mp:external/')) return `https://media.discordapp.net/external/${img.slice('mp:external/'.length)}`;
    if (img.startsWith('mp:')) return `https://media.discordapp.net/${img.slice(3)}`;
    if (a.application_id) return `https://cdn.discordapp.com/app-assets/${a.application_id}/${img}.png`;
    return '';
  }

  function startProgress(s: SpotifyData) {
    stopProgress();
    const update = () => {
      const total = s.timestamps.end - s.timestamps.start;
      const pct = total > 0 ? Math.min(100, Math.max(0, ((Date.now() - s.timestamps.start) / total) * 100)) : 0;
      fill.style.width = `${pct}%`;
      bar.setAttribute('aria-valuenow', String(Math.round(pct)));
      if (pct >= 100) { stopProgress(); void restRefresh(); }
    };
    update();
    tick = window.setInterval(update, 1000);
  }
  function stopProgress() { if (tick) { clearInterval(tick); tick = undefined; } }

  async function restRefresh() {
    try {
      const r = await fetch(`https://${host}/v1/users/${id}`, { cache: 'no-store' });
      const j = (await r.json()) as { success: boolean; data?: Presence; error?: { message?: string } };
      if (j.success && j.data) { render(j.data); return; }
      throw new Error(j.error?.message ?? `HTTP ${r.status}`);
    } catch (err) {
      console.warn('[presence]', err instanceof Error ? err.message : err);
      if (!current) {
        root.dataset.state = 'error';
        statusText.textContent = 'Discord · not connected (join discord.gg/lanyard)';
      }
    }
  }
  function startPolling() { stopPolling(); poll = window.setInterval(restRefresh, 15000); }
  function stopPolling() { if (poll) { clearInterval(poll); poll = undefined; } }

  function connect() {
    if (ws && ws.readyState <= 1) return;
    try { ws = new WebSocket(`wss://${host}/socket`); } catch { fail(); return; }

    ws.addEventListener('message', (ev) => {
      let m: { op: number; t?: string; d?: unknown };
      try { m = JSON.parse(String(ev.data)); } catch { return; }
      if (m.op === 1) {
        const interval = (m.d as { heartbeat_interval?: number } | undefined)?.heartbeat_interval ?? 30000;
        ws?.send(JSON.stringify({ op: 2, d: { subscribe_to_id: id } }));
        clearInterval(hb);
        hb = window.setInterval(() => { if (ws?.readyState === 1) ws.send(JSON.stringify({ op: 3 })); }, interval);
        failures = 0; stopPolling();
      } else if (m.op === 0 && (m.t === 'INIT_STATE' || m.t === 'PRESENCE_UPDATE')) {
        const d = m.d as Presence | Record<string, Presence>;
        const p = 'discord_status' in d ? (d as Presence) : (d as Record<string, Presence>)[id];
        if (p) render(p);
      }
    });
    ws.addEventListener('close', () => { clearInterval(hb); fail(); });
    ws.addEventListener('error', () => { try { ws?.close(); } catch { /* noop */ } });
  }

  function fail() {
    failures++;
    if (document.hidden) return;
    if (failures >= 2) { void restRefresh(); startPolling(); }
    const delay = Math.min(30000, 1000 * 2 ** Math.min(failures, 5));
    clearTimeout(retry);
    retry = window.setTimeout(connect, delay);
  }

  function teardown() {
    clearInterval(hb); clearTimeout(retry); stopPolling(); stopProgress();
    if (ws) { ws.onclose = null; try { ws.close(); } catch { /* noop */ } ws = null; }
  }

  void restRefresh();
  startPolling();   // always poll as a safety net; the socket stops it once connected
  connect();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { teardown(); }
    else { failures = 0; void restRefresh(); startPolling(); connect(); }
  });
  window.addEventListener('pagehide', teardown);
}
