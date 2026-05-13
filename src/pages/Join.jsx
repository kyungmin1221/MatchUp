import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '@/components/AppShell';
import { useAuthLoading, useUser } from '@/features/auth/hooks';
import { signInWithGoogle } from '@/features/auth/api';
import { signInWithKakao } from '@/features/auth/kakao';
import { GoogleIcon, KakaoIcon } from '@/components/BrandIcons';

const LAST_PROVIDER_KEY = 'matchup.lastLoginProvider';

function getLastProvider() {
  try {
    return localStorage.getItem(LAST_PROVIDER_KEY);
  } catch {
    return null;
  }
}

function setLastProvider(p) {
  try {
    localStorage.setItem(LAST_PROVIDER_KEY, p);
  } catch {
    /* noop */
  }
}

// 그룹 초대 링크 (`/join?code=ABC123`) 처리.
// 자동 합류는 안 하고, 메인 그룹 페이지로 이동시키며 코드 입력 다이얼로그를 자동 오픈.
export default function Join() {
  const [params] = useSearchParams();
  const code = params.get('code');
  const user = useUser();
  const loading = useAuthLoading();
  const navigate = useNavigate();
  const [pending, setPending] = useState(null);
  const [lastProvider] = useState(() => getLastProvider());

  useEffect(() => {
    if (loading || !user) return;
    navigate('/groups', {
      replace: true,
      state: { openJoinDialog: true, inviteCode: code ?? '' }
    });
  }, [code, user, loading, navigate]);

  const handleGoogle = async () => {
    setPending('google');
    setLastProvider('google');
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error(e);
      alert('Google 로그인에 실패했어요.');
    } finally {
      setPending(null);
    }
  };

  const handleKakao = async () => {
    setPending('kakao');
    setLastProvider('kakao');
    try {
      const returnTo = window.location.pathname + window.location.search;
      await signInWithKakao({ returnTo });
    } catch (e) {
      console.error(e);
      alert(e?.message ?? '카카오 로그인에 실패했어요.');
      setPending(null);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <p className="text-center text-muted-foreground">확인 중…</p>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-between bg-white px-6 py-14 text-black">
        <div className="flex-1" />

        <div className="text-center">
          <h1
            className="text-5xl font-black italic tracking-tighter"
            style={{
              fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, sans-serif'
            }}
          >
            MatchLink
          </h1>
          <p className="mt-6 text-base text-gray-700 font-medium">
            그룹에 초대받았어요!
          </p>
          <p className="mt-2 text-sm text-gray-500">
            로그인 후 받은 초대 코드를 입력해 합류하세요.
          </p>
        </div>

        <div className="flex-1" />

        <div className="w-full max-w-sm space-y-3">
          <div className="relative">
            {lastProvider === 'kakao' && (
              <span className="absolute -top-3 right-4 z-10 rounded-full bg-emerald-400 px-2.5 py-0.5 text-[11px] font-medium text-white shadow">
                최근 로그인
              </span>
            )}
            <button
              type="button"
              onClick={handleKakao}
              disabled={!!pending}
              className="inline-flex w-full h-14 items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-[#191919] text-base font-bold hover:brightness-95 transition disabled:opacity-60"
            >
              <KakaoIcon className="h-5 w-5" />
              {pending === 'kakao' ? '로그인 중…' : '카카오로 3초만에 시작하기'}
            </button>
          </div>

          <div className="relative">
            {lastProvider === 'google' && (
              <span className="absolute -top-3 right-4 z-10 rounded-full bg-emerald-400 px-2.5 py-0.5 text-[11px] font-medium text-white shadow">
                최근 로그인
              </span>
            )}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={!!pending}
              className="inline-flex w-full h-14 items-center justify-center gap-2 rounded-xl bg-white text-[#1f1f1f] text-base font-medium ring-1 ring-black/15 hover:bg-gray-50 transition disabled:opacity-60"
            >
              <GoogleIcon className="h-5 w-5" />
              {pending === 'google' ? '로그인 중…' : 'Google로 시작하기'}
            </button>
          </div>
        </div>

        {code && (
          <p className="mt-10 text-xs text-gray-400">
            초대 코드 <span className="font-mono">{code.toUpperCase()}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <AppShell>
      <p className="text-center text-muted-foreground">이동 중…</p>
    </AppShell>
  );
}
