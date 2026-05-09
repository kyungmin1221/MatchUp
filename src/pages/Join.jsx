import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '@/components/AppShell';
import { useAuthLoading, useUser } from '@/features/auth/hooks';
import { joinGroup } from '@/features/group/api';
import { signInWithGoogle } from '@/features/auth/api';
import { Button } from '@/components/ui/button';

export default function Join() {
  const [params] = useSearchParams();
  const code = params.get('code');
  const matchId = params.get('matchId');
  const user = useUser();
  const loading = useAuthLoading();
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading || !user) return;

    // 상대팀 합류 링크 (matchId 포함): 자동 합류 + 매치 페이지로 이동
    if (code && matchId) {
      setStatus('joining');
      joinGroup({ inviteCode: code.toUpperCase(), uid: user.uid })
        .then((groupId) => navigate(`/groups/${groupId}/matches/${matchId}`, { replace: true }))
        .catch((e) => {
          setStatus('error');
          setError(e.message);
        });
      return;
    }

    // 친구 초대 링크: 자동 합류 X. 메인 그룹 페이지로 보내고 코드 입력 다이얼로그를 열도록 신호 전달.
    navigate('/groups', { replace: true, state: { openJoinDialog: true } });
  }, [code, matchId, user, loading, navigate]);

  if (loading) {
    return (
      <AppShell>
        <p className="text-center text-muted-foreground">확인 중…</p>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-bold">MatchUp 초대 받았어요!</h1>
        <p className="mt-2 text-muted-foreground">
          로그인 후 받은 <span className="font-mono font-semibold">초대 코드</span>를 입력해 참여하세요.
        </p>
        <Button size="lg" className="mt-6" onClick={() => signInWithGoogle()}>
          Google로 로그인
        </Button>
      </div>
    );
  }

  return (
    <AppShell>
      {status === 'error' ? (
        <p className="text-center text-destructive">{error}</p>
      ) : (
        <p className="text-center text-muted-foreground">이동 중…</p>
      )}
    </AppShell>
  );
}
