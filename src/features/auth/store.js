import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  reset: () => set({ user: null, loading: false })
}));
