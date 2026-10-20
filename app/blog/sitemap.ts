import type { MetadataRoute } from "next";
import { BLOG, absolute, articlePath, getArticles } from "@/bioadd-blog/kit";
export const revalidate = 60;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getArticles();
  const latest = articles.reduce((max, a) => (a.updatedAt > max ? a.updatedAt : max), "");
  return [{ url: absolute(BLOG), ...(latest ? { lastModified: new Date(latest) } : {}) }, ...articles.map((a) => ({ url: absolute(articlePath(a.slug)), lastModified: new Date(a.updatedAt) }))];
}
