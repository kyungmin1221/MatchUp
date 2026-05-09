import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/features/auth/hooks';
import { createMatch, createMatchWithOpponent } from '@/features/match/api';
import { cn } from '@/lib/utils';

export default function CreateMatchDialog({ groupId, trigger }) {
  const user = useUser();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState('football'); // 'football' | 'futsal'
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [location, setLocation] = useState('');
  const [teamName, setTeamName] = useState('');
  const [opponentTeamName, setOpponentTeamName] = useState('');
  const [withOpponent, setWithOpponent] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !title.trim()) {
      alert('제목은 필수예요.');
      return;
    }
    setSubmitting(true);
    try {
      let ourMatchId;
      if (withOpponent) {
        const r = await createMatchWithOpponent({
          groupId,
          title: title.trim(),
          scheduledAt: scheduledAt || null,
          location: location.trim(),
          teamName: teamName.trim() || '우리 팀',
          opponentTeamName: opponentTeamName.trim() || '상대팀',
          kind,
          createdBy: user.uid
        });
        ourMatchId = r.ourMatchId;
      } else {
        const ref = await createMatch({
          groupId,
          title: title.trim(),
          scheduledAt: scheduledAt || null,
          location: location.trim(),
          teamName: teamName.trim() || '우리 팀',
          kind,
          createdBy: user.uid
        });
        ourMatchId = ref.id;
      }
      setOpen(false);
      navigate(`/groups/${groupId}/matches/${ourMatchId}`);
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
          <DialogTitle>새 매치 만들기</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>종목</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: 'football', label: '⚽ 축구 (11인)' },
                { v: 'futsal', label: '🥅 풋살 (5인)' }
              ].map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setKind(opt.v)}
                  className={cn(
                    'rounded-md border px-3 py-2 text-sm transition',
                    kind === opt.v
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border bg-background hover:border-primary/40'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="match-title">제목</Label>
            <Input
              id="match-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 토요일 저녁 풋살"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="match-when">일시</Label>
            <Input
              id="match-when"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="match-location">장소</Label>
            <Input
              id="match-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="예) 한성대 풋살장 A코트"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="match-team">우리 팀 이름</Label>
            <Input
              id="match-team"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="우리 팀"
            />
          </div>

          <label className="flex items-start gap-2 rounded-md border border-border/60 bg-secondary/40 p-3 text-sm">
            <input
              type="checkbox"
              checked={withOpponent}
              onChange={(e) => setWithOpponent(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">상대팀 자리도 함께 만들기 (대항전)</span>
              <span className="block text-xs text-muted-foreground">
                상대팀 캡틴이 링크 한 번이면 합류해서 명단·포메이션을 등록할 수 있어요.
              </span>
            </span>
          </label>

          {withOpponent && (
            <div className="space-y-1.5">
              <Label htmlFor="match-opp">상대팀 이름</Label>
              <Input
                id="match-opp"
                value={opponentTeamName}
                onChange={(e) => setOpponentTeamName(e.target.value)}
                placeholder="상대팀"
              />
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? '만드는 중…' : '매치 만들기'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
