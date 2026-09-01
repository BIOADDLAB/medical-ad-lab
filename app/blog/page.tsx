import type { Metadata } from 'next';

import { BlogList, JsonLd } from '@/bioadd-blog/ui';
import { blogIndexJsonLd, blogIndexMetadata, getPublishedArticles } from '@/bioadd-blog/kit';

export const revalidate = 60;

type PageProps = { searchParams: Promise<{ category?: string }> };

/** 필터는 쿼리로만 받는다. 목록에 없는 값이면 전체로 되돌린다 */
async function resolve(searchParams: PageProps['searchParams']) {
    const [{ category }, articles] = await Promise.all([searchParams, getPublishedArticles().catch(() => [])]);
    const categories = ['all', ...Array.from(new Set(articles.map((item) => item.category).filter(Boolean)))];
    const current = category && categories.includes(category) ? category : 'all';
    const visible = current === 'all' ? articles : articles.filter((item) => item.category === current);
    return { articles: visible, categories, current };
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
    const { current } = await resolve(searchParams);
    return blogIndexMetadata(current === 'all' ? undefined : current);
}

export default async function BlogPage({ searchParams }: PageProps) {
    const { articles, categories, current } = await resolve(searchParams);
    return (
        <>
            <JsonLd data={blogIndexJsonLd(articles)} />
            <BlogList articles={articles} categories={categories} current={current} />
        </>
    );
}
