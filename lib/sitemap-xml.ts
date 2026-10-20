// 사이트맵 XML(색인 파일·URL 목록). Next 사이트맵 파일 규칙은 색인 파일을 만들지 않아 직접 쓴다.
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);

export const xmlResponse = (xml: string) =>
    new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=600' } });

/** 사이트맵 색인: 페이지·블로그 사이트맵을 묶는다 */
export function sitemapIndex(locs: string[]) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locs.map((loc) => `  <sitemap><loc>${esc(loc)}</loc></sitemap>`).join('\n')}\n</sitemapindex>\n`;
}

/** URL 목록. lastmod는 실제 수정 시각을 아는 주소에만 넣는다(요청·빌드 시각을 수정일처럼 쓰지 않음) */
export function urlSet(rows: { loc: string; lastmod?: string }[]) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.map((r) => `  <url><loc>${esc(r.loc)}</loc>${r.lastmod ? `<lastmod>${esc(r.lastmod)}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`;
}
