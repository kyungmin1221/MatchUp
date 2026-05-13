import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon_180.png', 'icon_192.png'],
      manifest: {
        name: 'MatchUp',
        short_name: 'MatchUp',
        description: '친구들과 풋살/축구 모임을 한 곳에서 관리',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'ko',
        categories: ['sports', 'social', 'lifestyle'],
        icons: [
          { src: '/icon_192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon_192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        navigateFallbackDenylist: [/^\/api/],
        // 새 빌드 감지 시 즉시 활성화 + 모든 탭 즉시 새 SW 가 제어 + 옛 캐시 청소
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // HTML 페이지(SPA 네비게이션) → NetworkFirst.
            // 새 빌드가 배포되면 SW 업데이트를 기다리지 않고 다음 페이지 진입 시 즉시 최신 HTML 을 받음.
            // 오프라인 시 2초 안에 네트워크 실패 → 캐시된 마지막 HTML 폴백.
            // 이게 없으면 옛 SW 가 precache 된 옛 index.html 을 CacheFirst 로 계속 서빙해서
            // 로그아웃→리다이렉트→로그인 동안 옛 화면이 보이는 문제가 생김.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-shell',
              networkTimeoutSeconds: 2,
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          {
            urlPattern: /^https:\/\/lh3\.googleusercontent\.com\/.*$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'avatar-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src')
    }
  }
});
