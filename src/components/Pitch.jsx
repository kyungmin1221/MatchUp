import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

function Slot({ slot, player, readOnly }) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `slot-${slot.slotId}`,
    data: { slotId: slot.slotId }
  });
  const {
    setNodeRef: setDragRef,
    listeners,
    attributes,
    isDragging
  } = useDraggable({
    id: `placed-${slot.slotId}`,
    data: { uid: player?.id, fromSlotId: slot.slotId },
    disabled: readOnly || !player
  });

  return (
    <div
      ref={readOnly ? null : setDropRef}
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
      className={cn(
        'absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1',
        isOver && 'scale-110 transition-transform'
      )}
    >
      <div
        ref={player && !readOnly ? setDragRef : null}
        {...(player && !readOnly ? listeners : {})}
        {...(player && !readOnly ? attributes : {})}
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full border-2 text-[10px] font-semibold',
          player ? 'border-primary bg-primary/30' : 'border-white/40 bg-black/40 text-white/70',
          isOver && 'border-primary bg-primary/50',
          player && !readOnly && 'cursor-grab active:cursor-grabbing',
          isDragging && 'opacity-40'
        )}
      >
        {player ? (
          <Avatar src={player.photoURL} name={player.displayName} size={40} />
        ) : (
          slot.role
        )}
      </div>
      <span className="rounded bg-black/60 px-1 text-[10px] text-white">
        {player ? player.displayName?.slice(0, 6) : slot.role}
      </span>
    </div>
  );
}

function BenchChip({ player }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `bench-${player.id}`,
    data: { uid: player.id, fromSlotId: null }
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'flex shrink-0 items-center gap-2 rounded-full border bg-card px-2.5 py-1 text-xs cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50'
      )}
    >
      <Avatar src={player.photoURL} name={player.displayName} size={20} />
      <span className="max-w-[80px] truncate">{player.displayName}</span>
    </div>
  );
}

function BenchArea({ children }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'bench', data: { bench: true } });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-wrap gap-2 rounded-md border border-dashed border-border/60 p-2 min-h-[44px] transition-colors',
        isOver && 'border-primary bg-primary/5'
      )}
    >
      {children}
    </div>
  );
}

export default function Pitch({ formation, players = [], onChange, readOnly = false }) {
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const placedUids = new Set(formation.positions.map((p) => p.playerUid).filter(Boolean));
  const benchPlayers = players.filter((p) => !placedUids.has(p.id));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    const uid = active.data.current?.uid;
    const fromSlotId = active.data.current?.fromSlotId ?? null;
    if (!uid) return;

    // 1) bench 영역에 드롭 → 해당 선수를 슬롯에서 제거
    if (over.data.current?.bench) {
      if (!fromSlotId) return; // bench → bench
      onChange?.({
        ...formation,
        positions: formation.positions.map((p) =>
          p.slotId === fromSlotId ? { ...p, playerUid: null } : p
        )
      });
      return;
    }

    // 2) 슬롯에 드롭
    const targetSlotId = over.data.current?.slotId;
    if (!targetSlotId) return;
    if (fromSlotId === targetSlotId) return; // 같은 자리

    const targetUid =
      formation.positions.find((p) => p.slotId === targetSlotId)?.playerUid ?? null;

    const next = formation.positions.map((p) => {
      if (p.slotId === targetSlotId) return { ...p, playerUid: uid };
      if (fromSlotId && p.slotId === fromSlotId) {
        // 슬롯→슬롯: 목적지에 있던 선수를 출발 슬롯으로 swap (없으면 빈칸)
        return { ...p, playerUid: targetUid };
      }
      return p;
    });
    onChange?.({ ...formation, positions: next });
  };

  const removeFromSlot = (slotId) => {
    onChange?.({
      ...formation,
      positions: formation.positions.map((p) =>
        p.slotId === slotId ? { ...p, playerUid: null } : p
      )
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-3">
        <div
          className="relative w-full overflow-hidden rounded-xl border border-emerald-700/40"
          style={{
            aspectRatio: '2/3',
            background:
              'linear-gradient(180deg, #064e3b 0%, #065f46 50%, #047857 100%)'
          }}
        >
          <div className="absolute inset-3 rounded-md border border-white/30" />
          <div className="absolute inset-x-3 top-1/2 h-px bg-white/30" />
          <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
          <div className="absolute left-1/2 top-3 h-16 w-32 -translate-x-1/2 border border-white/30 border-t-0" />
          <div className="absolute bottom-3 left-1/2 h-16 w-32 -translate-x-1/2 border border-white/30 border-b-0" />

          {formation.positions.map((slot) => (
            <div
              key={slot.slotId}
              onDoubleClick={() => !readOnly && slot.playerUid && removeFromSlot(slot.slotId)}
            >
              <Slot slot={slot} player={playerMap[slot.playerUid]} readOnly={readOnly} />
            </div>
          ))}
        </div>

        {!readOnly && (
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              칩을 슬롯으로 드래그 · 슬롯끼리 자리 바꾸기 · 대기 영역으로 빼기
            </p>
            <BenchArea>
              {benchPlayers.length === 0 ? (
                <span className="text-xs text-muted-foreground">대기 중인 참가자 없음</span>
              ) : (
                benchPlayers.map((p) => <BenchChip key={p.id} player={p} />)
              )}
            </BenchArea>
          </div>
        )}
      </div>
    </DndContext>
  );
}
