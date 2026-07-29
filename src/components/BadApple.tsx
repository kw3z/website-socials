'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

import CopySectionLink from './CopySectionLink';

type Frame = {
  index: number;
  time: number;
  rows: string[];
};

type Meta = {
  frameRate: number;
  frameCount: number;
  chunkSize: number;
  chunkCount: number;
};

export default function BadApple() {
  const [playing, setPlaying] = useState(false); // start paused – waits for visibility
  const [frameIndex, setFrameIndex] = useState(0);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [chunks, setChunks] = useState<Record<number, Frame[]>>({});
  const [muted, setMuted] = useState(true); // Muted on initial play
  const [volume, setVolume] = useState(0.5);
  const [isVisible, setIsVisible] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [audioReady, setAudioReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const loadedChunks = useRef<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Track last played frameIndex so we can resume audio from correct position
  const lastFrameRef = useRef<number>(0);
  const wasPlayingBeforeHide = useRef(false);
  // Refs that mirror state – safe to read inside event-listener callbacks
  const playingRef = useRef(false);
  const metaRef = useRef<Meta | null>(null);

  // Load metadata
  useEffect(() => {
    fetch('/api/badapple/meta.json')
      .then(r => r.json())
      .then(setMeta)
      .catch(err => console.error('Failed to load metadata:', err));
  }, []);

  // Setup audio element
  useEffect(() => {
    const audio = new Audio('/api/badapple/BadApple-sound.mp3');
    audio.preload = 'auto';
    audio.volume = volume;
    audio.loop = false;

    audio.addEventListener('canplaythrough', () => setAudioReady(true));
    audio.addEventListener('error', (e) => console.warn('Audio load error:', e));

    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep refs in sync with state so event-listener callbacks never see stale values
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { metaRef.current = meta; }, [meta]);

  // Sync volume / mute
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // ── Autoplay-policy retry ────────────────────────────────────────────────
  // If the browser blocks audio autoplay, we listen globally for any valid user gesture
  // (click, mousedown, pointerdown, touchstart, keydown, wheel) and trigger play.
  // Once the audio starts playing successfully, we clean up the listeners.
  useEffect(() => {
    if (!playing) return;

    let cleanupListeners: (() => void) | null = null;

    const tryPlay = () => {
      const audio = audioRef.current;
      const m = metaRef.current;
      if (!audio || !m || !playingRef.current) return;

      const targetTime = lastFrameRef.current / m.frameRate;
      audio.currentTime = targetTime;
      
      audio.play()
        .then(() => {
          // Playback succeeded! Clean up listeners.
          if (cleanupListeners) {
            cleanupListeners();
            cleanupListeners = null;
          }
        })
        .catch((err) => {
          // Playback blocked, keep listeners active
          console.warn('Playback block info:', err);
        });
    };

    const handleUserGesture = () => {
      tryPlay();
    };

    const setupListeners = () => {
      window.addEventListener('click', handleUserGesture, true);
      window.addEventListener('mousedown', handleUserGesture, true);
      window.addEventListener('pointerdown', handleUserGesture, true);
      window.addEventListener('touchstart', handleUserGesture, true);
      window.addEventListener('keydown', handleUserGesture, true);
      window.addEventListener('wheel', handleUserGesture, true);

      cleanupListeners = () => {
        window.removeEventListener('click', handleUserGesture, true);
        window.removeEventListener('mousedown', handleUserGesture, true);
        window.removeEventListener('pointerdown', handleUserGesture, true);
        window.removeEventListener('touchstart', handleUserGesture, true);
        window.removeEventListener('keydown', handleUserGesture, true);
        window.removeEventListener('wheel', handleUserGesture, true);
      };
    };

    // Check if we can play right away
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      return;
    }

    setupListeners();
    tryPlay(); // Try immediately in case it is already unlocked

    return () => {
      if (cleanupListeners) {
        cleanupListeners();
      }
    };
  }, [playing]);
  // ────────────────────────────────────────────────────────────────────────

  // IntersectionObserver – play when ≥40% visible, pause when <40%
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.4;
        setIsVisible(visible);
      },
      { threshold: [0, 0.4, 1.0] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Page visibility – stop when tab is hidden, resume when shown
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasPlayingBeforeHide.current = playing;
        if (playing) setPlaying(false);
      } else {
        // Only resume if component is still on screen and it was playing
        if (wasPlayingBeforeHide.current && isVisible && !hasEnded) {
          setPlaying(true);
        }
        wasPlayingBeforeHide.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [playing, isVisible, hasEnded]);

  // Auto play/pause based on intersection visibility
  useEffect(() => {
    if (!meta) return;
    if (hasEnded) return;

    if (isVisible && !playing) {
      setPlaying(true);
    } else if (!isVisible && playing) {
      setPlaying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, meta, hasEnded]);

  // Wrap loadChunk in useCallback
  const loadChunk = useCallback(async (chunkIndex: number) => {
    if (chunkIndex < 0 || loadedChunks.current.has(chunkIndex)) return;
    if (meta && chunkIndex >= meta.chunkCount) return;
    loadedChunks.current.add(chunkIndex);

    try {
      const res = await fetch(`/api/badapple/chunk-${chunkIndex}.json`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} fetching chunk-${chunkIndex}.json`);
      }
      const data: Frame[] = await res.json();
      setChunks(prev => ({ ...prev, [chunkIndex]: data }));
    } catch (err) {
      console.error(`Failed to load chunk ${chunkIndex}:`, err);
      loadedChunks.current.delete(chunkIndex);
    }
  }, [meta]);

  // Compute active chunk positions
  const currentChunk = meta ? Math.floor(frameIndex / meta.chunkSize) : 0;
  const frameInChunk = meta ? frameIndex % meta.chunkSize : 0;

  // Manage chunk loading and preloading
  useEffect(() => {
    if (!meta) return;
    if (currentChunk >= 0 && currentChunk < meta.chunkCount) {
      loadChunk(currentChunk);
      if (frameInChunk > meta.chunkSize * 0.7) {
        const nextChunk = currentChunk + 1;
        if (nextChunk < meta.chunkCount) loadChunk(nextChunk);
      }
    }
  }, [currentChunk, frameInChunk, meta, loadChunk]);

  // Garbage-collect old chunks
  useEffect(() => {
    if (!meta) return;
    setChunks(prev => {
      const nextChunk = currentChunk + 1;
      const updated: Record<number, Frame[]> = {};
      let changed = false;
      for (const key of Object.keys(prev)) {
        const index = Number(key);
        if (index === currentChunk || index === nextChunk) {
          updated[index] = prev[index];
        } else {
          loadedChunks.current.delete(index);
          changed = true;
        }
      }
      return changed ? updated : prev;
    });
  }, [currentChunk, meta]);

  // When audio becomes ready while already playing, start it immediately
  useEffect(() => {
    if (!playing || !meta || !audioRef.current) return;
    const audio = audioRef.current;
    const targetTime = lastFrameRef.current / meta.frameRate;
    if (Math.abs(audio.currentTime - targetTime) > 0.25) {
      audio.currentTime = targetTime;
    }
    audio.play().catch(() => {/* autoplay blocked */});
  }, [audioReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // requestAnimationFrame playback + audio sync
  useEffect(() => {
    if (!playing || !meta) return;

    // Sync audio position to current frame
    const targetTime = frameIndex / meta.frameRate;
    if (audioRef.current) {
      const audio = audioRef.current;
      // Only seek if significantly out of sync (>0.25s)
      if (Math.abs(audio.currentTime - targetTime) > 0.25) {
        audio.currentTime = targetTime;
      }
      audio.play().catch(() => {/* autoplay blocked – user can unmute */});
    }

    startTimeRef.current = performance.now() - (frameIndex / meta.frameRate) * 1000;

    const animate = (now: number) => {
      if (!startTimeRef.current) return;
      const elapsed = (now - startTimeRef.current) / 1000;
      const nextFrame = Math.floor(elapsed * meta.frameRate);

      if (nextFrame >= meta.frameCount) {
        setPlaying(false);
        setHasEnded(true);
        if (audioRef.current) audioRef.current.pause();
        return;
      }

      lastFrameRef.current = nextFrame;
      setFrameIndex(nextFrame);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, [playing, meta]); // eslint-disable-line react-hooks/exhaustive-deps

  // Manual toggle handler
  const handleToggle = () => {
    if (hasEnded) {
      // Restart
      setFrameIndex(0);
      setHasEnded(false);
      setPlaying(true);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    } else {
      setPlaying(p => !p);
    }
  };

  const currentFrame = chunks[currentChunk]?.[frameInChunk];
  const progress = meta ? (frameIndex / meta.frameCount) * 100 : 0;

  return (
    <motion.div
      ref={containerRef}
      id="badapple"
      className="bad-apple-container"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2.0, duration: 0.6 }}
    >
      {/* Terminal Header */}
      <div className="bad-apple-header">
        <div className="terminal-dots">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
        </div>
        <span className="bad-apple-title">
          <b>RULE 86:</b> if it exists, you can play Bad Apple on it.
        </span>
        <CopySectionLink sectionId="badapple" />

        {/* Volume control */}
        <div className="bad-apple-volume">
          <button
            className="bad-apple-mute-btn"
            onClick={() => setMuted(m => !m)}
            title={muted ? 'Unmute' : 'Mute'}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '28px', 
              height: '28px', 
              padding: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#ffffff'
            }}
          >
            {muted ? (
              /* Pixel Art Muted Icon (White Speaker + Red Cross Overlay for high visibility) */
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
                {/* Speaker Box */}
                <rect x="1" y="6" width="3" height="4" fill="#ffffff" />
                {/* Speaker Cone */}
                <path d="M4 6h1v-1h1v-1h1v8h-1v-1h-1v-1h-1v-4z" fill="#ffffff" />
                {/* Visual Red Cross for Muted Alert */}
                <path d="M10 5l1-1 2 2 2-2 1 1-2 2 2 2-1 1-2-2-2 2-1-1 2-2-2-2z" fill="#ff4a4a" />
              </svg>
            ) : (
              /* Pixel Art Speaker Active Icon (White Speaker + White Wave Lines) */
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
                {/* Speaker Box */}
                <rect x="1" y="6" width="3" height="4" fill="#ffffff" />
                {/* Speaker Cone */}
                <path d="M4 6h1v-1h1v-1h1v8h-1v-1h-1v-1h-1v-4z" fill="#ffffff" />
                {/* Sound Waves (Volume Dependent) */}
                {volume >= 0.1 && (
                  /* Small Wave */
                  <path d="M9 5h1v1h1v4h-1v1h-1V5z" fill="#ffffff" />
                )}
                {volume >= 0.6 && (
                  /* Large Wave */
                  <path d="M12 3h1v1h1v8h-1v1h-1V3z" fill="#ffffff" />
                )}
              </svg>
            )}
          </button>
          <input
            type="range"
            className="bad-apple-vol-slider"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={e => {
              const v = parseFloat(e.target.value);
              setVolume(v);
              if (v > 0 && muted) setMuted(false);
              if (v === 0) setMuted(true);
            }}
            aria-label="Volume"
          />
        </div>

        <button
          className="bad-apple-toggle"
          onClick={handleToggle}
          title={hasEnded ? 'Restart' : playing ? 'Pause' : 'Play'}
          aria-label={hasEnded ? 'Restart Bad Apple' : playing ? 'Pause Bad Apple' : 'Play Bad Apple'}
        >
          {hasEnded ? '↺' : playing ? '⏸' : '▶'}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="bad-apple-progress-track">
        <div
          className="bad-apple-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Screen */}
      <div className="bad-apple-screen">
        <div className="scanlines" />

        {/* Visibility overlay */}
        {!isVisible && !hasEnded && meta && (
          <div className="bad-apple-pause-overlay">
            <span className="pause-overlay-icon">⏸</span>
            <span className="pause-overlay-text">Scroll into view to play</span>
          </div>
        )}

        {hasEnded && (
          <div className="bad-apple-pause-overlay bad-apple-ended-overlay">
            <span className="pause-overlay-icon">↺</span>
            <span className="pause-overlay-text">Click ↺ to replay (top-right)</span>
          </div>
        )}

        <pre className="bad-apple-ascii">
          {currentFrame ? currentFrame.rows.join('\n') : 'Loading Bad Apple...'}
        </pre>
      </div>

      {/* Footer bar */}
      <div className="bad-apple-footer-bar">
        <span className="bad-apple-frame-counter">
          {meta ? `frame ${frameIndex}/${meta.frameCount}` : 'loading...'}
        </span>
        <span className="bad-apple-visibility-tag">
          {isVisible
            ? (playing ? '● PLAYING' : '⏸ PAUSED')
            : '◌ OUT OF VIEW'}
        </span>
      </div>
    </motion.div>
  );
}