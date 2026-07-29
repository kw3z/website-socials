'use client';
import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SocialIcon from './SocialIcon';
import AniListStats from './AniListStats';
import GitHubGraph from './GitHubGraph';
import type { Social } from '@/data/socials';

interface SocialCardProps {
  social: Social;
  index: number;
  initialCount?: number;
  onIncrement?: (id: string, newCount: number) => void;
}

export default function SocialCard({ social, index, initialCount = 0, onIncrement }: SocialCardProps) {
  const cardRef = useRef<HTMLAnchorElement & HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const [clickCount, setClickCount] = useState<number>(initialCount);

  // Sync when parent loads fresh counts from the API
  useEffect(() => {
    setClickCount(initialCount);
  }, [initialCount]);

  const incrementClick = async () => {
    // Optimistic update
    const optimistic = clickCount + 1;
    setClickCount(optimistic);
    onIncrement?.(social.id, optimistic);

    try {
      const res = await fetch(`/api/clicks/${social.id}`, { method: 'POST' });
      if (res.ok) {
        const { count } = await res.json();
        setClickCount(count);
        onIncrement?.(social.id, count);
      }
    } catch {
      // Keep the optimistic count on network failure
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({
      x: (y - 0.5) * -8,
      y: (x - 0.5) * 8,
    });

    // Emit color event for cursor glow
    window.dispatchEvent(new CustomEvent('social-hover', { detail: { color: social.color } }));
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    window.dispatchEvent(new CustomEvent('social-hover', { detail: { color: '#8b7ec8' } }));
  };

  const handleCopy = async () => {
    if (social.copyValue) {
      await navigator.clipboard.writeText(social.copyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    incrementClick();

    if (social.type === 'copy') {
      e.preventDefault();
      handleCopy();
    }

    // Ripple effect
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'card-ripple';
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;
    cardRef.current.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  // For TMTBL, we avoid making the whole card a single anchor link so buttons can work
  const isTMTBL = social.id === 'tmtbl';
  const isCustomInteractive = isTMTBL || social.type === 'copy';
  const Tag = social.url && !isCustomInteractive ? 'a' : 'div';

  const linkProps = social.url && !isCustomInteractive ? {
    href: social.url,
    target: '_blank' as const,
    rel: 'noopener noreferrer' as const,
  } : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        delay: index * 0.04,
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="card-motion-wrapper"
    >
      <Tag
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={cardRef as any}
        className={`social-card card-type-${social.id}`}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          '--card-color': social.color,
        } as React.CSSProperties}
        {...linkProps}
      >
        <div className="card-glow" style={{ background: `radial-gradient(circle at 50% 50%, ${social.color}20, transparent 70%)` }} />
        <div className="card-border" />

        {/* Click Counter Badge */}
        <div className="click-counter-badge" title="Number of clicks">
          <span className="counter-icon">🔗</span>
          <span className="counter-val">{clickCount}</span>
        </div>

        {/* Header Section */}
        <div className="card-header-bar">
          <div className="card-icon" style={{ color: social.color }}>
            <SocialIcon name={social.icon} size={26} color={social.color} />
          </div>

          <div className="card-content">
            <span className="card-platform">{social.label}</span>
            <span className="card-username">
              {copied ? '✓ Copied!' : (social.username || social.description)}
            </span>
          </div>

          {social.type === 'copy' && (
            <div className="card-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          )}

          {social.url && social.type === 'link' && !isTMTBL && (
            <div className="card-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>

        {/* Rich Embedded Integrations */}

        {/* AniList Stats */}
        {social.id === 'anilist' && (
          <div className="card-embed-wrapper">
            <AniListStats />
          </div>
        )}

        {/* Discord Lanyard Presence */}
        {social.id === 'discord' && (
          <div className="card-embed-wrapper discord-lanyard-wrapper">
            <img
              src="https://lanyard.cnrad.dev/api/814381905402134558"
              alt="Discord Lanyard Status"
              className="lanyard-image"
              loading="lazy"
            />
          </div>
        )}

        {/* GitHub Contribution Graph */}
        {social.id === 'github' && (
          <div className="card-embed-wrapper github-embed-wrapper">
            <GitHubGraph />
          </div>
        )}

        {/* Spotify Data Card */}
        {social.id === 'spotify' && (
          <div className="card-embed-wrapper spotify-embed-wrapper">
            <div className="spotify-card-link">
              <img
                src="https://data-card-for-spotify.herokuapp.com/api/card?user_id=4diwpv251hrzy9bhwyi7ru1wx"
                alt="Data Card for Spotify"
                className="spotify-card-img"
                loading="lazy"
                onError={(e) => {
                  // Fallback styling if heroku app takes a moment
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        )}

        {/* TMTBL Dual Buttons */}
        {social.id === 'tmtbl' && (
          <div className="tmtbl-actions-wrapper">
            <a
              href="https://tmtbl.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="tmtbl-btn btn-live"
              onClick={(e) => {
                e.stopPropagation();
                incrementClick();
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <polygon points="10,8 16,12 10,16" fill="currentColor" />
              </svg>
              Live Build
            </a>
            <a
              href="https://github.com/kw3z/TMTBL"
              target="_blank"
              rel="noopener noreferrer"
              className="tmtbl-btn btn-repo"
              onClick={(e) => {
                e.stopPropagation();
                incrementClick();
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fill="currentColor" />
              </svg>
              GitHub Repo
            </a>
          </div>
        )}
      </Tag>
    </motion.div>
  );
}
