import { NextResponse, type NextRequest } from "next/server";
import { HOSPITAL } from "./hospital.config";
const BLOG = HOSPITAL.blogPath;
const CATEGORIES: Record<string, string> = HOSPITAL.categories;
/**
 * 블로그: 대문자·끝 슬래시·예전 글 주소·한글 카테고리·도메인을 최종 주소로 한 번에 301 이동합니다. CMS가 응답하지 않으면 이동 없이 그대로 보여 줍니다.
 * 블로그 밖: 끝 슬래시 주소(/about/)를 슬래시 없는 주소로 301 이동합니다. next.config의 skipTrailingSlashRedirect와 함께 씁니다.
 */
export async function bioaddBlogRedirect(request: NextRequest) {
  const path = request.nextUrl.pathname, lower = path.toLowerCase();
  if (lower !== BLOG && !lower.startsWith(`${BLOG}/`)) {
    if (path.length < 2 || !path.endsWith("/")) return null;
    // nextUrl을 고쳐 쓰면 원래 끝 슬래시가 다시 붙으므로 새 주소로 만듭니다.
    return NextResponse.redirect(new URL((path.replace(/\/+$/, "") || "/") + request.nextUrl.search, request.url), 301);
  }
  let clean = lower.replace(/\/+$/, "") || BLOG;
  const canonical = new URL(process.env.NEXT_PUBLIC_SITE_URL || HOSPITAL.siteUrl);
  const slug = clean.slice(BLOG.length + 1);
  if (/^[a-z0-9-]+$/.test(slug)) {
    try {
      const response = await fetch(`${HOSPITAL.cmsUrl}/api/public/articles/${slug}?hospitalId=${encodeURIComponent(HOSPITAL.id)}`, { signal: AbortSignal.timeout(5000) });
      if (response.ok) clean = `${BLOG}/${((await response.json()) as { slug: string }).slug}`;
      else if (response.status !== 404) console.error(`[bioadd-blog] CMS 주소 확인 실패 ${response.status}`);
    } catch (e) {
      console.error(`[bioadd-blog] CMS 주소 확인 실패 ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  let search = request.nextUrl.search;
  const category = request.nextUrl.searchParams.get("category");
  if (category && CATEGORIES[category]) {
    const params = new URLSearchParams(request.nextUrl.searchParams);
    params.set("category", CATEGORIES[category]);
    search = `?${params}`;
  }
  if (path === clean && search === request.nextUrl.search && request.nextUrl.origin === canonical.origin) return null;
  return NextResponse.redirect(new URL(clean + search, canonical), 301);
}
