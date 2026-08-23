import { references as fallbackReferences } from '@/data';

export type Reference = {
    slug: string;
    type: string;
    title: string;
    area: string;
    image: string;
    summary?: string;
};

type FirestoreValue = { stringValue?: string; timestampValue?: string; integerValue?: string };
type FirestoreDoc = { name: string; fields?: Record<string, FirestoreValue> };

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

const read = (fields: Record<string, FirestoreValue> | undefined, key: string) => fields?.[key]?.stringValue ?? '';
const readNumber = (fields: Record<string, FirestoreValue> | undefined, key: string) => {
    const value = Number(fields?.[key]?.integerValue);
    return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
};

/** Firestore 연결 전에는 data.ts 샘플을 그대로 사용한다. */
export async function getReferences(): Promise<Reference[]> {
    if (!projectId || !apiKey) return [...fallbackReferences];

    try {
        const response = await fetch(
            `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/references?key=${apiKey}&pageSize=200`,
            { next: { revalidate: 60 } },
        );
        if (!response.ok) return [...fallbackReferences];

        const payload = (await response.json()) as { documents?: FirestoreDoc[] };
        const items = (payload.documents ?? [])
            .map((doc) => ({
                slug: read(doc.fields, 'slug') || doc.name.split('/').pop() || '',
                type: read(doc.fields, 'type'),
                title: read(doc.fields, 'title'),
                area: read(doc.fields, 'area'),
                image: read(doc.fields, 'image'),
                summary: read(doc.fields, 'summary'),
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
            }));

        return items.length ? items : [...fallbackReferences];
    } catch {
        return [...fallbackReferences];
    }
}

export async function getReference(slug: string) {
    const items = await getReferences();
    return items.find((item) => item.slug === slug);
}
