# MatchLink (코드명: MatchUp)

친구들과 풋살/축구 모임을 한 곳에서 관리하는 PWA. 단톡에 흩어지는 절차를 압축한다.

- ⚽ **모집 투표** — 카카오톡 스타일. 참석/불참/미정으로 인원 모음
- 📅 **매치 + 포메이션** — 일정/장소/명단 + 7가지 축구 + 2가지 풋살 포메이션. 드래그&드롭 또는 탭 이동
- 🤝 **대항전** — 매치별 초대 링크. 상대팀 캡틴이 합류하면 양 팀 포메이션을 동시에 봄
- 🏆 **MOM 투표** — 경기 종료 후 24h, 본인 팀에서 오늘의 선수 뽑기. 동률은 공동 MOM
- 💰 **회비 정산** — 1/N 자동 계산 + 토스 송금 딥링크 (가맹 가입 불필요). 클릭 한 번에 토스 앱이 열리며 자동 송금 화면
- 💬 **피드백** — SNS 출시 후 사용자 피드백 수집. 관리자 페이지에서 미처리/처리됨 분류
- 📱 **PWA** — 홈 화면 설치, 오프라인 일부 동작

> 브랜드 이름은 **MatchLink**. GitHub repo / 배포 URL / localStorage namespace 는 호환성 때문에 **MatchUp** 그대로.

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
   - ⚠️ 코드의 `firebase.rules` 는 자동 적용 안 됨. 변경할 때마다 콘솔에 수동 복붙 + 게시
5. 프로젝트 설정 → "내 앱" → 웹(`</>` 아이콘) 추가 → 표시되는 config 6개 값을 메모
6. **어드민 권한 셋업** (피드백 페이지 / `/admin` 접근용)
   - Firestore Database → Data 탭 → `admins` 컬렉션 시작
   - Document ID 에 본인 uid 정확히 입력 (`Auto-ID` 버튼 누르지 말 것)
     - uid 확인: Authentication → Users 탭 → 본인 행의 "User UID"
     - Google 로그인: `AbcDef123XyZ...` (28자)
     - 카카오 로그인: `kakao:1234567890` (콜론 포함)
   - 필드 하나 (`addedAt: timestamp` 등) 채우고 저장

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
3. **Environment Variables** 섹션에 다음 값 등록:
   ```
   # Firebase 클라이언트 config (필수)
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID

   # 어드민 (선택, /admin 페이지 접근용)
   VITE_ADMIN_UIDS                    # 콤마 구분 uid 목록. Firestore admins/{uid} 도 같이 만들어야 함

   # 카카오 로그인 (선택)
   VITE_KAKAO_JS_KEY                  # 카카오 Developers → 앱 키 → JavaScript 키
   KAKAO_REST_API_KEY                 # 서버 전용. REST API 키 (JS 키와 다름)
   FIREBASE_SERVICE_ACCOUNT_KEY       # 서버 전용. Admin SDK service account JSON 을 base64 인코딩
                                      # cat key.json | base64 | tr -d '\n'
   ```
   ⚠️ `FIREBASE_SERVICE_ACCOUNT_KEY` 는 절대 노출 금지. 노출 시 즉시 GCP Console 에서 키 폐기 + 재발급.

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

1. 카카오/Google 로그인
2. 빈 그룹 화면 → ⚽ **새 그룹 만들기** (또는 📨 친구한테 받은 코드로 참여)
3. 그룹 생성 직후 자동으로 ✨ **카톡 공유 미리보기 다이얼로그** → 메시지 복사해서 단톡에 붙여넣기 → 친구 합류
4. **새 매치** 만들기 (축구 11인 / 풋살 5인 / 모집 투표 같이 만들기 / 상대팀 자리도 함께 옵션)
5. 매치 상세에서:
   - 포메이션 슬롯에 참가자 배치 (드래그&드롭 또는 탭)
   - 회비 정산 카드 — owner 가 총액 + 계좌 입력 → 다른 참가자는 "토스로 송금" 버튼으로 한 번에 송금
   - 경기 종료 + 2시간 후 **MOM 투표** 팝업 자동 노출
6. 상대팀과 대항전이라면 **"상대팀 합류 링크"** → 카톡 공유 → 상대팀 캡틴 합류 → 양 팀 명단/포메이션 동시 열람

서비스에 대한 피드백은 Groups 페이지 헤더 **💬 피드백** 버튼으로.

## 기술 스택

- React 18 + Vite 6 + JavaScript
- Firebase (Auth · Firestore)
- Tailwind CSS + shadcn-style 컴포넌트
- @dnd-kit (포메이션 드래그&드롭)
- @tanstack/react-query · zustand
- vite-plugin-pwa (manifest + service worker 자동 생성)
- Vercel 배포 + Vercel Serverless Functions (카카오 로그인 브릿지)
- Toss 송금 딥링크 (`supertoss://send?...`)

데이터 모델 / 디렉터리 구조 / 캐시 정책 / 자주 헷갈리는 포인트는 `CLAUDE.md` 참고.

## 캐시 / 새 배포 안 보일 때

새 빌드가 배포돼도 SW 캐시 때문에 사용자가 옛 화면을 보는 경우가 있어요. 다음 두 가지 안전망이 작동 중:

1. **자동**: `/version.json` 을 30초마다 + 탭 포커스 시 비교 → 다르면 SW + 캐시 자동 정리 + 리로드
2. **수동**: AppShell 헤더 우상단 🔄 버튼 → 즉시 강제 새로고침

배포 후 친구가 옛 화면이 보인다고 하면 🔄 버튼 한 번 누르면 해결.

## PWA 아이콘

`public/icon_180.png`, `icon_192.png`, `icon_512.png`, `icon.svg` 4종이 들어 있어요. Pretendard Black italic "MatchLink" 텍스트 + 흰 배경. 새로 만들고 싶으면 Pretendard-Black.otf + Python Pillow 로 1024x1024 캔버스에 텍스트 렌더링 → italic shear (0.22) + tracking-tighter (-4%) → 각 크기로 LANCZOS 리샘플.
