import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import UnoCSS from 'unocss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    UnoCSS(),
    solid(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Roastee PWA Experiment',
        short_name: 'Roastee',
        start_url: '/',
        display: 'standalone',
        background_color: '#1a1a1a',
        theme_color: '#1a1a1a',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  build: {
    minify: 'esbuild',
    target: 'esnext',
  },
});
