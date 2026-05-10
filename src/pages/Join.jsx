import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '@/components/AppShell';
import { useAuthLoading, useUser } from '@/features/auth/hooks';
import { signInWithGoogle } from '@/features/auth/api';
import { Button } from '@/components/ui/button';

// 그룹 초대 링크 (`/join?code=ABC123`) 처리.
// 자동 합류는 안 하고, 메인 그룹 페이지로 이동시키며 코드 입력 다이얼로그를 자동 오픈.
export default function Join() {
  const [params] = useSearchParams();
  const code = params.get('code');
  const user = useUser();
  const loading = useAuthLoading();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    navigate('/groups', { replace: true, state: { openJoinDialog: true } });
  }, [code, user, loading, navigate]);

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
      <p className="text-center text-muted-foreground">이동 중…</p>
    </AppShell>
  );
}
