import { cleanPageUrl, readCurrentVisit } from './traffic';
import { getVisitorId, trackingDisabled } from './visitor';
import type { VisitInput } from './visit';

const KEY = 'medical-ad-lab-pending-visits';
let queue: VisitInput[] | null = null;
let sending = false;
let current: VisitInput | null = null;
let blockedUntil = 0;
let retry: ReturnType<typeof setTimeout> | undefined;
const persist = () => {
    try {
        sessionStorage.setItem(KEY, JSON.stringify(queue));
    } catch {}
};

export function clearPendingVisits() {
    queue = [];
    current = null;
    blockedUntil = 0;
    clearTimeout(retry);
    persist();
}

function pending() {
    if (queue) return queue;
    try {
        const saved: unknown = JSON.parse(sessionStorage.getItem(KEY) || '[]');
        queue = Array.isArray(saved)
            ? saved
                  .filter((item) => item && typeof item.eventId === 'string' && typeof item.pageAt === 'string')
                  .slice(-40)
            : [];
    } catch {
        queue = [];
    }
    return queue;
}

export async function flushVisitQueue() {
    if (sending || trackingDisabled() || Date.now() < blockedUntil) return;
    const visitorId = getVisitorId();
    if (!visitorId) return;
    queue = pending().filter(
        (item) =>
            item.visitorId === visitorId &&
            Number.isFinite(Date.parse(item.pageAt)) &&
            Math.abs(Date.now() - Date.parse(item.pageAt)) < 86400000,
    );
    sending = true;
    try {
        while (queue.length) {
            const item = queue[0];
            try {
                const response = await fetch('/api/visits', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item),
                    keepalive: true,
                    signal: AbortSignal.timeout(12000),
                });
                if (!response.ok && ![400, 403, 413].includes(response.status)) throw new Error('visit unavailable');
                if (queue[0] === item) queue.shift();
                persist();
            } catch {
                blockedUntil = Date.now() + 15000;
                clearTimeout(retry);
                retry = setTimeout(() => void flushVisitQueue(), 16000);
                break;
            }
        }
    } finally {
        sending = false;
    }
}

export function recordPageVisit() {
    if (trackingDisabled() || /^\/(admin|api)(\/|$)|^\/blog\/admin(\/|$)/.test(location.pathname)) return;
    const snapshot = readCurrentVisit();
    if (!snapshot) return;
    const pageUrl = cleanPageUrl(location.href);
    const pageTitle = (document.querySelector('article h1')?.textContent || document.title)
        .replace(/\s*\|\s*병원광고연구소$/, '')
        .trim()
        .slice(0, 200);
    if (
        current?.pageUrl === pageUrl &&
        current.visitSessionId === snapshot.visitSessionId &&
        current.pageTitle === pageTitle
    ) {
        void flushVisitQueue();
        return;
    }
    const eventId =
        current?.pageUrl === pageUrl && current.visitSessionId === snapshot.visitSessionId
            ? current.eventId
            : crypto.randomUUID();
    const pageAt = current?.eventId === eventId ? current.pageAt : new Date().toISOString();
    current = { ...snapshot, eventId, pageUrl, pageTitle, pageAt };
    const saved = pending();
    const index = saved.findIndex((item) => item.eventId === eventId);
    if (index < 0) saved.push(current);
    else saved[index] = current;
    queue = saved.slice(-40);
    persist();
    void flushVisitQueue();
}
