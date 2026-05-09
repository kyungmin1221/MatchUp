import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { signInWithGoogle } from '@/features/auth/api';
import { signInWithKakao } from '@/features/auth/kakao';
import { useUser } from '@/features/auth/hooks';

export default function Landing() {
  const user = useUser();
  const navigate = useNavigate();
  const [pending, setPending] = useState(null); // 'google' | 'kakao' | null

  useEffect(() => {
    if (user) navigate('/groups', { replace: true });
  }, [user, navigate]);

  const handleGoogle = async () => {
    setPending('google');
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error(e);
      alert('Google 로그인에 실패했어요. 다시 시도해주세요.');
    } finally {
      setPending(null);
    }
  };

  const handleKakao = async () => {
    setPending('kakao');
    try {
      await signInWithKakao();
    } catch (e) {
      console.error(e);
      alert(e?.message ?? '카카오 로그인에 실패했어요. 다시 시도해주세요.');
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-10">
        <div className="mx-auto mb-5 h-20 w-20 rounded-3xl bg-primary/15 flex items-center justify-center">
          <span className="text-5xl">⚽</span>
        </div>
        <h1 className="text-5xl font-bold tracking-tight">MatchUp</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          단톡방에 흩어지는 풋살/축구 정보를<br />한곳에서 관리 해보세요 !
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
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

      <p className="mt-8 text-sm text-muted-foreground">
        모집 투표 · 일정 관리 · 포메이션 · 상대팀 공유를 한곳에서
      </p>
    </div>
  );
}
