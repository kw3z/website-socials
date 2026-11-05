export {};

const SELECTOR = '.card, .btn, .copy, [data-theme-choice]';

document.addEventListener('pointerdown', (e) => {
  const host = (e.target as Element).closest<HTMLElement>(SELECTOR);
  if (!host) return;

  host.classList.add('ripple-host');
  const rect = host.getBoundingClientRect();
  const dot = document.createElement('span');
  dot.className = 'ripple';
  dot.style.left = `${e.clientX - rect.left}px`;
  dot.style.top = `${e.clientY - rect.top}px`;
  host.appendChild(dot);
  dot.addEventListener('animationend', () => dot.remove(), { once: true });
}, { passive: true });
