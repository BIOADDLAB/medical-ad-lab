import { getReferences, getSpots } from '@/lib/references';
import { SITE_URL } from '@/lib/site';
import { urlSet, xmlResponse } from '@/lib/sitemap-xml';

export const revalidate = 60;

/**
 * 고정 페이지 + 사례·광고 자리. lastmod는 관리자 화면이 저장한 수정 시각이 있는 주소에만 넣는다.
 * 목록 페이지(/cases, /media)는 가장 최근에 고친 항목의 시각을 쓴다. 코드로 만든 고정 페이지는 알 수 없어 넣지 않는다.
 */
export async function GET() {
    const [references, spots] = await Promise.all([getReferences(), getSpots()]);
    const latest = (items: { updatedAt?: string }[]) => items.reduce((max, item) => (item.updatedAt && item.updatedAt > max ? item.updatedAt : max), '');
    return xmlResponse(
        urlSet([
            { loc: SITE_URL },
            { loc: `${SITE_URL}/company` },
            { loc: `${SITE_URL}/media`, lastmod: latest(spots) || undefined },
            { loc: `${SITE_URL}/cases`, lastmod: latest(references) || undefined },
            { loc: `${SITE_URL}/privacy` },
            ...references.map((item) => ({ loc: `${SITE_URL}/cases/${item.slug}`, lastmod: item.updatedAt })),
            ...spots.map((item) => ({ loc: `${SITE_URL}/media/${item.slug}`, lastmod: item.updatedAt })),
        ]),
    );
}
