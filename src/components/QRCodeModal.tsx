'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QRCodeModal({ isOpen, onClose }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const profileUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? window.location.href
    : 'https://quesz.vercel.app';
  const modalRef = useRef<HTMLDivElement>(null);

  // Generate high-resolution themed QR Code
  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(profileUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#8b7ec8',
          light: '#0f0f18',
        },
        errorCorrectionLevel: 'H',
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code:', err));
    }
  }, [isOpen, profileUrl]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const downloadQRCode = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = 'quesz-profile-qr.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="qr-modal-overlay-container">
          <motion.div
            className="qr-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            ref={modalRef}
            className="qr-modal-card"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-modal-title"
          >
            {/* Header & Close Button */}
            <div className="qr-modal-header">
              <div className="qr-modal-title-group">
                <span className="qr-modal-icon"></span>
                <h3 id="qr-modal-title" className="qr-modal-title">Share Profile</h3>
              </div>
              <button
                onClick={onClose}
                className="qr-modal-close-btn"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* QR Canvas / Image Preview */}
            <div className="qr-code-wrapper">
              {qrDataUrl ? (
                <div className="qr-image-frame">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="Quesz Profile QR Code"
                    className="qr-image"
                  />
                  <div className="qr-glow-effect" />
                </div>
              ) : (
                <div className="qr-placeholder">
                  <span className="qr-spinner" />
                </div>
              )}
              <p className="qr-subtext">Scan to open the site on mobile</p>
            </div>

            {/* Actions */}
            <div className="qr-modal-actions">
              <button
                onClick={copyToClipboard}
                className={`qr-action-btn copy-btn ${copied ? 'copied' : ''}`}
              >
                <span className="btn-icon">{copied ? '✓' : '📋'}</span>
                <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
              </button>

              <button
                onClick={downloadQRCode}
                className="qr-action-btn download-btn"
                disabled={!qrDataUrl}
              >
                <span className="btn-icon">💾</span>
                <span>Download QR</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
