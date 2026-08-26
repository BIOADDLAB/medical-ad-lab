import { HOSPITAL } from '@/bioadd-blog/hospital.config';
import { absoluteUrl, blogPostUrl, getPublishedArticles } from '@/bioadd-blog/kit';

export async function GET() {
    const articles = await getPublishedArticles();
    const items = articles
        .map(
            (article) => `<item>
  <title><![CDATA[${article.title}]]></title>
  <link>${blogPostUrl(article.slug)}</link>
  <guid>${blogPostUrl(article.slug)}</guid>
  <pubDate>${new Date(article.createdAt).toUTCString()}</pubDate>
  <description><![CDATA[${article.excerpt}]]></description>
</item>`,
        )
        .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${HOSPITAL.name} 블로그</title>
    <link>${absoluteUrl('/blog')}</link>
    <description>발행된 블로그 글 피드</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${absoluteUrl('/blog/feed.xml')}" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

    return new Response(xml, {
        headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
    });
}
