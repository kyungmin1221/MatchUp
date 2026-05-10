import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { deleteMatch } from '@/features/match/api';
import { generateCode } from '@/lib/utils';

export async function createGroup({ name, ownerUid, kind = 'permanent' }) {
  const ref = await addDoc(collection(db, 'groups'), {
    name,
    ownerUid,
    memberUids: [ownerUid],
    inviteCode: generateCode(6),
    kind,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function leaveGroup({ groupId, uid }) {
  // 먼저 그룹 멤버 상태에서 그룹의 폴/매치 흔적을 정리한다.
  // (memberUids 에서 빠진 후엔 update 권한이 없어지므로 순서 중요)

  // 1) 폴들에서 본인의 표 제거
  const pollsSnap = await getDocs(
    query(collection(db, 'polls'), where('groupId', '==', groupId))
  );
  await Promise.all(
    pollsSnap.docs.map(async (d) => {
      const data = d.data();
      let dirty = false;
      const nextOptions = (data.options ?? []).map((opt) => {
        if (opt.voterUids?.includes(uid)) {
          dirty = true;
          return { ...opt, voterUids: opt.voterUids.filter((u) => u !== uid) };
        }
        return opt;
      });
      if (dirty) await updateDoc(d.ref, { options: nextOptions });
    })
  );

  // 2) 매치들에서 본인 명단·포메이션 슬롯 정리
  const matchesSnap = await getDocs(
    query(collection(db, 'matches'), where('groupId', '==', groupId))
  );
  await Promise.all(
    matchesSnap.docs.map(async (d) => {
      const data = d.data();
      const team = data.homeTeam ?? {};
      const playerUids = team.playerUids ?? [];
      const positions = team.formation?.positions ?? [];
      const wasPlayer = playerUids.includes(uid);
      const wasInFormation = positions.some((p) => p.playerUid === uid);
      if (!wasPlayer && !wasInFormation) return;

      const nextPlayerUids = playerUids.filter((u) => u !== uid);
      const nextPositions = positions.map((p) =>
        p.playerUid === uid ? { ...p, playerUid: null } : p
      );
      await updateDoc(d.ref, {
        'homeTeam.playerUids': nextPlayerUids,
        'homeTeam.formation.positions': nextPositions
      });
    })
  );

  // 3) 마지막으로 그룹 memberUids 에서 본인 제거
  const ref = doc(db, 'groups', groupId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const next = (snap.data().memberUids ?? []).filter((u) => u !== uid);
  await updateDoc(ref, { memberUids: next });
}

// 그룹 owner 전용. 그룹의 폴과 매치도 함께 삭제한 뒤 그룹 자체를 삭제.
// 매치는 deleteMatch 를 통해 상대팀 매치와의 연결도 정리됨.
export async function deleteGroup({ groupId }) {
  const [pollsSnap, matchesSnap] = await Promise.all([
    getDocs(query(collection(db, 'polls'), where('groupId', '==', groupId))),
    getDocs(query(collection(db, 'matches'), where('groupId', '==', groupId)))
  ]);

  await Promise.all([
    ...pollsSnap.docs.map((d) => deleteDoc(d.ref).catch(() => {})),
    ...matchesSnap.docs.map((d) => deleteMatch({ matchId: d.id }).catch(() => {}))
  ]);

  await deleteDoc(doc(db, 'groups', groupId));
}

export async function joinGroup({ inviteCode, uid }) {
  const q = query(collection(db, 'groups'), where('inviteCode', '==', inviteCode));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('초대 코드를 찾을 수 없어요.');
  const groupDoc = snap.docs[0];
  if (groupDoc.data().memberUids.includes(uid)) return groupDoc.id;
  await updateDoc(groupDoc.ref, { memberUids: arrayUnion(uid) });
  return groupDoc.id;
}

export function subscribeMyGroups(uid, cb) {
  const q = query(collection(db, 'groups'), where('memberUids', 'array-contains', uid));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
    cb(items);
  });
}

export function subscribeGroup(groupId, cb) {
  return onSnapshot(doc(db, 'groups', groupId), (snap) => {
    cb(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

export async function getGroupMembers(memberUids) {
  if (!memberUids?.length) return [];
  const chunks = [];
  for (let i = 0; i < memberUids.length; i += 10) chunks.push(memberUids.slice(i, i + 10));
  const results = await Promise.all(
    chunks.map((ids) =>
      getDocs(query(collection(db, 'users'), where(documentId(), 'in', ids))).then((s) =>
        s.docs.map((d) => ({ id: d.id, ...d.data() }))
      )
    )
  );
  return results.flat();
}

export async function getUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
