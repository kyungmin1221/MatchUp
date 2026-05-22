import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// 빌드 ID — 매 빌드마다 새로 찍힘. 클라이언트가 이 값을 /version.json 과 비교해서
// 옛 버전 캐시에 갇혀 있으면 SW/캐시 다 비우고 강제 리로드.
const BUILD_ID = String(Date.now());

// /version.json 을 dist 에 같이 떨굼.
function versionJsonPlugin() {
  return {
    name: 'matchup-version-json',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ buildId: BUILD_ID })
      });
    }
  };
}

export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID)
  },
  plugins: [
    react(),
    versionJsonPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon_180.png', 'icon_192.png', 'icon_512.png'],
      manifest: {
        name: 'MatchLink',
        short_name: 'MatchLink',
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
          { src: '/icon_192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icon_512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon_512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        globIgnores: ['version.json'],
        // /__/auth/* 는 Firebase Auth handler 프록시 — SW 가 가로채면 redirect 흐름이 깨짐.
        navigateFallbackDenylist: [/^\/api/, /^\/version\.json/, /^\/__\/auth/],
        // 새 빌드 감지 시 즉시 활성화 + 모든 탭 즉시 새 SW 가 제어 + 옛 캐시 청소
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // /version.json — 캐시 절대 안 함. 빌드 버전 체크용이라 매번 최신 필요.
            urlPattern: ({ url }) => url.pathname === '/version.json',
            handler: 'NetworkOnly'
          },
          {
            // HTML 페이지(SPA 네비게이션) → NetworkFirst.
            // 새 빌드가 배포되면 SW 업데이트를 기다리지 않고 다음 페이지 진입 시 즉시 최신 HTML 을 받음.
            // 오프라인 시 2초 안에 네트워크 실패 → 캐시된 마지막 HTML 폴백.
            // 이게 없으면 옛 SW 가 precache 된 옛 index.html 을 CacheFirst 로 계속 서빙해서
            // 로그아웃→리다이렉트→로그인 동안 옛 화면이 보이는 문제가 생김.
            // /__/auth/* 는 Firebase Auth handler 프록시이므로 절대 캐시 안 함 (redirect 흐름 보존).
            urlPattern: ({ request, url }) =>
              request.mode === 'navigate' && !url.pathname.startsWith('/__/auth/'),
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
