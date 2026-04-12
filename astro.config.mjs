import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: process.env.DEPLOY_TARGET === 'ghpages'
    ? 'https://aguywithcode.github.io'
    : 'https://juneteenthconf.com',
  base: process.env.DEPLOY_TARGET === 'ghpages' ? '/juneteenthconf-rc1' : '/',
  output: 'static',
  integrations: [
    tailwind(),
    sitemap(),
  ],
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
});
