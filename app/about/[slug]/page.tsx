import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleDetail } from '@/components/journal/article-detail';
import { insightPosts } from '@/data';

export function generateStaticParams() {
    return insightPosts.map((post) => ({ slug: post.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const post = insightPosts.find((item) => item.slug === slug);
    return post
        ? { title: post.title, description: post.excerpt, alternates: { canonical: `/about/${post.slug}` } }
        : {};
}
export default async function JournalDetail({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = insightPosts.find((item) => item.slug === slug);
    if (!post) notFound();
    return <ArticleDetail article={post} section="연구소 저널" />;
}
