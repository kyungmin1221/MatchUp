import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Copy, LogOut, Plus, Trash2, Vote } from 'lucide-react';
import AppShell from '@/components/AppShell';
import PollCard from '@/components/PollCard';
import CreatePollDialog from '@/components/CreatePollDialog';
import CreateMatchDialog from '@/components/CreateMatchDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/features/auth/hooks';
import { useGroup, useMembers } from '@/features/group/hooks';
import { deleteGroup, leaveGroup } from '@/features/group/api';
import { useGroupPolls } from '@/features/poll/hooks';
import { useGroupMatches } from '@/features/match/hooks';
import { formatDateTime } from '@/lib/utils';

export default function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const user = useUser();
  const { group, loading } = useGroup(groupId);
  const { polls } = useGroupPolls(groupId);
  const { matches } = useGroupMatches(groupId);
  const { data: members = [] } = useMembers(group?.memberUids);

  const isOwner = !!user && group?.ownerUid === user.uid;

  const copyInvite = async () => {
    if (!group) return;
    const url = `${window.location.origin}/join?code=${group.inviteCode}`;
    const text = `[MatchUp] "${group.name}" 그룹에 초대합니다.\n초대 코드: ${group.inviteCode}\n앱 열기: ${url}`;
    await navigator.clipboard.writeText(text);
    alert('초대 메시지를 복사했어요. 친구에게 붙여넣기해서 보내주세요.');
  };

  const handleDeleteGroup = async () => {
    if (!group) return;
    if (
      !confirm(
        `"${group.name}" 그룹을 삭제할까요?\n그룹 안의 모든 투표·매치도 함께 삭제되고 되돌릴 수 없어요.`
      )
    )
      return;
    try {
      await deleteGroup({ groupId });
      navigate('/groups', { replace: true });
    } catch (e) {
      alert(e.message ?? '그룹 삭제에 실패했어요.');
    }
  };

  const handleLeaveGroup = async () => {
    if (!group || !user) return;
    if (!confirm(`"${group.name}" 그룹에서 나갈까요?`)) return;
    try {
      await leaveGroup({ groupId, uid: user.uid });
      navigate('/groups', { replace: true });
    } catch (e) {
      alert(e.message ?? '그룹에서 나가기에 실패했어요.');
    }
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
      <div className="mb-4">
        <Link
          to="/groups"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> 내 그룹
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{group.name}</h1>
          <p className="text-sm text-muted-foreground">
            멤버 {group.memberUids.length}명
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={copyInvite}>
            <Copy className="mr-1 h-4 w-4" /> 초대 링크
          </Button>
          {isOwner ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteGroup}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="mr-1 h-4 w-4" /> 그룹 삭제
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLeaveGroup}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="mr-1 h-4 w-4" /> 그룹 나가기
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-1.5 rounded-full bg-secondary px-2 py-1 text-xs"
          >
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
              <PollCard key={p.id} poll={p} group={group} />
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
                      {m.opponentMatchId && (
                        <Badge variant="default">상대팀 연결</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {m.scheduledAt && <p> {formatDateTime(m.scheduledAt)}</p>}
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
