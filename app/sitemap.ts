import type { MetadataRoute } from 'next';
import { insightPosts } from '@/data';
import { getReferences } from '@/lib/references';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
    const references = await getReferences();
    const fixed = ['', '/insight', '/about', '/privacy'];
    const journals = insightPosts.map((post) => `/about/${post.slug}`);
    const referencePages = references.map((item) => `/insight/reference/${item.slug}`);
    return [...fixed, ...journals, ...referencePages].map((path) => ({
        url: `${baseUrl}${path}`,
        lastModified: new Date(),
        changeFrequency: path === '' ? 'weekly' : 'monthly',
        priority: path === '' ? 1 : path === '/privacy' ? 0.3 : 0.8,
    }));
}
