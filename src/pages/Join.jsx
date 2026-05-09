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
  const user = useUser();
  const loading = useAuthLoading();
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const matchId = params.get('matchId');

  useEffect(() => {
    if (!code || loading || !user) return;
    setStatus('joining');
    joinGroup({ inviteCode: code.toUpperCase(), uid: user.uid })
      .then((groupId) => {
        const dest = matchId
          ? `/groups/${groupId}/matches/${matchId}`
          : `/groups/${groupId}`;
        navigate(dest, { replace: true });
      })
      .catch((e) => {
        setStatus('error');
        setError(e.message);
      });
  }, [code, matchId, user, loading, navigate]);

  if (!code) {
    return (
      <AppShell>
        <p className="text-center text-muted-foreground">유효하지 않은 초대 링크예요.</p>
      </AppShell>
    );
  }

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
        <h1 className="text-2xl font-bold">초대 받았어요!</h1>
        <p className="mt-2 text-muted-foreground">
          코드: <span className="font-mono font-semibold">{code}</span>
        </p>
        <Button size="lg" className="mt-6" onClick={() => signInWithGoogle()}>
          Google로 로그인하고 참여
        </Button>
      </div>
    );
  }

  return (
    <AppShell>
      {status === 'error' ? (
        <p className="text-center text-destructive">{error}</p>
      ) : (
        <p className="text-center text-muted-foreground">그룹에 참여하는 중…</p>
      )}
    </AppShell>
  );
}
