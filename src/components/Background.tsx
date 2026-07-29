'use client';
import { useEffect, useRef } from 'react';
import { useMousePosition } from '@/hooks/useMousePosition';

const ASCII_CHARS = '.:;+*=#%@░▒▓0189ABCDEFGHJKLMNPQRSTUVWXYZ';

interface GridCell {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  char: string;
  charIndex: number;
  speed: number;
  phase: number;
}

export default function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { position, normalized } = useMousePosition();
  const mouseRef = useRef({ x: -1000, y: -1000, nx: 0.5, ny: 0.5 });
  const gridRef = useRef<GridCell[]>([]);
  const animFrameRef = useRef<number>(0);
  const isTouchRef = useRef<boolean>(false);

  useEffect(() => {
    // Detect mobile / touch device
    isTouchRef.current = 
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 || 
      window.matchMedia('(hover: none)').matches || 
      window.innerWidth < 768;

    mouseRef.current = { x: position.x, y: position.y, nx: normalized.x, ny: normalized.y };
  }, [position, normalized]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Optimized grid spacing for high FPS
    const fontSize = 13;
    const cellWidth = 14;
    const cellHeight = 18;

    const buildGrid = (width: number, height: number) => {
      const cols = Math.ceil(width / cellWidth) + 1;
      const rows = Math.ceil(height / cellHeight) + 1;
      const grid: GridCell[] = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const baseX = c * cellWidth;
          const baseY = r * cellHeight;
          const charIdx = Math.floor(Math.random() * ASCII_CHARS.length);
          grid.push({
            x: baseX,
            y: baseY,
            baseX,
            baseY,
            char: ASCII_CHARS[charIdx],
            charIndex: charIdx,
            speed: Math.random() * 0.02 + 0.005,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
      return grid;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // Cap DPR at 1.5 for performance
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      gridRef.current = buildGrid(window.innerWidth, window.innerHeight);
    };

    resize();
    window.addEventListener('resize', resize);

    let lastFrameTime = 0;
    let time = 0;

    const animate = (timestamp: number) => {
      // Throttle render loop to ~30 FPS to prevent high CPU/GPU load
      if (timestamp - lastFrameTime < 32) {
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = timestamp;
      time += 0.04;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const mouse = mouseRef.current;
      const isTouch = isTouchRef.current;

      ctx.clearRect(0, 0, width, height);

      // Deep theme background
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px 'JetBrains Mono', 'Monocraft', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const voidRadius = 85;       // Cursor void radius
      const glowRadius = 250;      // Cursor glow radius

      const grid = gridRef.current;
      for (let i = 0; i < grid.length; i++) {
        const cell = grid[i];

        // Random character flicker (low frequency)
        if (Math.random() < 0.003) {
          cell.charIndex = (cell.charIndex + 1) % ASCII_CHARS.length;
          cell.char = ASCII_CHARS[cell.charIndex];
        }

        let renderX = cell.baseX;
        let renderY = cell.baseY;

        // Base theme colors: Slate lavender (#3d3956)
        let opacity = 0.22 + Math.sin(time * cell.speed * 15 + cell.phase) * 0.08;
        let r = 61;
        let g = 57;
        let b = 86;

        // Interactive cursor logic (Only enabled on desktop/non-touch)
        if (!isTouch) {
          const dx = cell.baseX - mouse.x;
          const dy = cell.baseY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < glowRadius) {
            const glowFactor = 1 - dist / glowRadius;
            
            // Site Theme Glow Colors: Transitions from slate purple to vibrant site lavender (#8b7ec8) and teal (#4ecdc4)
            r = Math.floor(61 + glowFactor * (139 - 61));
            g = Math.floor(57 + glowFactor * (126 - 57));
            b = Math.floor(86 + glowFactor * (200 - 86));
            
            opacity = Math.min(0.9, opacity + glowFactor * 0.65);

            // Cursor repulsion & empty area void effect
            if (dist < voidRadius && dist > 0) {
              const pushFactor = Math.pow(1 - dist / voidRadius, 1.8);
              const angle = Math.atan2(dy, dx);
              const pushDist = pushFactor * 38;

              renderX = cell.baseX + Math.cos(angle) * pushDist;
              renderY = cell.baseY + Math.sin(angle) * pushDist;

              // Clean cutout center void
              if (dist < voidRadius * 0.45) {
                opacity *= Math.pow(dist / (voidRadius * 0.45), 2.2);
              }
            }
          }
        }

        // Render cell
        if (opacity > 0.01) {
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.globalAlpha = opacity;
          ctx.fillText(cell.char, renderX, renderY);
        }
      }

      ctx.globalAlpha = 1.0;
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      {/* Subtle vignette for extra depth */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.15,
          backgroundImage: `radial-gradient(circle at 50% 50%, transparent 60%, #000000 100%)`,
        }}
      />
    </>
  );
}
