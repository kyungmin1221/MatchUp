# MatchUp

친구들과 풋살/축구 모임을 한 곳에서 관리하는 PWA. 모집 투표 → 매치 일정 → 명단 · 포메이션 → 상대팀 공유까지.

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com) → 새 프로젝트 생성
2. **Authentication** → "시작하기" → **Google** 프로바이더 활성화
3. **Firestore Database** → "데이터베이스 만들기" → 위치 `asia-northeast3 (서울)` 권장
4. 프로젝트 설정 → "내 앱" → 웹 앱 추가 → 표시되는 config 값을 복사
5. `.env.example`을 `.env.local`로 복사 후 값 채우기

```bash
cp .env.example .env.local
```

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=1:...
```

6. Firestore → 규칙 탭에 `firebase.rules` 내용을 붙여넣고 게시

### 3. 로컬 실행

```bash
npm run dev
```

http://localhost:5173 접속.

## 빌드 / 배포

### Vercel 배포

1. GitHub에 푸시
2. [Vercel](https://vercel.com) → "Import Project" → 본 저장소 선택
3. **Environment Variables**에 `.env.local`의 값 6개 모두 등록
4. Build Command: `npm run build` (자동), Output Directory: `dist`
5. 배포 후 도메인을 Firebase Console → Authentication → 설정 → **승인된 도메인**에 추가

### PWA 아이콘 (선택)

현재 `public/icon.svg`만 있어요. 모바일에서 깔끔한 홈화면 아이콘을 원하면:

1. [maskable.app](https://maskable.app) 등에서 192/512 PNG 생성
2. `public/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png` 로 저장
3. 다시 배포

## 사용 흐름

1. Google 로그인
2. **그룹 만들기** → 친구들에게 초대 링크 공유
3. **투표 만들기**: "이번 주 풋살 가능?" 같은 모집 투표
4. 인원 모이면 **매치 만들기** → 참가자 등록
5. **포메이션 에디터**에서 참가자 칩을 포지션에 드래그
6. 상대팀이 있으면: 우리 매치의 **공유 코드**를 알려주거나 상대 코드로 연결 → 양쪽 명단 · 포메이션 상호 열람

## 기술 스택

- React 18 + Vite 6 + JavaScript
- Firebase (Auth · Firestore)
- Tailwind CSS + shadcn-style 컴포넌트
- @dnd-kit (포메이션 드래그&드롭)
- @tanstack/react-query · zustand
- vite-plugin-pwa
- Vercel 배포

자세한 데이터 모델 / 디렉터리 구조는 `CLAUDE.md` 참고.
