import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Copy,
  LogOut,
  MessageSquare,
  Plus,
  Trash2
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import PollCard from '@/components/PollCard';
import CreatePollDialog from '@/components/CreatePollDialog';
import CreateMatchDialog from '@/components/CreateMatchDialog';
import IntroDialog, { hasSeenIntro, markIntroSeen } from '@/components/IntroDialog';
import MembersDialog from '@/components/MembersDialog';
import KickoffHero from '@/components/KickoffHero';
import { getMomPhase, tallyMom } from '@/features/match/mom';
import { ChevronDown } from 'lucide-react';
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

  // 매치에 연결된 모집 투표는 매치 상세에서 표시. 그 외 (일반 의견 + 매치 미연결 단독 모집)는 여기서.
  const opinionPolls = useMemo(() => polls.filter((p) => !p.matchId), [polls]);
  // 매치별 모집 투표 매핑 (매치 카드의 모집 인원 표시용)
  const recruitingByMatch = useMemo(() => {
    const map = {};
    polls.forEach((p) => {
      if (p.matchId) map[p.matchId] = p;
    });
    return map;
  }, [polls]);
  // 가장 가까운 미래 매치 (Kick-off 히어로용)
  const nextMatch = useMemo(() => {
    const cutoff = Date.now() - 4 * 3600 * 1000; // 매치 시작 4시간 전까지는 'next' 로 노출
    return matches
      .map((m) => ({
        m,
        ms: m.scheduledAt?.toMillis?.() ?? (m.scheduledAt ? new Date(m.scheduledAt).getTime() : 0)
      }))
      .filter(({ ms }) => ms > cutoff)
      .sort((a, b) => a.ms - b.ms)[0]?.m;
  }, [matches]);
  const { data: members = [] } = useMembers(group?.memberUids);

  const isOwner = !!user && group?.ownerUid === user.uid;

  // 처음 그룹에 들어온 사용자에게 한 번만 자동으로 가이드를 띄움
  const [introOpen, setIntroOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  useEffect(() => {
    if (!hasSeenIntro()) {
      setIntroOpen(true);
      markIntroSeen();
    }
  }, []);

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
          <Button variant="outline" size="sm" onClick={() => setIntroOpen(true)}>
            <BookOpen className="mr-1 h-4 w-4" /> 가이드
          </Button>
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

      <button
        type="button"
        onClick={() => setMembersOpen(true)}
        className="mb-6 inline-flex items-center gap-3 rounded-full border bg-secondary/40 px-3 py-2 text-sm transition hover:border-primary/40"
      >
        <div className="flex -space-x-2">
          {members.slice(0, 5).map((m) => (
            <Avatar
              key={m.id}
              src={m.photoURL}
              name={m.displayName}
              size={28}
              className="ring-2 ring-background"
            />
          ))}
          {members.length === 0 && (
            <span className="text-xs text-muted-foreground">멤버 정보 불러오는 중…</span>
          )}
        </div>
        {members.length > 0 && (
          <span className="flex items-center gap-1 text-foreground">
            {members.length}명
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
        )}
      </button>

      <MembersDialog
        open={membersOpen}
        onOpenChange={setMembersOpen}
        members={members}
        ownerUid={group.ownerUid}
        currentUserUid={user?.uid}
      />

      {nextMatch && (
        <KickoffHero
          match={nextMatch}
          onClick={() => navigate(`/groups/${groupId}/matches/${nextMatch.id}`)}
        />
      )}

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Calendar className="h-5 w-5" /> 매치 관리
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
            {matches.map((m) => {
              const recruitingPoll = recruitingByMatch[m.id];
              const attendCount =
                recruitingPoll?.options?.find((o) => o.attendance)?.voterUids?.length ?? 0;
              const momPhase = getMomPhase(m).phase;
              const iAmMom =
                momPhase === 'closed' &&
                !!user &&
                tallyMom(m.momVotes).winners.includes(user.uid);
              return (
                <Link key={m.id} to={`/groups/${groupId}/matches/${m.id}`}>
                  <Card className="transition hover:border-primary/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{m.title}</CardTitle>
                        <div className="flex flex-wrap gap-1">
                          {iAmMom && (
                            <Badge className="bg-amber-400 text-amber-950 hover:bg-amber-400">
                              🏆 MOM
                            </Badge>
                          )}
                          {recruitingPoll && <Badge>모집 중 · {attendCount}명</Badge>}
                          {m.opponentMatchId && <Badge variant="outline">대항전</Badge>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      {m.scheduledAt && <p>{formatDateTime(m.scheduledAt)}</p>}
                      {m.location && <p>📍 {m.location}</p>}
                      <p>👥 {m.homeTeam.playerUids.length}명 참가</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <MessageSquare className="h-5 w-5" /> 투표
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
        <p className="mb-3 text-xs text-muted-foreground">
          새 매치 생성 시에도 투표를 만들 수 있어요. 
        </p>
        {opinionPolls.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              아직 의견 투표가 없어요.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {opinionPolls.map((p) => (
              <PollCard key={p.id} poll={p} group={group} />
            ))}
          </div>
        )}
      </section>

      <IntroDialog open={introOpen} onOpenChange={setIntroOpen} />
    </AppShell>
  );
}
