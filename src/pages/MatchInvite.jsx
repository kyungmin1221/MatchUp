import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { useAuthLoading, useUser } from '@/features/auth/hooks';
import { signInWithGoogle } from '@/features/auth/api';
import { signInWithKakao } from '@/features/auth/kakao';
import { joinMatchByCode } from '@/features/match/api';

export default function MatchInvite() {
  const [params] = useSearchParams();
  const code = params.get('code');
  const user = useUser();
  const loading = useAuthLoading();
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null); // 'google' | 'kakao' | null
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

  const handleGoogle = async () => {
    setPending('google');
    try {
      await signInWithGoogle();
      // signInWithPopup 성공 후엔 useEffect 가 자동으로 합류 처리
    } catch (e) {
      console.error(e);
      alert('Google 로그인에 실패했어요.');
    } finally {
      setPending(null);
    }
  };

  const handleKakao = async () => {
    setPending('kakao');
    try {
      // 콜백 후 다시 이 페이지로 돌아오도록 returnTo 지정
      const returnTo = window.location.pathname + window.location.search;
      await signInWithKakao({ returnTo });
      // 이 시점에 카카오로 redirect — 코드 더는 실행 안 됨
    } catch (e) {
      console.error(e);
      alert(e?.message ?? '카카오 로그인에 실패했어요.');
      setPending(null);
    }
  };

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

        <div className="mt-6 w-full max-w-sm space-y-3">
          <Button
            size="lg"
            className="w-full h-14 text-base"
            onClick={handleGoogle}
            disabled={!!pending}
          >
            {pending === 'google' ? '로그인 중…' : 'Google 로 시작하기'}
          </Button>
          <button
            type="button"
            onClick={handleKakao}
            disabled={!!pending}
            className="w-full h-14 rounded-md bg-[#FEE500] text-[#191919] text-base font-semibold hover:brightness-95 transition disabled:opacity-60"
          >
            {pending === 'kakao' ? '로그인 중…' : '카카오로 시작하기'}
          </button>
        </div>
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
