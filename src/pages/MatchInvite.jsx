import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { useAuthLoading, useUser } from '@/features/auth/hooks';
import { signInWithGoogle } from '@/features/auth/api';
import { joinMatchByCode } from '@/features/match/api';

export default function MatchInvite() {
  const [params] = useSearchParams();
  const code = params.get('code');
  const user = useUser();
  const loading = useAuthLoading();
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const ranRef = useRef(false);

  useEffect(() => {
    if (loading || !user || !code || ranRef.current) return;
    ranRef.current = true;
    setStatus('joining');
    joinMatchByCode({ awayInviteCode: code.toUpperCase(), uid: user.uid })
      .then((matchId) => navigate(`/groups/_/matches/${matchId}`, { replace: true }))
      .catch((e) => {
        setStatus('error');
        setError(e.message);
      });
  }, [code, user, loading, navigate]);

  if (!code) {
    return (
      <AppShell>
        <p className="text-center text-muted-foreground">유효하지 않은 매치 합류 링크예요.</p>
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
        <h1 className="text-2xl font-bold">대항전 매치에 초대받았어요!</h1>
        <p className="mt-2 text-muted-foreground">
          로그인하면 자동으로 매치에 합류해요.
        </p>
        <Button size="lg" className="mt-6" onClick={() => signInWithGoogle()}>
          Google로 로그인하고 합류
        </Button>
      </div>
    );
  }

  return (
    <AppShell>
      {status === 'error' ? (
        <p className="text-center text-destructive">{error}</p>
      ) : (
        <p className="text-center text-muted-foreground">매치에 합류하는 중…</p>
      )}
    </AppShell>
  );
}
