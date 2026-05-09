export default function SetupGuide() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center bg-background text-foreground">
      <div className="max-w-lg space-y-4">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center text-3xl">
          ⚙️
        </div>
        <h1 className="text-2xl font-bold">Firebase 설정이 필요해요</h1>
        <p className="text-sm text-muted-foreground">
          프로젝트 루트의 <code className="rounded bg-secondary px-1.5 py-0.5">.env.local</code> 파일에
          Firebase 웹 SDK 값을 채운 뒤 dev 서버를 다시 시작해주세요.
        </p>
        <pre className="rounded-lg bg-secondary p-4 text-left text-xs leading-relaxed overflow-auto">
{`VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=`}
        </pre>
        <div className="space-y-2 rounded-lg border border-border/60 bg-card p-4 text-left text-sm">
          <p className="font-medium">값 얻는 방법</p>
          <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                Firebase Console
              </a>{' '}
              → 새 프로젝트 생성
            </li>
            <li>Authentication → Google 프로바이더 활성화</li>
            <li>Firestore Database 생성 (asia-northeast3 권장)</li>
            <li>프로젝트 설정 → 내 앱 → 웹(▷) 추가 → 표시되는 config를 복사</li>
            <li>
              <code className="rounded bg-secondary px-1 py-0.5">.env.local</code>에 붙여넣고{' '}
              <code className="rounded bg-secondary px-1 py-0.5">npm run dev</code> 재실행
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
