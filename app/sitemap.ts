import type { MetadataRoute } from 'next';
import { getReferences, getSpots } from '@/lib/references';
import { SITE_URL } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = SITE_URL;
    const [references, spots] = await Promise.all([getReferences(), getSpots()]);
    // 블로그는 /blog/sitemap.xml 이 따로 담당한다. 여기에는 넣지 않는다
    const fixed = ['', '/company', '/media', '/cases', '/privacy'];
    const referencePages = references.map((item) => `/cases/${item.slug}`);
    const spotPages = spots.map((item) => `/media/${item.slug}`);
    return [...fixed, ...referencePages, ...spotPages].map((path) => ({
        url: `${baseUrl}${path}`,
        lastModified: new Date(),
        changeFrequency: path === '' ? 'weekly' : 'monthly',
        priority: path === '' ? 1 : path === '/privacy' ? 0.3 : 0.8,
    }));
}
