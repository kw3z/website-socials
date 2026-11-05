import { describe, expect, it } from 'vitest';
import { links } from '../src/data/links';
import { projects } from '../src/data/projects';

describe('data', () => {
  it('has unique link ids', () => {
    const ids = links.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('only uses https urls for link cards', () => {
    links.forEach((l) => { if (l.kind === 'link') expect(l.href.startsWith('https://')).toBe(true); });
  });
  it('has exactly one lead project', () => {
    expect(projects.filter((p) => p.variant === 'lead').length).toBe(1);
  });
});
