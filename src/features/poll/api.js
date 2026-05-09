import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
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

export async function votePoll({ pollId, optionId, uid, multi }) {
  const ref = doc(db, 'polls', pollId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('투표를 찾을 수 없어요.');
    const data = snap.data();
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
