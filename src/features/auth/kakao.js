import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const KAKAO_SDK_SRC = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js';
const RETURN_TO_KEY = 'kakaoReturnTo';

let kakaoLoadPromise = null;

function loadKakaoSdk() {
  if (kakaoLoadPromise) return kakaoLoadPromise;
  kakaoLoadPromise = new Promise((resolve, reject) => {
    if (window.Kakao) {
      try {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(import.meta.env.VITE_KAKAO_JS_KEY);
        }
        return resolve(window.Kakao);
      } catch (e) {
        return reject(e);
      }
    }
    const script = document.createElement('script');
    script.src = KAKAO_SDK_SRC;
    script.async = true;
    script.onload = () => {
      try {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(import.meta.env.VITE_KAKAO_JS_KEY);
        }
        resolve(window.Kakao);
      } catch (e) {
        reject(e);
      }
    };
    script.onerror = () => reject(new Error('카카오 SDK 로드에 실패했어요.'));
    document.head.appendChild(script);
  });
  return kakaoLoadPromise;
}

// 앱 시작 시 미리 SDK 를 로드해두면 사용자가 카카오 버튼을 탭한 순간 즉시 navigate 가능 →
// iOS PWA standalone 에서 await 으로 user gesture context 가 끊겨 navigation 이 막히는 문제 방지.
export function preloadKakaoSdk() {
  if (typeof window === 'undefined') return;
  if (!import.meta.env.VITE_KAKAO_JS_KEY) return;
  loadKakaoSdk().catch(() => {
    // 실패해도 무시 — 실제 클릭 시 한번 더 시도
    kakaoLoadPromise = null;
  });
}

export function getKakaoRedirectUri() {
  return `${window.location.origin}/auth/kakao/callback`;
}

/** 카카오 로그인 페이지로 redirect 시킨다.
 *  returnTo: 콜백 후 돌아갈 path+query (예: '/match-invite?code=XYZ').
 *
 *  iOS PWA standalone 에선 await 후 navigation 이 막힐 수 있으므로,
 *  SDK 가 이미 로드되어 있으면 await 없이 동기적으로 authorize 호출 →
 *  click 의 user gesture context 를 유지.
 */
export function signInWithKakao({ returnTo = '/groups' } = {}) {
  if (!import.meta.env.VITE_KAKAO_JS_KEY) {
    throw new Error('VITE_KAKAO_JS_KEY 환경변수가 설정되지 않았어요.');
  }
  try {
    sessionStorage.setItem(RETURN_TO_KEY, returnTo);
  } catch {
    /* private mode 등 */
  }
  // SDK 가 이미 로드 + init 됐으면 즉시 동기 호출 (user gesture 유지)
  if (window.Kakao?.isInitialized?.()) {
    window.Kakao.Auth.authorize({
      redirectUri: getKakaoRedirectUri(),
      scope: 'profile_nickname,profile_image'
    });
    return Promise.resolve();
  }
  // 첫 클릭이면 SDK 로드 후 호출 (PWA 가 아니면 정상 동작)
  return loadKakaoSdk().then((Kakao) => {
    Kakao.Auth.authorize({
      redirectUri: getKakaoRedirectUri(),
      scope: 'profile_nickname,profile_image'
    });
  });
}

/** /auth/kakao/callback 페이지에서 호출. 인가 코드를 서버에 보내고 Firebase 로그인 마무리. */
export async function exchangeKakaoCode(code) {
  const res = await fetch('/api/kakao-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirectUri: getKakaoRedirectUri() })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? '서버 인증 실패');
  }
  const { customToken } = await res.json();
  const cred = await signInWithCustomToken(auth, customToken);
  return cred.user;
}

export function popKakaoReturnTo() {
  try {
    const v = sessionStorage.getItem(RETURN_TO_KEY) || '/groups';
    sessionStorage.removeItem(RETURN_TO_KEY);
    return v;
  } catch {
    return '/groups';
  }
}

export async function signOutFromKakao() {
  if (window.Kakao?.Auth?.getAccessToken?.()) {
    await new Promise((resolve) => window.Kakao.Auth.logout(resolve));
  }
}
