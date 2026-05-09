// Vercel Serverless Function
// 카카오 access_token 을 받아서 Firebase Custom Token 으로 교환한다.
//
// 환경변수:
//  - FIREBASE_SERVICE_ACCOUNT_KEY  Firebase Admin 서비스 계정 JSON 을 base64 인코딩한 문자열
//
// 클라이언트 흐름:
//  1) Kakao.Auth.login() 으로 access_token 획득
//  2) POST /api/kakao-auth { accessToken } → { customToken }
//  3) signInWithCustomToken(auth, customToken)

import admin from 'firebase-admin';

let initialized = false;

function ensureAdmin() {
  if (initialized) return;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!b64) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY 환경변수가 설정되지 않았어요.');
  }
  let json;
  try {
    json = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY 가 올바른 base64 JSON 이 아니에요.');
  }
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(json) });
  }
  initialized = true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { accessToken } =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body ?? {};

    if (!accessToken) {
      return res.status(400).json({ error: 'accessToken 이 필요해요.' });
    }

    // 카카오 사용자 정보 조회
    const kakaoRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!kakaoRes.ok) {
      const detail = await kakaoRes.text();
      return res.status(401).json({ error: '카카오 인증 실패', detail });
    }
    const kakaoUser = await kakaoRes.json();
    const kakaoId = kakaoUser?.id;
    if (!kakaoId) {
      return res.status(401).json({ error: '카카오 응답에 id 가 없어요.' });
    }

    const profile = kakaoUser?.kakao_account?.profile ?? {};
    const displayName = profile.nickname ?? '카카오 사용자';
    // 기본 프로필 이미지(default profile image)는 권한 없이도 보이지만, 동의 항목 때문에 null 일 수 있다.
    const photoURL = profile.profile_image_url ?? null;

    ensureAdmin();
    const auth = admin.auth();
    const uid = `kakao:${kakaoId}`;

    try {
      await auth.updateUser(uid, { displayName, photoURL });
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        await auth.createUser({ uid, displayName, photoURL });
      } else {
        throw e;
      }
    }

    const customToken = await auth.createCustomToken(uid);
    return res.status(200).json({ customToken });
  } catch (e) {
    console.error('kakao-auth error', e);
    return res.status(500).json({ error: e?.message ?? 'Server error' });
  }
}
