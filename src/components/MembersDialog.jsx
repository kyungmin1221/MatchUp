import { useMemo, useState } from 'react';
import { Crown, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function MembersDialog({
  open,
  onOpenChange,
  members = [],
  ownerUid,
  currentUserUid
}) {
  const [q, setQ] = useState('');

  const sorted = useMemo(() => {
    return [...members].sort((a, b) => {
      if (a.id === ownerUid) return -1;
      if (b.id === ownerUid) return 1;
      if (a.id === currentUserUid) return -1;
      if (b.id === currentUserUid) return 1;
      return (a.displayName ?? '').localeCompare(b.displayName ?? '', 'ko');
    });
  }, [members, ownerUid, currentUserUid]);

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return sorted;
    return sorted.filter((m) => (m.displayName ?? '').toLowerCase().includes(k));
  }, [sorted, q]);

  const showSearch = members.length >= 6;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>멤버 {members.length}명</DialogTitle>
        </DialogHeader>

        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="이름 검색"
              className="pl-9"
            />
          </div>
        )}

        <div className="max-h-[60vh] space-y-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              검색 결과가 없어요.
            </p>
          ) : (
            filtered.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-md px-2 py-2"
              >
                <Avatar src={m.photoURL} name={m.displayName} size={36} />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {m.displayName ?? '익명'}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  {m.id === ownerUid && (
                    <Badge className="gap-1">
                      <Crown className="h-3 w-3" />
                      방장
                    </Badge>
                  )}
                  {m.id === currentUserUid && (
                    <Badge variant="outline">나</Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
