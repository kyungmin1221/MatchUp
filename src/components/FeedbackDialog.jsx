import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useUser } from '@/features/auth/hooks';
import { FEEDBACK_CATEGORIES, submitFeedback } from '@/features/feedback/api';

export default function FeedbackDialog({ open, onOpenChange }) {
  const user = useUser();
  const [category, setCategory] = useState('idea');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [doneAt, setDoneAt] = useState(null);

  useEffect(() => {
    if (open) {
      setCategory('idea');
      setText('');
      setDoneAt(null);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const provider = user.providerData?.[0]?.providerId?.includes('kakao')
        ? 'kakao'
        : user.providerData?.[0]?.providerId?.includes('google')
        ? 'google'
        : null;
      await submitFeedback({
        text,
        category,
        author: { uid: user.uid, displayName: user.displayName, provider }
      });
      setDoneAt(Date.now());
      setText('');
    } catch (err) {
      alert(err.message ?? '피드백 전송에 실패했어요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            의견 보내기
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            버그·개선 제안·기타 무엇이든 환영해요. 직접 답변은 어렵지만 모두 읽고 있어요.
          </p>
        </DialogHeader>

        {doneAt ? (
          <div className="space-y-3">
            <p className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm">
              ✅ 잘 전달됐어요. 시간 내 주셔서 감사해요!
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDoneAt(null)}>
                하나 더 보내기
              </Button>
              <Button onClick={() => onOpenChange(false)}>닫기</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>분류</Label>
              <div className="flex flex-wrap gap-1.5">
                {FEEDBACK_CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={
                      category === c.value
                        ? 'rounded-full border border-primary bg-primary/10 px-3 py-1 text-sm text-primary'
                        : 'rounded-full border border-border bg-background px-3 py-1 text-sm hover:border-primary/40'
                    }
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="feedback-text">내용</Label>
              <textarea
                id="feedback-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  category === 'bug'
                    ? '예) 매치 상세에서 뒤로가기를 눌렀더니 흰 화면이 떠요.'
                    : category === 'idea'
                    ? '예) 매치 메모 기능이 있으면 좋겠어요.'
                    : '편하게 적어주세요.'
                }
                rows={5}
                maxLength={2000}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{user ? `보내는 사람: ${user.displayName ?? '익명'}` : '로그인 필요'}</span>
                <span>{text.length} / 2000</span>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                취소
              </Button>
              <Button type="submit" disabled={submitting || text.trim().length < 5}>
                {submitting ? '보내는 중…' : '보내기'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
