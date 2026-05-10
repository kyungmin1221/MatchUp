import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createGroup } from '@/features/group/api';
import { createRecruitingPoll } from '@/features/poll/api';
import { DEFAULT_FORMATION } from '@/features/formation/templates';
import { generateCode } from '@/lib/utils';

export async function createMatch({
  groupId,
  title,
  scheduledAt,
  location,
  teamName,
  kind = 'football',
  recruiting = false,
  createdBy
}) {
  const ref = await addDoc(collection(db, 'matches'), {
    groupId,
    kind,
    title,
    scheduledAt: scheduledAt ? Timestamp.fromDate(new Date(scheduledAt)) : null,
    location: location ?? '',
    homeTeam: {
      name: teamName ?? '우리 팀',
      playerUids: [createdBy],
      formation: { type: DEFAULT_FORMATION[kind], positions: [] }
    },
    opponentMatchId: null,
    shareCode: generateCode(6),
    recruitingPollId: null,
    createdBy,
    createdAt: serverTimestamp()
  });

  if (recruiting) {
    const pollRef = await createRecruitingPoll({
      groupId,
      matchId: ref.id,
      matchTitle: title,
      createdBy
    });
    await updateDoc(ref, { recruitingPollId: pollRef.id });
  }

  return ref;
}

// 우리 매치 + 상대팀 새도우 그룹 + 상대팀 빈 매치를 한 번에 생성하고 양방향 연결.
// Firestore 룰 제약 때문에 batch 대신 순차 실행.
export async function createMatchWithOpponent({
  groupId,
  title,
  scheduledAt,
  location,
  teamName,
  opponentTeamName,
  kind = 'football',
  recruiting = false,
  createdBy
}) {
  const defaultType = DEFAULT_FORMATION[kind];

  // 1) 우리 매치
  const ourMatchRef = await addDoc(collection(db, 'matches'), {
    groupId,
    kind,
    title,
    scheduledAt: scheduledAt ? Timestamp.fromDate(new Date(scheduledAt)) : null,
    location: location ?? '',
    homeTeam: {
      name: teamName ?? '우리 팀',
      playerUids: [createdBy],
      formation: { type: defaultType, positions: [] }
    },
    opponentMatchId: null,
    shareCode: generateCode(6),
    recruitingPollId: null,
    createdBy,
    createdAt: serverTimestamp()
  });

  // 2) 상대팀 새도우 그룹 (생성자가 일단 멤버로 들어감 - 룰 통과용)
  const shadowGroupId = await createGroup({
    name: `${title} 상대팀`,
    ownerUid: createdBy,
    kind: 'opponent-shadow'
  });

  // 3) 상대팀 빈 매치
  const opponentMatchRef = await addDoc(collection(db, 'matches'), {
    groupId: shadowGroupId,
    kind,
    title,
    scheduledAt: scheduledAt ? Timestamp.fromDate(new Date(scheduledAt)) : null,
    location: location ?? '',
    homeTeam: {
      name: opponentTeamName ?? '상대팀',
      playerUids: [],
      formation: { type: defaultType, positions: [] }
    },
    opponentMatchId: ourMatchRef.id,
    shareCode: generateCode(6),
    recruitingPollId: null,
    createdBy,
    createdAt: serverTimestamp()
  });

  // 4) 우리 매치에 상대 id 연결
  await updateDoc(ourMatchRef, { opponentMatchId: opponentMatchRef.id });

  // 5) 모집 투표 (우리 매치에만)
  if (recruiting) {
    const pollRef = await createRecruitingPoll({
      groupId,
      matchId: ourMatchRef.id,
      matchTitle: title,
      createdBy
    });
    await updateDoc(ourMatchRef, { recruitingPollId: pollRef.id });
  }

  return { ourMatchId: ourMatchRef.id, opponentMatchId: opponentMatchRef.id, shadowGroupId };
}

export async function togglePlayer({ matchId, uid, join }) {
  await updateDoc(doc(db, 'matches', matchId), {
    'homeTeam.playerUids': join ? arrayUnion(uid) : arrayRemove(uid)
  });
}

export async function updateFormation({ matchId, formation }) {
  await updateDoc(doc(db, 'matches', matchId), {
    'homeTeam.formation': formation
  });
}

// 매치 종목(축구/풋살) 변경. 포메이션 타입을 새 종목 디폴트로 교체하고 슬롯은 비워두면
// MatchDetail 의 useEffect 가 자동으로 buildFormation 으로 슬롯을 채운다.
export async function updateMatchKind({ matchId, kind }) {
  const defaultType = DEFAULT_FORMATION[kind];
  await updateDoc(doc(db, 'matches', matchId), {
    kind,
    'homeTeam.formation.type': defaultType,
    'homeTeam.formation.positions': []
  });
}

export async function updateMatchInfo({ matchId, patch }) {
  await updateDoc(doc(db, 'matches', matchId), patch);
}

export function subscribeMatch(matchId, cb) {
  return onSnapshot(doc(db, 'matches', matchId), (snap) => {
    cb(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

export function subscribeGroupMatches(groupId, cb) {
  const q = query(collection(db, 'matches'), where('groupId', '==', groupId));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => (a.scheduledAt?.toMillis?.() ?? 0) - (b.scheduledAt?.toMillis?.() ?? 0));
    cb(items);
  });
}

export async function getMatch(matchId) {
  const snap = await getDoc(doc(db, 'matches', matchId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function linkOpponent({ ourMatchId, opponentShareCode }) {
  const q = query(collection(db, 'matches'), where('shareCode', '==', opponentShareCode));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('상대팀 매치 코드를 찾을 수 없어요.');
  const opponentDoc = snap.docs[0];
  if (opponentDoc.id === ourMatchId) throw new Error('자기 자신은 연결할 수 없어요.');

  const ourRef = doc(db, 'matches', ourMatchId);
  const opponentRef = opponentDoc.ref;

  await runTransaction(db, async (tx) => {
    const [ourSnap, oppSnap] = await Promise.all([tx.get(ourRef), tx.get(opponentRef)]);
    if (!ourSnap.exists() || !oppSnap.exists()) throw new Error('매치 정보를 찾을 수 없어요.');
    if (ourSnap.data().opponentMatchId && ourSnap.data().opponentMatchId !== opponentDoc.id) {
      throw new Error('이미 다른 상대팀과 연결된 매치예요.');
    }
    if (oppSnap.data().opponentMatchId && oppSnap.data().opponentMatchId !== ourMatchId) {
      throw new Error('상대팀이 이미 다른 팀과 연결되어 있어요.');
    }
    tx.update(ourRef, { opponentMatchId: opponentDoc.id });
    tx.update(opponentRef, { opponentMatchId: ourMatchId });
  });
  return opponentDoc.id;
}

export async function unlinkOpponent({ ourMatchId, opponentMatchId }) {
  await runTransaction(db, async (tx) => {
    const ourRef = doc(db, 'matches', ourMatchId);
    const oppRef = doc(db, 'matches', opponentMatchId);
    tx.update(ourRef, { opponentMatchId: null });
    tx.update(oppRef, { opponentMatchId: null });
  });
}

// 기존 모집 투표(아직 매치 미연결)에서 매치를 생성한다.
// 1) 매치 생성 (homeTeam.playerUids = attendance 옵션 voterUids)
// 2) 매치.recruitingPollId = pollId
// 3) poll.matchId = matchId
export async function createMatchFromPoll({
  poll,
  groupId,
  title,
  scheduledAt,
  location,
  teamName,
  kind = 'football',
  createdBy
}) {
  const attendanceOpt = poll.options?.find((o) => o.attendance);
  const recruitedUids = attendanceOpt?.voterUids ?? [];

  const ref = await addDoc(collection(db, 'matches'), {
    groupId,
    kind,
    title,
    scheduledAt: scheduledAt ? Timestamp.fromDate(new Date(scheduledAt)) : null,
    location: location ?? '',
    homeTeam: {
      name: teamName ?? '우리 팀',
      playerUids: recruitedUids,
      formation: { type: DEFAULT_FORMATION[kind], positions: [] }
    },
    opponentMatchId: null,
    shareCode: generateCode(6),
    recruitingPollId: poll.id,
    createdBy,
    createdAt: serverTimestamp()
  });

  // 폴이 새 매치를 가리키도록
  await updateDoc(doc(db, 'polls', poll.id), { matchId: ref.id });

  return ref;
}

// 매치 삭제. 상대팀 매치가 연결되어 있으면 그쪽의 opponentMatchId만 끊고 우리 매치만 삭제.
// 모집 투표가 연결되어 있으면 함께 삭제.
export async function deleteMatch({ matchId }) {
  const ref = doc(db, 'matches', matchId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  if (data.opponentMatchId) {
    try {
      await updateDoc(doc(db, 'matches', data.opponentMatchId), { opponentMatchId: null });
    } catch {
      /* 상대 매치가 이미 사라졌거나 권한이 없어도 무시하고 우리 매치는 삭제 */
    }
  }
  if (data.recruitingPollId) {
    try {
      await deleteDoc(doc(db, 'polls', data.recruitingPollId));
    } catch {
      /* 투표가 이미 없거나 권한 없으면 무시 */
    }
  }
  await deleteDoc(ref);
}
