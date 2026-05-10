# MatchUp

친구들끼리 풋살/축구 모임을 한 곳에서 관리하는 PWA. 단톡에 흩어지는 모집·일정·명단·포메이션 정보를 통합한다.

배포: https://match-up-livid.vercel.app

---

## 빠른 컨텍스트 (다음 작업 시 먼저 읽기)

- **언어**: JavaScript (TypeScript 아님)
- **테마**: 라이트 (흰 배경 + 진한 회색 보더로 카드 구분). `src/index.css`의 CSS 변수 기반
- **인증**: Google (Firebase Auth popup) + 카카오 (Vercel Function 브릿지 → Firebase Custom Token, redirect 흐름)
- **매치 모델은 단일 문서**: `matches/{id}` 안에 `homeTeam` + `awayTeam`이 모두 들어 있음. **새도우 그룹 / opponentMatchId / shareCode는 deprecated** (옛 매치 일부에만 흔적 남음)
- **카톡 인앱 브라우저는 Firebase Auth와 호환 안 됨** — `InAppBrowserGuide`로 외부 브라우저 안내

---

## 핵심 기능 + 흐름

### 1. 그룹
- `createGroup` / `joinGroup` (inviteCode 기반)
- 그룹 멤버: 그룹의 모든 폴/매치를 read 가능
- owner: 그룹 + 폴 + 매치 삭제 권한
- 그룹 탈퇴 시 그룹의 모든 폴 voterUids + 매치 명단/포메이션에서 본인 자동 제거 (`leaveGroup`)

### 2. 투표 (`polls`)
두 종류 — `attendance` 옵션 플래그로 구분:

| 종류 | 식별 | 용도 |
|---|---|---|
| 일반 의견 | `attendance` 없음 | 자유 옵션 의사결정 (장소/시간/회식) |
| 매치 모집 | 옵션에 `attendance: true` | 참석/불참/미정. `matchId` 있으면 매치와 연결됨 |

UI는 카카오톡 투표 스타일 (`PollCard`):
- 옵션 체크박스로 선택만 → "투표하기" 버튼으로 확정
- 카운트 옆 ▼ 클릭 시 투표자 목록 모달

### 3. 매치 (`matches`) — 단일 문서에 두 팀 통합
```
matches/{matchId}
├ groupId, kind('football'|'futsal'), title, scheduledAt, location
├ homeTeam: { name, playerUids[], formation: { type, positions[] } }
├ awayTeam: { name, playerUids[], formation } | null
├ awayMemberUids: []        ← 매치에 직접 합류한 상대팀 사용자
├ awayInviteCode: string|null   ← 매치별 합류 코드
├ recruitingPollId: string|null
├ createdBy, createdAt
```

생성 옵션:
- `recruiting`: 매치 생성과 함께 모집 투표(참석/불참/미정) 자동 생성, `matchId` 양방향 연결
- `withOpponent`: `awayTeam` + `awayInviteCode` 초기화

### 4. 매치 합류 (대항전)
- owner가 매치 페이지의 "상대팀 합류 링크" 버튼 → `/match-invite?code=XXX` 클립보드
- 상대팀 캡틴이 링크 클릭 → 로그인 → `joinMatchByCode` → `awayMemberUids`에 추가
- **`createdBy` 가드**: 매치 만든 사람이 자기 링크 클릭해도 awayMemberUids에 추가 안 함

### 5. mySide 결정 (`MatchDetail`)
```js
const mySide = isAwayMember ? 'away' : isHomeMember ? 'home' : null;
```
**away 우선** — 매치 초대 링크로 합류한 사람은 home 그룹 멤버이기도 해도 away 처리.

### 6. UI 좌/우 배치
**본인 팀이 항상 좌측**. mySide에 따라 패널 순서 swap. 같은 데이터를 두 캡틴이 각자 좌측에서 자기 팀을 봄.

### 7. 포메이션 에디터 (`Pitch`)
- 좌표: y=0이 GK(아래), y=100이 ST(위). 화면 그릴 때 `top: 100 - y`로 매핑
- 7가지 포메이션: 4-3-3, 4-4-2, 4-2-3-1, 3-5-2, 3-4-3, 5-3-2, 4-1-4-1 + 풋살 1-2-1, 2-1-1
- dnd-kit + 탭 기반 이동 둘 다 지원 (모바일 친화)
- 슬롯↔슬롯, 슬롯→대기 영역, 슬롯끼리 swap

### 8. 카톡 인앱 브라우저 가드
`src/lib/inAppBrowser.js`로 KAKAOTALK/Line/Facebook/Instagram/Naver 감지. 감지되면 App.jsx에서 라우트 진입 차단 후 `InAppBrowserGuide` 표시 (Android는 Chrome intent로 자동 우회, iOS는 공유→Safari 안내).

### 9. 가입자 관리 (`/admin`)
- `VITE_ADMIN_UIDS` 환경변수에 등록된 uid만 접근
- 모든 users 컬렉션 표시 (provider 뱃지: Google/카카오, 가입일)

### 10. 서비스 가이드 (`IntroDialog`)
- 첫 그룹 진입 시 자동 1회 (`localStorage.matchup.introSeen`)
- Groups/GroupDetail에 "가이드" 버튼으로 언제든 다시 보기

---

## 기술 스택

- **프론트엔드**: React 18 + Vite 6 + JavaScript
- **상태**: zustand (auth) + @tanstack/react-query (members 캐시)
- **라우팅**: react-router-dom v7
- **스타일**: Tailwind 3 + shadcn-style 컴포넌트 (`src/components/ui/`)
- **포메이션**: @dnd-kit (PointerSensor + TouchSensor)
- **PWA**: vite-plugin-pwa (autoUpdate, skipWaiting+clientsClaim, controllerchange 자동 reload, 1분 폴링)
- **카카오 로그인 브릿지**: Vercel Serverless Function (`api/kakao-auth.js`) + firebase-admin
- **인증**: Firebase Auth (Google popup, signInWithCustomToken for Kakao)
- **데이터**: Firebase Firestore (모든 실시간 갱신은 onSnapshot)
- **배포**: Vercel (GitHub `main` 자동배포)
- **폰트**: Pretendard (`index.css`의 body font-family)

---

## 디렉터리 구조

```
matchup/
├ api/
│  └ kakao-auth.js          Vercel Function (카카오 → Firebase Custom Token)
├ public/
│  ├ icon.svg, icon_180.png, icon_192.png
├ firebase.rules             Firestore Security Rules (콘솔에 별도 게시 필요)
├ vite.config.js             vite-plugin-pwa 설정 (manifest, workbox)
├ vercel.json                SPA rewrites
├ src/
│  ├ main.jsx                SW 등록 + 1분 폴링 + controllerchange auto-reload
│  ├ App.jsx                 인앱 브라우저 가드 + Firebase 미설정 가드 + 라우트
│  ├ routes.jsx
│  ├ index.css               라이트 테마 CSS 변수 (흰 배경 + 진한 보더)
│  ├ lib/
│  │  ├ firebase.js          init + isFirebaseConfigured (env 미설정 시 null)
│  │  ├ utils.js             cn, generateCode, formatDateTime, toDateInputValue
│  │  └ inAppBrowser.js      카톡/페북/인스타 등 인앱 감지 + Android intent 우회
│  ├ pages/
│  │  ├ Landing.jsx          흰 배경 + italic 큰 로고 + 카카오/Google 로그인 버튼
│  │  ├ Groups.jsx           내 그룹 + "참여 중인 대항전" 섹션
│  │  ├ GroupDetail.jsx      매치 + 의견 투표 섹션, owner 그룹 삭제 / 일반 멤버 그룹 나가기
│  │  ├ MatchDetail.jsx      home/away 통합 매치, mySide 분기, 좌/우 본인 우선
│  │  ├ Join.jsx             그룹 초대 링크 처리 (자동 합류 X, 코드 입력 다이얼로그 자동 오픈)
│  │  ├ MatchInvite.jsx      매치 초대 링크 (`/match-invite?code=...`) → joinMatchByCode
│  │  ├ KakaoCallback.jsx    카카오 redirect → exchangeKakaoCode → Firebase 로그인
│  │  └ Admin.jsx            가입자 목록 (관리자 전용)
│  ├ components/
│  │  ├ AppShell.jsx         헤더 + admin 링크 + 로그아웃 + safe-area 처리
│  │  ├ ProtectedRoute.jsx   로그인 안 됐으면 / 로 redirect
│  │  ├ AdminRoute.jsx       VITE_ADMIN_UIDS 체크 → /groups 로 redirect
│  │  ├ TeamPanel.jsx        team prop 받아 home/away 동등하게 렌더
│  │  ├ Pitch.jsx            포메이션 (dnd-kit + 탭 이동, 좌표 반전)
│  │  ├ PollCard.jsx         카카오톡 스타일 투표 카드 (선택→투표하기, 투표자 모달)
│  │  ├ MembersDialog.jsx    그룹 멤버 모달 (검색 + owner/나 뱃지)
│  │  ├ IntroDialog.jsx      서비스 가이드 (토글로 펼침/접힘, hasSeenIntro/markIntroSeen)
│  │  ├ InAppBrowserGuide.jsx
│  │  ├ InstallPrompt.jsx    "홈 화면에 추가" 배너 (7일 다시 안 봄)
│  │  ├ SetupGuide.jsx       Firebase 미설정 시 안내
│  │  ├ ErrorBoundary.jsx
│  │  ├ BrandIcons.jsx       GoogleIcon (4색 G), KakaoIcon (말풍선)
│  │  ├ CreatePollDialog.jsx 일반 / 참석 의향 모집 모드 토글
│  │  ├ CreateMatchDialog.jsx 종목/모집 투표/상대팀 자리/from poll 변환 모두 처리
│  │  └ ui/                  Button, Card, Input, Label, Dialog, Avatar, Badge
│  └ features/
│     ├ auth/
│     │  ├ api.js            signInWithGoogle, signOut, ensureUserDoc(provider 자동 감지)
│     │  ├ kakao.js          loadKakaoSdk, signInWithKakao({returnTo}), exchangeKakaoCode, popKakaoReturnTo
│     │  ├ hooks.js          useAuthListener, useUser, useAuthLoading
│     │  └ store.js          zustand
│     ├ group/api.js, hooks.js
│     ├ poll/api.js          createPoll, createRecruitingPoll, votePoll(매치 동기화), deletePoll(매치 참조 정리), subscribePollByMatch
│     ├ poll/hooks.js        useGroupPolls, usePoll, useRecruitingPollByMatch
│     ├ match/api.js         createMatch, createMatchFromPoll, joinMatchByCode(createdBy 가드), leaveMatchAsAway, deleteMatch, updateMatchKind, togglePlayer({side}), updateFormation({side})
│     ├ match/hooks.js       useMatch, useGroupMatches, useMyAwayMatches
│     ├ formation/templates.js  7개 축구 + 2개 풋살, kind/category 필드, formationsByKind, DEFAULT_FORMATION
│     └ admin/hooks.js       useAdminUids, useIsAdmin, useAllUsers
```

---

## 환경변수

### 클라이언트 (`.env.local` + Vercel)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_KAKAO_JS_KEY=                  # 카카오 Developers > 앱 키 > JavaScript 키
VITE_ADMIN_UIDS=                    # 콤마 구분 admin uid 목록 (admin 페이지 접근)
```

### 서버 전용 (Vercel만, .env.local 에 두면 vercel dev 시에만 작동)
```
KAKAO_REST_API_KEY=                 # 카카오 REST API 키 (JS 키와 다름!)
FIREBASE_SERVICE_ACCOUNT_KEY=       # Firebase Admin 서비스 계정 JSON 을 base64 인코딩
                                    # cat key.json | base64 | tr -d '\n'
```

⚠️ **`FIREBASE_SERVICE_ACCOUNT_KEY` 는 절대 커밋·채팅 등에 노출 금지.** 노출 시 즉시 GCP Console 에서 키 폐기 + 재발급.

---

## Firestore Security Rules (`firebase.rules`)

콘솔에 별도 게시 필요. 핵심 권한:

| 컬렉션 | read | create | update | delete |
|---|---|---|---|---|
| `users/{uid}` | 로그인 | 본인만 | 본인만 | ❌ |
| `groups/{id}` | 멤버 | 본인이 멤버에 포함 | 멤버 OR 본인 추가만 | ownerUid |
| `polls/{id}` | 그룹 멤버 | 그룹 멤버 | 그룹 멤버 | ownerUid (그룹 owner) |
| `matches/{id}` | home OR away 멤버 | 그룹 멤버 | home OR away 멤버 OR awayMemberUids 자기 자신 추가 | ownerUid (그룹 owner) |

복합 query에 인덱스 필요한 경우 Firebase 콘솔이 자동 안내 링크 제공 (예: `polls.where(groupId).where(matchId)`).

---

## 카카오 로그인 흐름 (참고)

```
1. 클라이언트: signInWithKakao({ returnTo })
   ├ sessionStorage.matchup.kakaoReturnTo = returnTo
   └ Kakao.Auth.authorize({ redirectUri: '/auth/kakao/callback', scope })
2. 카카오 페이지로 redirect → 인증 → /auth/kakao/callback?code=...
3. KakaoCallback.jsx: exchangeKakaoCode(code)
   └ POST /api/kakao-auth { code, redirectUri }
4. Vercel Function: 카카오 token endpoint → access_token → 사용자 정보 →
   firebase-admin.auth().createUser/updateUser('kakao:{kakaoId}') → createCustomToken
5. 클라이언트: signInWithCustomToken(auth, customToken)
6. popKakaoReturnTo() → 원래 위치로 navigate
```

카카오 콘솔 필수 설정:
- **카카오 로그인 활성화** ON
- **Web 플랫폼 도메인**: `https://match-up-livid.vercel.app`, `http://localhost:5173`
- **Redirect URI**: `https://.../auth/kakao/callback`, `http://localhost:5173/auth/kakao/callback`
- **클라이언트 시크릿**: OFF (켜면 토큰 교환에 secret 필요해서 KOE010 발생)

---

## PWA / 캐시 정책

- `registerType: 'autoUpdate'` + `skipWaiting: true` + `clientsClaim: true` + `cleanupOutdatedCaches: true`
- `main.jsx`: `registerSW({ immediate: true })` + 1분 폴링 + `controllerchange` 시 자동 `window.location.reload()`
- 첫 방문 controllerchange는 무시 (무한 reload 방지)
- 친구 첫 1회는 옛 SW 살아있어 강제 정리 필요 (PWA 재설치 또는 사이트 데이터 삭제). 그 후로는 자동 업데이트

---

## 알려진 제약 / 주의사항

- **카톡 인앱 브라우저**: Firebase Auth 동작 안 함. 자동으로 `InAppBrowserGuide` 노출 (코드 변경 불필요)
- **iOS PWA standalone**: third-party 쿠키 격리로 OAuth 까다로움. 친구가 못 들어오면 일반 Safari로 한 번 들어가라고 안내
- **옛 매치 (deprecated)**: `opponentMatchId`/`shareCode` 사용한 옛 매치는 새 코드에서 일부 동작 안 함. 옛 매치는 삭제 권장
- **새도우 그룹**: 옛 흐름. `groups.kind === 'opponent-shadow'` 그룹은 더 이상 자동 생성되지 않지만 옛 데이터에 남아 있을 수 있음. 표시는 `useMyGroups({ includeShadow: false })` 기본값으로 숨김
- **Firestore Rules 게시**: 코드의 `firebase.rules`는 자동 적용되지 않음. **콘솔에 수동 게시 필요**
- **Vercel 환경변수 변경 시 Redeploy 필수** (Vite는 빌드 시점에 변수 인라인)

---

## 개발 명령어

```bash
npm run dev                  # Vite (5173). api/ 함수는 안 뜸 → 카카오 로그인 끝까지 못 감
npm run build                # 프로덕션 빌드 (PWA SW 생성 포함)
npm run preview              # 빌드 결과 미리보기
vercel dev --listen 5173     # 로컬에서 api/ 까지 띄우기 (vercel CLI 필요)
```

---

## 컨벤션

- 파일명: 컴포넌트는 PascalCase, 그 외 camelCase
- Firestore 호출은 `features/*/api.js`에 모음 — 컴포넌트에서 직접 firestore SDK 호출 금지
- 실시간 갱신이 필요한 곳(투표 결과, 명단 등)은 `onSnapshot`
- 사용자별 키는 `localStorage`에 `matchup.*` 네임스페이스 (`matchup.lastLoginProvider`, `matchup.introSeen`, `matchup.installPromptDismissedAt`, `matchup.kakaoReturnTo`)
- 라이트 테마 CSS 변수만 변경하면 모든 컴포넌트가 따라옴 (다크 모드 분기는 안 만듦)

---

## 자주 헷갈리는 포인트

1. **Landing/Join/MatchInvite 톤이 비슷한 이유** — 친구가 어떤 종류 링크로 들어와도 같은 첫인상. 카카오 우선 + "최근 로그인" 뱃지(같은 localStorage 키 공유)
2. **`Join.jsx` vs `MatchInvite.jsx`** — Join은 그룹 초대 (자동 합류 안 함, 코드 입력 다이얼로그 자동 오픈). MatchInvite는 매치 합류 (자동으로 awayMemberUids 추가)
3. **모집 투표 source of truth** — 매치의 `recruitingPollId` 필드는 캐시. 실제 표시는 `useRecruitingPollByMatch({ groupId, matchId })`로 `polls.matchId` 쿼리. 이전에 자가 치유 useEffect가 stale 처리하다가 데이터 깬 적 있어서 양방향 안 함
4. **TeamPanel sideLabel** — "홈" / "어웨이"는 데이터상 위치. UI에서는 본인이 isMine이면 "내 팀", 아니면 sideLabel ("홈" 또는 "어웨이"). 좌/우 배치는 mySide 따라 swap
5. **그룹 owner는 떠날 수 없음** — owner는 "그룹 삭제"만, 일반 멤버는 "그룹 나가기" (leaveGroup이 폴/매치 흔적 자동 정리)
