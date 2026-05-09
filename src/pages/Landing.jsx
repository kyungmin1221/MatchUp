import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { signInWithGoogle } from '@/features/auth/api';
import { useUser } from '@/features/auth/hooks';

export default function Landing() {
  const user = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/groups', { replace: true });
  }, [user, navigate]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error(e);
      alert('로그인에 실패했어요. 다시 시도해주세요.');
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-8">
        <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center">
          <span className="text-3xl">⚽</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">MatchUp</h1>
        <p className="mt-2 text-muted-foreground">
          단톡방에 흩어지는 풋살 정보를<br />한 곳에 모아요.
        </p>
      </div>
      <Button size="lg" className="w-full max-w-xs" onClick={handleLogin}>
        Google로 시작하기
      </Button>
      <p className="mt-6 text-xs text-muted-foreground">
        모집 투표 · 일정 관리 · 포메이션 · 상대팀 공유
      </p>
    </div>
  );
}
