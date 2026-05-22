import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

// iOS PWA standalone 모드에서는 window.open() 이 막혀서 signInWithPopup 이 조용히 실패한다.
// 이 환경에선 signInWithRedirect 로 폴백.
function isStandalonePWA() {
  if (typeof window === 'undefined') return false;
  try {
    return (
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  } catch {
    return false;
  }
}

export async function signInWithGoogle() {
  if (!auth || !googleProvider) throw new Error('Firebase가 설정되지 않았어요.');
  if (isStandalonePWA()) {
    // redirect 흐름: 페이지가 떠나고 다시 돌아온 뒤 completeGoogleRedirect 가 마무리.
    await signInWithRedirect(auth, googleProvider);
    return null;
  }
  const result = await signInWithPopup(auth, googleProvider);
  await ensureUserDoc(result.user);
  return result.user;
}

// 앱 마운트 시 한 번 호출. redirect 로그인에서 돌아온 직후라면 user doc 보강.
// 결과 자체는 onAuthStateChanged 가 자동으로 픽업하므로 별도 navigate 불필요.
export async function completeGoogleRedirect() {
  if (!auth) return;
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      await ensureUserDoc(result.user);
    }
  } catch (e) {
    console.error('[auth] getRedirectResult failed', e);
  }
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
