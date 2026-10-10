import { JWT } from 'google-auth-library';
import type { ReportRange } from './traffic-report';

const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const property = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL?.trim() || '';
const validProperty =
    /^sc-domain:[a-z0-9.-]+$/i.test(property) ||
    (() => {
        try {
            const url = new URL(property);
            return (
                ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash
            );
        } catch {
            return false;
        }
    })();
export const searchConsoleReady = Boolean(email && key && validProperty);
export const searchConsoleProperty = property;
export const searchConsoleAccount = email || '';
const auth = searchConsoleReady
    ? new JWT({
          email,
          key,
          scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
      })
    : null;

export type SearchMetrics = { clicks: number; impressions: number; ctr: number; position: number };
export type SearchRow = SearchMetrics & { query: string };
export type SearchReport = ReportRange & {
    siteUrl: string;
    fetchedAt: string;
    lastDataDate: string;
    totals: SearchMetrics | null;
    rows: SearchRow[];
    truncated: boolean;
};
export type SearchPayload = {
    ready: boolean;
    siteUrl: string;
    serviceAccount: string;
    report?: SearchReport;
    message?: string;
};
type ApiResult = { rows?: (SearchMetrics & { keys?: string[] })[] };

export class SearchConsoleError extends Error {
    constructor(
        public status: number,
        message: string,
    ) {
        super(message);
    }
}

export async function readSearchReport(range: ReportRange): Promise<SearchReport> {
    if (!auth) throw new SearchConsoleError(503, 'Search Console 조회 설정을 먼저 완료해 주세요.');
    const { token } = await auth.getAccessToken();
    if (!token) throw new SearchConsoleError(502, '서비스 계정 인증에 실패했습니다.');
    const query = async (dimensions: string[], rowLimit: number): Promise<ApiResult> => {
        const response = await fetch(
            `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`,
            {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDate: range.from,
                    endDate: range.to,
                    type: 'web',
                    dataState: 'final',
                    dimensions,
                    rowLimit,
                    aggregationType: 'byProperty',
                }),
                cache: 'no-store',
                signal: AbortSignal.timeout(15000),
            },
        );
        if (!response.ok) {
            const message =
                response.status === 403
                    ? 'Search Console에서 아래 서비스 계정의 조회 권한과 해당 Google Cloud 프로젝트의 Search Console API 사용 설정을 확인해 주세요.'
                    : response.status === 404
                      ? '등록된 속성 주소와 GOOGLE_SEARCH_CONSOLE_SITE_URL 값이 같은지 확인해 주세요.'
                      : response.status === 429
                        ? 'Google 조회 한도에 도달했습니다. 잠시 후 다시 조회해 주세요.'
                        : '구글 검색어를 불러오지 못했습니다. 서비스 계정과 속성 주소를 확인해 주세요.';
            throw new SearchConsoleError(response.status, message);
        }
        return response.json() as Promise<ApiResult>;
    };
    // 검색어 합계에는 비공개 검색어가 빠지므로 전체 지표를 별도로 조회한다.
    const [keywords, totals, dates] = await Promise.all([query(['query'], 1001), query([], 1), query(['date'], 90)]);
    const rows = keywords.rows || [];
    return {
        ...range,
        siteUrl: property,
        fetchedAt: new Date().toISOString(),
        lastDataDate: dates.rows?.at(-1)?.keys?.[0] || '',
        totals: totals.rows?.[0] || null,
        rows: rows.slice(0, 1000).map((row) => ({
            query: row.keys?.[0] || '',
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            position: row.position,
        })),
        truncated: rows.length > 1000,
    };
}
