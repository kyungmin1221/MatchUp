import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, CalendarPlus, Check, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import CreateMatchDialog from '@/components/CreateMatchDialog';
import { useUser } from '@/features/auth/hooks';
import { useMembers } from '@/features/group/hooks';
import { deletePoll, votePoll } from '@/features/poll/api';
import { cn, formatDateTime } from '@/lib/utils';

export default function PollCard({ poll, group }) {
  const user = useUser();
  const isOwner = !!user && group?.ownerUid === user.uid;
  const isRecruiting = !!poll.matchId;
  const isStandaloneRecruiting = !poll.matchId && poll.options?.some((o) => o.attendance);

  const [convertOpen, setConvertOpen] = useState(false);
  const [viewersFor, setViewersFor] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const allVoterUids = useMemo(
    () => Array.from(new Set(poll.options.flatMap((o) => o.voterUids ?? []))),
    [poll]
  );
  const { data: members = [] } = useMembers(allVoterUids);
  const memberMap = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members]);

  const totalVoters = allVoterUids.length;
  const closed = poll.closesAt && poll.closesAt.toMillis() < Date.now();

  // 본인이 현재 서버에 투표한 옵션들 (단일=string|null, 복수=Set<string>)
  const myCurrentVote = useMemo(() => {
    if (!user) return poll.multi ? new Set() : null;
    if (poll.multi) {
      return new Set(
        poll.options.filter((o) => o.voterUids?.includes(user.uid)).map((o) => o.id)
      );
    }
    return poll.options.find((o) => o.voterUids?.includes(user.uid))?.id ?? null;
  }, [poll, user]);

  // 사용자가 카드에서 임시로 선택한 상태 (아직 투표 확정 전)
  const [selected, setSelected] = useState(myCurrentVote);

  // 서버 변경 시 selected 동기화 (다른 사람의 투표로 본인 응답이 바뀌진 않지만, 본인이 다른 곳에서 변경했을 때 동기화)
  useEffect(() => {
    setSelected(myCurrentVote);
  }, [myCurrentVote]);

  const handleSelect = (optionId) => {
    if (closed) return;
    if (poll.multi) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(optionId)) next.delete(optionId);
        else next.add(optionId);
        return next;
      });
    } else {
      setSelected((prev) => (prev === optionId ? null : optionId));
    }
  };

  const isSameAsCurrent = useMemo(() => {
    if (poll.multi) {
      const a = selected ?? new Set();
      const b = myCurrentVote ?? new Set();
      if (a.size !== b.size) return false;
      for (const v of a) if (!b.has(v)) return false;
      return true;
    }
    return selected === myCurrentVote;
  }, [selected, myCurrentVote, poll.multi]);

  const handleSubmit = async () => {
    if (!user || closed || submitting || isSameAsCurrent) return;
    setSubmitting(true);
    try {
      if (poll.multi) {
        const next = selected ?? new Set();
        const current = myCurrentVote ?? new Set();
        const diff = new Set([...next, ...current]);
        // diff = 변경된 옵션들 (양쪽에서 한쪽에만 있는 것)
        for (const id of diff) {
          const inNext = next.has(id);
          const inCurrent = current.has(id);
          if (inNext === inCurrent) continue;
          await votePoll({ pollId: poll.id, optionId: id, uid: user.uid, multi: true });
        }
      } else {
        // 단일: 옛 응답 제거 + 새 응답 추가는 votePoll 한 번으로 처리됨 (multi=false 로직 덕)
        if (selected) {
          await votePoll({ pollId: poll.id, optionId: selected, uid: user.uid, multi: false });
        } else if (myCurrentVote) {
          // selected = null but had previous → 응답 취소 (toggle)
          await votePoll({ pollId: poll.id, optionId: myCurrentVote, uid: user.uid, multi: false });
        }
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
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

  const isOptionSelected = (optId) => {
    if (poll.multi) return selected?.has?.(optId);
    return selected === optId;
  };

  const submitLabel = (() => {
    if (closed) return '마감됨';
    if (isSameAsCurrent) {
      const noVote = poll.multi ? !selected || selected.size === 0 : !selected;
      return noVote ? '옵션을 선택하세요' : '이미 투표함';
    }
    return myCurrentVote &&
      (poll.multi ? myCurrentVote.size > 0 : myCurrentVote)
      ? '투표 변경'
      : '투표하기';
  })();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-1.5 flex-wrap">
            {(isRecruiting || isStandaloneRecruiting) && (
              <CalendarCheck className="h-4 w-4 text-primary shrink-0" />
            )}
            <span>{poll.title}</span>
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {isRecruiting && <Badge>매치 모집</Badge>}
            {isStandaloneRecruiting && <Badge variant="outline">참석 의향</Badge>}
            {closed ? (
              <Badge variant="outline">마감</Badge>
            ) : (
              !isRecruiting && !isStandaloneRecruiting && (
                <Badge>{poll.multi ? '복수' : '단일'}</Badge>
              )
            )}
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
        {isStandaloneRecruiting && isOwner && group && (
          <div className="pt-1">
            <Button size="sm" variant="outline" onClick={() => setConvertOpen(true)}>
              <CalendarPlus className="mr-1 h-4 w-4" />
              이 투표로 매치 만들기
            </Button>
            <CreateMatchDialog
              groupId={group.id}
              fromPoll={poll}
              open={convertOpen}
              onOpenChange={setConvertOpen}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
        {poll.options.map((opt) => {
          const count = opt.voterUids?.length ?? 0;
          const ratio = totalVoters ? Math.round((count / totalVoters) * 100) : 0;
          const checked = isOptionSelected(opt.id);
          return (
            <div
              key={opt.id}
              className="relative overflow-hidden rounded-lg border bg-background"
            >
              {/* progress bar 배경 */}
              <div
                className={cn(
                  'absolute inset-y-0 left-0 transition-all',
                  checked ? 'bg-primary/25' : 'bg-primary/10'
                )}
                style={{ width: `${ratio}%` }}
              />
              <div className="relative flex items-center gap-2 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => handleSelect(opt.id)}
                  disabled={closed}
                  className="flex flex-1 items-center gap-2.5 text-left disabled:cursor-not-allowed"
                  aria-pressed={checked}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition',
                      checked
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/40 bg-transparent'
                    )}
                  >
                    {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className={cn('font-medium', checked && 'text-primary')}>
                    {opt.label}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => count > 0 && setViewersFor(opt)}
                  disabled={count === 0}
                  className="flex shrink-0 items-center gap-0.5 rounded px-1.5 py-1 text-xs text-muted-foreground transition hover:text-foreground disabled:cursor-default disabled:hover:text-muted-foreground"
                >
                  {count}명
                  {count > 0 && <ChevronDown className="h-3 w-3" />}
                </button>
              </div>
            </div>
          );
        })}

        <div className="pt-2">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={closed || submitting || isSameAsCurrent}
            className="w-full"
          >
            {submitting ? '저장 중…' : submitLabel}
          </Button>
        </div>

        <p className="pt-1 text-xs text-muted-foreground">{totalVoters}명 참여</p>
      </CardContent>

      {/* 투표자 목록 모달 */}
      <Dialog open={!!viewersFor} onOpenChange={(o) => !o && setViewersFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {viewersFor?.label} · {viewersFor?.voterUids?.length ?? 0}명
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-1 overflow-y-auto">
            {viewersFor?.voterUids?.length ? (
              viewersFor.voterUids.map((uid) => (
                <div key={uid} className="flex items-center gap-3 rounded-md px-2 py-2">
                  <Avatar
                    src={memberMap[uid]?.photoURL}
                    name={memberMap[uid]?.displayName}
                    size={32}
                  />
                  <span className="truncate text-sm">
                    {memberMap[uid]?.displayName ?? '알 수 없음'}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                아직 투표한 사람이 없어요.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
