import { BLOG, MENU, absolute, articlePath, description, getArticles } from "@/bioadd-blog/kit";
import { HOSPITAL } from "@/bioadd-blog/hospital.config";
// 빌드할 때는 CMS를 부르지 않고 요청이 올 때 만듭니다(CMS가 잠시 응답하지 않아도 사이트 배포가 멈추지 않게). 글 목록은 kit.ts가 60초 동안 기억합니다.
export const dynamic = "force-dynamic";
const esc = (text: string) => text.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
export async function GET() {
  let articles: Awaited<ReturnType<typeof getArticles>>;
  try {
    articles = await getArticles();
  } catch (error) {
    console.error(`[bioadd-blog] ${error instanceof Error ? error.message : String(error)}`);
    return new Response("CMS 발행 데이터를 잠시 불러오지 못했습니다.", { status: 503, headers: { "Retry-After": "120", "Cache-Control": "no-store" } });
  }
  const items = articles.slice(0, 30).map((a) => {
    const url = esc(absolute(articlePath(a.slug)));
    return `<item><title>${esc(a.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${new Date(a.publishedAt!).toUTCString()}</pubDate><description>${esc(description(a))}</description>${a.category ? `<category>${esc(a.category)}</category>` : ""}</item>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(`${MENU} | ${HOSPITAL.name}`)}</title><link>${esc(absolute(BLOG))}</link><description>${esc(HOSPITAL.description || `${HOSPITAL.name}의 ${MENU}`)}</description><language>ko</language><atom:link href="${esc(absolute(`${BLOG}/feed.xml`))}" rel="self" type="application/rss+xml"/>${items.join("")}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
