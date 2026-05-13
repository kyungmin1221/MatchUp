# MatchUp (브랜드: MatchLink)

친구들끼리 풋살/축구 모임을 한 곳에서 관리하는 PWA. 단톡에 흩어지는 모집·일정·명단·포메이션·회비 정산·MOM 투표·피드백을 통합한다.

배포: https://match-up-livid.vercel.app

> ⚠️ **브랜드 vs 코드 분리** — UI/manifest/공유 텍스트의 노출 이름은 **MatchLink**. 코드/repo/배포 URL/localStorage namespace 는 호환성 때문에 **MatchUp** 그대로. 새 UI 문구 박을 때는 "MatchLink".

---

## 빠른 컨텍스트 (다음 작업 시 먼저 읽기)

- **언어**: JavaScript (TypeScript 아님)
- **테마**: 라이트 (흰 배경 + 진한 회색 보더로 카드 구분). `src/index.css`의 CSS 변수 기반
- **인증**: Google (Firebase Auth popup) + 카카오 (Vercel Function 브릿지 → Firebase Custom Token, redirect 흐름)
- **매치 모델은 단일 문서**: `matches/{id}` 안에 `homeTeam` + `awayTeam` + `momVotes` + `payment` 모두 들어 있음. **새도우 그룹 / opponentMatchId / shareCode는 deprecated**
- **카톡 인앱 브라우저는 Firebase Auth와 호환 안 됨** — `InAppBrowserGuide`로 외부 브라우저 안내
- **어드민 권한 이중 등록 필요**: 클라이언트 `VITE_ADMIN_UIDS` env + Firestore `admins/{uid}` 도큐먼트 (콘솔에서 수동 생성). 둘 다 있어야 어드민 기능 동작
- **빌드 버전 체크 안전망**: `/version.json` + 번들의 `__BUILD_ID__` 비교 → 불일치 시 SW 해제 + 모든 캐시 비우고 강제 리로드. SW lifecycle 에 의존 안 함

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
- `VITE_ADMIN_UIDS` 환경변수에 등록된 uid만 접근 (클라이언트 가드)
- 모든 users 컬렉션 표시 (provider 뱃지: Google/카카오, 가입일)
- 우상단 "피드백 보기" 버튼 → `/admin/feedback`

### 10. 서비스 가이드 (`IntroDialog`)
- 첫 그룹 진입 시 자동 1회 (`localStorage.matchup.introSeen`)
- Groups/GroupDetail에 "가이드" 버튼으로 언제든 다시 보기
- **단, 방금 그룹을 만든 직후(`location.state.freshlyCreated`)는 `IntroDialog` 대신 `InviteShareDialog` 가 우선** (축하 + 카톡 공유 미리보기). 가이드는 다음 진입 때 보임

### 11. 매치 헤더 + 빈 상태 시각 강조
- `MatchScoreboard` — 매치 상세 최상단 다크 그린 스코어보드. 양팀 크레스트 + VS + KO 시간. `awayTeam` 없으면 single-team 레이아웃(상대팀 없음 라벨)으로 폴백
- `KickoffHero` — 그룹 상세 상단 에메랄드 turf "NEXT KICK-OFF" 카드. `matches` 중 `scheduledAt + 4h` 이후 미래 매치 최단 1개를 강조. 클릭 시 매치 상세로
- `Pitch` 디테일: 잔디 stripes (repeating-linear-gradient), 센터 스팟, 골 에어리어 inner box, 코너 아크(SVG)

### 12. MOM(Man of the Match) 투표 (`features/match/mom.js`)
경기 종료 + 24h 동안 본인 팀(home/away) 참가자 중 한 명을 뽑는 투표.

| phase | 조건 | UI |
|---|---|---|
| `pre` | `now < scheduledAt + 120분` | 표시 안 함 |
| `voting` | `+120분` 이상 + `+120분+24h` 이전 | 자동 팝업 + 상단 amber 배너 (D-Xh 카운트) |
| `closed` | 마감 후 | 상단 결과 배너 ("🏆 MOM · 김민재"). 동률은 공동 MOM |

데이터: `matches/{id}.momVotes: { [voterUid]: votedForUid }`. **본인 표는 카운트에서 제외** (UI는 클릭 가능, 친구 모임 정서). dismiss 는 `localStorage.matchup.momDismissed.{matchId}` 로 저장 → 배너로 진입 가능. 결과 공개 후 그룹 owner 에게 카톡 공유 텍스트 복사 버튼. `GroupDetail` 매치 카드는 본인이 MOM 인 매치에 `🏆 MOM` 배지.

### 13. 회비 정산 (Toss 송금 딥링크, `features/match/payment.js`)
구장 대여비 등 총액을 입력하면 home 참가자 인원 수로 1/N 자동 계산 (100원 단위 올림). 수신자는 항상 `createdBy`. 다른 참가자가 매치 페이지를 열면 **"토스로 N원 송금"** 파란 버튼이 떠 있고, 클릭 시 토스 앱이 자동으로 송금 화면을 열어줌 (`supertoss://send?bank=...&accountNo=...&amount=...&msg=...`).

데이터: `matches/{id}.payment: { totalCost, bank, accountNo, holderName, memo }`. 은행 정보는 **매치 도큐먼트에 스냅샷** — `users/{uid}` 가 아니라. 매치 멤버만 read 권한이 있어 그룹 밖으로 새지 않음. owner 가 다음 매치에 회비 설정 시 `localStorage.matchup.lastBankAccount` 에서 prefill.

카카오페이 정산하기는 가맹 등록 필요해서 일단 제외. Toss 딥링크는 모바일 + Toss 앱 설치 환경에서만 동작 (이 앱이 모바일 PWA 중심이라 OK).

### 14. 사용자 피드백 (`features/feedback/*`)
어드민이 SNS 사용자 피드백을 받기 위한 시스템.

- 모든 로그인 사용자: Groups 페이지 헤더 "💬 피드백" → 카테고리(버그/제안/기타) + 5~2000자 텍스트 → 전송
- 어드민: `/admin/feedback` 에서 미처리/처리됨/전체 탭 + 처리 토글 + 삭제
- 데이터: `feedback/{id}: { text, category, authorUid, authorName, provider, resolved, resolvedAt, createdAt }`
- 권한 분리: create 는 누구나 본인 명의로, read/update/delete 는 어드민만 (본인은 자기 글만 read)

### 15. 빌드 버전 체크 (SW 캐시 우회 안전망)
- `vite.config.js` 의 `versionJsonPlugin` 이 빌드 시 `Date.now()` 를 `__BUILD_ID__` 로 번들에 inject + `/version.json` 파일 dist 에 떨굼
- `main.jsx` 가 30초 + 탭 포커스 시 `/version.json?_=<timestamp>` 를 `cache: 'no-store'` 로 fetch → 번들 `__BUILD_ID__` 와 비교 → 다르면 모든 SW unregister + 모든 cache 비우고 `window.location.reload()`
- AppShell 헤더 우상단 🔄 (`RefreshCw`) 버튼 = `window.__matchupHardRefresh()` 호출. 사용자가 직접 강제 새로고침 가능
- workbox 에서 `version.json` 은 `globIgnores` + `NetworkOnly` 룰로 SW 가 절대 캐시 안 함

### 16. 빈 그룹 온보딩
새 사용자가 가입 직후 보는 화면을 액션 카드 2개로 분기:
- ⚽ **새 그룹 만들기** (primary 강조) → 만들면 `navigate('/groups/{id}', { state: { freshlyCreated: true }})` → GroupDetail 에서 `InviteShareDialog` (variant: 'celebration') 자동 오픈 → 카톡 말풍선 미리보기 + 메시지 복사 버튼
- 📨 **초대 코드로 참여** → 코드 입력 다이얼로그

`InviteShareDialog` 는 두 가지 variant: 'celebration' (그룹 직후 축하 톤) / 'share' (GroupDetail 의 "초대 링크" 버튼에서 호출, 차분한 톤).

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
│  ├ icon.svg, icon_180.png, icon_192.png, icon_512.png   (모두 흰 바탕 + Pretendard Black italic "MatchLink")
├ firebase.rules             Firestore Security Rules (콘솔에 별도 게시 필요)
├ vite.config.js             vite-plugin-pwa 설정 + versionJsonPlugin + __BUILD_ID__ define
├ vercel.json                SPA rewrites + index.html/sw.js/manifest/version.json Cache-Control no-cache
├ src/
│  ├ main.jsx                SW 등록 + 1분 폴링 + controllerchange auto-reload + 빌드 버전 체크 + window.__matchupHardRefresh
│  ├ App.jsx                 인앱 브라우저 가드 + Firebase 미설정 가드 + 라우트
│  ├ routes.jsx              + /admin/feedback 라우트
│  ├ index.css               라이트 테마 CSS 변수 (흰 배경 + 진한 보더)
│  ├ lib/
│  │  ├ firebase.js          init + isFirebaseConfigured (env 미설정 시 null)
│  │  ├ utils.js             cn, generateCode, formatDateTime, toDateInputValue
│  │  └ inAppBrowser.js      카톡/페북/인스타 등 인앱 감지 + Android intent 우회
│  ├ pages/
│  │  ├ Landing.jsx          흰 배경 + italic 큰 "MatchLink" 로고 + 카카오/Google 로그인 버튼
│  │  ├ Groups.jsx           내 그룹 + 빈 상태 액션 카드 2개 (만들기/참여) + 피드백 버튼
│  │  ├ GroupDetail.jsx      KickoffHero + 매치 + 의견 투표 + freshlyCreated 시 InviteShareDialog 자동 오픈
│  │  ├ MatchDetail.jsx      MatchScoreboard + 회비 카드 + MOM 다이얼로그/배너 + home/away 통합 + mySide 분기
│  │  ├ Join.jsx             그룹 초대 링크 처리 + 로그인 후 코드를 navigate state 로 전달 (Groups 에서 prefill)
│  │  ├ MatchInvite.jsx      매치 초대 링크 (`/match-invite?code=...`) → joinMatchByCode
│  │  ├ KakaoCallback.jsx    카카오 redirect → exchangeKakaoCode → Firebase 로그인
│  │  ├ Admin.jsx            가입자 목록 + 피드백 보기 링크 (관리자 전용)
│  │  └ AdminFeedback.jsx    피드백 리스트 + 미처리/처리됨/전체 탭 + 처리 토글 + 삭제 (관리자 전용)
│  ├ components/
│  │  ├ AppShell.jsx         헤더 + admin 링크 + 🔄 강제 새로고침 + 로그아웃 + safe-area
│  │  ├ ProtectedRoute.jsx   로그인 안 됐으면 / 로 redirect
│  │  ├ AdminRoute.jsx       VITE_ADMIN_UIDS 체크 → /groups 로 redirect
│  │  ├ TeamPanel.jsx        team prop 받아 home/away 동등하게 렌더 (jersey 토글 없음, chip 한 종류)
│  │  ├ Pitch.jsx            포메이션 (dnd-kit + 탭 이동) + 잔디 stripes + 센터 스팟 + 골 에어리어 + 코너 아크
│  │  ├ PollCard.jsx         카카오톡 스타일 투표 카드
│  │  ├ KickoffHero.jsx      에메랄드 turf "NEXT KICK-OFF" 카드 (GroupDetail 상단)
│  │  ├ MatchScoreboard.jsx  매치 상세 다크 그린 스코어보드 (head-to-head OR single-team 분기)
│  │  ├ MomDialog.jsx        MOM 투표 팝업 (본인 팀 후보 라디오)
│  │  ├ MomBanner.jsx        MOM voting/closed/winner 상태 표시 + 공유 버튼
│  │  ├ PaymentCard.jsx      회비 카드 (총액/1인당/계좌 + 토스 송금 버튼)
│  │  ├ PaymentSettingsDialog.jsx  owner 의 총액 + 은행 정보 입력
│  │  ├ FeedbackDialog.jsx   카테고리(버그/제안/기타) + 텍스트 입력
│  │  ├ InviteShareDialog.jsx 그룹 초대 메시지 카톡 말풍선 미리보기 + 복사 (celebration/share variant)
│  │  ├ MembersDialog.jsx    그룹 멤버 모달
│  │  ├ IntroDialog.jsx      서비스 가이드 (freshlyCreated 시 스킵, InviteShareDialog 가 우선)
│  │  ├ InAppBrowserGuide.jsx
│  │  ├ InstallPrompt.jsx    "홈 화면에 추가" 배너
│  │  ├ SetupGuide.jsx       Firebase 미설정 시 안내
│  │  ├ ErrorBoundary.jsx
│  │  ├ BrandIcons.jsx       GoogleIcon, KakaoIcon
│  │  ├ CreatePollDialog.jsx 일반 / 참석 의향 모집 모드 토글
│  │  ├ CreateMatchDialog.jsx 종목/모집 투표/상대팀 자리/from poll 변환
│  │  └ ui/                  Button, Card, Input, Label, Dialog, Avatar (shrink-0), Badge
│  └ features/
│     ├ auth/
│     │  ├ api.js            signInWithGoogle, signOut, ensureUserDoc(provider 자동 감지)
│     │  ├ kakao.js          loadKakaoSdk, signInWithKakao({returnTo}), exchangeKakaoCode, popKakaoReturnTo
│     │  ├ hooks.js          useAuthListener, useUser, useAuthLoading
│     │  └ store.js          zustand
│     ├ group/api.js, hooks.js
│     ├ poll/api.js          createPoll, createRecruitingPoll, votePoll, deletePoll, subscribePollByMatch
│     ├ poll/hooks.js        useGroupPolls, usePoll, useRecruitingPollByMatch
│     ├ match/
│     │  ├ api.js            createMatch, joinMatchByCode, togglePlayer, updateFormation, updateMatchKind, voteMom, updateMatchPayment, deleteMatch
│     │  ├ hooks.js          useMatch, useGroupMatches, useMyAwayMatches
│     │  ├ mom.js            MATCH_DURATION_MS(120m), VOTE_WINDOW_MS(24h), getMomPhase, tallyMom (본인 표 제외)
│     │  └ payment.js        BANK_OPTIONS, getLastBankAccount/rememberBankAccount, buildTossLink, computePerPerson(100원 올림), formatWon
│     ├ feedback/
│     │  ├ api.js            FEEDBACK_CATEGORIES, submitFeedback, subscribeAllFeedback, setFeedbackResolved, deleteFeedback
│     │  └ hooks.js          useAllFeedback
│     ├ formation/templates.js  7개 축구 + 2개 풋살, formationsByKind, DEFAULT_FORMATION
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

콘솔에 별도 게시 필요 (코드의 `firebase.rules` 는 자동 적용 안 됨). 핵심 권한:

| 컬렉션 | read | create | update | delete |
|---|---|---|---|---|
| `users/{uid}` | 로그인 | 본인만 | 본인만 | ❌ |
| `groups/{id}` | 멤버 | 본인이 멤버에 포함 | 멤버 OR 본인 추가만 | ownerUid |
| `polls/{id}` | 그룹 멤버 | 그룹 멤버 | 그룹 멤버 | ownerUid (그룹 owner) |
| `matches/{id}` | home OR away 멤버 | 그룹 멤버 | home OR away 멤버 OR awayMemberUids 자기 자신 추가 | ownerUid (그룹 owner) |
| `admins/{uid}` | 로그인 (`isAdmin()` exists 체크에 필요) | ❌ (콘솔 수동) | ❌ | ❌ |
| `feedback/{id}` | admin OR 본인 글 | 본인 명의로 누구나 | admin | admin |

- **`isAdmin()` 함수** = `exists(/databases/.../admins/$(uid()))`. 어드민 권한은 콘솔에서 `admins/{본인 uid}` 도큐먼트를 만들어야 동작
- 복합 query 인덱스 필요한 경우 Firebase 콘솔이 자동 안내 링크 제공

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

이중 안전망 구조 — SW 업데이트 사이클 + 버전 체크 둘 다 작동.

**1차: SW (vite-plugin-pwa)**
- `registerType: 'autoUpdate'` + `skipWaiting: true` + `clientsClaim: true` + `cleanupOutdatedCaches: true`
- HTML 네비게이션은 `NetworkFirst` (2초 timeout) — 옛 `index.html` 을 CacheFirst 로 서빙하던 stale 문제 차단
- `version.json` 은 `NetworkOnly` + `globIgnores` — 절대 SW 가 캐시 못 함
- Firestore 응답은 `NetworkFirst` (5초), 아바타는 `CacheFirst` (1주)
- `main.jsx`: `registerSW({ immediate: true })` + 1분 폴링 + `controllerchange` 시 자동 reload (첫 방문은 무시)

**2차: 빌드 버전 체크 (안전망)**
- `vite.config.js` 의 `versionJsonPlugin` 이 빌드 시 `Date.now()` 를 `__BUILD_ID__` 로 번들에 inject + `dist/version.json` 으로 떨굼
- `main.jsx` 가 30초 + 탭 포커스 + 가시성 변경 시 `/version.json?_=<timestamp>` 를 `cache: 'no-store'` 로 fetch → 불일치 시 모든 SW unregister + 모든 cache 비우고 `window.location.reload()`
- AppShell 헤더 우상단 🔄 (`RefreshCw`) 버튼 = `window.__matchupHardRefresh()` 호출. 사용자가 직접 강제 새로고침 가능

**Vercel HTTP 캐시**
- `vercel.json` 의 `headers` 가 `/`, `/index.html`, `/sw.js`, `/manifest.webmanifest`, `/version.json` 에 `Cache-Control: public, max-age=0, must-revalidate` 설정 → 브라우저 HTTP 캐시까지 항상 재검증
- 해시된 JS/CSS asset 파일은 영구 캐시 OK (파일명에 hash 박혀있음)

**기존 사용자 마이그레이션**: 이 시스템이 자리 잡기 전에 옛 SW 를 가진 사용자는 한 번 강제 새로고침이 필요. AppShell 의 🔄 버튼 또는 사이트 데이터 삭제. 그 이후로는 자동.

---

## 알려진 제약 / 주의사항

- **카톡 인앱 브라우저**: Firebase Auth 동작 안 함. 자동으로 `InAppBrowserGuide` 노출
- **iOS PWA standalone**: third-party 쿠키 격리로 OAuth 까다로움. 친구가 못 들어오면 일반 Safari로 한 번 들어가라고 안내
- **Toss 송금 딥링크**: 모바일 + Toss 앱 설치된 경우에만 동작. 데스크탑/Toss 미설치는 클릭해도 아무 일도 안 일어남
- **카카오페이 정산하기**: 가맹 등록 필요해서 일단 제외. Toss 만 사용
- **옛 매치 (deprecated)**: `opponentMatchId`/`shareCode` 사용한 옛 매치는 새 코드에서 일부 동작 안 함. 옛 매치는 삭제 권장
- **새도우 그룹**: 옛 흐름. `groups.kind === 'opponent-shadow'` 그룹은 더 이상 자동 생성되지 않지만 옛 데이터에 남아 있을 수 있음
- **Firestore Rules 게시**: 코드의 `firebase.rules`는 자동 적용되지 않음. **콘솔에 수동 게시 필요**
- **어드민 셋업 이중**: `VITE_ADMIN_UIDS` env (Vercel) + `admins/{uid}` Firestore 도큐먼트 둘 다 필요. env 만 있으면 클라이언트 가드는 통과해도 Firestore rules 가 거절해서 피드백 데이터 못 읽음
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
- 사용자별 키는 `localStorage`에 `matchup.*` 네임스페이스 — 브랜드명이 MatchLink 로 바뀌었어도 호환성 때문에 namespace 는 `matchup.*` 유지. 키 목록:
  - `matchup.lastLoginProvider` — 'google' | 'kakao' (최근 로그인 뱃지)
  - `matchup.introSeen` — 가이드 1회 노출 마커
  - `matchup.installPromptDismissedAt` — 설치 배너 닫은 시각 (7일 다시 안 봄)
  - `matchup.kakaoReturnTo` — 카카오 로그인 redirect 복귀 경로
  - `matchup.momDismissed.{matchId}` — MOM 투표 팝업 dismiss 마커
  - `matchup.lastBankAccount` — 회비 정산용 마지막 사용 은행 정보 prefill
- 라이트 테마 CSS 변수만 변경하면 모든 컴포넌트가 따라옴 (다크 모드 분기는 안 만듦)

---

## 자주 헷갈리는 포인트

1. **Landing/Join/MatchInvite 톤이 비슷한 이유** — 친구가 어떤 종류 링크로 들어와도 같은 첫인상. 카카오 우선 + "최근 로그인" 뱃지(같은 localStorage 키 공유)
2. **`Join.jsx` vs `MatchInvite.jsx`** — Join은 그룹 초대 (자동 합류 안 함, 코드 입력 다이얼로그 자동 오픈 + 코드 자동 입력). MatchInvite는 매치 합류 (자동으로 awayMemberUids 추가)
3. **모집 투표 source of truth** — 매치의 `recruitingPollId` 필드는 캐시. 실제 표시는 `useRecruitingPollByMatch({ groupId, matchId })`로 `polls.matchId` 쿼리
4. **TeamPanel sideLabel** — "홈"/"어웨이"는 데이터상 위치. UI 에서는 본인이 isMine 이면 "내 팀", 아니면 sideLabel. 좌/우 배치는 mySide 따라 swap
5. **그룹 owner는 떠날 수 없음** — owner는 "그룹 삭제"만, 일반 멤버는 "그룹 나가기" (leaveGroup이 폴/매치 흔적 자동 정리)
6. **MOM 본인 표 처리** — UI 상 본인을 후보로 클릭해서 투표할 수 있음 (친구 모임 농담 정서). 단 `tallyMom()` 이 `voter === target` 케이스를 카운트에서 제외 → 결과에는 자기 표 안 반영
7. **회비 수신자 = createdBy 고정** — 다른 사람으로 바꾸는 UI 없음. 매치 만든 사람이 무조건 회비 받는 사람. 옛 은행 정보는 `localStorage.matchup.lastBankAccount` 에서 prefill
8. **MatchScoreboard 의 single-team 분기** — `match.awayTeam` 없으면 VS 레이아웃 대신 한 팀 + "상대팀 없음" 라벨로 폴백. AWAY 미정 placeholder 가 안 떠야 함 (사용자 혼란 방지)
9. **InviteShareDialog 의 두 variant** — `celebration` (그룹 직후 자동, 톤 축하) / `share` (GroupDetail 초대 링크 버튼, 톤 차분). 같은 컴포넌트 한 prop 분기
10. **IntroDialog vs InviteShareDialog 우선순위** — `freshlyCreated` 시 InviteShareDialog 가 우선, IntroDialog 는 다음 진입 때. `hasSeenIntro` 는 둘 다 처음일 때 markIntroSeen 호출해서 다음 진입에도 안 보이게
11. **빌드 버전 체크가 SW 보다 더 강함** — SW 가 어떻게 동작하든, 30초마다 `version.json` 비교 → 다르면 강제 cleanup + reload. 캐시 문제 디버깅할 때 이걸 우선 확인 (`/version.json` 응답 + 번들 `__BUILD_ID__`)
