import { naverBlogUrl } from './traffic';

const POST_URL = /^https:\/\/blog\.naver\.com\/([\w-]+)\/(\d+)$/;

const decode = (value: string) =>
    value
        .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
        .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');

/** 링크를 눌러보지 않아도 어떤 글인지 알 수 있게 제목만 읽어 온다. 실패해도 접수는 막지 않는다 */
export async function fetchNaverBlogTitle(url: string) {
    const match = naverBlogUrl(url).match(POST_URL);
    if (!match) return '';
    try {
        const response = await fetch(`https://blog.naver.com/PostView.naver?blogId=${match[1]}&logNo=${match[2]}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            redirect: 'error',
            signal: AbortSignal.timeout(2500),
        });
        if (!response.ok) return '';
        const title = decode((await response.text()).match(/<meta property="og:title" content="([^"]*)"/)?.[1] ?? '');
        return title === '네이버 블로그' ? '' : title.trim().slice(0, 200);
    } catch {
        return '';
    }
}
