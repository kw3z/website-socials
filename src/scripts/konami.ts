export { };

const SEQ = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
const note = document.getElementById('konami');
const closeBtn = document.getElementById('konami-close');
const mark = document.getElementById('egg-mark');

let buf: string[] = [], reset: number | undefined, hide: number | undefined, shown = false;

try { if (localStorage.getItem('quesz.egg') === 'found' && mark) mark.hidden = false; } catch { /* noop */ }

function dismiss() {
  if (!note) return;
  note.removeAttribute('data-show');
  clearTimeout(hide);
  window.setTimeout(() => { note.hidden = true; }, 440);
}
function armTimer() { clearTimeout(hide); hide = window.setTimeout(dismiss, 8000); }

// Existing easter egg note (kept as-is)
function reveal() {
  if (shown || !note) return;
  shown = true;
  note.hidden = false;
  requestAnimationFrame(() => note.setAttribute('data-show', 'true'));
  if (mark) mark.hidden = false;
  try { localStorage.setItem('quesz.egg', 'found'); } catch { /* noop */ }
  armTimer();
}

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  const t = e.target as HTMLElement | null;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  if (e.key === 'Escape' && note && !note.hidden) { dismiss(); return; }
  buf.push(e.key.toLowerCase());
  if (buf.length > SEQ.length) buf.shift();
  clearTimeout(reset); reset = window.setTimeout(() => { buf = []; }, 2000);
  if (buf.length === SEQ.length && buf.every((k, i) => k === SEQ[i])) {
    buf = [];
    reveal();
  }
  // never preventDefault: arrow keys must keep scrolling
});

closeBtn?.addEventListener('click', dismiss);
// Auto-dismiss pauses while hovered or focused (WCAG 2.2.1)
note?.addEventListener('mouseenter', () => clearTimeout(hide));
note?.addEventListener('mouseleave', () => { if (!note.hidden) armTimer(); });
note?.addEventListener('focusin', () => clearTimeout(hide));
note?.addEventListener('focusout', () => { if (!note.hidden) armTimer(); });

console.log('[konami] ready');
