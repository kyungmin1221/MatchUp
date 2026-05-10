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
