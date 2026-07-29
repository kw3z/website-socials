'use client';
import { useEffect, useRef, useState } from 'react';
import { useMousePosition } from '@/hooks/useMousePosition';

export default function CursorGlow() {
  const { position } = useMousePosition();
  const glowRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hoveredColor, setHoveredColor] = useState('#8b7ec8');
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const touch = 
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 || 
      window.matchMedia('(hover: none)').matches;
    setIsTouch(touch);
  }, []);

  useEffect(() => {
    if (!isTouch && (position.x !== 0 || position.y !== 0)) setVisible(true);
  }, [position, isTouch]);

  // Listen for custom events from social cards to change glow color
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setHoveredColor(e.detail.color || '#8b7ec8');
    };
    window.addEventListener('social-hover' as string, handler as EventListener);
    return () => window.removeEventListener('social-hover' as string, handler as EventListener);
  }, []);

  useEffect(() => {
    if (glowRef.current) {
      glowRef.current.style.transform = `translate(${position.x - 200}px, ${position.y - 200}px)`;
    }
    if (trailRef.current) {
      trailRef.current.style.transform = `translate(${position.x - 100}px, ${position.y - 100}px)`;
    }
  }, [position]);

  if (!visible || isTouch) return null;

  return (
    <>
      {/* Large ambient glow */}
      <div
        ref={glowRef}
        style={{
          position: 'fixed',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${hoveredColor}15 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 1,
          transition: 'background 0.5s ease',
          willChange: 'transform',
        }}
      />
      {/* Smaller bright core */}
      <div
        ref={trailRef}
        style={{
          position: 'fixed',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${hoveredColor}08 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 1,
          transition: 'background 0.5s ease, transform 0.15s ease-out',
          willChange: 'transform',
        }}
      />
    </>
  );
}
