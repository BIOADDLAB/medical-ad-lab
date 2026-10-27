import type { MetadataRoute } from "next";
import { BLOG, absolute, articlePath, getArticles } from "@/medicaladlab-blog/kit";
// 빌드할 때는 CMS를 부르지 않고 요청이 올 때 만듭니다(CMS가 잠시 응답하지 않아도 사이트 배포가 멈추지 않게). 글 목록은 kit.ts가 60초 동안 기억합니다.
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getArticles();
  const latest = articles.reduce((max, a) => (a.updatedAt > max ? a.updatedAt : max), "");
  return [{ url: absolute(BLOG), ...(latest ? { lastModified: new Date(latest) } : {}) }, ...articles.map((a) => ({ url: absolute(articlePath(a.slug)), lastModified: new Date(a.updatedAt) }))];
}
