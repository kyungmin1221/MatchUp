# MatchUp

친구들과 풋살/축구 모임을 한 곳에서 관리하는 PWA. 모집 투표 → 매치 일정 → 명단·포메이션 → 상대팀 공유.

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # 그리고 Firebase 값 채우기
npm run dev
```

Firebase 값을 채우지 않으면 첫 화면에서 "Firebase 설정이 필요해요" 안내가 뜹니다.

## 배포 (Vercel + PWA)

### 0. 사전 준비 (한 번만)

**Firebase Console**
1. [Firebase Console](https://console.firebase.google.com) → 새 프로젝트 생성
2. **Authentication** → 시작하기 → **Google** 프로바이더 활성화
3. **Firestore Database** → 데이터베이스 만들기 → 위치 `asia-northeast3 (서울)` 권장
4. **Firestore → 규칙 탭**에 `firebase.rules` 파일 내용을 통째로 붙여넣고 **게시**
5. 프로젝트 설정 → "내 앱" → 웹(`</>` 아이콘) 추가 → 표시되는 config 6개 값을 메모

### 1. GitHub에 푸시

```bash
git add .
git commit -m "feat: MatchUp ready for deploy"
git push -u origin main
```

`.env.local`은 `.gitignore`에 들어 있어서 커밋되지 않습니다.

### 2. Vercel 배포

1. [vercel.com](https://vercel.com) 로그인 (GitHub 계정 사용 가능)
2. **Add New → Project** → 본 저장소 선택 → Import
3. **Environment Variables** 섹션에 6개 값 모두 등록 (Firebase Console에서 복사한 값):
   ```
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   ```
4. Framework Preset / Build Command / Output Directory는 Vercel이 자동 인식 (Vite, `npm run build`, `dist`)
5. **Deploy** 클릭

배포가 끝나면 `https://<your-project>.vercel.app` 도메인이 발급됩니다.

### 3. Firebase에 Vercel 도메인 등록 (필수)

배포된 도메인에서 Google 로그인이 동작하려면 Firebase에서 도메인을 허용해야 합니다.

1. Firebase Console → Authentication → **설정** 탭 → **승인된 도메인**
2. **도메인 추가** → `<your-project>.vercel.app` 입력 → 저장

이걸 안 하면 로그인 시도 시 `auth/unauthorized-domain` 에러가 납니다.

### 4. 친구들에게 공유

- 단순히 **Vercel 도메인 링크를 카톡으로 보내기** — 친구들이 클릭하면 바로 사용 가능
- 친구들이 그룹에 합류하려면 그룹 상세에서 **"초대 링크"** 버튼으로 메시지를 복사해 카톡에 붙여넣으세요. 메시지에는 그룹 코드 + 앱 링크가 함께 들어갑니다.

### 5. PWA로 설치 (홈 화면에 추가)

배포된 사이트는 PWA로 동작합니다. 첫 진입 후 화면 하단에 **"홈 화면에 앱으로 설치"** 배너가 뜨고, 일주일 동안 닫혀 있다가 다시 표시됩니다.

**Android Chrome**
- 배너의 **"설치"** 버튼 클릭 → 홈 화면에 아이콘 생성
- 또는 메뉴(⋮) → "앱 설치" / "홈 화면에 추가"

**iOS Safari** (자동 프롬프트 미지원)
- 배너 안내대로 하단 **공유 버튼** → **"홈 화면에 추가"**
- ⚠️ Chrome / 카톡 브라우저에서는 홈 화면 추가가 안 됨 → **반드시 Safari로 열기**

설치 후엔 브라우저 주소창 없이 앱처럼 실행됩니다.

## 사용 흐름

1. Google 로그인
2. **새 그룹** 만들기 → 그룹 상세에서 **"초대 링크"** 버튼으로 친구 초대 메시지 복사
3. **새 투표** 만들기로 "이번 주 풋살 가능?" 모집
4. 인원 모이면 **새 매치** 만들기 (축구 11인 / 풋살 5인 선택, "상대팀 자리도 함께" 옵션)
5. 매치에서 참가자 칩을 포메이션 슬롯에 드래그&드롭
6. 상대팀과 대항전이라면 **"상대팀 합류 링크"** 버튼 → 카톡으로 보내면 상대팀 캡틴이 클릭 한 번으로 합류, 양 팀 명단·포메이션을 동시에 열람

## 기술 스택

- React 18 + Vite 6 + JavaScript
- Firebase (Auth · Firestore)
- Tailwind CSS + shadcn-style 컴포넌트
- @dnd-kit (포메이션 드래그&드롭)
- @tanstack/react-query · zustand
- vite-plugin-pwa (manifest + service worker 자동 생성)
- Vercel 배포

데이터 모델 / 디렉터리 구조는 `CLAUDE.md` 참고.

## (선택) 더 예쁜 PWA 아이콘

현재는 `public/icon.svg` 한 장으로 처리합니다. 모든 OS·브라우저에서 깔끔하게 보이게 하려면 PNG도 만들어 두는 게 좋아요:

1. [maskable.app](https://maskable.app) 또는 [PWA Builder](https://www.pwabuilder.com/imageGenerator) 등에서 192·512 PNG 생성
2. `public/icons/` 디렉터리를 만들고 PNG 저장
3. `vite.config.js`의 `manifest.icons`에 PNG 항목 추가:
   ```js
   icons: [
     { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
     { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
     { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
   ]
   ```
4. 다시 배포
