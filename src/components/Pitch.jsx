import { useState } from 'react';
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

function Slot({ slot, player, readOnly, selected, isAnySelected, onTap }) {
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

  // 좌표 의미: y=0 → 골키퍼(아래), y=100 → 스트라이커(위)
  // 화면 매핑: top = 100 - y
  return (
    <div
      ref={readOnly ? null : setDropRef}
      style={{ left: `${slot.x}%`, top: `${100 - slot.y}%` }}
      className={cn(
        'absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1',
        isOver && 'scale-110 transition-transform'
      )}
    >
      <button
        type="button"
        ref={player && !readOnly ? setDragRef : null}
        {...(player && !readOnly ? listeners : {})}
        {...(player && !readOnly ? attributes : {})}
        onClick={(e) => {
          if (readOnly) return;
          e.stopPropagation();
          onTap?.();
        }}
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full border-2 text-[10px] font-semibold transition',
          player ? 'border-primary bg-primary/30' : 'border-white/40 bg-black/40 text-white/70',
          isOver && 'border-primary bg-primary/50',
          selected && 'ring-4 ring-yellow-300/80 scale-110',
          isAnySelected && !selected && 'opacity-80',
          player && !readOnly && 'cursor-pointer active:cursor-grabbing',
          isDragging && 'opacity-40'
        )}
      >
        {player ? (
          <Avatar src={player.photoURL} name={player.displayName} size={40} />
        ) : (
          slot.role
        )}
      </button>
      <span className="rounded bg-black/60 px-1 text-[10px] text-white">
        {player ? player.displayName?.slice(0, 6) : slot.role}
      </span>
    </div>
  );
}

function BenchChip({ player, selected, isAnySelected, onTap }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `bench-${player.id}`,
    data: { uid: player.id, fromSlotId: null }
  });
  return (
    <button
      type="button"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onTap?.();
      }}
      className={cn(
        'flex shrink-0 items-center gap-2 rounded-full border bg-card px-2.5 py-1 text-xs cursor-pointer active:cursor-grabbing transition',
        selected && 'ring-2 ring-yellow-300/80 border-yellow-300',
        isAnySelected && !selected && 'opacity-70',
        isDragging && 'opacity-50'
      )}
    >
      <Avatar src={player.photoURL} name={player.displayName} size={20} />
      <span className="max-w-[80px] truncate">{player.displayName}</span>
    </button>
  );
}

function BenchArea({ children, onTap, isAnySelected }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'bench', data: { bench: true } });
  return (
    <div
      ref={setNodeRef}
      onClick={onTap}
      className={cn(
        'flex flex-wrap gap-2 rounded-md border border-dashed border-border/60 p-2 min-h-[44px] transition-colors',
        isOver && 'border-primary bg-primary/5',
        isAnySelected && 'border-yellow-300/70 bg-yellow-300/5 cursor-pointer'
      )}
    >
      {children}
    </div>
  );
}

export default function Pitch({ formation, players = [], onChange, readOnly = false }) {
  const [selectedUid, setSelectedUid] = useState(null);

  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const placedUids = new Set(formation.positions.map((p) => p.playerUid).filter(Boolean));
  const benchPlayers = players.filter((p) => !placedUids.has(p.id));

  const selectedFromSlotId =
    formation.positions.find((p) => p.playerUid === selectedUid)?.slotId ?? null;

  const movePlayerToSlot = (uid, fromSlotId, targetSlotId) => {
    if (fromSlotId === targetSlotId) return;
    const targetUid =
      formation.positions.find((p) => p.slotId === targetSlotId)?.playerUid ?? null;
    const next = formation.positions.map((p) => {
      if (p.slotId === targetSlotId) return { ...p, playerUid: uid };
      if (fromSlotId && p.slotId === fromSlotId) return { ...p, playerUid: targetUid };
      return p;
    });
    onChange?.({ ...formation, positions: next });
  };

  const removePlayerToBench = (fromSlotId) => {
    onChange?.({
      ...formation,
      positions: formation.positions.map((p) =>
        p.slotId === fromSlotId ? { ...p, playerUid: null } : p
      )
    });
  };

  // 슬롯 탭 동작
  const handleSlotTap = (slot) => {
    if (readOnly) return;
    if (!selectedUid) {
      // 아직 아무도 선택 안 됨 → 슬롯에 선수 있으면 선택
      if (slot.playerUid) setSelectedUid(slot.playerUid);
      return;
    }
    // 같은 자리에 있는 선수 다시 탭 → 선택 해제
    if (slot.playerUid === selectedUid) {
      setSelectedUid(null);
      return;
    }
    movePlayerToSlot(selectedUid, selectedFromSlotId, slot.slotId);
    setSelectedUid(null);
  };

  // 대기 칩 탭
  const handleChipTap = (uid) => {
    if (readOnly) return;
    if (selectedUid === uid) {
      setSelectedUid(null);
      return;
    }
    setSelectedUid(uid);
  };

  // 대기 영역 빈 곳 탭 → 선택된 선수가 슬롯에 있으면 빼기
  const handleBenchTap = () => {
    if (readOnly || !selectedUid) return;
    if (selectedFromSlotId) {
      removePlayerToBench(selectedFromSlotId);
    }
    setSelectedUid(null);
  };

  // Drag 처리 (기존)
  const handleDragEnd = (event) => {
    setSelectedUid(null); // 드래그하면 선택 모드 해제
    const { active, over } = event;
    if (!over) return;
    const uid = active.data.current?.uid;
    const fromSlotId = active.data.current?.fromSlotId ?? null;
    if (!uid) return;

    if (over.data.current?.bench) {
      if (!fromSlotId) return;
      removePlayerToBench(fromSlotId);
      return;
    }

    const targetSlotId = over.data.current?.slotId;
    if (!targetSlotId) return;
    movePlayerToSlot(uid, fromSlotId, targetSlotId);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
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
          {/* 위쪽(상대 골대) 페널티 박스 */}
          <div className="absolute left-1/2 top-3 h-16 w-32 -translate-x-1/2 border border-white/30 border-t-0" />
          {/* 아래쪽(우리 골대) 페널티 박스 */}
          <div className="absolute bottom-3 left-1/2 h-16 w-32 -translate-x-1/2 border border-white/30 border-b-0" />

          {formation.positions.map((slot) => (
            <Slot
              key={slot.slotId}
              slot={slot}
              player={playerMap[slot.playerUid]}
              readOnly={readOnly}
              selected={!!slot.playerUid && slot.playerUid === selectedUid}
              isAnySelected={!!selectedUid}
              onTap={() => handleSlotTap(slot)}
            />
          ))}
        </div>

        {!readOnly && (
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              {selectedUid
                ? '이동할 위치를 탭하세요 · 다시 탭하면 취소'
                : '선수를 탭해서 선택 후 위치 탭 · 또는 드래그&드롭'}
            </p>
            <BenchArea onTap={handleBenchTap} isAnySelected={!!selectedUid && !!selectedFromSlotId}>
              {benchPlayers.length === 0 ? (
                <span className="text-xs text-muted-foreground">대기 중인 참가자 없음</span>
              ) : (
                benchPlayers.map((p) => (
                  <BenchChip
                    key={p.id}
                    player={p}
                    selected={p.id === selectedUid}
                    isAnySelected={!!selectedUid}
                    onTap={() => handleChipTap(p.id)}
                  />
                ))
              )}
            </BenchArea>
          </div>
        )}
      </div>
    </DndContext>
  );
}
