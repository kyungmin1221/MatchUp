// 다크모드 / 라이트모드 / 시스템 따라가기 관리.
// FOUC 방지를 위해 index.html 의 인라인 스크립트가 첫 라운드 클래스 적용 → 이 모듈은 그 후 동적 변경 담당.
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'matchup.theme';
const MEDIA_QUERY = '(prefers-color-scheme: dark)';

export const THEME_PREFS = ['system', 'light', 'dark'];

export function getStoredPref() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch {
    // localStorage 접근 차단 — system 으로 폴백
  }
  return 'system';
}

export function getEffectiveTheme(pref) {
  if (pref === 'dark') return 'dark';
  if (pref === 'light') return 'light';
  if (typeof window !== 'undefined' && window.matchMedia?.(MEDIA_QUERY).matches) {
    return 'dark';
  }
  return 'light';
}

function applyTheme(pref) {
  if (typeof document === 'undefined') return;
  const effective = getEffectiveTheme(pref);
  const root = document.documentElement;
  root.classList.toggle('dark', effective === 'dark');
  root.dataset.theme = effective;
  // 브라우저 상단 바 색상 (Android Chrome / iOS PWA 상태바) 도 동기화.
  // index.html 의 media-attached meta tag 는 시스템 prefers 만 따라가므로
  // 사용자가 수동 선택한 경우엔 여기서 덮어써야 함.
  const meta = document.querySelector('meta[name="theme-color"]:not([media])');
  const color = effective === 'dark' ? '#0b1220' : '#ffffff';
  if (meta) {
    meta.setAttribute('content', color);
  } else {
    const el = document.createElement('meta');
    el.name = 'theme-color';
    el.content = color;
    document.head.appendChild(el);
  }
}

const subscribers = new Set();

export function setThemePref(pref) {
  const normalized = THEME_PREFS.includes(pref) ? pref : 'system';
  try {
    if (normalized === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    // 무시
  }
  applyTheme(normalized);
  subscribers.forEach((cb) => cb(normalized));
}

// 시스템 색 변경 감지 — 사용자가 system 모드일 때 OS 가 다크 ↔ 라이트 토글하면 자동 반영
export function initTheme() {
  applyTheme(getStoredPref());
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mq = window.matchMedia(MEDIA_QUERY);
    const handler = () => {
      if (getStoredPref() === 'system') {
        applyTheme('system');
        subscribers.forEach((cb) => cb('system'));
      }
    };
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else mq.addListener?.(handler);
  }
}

export function useThemePref() {
  const [pref, setPrefState] = useState(getStoredPref);

  useEffect(() => {
    const cb = (next) => setPrefState(next);
    subscribers.add(cb);
    return () => {
      subscribers.delete(cb);
    };
  }, []);

  const setPref = (next) => setThemePref(next);
  return { pref, setPref, effective: getEffectiveTheme(pref) };
}
