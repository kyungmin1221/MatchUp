// MOM(Man of the Match) 투표 로직.
// - 경기 종료 = scheduledAt + 120분 (구장 대여 시간 기준)
// - 투표 마감 = 종료 + 24시간
// - 본인 표는 tally에서 제외 (UI는 클릭 가능)
// - 동률 = 공동 MOM

export const MATCH_DURATION_MS = 120 * 60 * 1000;
export const VOTE_WINDOW_MS = 24 * 60 * 60 * 1000;

function scheduledAtMs(match) {
  const v = match?.scheduledAt;
  if (!v) return null;
  if (typeof v.toMillis === 'function') return v.toMillis();
  return new Date(v).getTime();
}

// phase: 'none' | 'pre' | 'voting' | 'closed'
export function getMomPhase(match, now = Date.now()) {
  const startMs = scheduledAtMs(match);
  if (!startMs) return { phase: 'none' };
  const matchEndMs = startMs + MATCH_DURATION_MS;
  const deadlineMs = matchEndMs + VOTE_WINDOW_MS;
  if (now < matchEndMs) return { phase: 'pre', matchEndMs, deadlineMs };
  if (now < deadlineMs) return { phase: 'voting', matchEndMs, deadlineMs };
  return { phase: 'closed', matchEndMs, deadlineMs };
}

export function tallyMom(momVotes) {
  const tally = {};
  Object.entries(momVotes || {}).forEach(([voter, target]) => {
    if (!target) return;
    if (voter === target) return; // 본인 표 제외
    tally[target] = (tally[target] || 0) + 1;
  });
  const counts = Object.values(tally);
  const max = counts.length ? Math.max(...counts) : 0;
  const winners =
    max === 0
      ? []
      : Object.entries(tally)
          .filter(([, v]) => v === max)
          .map(([k]) => k);
  return { tally, max, winners };
}
