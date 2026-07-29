'use client';
import { useState, useEffect, useCallback } from 'react';

const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'KeyB', 'KeyA',
];

export function useKonamiCode() {
  const [activated, setActivated] = useState(false);
  const [progress, setProgress] = useState(0);

  const reset = useCallback(() => {
    setActivated(false);
    setProgress(0);
    window.dispatchEvent(new CustomEvent('konami-reset'));
  }, []);

  useEffect(() => {
    let index = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const handler = (e: KeyboardEvent) => {
      if (activated) return;

      if (e.code === KONAMI_CODE[index]) {
        index++;
        const nextProgress = index / KONAMI_CODE.length;
        setProgress(nextProgress);
        window.dispatchEvent(new CustomEvent('konami-step', { detail: { index, progress: nextProgress } }));

        clearTimeout(timeout);
        timeout = setTimeout(() => {
          index = 0;
          setProgress(0);
          window.dispatchEvent(new CustomEvent('konami-step', { detail: { index: 0, progress: 0 } }));
        }, 3000);

        if (index === KONAMI_CODE.length) {
          setActivated(true);
          setProgress(1);
          window.dispatchEvent(new CustomEvent('konami-activated'));
          index = 0;
        }
      } else {
        index = 0;
        setProgress(0);
        window.dispatchEvent(new CustomEvent('konami-step', { detail: { index: 0, progress: 0 } }));
      }
    };

    const handleResetExternal = () => {
      setActivated(false);
      setProgress(0);
    };

    window.addEventListener('keydown', handler);
    window.addEventListener('konami-reset', handleResetExternal);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('konami-reset', handleResetExternal);
      clearTimeout(timeout);
    };
  }, [activated]);

  return { activated, progress, reset };
}
