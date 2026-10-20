import { SITE_URL } from '@/lib/site';
import { sitemapIndex, xmlResponse } from '@/lib/sitemap-xml';

export const dynamic = 'force-static';

/** 사이트맵 색인(/sitemap.xml): 페이지(사례·광고 자리 포함)와 블로그 글(CMS) 사이트맵을 묶는다 */
export function GET() {
    return xmlResponse(sitemapIndex([`${SITE_URL}/sitemap-pages.xml`, `${SITE_URL}/blog/sitemap.xml`]));
}
