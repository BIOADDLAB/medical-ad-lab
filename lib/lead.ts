export type Lead = {
    createdAt: string;
    hospital: string;
    area: string;
    phone: string;
    email: string;
    message: string;
    source: string;
};

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
] as const;

export const leadToRow = (lead: Lead) => [
    lead.createdAt,
    lead.hospital,
    lead.area,
    lead.phone,
    lead.email,
    lead.message,
    lead.source,
    '신규',
    '',
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

export type LeadRow = ReturnType<typeof rowToLead>;
