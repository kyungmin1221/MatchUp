import { Link, useParams } from 'react-router-dom';
import { Calendar, Copy, Plus, Vote } from 'lucide-react';
import AppShell from '@/components/AppShell';
import PollCard from '@/components/PollCard';
import CreatePollDialog from '@/components/CreatePollDialog';
import CreateMatchDialog from '@/components/CreateMatchDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useGroup, useMembers } from '@/features/group/hooks';
import { useGroupPolls } from '@/features/poll/hooks';
import { useGroupMatches } from '@/features/match/hooks';
import { formatDateTime } from '@/lib/utils';

export default function GroupDetail() {
  const { groupId } = useParams();
  const { group, loading } = useGroup(groupId);
  const { polls } = useGroupPolls(groupId);
  const { matches } = useGroupMatches(groupId);
  const { data: members = [] } = useMembers(group?.memberUids);

  const copyInvite = async () => {
    if (!group) return;
    const url = `${window.location.origin}/join?code=${group.inviteCode}`;
    await navigator.clipboard.writeText(url);
    alert('초대 링크를 복사했어요!');
  };

  if (loading) {
    return (
      <AppShell>
        <p className="text-muted-foreground">불러오는 중…</p>
      </AppShell>
    );
  }
  if (!group) {
    return (
      <AppShell>
        <p>그룹을 찾을 수 없어요.</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{group.name}</h1>
          <p className="text-sm text-muted-foreground">멤버 {group.memberUids.length}명</p>
        </div>
        <Button variant="outline" size="sm" onClick={copyInvite}>
          <Copy className="mr-1 h-4 w-4" /> 초대 링크
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-1.5 rounded-full bg-secondary px-2 py-1 text-xs">
            <Avatar src={m.photoURL} name={m.displayName} size={18} />
            <span>{m.displayName}</span>
          </div>
        ))}
      </div>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Vote className="h-5 w-5" /> 투표
          </h2>
          <CreatePollDialog
            groupId={groupId}
            trigger={
              <Button size="sm" variant="outline">
                <Plus className="mr-1 h-4 w-4" /> 새 투표
              </Button>
            }
          />
        </div>
        {polls.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              아직 진행 중인 투표가 없어요.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {polls.map((p) => (
              <PollCard key={p.id} poll={p} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Calendar className="h-5 w-5" /> 매치
          </h2>
          <CreateMatchDialog
            groupId={groupId}
            trigger={
              <Button size="sm" variant="outline">
                <Plus className="mr-1 h-4 w-4" /> 새 매치
              </Button>
            }
          />
        </div>
        {matches.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              예정된 매치가 없어요.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {matches.map((m) => (
              <Link key={m.id} to={`/groups/${groupId}/matches/${m.id}`}>
                <Card className="transition hover:border-primary/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{m.title}</CardTitle>
                      {m.opponentMatchId && <Badge variant="default">상대팀 연결</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {m.scheduledAt && <p>📅 {formatDateTime(m.scheduledAt)}</p>}
                    {m.location && <p>📍 {m.location}</p>}
                    <p>👥 {m.homeTeam.playerUids.length}명 참가</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
