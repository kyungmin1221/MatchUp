import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '@/components/AppShell';
import { useAuthLoading, useUser } from '@/features/auth/hooks';
import { signInWithGoogle } from '@/features/auth/api';
import { signInWithKakao } from '@/features/auth/kakao';
import { joinMatchByCode } from '@/features/match/api';
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

export default function MatchInvite() {
  const [params] = useSearchParams();
  const code = params.get('code');
  const user = useUser();
  const loading = useAuthLoading();
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);
  const [lastProvider] = useState(() => getLastProvider());
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
      <div className="min-h-[100dvh] flex flex-col items-center justify-between bg-white px-6 py-14 text-black">
        <div className="flex-1" />

        {/* 메시지 */}
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
            대항전 매치에 초대받았어요!
          </p>
          <p className="mt-2 text-sm text-gray-500">
            로그인하면 자동으로 매치에 합류해요.
          </p>
        </div>

        <div className="flex-1" />

        {/* 로그인 버튼 — 카카오 먼저 */}
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
              {pending === 'kakao' ? '로그인 중…' : '카카오로 3초만에 합류하기'}
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
              {pending === 'google' ? '로그인 중…' : 'Google로 합류하기'}
            </button>
          </div>
        </div>

        <p className="mt-10 text-xs text-gray-400">
          매치 코드 <span className="font-mono">{code}</span>
        </p>
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
