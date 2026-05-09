// x, y 는 0~100% 좌표. y는 위(공격) ~ 아래(수비) 기준이 아니라 우리 팀 진영을 위로 두고 (0=골대, 100=하프라인) 사용.
// 컴포넌트에서 y를 화면 좌표로 매핑.

export const FORMATIONS = {
  '4-3-3': {
    label: '4-3-3',
    kind: 'football',
    size: 11,
    positions: [
      { role: 'GK', x: 50, y: 8 },
      { role: 'LB', x: 15, y: 28 },
      { role: 'CB', x: 38, y: 25 },
      { role: 'CB', x: 62, y: 25 },
      { role: 'RB', x: 85, y: 28 },
      { role: 'CM', x: 30, y: 50 },
      { role: 'CM', x: 50, y: 55 },
      { role: 'CM', x: 70, y: 50 },
      { role: 'LW', x: 18, y: 80 },
      { role: 'ST', x: 50, y: 85 },
      { role: 'RW', x: 82, y: 80 }
    ]
  },
  '4-4-2': {
    label: '4-4-2',
    kind: 'football',
    size: 11,
    positions: [
      { role: 'GK', x: 50, y: 8 },
      { role: 'LB', x: 15, y: 28 },
      { role: 'CB', x: 38, y: 25 },
      { role: 'CB', x: 62, y: 25 },
      { role: 'RB', x: 85, y: 28 },
      { role: 'LM', x: 15, y: 55 },
      { role: 'CM', x: 38, y: 52 },
      { role: 'CM', x: 62, y: 52 },
      { role: 'RM', x: 85, y: 55 },
      { role: 'ST', x: 38, y: 82 },
      { role: 'ST', x: 62, y: 82 }
    ]
  },
  '3-5-2': {
    label: '3-5-2',
    kind: 'football',
    size: 11,
    positions: [
      { role: 'GK', x: 50, y: 8 },
      { role: 'CB', x: 25, y: 25 },
      { role: 'CB', x: 50, y: 22 },
      { role: 'CB', x: 75, y: 25 },
      { role: 'LWB', x: 12, y: 50 },
      { role: 'CM', x: 35, y: 52 },
      { role: 'CM', x: 50, y: 58 },
      { role: 'CM', x: 65, y: 52 },
      { role: 'RWB', x: 88, y: 50 },
      { role: 'ST', x: 38, y: 82 },
      { role: 'ST', x: 62, y: 82 }
    ]
  },
  'futsal-1-2-1': {
    label: '1-2-1',
    kind: 'futsal',
    size: 5,
    positions: [
      { role: 'GK', x: 50, y: 10 },
      { role: 'FIX', x: 50, y: 32 },
      { role: 'ALA', x: 22, y: 58 },
      { role: 'ALA', x: 78, y: 58 },
      { role: 'PIV', x: 50, y: 85 }
    ]
  },
  'futsal-2-1-1': {
    label: '2-1-1',
    kind: 'futsal',
    size: 5,
    positions: [
      { role: 'GK', x: 50, y: 10 },
      { role: 'DF', x: 30, y: 35 },
      { role: 'DF', x: 70, y: 35 },
      { role: 'CM', x: 50, y: 60 },
      { role: 'PIV', x: 50, y: 85 }
    ]
  }
};

export const DEFAULT_FORMATION = {
  football: '4-3-3',
  futsal: 'futsal-1-2-1'
};

export function formationsByKind(kind) {
  return Object.entries(FORMATIONS).filter(([, tpl]) => tpl.kind === kind);
}

export function buildFormation(type) {
  const tpl = FORMATIONS[type];
  if (!tpl) return { type, positions: [] };
  return {
    type,
    positions: tpl.positions.map((p, i) => ({ slotId: `${type}-${i}`, ...p, playerUid: null }))
  };
}
