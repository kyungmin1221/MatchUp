// 카톡/페이스북/인스타 등 인앱 브라우저 감지.
// 이런 환경에선 third-party cookie/storage 격리로 Firebase Auth 가 동작하지 않음.

export function detectInAppBrowser() {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || '';
  if (/KAKAOTALK/i.test(ua)) return 'kakaotalk';
  if (/Line\//i.test(ua)) return 'line';
  if (/FBAN|FBAV/i.test(ua)) return 'facebook';
  if (/Instagram/i.test(ua)) return 'instagram';
  if (/NAVER\(inapp;/i.test(ua)) return 'naver';
  return null;
}

export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent || '') && !window.MSStream;
}

export function isAndroid() {
  return /Android/i.test(navigator.userAgent || '');
}

// Android 는 intent URL 로 Chrome 강제 가능.
// iOS 는 인앱에서 외부 브라우저로 자동 점프할 표준 방식이 없음 (사용자 수동 안내).
export function tryEscapeInAppBrowser() {
  const url = window.location.href;
  if (isAndroid()) {
    const stripped = url.replace(/^https?:\/\//, '');
    window.location.href = `intent://${stripped}#Intent;scheme=https;package=com.android.chrome;end`;
    return true;
  }
  return false;
}

export async function copyCurrentUrl() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    return true;
  } catch {
    return false;
  }
}
