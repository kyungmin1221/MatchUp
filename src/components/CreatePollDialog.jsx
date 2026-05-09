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
import { createPoll } from '@/features/poll/api';

export default function CreatePollDialog({ groupId, trigger }) {
  const user = useUser();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('이번 주 풋살 가능?');
  const [options, setOptions] = useState(['참석', '불참', '미정']);
  const [closesAt, setClosesAt] = useState('');
  const [multi, setMulti] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle('이번 주 풋살 가능?');
    setOptions(['참석', '불참', '미정']);
    setClosesAt('');
    setMulti(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    const cleaned = options.map((o) => o.trim()).filter(Boolean);
    if (!title.trim() || cleaned.length < 2) {
      alert('제목과 옵션 2개 이상은 필수예요.');
      return;
    }
    setSubmitting(true);
    try {
      await createPoll({
        groupId,
        title: title.trim(),
        options: cleaned,
        closesAt: closesAt || null,
        multi,
        createdBy: user.uid
      });
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
          <DialogDescription>친구들에게 참석 여부나 시간 선호를 물어볼 수 있어요.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="poll-title">제목</Label>
            <Input id="poll-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
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
            <Button type="button" variant="outline" size="sm" onClick={() => setOptions([...options, ''])}>
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
            <input type="checkbox" checked={multi} onChange={(e) => setMulti(e.target.checked)} />
            복수 선택 허용
          </label>
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
