import { useEffect, useState } from 'react';
import AppRoutes from './routes.jsx';
import SetupGuide from './components/SetupGuide';
import InstallPrompt from './components/InstallPrompt';
import InAppBrowserGuide from './components/InAppBrowserGuide';
import { useAuthListener } from '@/features/auth/hooks';
import { isFirebaseConfigured } from '@/lib/firebase';
import { detectInAppBrowser } from '@/lib/inAppBrowser';

export default function App() {
  useAuthListener();
  const [inAppSource] = useState(() => detectInAppBrowser());

  useEffect(() => {
    const setVH = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    setVH();
    window.addEventListener('resize', setVH);
    return () => window.removeEventListener('resize', setVH);
  }, []);

  if (!isFirebaseConfigured) return <SetupGuide />;

  // 카톡 등 인앱 브라우저에선 Firebase Auth 가 동작하지 않으므로 안내 화면만 표시.
  if (inAppSource) return <InAppBrowserGuide source={inAppSource} />;

  return (
    <>
      <AppRoutes />
      <InstallPrompt />
    </>
  );
}
