// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Local (npm run dev) rulează la rădăcină; build-ul pentru Pages setează GH_PAGES=1.
// TODO(real): la domeniul clientei, `site` devine domeniul ei și `base` se scoate.
const pages = process.env.GH_PAGES === '1';

export default defineConfig({
  site: pages ? 'https://demo.mrwebsites.ro' : undefined,
  base: pages ? '/foto-cadouri-demo' : undefined,
  integrations: [react()],
  devToolbar: { enabled: false },
  vite: { plugins: [tailwindcss()] },
});
