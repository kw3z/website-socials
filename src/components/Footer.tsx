'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_OPTIONS = [
  'Bad Apple @ 24 frames',
  'idle',
  'Last Updated: Oct 26',
  'hi.',
  'DM me on discord',
  'ohayo'
];

const KONAMI_KEYS = [
  { label: '↑', code: 'ArrowUp' },
  { label: '↑', code: 'ArrowUp' },
  { label: '↓', code: 'ArrowDown' },
  { label: '↓', code: 'ArrowDown' },
  { label: '←', code: 'ArrowLeft' },
  { label: '→', code: 'ArrowRight' },
  { label: '←', code: 'ArrowLeft' },
  { label: '→', code: 'ArrowRight' },
  { label: 'B', code: 'KeyB' },
  { label: 'A', code: 'KeyA' },
];

export default function Footer() {
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);
  const [localTime, setLocalTime] = useState('');
  const [konamiProgressIndex, setKonamiProgressIndex] = useState(0);

  // Cycle status message randomly on click
  const cycleStatus = () => {
    let nextStatus;
    do {
      nextStatus = STATUS_OPTIONS[Math.floor(Math.random() * STATUS_OPTIONS.length)];
    } while (nextStatus === status);
    setStatus(nextStatus);
  };

  // Live IST local clock
  useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      const formatter = new Intl.DateTimeFormat('en-US', options);
      setLocalTime(formatter.format(new Date()));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen to Konami code inputs from useKonamiCode
  useEffect(() => {
    const handleStep = (e: Event) => {
      const customEvent = e as CustomEvent<{ index: number }>;
      setKonamiProgressIndex(customEvent.detail.index);
    };

    const handleReset = () => {
      setKonamiProgressIndex(0);
    };

    window.addEventListener('konami-step', handleStep);
    window.addEventListener('konami-reset', handleReset);
    window.addEventListener('konami-activated', handleReset);

    return () => {
      window.removeEventListener('konami-step', handleStep);
      window.removeEventListener('konami-reset', handleReset);
      window.removeEventListener('konami-activated', handleReset);
    };
  }, []);

  const [isScrolling, setIsScrolling] = useState(false);

  // Programmatic, ultra-smooth custom scroll-to-top
  const scrollToTop = () => {
    if (isScrolling) return;
    setIsScrolling(true);

    const start = window.scrollY || window.pageYOffset;
    const startTime = performance.now();
    const duration = 750; // ms

    // Easing function: Ease Out Cubic
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeOutCubic(progress);

      window.scrollTo(0, start * (1 - ease));

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        setIsScrolling(false);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  return (
    <motion.footer
      className="footer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2.2, duration: 0.8 }}
    >
      <div className="footer-divider" />

      <div className="footer-grid">
        {/* Left Column: Made with Love */}
        <div className="footer-col footer-col-left">
          <p className="footer-text">
            Made with <span className="footer-heart">♥</span> by <span className="author-name">Quesz</span>
          </p>
          <div className="local-time-widget" title="Quesz's local time (IST)">
            <span className="time-icon">🕒</span>
            <span className="time-val">{localTime || '00:00:00 AM'}</span>
            <span className="time-zone">IST</span>
          </div>
        </div>

        {/* Center Column: Status Bubble */}
        <div className="footer-col footer-col-center">
          <div className="status-bubble" onClick={cycleStatus} title="Click to cycle status!">
            <span className="status-indicator-dot" />
            <span className="status-bubble-text">{status}</span>
          </div>
        </div>

        {/* Right Column: Scroll to Top / Shortcuts */}
        <div className="footer-col footer-col-right">
          <button className="scroll-top-btn" onClick={scrollToTop} title="Scroll to Top">
            <motion.span
              className="arrow-icon"
              style={{ display: 'inline-block', marginRight: '6px' }}
              animate={isScrolling ? {
                y: -6,
                scale: 1.25,
              } : { y: 0 }}
              whileHover={{ y: -3, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              ▲
            </motion.span>Scroll to Top
          </button>
        </div>
      </div>

      {/* Konami Code Progress Guide */}
      <div className="konami-guide-container">
        <span className="konami-guide-label">Konami Code:</span>
        <div className="konami-keys-list">
          {KONAMI_KEYS.map((key, i) => (
            <span
              key={i}
              className={`konami-key-badge ${i < konamiProgressIndex ? 'active' : ''}`}
            >
              {key.label}
            </span>
          ))}
        </div>
      </div>
    </motion.footer>
  );
}
