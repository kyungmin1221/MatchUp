# MatchUp

친구들끼리 풋살/축구 모임을 한 곳에서 관리하는 웹 앱. 단톡방에 흩어지는 모집·일정·명단·포메이션 정보를 통합한다.

## 핵심 기능

1. **모집 투표** — 카카오톡 투표처럼 "이번 주 풋살 가능?" 같은 다중 선택 투표 생성/참여
2. **경기(매치) 일정** — 투표로 모집된 인원을 확정하고 날짜·장소·시간 등록
3. **팀/명단 관리** — 매치 참가자를 팀에 배치, 출전 명단 확정
4. **포메이션 에디터** — 4-3-3, 4-4-2 등 포메이션 위에 선수 배치 (드래그&드롭)
5. **상대팀 공유** — 매치 코드/링크로 상대팀과 매치를 연결, 양 팀의 명단·포메이션을 서로 열람
6. **그룹/초대** — 정기 모임 멤버를 그룹으로 묶고 초대 링크로 신규 멤버 합류

## 기술 스택

- **프론트엔드**: React 18 + Vite + TypeScript
- **백엔드(BaaS)**: Firebase
  - Firestore (데이터)
  - Firebase Authentication (Google 로그인)
- **상태 관리**: React Query (Firestore 데이터) + Zustand 또는 Context (UI 상태)
- **라우팅**: React Router v6
- **스타일**: Tailwind CSS
- **포메이션 드래그**: dnd-kit
- **PWA**: vite-plugin-pwa (workbox)
- **배포**: Vercel (GitHub 연동 자동배포)

별도 백엔드 서버는 두지 않는다. 권한·검증은 Firestore Security Rules로 처리한다.

## 데이터 모델 (Firestore)

```
users/{uid}
  displayName, photoURL, createdAt

groups/{groupId}
  name, ownerUid, memberUids[], inviteCode, createdAt

polls/{pollId}
  groupId, title, options[{id, label, voterUids[]}], createdBy, closesAt, createdAt

matches/{matchId}
  groupId, pollId?, title, scheduledAt, location,
  homeTeam: { name, playerUids[], formation: { type, positions[] } },
  opponentMatchId?,                  // 상대팀과 연결됐을 때
  shareCode,                         // 상대팀이 입력하는 6자리 코드
  createdBy, createdAt

# 포메이션의 positions = [{ playerUid, x, y, role }]
```

상대팀 매칭은 `matches.opponentMatchId`로 양방향 참조한다. 한쪽이 코드로 합류하면 두 매치 문서가 서로를 가리킨다.

## 디렉터리 구조 (예정)

```
src/
  pages/        # 라우트 페이지
  components/   # 재사용 컴포넌트
  features/     # 기능별 모듈 (poll, match, formation, group)
    poll/
      api.ts    # Firestore 호출
      hooks.ts  # React Query 훅
      ...
  lib/firebase.ts
  routes.tsx
```

## 개발 명령어

```bash
npm run dev       # 로컬 개발 서버 (Vite)
npm run build     # 프로덕션 빌드
npm run preview   # 빌드 결과물 미리보기
npm run lint      # ESLint
```

## 환경변수

`.env.local` (Vercel에도 동일하게 등록):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

`.env.local`은 절대 커밋하지 않는다. `.env.example`로 키 목록만 공유한다.

## 배포

- `main` 브랜치 푸시 → Vercel 자동배포
- PWA 매니페스트 + Service Worker 포함 → 모바일에서 "홈 화면에 추가"로 앱처럼 사용
- 친구들에게는 Vercel 도메인 링크 공유

## 컨벤션

- 파일명: 컴포넌트는 PascalCase, 그 외 camelCase
- Firestore 호출은 `features/*/api.ts`에 모은다 — 컴포넌트에서 직접 firestore SDK 호출 금지
- 실시간 갱신이 필요한 곳(투표 결과, 명단 등)은 `onSnapshot` 사용
