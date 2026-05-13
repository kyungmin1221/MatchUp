import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, MessageSquare, Plus, Swords } from 'lucide-react';
import AppShell from '@/components/AppShell';
import IntroDialog from '@/components/IntroDialog';
import FeedbackDialog from '@/components/FeedbackDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { useUser } from '@/features/auth/hooks';
import { useMyGroups } from '@/features/group/hooks';
import { useMyAwayMatches } from '@/features/match/hooks';
import { createGroup, joinGroup } from '@/features/group/api';
import { formatDateTime } from '@/lib/utils';

export default function Groups() {
  const user = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { groups, loading } = useMyGroups();
  const { matches: awayMatches } = useMyAwayMatches();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  // 초대 링크에서 넘어온 경우 코드 입력 다이얼로그 자동 오픈 + URL 의 코드를 prefill
  useEffect(() => {
    if (location.state?.openJoinDialog) {
      setJoinOpen(true);
      if (location.state.inviteCode) {
        setCode(String(location.state.inviteCode).toUpperCase());
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const groupId = await createGroup({ name: name.trim(), ownerUid: user.uid });
      setCreateOpen(false);
      setName('');
      // freshlyCreated 시그널 — GroupDetail 이 자동으로 초대 메시지 미리보기 다이얼로그를 띄움
      navigate(`/groups/${groupId}`, { state: { freshlyCreated: true } });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    try {
      const groupId = await joinGroup({ inviteCode: code.trim().toUpperCase(), uid: user.uid });
      setJoinOpen(false);
      setCode('');
      navigate(`/groups/${groupId}`);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <AppShell>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">내 그룹</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setIntroOpen(true)}>
            <BookOpen className="mr-1 h-4 w-4" /> 가이드
          </Button>
          <Button variant="outline" onClick={() => setFeedbackOpen(true)}>
            <MessageSquare className="mr-1 h-4 w-4" /> 피드백
          </Button>
          <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">코드로 참여</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>초대 코드로 그룹 참여</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleJoin} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="invite-code">초대 코드</Label>
                  <Input
                    id="invite-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="ABC123"
                    autoCapitalize="characters"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">참여</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" /> 새 그룹
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 그룹 만들기</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="group-name">그룹 이름</Label>
                  <Input
                    id="group-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예) 토요 풋살팟"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">만들기</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <p className="text-base text-muted-foreground">불러오는 중…</p>
      ) : groups.length === 0 ? (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-2xl">👋</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              어서오세요!
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              친구들과 풋살·축구 모임을 한곳에 모으는 곳이에요.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="group flex flex-col items-start gap-2 rounded-xl border-2 border-primary/40 bg-primary/5 p-5 text-left transition hover:border-primary hover:bg-primary/10"
            >
              <span className="text-3xl">⚽</span>
              <span className="text-base font-bold text-foreground">새 그룹 만들기</span>
              <span className="text-xs text-muted-foreground">
                정기 풋살팟 · 사내 축구회 등 친구 모임. 친구는 나중에 초대해도 OK.
              </span>
              <span className="mt-1 text-xs font-semibold text-primary">
                시작하기 →
              </span>
            </button>

            <button
              type="button"
              onClick={() => setJoinOpen(true)}
              className="group flex flex-col items-start gap-2 rounded-xl border-2 border-border bg-background p-5 text-left transition hover:border-primary/40 hover:bg-secondary/30"
            >
              <span className="text-3xl">📨</span>
              <span className="text-base font-bold text-foreground">초대 코드로 참여</span>
              <span className="text-xs text-muted-foreground">
                친구한테 받은 초대 코드(예: ABC123)가 있다면 여기로.
              </span>
              <span className="mt-1 text-xs font-semibold text-foreground/70">
                코드 입력하기 →
              </span>
            </button>
          </div>

          <p className="rounded-md border border-border bg-secondary/30 p-3 text-center text-xs text-muted-foreground">
            💡 혼자서 매치를 한 번 만들어보고 그 다음에 친구를 불러도 돼요. 부담 없이 시작해보세요.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <Link key={g.id} to={`/groups/${g.id}`}>
              <Card className="transition hover:border-primary/50">
                <CardHeader>
                  <CardTitle className="text-xl">{g.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-base text-muted-foreground">
                  멤버 {g.memberUids?.length ?? 0}명 · 코드 {g.inviteCode}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {awayMatches.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Swords className="h-5 w-5" /> 대결 요청
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">
            다른 그룹의 매치에 상대팀으로 합류한 매치들이에요.
          </p>
          <div className="space-y-3">
            {awayMatches.map((m) => (
              <Link key={m.id} to={`/groups/_/matches/${m.id}`}>
                <Card className="transition hover:border-primary/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{m.title}</CardTitle>
                      <Badge variant="outline">상대팀</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {m.scheduledAt && <p>{formatDateTime(m.scheduledAt)}</p>}
                    {m.location && <p>📍 {m.location}</p>}
                    <p>👥 우리 {m.awayTeam?.playerUids?.length ?? 0}명 · 상대 {m.homeTeam?.playerUids?.length ?? 0}명</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <IntroDialog open={introOpen} onOpenChange={setIntroOpen} />
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </AppShell>
  );
}
