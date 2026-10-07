/** 문의와 함께 서버로 보내는 유입정보. source 는 시트 G열(유입경로)에 들어가는 사람이 읽는 요약이다 */
export type Traffic = {
    source: string;
    trafficSource: string;
    trafficMedium: string;
    trafficKeyword: string;
    trafficUrl: string;
    landingUrl: string;
    trafficCampaign: string;
    landingTitle: string;
    submitUrl: string;
    device: string;
    firstTouch: string;
    firstTouchUrl: string;
};

export type Touch = {
    source: string;
    medium: string;
    keyword: string;
    campaign: string;
    url: string;
    landingUrl: string;
    landingTitle: string;
    at: number;
};

export type Visit = { href: string; referrer: string; userAgent: string; title: string; now: number };

export type Journey = { first: Touch; last: Touch };

type Detected = { source: string; medium: string; keyword: string; url: string };

const KEY = 'medical-ad-lab-journey';
const LEGACY_KEY = 'medical-ad-lab-traffic';
const TTL = 90 * 24 * 60 * 60 * 1000;
const SESSION = 30 * 60 * 1000;

const own = (map: object, key: string) => Object.prototype.hasOwnProperty.call(map, key);

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
    ai: 'AI 검색',
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

export const isHttpUrl = (value: string) => ['http:', 'https:'].includes(parseUrl(value)?.protocol ?? '');

export const trafficLabel = (source: string, medium = '') => {
    if (!source || source === 'direct') return '직접 유입';
    const name = own(SOURCE_LABELS, source) ? SOURCE_LABELS[source] : source;
    const kind = own(MEDIUM_LABELS, medium) ? MEDIUM_LABELS[medium] : medium;
    return kind ? `${name} · ${kind}` : name;
};

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

/**
 * 네이버 블로그는 Referrer-Policy 가 unsafe-url 이라 글 주소 전체가 referrer 로 넘어온다.
 * PC(PostView.naver?blogId=&logNo=)·모바일·blog.naver.com/아이디/글번호 형태를 같은 주소로 맞춘다
 */
export const naverBlogUrl = (referrer: string) => {
    const url = parseUrl(referrer);
    if (!url || !/(^|\.)blog\.naver\.com$/.test(url.hostname)) return '';
    const [first = '', second = ''] = url.pathname.split('/').filter(Boolean);
    const blogId = url.searchParams.get('blogId') ?? first;
    const logNo = url.searchParams.get('logNo') ?? second;
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

const found = (source: string, medium: string, keyword = ''): Detected => ({ source, medium, keyword, url: '' });

const pageUrl = (url: URL) => (url.pathname.length > 1 || url.search ? url.href.split('#')[0].slice(0, 1000) : '');

/** 외부 사이트가 아니면(우리 사이트 안 이동·읽을 수 없는 값) null */
const parseReferrer = (referrer: string, pageHost: string): Detected | null => {
    const url = parseUrl(referrer);
    if (!url) return null;
    if (url.protocol === 'android-app:') {
        const rule = APP_RULES.find(([pattern]) => pattern.test(url.hostname));
        return found(rule?.[1] ?? url.hostname, rule?.[2] ?? 'referral');
    }
    const host = url.hostname.replace(/^www\./, '');
    if (!['http:', 'https:'].includes(url.protocol) || host === pageHost.replace(/^www\./, '')) return null;

    const rule = HOST_RULES.find(([pattern]) => pattern.test(url.hostname));
    if (!rule) return { source: host, medium: 'referral', keyword: '', url: pageUrl(url) };
    const [, source, medium] = rule;
    if (medium === 'organic') {
        // 구글 /url?q= 같은 리다이렉트 주소는 q 에 검색어가 아니라 이동할 주소가 들어 있다
        const keyword =
            url.searchParams
                .get(SEARCH_PARAMS[source] ?? 'q')
                ?.trim()
                .slice(0, 200) ?? '';
        return found(source, medium, isHttpUrl(keyword) ? '' : keyword);
    }
    if (source === 'naver_blog') return { source, medium, keyword: '', url: naverBlogUrl(referrer) };
    return { source, medium, keyword: '', url: medium === 'email' ? '' : pageUrl(url) };
};

/** 광고 클릭 ID·추적 파라미터. 네이버 검색광고는 '추적 기능'을 켜면 n_query 에 실제 검색어가 붙는다 */
const detectAd = (params: URLSearchParams, read: (key: string) => string): Detected | null => {
    if (params.has('n_media') || params.has('n_query') || params.has('n_keyword')) {
        return found('naver', 'cpc', read('n_query') || read('n_keyword'));
    }
    if (/(^|\|)tr=(sa|brnd)(\||$)/.test(read('NaPm'))) return found('naver', 'cpc');
    if (params.has('gclid') || params.has('gbraid') || params.has('wbraid')) return found('google', 'cpc');
    if (params.has('msclkid')) return found('bing', 'cpc');
    if (params.has('ttclid')) return found('tiktok', 'paid_social');
    return null;
};

/**
 * 우선순위: utm·광고 파라미터 > referrer > 앱 내 브라우저 UA > 직접 유입.
 * 사이트 안에서 이동한 페이지도 direct 로 나오며, nextJourney 가 direct 로는 이전 유입을 덮어쓰지 않는다
 */
export function classifyVisit({ href, referrer, userAgent, title, now }: Visit): Touch {
    const page = parseUrl(href);
    const params = page?.searchParams ?? new URLSearchParams();
    const read = (key: string) => params.get(key)?.trim().slice(0, 200) ?? '';

    const utmSource = normalize(read('utm_source'), SOURCE_ALIASES);
    const utmMedium = normalize(read('utm_medium'), MEDIUM_ALIASES);
    const campaign = read('utm_campaign');
    const refUrl = params.get('ref_url')?.trim() ?? '';
    const ref = referrer ? parseReferrer(referrer, page?.hostname ?? '') : null;
    const app = referrer ? undefined : IN_APPS.find(([pattern]) => pattern.test(userAgent));

    const detected =
        detectAd(params, read) ??
        ref ??
        (app && found(app[1], app[2])) ??
        (params.has('fbclid') ? found('meta', 'social') : null) ??
        found('direct', 'direct');

    const source = utmSource || detected.source;
    const medium =
        utmMedium ||
        (source === detected.source
            ? detected.medium
            : AI_SOURCES.has(source)
              ? 'ai'
              : source.endsWith('_blog')
                ? 'blog'
                : 'referral');

    return {
        source,
        medium,
        keyword:
            read('utm_term') || detected.keyword || (medium === 'blog' || source.endsWith('_blog') ? campaign : ''),
        campaign,
        url: (isHttpUrl(refUrl) ? refUrl.slice(0, 1000) : '') || detected.url,
        landingUrl: href.split('#')[0].slice(0, 1000),
        landingTitle: title
            .replace(/\s*\|\s*병원광고연구소$/, '')
            .trim()
            .slice(0, 200),
        at: now,
    };
}

const sameTouch = (a: Touch, b: Touch) =>
    a.source === b.source &&
    a.medium === b.medium &&
    a.keyword === b.keyword &&
    a.url === b.url &&
    a.campaign === b.campaign;

/**
 * 최초 유입과 문의 직전 유입을 함께 둔다(GA 의 '마지막 직접 유입 아닌 클릭'과 같은 기준).
 * 직접 재방문은 직전 유입을 지우지 않고, 출처를 모르던 최초 방문은 처음 확인된 출처로 바꾼다
 */
export const nextJourney = (journey: Journey | null, touch: Touch): Journey => {
    if (!journey) return { first: touch, last: touch };
    if (touch.medium === 'direct') return journey;
    if (sameTouch(journey.last, touch) && touch.at - journey.last.at < SESSION) return journey;
    return { first: journey.first.medium === 'direct' ? touch : journey.first, last: touch };
};

type LegacyTraffic = Partial<
    Record<'trafficSource' | 'trafficMedium' | 'trafficKeyword' | 'trafficUrl' | 'landingUrl', string>
> & {
    tracked?: boolean;
    fromQuery?: boolean;
    at?: number;
};

/** 이전 버전이 브라우저에 남긴 값. 출처가 확인된 값만 최초 유입으로 이어 쓴다 */
export const fromLegacy = (raw: LegacyTraffic | null): Touch | null =>
    raw && (raw.tracked || raw.fromQuery) && raw.trafficSource && typeof raw.at === 'number'
        ? {
              source: raw.trafficSource,
              medium: raw.trafficMedium || 'referral',
              keyword: raw.trafficKeyword ?? '',
              campaign: raw.trafficKeyword ?? '',
              url: raw.trafficUrl ?? '',
              landingUrl: raw.landingUrl ?? '',
              landingTitle: '',
              at: raw.at,
          }
        : null;

let memory: Journey | null = null;

const load = (now: number): Journey | null => {
    try {
        const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Journey | null;
        if (typeof saved?.last?.at === 'number' && typeof saved.first?.at === 'number' && now - saved.last.at < TTL) {
            return saved;
        }
        const legacy = fromLegacy(JSON.parse(localStorage.getItem(LEGACY_KEY) ?? 'null'));
        if (legacy && now - legacy.at < TTL) return { first: legacy, last: legacy };
    } catch {}
    return memory;
};

const save = (journey: Journey) => {
    memory = journey;
    try {
        localStorage.setItem(KEY, JSON.stringify(journey));
        localStorage.removeItem(LEGACY_KEY);
    } catch {}
};

const currentVisit = (): Visit => ({
    href: window.location.href,
    referrer: document.referrer,
    userAgent: navigator.userAgent,
    title: document.title,
    now: Date.now(),
});

const formatDay = (at: number) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date(at)).replace(/-/g, '.');

export const captureTraffic = () => {
    const visit = currentVisit();
    save(nextJourney(load(visit.now), classifyVisit(visit)));
};

export const readTraffic = (): Traffic => {
    const visit = currentVisit();
    const { first, last } = load(visit.now) ?? nextJourney(null, classifyVisit(visit));
    const repeat = !sameTouch(first, last);

    return {
        source: trafficLabel(last.source, last.medium),
        trafficSource: last.source,
        trafficMedium: last.medium,
        trafficKeyword: last.keyword,
        trafficUrl: last.url,
        landingUrl: last.landingUrl,
        trafficCampaign: last.campaign,
        landingTitle: last.landingTitle,
        submitUrl: visit.href.split('#')[0].slice(0, 1000),
        device: detectDevice(visit.userAgent),
        firstTouch: repeat
            ? [trafficLabel(first.source, first.medium), first.keyword, formatDay(first.at)].filter(Boolean).join(' · ')
            : '',
        firstTouchUrl: repeat ? first.url : '',
    };
};
