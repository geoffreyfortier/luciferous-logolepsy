import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/ll/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'glossary.json', 'll-192x192.png', 'll-512x512.png'],
      manifest: {
        name: 'Luciferous Logolepsy PWA',
        short_name: 'Luciferous Logolepsy',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4db6ac',
        lang: 'en',
        icons: [
          { src: 'll-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'll-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /glossary\.json$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'glossary-cache',
              expiration: { maxEntries: 1, maxAgeSeconds: 86400 }
            }
          }
        ]
      }
    })
  ]
});
