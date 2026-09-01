import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * URL 정규화. 대문자가 섞인 주소로 같은 글이 중복 색인되지 않게 소문자로 301 보낸다.
 * 후행 슬래시는 Next 가 프록시보다 먼저 308(영구)로 떨어뜨리므로 여기서 다시 다루지 않는다.
 */
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    if (pathname === pathname.toLowerCase()) return NextResponse.next();

    const url = request.nextUrl.clone();
    url.pathname = pathname.toLowerCase();
    return NextResponse.redirect(url, 301);
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico|.*\\.[a-z0-9]+$).*)'],
};
