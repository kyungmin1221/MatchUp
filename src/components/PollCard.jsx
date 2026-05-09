import { useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { useUser } from '@/features/auth/hooks';
import { useMembers } from '@/features/group/hooks';
import { deletePoll, votePoll } from '@/features/poll/api';
import { cn, formatDateTime } from '@/lib/utils';

export default function PollCard({ poll, group }) {
  const user = useUser();
  const isOwner = !!user && group?.ownerUid === user.uid;
  const allVoterUids = useMemo(
    () => Array.from(new Set(poll.options.flatMap((o) => o.voterUids ?? []))),
    [poll]
  );
  const { data: members = [] } = useMembers(allVoterUids);
  const memberMap = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members]);

  const totalVoters = allVoterUids.length;
  const closed = poll.closesAt && poll.closesAt.toMillis() < Date.now();

  const handleVote = async (optionId) => {
    if (!user || closed) return;
    try {
      await votePoll({ pollId: poll.id, optionId, uid: user.uid, multi: poll.multi });
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('이 투표를 삭제할까요? 되돌릴 수 없어요.')) return;
    try {
      await deletePoll({ pollId: poll.id });
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{poll.title}</CardTitle>
          <div className="flex items-center gap-1.5">
            {closed ? <Badge variant="outline">마감</Badge> : <Badge>{poll.multi ? '복수' : '단일'}</Badge>}
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
                aria-label="투표 삭제"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {poll.closesAt && (
          <p className="text-xs text-muted-foreground">마감: {formatDateTime(poll.closesAt)}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {poll.options.map((opt) => {
          const count = opt.voterUids?.length ?? 0;
          const ratio = totalVoters ? Math.round((count / totalVoters) * 100) : 0;
          const mine = user && opt.voterUids?.includes(user.uid);
          return (
            <button
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              disabled={closed}
              className={cn(
                'group relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left transition',
                mine ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40',
                closed && 'cursor-not-allowed opacity-70'
              )}
            >
              <div
                className={cn(
                  'absolute inset-y-0 left-0 -z-0 bg-primary/10 transition-all',
                  mine && 'bg-primary/20'
                )}
                style={{ width: `${ratio}%` }}
              />
              <div className="relative flex items-center justify-between gap-2">
                <span className={cn('font-medium', mine && 'text-primary')}>{opt.label}</span>
                <span className="text-xs text-muted-foreground">{count}명</span>
              </div>
              {opt.voterUids?.length > 0 && (
                <div className="relative mt-1.5 flex -space-x-1.5">
                  {opt.voterUids.slice(0, 8).map((uid) => (
                    <Avatar
                      key={uid}
                      src={memberMap[uid]?.photoURL}
                      name={memberMap[uid]?.displayName}
                      size={20}
                      className="ring-2 ring-card"
                    />
                  ))}
                  {opt.voterUids.length > 8 && (
                    <span className="ml-2 text-[11px] text-muted-foreground">
                      +{opt.voterUids.length - 8}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
