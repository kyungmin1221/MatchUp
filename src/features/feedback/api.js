import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// feedback/{feedbackId}
//   text          string  본문
//   category      'bug' | 'idea' | 'other'
//   authorUid     string  작성자 uid (rule 체크용)
//   authorName    string  denormalized 표시용
//   provider      'google' | 'kakao' | string
//   resolved      boolean
//   createdAt     Timestamp
//   resolvedAt    Timestamp | null

export const FEEDBACK_CATEGORIES = [
  { value: 'bug', label: '버그' },
  { value: 'idea', label: '개선 제안' },
  { value: 'other', label: '기타' }
];

export async function submitFeedback({ text, category, author }) {
  if (!author?.uid) throw new Error('로그인이 필요해요.');
  const clean = String(text ?? '').trim();
  if (clean.length < 5) throw new Error('피드백을 5자 이상 적어주세요.');
  if (clean.length > 2000) throw new Error('피드백이 너무 길어요. (2000자 이내)');
  return addDoc(collection(db, 'feedback'), {
    text: clean,
    category: category || 'other',
    authorUid: author.uid,
    authorName: author.displayName ?? '익명',
    provider: author.provider ?? null,
    resolved: false,
    resolvedAt: null,
    createdAt: serverTimestamp()
  });
}

export function subscribeAllFeedback(cb, onError) {
  const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (err) => onError?.(err)
  );
}

export async function setFeedbackResolved({ feedbackId, resolved }) {
  await updateDoc(doc(db, 'feedback', feedbackId), {
    resolved,
    resolvedAt: resolved ? serverTimestamp() : null
  });
}

export async function deleteFeedback({ feedbackId }) {
  await deleteDoc(doc(db, 'feedback', feedbackId));
}
