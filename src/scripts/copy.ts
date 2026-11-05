export {};

const toast = document.getElementById('toast');
let toastTimer: number | undefined;

function showToast(msg: string) {
  if (!toast) return;
  toast.textContent = msg;
  toast.hidden = false;
  requestAnimationFrame(() => toast.setAttribute('data-show', 'true'));
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.removeAttribute('data-show');
    window.setTimeout(() => { toast.hidden = true; }, 260);
  }, 2400);
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts / older browsers
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

document.addEventListener('click', async (e) => {
  const el = (e.target as Element).closest<HTMLElement>('[data-copy]');
  if (!el) return;
  const value = el.dataset.copy ?? '';
  const ok = await copyText(value);
  if (ok) {
    el.setAttribute('data-copied', 'true');
    showToast(`Copied ${value}`);
    window.setTimeout(() => el.removeAttribute('data-copied'), 1600);
  } else {
    showToast('Copy blocked: select the text and press Ctrl/⌘ + C');
  }
});
