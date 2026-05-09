import { cn } from '@/lib/utils';

export function Avatar({ src, name, size = 32, className }) {
  const initial = (name ?? '?').trim().charAt(0).toUpperCase();
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={cn('rounded-full object-cover ring-1 ring-border', className)}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        'flex items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xs font-semibold ring-1 ring-border',
        className
      )}
    >
      {initial}
    </div>
  );
}
