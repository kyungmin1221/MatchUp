import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateCode } from '@/lib/utils';

export async function createPoll({ groupId, title, options, closesAt, createdBy, multi = false }) {
  return addDoc(collection(db, 'polls'), {
    groupId,
    title,
    multi,
    options: options.map((label) => ({ id: generateCode(4), label, voterUids: [] })),
    closesAt: closesAt ? Timestamp.fromDate(new Date(closesAt)) : null,
    createdBy,
    createdAt: serverTimestamp()
  });
}

// 매치 모집 투표. matchId 가 없으면 단독 모집 투표 (나중에 매치로 변환 가능).
// 매치 작성자는 기본 "참석" 으로 시작해 매치 명단과 일관됨.
export async function createRecruitingPoll({
  groupId,
  matchId = null,
  matchTitle,
  title,
  createdBy
}) {
  return addDoc(collection(db, 'polls'), {
    groupId,
    matchId,
    title: title ?? `${matchTitle} 모집`,
    multi: false,
    options: [
      { id: 'attend', label: '참석', attendance: true, voterUids: [createdBy] },
      { id: 'absent', label: '불참', voterUids: [] },
      { id: 'maybe', label: '미정', voterUids: [] }
    ],
    closesAt: null,
    createdBy,
    createdAt: serverTimestamp()
  });
}

export async function votePoll({ pollId, optionId, uid, multi }) {
  const ref = doc(db, 'polls', pollId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('투표를 찾을 수 없어요.');
    const data = snap.data();

    // 매치 모집 투표면 매치 문서도 함께 동기화. 트랜잭션 규칙상 모든 read 가 write 보다 먼저.
    let matchRef = null;
    let matchData = null;
    if (data.matchId) {
      matchRef = doc(db, 'matches', data.matchId);
      const matchSnap = await tx.get(matchRef);
      if (matchSnap.exists()) matchData = matchSnap.data();
    }

    const target = data.options.find((o) => o.id === optionId);
    const alreadyVoted = target?.voterUids?.includes(uid);

    const nextOptions = data.options.map((opt) => {
      if (opt.id === optionId) {
        return {
          ...opt,
          voterUids: alreadyVoted ? opt.voterUids.filter((u) => u !== uid) : [...opt.voterUids, uid]
        };
      }
      if (!multi && !alreadyVoted) {
        return { ...opt, voterUids: opt.voterUids.filter((u) => u !== uid) };
      }
      return opt;
    });
    tx.update(ref, { options: nextOptions });

    // 매치 명단 = attendance 옵션의 voterUids
    if (matchData) {
      const attendanceOpt = nextOptions.find((o) => o.attendance);
      const recruitedUids = attendanceOpt?.voterUids ?? [];
      const positions = (matchData.homeTeam?.formation?.positions ?? []).map((p) =>
        p.playerUid && !recruitedUids.includes(p.playerUid) ? { ...p, playerUid: null } : p
      );
      tx.update(matchRef, {
        'homeTeam.playerUids': recruitedUids,
        'homeTeam.formation.positions': positions
      });
    }
  });
}

export function subscribePoll(pollId, cb) {
  return onSnapshot(doc(db, 'polls', pollId), (snap) => {
    cb(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

export function subscribeGroupPolls(groupId, cb) {
  const q = query(collection(db, 'polls'), where('groupId', '==', groupId));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
    cb(items);
  });
}

export async function deletePoll({ pollId }) {
  // 연결된 매치가 있으면 매치의 recruitingPollId 도 같이 정리
  const ref = doc(db, 'polls', pollId);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      if (data.matchId) {
        try {
          await updateDoc(doc(db, 'matches', data.matchId), { recruitingPollId: null });
        } catch {
          /* 매치가 이미 사라졌거나 권한 없음 - 무시하고 폴은 삭제 */
        }
      }
    }
  } catch {
    /* read 실패해도 삭제는 시도 */
  }
  await deleteDoc(ref);
}
