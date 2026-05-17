import { useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn, haptic } from '@/lib/utils';

// 모바일 표준 풀투리프레시.
// - 스크롤이 최상단(scrollY === 0)일 때만 활성화 → 페이지 중간에서 드래그하면 작동 안 함
// - 임계값(THRESHOLD) 넘기면 햅틱 알림 + 손 떼면 리프레시 트리거
// - 데이터는 Firestore onSnapshot 으로 항상 최신이므로 PTR 의 핵심 효과는
//   (1) 시각적 피드백 (2) version.json 체크 강제 (옛 빌드에 갇힌 사용자 구제)
const THRESHOLD = 70;
const MAX_PULL = 110;
const RESISTANCE = 0.5;
const MIN_SPIN_MS = 700;

export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const eligible = useRef(false);
  const crossedThreshold = useRef(false);

  const handleTouchStart = (e) => {
    if (refreshing) {
      eligible.current = false;
      return;
    }
    const scrollY = window.scrollY ?? document.documentElement.scrollTop ?? 0;
    if (scrollY > 0) {
      eligible.current = false;
      return;
    }
    if (e.touches.length !== 1) {
      eligible.current = false;
      return;
    }
    eligible.current = true;
    startY.current = e.touches[0].clientY;
    crossedThreshold.current = false;
  };

  const handleTouchMove = (e) => {
    if (!eligible.current || refreshing) return;
    const dy = e.touches[0].clientY - (startY.current ?? 0);
    if (dy <= 0) {
      if (pull !== 0) setPull(0);
      return;
    }
    const scaled = Math.min(dy * RESISTANCE, MAX_PULL);
    setPull(scaled);
    if (scaled > THRESHOLD && !crossedThreshold.current) {
      crossedThreshold.current = true;
      haptic(10);
    } else if (scaled < THRESHOLD && crossedThreshold.current) {
      crossedThreshold.current = false;
    }
  };

  const finishRefresh = async () => {
    setRefreshing(true);
    setPull(THRESHOLD);
    const tasks = [new Promise((r) => setTimeout(r, MIN_SPIN_MS))];
    if (typeof window !== 'undefined' && typeof window.__matchupCheckVersion === 'function') {
      tasks.push(Promise.resolve(window.__matchupCheckVersion()).catch(() => {}));
    }
    if (onRefresh) {
      tasks.push(
        Promise.resolve(onRefresh()).catch((err) =>
          console.warn('[PullToRefresh] onRefresh failed', err)
        )
      );
    }
    await Promise.all(tasks);
    setRefreshing(false);
    setPull(0);
  };

  const handleTouchEnd = () => {
    if (!eligible.current) return;
    eligible.current = false;
    if (pull > THRESHOLD && !refreshing) {
      finishRefresh();
    } else if (pull !== 0) {
      setPull(0);
    }
  };

  const indicatorY = refreshing ? THRESHOLD : pull;
  const visible = pull > 8 || refreshing;
  const armed = pull > THRESHOLD || refreshing;
  const animated = refreshing || pull === 0;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 top-0 z-50 -translate-x-1/2"
        style={{
          transform: `translate3d(-50%, ${indicatorY - 48}px, 0)`,
          opacity: visible ? 1 : 0,
          transition: animated
            ? 'transform 0.25s ease, opacity 0.2s ease'
            : 'opacity 0.15s ease'
        }}
      >
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border bg-card shadow-md',
            armed && 'border-primary text-primary'
          )}
        >
          <RefreshCw
            className={cn('h-4 w-4', refreshing && 'animate-spin')}
            style={
              !refreshing
                ? {
                    transform: `rotate(${Math.min(pull * 4, 360)}deg)`,
                    transition: 'transform 0.05s linear'
                  }
                : undefined
            }
          />
        </div>
      </div>
      {children}
    </div>
  );
}
