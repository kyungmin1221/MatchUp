import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from './store';
import { ensureUserDoc } from './api';

export function useAuthListener() {
  const setUser = useAuthStore((s) => s.setUser);
  useEffect(() => {
    if (!auth) {
      setUser(null);
      return undefined;
    }
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) await ensureUserDoc(user);
      setUser(user);
    });
    return unsub;
  }, [setUser]);
}

export function useUser() {
  return useAuthStore((s) => s.user);
}

export function useAuthLoading() {
  return useAuthStore((s) => s.loading);
}
