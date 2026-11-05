import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://quesz.pages.dev',
  build: { inlineStylesheets: 'auto' },
  compressHTML: true,
});
