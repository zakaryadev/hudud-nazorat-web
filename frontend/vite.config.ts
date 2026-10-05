import { readFileSync } from 'node:fs';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const target = process.env.VITE_BACKEND || 'http://localhost:3000';

// <meta name="theme-color"> brend rangidan (npm run theme -> src/theme.meta.json)
function themeColor(): Plugin {
  const meta = JSON.parse(readFileSync(new URL('./src/theme.meta.json', import.meta.url), 'utf8'));
  return {
    name: 'brand-theme-color',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { name: 'theme-color', content: meta.light, media: '(prefers-color-scheme: light)' }, injectTo: 'head' },
      { tag: 'meta', attrs: { name: 'theme-color', content: meta.dark, media: '(prefers-color-scheme: dark)' }, injectTo: 'head' },
    ],
  };
}

export default defineConfig({
  plugins: [
    react(),
    themeColor(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // public/manifest.webmanifest (npm run theme yaratadi)
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // API va yuklangan rasmlar hech qachon keshlanmaydi
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: { '/api': target, '/uploads': target },
  },
});
