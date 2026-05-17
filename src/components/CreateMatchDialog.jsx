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
import { createMatch, createMatchFromPoll } from '@/features/match/api';
import { cn } from '@/lib/utils';

export default function CreateMatchDialog({
  groupId,
  trigger,
  fromPoll = null,
  open: openProp,
  onOpenChange
}) {
  const user = useUser();
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [kind, setKind] = useState('football');
  const [title, setTitle] = useState(fromPoll?.title ?? '');
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [location, setLocation] = useState('');
  const [teamName, setTeamName] = useState('');
  const [opponentTeamName, setOpponentTeamName] = useState('');
  const [withOpponent, setWithOpponent] = useState(true);
  const [withRecruiting, setWithRecruiting] = useState(!fromPoll);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !title.trim()) {
      alert('제목은 필수예요.');
      return;
    }
    setSubmitting(true);
    try {
      const scheduledAt = matchDate
        ? `${matchDate}T${matchTime || '19:00'}`
        : null;
      const common = {
        groupId,
        title: title.trim(),
        scheduledAt,
        location: location.trim(),
        teamName: teamName.trim() || '우리 팀',
        opponentTeamName: opponentTeamName.trim() || '상대팀',
        withOpponent,
        kind,
        createdBy: user.uid
      };

      let ref;
      if (fromPoll) {
        ref = await createMatchFromPoll({ poll: fromPoll, ...common });
      } else {
        ref = await createMatch({ ...common, recruiting: withRecruiting });
      }

      setOpen(false);
      navigate(`/groups/${groupId}/matches/${ref.id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{fromPoll ? '이 투표로 매치 만들기' : '새 매치 만들기'}</DialogTitle>
        </DialogHeader>
        {fromPoll && (
          <p className="rounded-md border border-primary/40 bg-primary/5 p-2 text-xs text-foreground">
            "참석" 응답자 {fromPoll.options?.find((o) => o.attendance)?.voterUids?.length ?? 0}명이
            자동으로 매치 명단에 들어가요.
          </p>
        )}
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
            <Label htmlFor="match-date">일시</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                id="match-date"
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                aria-label="날짜"
                className="min-w-0"
              />
              <Input
                id="match-time"
                type="time"
                value={matchTime}
                onChange={(e) => setMatchTime(e.target.value)}
                aria-label="시간"
                className="min-w-0"
              />
            </div>
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

          {!fromPoll && (
            <label className="flex items-start gap-2 rounded-md border border-border/60 bg-secondary/40 p-3 text-sm">
              <input
                type="checkbox"
                checked={withRecruiting}
                onChange={(e) => setWithRecruiting(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium">모집 투표로 시작</span>
                <span className="block text-xs text-muted-foreground">
                  "참석 / 불참 / 미정" 투표가 같이 만들어지고, "참석"한 사람이 자동으로 매치 명단에 들어가요.
                </span>
              </span>
            </label>
          )}

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
                매치에 합류 코드가 생기고, 상대팀 캡틴에게 링크 한 번 보내면 매치에 직접 합류해
                명단·포메이션을 등록할 수 있어요.
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
