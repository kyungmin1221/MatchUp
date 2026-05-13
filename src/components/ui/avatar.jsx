import { cn } from '@/lib/utils';

export function Avatar({ src, name, size = 32, className }) {
  const initial = (name ?? '?').trim().charAt(0).toUpperCase();
  // shrink-0: flex 컨테이너가 가로 폭을 줄여서 세로로 긴 타원이 되는 현상 방지
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={cn('shrink-0 rounded-full object-cover ring-1 ring-border', className)}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xs font-semibold ring-1 ring-border',
        className
      )}
    >
      {initial}
    </div>
  );
}
