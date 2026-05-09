import { useEffect } from 'react';
import AppRoutes from './routes.jsx';
import SetupGuide from './components/SetupGuide';
import { useAuthListener } from '@/features/auth/hooks';
import { isFirebaseConfigured } from '@/lib/firebase';

export default function App() {
  useAuthListener();

  useEffect(() => {
    const setVH = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    setVH();
    window.addEventListener('resize', setVH);
    return () => window.removeEventListener('resize', setVH);
  }, []);

  if (!isFirebaseConfigured) return <SetupGuide />;
  return <AppRoutes />;
}
