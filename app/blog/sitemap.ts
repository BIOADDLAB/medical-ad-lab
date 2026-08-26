import type { MetadataRoute } from 'next';

import { absoluteUrl, blogPostUrl, getPublishedArticles, requirePublicOrigin } from '@/bioadd-blog/kit';

/** 호스트 루트 sitemap과 분리. 여기에는 /blog 경로만 넣습니다. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const origin = requirePublicOrigin();
    const articles = await getPublishedArticles();
    const entries: MetadataRoute.Sitemap = [
        { url: absoluteUrl('/blog'), lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
        ...articles.map((article) => ({
            url: blogPostUrl(article.slug),
            lastModified: new Date(article.updatedAt),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        })),
    ];
    return entries.filter((entry) => entry.url.startsWith(origin));
}
