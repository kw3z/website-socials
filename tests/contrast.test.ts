import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/tokens.css', 'utf8');

function block(selector: string): Record<string, string> {
  const m = css.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`));
  const out: Record<string, string> = {};
  (m?.[1] ?? '').replace(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/g, (_match: string, key: string, value: string) => (out[key] = value, ''));
  return out;
}
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
};
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
};

const pairs: [string, string, number][] = [
  ['--text', '--bg', 4.5], ['--text', '--surface', 4.5],
  ['--text-muted', '--bg', 4.5], ['--text-muted', '--surface', 4.5],
  ['--accent', '--bg', 4.5], ['--accent', '--surface', 4.5],
  ['--on-accent', '--accent', 4.5], ['--on-accent', '--accent-hover', 4.5],
  ['--accent', '--accent-subtle', 4.5], ['--text', '--accent-subtle', 4.5],
  ['--text-coat', '--bg', 4.5], ['--text-coat', '--surface', 4.5],
  ['--status-soon', '--surface', 4.5], ['--focus-ring', '--bg', 3],
  ['--status-online', '--surface', 3], ['--status-idle', '--surface', 3], ['--status-dnd', '--surface', 3],
  ['--text-muted', '--surface-sunken', 4.5],
];

for (const [name, selector] of [['light', ':root'], ['dark', ":root[data-theme='dark']"]] as const) {
  const t = { ...block(':root'), ...(name === 'dark' ? block(selector) : {}) };
  describe(`contrast (${name})`, () => {
    for (const [fg, bg, min] of pairs) {
      it(`${fg} on ${bg} >= ${min}`, () => {
        expect(ratio(t[fg]!, t[bg]!)).toBeGreaterThanOrEqual(min);
      });
    }
  });
}
