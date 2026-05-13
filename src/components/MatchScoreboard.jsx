import { Calendar, MapPin } from 'lucide-react';

const CREST_PALETTE = ['#34d399', '#60a5fa', '#fbbf24', '#f472b6', '#a78bfa', '#fb923c', '#22d3ee', '#f87171'];

function hashIdx(s, mod) {
  let h = 0;
  for (let i = 0; i < (s || '').length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

function toDate(value) {
  if (!value) return null;
  return value.toDate ? value.toDate() : new Date(value);
}

function Crest({ name, size = 44 }) {
  const initial = (name || '?').slice(0, 1).toUpperCase();
  const bg = CREST_PALETTE[hashIdx(name || '?', CREST_PALETTE.length)];
  return (
    <div
      className="flex items-center justify-center rounded-[10px] font-black italic text-white shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
      style={{ width: size, height: size, fontSize: size * 0.45, background: bg }}
    >
      {initial}
    </div>
  );
}

export default function MatchScoreboard({ match, ourGroupName }) {
  if (!match) return null;

  const d = toDate(match.scheduledAt);
  const day = d ? ['일', '월', '화', '수', '목', '금', '토'][d.getDay()] : '';
  const time = d
    ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    : '미정';
  const koDate = d ? `${d.getMonth() + 1}.${d.getDate()} (${day})` : '';
  const fullDate = d ? `${d.getMonth() + 1}월 ${d.getDate()}일 ${time}` : '';
  const weekday = d
    ? ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()]
    : 'TBD';
  const kindLabel = match.kind === 'futsal' ? 'FUTSAL' : 'FOOTBALL';

  const homeName = match.homeTeam?.name ?? ourGroupName ?? '홈';
  const awayName = match.awayTeam?.name;
  const hasAway = !!match.awayTeam;

  return (
    <div
      className="relative mb-4 overflow-hidden rounded-2xl p-5 text-white"
      style={{ background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'repeating-linear-gradient(180deg, rgba(255,255,255,0.04) 0 14px, transparent 14px 28px)'
        }}
      />

      <p className="relative m-0 mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
        {weekday} · {kindLabel} · KICK-OFF
      </p>

      {hasAway ? (
        // Head-to-head: 두 팀 + VS
        <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="text-left">
            <Crest name={homeName} />
            <div className="mt-1.5 text-sm font-extrabold tracking-tight">{homeName}</div>
            <div className="mt-0.5 font-mono text-[10px] tracking-[0.14em] text-white/55">HOME</div>
          </div>

          <div className="text-center">
            <div className="text-[22px] font-black italic tracking-tighter text-white/40">VS</div>
            <div className="mt-0.5 text-[22px] font-extrabold leading-none tracking-tighter">
              {time}
            </div>
            <div className="mt-1 text-[11px] text-white/65">{koDate}</div>
          </div>

          <div className="text-right">
            <div className="ml-auto inline-block">
              <Crest name={awayName} />
            </div>
            <div className="mt-1.5 text-sm font-extrabold tracking-tight">{awayName}</div>
            <div className="mt-0.5 font-mono text-[10px] tracking-[0.14em] text-white/55">AWAY</div>
          </div>
        </div>
      ) : (
        // 단독: 한 팀 중심 + "상대팀 없음" 라벨
        <div className="relative flex items-center gap-4">
          <Crest name={homeName} size={56} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-extrabold tracking-tight">{homeName}</div>
            <div className="mt-0.5 inline-flex items-center rounded-full bg-black/35 px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] text-white/70">
              상대팀 없음
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[26px] font-extrabold leading-none tracking-tighter">{time}</div>
            <div className="mt-1 text-[11px] text-white/65">{koDate}</div>
          </div>
        </div>
      )}

      <div className="relative mt-3.5 flex flex-wrap gap-1.5">
        {match.location && (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-black/35 px-2.5 py-1 text-xs font-semibold">
            <MapPin className="h-3 w-3 text-emerald-300" />
            {match.location}
          </span>
        )}
        {fullDate && (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-black/35 px-2.5 py-1 text-xs font-semibold">
            <Calendar className="h-3 w-3 text-emerald-300" />
            {fullDate}
          </span>
        )}
      </div>
    </div>
  );
}
