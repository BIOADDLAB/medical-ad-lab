import type { Traffic } from './traffic';

export type Lead = Traffic & {
    createdAt: string;
    hospital: string;
    area: string;
    phone: string;
    email: string;
    message: string;
    trafficTitle: string;
};

/** J~O 는 담당자가 시트에서 직접 채우는 칸이라 유입정보는 그 뒤(P~U)에 둔다 */
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
    'trafficSource',
    'trafficMedium',
    'trafficKeyword',
    'trafficUrl',
    'landingUrl',
    'trafficTitle',
] as const;

/** USER_ENTERED 로 쓰므로 외부에서 들어온 값이 수식으로 해석되지 않게 막는다 */
const asText = (value: string) => (/^[=+\-@]/.test(value) ? `'${value}` : value);

export const leadToRow = (lead: Lead) => [
    lead.createdAt,
    lead.hospital,
    lead.area,
    lead.phone,
    lead.email,
    lead.message,
    lead.source,
    '신규',
    ...Array<string>(7).fill(''),
    asText(lead.trafficSource),
    asText(lead.trafficMedium),
    asText(lead.trafficKeyword),
    asText(lead.trafficUrl),
    asText(lead.landingUrl),
    asText(lead.trafficTitle),
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
    trafficSource: row[15] ?? '',
    trafficMedium: row[16] ?? '',
    trafficKeyword: row[17] ?? '',
    trafficUrl: row[18] ?? '',
    landingUrl: row[19] ?? '',
    trafficTitle: row[20] ?? '',
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
