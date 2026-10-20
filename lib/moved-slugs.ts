/**
 * 사례(references)·광고 자리(spots)의 바뀐 주소 찾기. 관리자 화면에서 주소를 바꾸면 예전 주소가 previousSlugs에 남고,
 * proxy.ts가 예전 주소로 들어온 요청을 새 주소로 301 이동한다. 요청마다 읽지 않게 1분 동안 기억한다.
 */
type Field = { stringValue?: string; arrayValue?: { values?: { stringValue?: string }[] } };
type Doc = { name: string; fields?: Record<string, Field> };
type Entry = { at: number; current: Set<string>; moved: Map<string, string> };

const TTL = 60_000;
const cache = new Map<string, Entry>();
/** lib/references.ts의 주소 정리와 같다 */
const slugify = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '-');

async function load(kind: 'references' | 'spots'): Promise<Entry | null> {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!projectId || !apiKey) return null;
    const cached = cache.get(kind);
    if (cached && Date.now() - cached.at < TTL) return cached;
    try {
        const response = await fetch(
            `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${kind}?key=${apiKey}&pageSize=300&mask.fieldPaths=slug&mask.fieldPaths=previousSlugs`,
            { cache: 'no-store', signal: AbortSignal.timeout(3000) },
        );
        if (!response.ok) return cached ?? null;
        const docs = ((await response.json()) as { documents?: Doc[] }).documents ?? [];
        const entry: Entry = { at: Date.now(), current: new Set(), moved: new Map() };
        for (const doc of docs) {
            const slug = slugify(doc.fields?.slug?.stringValue || doc.name.split('/').pop() || '');
            if (!slug) continue;
            entry.current.add(slug);
            for (const value of doc.fields?.previousSlugs?.arrayValue?.values ?? []) {
                const old = slugify(value.stringValue ?? '');
                if (old && old !== slug) entry.moved.set(old, slug);
            }
        }
        cache.set(kind, entry);
        return entry;
    } catch {
        return cached ?? null;
    }
}

/** 예전 주소면 지금 주소, 아니면 null(지금 주소이거나 없는 주소) */
export async function movedSlug(kind: 'references' | 'spots', slug: string) {
    const entry = await load(kind);
    if (!entry || entry.current.has(slug)) return null;
    return entry.moved.get(slug) ?? null;
}
