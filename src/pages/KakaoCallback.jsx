import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeKakaoCode, popKakaoReturnTo } from '@/features/auth/kakao';

export default function KakaoCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return; // StrictMode 중복 실행 방지
    ranRef.current = true;

    const code = params.get('code');
    const errCode = params.get('error');
    const errDesc = params.get('error_description');

    if (errCode) {
      setError(`카카오 로그인이 취소되었거나 오류가 발생했어요. (${errCode}${errDesc ? ': ' + errDesc : ''})`);
      return;
    }
    if (!code) {
      setError('인가 코드가 없어요.');
      return;
    }

    exchangeKakaoCode(code)
      .then(() => {
        const back = popKakaoReturnTo();
        navigate(back, { replace: true });
      })
      .catch((e) => {
        console.error(e);
        setError(e?.message ?? '로그인 처리에 실패했어요.');
      });
  }, [params, navigate]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center">
      {error ? (
        <div className="max-w-md space-y-3">
          <p className="text-destructive">{error}</p>
          <a href="/" className="inline-block text-primary underline">처음으로</a>
        </div>
      ) : (
        <p className="text-muted-foreground">카카오 로그인 중..</p>
      )}
    </div>
  );
}
