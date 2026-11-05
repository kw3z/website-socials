export {};

type Choice = 'light' | 'dark' | 'terminal' | 'pixel';
const root = document.documentElement;
const buttons = document.querySelectorAll<HTMLButtonElement>('[data-theme-choice]');

function current(): Choice {
  try {
    const v = localStorage.getItem('quesz.theme');
    if (v === 'light' || v === 'dark' || v === 'terminal' || v === 'pixel') return v;
  } catch { /* use the OS theme */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function apply(choice: Choice) {
  const run = () => {
    if (choice === 'terminal' || choice === 'pixel') {
      root.dataset.mode = choice;
    } else {
      delete root.dataset.mode;
      root.dataset.theme = choice;
    }
  };
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (doc.startViewTransition) doc.startViewTransition(run);
  else run();
  try {
    localStorage.setItem('quesz.theme', choice);
  } catch { /* storage unavailable */ }
  buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.themeChoice === choice)));
}

buttons.forEach((b) => b.addEventListener('click', () => apply(b.dataset.themeChoice as Choice)));
buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.themeChoice === current())));
