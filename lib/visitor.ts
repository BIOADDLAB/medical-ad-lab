export const VISITOR_COOKIE = 'mal_visitor';
const EXCLUDED_COOKIE = 'mal_traffic_excluded';
export const validVisitorId = (value: unknown): value is string =>
    typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const KEY = 'medical-ad-lab-visitor';
const TTL = 90 * 86400000;
let memory: { id: string; expires: number } | null = null;

export function internalTrafficExcluded() {
    return (
        typeof document !== 'undefined' &&
        document.cookie.split(';').some((item) => item.trim() === `${EXCLUDED_COOKIE}=1`)
    );
}

export function setInternalTrafficExcluded(excluded: boolean) {
    if (typeof document === 'undefined') return;
    document.cookie = `${EXCLUDED_COOKIE}=${excluded ? '1' : ''}; Path=/; Max-Age=${excluded ? 90 * 86400 : 0}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    try {
        sessionStorage.removeItem('medical-ad-lab-session-v2');
    } catch {}
}

export function requestTrackingDisabled(request: Request) {
    return (
        request.headers.get('dnt') === '1' ||
        (request.headers.get('cookie') || '').split(';').some((item) => item.trim() === `${EXCLUDED_COOKIE}=1`)
    );
}

export function trackingDisabled() {
    return (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') || internalTrafficExcluded();
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
    if (requestTrackingDisabled(request)) return null;
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
