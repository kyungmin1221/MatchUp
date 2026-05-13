import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createRecruitingPoll } from '@/features/poll/api';
import { DEFAULT_FORMATION } from '@/features/formation/templates';
import { generateCode } from '@/lib/utils';

// 새 데이터 모델:
//   matches/{matchId}
//   ├─ groupId             생성한 그룹 (homeTeam 측)
//   ├─ kind, title, scheduledAt, location
//   ├─ homeTeam: { name, playerUids[], formation }
//   ├─ awayTeam: { name, playerUids[], formation } | null
//   ├─ awayMemberUids: []  매치에 직접 합류한 상대팀 사용자들
//   ├─ awayInviteCode: string | null
//   ├─ recruitingPollId
//   ├─ createdBy
//   └─ createdAt

function emptyHomeTeam(teamName, kind, createdBy) {
  return {
    name: teamName ?? '우리 팀',
    playerUids: [createdBy],
    formation: { type: DEFAULT_FORMATION[kind], positions: [] }
  };
}

function emptyAwayTeam(teamName, kind) {
  return {
    name: teamName ?? '상대팀',
    playerUids: [],
    formation: { type: DEFAULT_FORMATION[kind], positions: [] }
  };
}

export async function createMatch({
  groupId,
  title,
  scheduledAt,
  location,
  teamName,
  opponentTeamName,
  withOpponent = false,
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
    homeTeam: emptyHomeTeam(teamName, kind, createdBy),
    awayTeam: withOpponent ? emptyAwayTeam(opponentTeamName, kind) : null,
    awayMemberUids: [],
    awayInviteCode: withOpponent ? generateCode(6) : null,
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

// 기존 모집 투표 → 매치 변환 (homeTeam.playerUids 를 attendance voterUids 로 채움)
export async function createMatchFromPoll({
  poll,
  groupId,
  title,
  scheduledAt,
  location,
  teamName,
  opponentTeamName,
  withOpponent = false,
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
    awayTeam: withOpponent ? emptyAwayTeam(opponentTeamName, kind) : null,
    awayMemberUids: [],
    awayInviteCode: withOpponent ? generateCode(6) : null,
    recruitingPollId: poll.id,
    createdBy,
    createdAt: serverTimestamp()
  });

  await updateDoc(doc(db, 'polls', poll.id), { matchId: ref.id });
  return ref;
}

// away 멤버가 매치에서 완전히 빠진다. awayMemberUids + awayTeam.playerUids + 포메이션 슬롯 정리.
export async function leaveMatchAsAway({ matchId, uid }) {
  const ref = doc(db, 'matches', matchId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const positions = (data.awayTeam?.formation?.positions ?? []).map((p) =>
    p.playerUid === uid ? { ...p, playerUid: null } : p
  );
  await updateDoc(ref, {
    awayMemberUids: arrayRemove(uid),
    'awayTeam.playerUids': arrayRemove(uid),
    'awayTeam.formation.positions': positions
  });
}

// 매치 합류 — awayInviteCode 로 매치를 찾아 awayMemberUids 에 본인을 추가한다.
// 매치 만든 사람(createdBy)은 home 측이므로 awayMemberUids 에 추가하지 않고 매치 id 만 반환.
export async function joinMatchByCode({ awayInviteCode, uid }) {
  const q = query(
    collection(db, 'matches'),
    where('awayInviteCode', '==', awayInviteCode)
  );
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('매치 합류 코드를 찾을 수 없어요.');
  const d = snap.docs[0];
  const data = d.data();
  if (uid === data.createdBy) return d.id;
  if (data.awayMemberUids?.includes(uid)) return d.id;
  await updateDoc(d.ref, { awayMemberUids: arrayUnion(uid) });
  return d.id;
}

// 명단 토글 — 본인이 어느 측인지에 따라 home/away 분기
export async function togglePlayer({ matchId, uid, join, side = 'home' }) {
  const field = side === 'away' ? 'awayTeam.playerUids' : 'homeTeam.playerUids';
  await updateDoc(doc(db, 'matches', matchId), {
    [field]: join ? arrayUnion(uid) : arrayRemove(uid)
  });
}

export async function updateFormation({ matchId, formation, side = 'home' }) {
  const field = side === 'away' ? 'awayTeam.formation' : 'homeTeam.formation';
  await updateDoc(doc(db, 'matches', matchId), {
    [field]: formation
  });
}

// 매치 종목(축구/풋살) 변경. 양 팀 포메이션 모두 새 종목 디폴트로 교체.
export async function updateMatchKind({ matchId, kind }) {
  const defaultType = DEFAULT_FORMATION[kind];
  const ref = doc(db, 'matches', matchId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const patch = {
    kind,
    'homeTeam.formation.type': defaultType,
    'homeTeam.formation.positions': []
  };
  if (data.awayTeam) {
    patch['awayTeam.formation.type'] = defaultType;
    patch['awayTeam.formation.positions'] = [];
  }
  await updateDoc(ref, patch);
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
    items.sort(
      (a, b) => (a.scheduledAt?.toMillis?.() ?? 0) - (b.scheduledAt?.toMillis?.() ?? 0)
    );
    cb(items);
  });
}

// 본인이 awayMemberUids 에 들어간 매치 (다른 그룹의 매치에 상대팀으로 합류)
export function subscribeMyAwayMatches(uid, cb) {
  const q = query(
    collection(db, 'matches'),
    where('awayMemberUids', 'array-contains', uid)
  );
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    items.sort(
      (a, b) => (a.scheduledAt?.toMillis?.() ?? 0) - (b.scheduledAt?.toMillis?.() ?? 0)
    );
    cb(items);
  });
}

export async function getMatch(matchId) {
  const snap = await getDoc(doc(db, 'matches', matchId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// MOM 투표: matches/{id}.momVotes 맵에 { voterUid: votedForUid } 형태로 기록.
// 본인 표(voter === votedFor)는 서버에 저장되지만 tally 단계에서 제외.
export async function voteMom({ matchId, voterUid, votedFor }) {
  await updateDoc(doc(db, 'matches', matchId), {
    [`momVotes.${voterUid}`]: votedFor
  });
}

export async function unvoteMom({ matchId, voterUid }) {
  await updateDoc(doc(db, 'matches', matchId), {
    [`momVotes.${voterUid}`]: deleteField()
  });
}

// 매치 삭제. 모집 투표 있으면 같이 삭제.
export async function deleteMatch({ matchId }) {
  const ref = doc(db, 'matches', matchId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  if (data.recruitingPollId) {
    try {
      await deleteDoc(doc(db, 'polls', data.recruitingPollId));
    } catch {
      /* 무시 */
    }
  }
  await deleteDoc(ref);
}
