import type { Metadata } from "next";

import { HOSPITAL } from "@/bioadd-blog/hospital.config";

const PROFILE = HOSPITAL.schemaProfile as "clinic" | "dentist" | "business";
const SCHEMA =
  PROFILE === "business"
    ? { org: ["Organization", "LocalBusiness"], publisher: "Organization", page: ["WebPage", "BlogPosting"], job: "대표", medical: false }
    : PROFILE === "dentist"
      ? { org: ["Organization", "MedicalOrganization", "MedicalBusiness", "Dentist"], publisher: "Dentist", page: ["MedicalWebPage", "BlogPosting"], job: "치과의사", medical: true }
      : { org: ["Organization", "MedicalOrganization", "MedicalBusiness", "MedicalClinic"], publisher: "MedicalClinic", page: ["MedicalWebPage", "BlogPosting"], job: "전문의", medical: true };

export type ArticleStatus = "draft" | "published";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Article {
  id: string;
  hospitalId: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  coverImageAlt: string;
  category: string;
  tags: string[];
  faq?: FaqItem[];
  status: ArticleStatus;
  createdAt: string;
  updatedAt: string;
}

export const CMS_URL = HOSPITAL.cmsUrl.replace(/\/$/, "");

function trimOrigin(value: string) {
  const raw = String(value ?? "").trim().replace(/\/+$/, "");
  if (!raw || /localhost|127\.0\.0\.1/i.test(raw)) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw.replace(/^\/+/, "")}`;
}

export function publicOrigin() {
  return (
    trimOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? "") ||
    trimOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "") ||
    trimOrigin(HOSPITAL.siteUrl ?? "")
  );
}

export function requirePublicOrigin() {
  const origin = publicOrigin();
  if (!origin) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL에 공개 도메인(https://example.com)을 넣으세요. 블로그 코드는 도메인을 하드코딩하지 않습니다.",
    );
  }
  return origin;
}

export const SITE_URL = publicOrigin();

export function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(" ");
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

export function slugify(value: string) {
  return normalizeSlug(value).replace(/['"]/g, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export function normalizeSlug(value: string) {
  try {
    value = decodeURIComponent(value || "");
  } catch {
    value = value || "";
  }
  return value.trim().replace(/^\/+/, "").replace(/^blog\//i, "").replace(/^\/+|\/+$/g, "").toLowerCase();
}

export function absoluteUrl(path: string) {
  const origin = publicOrigin();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return origin ? `${origin}${normalized}` : normalized;
}

export function blogPostUrl(slug: string) {
  return absoluteUrl(`/blog/${slug}`);
}

export async function getPublishedArticles(): Promise<Article[]> {
  const fromCms = await fetchPublishedFromCms();
  if (fromCms) return fromCms;
  return fetchPublishedFromFirestore();
}

export async function getPublishedArticleBySlug(slug: string): Promise<Article | null> {
  const needle = normalizeSlug(slug);
  const articles = await getPublishedArticles();
  return articles.find((article) => normalizeSlug(article.slug) === needle) ?? null;
}

export async function getRelatedArticles(article: Article, limit = 3) {
  const articles = await getPublishedArticles();
  return articles.filter((item) => item.id !== article.id).slice(0, limit);
}

async function fetchPublishedFromCms(): Promise<Article[] | null> {
  if (!CMS_URL || /localhost|127\.0\.0\.1/i.test(CMS_URL)) return null;
  try {
    const response = await fetch(
      `${CMS_URL}/api/public/articles?hospitalId=${encodeURIComponent(HOSPITAL.id)}`,
      { next: { revalidate: 60 } },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as Article[];
    return Array.isArray(data) ? data.filter((item) => item.status === "published") : [];
  } catch {
    return null;
  }
}

async function fetchPublishedFromFirestore(): Promise<Article[]> {
  const projectId = HOSPITAL.firebaseProjectId;
  const apiKey = HOSPITAL.firebaseApiKey;
  if (!projectId || !apiKey) return [];
  try {
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: "articles" }],
            where: {
              compositeFilter: {
                op: "AND",
                filters: [
                  {
                    fieldFilter: {
                      field: { fieldPath: "hospitalId" },
                      op: "EQUAL",
                      value: { stringValue: HOSPITAL.id },
                    },
                  },
                  {
                    fieldFilter: {
                      field: { fieldPath: "status" },
                      op: "EQUAL",
                      value: { stringValue: "published" },
                    },
                  },
                ],
              },
            },
          },
        }),
        next: { revalidate: 60 },
      },
    );
    if (!response.ok) return [];
    const rows = (await response.json()) as { document?: { name?: string; fields?: Record<string, RestField> } }[];
    return rows
      .map((row) => (row.document ? restDocumentToArticle(row.document) : null))
      .filter((item): item is Article => Boolean(item))
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  } catch {
    return [];
  }
}

type RestField = {
  stringValue?: string;
  arrayValue?: { values?: RestField[] };
  mapValue?: { fields?: Record<string, RestField> };
};

function restString(field?: RestField) {
  return field?.stringValue ?? "";
}

function restStrings(field?: RestField) {
  return (field?.arrayValue?.values ?? []).map((item) => restString(item)).filter(Boolean);
}

function restDocumentToArticle(doc: { name?: string; fields?: Record<string, RestField> }): Article | null {
  const fields = doc.fields ?? {};
  const id = doc.name?.split("/").pop();
  if (!id) return null;
  return {
    id,
    hospitalId: restString(fields.hospitalId),
    title: restString(fields.title),
    slug: normalizeSlug(restString(fields.slug)),
    content: restString(fields.content),
    excerpt: restString(fields.excerpt),
    coverImage: restString(fields.coverImage),
    coverImageAlt: restString(fields.coverImageAlt),
    category: restString(fields.category),
    tags: restStrings(fields.tags),
    faq: (fields.faq?.arrayValue?.values ?? []).map((item) => ({
      question: restString(item.mapValue?.fields?.question),
      answer: restString(item.mapValue?.fields?.answer),
    })),
    status: restString(fields.status) === "published" ? "published" : "draft",
    createdAt: restString(fields.createdAt),
    updatedAt: restString(fields.updatedAt),
  };
}

export function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export function prepareArticleHtml(html: string) {
  const demoted = html.replaceAll("<h1", "<h2").replaceAll("</h1>", "</h2>");
  let index = 0;
  return demoted.replace(/<(h[23])(\s[^>]*)?>([\s\S]*?)<\/\1>/gi, (full, tag: string, attrs = "", inner: string) => {
    if (/\sid\s*=/i.test(attrs)) return full;
    index += 1;
    return `<${tag}${attrs} id="s-${index}">${inner}</${tag}>`;
  });
}

export function extractToc(html: string) {
  const items: { id: string; text: string }[] = [];
  const pattern = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) {
    const text = stripHtml(match[2] ?? "");
    if (!text || text === "자주 묻는 질문") continue;
    const id = /id=["']([^"']+)["']/.exec(match[1] ?? "")?.[1];
    if (id) items.push({ id, text });
  }
  return items;
}

export function resolveFaqs(article: Article): FaqItem[] {
  return (article.faq ?? []).filter((item) => item.question.trim() && item.answer.trim());
}

export function isoDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

export function hospitalSeoTitle() {
  const name = HOSPITAL.name.trim();
  const raw = HOSPITAL.seoTitle?.trim() ?? "";
  if (!raw || raw.includes("건강 정보") || raw === name) return `${name} 블로그`;
  return raw.includes(name) ? raw : `${name} 블로그`;
}

export function articleDocumentTitle(article: Article) {
  const title = article.title.trim();
  const name = HOSPITAL.name.trim();
  if (!name || title.includes(name)) return title;
  return `${title} | ${name}`;
}

export function articleMetaDescription(article: Article) {
  return `${article.excerpt.trim() || article.title} | ${HOSPITAL.name}`;
}

export function articleAuthorName() {
  if (HOSPITAL.doctorName?.trim()) return `${HOSPITAL.doctorName} | ${HOSPITAL.name}`;
  return HOSPITAL.name;
}

export function articleKeywords(article: Article) {
  return [HOSPITAL.name, ...HOSPITAL.alternateNames, ...HOSPITAL.knowsAbout, article.category, ...article.tags].filter(Boolean);
}

export function hospitalBrandLabel() {
  const seo = HOSPITAL.seoTitle?.trim();
  return seo ? `${HOSPITAL.name} | ${seo}` : hospitalSeoTitle();
}

function organizationNode() {
  const founderName = HOSPITAL.founder?.trim() || HOSPITAL.doctorName?.trim();
  const image = HOSPITAL.imageUrl || HOSPITAL.logoUrl;
  return {
    "@type": SCHEMA.org,
    "@id": `${SITE_URL}#organization`,
    name: HOSPITAL.name,
    alternateName: HOSPITAL.alternateNames,
    description: HOSPITAL.description,
    url: SITE_URL,
    logo: HOSPITAL.logoUrl || undefined,
    image: image || undefined,
    telephone: HOSPITAL.telephone || undefined,
    knowsAbout: HOSPITAL.knowsAbout,
    sameAs: HOSPITAL.sameAs,
    founder: founderName ? { "@type": "Person", name: founderName, jobTitle: HOSPITAL.doctorTitle || undefined } : undefined,
    areaServed: HOSPITAL.areaServed,
    address: HOSPITAL.streetAddress
      ? {
          "@type": "PostalAddress",
          streetAddress: HOSPITAL.streetAddress,
          addressLocality: HOSPITAL.addressLocality,
          addressRegion: HOSPITAL.addressRegion,
          postalCode: HOSPITAL.postalCode,
          addressCountry: "KR",
        }
      : undefined,
  };
}

function blogNode(blogUrl: string) {
  return {
    "@type": "Blog",
    "@id": `${blogUrl}#blog`,
    url: blogUrl,
    name: hospitalSeoTitle(),
    description: HOSPITAL.description || `${HOSPITAL.name} 공식 블로그입니다.`,
    inLanguage: "ko-KR",
    publisher: { "@id": `${SITE_URL}#organization` },
    isPartOf: { "@id": `${SITE_URL}#website` },
    about: [HOSPITAL.name, ...HOSPITAL.about, ...HOSPITAL.knowsAbout, ...HOSPITAL.alternateNames].filter(Boolean),
  };
}

function personNode() {
  if (!HOSPITAL.doctorName?.trim()) return undefined;
  return {
    "@type": "Person",
    name: HOSPITAL.doctorName,
    jobTitle: HOSPITAL.doctorTitle || SCHEMA.job,
    affiliation: { "@type": SCHEMA.publisher, "@id": `${SITE_URL}#organization`, name: HOSPITAL.name },
  };
}

function publisherNode() {
  return {
    "@type": SCHEMA.publisher,
    "@id": `${SITE_URL}#organization`,
    name: HOSPITAL.name,
    url: SITE_URL,
    logo: HOSPITAL.logoUrl ? { "@type": "ImageObject", url: HOSPITAL.logoUrl } : undefined,
  };
}

export function blogIndexJsonLd(articles: Article[] = []) {
  const url = absoluteUrl("/blog");
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationNode(),
      { "@type": "WebSite", "@id": `${SITE_URL}#website`, url: SITE_URL, name: HOSPITAL.name, inLanguage: "ko-KR", publisher: { "@id": `${SITE_URL}#organization` } },
      blogNode(url),
      {
        "@type": "ItemList",
        itemListElement: articles.slice(0, 20).map((article, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: blogPostUrl(article.slug),
          name: article.title,
        })),
      },
    ],
  };
}

export function articleJsonLd(article: Article) {
  const url = blogPostUrl(article.slug);
  const blogUrl = absoluteUrl("/blog");
  const faqs = resolveFaqs(article);
  const person = personNode();
  const author = person ?? publisherNode();
  const graph: Record<string, unknown>[] = [
    organizationNode(),
    { "@type": "WebSite", "@id": `${SITE_URL}#website`, url: SITE_URL, name: HOSPITAL.name, inLanguage: "ko-KR", publisher: { "@id": `${SITE_URL}#organization` } },
    blogNode(blogUrl),
    {
      "@type": SCHEMA.page,
      "@id": `${url}#article`,
      headline: article.title,
      description: article.excerpt,
      inLanguage: "ko-KR",
      url,
      lastReviewed: SCHEMA.medical ? isoDate(article.updatedAt || article.createdAt) : undefined,
      datePublished: article.createdAt,
      dateModified: article.updatedAt,
      author,
      reviewedBy: SCHEMA.medical ? person : undefined,
      publisher: publisherNode(),
      articleSection: article.category,
      keywords: article.tags,
      isAccessibleForFree: true,
      isPartOf: { "@id": `${blogUrl}#blog` },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      image: article.coverImage
        ? { "@type": "ImageObject", url: article.coverImage, caption: article.coverImageAlt || article.title }
        : undefined,
      mainEntity: faqs.length > 0 ? { "@id": `${url}#faq` } : undefined,
    },
  ];
  if (faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: faqs.map((item, index) => ({
        "@type": "Question",
        "@id": `${url}#faq-${index}`,
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

export function breadcrumbJsonLd(article: Article) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "블로그", item: absoluteUrl("/blog") },
      { "@type": "ListItem", position: 3, name: article.title, item: blogPostUrl(article.slug) },
    ],
  };
}

export function blogIndexMetadata(): Metadata {
  const title = hospitalSeoTitle();
  const description = HOSPITAL.description || `${HOSPITAL.name} 공식 블로그입니다.`;
  const url = absoluteUrl("/blog");
  return {
    title: { absolute: title },
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: url, types: { "application/rss+xml": absoluteUrl("/blog/feed.xml") } },
    openGraph: { type: "website", locale: "ko_KR", siteName: HOSPITAL.name, title, description, url },
    twitter: { card: "summary_large_image", title, description },
  };
}

export function articlePageMetadata(article: Article): Metadata {
  const url = blogPostUrl(article.slug);
  const title = articleDocumentTitle(article);
  const description = articleMetaDescription(article);
  const author = articleAuthorName();
  return {
    title: { absolute: title },
    description,
    keywords: articleKeywords(article),
    authors: [{ name: author }],
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      locale: "ko_KR",
      siteName: HOSPITAL.name,
      title: article.title,
      description,
      url,
      publishedTime: article.createdAt,
      modifiedTime: article.updatedAt,
      authors: [author],
      tags: article.tags,
      images: article.coverImage
        ? [{ url: article.coverImage, alt: article.coverImageAlt || article.title, width: 1200, height: 630 }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: article.coverImage ? [article.coverImage] : undefined,
    },
    other: {
      author,
      topic: article.tags[0] || article.category,
      "ai-content-type": "expert-blog",
      "article:author": author,
      "article:section": article.category,
      "article:tag": article.tags.join(","),
    },
  };
}

const SEARCH_HOSTS = ["google.", "naver.com", "bing.com", "daum.net", "yahoo.", "duckduckgo.com"];

export function classifyReferrer(referrer: string, pageHost: string) {
  if (!referrer.trim()) return { source: "direct", organic: false };
  let host = "";
  try {
    host = new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return { source: "direct", organic: false };
  }
  const page = pageHost.replace(/^www\./, "");
  if (host === page || host.endsWith(`.${page}`)) return { source: host, organic: false };
  return { source: host || "direct", organic: SEARCH_HOSTS.some((item) => host.includes(item)) };
}

export function slugFromPath(path: string) {
  return path.match(/\/blog\/([^/?#]+)/)?.[1] ?? "";
}
