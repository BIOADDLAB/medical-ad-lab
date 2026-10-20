import { BLOG, MENU, absolute, articlePath, description, getArticles } from "@/bioadd-blog/kit";
import { HOSPITAL } from "@/bioadd-blog/hospital.config";
export const revalidate = 60;
const esc = (text: string) => text.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
export async function GET() {
  const items = (await getArticles()).slice(0, 30).map((a) => {
    const url = esc(absolute(articlePath(a.slug)));
    return `<item><title>${esc(a.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${new Date(a.publishedAt!).toUTCString()}</pubDate><description>${esc(description(a))}</description>${a.category ? `<category>${esc(a.category)}</category>` : ""}</item>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(`${MENU} | ${HOSPITAL.name}`)}</title><link>${esc(absolute(BLOG))}</link><description>${esc(HOSPITAL.description || `${HOSPITAL.name}의 ${MENU}`)}</description><language>ko</language><atom:link href="${esc(absolute(`${BLOG}/feed.xml`))}" rel="self" type="application/rss+xml"/>${items.join("")}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
