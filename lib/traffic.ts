export type Traffic = {
    source: string;
    trafficSource: string;
    trafficMedium: string;
    trafficKeyword: string;
    trafficUrl: string;
    landingUrl: string;
};

type StoredTraffic = Traffic & { fromQuery: boolean; at: number };

const TRAFFIC_KEY = 'medical-ad-lab-traffic';
const TTL = 30 * 24 * 60 * 60 * 1000;

const SOURCE_LABELS: Record<string, string> = {
    naver_blog: '네이버 블로그',
    naver_cafe: '네이버 카페',
    naver: '네이버',
    instagram: '인스타그램',
    youtube: '유튜브',
    kakao: '카카오',
    google: '구글',
};

export const trafficLabel = (source: string) => SOURCE_LABELS[source] ?? source;

export const isHttpUrl = (value: string) => {
    try {
        return ['http:', 'https:'].includes(new URL(value).protocol);
    } catch {
        return false;
    }
};

const detectSource = (params: URLSearchParams) => {
    const utm = ['utm_source', 'utm_medium', 'utm_campaign']
        .map((key) => params.get(key)?.trim())
        .filter(Boolean)
        .join(' / ');

    if (utm) return utm;
    if (params.has('fbclid')) return 'meta / paid_social';
    if (params.has('gclid')) return 'google / cpc';

    if (document.referrer) {
        try {
            return new URL(document.referrer).hostname;
        } catch {
            return document.referrer;
        }
    }

    return '직접 유입';
};

const detectTraffic = (): StoredTraffic => {
    const params = new URLSearchParams(window.location.search);
    const read = (key: string) => params.get(key)?.trim() ?? '';
    const traffic = {
        trafficSource: read('utm_source'),
        trafficMedium: read('utm_medium'),
        trafficKeyword: read('utm_campaign'),
        trafficUrl: read('ref_url'),
    };

    return {
        ...traffic,
        source: detectSource(params),
        landingUrl: window.location.href.split('#')[0],
        fromQuery: Object.values(traffic).some(Boolean),
        at: Date.now(),
    };
};

const readStored = (): StoredTraffic | null => {
    try {
        const stored = JSON.parse(localStorage.getItem(TRAFFIC_KEY) ?? 'null') as StoredTraffic | null;
        return stored && Date.now() - stored.at < TTL ? stored : null;
    } catch {
        return null;
    }
};

/** 최초 유입을 보관한다. 단, 보관된 값이 referrer 기반이고 이번 진입에 query가 있으면 query를 우선한다 */
export const captureTraffic = () => {
    const stored = readStored();
    const current = detectTraffic();
    if (stored && (stored.fromQuery || !current.fromQuery)) return;
    try {
        localStorage.setItem(TRAFFIC_KEY, JSON.stringify(current));
    } catch {}
};

export const readTraffic = (): Traffic => {
    const { source, trafficSource, trafficMedium, trafficKeyword, trafficUrl, landingUrl } =
        readStored() ?? detectTraffic();
    return { source, trafficSource, trafficMedium, trafficKeyword, trafficUrl, landingUrl };
};
