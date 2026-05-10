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

function detectProvider(user) {
  if (user?.uid?.startsWith('kakao:')) return 'kakao';
  const pid = user?.providerData?.[0]?.providerId;
  if (pid === 'google.com') return 'google';
  return pid || 'unknown';
}

export async function ensureUserDoc(user) {
  if (!user || !db) return;
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  const provider = detectProvider(user);
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: user.displayName ?? '익명',
      photoURL: user.photoURL ?? null,
      provider,
      createdAt: serverTimestamp()
    });
  } else if (!snap.data().provider) {
    // 기존 사용자에 provider 필드가 없으면 한 번 보강
    await setDoc(ref, { provider }, { merge: true });
  }
}
