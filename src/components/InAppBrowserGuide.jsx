import { useState } from 'react';
import { Copy, ExternalLink, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  copyCurrentUrl,
  isAndroid,
  isIOS,
  tryEscapeInAppBrowser
} from '@/lib/inAppBrowser';

export default function InAppBrowserGuide({ source }) {
  const [copied, setCopied] = useState(false);
  const android = isAndroid();
  const ios = isIOS();

  const sourceLabel = {
    kakaotalk: '카카오톡',
    line: '라인',
    facebook: '페이스북',
    instagram: '인스타그램',
    naver: '네이버'
  }[source] ?? '인앱';

  const handleCopy = async () => {
    const ok = await copyCurrentUrl();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
        <MessageCircle className="h-8 w-8 text-primary" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight">
        {sourceLabel} 안에선 로그인이 안 돼요
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        보안 정책상 인앱 브라우저에서는 Google·카카오 로그인이 동작하지 않아요.
        외부 브라우저(Safari·Chrome)에서 같은 주소를 열어주세요.
      </p>

      <div className="mt-8 w-full max-w-sm space-y-3">
        {android && (
          <Button size="lg" className="w-full h-12" onClick={tryEscapeInAppBrowser}>
            <ExternalLink className="mr-2 h-4 w-4" /> Chrome 으로 열기
          </Button>
        )}

        {ios && (
          <div className="rounded-lg border border-border/60 bg-card p-4 text-left text-sm">
            <p className="font-medium">Safari 로 여는 법</p>
            <ol className="mt-2 space-y-1 list-decimal pl-5 text-muted-foreground">
              <li>화면 우하단 <span className="rounded bg-secondary px-1.5 py-0.5">↗ 공유</span> 아이콘 탭</li>
              <li><strong>"Safari로 열기"</strong> 선택</li>
            </ol>
          </div>
        )}

        <Button size="lg" variant="outline" className="w-full h-12" onClick={handleCopy}>
          <Copy className="mr-2 h-4 w-4" /> {copied ? '복사됨!' : '주소 복사'}
        </Button>
        {copied && (
          <p className="text-xs text-muted-foreground">
            복사된 주소를 Safari·Chrome 주소창에 붙여넣어 주세요.
          </p>
        )}
      </div>
    </div>
  );
}
