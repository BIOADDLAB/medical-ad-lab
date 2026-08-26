import type { Metadata } from 'next';

import { ClientBlogList } from '@/bioadd-blog/ui-client';
import { JsonLd } from '@/bioadd-blog/ui';
import { blogIndexJsonLd, blogIndexMetadata, getPublishedArticles } from '@/bioadd-blog/kit';

export const revalidate = 60;
export const metadata: Metadata = blogIndexMetadata();

export default async function BlogPage() {
    const articles = await getPublishedArticles().catch(() => []);
    return (
        <>
            <JsonLd data={blogIndexJsonLd(articles)} />
            <ClientBlogList initial={articles} />
        </>
    );
}
