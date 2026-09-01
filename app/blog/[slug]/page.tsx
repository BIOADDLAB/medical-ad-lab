import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BlogArticle, JsonLd } from '@/bioadd-blog/ui';
import {
    articleJsonLd,
    articlePageMetadata,
    breadcrumbJsonLd,
    getPublishedArticleBySlug,
    getPublishedArticles,
    getRelatedArticles,
} from '@/bioadd-blog/kit';

export const revalidate = 60;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
    const articles = await getPublishedArticles().catch(() => []);
    return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const article = await getPublishedArticleBySlug(slug).catch(() => null);
    // 미발행·삭제 글은 색인 대상이 아니다
    if (!article) return { title: '글을 찾을 수 없습니다', robots: { index: false, follow: false } };
    return articlePageMetadata(article);
}

export default async function BlogArticlePage({ params }: PageProps) {
    const { slug } = await params;
    const article = await getPublishedArticleBySlug(slug).catch(() => null);
    if (!article) notFound();
    const related = await getRelatedArticles(article).catch(() => []);
    return (
        <>
            <JsonLd data={articleJsonLd(article)} />
            <JsonLd data={breadcrumbJsonLd(article)} />
            <BlogArticle article={article} related={related} />
        </>
    );
}
