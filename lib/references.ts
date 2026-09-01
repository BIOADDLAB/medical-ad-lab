import { references as fallbackReferences } from '@/data';

export type Reference = {
    slug: string;
    type: string;
    title: string;
    area: string;
    image: string;
    summary?: string;
    goal?: string;
    plan?: string;
};

/**
 * goal·plan 은 두 종류가 같은 칸을 나눠 쓴다. 라벨만 다르다
 * references: 목표 / 구성
 * spots:      규격 / 집행 조건
 */
export const GOAL_FALLBACK = '생활권 반복 노출';
export const PLAN_FALLBACK = '위치·기간·예산 맞춤 제안';
export const SPOT_GOAL_FALLBACK = '매체 규격 확인 후 안내';
export const SPOT_PLAN_FALLBACK = '집행 시기·기간 협의';

type FirestoreValue = { stringValue?: string; timestampValue?: string; integerValue?: string };
type FirestoreDoc = { name: string; fields?: Record<string, FirestoreValue> };

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

const read = (fields: Record<string, FirestoreValue> | undefined, key: string) => fields?.[key]?.stringValue ?? '';
const readNumber = (fields: Record<string, FirestoreValue> | undefined, key: string) => {
    const value = Number(fields?.[key]?.integerValue);
    return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
};

/** references = 집행한 사례, spots = 집행 가능한 광고 장소. 저장 구조가 같아 한 함수로 읽는다 */
export type Kind = 'references' | 'spots';

async function getItems(kind: Kind, fallback: readonly Reference[]): Promise<Reference[]> {
    if (!projectId || !apiKey) return [...fallback];

    try {
        const response = await fetch(
            `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${kind}?key=${apiKey}&pageSize=200`,
            { next: { revalidate: 60 } },
        );
        if (!response.ok) return [...fallback];

        const payload = (await response.json()) as { documents?: FirestoreDoc[] };
        const items = (payload.documents ?? [])
            .map((doc) => ({
                slug: read(doc.fields, 'slug') || doc.name.split('/').pop() || '',
                type: read(doc.fields, 'type'),
                title: read(doc.fields, 'title'),
                area: read(doc.fields, 'area'),
                image: read(doc.fields, 'image'),
                summary: read(doc.fields, 'summary'),
                goal: read(doc.fields, 'goal'),
                plan: read(doc.fields, 'plan'),
                order: readNumber(doc.fields, 'order'),
                createdAt: doc.fields?.createdAt?.timestampValue ?? '',
            }))
            .filter((item) => item.slug && item.title && item.image)
            .sort((a, b) => a.order - b.order || b.createdAt.localeCompare(a.createdAt))
            .map((item) => ({
                slug: item.slug,
                type: item.type,
                title: item.title,
                area: item.area,
                image: item.image,
                summary: item.summary,
                goal: item.goal,
                plan: item.plan,
            }));

        return items.length ? items : [...fallback];
    } catch {
        return [...fallback];
    }
}

/** Firestore 연결 전에는 data.ts 샘플을 그대로 쓴다 */
export const getReferences = () => getItems('references', fallbackReferences);

/** 광고 장소는 샘플이 없다. 관리자가 올리기 전에는 비어 있다 */
export const getSpots = () => getItems('spots', []);

export async function getReference(slug: string) {
    const items = await getReferences();
    return items.find((item) => item.slug === slug);
}

export async function getSpot(slug: string) {
    const items = await getSpots();
    return items.find((item) => item.slug === slug);
}

/** 같은 매체를 먼저 채우고 모자라면 나머지로 채운다 */
function pickRelated(items: Reference[], current: Reference, limit = 3) {
    const others = items.filter((item) => item.slug !== current.slug);
    const same = others.filter((item) => item.type === current.type);
    const rest = others.filter((item) => item.type !== current.type);
    return [...same, ...rest].slice(0, limit);
}

export async function getRelatedReferences(current: Reference) {
    return pickRelated(await getReferences(), current);
}

export async function getRelatedSpots(current: Reference) {
    return pickRelated(await getSpots(), current);
}
