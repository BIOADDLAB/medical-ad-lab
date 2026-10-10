import { getVisitorId, trackingDisabled, validVisitorId } from './visitor';

export type Traffic = {
    visitorId: string;
    visitSessionId: string;
    source: string;
    trafficSource: string;
    trafficMedium: string;
    trafficKeyword: string;
    trafficUrl: string;
    landingUrl: string;
    trafficTitle: string;
    trafficCampaign: string;
    landingTitle: string;
    submitUrl: string;
    device: string;
    firstTouch: string;
    firstTouchUrl: string;
    trafficContent: string;
    trafficTerm: string;
    trafficAdKeyword: string;
    trafficKeywordType: string;
    trafficEvidence: string;
    trafficReferrer: string;
    trafficCapturedAt: string;
    firstLandingUrl: string;
    firstLandingTitle: string;
    sessionSource: string;
    sessionLandingUrl: string;
    sessionLandingTitle: string;
    viewedArticles: string;
    journeyPages: string;
    trackingVersion: string;
};
export type Touch = {
    source: string;
    medium: string;
    keyword: string;
    keywordType: string;
    adKeyword: string;
    term: string;
    content: string;
    title: string;
    campaign: string;
    url: string;
    referrer: string;
    evidence: string;
    landingUrl: string;
    landingTitle: string;
    at: number;
};
export type Visit = { href: string; referrer: string; userAgent: string; title: string; now: number };
export type Journey = { first: Touch; last: Touch };
export type ViewedPage = { url: string; title: string };
type Session = {
    id: string;
    entry: Touch;
    last: Touch;
    pages: ViewedPage[];
    articles: ViewedPage[];
    updatedAt: number;
};
type Detected = { source: string; medium: string; keyword: string; keywordType: string; url: string; evidence: string };

const KEY = 'medical-ad-lab-attribution-v2';
const SESSION_KEY = 'medical-ad-lab-session-v2';
const TTL = 90 * 24 * 60 * 60 * 1000;
const SESSION = 30 * 60 * 1000;
const own = (map: object, key: string) => Object.prototype.hasOwnProperty.call(map, key);
const text = (value: unknown, max = 200) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const parseUrl = (value: string) => {
    try {
        return new URL(value);
    } catch {
        return null;
    }
};

const SOURCE_LABELS: Record<string, string> = {
    google: '구글',
    naver: '네이버',
    daum: '다음',
    bing: '빙',
    zum: '줌',
    yahoo: '야후',
    duckduckgo: '덕덕고',
    naver_blog: '네이버 블로그',
    naver_cafe: '네이버 카페',
    naver_kin: '네이버 지식iN',
    naver_place: '네이버 지도·플레이스',
    naver_post: '네이버 포스트',
    naver_influencer: '네이버 인플루언서',
    naver_app: '네이버 앱',
    daum_cafe: '다음 카페',
    kakao_map: '카카오맵',
    tistory: '티스토리',
    brunch: '브런치',
    instagram: '인스타그램',
    facebook: '페이스북',
    meta: '메타(페이스북·인스타그램)',
    threads: '스레드',
    youtube: '유튜브',
    x: 'X(트위터)',
    kakao: '카카오',
    kakaotalk: '카카오톡',
    band: '밴드',
    line: '라인',
    tiktok: '틱톡',
    linkedin: '링크드인',
    chatgpt: 'ChatGPT',
    perplexity: 'Perplexity',
    gemini: 'Gemini',
    claude: 'Claude',
    copilot: 'Copilot',
    wrtn: '뤼튼',
    clova: '클로바X',
    deepseek: 'DeepSeek',
    grok: 'Grok',
    email: '이메일',
};

/** 빈 문자열은 매체명만으로 충분해 덧붙이지 않는 종류 */
const MEDIUM_LABELS: Record<string, string> = {
    organic: '자연검색',
    cpc: '광고',
    display: '디스플레이 광고',
    paid_social: '소셜 광고',
    ai: 'AI 추천',
    sms: '문자',
    qr: 'QR',
    social: '',
    blog: '',
    cafe: '',
    referral: '',
    email: '',
};

const SOURCE_ALIASES: Record<string, string> = {
    'chatgpt.com': 'chatgpt',
    openai: 'chatgpt',
    'perplexity.ai': 'perplexity',
    'gemini.google.com': 'gemini',
    'naver.com': 'naver',
    'blog.naver.com': 'naver_blog',
    'm.blog.naver.com': 'naver_blog',
    'google.com': 'google',
    'bing.com': 'bing',
    'claude.ai': 'claude',
    naverblog: 'naver_blog',
    fb: 'facebook',
    ig: 'instagram',
    insta: 'instagram',
    yt: 'youtube',
    twitter: 'x',
    kakao_talk: 'kakaotalk',
};

const MEDIUM_ALIASES: Record<string, string> = {
    ppc: 'cpc',
    paid: 'cpc',
    paidsearch: 'cpc',
    paid_search: 'cpc',
    sa: 'cpc',
    paidsocial: 'paid_social',
    'paid-social': 'paid_social',
    sns: 'social',
    'e-mail': 'email',
    newsletter: 'email',
    banner: 'display',
    gfa: 'display',
};

const AI_SOURCES = new Set([
    'chatgpt',
    'perplexity',
    'gemini',
    'claude',
    'copilot',
    'wrtn',
    'clova',
    'deepseek',
    'grok',
]);

/** 검색엔진은 결과 클릭 시 대부분 도메인만 넘긴다(구글·네이버·빙·다음 모바일). 다음 PC 처럼 주소를 다 넘기는 곳만 검색어가 잡힌다 */
const SEARCH_PARAMS: Record<string, string> = {
    google: 'q',
    naver: 'query',
    daum: 'q',
    bing: 'q',
    zum: 'query',
    yahoo: 'p',
    duckduckgo: 'q',
};

/** 위에서부터 처음 맞는 규칙을 쓴다. AI·메일이 같은 회사 도메인 아래 있어 검색엔진보다 먼저 둔다 */
const HOST_RULES: [RegExp, string, string][] = [
    [/(^|\.)(chatgpt\.com|chat\.openai\.com)$/, 'chatgpt', 'ai'],
    [/(^|\.)perplexity\.ai$/, 'perplexity', 'ai'],
    [/^(gemini|bard)\.google\.com$/, 'gemini', 'ai'],
    [/(^|\.)claude\.ai$/, 'claude', 'ai'],
    [/^copilot\.microsoft\.com$/, 'copilot', 'ai'],
    [/(^|\.)wrtn\.ai$/, 'wrtn', 'ai'],
    [/^clova-x\.naver\.com$/, 'clova', 'ai'],
    [/(^|\.)deepseek\.com$/, 'deepseek', 'ai'],
    [/(^|\.)grok\.com$/, 'grok', 'ai'],
    [/^(web)?mail\.|^outlook\.(live|office|office365)\.com$/, 'email', 'email'],
    [/^((www|m|images|news)\.)?google(\.[a-z]{2,3}){1,2}$/, 'google', 'organic'],
    [/^(m\.)?search\.naver\.com$/, 'naver', 'organic'],
    [/^(m\.)?search\.daum\.net$/, 'daum', 'organic'],
    [/(^|\.)bing\.com$/, 'bing', 'organic'],
    [/^(m\.)?search\.zum\.com$/, 'zum', 'organic'],
    [/(^|\.)search\.yahoo\.com$/, 'yahoo', 'organic'],
    [/(^|\.)duckduckgo\.com$/, 'duckduckgo', 'organic'],
    [/^(m\.)?blog\.naver\.com$/, 'naver_blog', 'blog'],
    [/^(m\.)?cafe\.naver\.com$/, 'naver_cafe', 'cafe'],
    [/^(m\.)?kin\.naver\.com$/, 'naver_kin', 'referral'],
    [/^(m\.)?post\.naver\.com$/, 'naver_post', 'blog'],
    [/^in\.naver\.com$/, 'naver_influencer', 'referral'],
    [/^(m\.|pcmap\.)?(map|place)\.naver\.com$/, 'naver_place', 'referral'],
    [/(^|\.)naver\.com$/, 'naver', 'referral'],
    [/(^|\.)tistory\.com$/, 'tistory', 'blog'],
    [/(^|\.)brunch\.co\.kr$/, 'brunch', 'blog'],
    [/^(m\.)?cafe\.daum\.net$/, 'daum_cafe', 'cafe'],
    [/(^|\.)daum\.net$/, 'daum', 'referral'],
    [/^(m\.|place\.)?map\.kakao\.com$/, 'kakao_map', 'referral'],
    [/(^|\.)kakao\.com$/, 'kakao', 'social'],
    [/(^|\.)instagram\.com$/, 'instagram', 'social'],
    [/(^|\.)(facebook|fb)\.com$/, 'facebook', 'social'],
    [/(^|\.)threads\.(net|com)$/, 'threads', 'social'],
    [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube', 'social'],
    [/^(t\.co|((www|mobile)\.)?(x|twitter)\.com)$/, 'x', 'social'],
    [/(^|\.)(linkedin\.com|lnkd\.in)$/, 'linkedin', 'social'],
    [/(^|\.)band\.us$/, 'band', 'social'],
    [/(^|\.)tiktok\.com$/, 'tiktok', 'social'],
    [/(^|\.)line\.me$/, 'line', 'social'],
];

/** 안드로이드 앱은 referrer 를 android-app://패키지명 으로 넘긴다 */
const APP_RULES: [RegExp, string, string][] = [
    [/^com\.google\.android\.googlequicksearchbox/, 'google', 'organic'],
    [/^com\.google\.android\.gm$/, 'email', 'email'],
    [/^com\.nhn\.android\.blog/, 'naver_blog', 'blog'],
    [/^com\.nhn\.android\.search/, 'naver_app', 'referral'],
    [/^com\.kakao\.talk/, 'kakaotalk', 'social'],
    [/^com\.instagram\./, 'instagram', 'social'],
    [/^com\.facebook\./, 'facebook', 'social'],
    [/^com\.google\.android\.youtube/, 'youtube', 'social'],
    [/^net\.daum\.android/, 'daum', 'referral'],
];

/** 카카오톡 등 앱 내 브라우저는 referrer 를 비우는 경우가 많아 UA 로 출처를 보완한다 */
const IN_APPS: [RegExp, string, string, string][] = [
    [/KAKAOTALK/i, 'kakaotalk', 'social', '카카오톡'],
    [/NAVER\(inapp/i, 'naver_app', 'referral', '네이버'],
    [/Instagram/, 'instagram', 'social', '인스타그램'],
    [/FBAN|FBAV|FB_IAB/, 'facebook', 'social', '페이스북'],
    [/\bLine\//, 'line', 'social', '라인'],
    [/DaumApps/, 'daum', 'referral', '다음'],
    [/\bBAND\//, 'band', 'social', '밴드'],
];

export const isHttpUrl = (value: string) => {
    const url = parseUrl(value);
    return !!url && ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
};
export const cleanPageUrl = (value: string) => {
    const url = parseUrl(value);
    return url && isHttpUrl(value) ? `${url.origin}${url.pathname}`.slice(0, 1000) : '';
};
const cleanReferrer = (value: string) => {
    const url = parseUrl(value);
    if (!url) return '';
    if (url.protocol === 'android-app:') return `android-app://${url.hostname}`;
    if (!isHttpUrl(value)) return '';
    const clean = new URL(cleanPageUrl(value));
    for (const key of ['q', 'query', 'p', 'blogId', 'logNo']) {
        const item = text(url.searchParams.get(key));
        if (item) clean.searchParams.set(key, item);
    }
    return clean.href.slice(0, 1000);
};
/** 확인 가능한 referrer로만 AI 유입을 보정한다. 랜딩 경로(/blog)는 출처가 아니다. */
export function visitAttribution(visit: {
    source: string;
    medium: string;
    referrer: string;
    landingUrl: string;
    evidence?: string;
}) {
    const landing = parseUrl(visit.landingUrl);
    const ref = parseReferrer(visit.referrer, landing?.hostname || '');
    if (ref && AI_SOURCES.has(ref.source)) return { source: ref.source, medium: 'ai', evidence: 'referrer' };
    return {
        source: visit.source,
        medium: AI_SOURCES.has(visit.source) ? 'ai' : visit.medium,
        evidence: visit.evidence || 'none',
    };
}

export const trafficLabel = (source: string, medium = '') => {
    if (!source || source === 'direct') return '직접 방문·출처 확인 불가';
    const name = own(SOURCE_LABELS, source) ? SOURCE_LABELS[source] : source;
    const kind = own(MEDIUM_LABELS, medium) ? MEDIUM_LABELS[medium] : medium;
    return kind ? `${name} · ${kind}` : name;
};
export const evidenceLabel = (value: string) =>
    ({
        utm: '추적 링크에 지정된 출처',
        ad_parameter: '광고 추적 파라미터',
        referrer: '브라우저가 전달한 이전 사이트',
        app_referrer: '앱이 전달한 출처',
        app_hint: '앱 브라우저 기준 추정',
        none: '출처 정보 미전달',
    })[value] || '기존 기록·판별 근거 없음';
export const detectDevice = (userAgent: string) => {
    const kind =
        /iPad|Tablet/i.test(userAgent) || (/Android/.test(userAgent) && !/Mobi/.test(userAgent))
            ? '태블릿'
            : /Mobi|iPhone|Android/i.test(userAgent)
              ? '모바일'
              : 'PC';
    const app = IN_APPS.find(([pattern]) => pattern.test(userAgent))?.[3];
    return app ? `${kind} · ${app} 앱` : kind;
};
/** 글 주소가 실제 전달된 경우만 정규화한다. 도메인만으로 글을 알아낼 수는 없다. */
export const naverBlogUrl = (value: string) => {
    const url = parseUrl(value);
    if (!url || !isHttpUrl(value) || !/^(m\.)?blog\.naver\.com$/.test(url.hostname)) return '';
    const [first = '', second = ''] = url.pathname.split('/').filter(Boolean);
    const blogId = url.searchParams.get('blogId') || first;
    const logNo = url.searchParams.get('logNo') || second;
    if (!/^[\w-]+$/.test(blogId)) return '';
    return /^\d+$/.test(logNo) ? `https://blog.naver.com/${blogId}/${logNo}` : `https://blog.naver.com/${blogId}`;
};
const normalize = (value: string, aliases: Record<string, string>) => {
    const key = value
        .trim()
        .toLowerCase()
        .replace(/^www\./, '');
    return own(aliases, key) ? aliases[key] : key;
};
const detected = (source: string, medium: string, evidence: string): Detected => ({
    source,
    medium,
    evidence,
    keyword: '',
    keywordType: '',
    url: '',
});
const sameHost = (a: string, b: string) => a.replace(/^www\./, '') === b.replace(/^www\./, '');
const parseReferrer = (value: string, pageHost: string): Detected | null => {
    const url = parseUrl(value);
    if (!url) return null;
    if (url.protocol === 'android-app:') {
        const rule = APP_RULES.find(([pattern]) => pattern.test(url.hostname));
        return detected(rule?.[1] || url.hostname, rule?.[2] || 'referral', 'app_referrer');
    }
    if (!isHttpUrl(value) || sameHost(url.hostname, pageHost)) return null;
    const rule = HOST_RULES.find(([pattern]) => pattern.test(url.hostname));
    const source = rule?.[1] || url.hostname.replace(/^www\./, '');
    const medium = rule?.[2] || 'referral';
    const result = detected(source, medium, 'referrer');
    if (medium === 'organic') {
        const keyword = text(url.searchParams.get(SEARCH_PARAMS[source] || 'q'));
        if (keyword && !isHttpUrl(keyword) && !/\/(url|aclk)$/.test(url.pathname)) {
            result.keyword = keyword;
            result.keywordType = 'referrer_query';
        }
    } else if (medium !== 'email') {
        result.url = source === 'naver_blog' ? naverBlogUrl(value) : cleanReferrer(value);
    }
    return result;
};
const detectAd = (read: (key: string) => string): Detected | null => {
    if (read('n_media') || read('n_query') || read('n_keyword') || /(^|\|)tr=(sa|brnd)(\||$)/.test(read('NaPm'))) {
        return {
            ...detected('naver', 'cpc', 'ad_parameter'),
            keyword: read('n_query'),
            keywordType: read('n_query') ? 'naver_query' : '',
        };
    }
    if (read('gclid') || read('gbraid') || read('wbraid')) return detected('google', 'cpc', 'ad_parameter');
    if (read('msclkid')) return detected('bing', 'cpc', 'ad_parameter');
    if (read('ttclid')) return detected('tiktok', 'paid_social', 'ad_parameter');
    return null;
};
export function classifyVisit({ href, referrer, userAgent, title, now }: Visit): Touch {
    const page = parseUrl(href);
    const params = page?.searchParams || new URLSearchParams();
    const refPage = parseUrl(referrer);
    const internal = !!refPage && sameHost(refPage.hostname, page?.hostname || '');
    const read = (key: string) => (internal ? '' : text(params.get(key)));
    let utmSource = normalize(read('utm_source'), SOURCE_ALIASES);
    const utmMedium = normalize(read('utm_medium'), MEDIUM_ALIASES);
    if (utmSource === 'naver' && utmMedium === 'blog') utmSource = 'naver_blog';
    if (utmSource === 'naver' && utmMedium === 'cafe') utmSource = 'naver_cafe';
    const ref = parseReferrer(referrer, page?.hostname || '');
    const app = !internal && !ref ? IN_APPS.find(([pattern]) => pattern.test(userAgent)) : undefined;
    const base =
        detectAd(read) ||
        ref ||
        (app ? detected(app[1], app[2], 'app_hint') : null) ||
        (read('fbclid') ? detected('meta', 'social', 'ad_parameter') : null) ||
        detected('direct', 'direct', 'none');
    // 실제 AI 서비스에서 넘어온 referrer는 잘못 붙은 블로그 UTM보다 우선한다.
    const aiReferrer = ref && AI_SOURCES.has(ref.source) ? ref : null;
    const source = aiReferrer?.source || utmSource || base.source;
    const medium = AI_SOURCES.has(source)
        ? 'ai'
        : utmMedium || (source === base.source ? base.medium : source.endsWith('_blog') ? 'blog' : 'referral');
    const compatible = source === base.source;
    const refUrl = internal ? '' : text(params.get('ref_url'), 1000);
    return {
        source,
        medium,
        keyword: compatible ? base.keyword : '',
        keywordType: compatible ? base.keywordType : '',
        adKeyword: source === 'naver' && medium === 'cpc' ? read('n_keyword') : '',
        term: read('utm_term'),
        content: read('utm_content'),
        campaign: read('utm_campaign'),
        title: aiReferrer ? '' : read('ref_title'),
        url: aiReferrer
            ? base.url
            : (isHttpUrl(refUrl) ? naverBlogUrl(refUrl) || cleanReferrer(refUrl) : '') || (compatible ? base.url : ''),
        referrer: internal ? '' : cleanReferrer(referrer),
        evidence: aiReferrer ? 'referrer' : utmSource ? 'utm' : base.evidence,
        landingUrl: cleanPageUrl(href),
        landingTitle: text(title.replace(/\s*\|\s*병원광고연구소$/, '')),
        at: now,
    };
}
/** 최초 방문은 고정한다. 직접 재방문은 최근 확인 출처를 덮어쓰지 않는다. */
export const nextJourney = (journey: Journey | null, touch: Touch): Journey => {
    if (!journey) return { first: touch, last: touch };
    if (touch.source === 'direct') return journey;
    return { first: journey.first, last: touch };
};
const validTime = (at: unknown, now: number, ttl: number) =>
    typeof at === 'number' && Number.isFinite(at) && at > 0 && now >= at && now - at < ttl;
const validTouch = (value: unknown): value is Touch => {
    if (!value || typeof value !== 'object') return false;
    const item = value as Record<string, unknown>;
    return (
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
            'url',
            'referrer',
            'evidence',
            'landingUrl',
            'landingTitle',
        ].every((key) => typeof item[key] === 'string') && typeof item.at === 'number'
    );
};
const validPages = (value: unknown): value is ViewedPage[] =>
    Array.isArray(value) &&
    value.length <= 20 &&
    value.every(
        (item) => item && typeof item.url === 'string' && isHttpUrl(item.url) && typeof item.title === 'string',
    );
let memory: Journey | null = null;
let sessionMemory: Session | null = null;
let documentCaptured = false;
const loadJourney = (now: number): Journey | null => {
    let saved = memory;
    try {
        saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch {}
    return validTouch(saved?.first) &&
        validTouch(saved?.last) &&
        validTime(saved.first.at, now, TTL) &&
        validTime(saved.last.at, now, TTL)
        ? saved
        : null;
};
const loadSession = (now: number): Session | null => {
    let saved = sessionMemory;
    try {
        saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    } catch {}
    return validVisitorId(saved?.id) &&
        validTouch(saved?.entry) &&
        validTouch(saved?.last) &&
        validPages(saved.pages) &&
        validPages(saved.articles) &&
        validTime(saved.updatedAt, now, SESSION) &&
        validTime(saved.entry.at, now, TTL)
        ? saved
        : null;
};
const save = (journey: Journey, session: Session) => {
    memory = journey;
    sessionMemory = session;
    try {
        localStorage.setItem(KEY, JSON.stringify(journey));
    } catch {}
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {}
};
const currentVisit = (): Visit => ({
    href: window.location.href,
    referrer: document.referrer,
    userAgent: navigator.userAgent,
    title: document.querySelector('article h1')?.textContent || document.title,
    now: Date.now(),
});
const isArticle = (value: string) =>
    /^\/blog\/[^/]+\/?$/.test(parseUrl(value)?.pathname || '') &&
    !/^\/blog\/(admin|search|category|tag)(\/|$)/.test(parseUrl(value)?.pathname || '');
/** Next.js 이동도 기록하되 document.referrer는 문서 첫 진입에서만 해석한다. */
export const captureTraffic = () => {
    const visit = currentVisit();
    if (/^\/(admin|api)(\/|$)|^\/blog\/admin(\/|$)/.test(window.location.pathname)) return;
    let journey = loadJourney(visit.now);
    let session = loadSession(visit.now);
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const acquire = !documentCaptured && (!session || !['reload', 'back_forward'].includes(navigation?.type || ''));
    const touch = classifyVisit(
        acquire ? visit : { ...visit, href: cleanPageUrl(visit.href), referrer: '', userAgent: '' },
    );
    const refPage = parseUrl(visit.referrer);
    const internalEntry = !!refPage && sameHost(refPage.hostname, window.location.hostname);
    if (!session || (acquire && !internalEntry)) {
        journey = nextJourney(journey, touch);
        session = {
            id: crypto.randomUUID(),
            entry: touch,
            last: touch,
            pages: [],
            articles: [],
            updatedAt: visit.now,
        };
    }
    journey ||= { first: session.entry, last: session.last };
    documentCaptured = true;
    const page = { url: cleanPageUrl(visit.href), title: text(visit.title.replace(/\s*\|\s*병원광고연구소$/, '')) };
    const previous = session.pages.at(-1);
    if (previous?.url === page.url) previous.title = page.title;
    else session.pages = [...session.pages, page].slice(-20);
    if (isArticle(page.url)) {
        const article = session.articles.find((item) => item.url === page.url);
        if (article) article.title = page.title;
        else session.articles = [...session.articles, page].slice(-10);
    }
    for (const item of [journey.first, journey.last, session.entry, session.last]) {
        if (item.landingUrl === page.url) item.landingTitle = page.title;
    }
    session.updatedAt = visit.now;
    save(journey, session);
    if (!trackingDisabled()) {
        getVisitorId();
    }
};
export function readCurrentVisit() {
    captureTraffic();
    const session = loadSession(Date.now());
    const visitorId = getVisitorId();
    return session && visitorId ? { visitorId, visitSessionId: session.id, entry: session.entry } : null;
}
const formatTime = (at: number) =>
    new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(at));
export const readTraffic = (): Traffic => {
    captureTraffic();
    const visit = currentVisit();
    const journey = loadJourney(visit.now) || nextJourney(null, classifyVisit(visit));
    const session = loadSession(visit.now);
    const first = journey.first,
        last = session?.entry || journey.last,
        entry = session?.entry || last;
    return {
        visitorId: getVisitorId(),
        visitSessionId: trackingDisabled() ? '' : session?.id || '',
        source: trafficLabel(last.source, last.medium),
        trafficSource: last.source,
        trafficMedium: last.medium,
        trafficKeyword: last.keyword,
        trafficKeywordType: last.keywordType,
        trafficTerm: last.term,
        trafficAdKeyword: last.adKeyword,
        trafficContent: last.content,
        trafficTitle: last.title,
        trafficUrl: last.url,
        trafficCampaign: last.campaign,
        trafficEvidence: last.evidence,
        trafficReferrer: last.referrer,
        trafficCapturedAt: new Date(last.at).toISOString(),
        landingUrl: last.landingUrl,
        landingTitle: last.landingTitle,
        submitUrl: cleanPageUrl(visit.href),
        device: detectDevice(visit.userAgent),
        firstTouch: `${trafficLabel(first.source, first.medium)} · ${formatTime(first.at)}`,
        firstTouchUrl: first.url,
        firstLandingUrl: first.landingUrl,
        firstLandingTitle: first.landingTitle,
        sessionSource: `${trafficLabel(entry.source, entry.medium)} (${evidenceLabel(entry.evidence)})`,
        sessionLandingUrl: entry.landingUrl,
        sessionLandingTitle: entry.landingTitle,
        viewedArticles: JSON.stringify(session?.articles || []),
        journeyPages: (session?.pages || []).map((page) => `${new URL(page.url).pathname} — ${page.title}`).join('\n'),
        trackingVersion: '2',
    };
};
export const readViewedArticles = (value: string): ViewedPage[] => {
    try {
        const pages: unknown = JSON.parse(value);
        if (!Array.isArray(pages)) return [];
        return pages
            .slice(-10)
            .filter((item) => item && isHttpUrl(item.url) && isArticle(item.url))
            .map((item) => ({ url: cleanPageUrl(item.url), title: text(item.title) }));
    } catch {
        return [];
    }
};
/** 문의 API에서 동일한 필드·길이 제한을 사용한다. */
export const sanitizeTraffic = (body: Record<string, unknown>): Traffic => {
    const limits: Record<keyof Traffic, number> = {
        visitorId: 36,
        visitSessionId: 36,
        source: 200,
        trafficSource: 100,
        trafficMedium: 100,
        trafficKeyword: 200,
        trafficUrl: 1000,
        landingUrl: 1000,
        trafficTitle: 200,
        trafficCampaign: 200,
        landingTitle: 200,
        submitUrl: 1000,
        device: 50,
        firstTouch: 300,
        firstTouchUrl: 1000,
        trafficContent: 200,
        trafficTerm: 200,
        trafficAdKeyword: 200,
        trafficKeywordType: 50,
        trafficEvidence: 50,
        trafficReferrer: 1000,
        trafficCapturedAt: 50,
        firstLandingUrl: 1000,
        firstLandingTitle: 200,
        sessionSource: 300,
        sessionLandingUrl: 1000,
        sessionLandingTitle: 200,
        viewedArticles: 16000,
        journeyPages: 8000,
        trackingVersion: 10,
    };
    const result = Object.fromEntries(
        Object.entries(limits).map(([key, limit]) => [key, text(body[key], limit)]),
    ) as Traffic;
    for (const key of [
        'trafficUrl',
        'landingUrl',
        'submitUrl',
        'firstTouchUrl',
        'firstLandingUrl',
        'sessionLandingUrl',
    ] as const) {
        if (!isHttpUrl(result[key])) result[key] = '';
    }
    result.trafficReferrer = cleanReferrer(result.trafficReferrer);
    if (!validVisitorId(result.visitorId)) result.visitorId = '';
    if (!validVisitorId(result.visitSessionId)) result.visitSessionId = '';
    result.viewedArticles = JSON.stringify(readViewedArticles(result.viewedArticles));
    if (result.trafficSource) result.source = trafficLabel(result.trafficSource, result.trafficMedium);
    return result;
};
