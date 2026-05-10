import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Users } from 'lucide-react';
import AppShell from '@/components/AppShell';
import IntroDialog from '@/components/IntroDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { createGroup, joinGroup } from '@/features/group/api';

export default function Groups() {
  const user = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { groups, loading } = useMyGroups();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  // 초대 링크에서 넘어온 경우 코드 입력 다이얼로그 자동 오픈 (코드는 비워둔 채)
  useEffect(() => {
    if (location.state?.openJoinDialog) {
      setJoinOpen(true);
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
      navigate(`/groups/${groupId}`);
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
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-lg font-medium">아직 그룹이 없어요</p>
              <p className="text-base text-muted-foreground">
                새 그룹을 만들거나 친구의 초대 코드로 참여하세요.
              </p>
            </div>
          </CardContent>
        </Card>
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

      <IntroDialog open={introOpen} onOpenChange={setIntroOpen} />
    </AppShell>
  );
}
