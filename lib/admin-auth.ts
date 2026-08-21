/**
 * 관리자 API 인증. Firebase ID 토큰을 Identity Toolkit REST로 검증한다.
 * firebase-admin 을 안 쓰는 이유: 서비스 계정 키가 하나 더 필요해지고,
 * 여기서 필요한 건 "로그인한 관리자 이메일이 맞는가" 한 가지뿐이다.
 */
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const admins = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

export const adminAuthReady = Boolean(apiKey && admins.length);

export async function verifyAdmin(request: Request): Promise<string | null> {
    if (!adminAuthReady) return null;

    const idToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!idToken) return null;

    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as { users?: { email?: string; emailVerified?: boolean }[] };
    const email = payload.users?.[0]?.email?.toLowerCase();
    return email && admins.includes(email) ? email : null;
}
