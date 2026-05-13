import { MapPin } from 'lucide-react';

function toDate(value) {
  if (!value) return null;
  return value.toDate ? value.toDate() : new Date(value);
}

export default function KickoffHero({ match, onClick }) {
  const d = toDate(match?.scheduledAt);
  if (!d) return null;
  const day = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const dateStr = `${d.getMonth() + 1}월 ${d.getDate()}일 (${day})`;
  const kindLabel = match.kind === 'futsal' ? '5 vs 5' : '11 vs 11';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative mb-5 w-full overflow-hidden rounded-2xl border border-emerald-700/40 p-5 text-left text-white shadow-sm transition hover:border-emerald-500/60"
      style={{
        background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)'
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'repeating-linear-gradient(180deg, rgba(255,255,255,0.04) 0 14px, transparent 14px 28px), radial-gradient(60% 80% at 100% 0%, rgba(255,255,255,0.15), transparent 60%)'
        }}
      />
      <p className="relative m-0 mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">
        NEXT KICK-OFF
      </p>
      <h2 className="relative m-0 text-2xl font-black italic leading-none tracking-tighter">
        {match.title}
      </h2>
      <div className="relative mt-2.5 flex items-baseline gap-2.5">
        <span className="font-mono text-4xl font-bold leading-none tracking-tighter text-white">
          {time}
        </span>
        <span className="text-[13px] font-semibold text-white/75">{dateStr}</span>
      </div>
      <div className="relative mt-2.5 flex items-center gap-1.5 text-[13px] text-white/85">
        <MapPin className="h-3.5 w-3.5 text-emerald-300" />
        <span>{match.location || '장소 미정'}</span>
        <span className="text-white/40">·</span>
        <span>{kindLabel}</span>
      </div>
    </button>
  );
}
