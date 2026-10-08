import type { Traffic } from './traffic';

export type Lead = Traffic & {
    createdAt: string;
    hospital: string;
    area: string;
    phone: string;
    email: string;
    message: string;
};

/** 유입정보는 P열부터 이 순서로 쓴다. 이미 쌓인 행의 열 위치가 바뀌지 않도록 새 항목은 끝에만 붙인다 */
const TRAFFIC_COLUMNS = [
    'trafficSource',
    'trafficMedium',
    'trafficKeyword',
    'trafficUrl',
    'landingUrl',
    'trafficTitle',
    'trafficCampaign',
    'landingTitle',
    'submitUrl',
    'device',
    'firstTouch',
    'firstTouchUrl',
    'trafficContent',
    'trafficTerm',
    'trafficAdKeyword',
    'trafficKeywordType',
    'trafficEvidence',
    'trafficReferrer',
    'trafficCapturedAt',
    'firstLandingUrl',
    'firstLandingTitle',
    'sessionSource',
    'sessionLandingUrl',
    'sessionLandingTitle',
    'viewedArticles',
    'journeyPages',
    'trackingVersion',
] as const satisfies readonly (keyof Lead)[];

/** J~O 는 담당자가 시트에서 직접 채우는 칸이라 유입정보는 그 뒤에 둔다 */
export const LEAD_COLUMNS = [
    '접수일시',
    '병원명',
    '지역',
    '연락처',
    '이메일',
    '문의내용',
    '유입경로',
    '처리상태',
    '상담메모',
    '담당자',
    '최초연락일',
    '관심매체',
    '제안금액',
    '제안발송일',
    '다음 연락 예정일',
    ...TRAFFIC_COLUMNS,
] as const;

const TRAFFIC_START = LEAD_COLUMNS.indexOf(TRAFFIC_COLUMNS[0]);

export const leadToRow = (lead: Lead) => [
    lead.createdAt,
    lead.hospital,
    lead.area,
    lead.phone,
    lead.email,
    lead.message,
    lead.source,
    '신규',
    ...Array<string>(TRAFFIC_START - 8).fill(''),
    ...TRAFFIC_COLUMNS.map((key) => lead[key]),
];

export const rowToLead = (row: string[]) => ({
    createdAt: row[0] ?? '',
    hospital: row[1] ?? '',
    area: row[2] ?? '',
    phone: row[3] ?? '',
    email: row[4] ?? '',
    message: row[5] ?? '',
    source: row[6] ?? '',
    status: row[7] || '신규',
    memo: row[8] ?? '',
    ...(Object.fromEntries(TRAFFIC_COLUMNS.map((key, index) => [key, row[TRAFFIC_START + index] ?? ''])) as Record<
        (typeof TRAFFIC_COLUMNS)[number],
        string
    >),
});

export const formatKST = (date = new Date()) =>
    new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date);

/**
 * 접수일시 앞부분("2026. 08.")과 글자까지 같은 문자열.
 * Intl 로 연·월만 뽑으면 "2026. 8." 이 나와 0이 빠지므로 직접 맞춘다
 */
export const monthPrefixKST = (date = new Date()) => {
    const [year, month] = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
    })
        .format(date)
        .split('-');
    return `${year}. ${month}.`;
};

export type LeadRow = ReturnType<typeof rowToLead>;
