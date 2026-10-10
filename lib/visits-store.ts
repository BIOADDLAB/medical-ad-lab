import { JWT } from 'google-auth-library';
import { cleanPageUrl, detectDevice, isHttpUrl, type Touch } from './traffic';
import { readVisitIdentity, validVisitorId } from './visitor';
import type { VisitInput, VisitLocation, VisitPage, VisitRecord } from './visit';

const projectId = process.env.VISITOR_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const root = `projects/${projectId}/databases/(default)/documents`;
const base = `https://firestore.googleapis.com/v1/${root}`;
export const visitsReady = Boolean(projectId && email && key);
const auth = visitsReady ? new JWT({ email, key, scopes: ['https://www.googleapis.com/auth/datastore'] }) : null;
const text = (value: unknown, limit = 200) => (typeof value === 'string' ? value.trim().slice(0, limit) : '');
type Value = { stringValue?: string; timestampValue?: string; integerValue?: string };
type Document = { name: string; fields?: Record<string, Value> };
const strings = (values: Record<string, string>) =>
    Object.fromEntries(Object.entries(values).map(([name, value]) => [name, { stringValue: value }]));
const read = (doc: Document, name: string) =>
    doc.fields?.[name]?.stringValue || doc.fields?.[name]?.timestampValue || '';

export class VisitStoreError extends Error {
    constructor(public status: number) {
        super(`방문 저장소 오류 (${status})`);
    }
}
async function headers() {
    if (!auth) throw new VisitStoreError(503);
    const { token } = await auth.getAccessToken();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}
async function call(path: string, init: RequestInit = {}) {
    return fetch(`${base}${path}`, {
        ...init,
        headers: await headers(),
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
    });
}
async function checked(response: Response) {
    if (!response.ok) throw new VisitStoreError(response.status);
    return response;
}

export function requestLocation(request: Request): VisitLocation {
    const empty = { country: '', region: '', city: '', locationSource: '' };
    if (process.env.VERCEL !== '1') return empty;
    const country = text(request.headers.get('x-vercel-ip-country'), 2).toUpperCase();
    let city = text(request.headers.get('x-vercel-ip-city'), 200);
    try {
        city = decodeURIComponent(city);
    } catch {
        city = '';
    }
    return {
        country: /^[A-Z]{2}$/.test(country) ? country : '',
        region: text(request.headers.get('x-vercel-ip-country-region'), 10),
        city,
        locationSource: country || city ? 'vercel_ip' : '',
    };
}

export function parseVisit(request: Request, body: Record<string, unknown>): VisitInput | null {
    const identity = readVisitIdentity(request, body);
    const raw = body.entry;
    if (!identity || !validVisitorId(body.eventId) || !raw || typeof raw !== 'object') return null;
    const source = raw as Record<string, unknown>;
    const url = cleanPageUrl(text(body.pageUrl, 1000));
    if (
        !url ||
        new URL(url).origin !== new URL(request.url).origin ||
        /^\/(admin|api)(\/|$)|^\/blog\/admin(\/|$)/.test(new URL(url).pathname)
    )
        return null;
    const entry = Object.fromEntries(
        [
            'source',
            'medium',
            'keyword',
            'keywordType',
            'adKeyword',
            'term',
            'content',
            'title',
            'campaign',
            'evidence',
            'landingTitle',
        ].map((name) => [name, text(source[name])]),
    ) as unknown as Touch;
    entry.at =
        typeof source.at === 'number' && source.at > Date.now() - 86400000 && source.at <= Date.now() + 60000
            ? source.at
            : Date.now();
    entry.landingUrl = cleanPageUrl(text(source.landingUrl, 1000));
    if (!entry.landingUrl || new URL(entry.landingUrl).origin !== new URL(request.url).origin) entry.landingUrl = url;
    entry.url = isHttpUrl(text(source.url, 1000)) ? text(source.url, 1000) : '';
    entry.referrer = isHttpUrl(text(source.referrer, 1000)) ? cleanPageUrl(text(source.referrer, 1000)) : '';
    if (!['naver_query', 'referrer_query'].includes(entry.keywordType)) {
        entry.keyword = '';
        entry.keywordType = '';
    }
    const pageAt = text(body.pageAt, 50);
    const parsed = Date.parse(pageAt);
    return {
        ...identity,
        eventId: body.eventId,
        entry,
        pageUrl: url,
        pageTitle: text(body.pageTitle),
        pageAt:
            Number.isFinite(parsed) && Math.abs(parsed - Date.now()) < 86400000
                ? new Date(parsed).toISOString()
                : new Date().toISOString(),
    };
}

async function ensureVisit(input: VisitInput, request: Request) {
    const startedAt = new Date(input.entry.at).toISOString();
    const data = strings({
        visitorId: input.visitorId,
        source: input.entry.source || 'direct',
        medium: input.entry.medium || 'direct',
        evidence: input.entry.evidence || 'none',
        keyword: input.entry.keyword,
        keywordType: input.entry.keywordType,
        adKeyword: input.entry.adKeyword,
        term: input.entry.term,
        campaign: input.entry.campaign,
        content: input.entry.content,
        referrer: input.entry.referrer,
        externalUrl: input.entry.url,
        externalTitle: input.entry.title,
        landingUrl: input.entry.landingUrl,
        landingTitle: input.entry.landingTitle,
        device: detectDevice(request.headers.get('user-agent') || ''),
        hospital: '',
        inquiryAt: '',
        ...requestLocation(request),
    });
    const response = await call(`/trafficVisits/${input.visitSessionId}?currentDocument.exists=false`, {
        method: 'PATCH',
        body: JSON.stringify({
            fields: {
                ...data,
                startedAt: { timestampValue: startedAt },
                lastAt: { timestampValue: startedAt },
                pageCount: { integerValue: '0' },
                expireAt: { timestampValue: new Date(Date.now() + 90 * 86400000).toISOString() },
            },
        }),
    });
    if (response.ok) return;
    if (![409, 412, 400].includes(response.status)) throw new VisitStoreError(response.status);
    const existing = await checked(await call(`/trafficVisits/${input.visitSessionId}`));
    if (read((await existing.json()) as Document, 'visitorId') !== input.visitorId) throw new VisitStoreError(403);
}

export async function saveVisitPage(input: VisitInput, request: Request) {
    await ensureVisit(input, request);
    const response = await call(':commit', {
        method: 'POST',
        body: JSON.stringify({
            writes: [
                {
                    update: {
                        name: `${root}/trafficVisits/${input.visitSessionId}/trafficPages/${input.eventId}`,
                        fields: {
                            ...strings({ url: input.pageUrl, title: input.pageTitle }),
                            at: { timestampValue: input.pageAt },
                            expireAt: { timestampValue: new Date(Date.now() + 90 * 86400000).toISOString() },
                        },
                    },
                    currentDocument: { exists: false },
                },
                {
                    update: {
                        name: `${root}/trafficVisits/${input.visitSessionId}`,
                        fields: { lastAt: { timestampValue: new Date().toISOString() } },
                    },
                    updateMask: { fieldPaths: ['lastAt'] },
                    currentDocument: { exists: true },
                    updateTransforms: [{ fieldPath: 'pageCount', increment: { integerValue: '1' } }],
                },
            ],
        }),
    });
    // 이미 저장한 이벤트의 재전송은 페이지 수를 다시 늘리지 않는다.
    if (!response.ok && [409, 412, 400].includes(response.status)) {
        const saved = await call(`/trafficVisits/${input.visitSessionId}/trafficPages/${input.eventId}`);
        if (saved.ok) {
            await checked(
                await call(
                    `/trafficVisits/${input.visitSessionId}/trafficPages/${input.eventId}?updateMask.fieldPaths=title&currentDocument.exists=true`,
                    {
                        method: 'PATCH',
                        body: JSON.stringify({ fields: strings({ title: input.pageTitle }) }),
                    },
                ),
            );
            if (input.entry.landingUrl === input.pageUrl) {
                await checked(
                    await call(
                        `/trafficVisits/${input.visitSessionId}?updateMask.fieldPaths=landingTitle&currentDocument.exists=true`,
                        {
                            method: 'PATCH',
                            body: JSON.stringify({ fields: strings({ landingTitle: input.pageTitle }) }),
                        },
                    ),
                );
            }
            return;
        }
    }
    await checked(response);
}

export async function linkVisitToInquiry(input: VisitInput, request: Request, hospital: string, inquiryAt: string) {
    await ensureVisit(input, request);
    const mask = new URLSearchParams();
    for (const field of ['hospital', 'inquiryAt']) mask.append('updateMask.fieldPaths', field);
    mask.set('currentDocument.exists', 'true');
    await checked(
        await call(`/trafficVisits/${input.visitSessionId}?${mask}`, {
            method: 'PATCH',
            body: JSON.stringify({ fields: strings({ hospital: text(hospital), inquiryAt }) }),
        }),
    );
}

const row = (doc: Document): VisitRecord => {
    const data = Object.fromEntries(
        [
            'visitorId',
            'startedAt',
            'lastAt',
            'source',
            'medium',
            'evidence',
            'keyword',
            'keywordType',
            'adKeyword',
            'term',
            'campaign',
            'content',
            'referrer',
            'externalUrl',
            'externalTitle',
            'landingUrl',
            'landingTitle',
            'device',
            'hospital',
            'inquiryAt',
            'country',
            'region',
            'city',
            'locationSource',
        ].map((key) => [key, read(doc, key)]),
    );
    return {
        ...data,
        id: doc.name.split('/').at(-1) || '',
        pageCount: Number(doc.fields?.pageCount?.integerValue || 0),
    } as VisitRecord;
};

async function queryVisits(from: string, to: string, limit: number, cursor?: Document, readTime?: string) {
    const response = await checked(
        await call(':runQuery', {
            method: 'POST',
            body: JSON.stringify({
                ...(readTime ? { readTime } : {}),
                structuredQuery: {
                    from: [{ collectionId: 'trafficVisits' }],
                    where: {
                        compositeFilter: {
                            op: 'AND',
                            filters: [
                                {
                                    fieldFilter: {
                                        field: { fieldPath: 'startedAt' },
                                        op: 'GREATER_THAN_OR_EQUAL',
                                        value: { timestampValue: from },
                                    },
                                },
                                {
                                    fieldFilter: {
                                        field: { fieldPath: 'startedAt' },
                                        op: 'LESS_THAN',
                                        value: { timestampValue: to },
                                    },
                                },
                            ],
                        },
                    },
                    orderBy: [
                        { field: { fieldPath: 'startedAt' }, direction: 'DESCENDING' },
                        { field: { fieldPath: '__name__' }, direction: 'DESCENDING' },
                    ],
                    ...(cursor
                        ? {
                              startAt: {
                                  before: false,
                                  values: [
                                      { timestampValue: read(cursor, 'startedAt') },
                                      { referenceValue: cursor.name },
                                  ],
                              },
                          }
                        : {}),
                    limit,
                },
            }),
        }),
    );
    const data = (await response.json()) as { document?: Document; readTime?: string }[];
    return {
        documents: data.flatMap((item) => (item.document ? [item.document] : [])),
        readTime: data.find((item) => item.readTime)?.readTime,
    };
}

export async function listVisits(from: string, to: string) {
    const { documents } = await queryVisits(from, to, 1001);
    return { visits: documents.slice(0, 1000).map(row), truncated: documents.length > 1000 };
}

/** 목록의 표시 제한과 별개로 같은 스냅샷을 끝까지 읽어 합계를 계산한다. */
export async function* visitBatches(from: string, to: string) {
    let cursor: Document | undefined;
    let readTime: string | undefined;
    const deadline = Date.now() + 45000;
    while (true) {
        if (Date.now() > deadline) throw new VisitStoreError(504);
        const batch = await queryVisits(from, to, 1000, cursor, readTime);
        readTime ||= batch.readTime;
        yield batch.documents.map(row);
        if (batch.documents.length < 1000) return;
        cursor = batch.documents.at(-1);
    }
}

export async function listVisitPages(id: string) {
    const response = await checked(
        await call(`/trafficVisits/${id}:runQuery`, {
            method: 'POST',
            body: JSON.stringify({
                structuredQuery: {
                    from: [{ collectionId: 'trafficPages' }],
                    orderBy: [{ field: { fieldPath: 'at' }, direction: 'ASCENDING' }],
                    limit: 201,
                },
            }),
        }),
    );
    const pages: VisitPage[] = ((await response.json()) as { document?: Document }[]).flatMap(({ document: doc }) =>
        doc
            ? [
                  {
                      id: doc.name.split('/').at(-1) || '',
                      url: read(doc, 'url'),
                      title: read(doc, 'title'),
                      at: read(doc, 'at'),
                  },
              ]
            : [],
    );
    return { pages: pages.slice(0, 200), truncated: pages.length > 200 };
}
