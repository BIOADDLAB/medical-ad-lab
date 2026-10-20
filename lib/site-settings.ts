import 'server-only';

/**
 * 공개 페이지가 쓰는 관리자 설정(GA·메타 픽셀 ID, 대표 이메일). 서버에서 Firestore REST로 읽어
 * 공개 페이지가 Firebase 클라이언트(로그인·DB·저장소 SDK)를 불러오지 않게 한다. 1분마다 새로 읽는다.
 */
export type PublicSettings = { gaId: string; pixelId: string; contactEmail: string };
const EMPTY: PublicSettings = { gaId: '', pixelId: '', contactEmail: '' };

export async function getPublicSettings(): Promise<PublicSettings> {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!projectId || !apiKey) return EMPTY;
    try {
        const response = await fetch(
            `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/site?key=${apiKey}`,
            { next: { revalidate: 60 }, signal: AbortSignal.timeout(5000) },
        );
        if (!response.ok) return EMPTY;
        const doc = (await response.json()) as { fields?: Record<string, { stringValue?: string }> };
        const read = (key: string) => (doc.fields?.[key]?.stringValue ?? '').trim();
        // 스크립트에 그대로 들어가는 값이라 정해진 모양만 받는다
        const gaId = read('gaId'),
            pixelId = read('pixelId'),
            contactEmail = read('contactEmail');
        return {
            gaId: /^G-[A-Z0-9]{4,20}$/i.test(gaId) ? gaId : '',
            pixelId: /^\d{5,20}$/.test(pixelId) ? pixelId : '',
            contactEmail: /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(contactEmail) ? contactEmail : '',
        };
    } catch {
        return EMPTY;
    }
}
