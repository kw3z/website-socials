'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import QRCodeModal from './QRCodeModal';

const QUESZ_ASCII = [
  "  █████╗  ██╗   ██╗ ███████╗ ███████╗ ███████╗",
  "██╔═══██╗ ██║   ██║ ██╔════╝ ██╔════╝ ╚══███╔╝",
  "██║   ██║ ██║   ██║ █████╗   ███████╗   ███╔╝ ",
  "██║▄▄ ██║ ██║   ██║ ██╔══╝   ╚════██║  ███╔╝  ",
  "╚██████╔╝ ╚██████╔╝ ███████╗ ███████║ ███████╗",
  " ╚══▀▀═╝   ╚═════╝  ╚══════╝ ╚══════╝ ╚══════╝"
];

export default function Avatar() {
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="avatar-container"
      >
        <motion.div
          className="avatar-wrapper"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{ scale: 1.05 }}
        >
          <div className="avatar-ring">
            <Image
              src="/avatar.jpg"
              alt="Quesz Avatar"
              width={140}
              height={140}
              className="avatar-image"
              priority
            />
          </div>
          <div className="avatar-shadow" />
        </motion.div>

        {/* Block Ramp ASCII Art Name */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="hero-ascii-container"
        >
          <pre className="hero-ascii-banner" aria-label="Quesz">
            {QUESZ_ASCII.join('\n')}
          </pre>
          <span className="sr-only">Quesz</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <p className="hero-tagline">Linux ⁎ Anime ⁎ Games ⁎ Pixel Art</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="hero-badges-wrapper"
        >
          <div className="status-badge">
            <span className="status-text">aka Baka</span>
            <span className="status-dot" />
            <span className="status-text">he/him</span>
          </div>

          <button
            onClick={() => setIsQRModalOpen(true)}
            className="qr-trigger-btn"
            title="Open Profile QR Code"
            aria-label="Open Profile QR Code"
          >
            <span className="qr-trigger-text">QR Code</span>
          </button>
        </motion.div>
      </motion.div>

      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />
    </>
  );
}
