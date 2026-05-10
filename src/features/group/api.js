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
