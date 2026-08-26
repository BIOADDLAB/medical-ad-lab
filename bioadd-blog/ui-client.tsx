"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { HOSPITAL } from "@/bioadd-blog/hospital.config";
import {
  articleAuthorName,
  classifyReferrer,
  cn,
  extractToc,
  formatDate,
  getPublishedArticleBySlug,
  getPublishedArticles,
  getRelatedArticles,
  prepareArticleHtml,
  resolveFaqs,
  slugFromPath,
  type Article,
} from "@/bioadd-blog/kit";

export function HideSiteChrome() {
  useEffect(() => {
    const root = document.querySelector("[data-bioadd-blog]");
    if (!(root instanceof HTMLElement)) return;
    const hidden: HTMLElement[] = [];
    const touched: Array<{ el: HTMLElement; bg: string; scheme: string }> = [];
    const surfaces: HTMLElement[] = [document.documentElement, document.body];
    for (const el of surfaces) {
      touched.push({
        el,
        bg: el.style.backgroundColor,
        scheme: el.style.colorScheme,
      });
      el.classList.remove("dark");
      el.style.setProperty("background-color", "#faf9f7", "important");
      el.style.setProperty("color-scheme", "light", "important");
    }
    let node: HTMLElement | null = root;
    while (node && node !== document.body) {
      const parent: HTMLElement | null = node.parentElement;
      if (!parent) break;
      for (const sibling of Array.from(parent.children)) {
        if (sibling === node || !(sibling instanceof HTMLElement)) continue;
        if (["SCRIPT", "STYLE", "LINK", "NOSCRIPT", "TEMPLATE"].includes(sibling.tagName)) continue;
        sibling.setAttribute("data-bioadd-hidden-chrome", "");
        sibling.style.setProperty("display", "none", "important");
        hidden.push(sibling);
      }
      node = parent;
    }
    return () => {
      for (const el of hidden) {
        el.removeAttribute("data-bioadd-hidden-chrome");
        el.style.removeProperty("display");
      }
      for (const item of touched) {
        item.el.style.backgroundColor = item.bg;
        item.el.style.colorScheme = item.scheme;
      }
    };
  }, []);
  return null;
}

export function CoverImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={cn("h-full w-full object-cover", className)} />
  );
}

function sessionId() {
  const key = "bioadd-blog-sid";
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const next = crypto.randomUUID?.() ?? `s${Date.now()}`;
    window.localStorage.setItem(key, next);
    return next;
  } catch {
    return "anon";
  }
}

function send(body: Record<string, unknown>) {
  const cms = (process.env.NEXT_PUBLIC_CMS_URL ?? "").replace(/\/$/, "");
  if (!cms) return;
  const payload = JSON.stringify(body);
  const url = `${cms}/api/public/analytics`;
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([payload], { type: "text/plain" }));
    return;
  }
  void fetch(url, { method: "POST", body: payload, keepalive: true, mode: "cors" });
}

export function BlogTracker({ hospitalId }: { hospitalId: string }) {
  const pathname = usePathname() ?? "";
  useEffect(() => {
    if (!hospitalId || !pathname.startsWith("/blog")) return;
    try {
    const { source, organic } = classifyReferrer(document.referrer, window.location.host);
    send({
      hospitalId,
      type: "pageview",
      path: pathname,
      slug: slugFromPath(pathname),
      referrer: document.referrer,
      source,
      organic,
      sessionId: sessionId(),
    });
    function onClick(event: MouseEvent) {
      const target = (event.target as HTMLElement | null)?.closest("a");
      if (!target?.getAttribute("href")) return;
      send({
        hospitalId,
        type: "click",
        path: pathname,
        slug: slugFromPath(pathname),
        referrer: target.getAttribute("href"),
        source: "click",
        organic: false,
        sessionId: sessionId(),
      });
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
    } catch {
      return undefined;
    }
  }, [hospitalId, pathname]);
  return null;
}

function prettyDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}.${month}.${day}`;
}

function CoverOrPoster({ article, featured, className }: { article: Article; featured?: boolean; className?: string }) {
  if (article.coverImage) {
    return <CoverImage src={article.coverImage} alt={article.coverImageAlt || article.title} className={className} />;
  }
  return (
    <div
      className={`flex h-full w-full flex-col justify-between ${featured ? "p-8 sm:p-10" : "p-6"}`}
      style={{ background: `color-mix(in srgb, ${HOSPITAL.color} 12%, #f3eee7)` }}
    >
      <span className="text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: HOSPITAL.color }}>
        {article.category || "칼럼"}
      </span>
      <p className={`font-semibold leading-[1.28] tracking-tight text-slate-800 ${featured ? "line-clamp-4 text-[1.7rem] sm:text-[2rem]" : "line-clamp-3 text-xl"}`}>
        {article.title}
      </p>
    </div>
  );
}

function Meta({ article }: { article: Article }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-[12px] tracking-wide text-slate-400">
      <time dateTime={article.createdAt}>{prettyDate(article.createdAt)}</time>
      {article.category ? <><span className="text-slate-300">·</span><span>{article.category}</span></> : null}
    </p>
  );
}

export function BlogList({ articles }: { articles: Article[] }) {
  const [category, setCategory] = useState("all");
  const categories = useMemo(
    () => ["all", ...Array.from(new Set(articles.map((article) => article.category).filter(Boolean)))],
    [articles],
  );
  const visible = articles.filter((article) => category === "all" || article.category === category);
  const featured = visible[0];
  const rest = visible.slice(1);

  return (
    <div className="bg-[#faf9f7]">
      <div className="mx-auto max-w-[1080px] px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
        <header className="mb-12 flex flex-col gap-6 sm:mb-16 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-medium tracking-[0.32em] text-slate-400">BLOG</p>
            <p className="mt-2 text-[1.75rem] font-semibold tracking-[-0.03em] text-slate-900 sm:text-[2rem]">{HOSPITAL.name}</p>
          </div>
          {categories.length > 1 ? (
            <div className="flex flex-wrap gap-1.5">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] ${
                    category === item ? "bg-slate-900 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200/80"
                  }`}
                >
                  {item === "all" ? "전체" : item}
                </button>
              ))}
            </div>
          ) : null}
        </header>
        {!featured ? (
          <p className="py-28 text-center text-sm text-slate-400">발행된 글이 아직 없습니다.</p>
        ) : (
          <div className="space-y-20">
            <Link href={`/blog/${featured.slug}`} className="group grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <div className="relative aspect-[5/4] overflow-hidden rounded-[1.35rem] bg-[#efeae3] sm:aspect-[4/3]">
                <CoverOrPoster article={featured} featured className="transition-transform duration-700 group-hover:scale-[1.04]" />
              </div>
              <div className="flex max-w-xl flex-col lg:py-4">
                {featured.category ? (
                  <p className="text-[12px] font-medium tracking-[0.16em]" style={{ color: HOSPITAL.color }}>{featured.category}</p>
                ) : null}
                <h1 className="mt-3 text-[1.55rem] font-semibold leading-[1.28] tracking-[-0.035em] text-slate-900 sm:text-[2.15rem] sm:leading-[1.22]">
                  {featured.title}
                </h1>
                {featured.excerpt ? (
                  <p className="mt-5 line-clamp-3 text-[15px] leading-[1.85] text-slate-500">{featured.excerpt}</p>
                ) : null}
                <div className="mt-8"><Meta article={featured} /></div>
              </div>
            </Link>
            {rest.length > 0 ? (
              <div className="grid gap-x-10 gap-y-14 sm:grid-cols-2">
                {rest.map((article) => (
                  <Link key={article.id} href={`/blog/${article.slug}`} className="group flex flex-col">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-[1.2rem] bg-[#efeae3]">
                      <CoverOrPoster article={article} className="transition-transform duration-700 group-hover:scale-[1.04]" />
                    </div>
                    <h2 className="mt-6 text-[1.15rem] font-semibold leading-snug tracking-[-0.03em] text-slate-900 group-hover:text-slate-600 sm:text-[1.25rem]">
                      {article.title}
                    </h2>
                    {article.excerpt ? (
                      <p className="mt-2.5 line-clamp-2 text-[14px] leading-7 text-slate-500">{article.excerpt}</p>
                    ) : null}
                    <div className="mt-4"><Meta article={article} /></div>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export function ClientBlogList({ initial }: { initial: Article[] }) {
  const [articles, setArticles] = useState(initial);
  useEffect(() => {
    if (initial.length > 0) return;
    void getPublishedArticles().then(setArticles);
  }, [initial]);
  return <BlogList articles={articles} />;
}

export function BlogArticle({ article, related }: { article: Article; related: Article[] }) {
  const html = prepareArticleHtml(article.content);
  const toc = extractToc(html);
  const faqs = resolveFaqs(article);
  const author = articleAuthorName();

  return (
    <article>
      <header className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <nav aria-label="브레드크럼" className="text-sm text-slate-500">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li><Link href="/" className="hover:text-slate-900">홈</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/blog" className="hover:text-slate-900">블로그</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-slate-700" aria-current="page">{article.category}</li>
            </ol>
          </nav>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">{article.category}</span>
            <time dateTime={article.createdAt}>{formatDate(article.createdAt)}</time>
            <span>{author}</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{article.title}</h1>
        </div>
      </header>
      {article.coverImage ? (
        <figure className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="relative aspect-[16/8] w-full overflow-hidden rounded-2xl sm:mt-8">
            <CoverImage src={article.coverImage} alt={article.coverImageAlt || article.title} />
          </div>
        </figure>
      ) : null}
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {article.excerpt ? (
          <aside className="key-takeaway" aria-label="핵심 요약">
            <p className="text-xs font-semibold tracking-wide text-indigo-700">핵심 요약</p>
            <p className="mt-2 text-base leading-7 text-slate-700">{article.excerpt}</p>
          </aside>
        ) : null}
        {toc.length > 1 ? (
          <nav aria-label="목차" className="article-toc">
            <p className="text-sm font-semibold text-slate-900">목차</p>
            <ol className="mt-3 space-y-2">
              {toc.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="text-sm text-slate-600 hover:text-slate-900">{item.text}</a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <div className="prose-cms" dangerouslySetInnerHTML={{ __html: html }} />
        {faqs.length > 0 ? (
          <section className="faq-section mt-12 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-semibold text-slate-900">자주 묻는 질문</h2>
            <div className="mt-4 space-y-4">
              {faqs.map((item) => (
                <div key={item.question} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-base font-semibold text-slate-900">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        {related.length > 0 ? (
          <nav aria-label="관련 글" className="mt-12 border-t border-slate-200 pt-8">
            <h2 className="text-lg font-semibold text-slate-900">함께 보면 좋은 글</h2>
            <ul className="mt-4 space-y-3">
              {related.map((item) => (
                <li key={item.id}>
                  <Link href={`/blog/${item.slug}`} className="text-slate-700 hover:underline">{item.title}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </article>
  );
}

export function ClientArticle({ slug }: { slug: string }) {
  const [article, setArticle] = useState<Article | null | undefined>(undefined);
  const [related, setRelated] = useState<Article[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const found = await getPublishedArticleBySlug(slug);
      if (cancelled) return;
      setArticle(found);
      if (found) {
        const others = await getRelatedArticles(found);
        if (!cancelled) setRelated(others);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (article === undefined) {
    return <p className="py-24 text-center text-slate-500">글을 불러오는 중…</p>;
  }

  if (!article) {
    return (
      <div className="min-h-[70vh] bg-white px-4 py-24 text-center">
        <p className="text-lg font-medium text-slate-900">글을 찾을 수 없습니다.</p>
        <p className="mt-2 text-sm text-slate-500">발행되지 않았거나, 아직 반영 중일 수 있습니다.</p>
        <Link href="/blog" className="mt-6 inline-flex text-sm font-medium underline">
          블로그로 돌아가기
        </Link>
      </div>
    );
  }

  return <BlogArticle article={article} related={related} />;
}
