import "server-only";
import { cache } from "react";
import type { Metadata } from "next";
import { HOSPITAL } from "./hospital.config";

export type Article = {
  id: string; hospitalId: string; title: string; slug: string; content: string; excerpt: string;
  coverImage: string; coverImageAlt: string; coverImageCaption?: string; category: string; tags: string[];
  faq: { question: string; answer: string }[]; publishedAt?: string; createdAt: string; updatedAt: string;
  previousSlugs?: string[]; status: string; serviceName?: string; serviceUrl?: string; deletedAt?: string;
  /** 원장 감수 시각·감수자(CMS 편집기에서 확인한 글만) */
  reviewedAt?: string; reviewedBy?: string;
};
export type Crumb = { name: string; path: string };

export const BLOG = HOSPITAL.blogPath;
export const MENU = HOSPITAL.menuName;
export const PER_PAGE = 12;
export const MEDICAL = HOSPITAL.schemaProfile !== "business";
const CATEGORIES: Record<string, string> = HOSPITAL.categories;
const link = (value?: string) => (/^\/(?!\/)|^https:\/\//.test(value || "") ? value! : "");
/** 문의 페이지(사이트 안 경로 또는 https 주소). 글 끝 상담 버튼의 기본 링크이고, 이 주소로 가는 클릭을 문의로 셉니다. */
export const CONTACT = link(HOSPITAL.contactUrl);
/** 카테고리별 관련 진료·서비스 페이지. 글에 관련 진료 페이지가 없을 때 글 끝 버튼으로 씁니다. */
const PAGES: Record<string, string> = HOSPITAL.categoryPages;
/** 글 끝 상담 박스. 문구를 비우면 기본 문구, 버튼 링크를 비우면 문의 페이지입니다. */
export const CTA = {
  title: HOSPITAL.cta.title || (MEDICAL ? "상담이 필요하신가요?" : "문의가 필요하신가요?"),
  text: HOSPITAL.cta.text,
  label: HOSPITAL.cta.label || (MEDICAL ? "상담·진료 안내" : "상담 문의"),
  url: link(HOSPITAL.cta.url) || CONTACT,
};

export function origin() {
  const value = process.env.NEXT_PUBLIC_SITE_URL || HOSPITAL.siteUrl;
  if (!value) throw new Error("NEXT_PUBLIC_SITE_URL에 실제 공개 도메인을 설정하세요.");
  return new URL(value).origin;
}
export const absolute = (path: string) => new URL(path, origin()).href;
export const categoryKey = (label: string) => CATEGORIES[label] || "";
export const categoryLabel = (key: string) => Object.keys(CATEGORIES).find((label) => CATEGORIES[label] === key) || "";
export function listPath(category = "", page = 1) {
  const p = new URLSearchParams();
  if (categoryKey(category)) p.set("category", categoryKey(category));
  if (page > 1) p.set("page", String(page));
  return `${BLOG}${p.size ? `?${p}` : ""}`;
}
export const articlePath = (slug: string) => `${BLOG}/${slug}`;

/** CMS 발행 규칙과 같습니다. 맞지 않는 글은 블로그 전체를 멈추지 않고 그 글만 빼고 서버 로그에 남깁니다. */
export function articleProblem(a: Article) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.slug || "") || a.slug.length < 3 || a.slug.length > 100) return "글 주소";
  if (!a.title?.trim()) return "제목";
  if (!a.publishedAt || Number.isNaN(Date.parse(a.publishedAt))) return "발행일";
  if (!a.coverImage || !a.coverImageAlt?.trim()) return "대표 이미지";
  return "";
}

export const getArticles = cache(async (): Promise<Article[]> => {
  const response = await fetch(`${HOSPITAL.cmsUrl}/api/public/articles?hospitalId=${encodeURIComponent(HOSPITAL.id)}`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(15000) });
  // 응답 코드와 CMS 주소를 남겨야 배포·서버 기록에서 원인(주소 오류 404, CMS 오류 503 등)을 바로 압니다.
  if (!response.ok) throw new Error(`CMS 발행 데이터를 불러오지 못했습니다 (${response.status} ${new URL(HOSPITAL.cmsUrl).host}).`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("CMS 응답 형식이 올바르지 않습니다.");
  return (data as Article[])
    .filter((a) => a.status === "published" && a.hospitalId === HOSPITAL.id && !a.deletedAt)
    .filter((a) => {
      const problem = articleProblem(a);
      if (problem) console.error(`[bioadd-blog] ${problem} 규칙에 맞지 않아 공개하지 않은 글: ${a.title || a.id}`);
      return !problem;
    })
    .sort((a, b) => b.publishedAt!.localeCompare(a.publishedAt!));
});
export async function getArticle(slug: string) {
  const articles = await getArticles();
  return articles.find((a) => a.slug === slug || a.previousSlugs?.includes(slug)) || null;
}
export function faqs(a: Article) {
  const valid = (a.faq || []).filter((f) => f.question?.trim() && f.answer?.trim());
  return valid.length >= 2 ? valid : [];
}
export function relatedArticles(all: Article[], a: Article) {
  const others = all.filter((x) => x.id !== a.id);
  return [...others.filter((x) => x.category === a.category), ...others.filter((x) => x.category !== a.category)].slice(0, 3);
}
/** 글에 연결한 진료 페이지(없으면 카테고리의 관련 페이지)를 먼저, 다음에 상담 버튼. 둘 다 없으면 상담 박스를 그리지 않습니다. */
export function ctaLinks(a?: Article) {
  const links: { label: string; href: string }[] = [];
  const service = a?.serviceUrl && /^\/(?!\/)/.test(a.serviceUrl) ? { label: `${a.serviceName || "진료"} 안내`, href: a.serviceUrl } : a && PAGES[a.category] ? { label: `${a.category} 안내`, href: PAGES[a.category] } : null;
  if (service && service.href !== CTA.url) links.push(service);
  if (CTA.url) links.push({ label: CTA.label, href: CTA.url });
  return links;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
export function decode(text: string) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] !== "#") return ENTITIES[code.toLowerCase()] ?? match;
    const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : Number(code.slice(1));
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : match;
  });
}
export const plain = (html: string) => decode(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
const cut = (text: string, max = 155) => (text.length > max ? `${text.slice(0, max)}…` : text);
/** 검색 설명 = 글 상단 요약(리드). 요약이 비었을 때만 본문 앞부분을 씁니다. */
export const description = (a: Article) => cut(plain(a.excerpt?.trim() ? a.excerpt : a.content));
export function toc(html: string) {
  return [...html.matchAll(/<(h[23])\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) => ({ id: m[2], level: m[1], title: plain(m[3]) }));
}
/** 한국 시간 ISO 8601. 예: 2026-08-31T14:00:00+09:00 */
export function kst(iso?: string) {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(t) ? undefined : `${new Date(t + 9 * 3600_000).toISOString().slice(0, 19)}+09:00`;
}
export const dateLabel = (iso: string) => new Date(iso).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });

/** 60자를 넘으면 병원명은 두고 앞부분만 줄입니다. */
function pageTitle(main: string) {
  const suffix = ` | ${HOSPITAL.name}`, room = Math.max(60 - suffix.length, 10);
  return `${main.length > room ? `${main.slice(0, room - 1)}…` : main}${suffix}`;
}
export function listLead(category: string, total: number) {
  const lead = HOSPITAL.description || `${HOSPITAL.name}의 ${MENU}입니다.`;
  return category ? `${HOSPITAL.name}의 ${category} 글 ${total}개를 모았습니다. ${lead}` : lead;
}
// 카테고리 이름이 메뉴 이름과 같으면(예: 칼럼) 전체 목록과 제목이 겹치지 않게 '글 모음'을 붙입니다.
const listTitle = (category: string, page: number) => pageTitle(`${!category ? MENU : category === MENU ? `${category} 글 모음` : `${category} | ${MENU}`}${page > 1 ? ` ${page}페이지` : ""}`);
const listDescription = (category: string, page: number, total: number) => cut(`${page > 1 ? `${page}페이지 · ` : ""}${listLead(category, total)}`);
const feed = () => ({ "application/rss+xml": absolute(`${BLOG}/feed.xml`) });

export function listMetadata(category: string, page: number, total: number): Metadata {
  const url = absolute(listPath(category, page)), title = listTitle(category, page), description = listDescription(category, page, total);
  return {
    title: { absolute: title }, description, alternates: { canonical: url, types: feed() }, robots: { index: true, follow: true },
    openGraph: { type: "website", title, description, url, siteName: HOSPITAL.name, locale: "ko_KR", images: HOSPITAL.imageUrl ? [{ url: HOSPITAL.imageUrl, alt: `${HOSPITAL.name} 대표 이미지` }] : undefined },
    twitter: { card: "summary_large_image", title, description },
  };
}
export function articleMetadata(a: Article): Metadata {
  const url = absolute(articlePath(a.slug)), text = description(a);
  return {
    title: { absolute: pageTitle(a.title) }, description: text, alternates: { canonical: url, types: feed() }, robots: { index: true, follow: true },
    openGraph: { type: "article", title: a.title, description: text, url, siteName: HOSPITAL.name, locale: "ko_KR", publishedTime: kst(a.publishedAt), modifiedTime: kst(a.updatedAt), tags: a.tags, images: [{ url: a.coverImage, alt: a.coverImageAlt }] },
    twitter: { card: "summary_large_image", title: a.title, description: text, images: [a.coverImage] },
  };
}

export function crumbs(category = "", article?: Article): Crumb[] {
  return [
    { name: "홈", path: "/" },
    { name: MENU, path: BLOG },
    ...(categoryKey(category) && category !== MENU ? [{ name: category, path: listPath(category) }] : []),
    ...(article ? [{ name: article.title, path: articlePath(article.slug) }] : []),
  ];
}
export const breadcrumbSchema = (items: Crumb[]) => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: items.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: absolute(c.path) })),
});
// 병원 공통 정보(MedicalClinic)는 홈에 한 번 넣고, 블로그는 같은 @id로 이어 붙입니다.
const orgId = () => `${origin()}#organization`;
const organization = () => ({ "@type": MEDICAL ? "MedicalOrganization" : "Organization", "@id": orgId(), name: HOSPITAL.name, url: origin(), ...(HOSPITAL.logoUrl ? { logo: { "@type": "ImageObject", url: HOSPITAL.logoUrl } } : {}) });
const website = () => ({ "@type": "WebSite", "@id": `${origin()}#website`, name: HOSPITAL.name, url: origin() });
export const doctorShown = MEDICAL && !!HOSPITAL.doctorName;
const doctor = () => ({ "@type": "Person", "@id": `${origin()}#doctor`, name: HOSPITAL.doctorName, ...(HOSPITAL.doctorTitle ? { jobTitle: HOSPITAL.doctorTitle } : {}), ...(HOSPITAL.doctorBio ? { description: HOSPITAL.doctorBio } : {}), worksFor: { "@id": orgId() } });
/** 감수한 사람: 대표 원장이면 의료진 정보(@id)로, 다른 사람이면 이름만 */
function reviewer(a: Article) {
  if (!a.reviewedAt) return null;
  if (doctorShown && (!a.reviewedBy || a.reviewedBy.includes(HOSPITAL.doctorName))) return doctor();
  return a.reviewedBy ? { "@type": "Person", name: a.reviewedBy } : null;
}
/** 글 위에 보이는 감수 표시. 예: 최지영 대표원장 감수 */
export const reviewLabel = (a: Article) => (a.reviewedAt ? `${a.reviewedBy || [HOSPITAL.doctorName, HOSPITAL.doctorTitle].filter(Boolean).join(" ") || "의료진"} 감수` : "");

export function listSchema(articles: Article[], category: string, page: number, total: number) {
  const url = absolute(listPath(category, page));
  return {
    "@context": "https://schema.org", "@type": "CollectionPage", "@id": url, url, name: listTitle(category, page), description: listDescription(category, page, total), inLanguage: "ko", isPartOf: website(),
    mainEntity: { "@type": "ItemList", itemListElement: articles.map((a, i) => ({ "@type": "ListItem", position: (page - 1) * PER_PAGE + i + 1, name: a.title, url: absolute(articlePath(a.slug)) })) },
  };
}
export function articleSchema(a: Article) {
  const url = absolute(articlePath(a.slug)), text = description(a), faq = faqs(a), published = kst(a.publishedAt), modified = kst(a.updatedAt), checked = reviewer(a);
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": MEDICAL ? "MedicalWebPage" : "WebPage", "@id": url, url, name: a.title, headline: a.title, description: text, image: [a.coverImage], inLanguage: "ko", datePublished: published, dateModified: modified, ...(checked ? { lastReviewed: kst(a.reviewedAt), reviewedBy: checked } : {}), isPartOf: website(), author: organization(), publisher: organization(), mainEntity: { "@id": `${url}#article` } },
      { "@type": "BlogPosting", "@id": `${url}#article`, headline: a.title, description: text, image: a.coverImage, datePublished: published, dateModified: modified, author: doctorShown ? doctor() : organization(), publisher: organization(), mainEntityOfPage: { "@id": url }, inLanguage: "ko", ...(a.tags?.length ? { keywords: a.tags.join(", ") } : {}) },
      ...(faq.length ? [{ "@type": "FAQPage", "@id": `${url}#faq`, mainEntity: faq.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) }] : []),
    ],
  };
}
