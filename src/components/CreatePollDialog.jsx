import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/features/auth/hooks';
import { createPoll, createRecruitingPoll } from '@/features/poll/api';
import { cn } from '@/lib/utils';

export default function CreatePollDialog({ groupId, trigger }) {
  const user = useUser();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('opinion'); // 'opinion' | 'recruiting'
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '', '']);
  const [closesAt, setClosesAt] = useState('');
  const [multi, setMulti] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setMode('opinion');
    setTitle('');
    setOptions(['', '', '']);
    setClosesAt('');
    setMulti(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) {
      alert('제목은 필수예요.');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'recruiting') {
        await createRecruitingPoll({
          groupId,
          title: title.trim(),
          createdBy: user.uid
        });
      } else {
        const cleaned = options.map((o) => o.trim()).filter(Boolean);
        if (cleaned.length < 2) {
          alert('옵션 2개 이상은 필수예요.');
          setSubmitting(false);
          return;
        }
        await createPoll({
          groupId,
          title: title.trim(),
          options: cleaned,
          closesAt: closesAt || null,
          multi,
          createdBy: user.uid
        });
      }
      setOpen(false);
      reset();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 투표 만들기</DialogTitle>
          <DialogDescription>일반 의견 투표 또는 매치 인원 의향 투표를 만들 수 있어요.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>유형</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: 'opinion', label: '💬 일반 의견', hint: '자유 옵션' },
                { v: 'recruiting', label: '🎯 참석 의향 모집', hint: '참석/불참/미정' }
              ].map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setMode(opt.v)}
                  className={cn(
                    'rounded-md border px-3 py-2 text-left text-sm transition',
                    mode === opt.v
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border bg-background hover:border-primary/40'
                  )}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-[11px] opacity-80">{opt.hint}</div>
                </button>
              ))}
            </div>
            {mode === 'recruiting' && (
              <p className="text-[11px] text-muted-foreground">
                나중에 owner가 이 투표를 매치로 변환할 수 있어요. "참석" 응답자가 자동으로 매치 명단에 들어가요.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="poll-title">제목</Label>
            <Input
              id="poll-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={mode === 'recruiting' ? '예) 이번 주말 풋살 할 사람?' : '예) 다음 회식 언제?'}
            />
          </div>

          {mode === 'opinion' && (
            <>
              <div className="space-y-2">
                <Label>옵션</Label>
                {options.map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const next = [...options];
                        next[idx] = e.target.value;
                        setOptions(next);
                      }}
                      placeholder={`옵션 ${idx + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                      disabled={options.length <= 2}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOptions([...options, ''])}
                >
                  <Plus className="mr-1 h-4 w-4" /> 옵션 추가
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="poll-closes">마감 시각 (선택)</Label>
                <Input
                  id="poll-closes"
                  type="datetime-local"
                  value={closesAt}
                  onChange={(e) => setClosesAt(e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={multi}
                  onChange={(e) => setMulti(e.target.checked)}
                />
                복수 선택 허용
              </label>
            </>
          )}

          <DialogFooter>
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? '만드는 중…' : '투표 만들기'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
