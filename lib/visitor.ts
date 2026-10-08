export const VISITOR_COOKIE = 'mal_visitor';
export const validVisitorId = (value: unknown): value is string =>
    typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const KEY = 'medical-ad-lab-visitor';
const TTL = 90 * 86400000;
let memory: { id: string; expires: number } | null = null;

export function trackingDisabled() {
    return typeof navigator !== 'undefined' && navigator.doNotTrack === '1';
}

export function getVisitorId() {
    if (typeof window === 'undefined' || trackingDisabled()) return '';
    const now = Date.now();
    let saved = memory;
    try {
        saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch {}
    if (!validVisitorId(saved?.id) || !saved || !Number.isFinite(saved.expires) || saved.expires <= now) {
        saved = { id: crypto.randomUUID(), expires: now + TTL };
    }
    memory = saved;
    try {
        localStorage.setItem(KEY, JSON.stringify(saved));
    } catch {}
    document.cookie = `${VISITOR_COOKIE}=${saved.id}; Path=/; Max-Age=${Math.max(0, Math.floor((saved.expires - now) / 1000))}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    return saved.id;
}

export function readVisitIdentity(request: Request, body: Record<string, unknown>) {
    const cookies = new Map(
        (request.headers.get('cookie') || '').split(';').map((item) => {
            const [key, ...values] = item.trim().split('=');
            return [key, values.join('=')];
        }),
    );
    const visitorId = body.visitorId;
    const visitSessionId = body.visitSessionId;
    return validVisitorId(visitorId) && validVisitorId(visitSessionId) && cookies.get(VISITOR_COOKIE) === visitorId
        ? { visitorId, visitSessionId }
        : null;
}
