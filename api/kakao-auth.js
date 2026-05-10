// Vercel Serverless Function
// 카카오 인가 코드(code)를 받아서:
//   1) 카카오에서 access_token 으로 교환
//   2) 사용자 정보 조회
//   3) Firebase Custom Token 발급
//
// 환경변수:
//  - KAKAO_REST_API_KEY            카카오 REST API 키
//  - FIREBASE_SERVICE_ACCOUNT_KEY  Firebase Admin 서비스 계정 JSON 을 base64 로 인코딩한 문자열

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
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body ?? {};
    const { code, redirectUri } = body;

    if (!code || !redirectUri) {
      return res.status(400).json({ error: 'code, redirectUri 가 필요해요.' });
    }
    if (!process.env.KAKAO_REST_API_KEY) {
      return res.status(500).json({ error: 'KAKAO_REST_API_KEY 환경변수가 설정되지 않았어요.' });
    }

    // 1) 인가 코드 → access_token 교환
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_REST_API_KEY,
        redirect_uri: redirectUri,
        code
      }).toString()
    });
    if (!tokenRes.ok) {
      const detail = await tokenRes.text();
      const k = process.env.KAKAO_REST_API_KEY ?? '';
      return res.status(401).json({
        error: '카카오 토큰 교환 실패',
        detail,
        __debug: {
          keyLen: k.length,
          keyHead: k.slice(0, 4),
          keyTail: k.slice(-4),
          redirectUriEcho: redirectUri
        }
      });
    }
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;
    if (!accessToken) {
      return res.status(401).json({ error: '카카오 access_token 응답에 없음', detail: tokenJson });
    }

    // 2) 사용자 정보 조회
    const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!userRes.ok) {
      const detail = await userRes.text();
      return res.status(401).json({ error: '카카오 사용자 정보 조회 실패', detail });
    }
    const kakaoUser = await userRes.json();
    const kakaoId = kakaoUser?.id;
    if (!kakaoId) {
      return res.status(401).json({ error: '카카오 응답에 id 가 없어요.' });
    }

    const profile = kakaoUser?.kakao_account?.profile ?? {};
    const displayName = profile.nickname ?? '카카오 사용자';
    const photoURL = profile.profile_image_url ?? null;

    // 3) Firebase Custom Token 발급
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
