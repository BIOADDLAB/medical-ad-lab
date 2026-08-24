import type { MetadataRoute } from 'next';

/**
 * AI 답변 엔진에 인용되려면 검색용 크롤러를 열어 둬야 한다.
 * `*` 로 이미 전부 허용이지만, 명시해 두면 봇이 자기 이름 규칙을 먼저 찾는다.
 */
const AI_CRAWLERS = [
    'OAI-SearchBot',
    'ChatGPT-User',
    'GPTBot',
    'Claude-SearchBot',
    'Claude-User',
    'ClaudeBot',
    'PerplexityBot',
    'Perplexity-User',
    'Google-Extended',
    'Applebot-Extended',
];

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
    return {
        rules: [
            { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
            ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: '/', disallow: ['/admin', '/api/'] })),
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
