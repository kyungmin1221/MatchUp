import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const KAKAO_SDK_SRC = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js';

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

export async function signInWithKakao() {
  if (!import.meta.env.VITE_KAKAO_JS_KEY) {
    throw new Error('VITE_KAKAO_JS_KEY 환경변수가 설정되지 않았어요.');
  }
  const Kakao = await loadKakaoSdk();

  // 카카오 로그인 (popup)
  const tokenResult = await new Promise((resolve, reject) => {
    Kakao.Auth.login({
      success: resolve,
      fail: reject,
      scope: 'profile_nickname,profile_image'
    });
  });

  // 서버로 access_token 보내고 Firebase Custom Token 받기
  const res = await fetch('/api/kakao-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken: tokenResult.access_token })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? '서버 인증 실패');
  }
  const { customToken } = await res.json();

  const cred = await signInWithCustomToken(auth, customToken);
  return cred.user;
}

export async function signOutFromKakao() {
  if (window.Kakao?.Auth?.getAccessToken?.()) {
    await new Promise((resolve) => window.Kakao.Auth.logout(resolve));
  }
}
