import { Trophy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function hoursLeft(deadlineMs) {
  const ms = deadlineMs - Date.now();
  if (ms <= 0) return null;
  return Math.max(1, Math.ceil(ms / (60 * 60 * 1000)));
}

// MatchDetail 상단의 MOM 상태 배너. 3가지 모드:
//  - voting  : 투표 가능 (미투표/투표완료 분기)
//  - closed  : 결과 공개 (우승자 표시)
//  - winner  : 본인이 MOM(공동 포함) — 결과 공개 후 축하 카드. closed와 함께 노출.
export default function MomBanner({
  phase,
  hasVoted,
  isMom,
  isOwner,
  winners,
  winnerNames,
  voteCount,
  deadlineMs,
  onOpen,
  onShare
}) {
  if (phase === 'pre' || phase === 'none') return null;

  if (phase === 'voting') {
    const h = hoursLeft(deadlineMs);
    const label = hasVoted ? '투표 완료' : 'MOM 투표 진행 중';
    const sub = h ? `D-${h <= 24 ? `${h}h` : Math.ceil(h / 24)}` : '곧 마감';
    return (
      <button
        type="button"
        onClick={onOpen}
        className="mb-3 flex w-full items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-left transition hover:border-amber-400 hover:bg-amber-100"
      >
        <span className="flex items-center gap-2 text-sm">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span className="font-semibold text-amber-900">🏆 {label}</span>
          <span className="text-amber-700">· {sub}</span>
        </span>
        <span className="text-xs font-medium text-amber-700">
          {hasVoted ? '투표 변경' : '투표하기'} ›
        </span>
      </button>
    );
  }

  // phase === 'closed'
  if (winners.length === 0) {
    return (
      <div className="mb-3 rounded-xl border border-border bg-secondary/40 px-4 py-2.5 text-sm text-muted-foreground">
        <Trophy className="mr-1.5 inline h-4 w-4" />
        MOM 투표가 마감됐어요. (투표 없음)
      </div>
    );
  }

  const isTied = winners.length > 1;
  const headline = isTied
    ? `🏆 공동 MOM · ${winnerNames.join(', ')}`
    : `🏆 MOM · ${winnerNames[0]}`;

  return (
    <div
      className={
        isMom
          ? 'mb-3 overflow-hidden rounded-xl border border-amber-400/50 bg-gradient-to-r from-amber-100 to-amber-50 px-4 py-3'
          : 'mb-3 overflow-hidden rounded-xl border border-amber-300 bg-amber-50 px-4 py-3'
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-base font-bold text-amber-900">{headline}</div>
          <div className="mt-0.5 text-xs text-amber-700">
            {voteCount}표 · 투표 마감됨
            {isMom && <span className="ml-1 font-semibold">· 축하해요! 🎉</span>}
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <Button variant="outline" size="sm" onClick={onOpen}>
            결과 보기
          </Button>
          {isOwner && (
            <Button variant="outline" size="sm" onClick={onShare}>
              <Share2 className="mr-1 h-3.5 w-3.5" /> 공유
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
