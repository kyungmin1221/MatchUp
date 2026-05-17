import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
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
import InviteShareDialog from '@/components/InviteShareDialog';
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
  const location = useLocation();
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
  // 단, 방금 그룹을 만든 경우(freshlyCreated)에는 축하/공유 다이얼로그가 우선. 가이드는 다음 진입 때 보임.
  const [introOpen, setIntroOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteVariant, setInviteVariant] = useState('share');
  const freshlyCreated = !!location.state?.freshlyCreated;

  useEffect(() => {
    if (freshlyCreated) {
      setInviteVariant('celebration');
      setInviteOpen(true);
      // history state 비우기 — 새로고침 시 또 뜨지 않게
      navigate(location.pathname, { replace: true, state: {} });
    } else if (!hasSeenIntro()) {
      setIntroOpen(true);
      markIntroSeen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openShareDialog = () => {
    setInviteVariant('share');
    setInviteOpen(true);
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
          <Button variant="outline" size="sm" onClick={openShareDialog}>
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
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <EmptyMatchIllustration />
              <div className="space-y-1">
                <p className="font-medium">아직 만든 매치가 없어요</p>
                <p className="text-sm text-muted-foreground">
                  첫 매치를 만들고 친구들을 초대해보세요
                </p>
              </div>
              <CreateMatchDialog
                groupId={groupId}
                trigger={
                  <Button size="sm">
                    <Plus className="mr-1 h-4 w-4" /> 첫 매치 만들기
                  </Button>
                }
              />
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
      <InviteShareDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        group={group}
        variant={inviteVariant}
      />
    </AppShell>
  );
}

function EmptyMatchIllustration() {
  return (
    <svg
      viewBox="0 0 180 130"
      className="h-24 w-auto"
      aria-hidden="true"
    >
      {/* 잔디 그림자 */}
      <ellipse cx="90" cy="115" rx="60" ry="6" fill="hsl(142 60% 40% / 0.18)" />
      {/* 페널티 박스 라인 (낮은 대비) */}
      <path
        d="M30 110 L30 75 L150 75 L150 110"
        fill="none"
        stroke="hsl(142 50% 40% / 0.35)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      {/* 공 */}
      <circle
        cx="90"
        cy="62"
        r="32"
        fill="white"
        stroke="hsl(220 25% 20%)"
        strokeWidth="2.5"
      />
      {/* 중앙 오각형 */}
      <path
        d="M90 44 L106 56 L100 75 L80 75 L74 56 Z"
        fill="hsl(220 25% 20%)"
      />
      {/* 외곽 솔기 */}
      <path d="M90 44 L90 28" stroke="hsl(220 25% 20%)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M106 56 L120 53" stroke="hsl(220 25% 20%)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M100 75 L110 90" stroke="hsl(220 25% 20%)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M80 75 L70 90" stroke="hsl(220 25% 20%)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M74 56 L60 53" stroke="hsl(220 25% 20%)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
