'use client';

import { useState } from 'react';

interface CopySectionLinkProps {
  sectionId: string;
  label?: string;
}

export default function CopySectionLink({ sectionId, label }: CopySectionLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `https://quesz.vercel.app/#${sectionId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy section link:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`section-copy-btn ${copied ? 'copied' : ''}`}
      title={copied ? 'Copied link!' : `Copy link to #${sectionId}`}
      aria-label={`Copy link to #${sectionId}`}
    >
      <span className="section-copy-icon">{copied ? '✓' : '🔗'}</span>
      <span className="section-copy-label">{copied ? 'Copied!' : label || `#${sectionId}`}</span>
    </button>
  );
}
