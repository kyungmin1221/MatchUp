import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

// MOM 투표 다이얼로그.
// candidates 는 본인 팀(home or away) 의 참가자 배열.
// myVote 는 현재 본인이 투표한 uid (없으면 null).
// onVote(uid) — 투표 확정.
// onDismiss — 닫기 (다시 안 띄움; 상단 배너로 진입 가능).
export default function MomDialog({
  open,
  onOpenChange,
  candidates,
  myVote,
  matchTitle,
  isMyselfCandidate,
  onVote,
  onDismiss,
  readOnly = false
}) {
  const [selected, setSelected] = useState(myVote);
  useEffect(() => {
    if (open) setSelected(myVote);
  }, [open, myVote]);

  const canSubmit = !!selected && selected !== myVote && !readOnly;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            MOM 투표
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{matchTitle}</span> 의 오늘의 선수를 골라주세요.
            {isMyselfCandidate && ' (본인 표는 집계에서 자동 제외돼요.)'}
          </p>
        </DialogHeader>

        <div className="max-h-[55vh] space-y-1.5 overflow-y-auto">
          {candidates.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              투표할 참가자가 없어요.
            </p>
          ) : (
            candidates.map((p) => {
              const checked = selected === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={readOnly}
                  onClick={() => setSelected(p.id)}
                  className={
                    checked
                      ? 'flex w-full items-center gap-3 rounded-md border border-primary bg-primary/10 p-2.5 text-left'
                      : 'flex w-full items-center gap-3 rounded-md border border-border bg-background p-2.5 text-left hover:border-primary/40'
                  }
                >
                  <Avatar src={p.photoURL} name={p.displayName} size={32} />
                  <span className="flex-1 text-sm font-medium">{p.displayName}</span>
                  <span
                    className={
                      checked
                        ? 'inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary bg-primary'
                        : 'inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-muted-foreground/40'
                    }
                  >
                    {checked && <span className="h-2 w-2 rounded-full bg-primary-foreground" />}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <DialogFooter>
          {!readOnly && (
            <Button variant="ghost" onClick={onDismiss}>
              나중에
            </Button>
          )}
          <Button
            disabled={!canSubmit}
            onClick={() => selected && onVote(selected)}
          >
            {myVote ? '투표 변경' : '투표하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
