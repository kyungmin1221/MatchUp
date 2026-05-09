import { signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

export async function signInWithGoogle() {
  if (!auth || !googleProvider) throw new Error('Firebase가 설정되지 않았어요.');
  const result = await signInWithPopup(auth, googleProvider);
  await ensureUserDoc(result.user);
  return result.user;
}

export async function signOut() {
  if (!auth) return;
  await fbSignOut(auth);
}

export async function ensureUserDoc(user) {
  if (!user || !db) return;
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: user.displayName ?? '익명',
      photoURL: user.photoURL ?? null,
      createdAt: serverTimestamp()
    });
  }
}
