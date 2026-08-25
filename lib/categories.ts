import { mediaItems } from '@/data';
import type { Kind } from '@/lib/references';

export type Category = { key: string; title: string };

/** 저장한 적이 없을 때 쓰는 출발점. 두 종류가 같은 6개로 시작하고 이후엔 따로 관리한다 */
export const FALLBACK_CATEGORIES: Category[] = mediaItems.map((item) => ({ key: item.key, title: item.title }));

type FirestoreValue = { stringValue?: string; integerValue?: string };
type FirestoreDoc = { fields?: Record<string, FirestoreValue> };

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

/**
 * 서버에서 쓰는 읽기. 레퍼런스와 광고 자리가 카테고리를 따로 가진다.
 * 한 컬렉션에 kind 필드로 나눠 담는다. 문서가 적어 색인 없이 걸러도 된다
 */
export async function getCategories(kind: Kind): Promise<Category[]> {
    if (!projectId || !apiKey) return [...FALLBACK_CATEGORIES];

    try {
        const response = await fetch(
            `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/categories?key=${apiKey}&pageSize=200`,
            { next: { revalidate: 60 } },
        );
        if (!response.ok) return [...FALLBACK_CATEGORIES];

        const payload = (await response.json()) as { documents?: FirestoreDoc[] };
        const items = (payload.documents ?? [])
            .map((doc) => ({
                kind: doc.fields?.kind?.stringValue ?? '',
                key: doc.fields?.key?.stringValue ?? '',
                title: doc.fields?.title?.stringValue ?? '',
                order: Number(doc.fields?.order?.integerValue ?? Number.MAX_SAFE_INTEGER),
            }))
            .filter((item) => item.kind === kind && item.key && item.title)
            .sort((a, b) => a.order - b.order)
            .map(({ key, title }) => ({ key, title }));

        return items.length ? items : [...FALLBACK_CATEGORIES];
    } catch {
        return [...FALLBACK_CATEGORIES];
    }
}
