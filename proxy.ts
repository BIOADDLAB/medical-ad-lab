import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { HOSPITAL } from '@/bioadd-blog/hospital.config';
import { bioaddBlogRedirect } from '@/bioadd-blog/proxy';

const BLOG = HOSPITAL.blogPath;

/**
 * URL 정규화(301 한 번).
 * - 블로그: 대문자·끝 슬래시·예전 글 주소·한글 카테고리를 최종 주소로 (bioadd-blog/proxy.ts)
 * - 그 밖: 대문자는 소문자로, 끝 슬래시(/company/)는 뗀 주소로. 같은 페이지가 여러 주소로 색인되지 않게 한다.
 *   끝 슬래시는 next.config의 skipTrailingSlashRedirect로 Next 기본(308) 대신 여기서 처리한다.
 */
export async function proxy(request: NextRequest) {
    const { pathname, search } = request.nextUrl;
    const lower = pathname.toLowerCase();
    if (lower === BLOG || lower.startsWith(`${BLOG}/`)) return (await bioaddBlogRedirect(request)) || NextResponse.next();

    const clean = lower.length > 1 ? lower.replace(/\/+$/, '') || '/' : lower;
    if (clean === pathname) return NextResponse.next();
    return NextResponse.redirect(new URL(clean + search, request.url), 301);
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico|.*\\.[a-z0-9]+$).*)'],
};
