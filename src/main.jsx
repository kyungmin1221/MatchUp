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

// 1분마다 업데이트 체크 — PWA 가 standalone 으로 떠 있는 상황에서도 빠르게 새 빌드 받기 위함.
if (typeof window !== 'undefined') {
  setInterval(() => {
    updateSW?.();
  }, 60 * 1000);
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
