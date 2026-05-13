import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '@/features/auth/api';
import { signInWithKakao } from '@/features/auth/kakao';
import { useUser } from '@/features/auth/hooks';
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

export default function Landing() {
  const user = useUser();
  const navigate = useNavigate();
  const [pending, setPending] = useState(null);
  const [lastProvider] = useState(() => getLastProvider());

  useEffect(() => {
    if (user) navigate('/groups', { replace: true });
  }, [user, navigate]);

  const handleGoogle = async () => {
    setPending('google');
    setLastProvider('google');
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
    setLastProvider('kakao');
    try {
      await signInWithKakao();
    } catch (e) {
      console.error(e);
      alert(e?.message ?? '카카오 로그인에 실패했어요. 다시 시도해주세요.');
      setPending(null);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-between bg-white px-6 py-14 text-black">
      {/* spacer */}
      <div className="flex-1" />

      {/* 로고 + 카피 */}
      <div className="text-center">
        <h1
          className="text-7xl font-black italic tracking-tighter"
          style={{
            fontFamily:
              '"Pretendard", -apple-system, BlinkMacSystemFont, sans-serif',
          }}
        >
          MatchLink
        </h1>
        <p className="mt-6 text-base text-gray-500">
          단톡에 흩어진 풋살 & 축구 약속
          <br />한 페이지로 다시 모아요
        </p>
      </div>

      <div className="flex-1" />

      {/* 로그인 버튼 */}
      <div className="w-full max-w-sm space-y-3">
        {/* 카카오 — 최근 로그인 뱃지 포함 가능 */}
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

        {/* Google */}
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

      {/* 푸터 */}
      <p className="mt-10 text-xs text-gray-400">
        모집 투표 · 일정 · 명단 · 포메이션 · 상대팀 공유를 한곳에서
      </p>
    </div>
  );
}
