import type { Metadata } from 'next';

import { BlogArticle, ClientArticle } from '@/bioadd-blog/ui-client';
import { JsonLd } from '@/bioadd-blog/ui';
import {
    articleJsonLd,
    articlePageMetadata,
    breadcrumbJsonLd,
    getPublishedArticleBySlug,
    getRelatedArticles,
} from '@/bioadd-blog/kit';

export const revalidate = 60;
export const dynamicParams = true;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
    return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const article = await getPublishedArticleBySlug(slug).catch(() => null);
    if (!article) return { title: '글을 불러오는 중', robots: { index: true, follow: true } };
    return articlePageMetadata(article);
}

export default async function BlogArticlePage({ params }: PageProps) {
    const { slug } = await params;
    const article = await getPublishedArticleBySlug(slug).catch(() => null);
    if (!article) return <ClientArticle slug={slug} />;
    const related = await getRelatedArticles(article).catch(() => []);
    return (
        <>
            <JsonLd data={articleJsonLd(article)} />
            <JsonLd data={breadcrumbJsonLd(article)} />
            <BlogArticle article={article} related={related} />
        </>
    );
}
