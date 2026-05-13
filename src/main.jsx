import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// PWA 서비스 워커 명시적 등록.
// 새 빌드 감지 시 자동으로 skipWaiting → 새 SW 활성화 → 페이지 재로드.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // autoUpdate 모드 + skipWaiting/clientsClaim 덕분에 보통은 자동 처리되지만,
    // 혹시 콜백이 호출되면 즉시 새 SW 활성화 + 재로드.
    updateSW?.(true);
  }
});

if (typeof window !== 'undefined') {
  // 1분마다 업데이트 체크 — PWA 가 standalone 으로 떠 있는 상황에서도 빠르게 새 빌드 받기 위함.
  setInterval(() => {
    updateSW?.();
  }, 60 * 1000);

  // 새 SW 가 페이지 제어를 시작하는 순간 자동 reload (옛 JS 가 화면에 남아 있는 현상 방지).
  // 첫 방문 시 SW 가 처음 controller 가 되는 순간은 reload 하지 않는다.
  if ('serviceWorker' in navigator) {
    let hadController = !!navigator.serviceWorker.controller;
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) {
        hadController = true;
        return;
      }
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
  }

  // ─── 빌드 버전 체크 (SW 캐시 문제 우회용 안전망) ────────────────
  // /version.json 을 30s 마다 + 탭 포커스 시 가져와서 이 번들의 BUILD_ID 와 비교.
  // 다르면 옛 빌드에 갇힌 상태 → SW 다 해제 + 모든 캐시 비우고 강제 리로드.
  // SW 업데이트 사이클이 어떻든 새 버전으로 강제 점프.
  const CURRENT_BUILD = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : null;
  let hardReloading = false;

  async function hardRefresh() {
    if (hardReloading) return;
    hardReloading = true;
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      }
    } catch (e) {
      console.warn('hardRefresh cleanup failed', e);
    } finally {
      window.location.reload();
    }
  }

  // 외부에서 사용할 수 있도록 노출 (AppShell의 강제 새로고침 버튼이 호출)
  window.__matchupHardRefresh = hardRefresh;

  async function checkVersion() {
    if (!CURRENT_BUILD) return;
    try {
      const res = await fetch(`/version.json?_=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const { buildId } = await res.json();
      if (buildId && buildId !== CURRENT_BUILD) {
        console.info('[matchup] new build detected, hard refreshing', { from: CURRENT_BUILD, to: buildId });
        hardRefresh();
      }
    } catch {
      // 네트워크 실패 — 다음 체크 때 재시도
    }
  }

  // 시작 후 5초 뒤 첫 체크 (초기 부담 줄이기), 그 후 30초 간격
  setTimeout(checkVersion, 5000);
  setInterval(checkVersion, 30 * 1000);
  // 탭 다시 활성화될 때마다 즉시 체크
  window.addEventListener('focus', checkVersion);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkVersion();
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 30, refetchOnWindowFocus: false }
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
