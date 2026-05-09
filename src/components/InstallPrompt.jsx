import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DISMISS_KEY = 'installPromptDismissedAt';
const DISMISS_DAYS = 7;

function isDismissedRecently() {
  const ts = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
  if (!ts) return false;
  const days = (Date.now() - ts) / (1000 * 60 * 60 * 24);
  return days < DISMISS_DAYS;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(isDismissedRecently);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(standalone);

    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installed = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };
    window.addEventListener('appinstalled', installed);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') setDeferredPrompt(null);
  };

  if (isStandalone || dismissed) return null;

  // Android / Chrome / Edge: 네이티브 설치 프롬프트
  if (deferredPrompt) {
    return (
      <Banner onDismiss={handleDismiss}>
        <div className="flex-1">
          <p className="text-sm font-medium">홈 화면에 앱으로 설치</p>
          <p className="text-xs text-muted-foreground">
            한 번 설치하면 브라우저 없이 바로 들어와요.
          </p>
        </div>
        <Button size="sm" onClick={handleInstall}>
          <Download className="mr-1 h-4 w-4" /> 설치
        </Button>
      </Banner>
    );
  }

  // iOS Safari: 자동 프롬프트가 없어 수동 안내
  if (isIOS) {
    return (
      <Banner onDismiss={handleDismiss}>
        <div className="flex-1">
          <p className="text-sm font-medium">홈 화면에 추가하기</p>
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1 flex-wrap">
            Safari 하단의 <Share className="h-3 w-3 inline" /> 공유 버튼 → "홈 화면에 추가"
          </p>
        </div>
      </Banner>
    );
  }

  return null;
}

function Banner({ children, onDismiss }) {
  return (
    <div className="fixed inset-x-2 bottom-2 z-40 mx-auto max-w-md rounded-xl border bg-card p-3 pr-9 shadow-lg sm:inset-x-auto sm:right-4 safe-bottom">
      <div className="flex items-start gap-3">{children}</div>
      <button
        onClick={onDismiss}
        className="absolute right-2 top-2 rounded-sm text-muted-foreground hover:text-foreground"
        aria-label="닫기"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
