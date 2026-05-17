import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function generateCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function formatDateTime(value) {
  if (!value) return '';
  const date = value.toDate ? value.toDate() : new Date(value);
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function toDateInputValue(value) {
  if (!value) return '';
  const date = value.toDate ? value.toDate() : new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Android Chrome 은 Vibration API 지원, iOS Safari 는 미지원 (no-op).
// 드래그 드롭·중요한 토글 등 액션이 "확정"되는 순간에만 호출.
export function haptic(pattern = 10) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch {
      // 사용자가 사이트 진동을 막아둔 경우 등 — silently ignore
    }
  }
}
