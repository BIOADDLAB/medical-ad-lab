export type Traffic = {
    source: string;
    trafficSource: string;
    trafficMedium: string;
    trafficKeyword: string;
    trafficUrl: string;
    landingUrl: string;
};

type StoredTraffic = Traffic & { tracked: boolean; at: number };

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

/**
 * 네이버 블로그는 Referrer-Policy 가 unsafe-url 이라 글 주소 전체가 referrer 로 넘어온다.
 * PC(PostView.naver?blogId=&logNo=)·모바일·blog.naver.com/아이디/글번호 형태를 같은 주소로 맞춘다
 */
export const naverBlogUrl = (referrer: string) => {
    try {
        const url = new URL(referrer);
        if (!/(^|\.)blog\.naver\.com$/.test(url.hostname)) return '';
        const [first = '', second = ''] = url.pathname.split('/').filter(Boolean);
        const blogId = url.searchParams.get('blogId') ?? first;
        const logNo = url.searchParams.get('logNo') ?? second;
        if (!/^[\w-]+$/.test(blogId)) return '';
        return /^\d+$/.test(logNo) ? `https://blog.naver.com/${blogId}/${logNo}` : `https://blog.naver.com/${blogId}`;
    } catch {
        return '';
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
    const blogUrl = naverBlogUrl(document.referrer);
    const traffic = {
        trafficSource: read('utm_source') || (blogUrl ? 'naver_blog' : ''),
        trafficMedium: read('utm_medium') || (blogUrl ? 'blog' : ''),
        trafficKeyword: read('utm_campaign'),
        trafficUrl: read('ref_url') || blogUrl,
    };

    return {
        ...traffic,
        source: detectSource(params),
        landingUrl: window.location.href.split('#')[0],
        tracked: Object.values(traffic).some(Boolean),
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

/** 최초 유입을 보관한다. 단, 보관된 값이 출처를 모르는 유입이고 이번 진입에서 query·블로그 글이 확인되면 바꾼다 */
export const captureTraffic = () => {
    const stored = readStored();
    const current = detectTraffic();
    if (stored && (stored.tracked || !current.tracked)) return;
    try {
        localStorage.setItem(TRAFFIC_KEY, JSON.stringify(current));
    } catch {}
};

export const readTraffic = (): Traffic => {
    const { source, trafficSource, trafficMedium, trafficKeyword, trafficUrl, landingUrl } =
        readStored() ?? detectTraffic();
    return { source, trafficSource, trafficMedium, trafficKeyword, trafficUrl, landingUrl };
};
