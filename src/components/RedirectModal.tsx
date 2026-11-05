'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NEW_SITE_URL = 'https://quesz.pages.dev';

const subscribe = () => () => {};

export default function RedirectModal() {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const [dismissed, setDismissed] = useState(false);

  const isAlreadyOnNewSite =
    typeof window !== 'undefined' && window.location.hostname === 'quesz.pages.dev';

  const isOpen = isClient && !isAlreadyOnNewSite && !dismissed;

  // Handle ESC key press to continue / close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDismissed(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleContinue = () => {
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="redirect-modal-overlay-container">
          <motion.div
            className="redirect-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleContinue}
          />

          <motion.div
            className="redirect-modal-card"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="redirect-modal-title"
          >
            {/* Header & Close Button */}
            <div className="redirect-modal-header">
              <div className="redirect-modal-title-group">
                <span className="redirect-modal-icon">🚀</span>
                <h3 id="redirect-modal-title" className="redirect-modal-title">
                  New Site Available
                </h3>
              </div>
              <button
                type="button"
                onClick={handleContinue}
                className="redirect-modal-close-btn"
                aria-label="Close modal and continue"
              >
                ✕
              </button>
            </div>

            {/* Content / Info */}
            <div className="redirect-modal-content">
              <p className="redirect-modal-desc">
                We have moved! Check out the new version of the site at:
              </p>

              <a
                href={NEW_SITE_URL}
                className="redirect-modal-url-badge"
                title="Open quesz.pages.dev"
              >
                <span className="redirect-domain-icon">🌐</span>
                <span className="redirect-domain-text">quesz.pages.dev</span>
                <span className="redirect-domain-arrow">↗</span>
              </a>
            </div>

            {/* Actions: Go to new site OR Continue */}
            <div className="redirect-modal-actions">
              <a
                href={NEW_SITE_URL}
                className="redirect-action-btn redirect-primary-btn"
              >
                <span>Go to new site</span>
                <span className="btn-arrow">↗</span>
              </a>

              <button
                type="button"
                onClick={handleContinue}
                className="redirect-action-btn redirect-secondary-btn"
              >
                <span>Continue</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
