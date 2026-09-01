import Image from "next/image";
import Link from "next/link";

import { HOSPITAL } from "@/bioadd-blog/hospital.config";
import { extractToc, renderArticleHtml } from "@/bioadd-blog/article-html";
import {
  articleAuthorName,
  formatDate,
  hospitalSeoTitle,
  resolveFaqs,
  type Article,
} from "@/bioadd-blog/kit";

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function Breadcrumb({ trail }: { trail: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="브레드크럼" className="text-[13px] text-slate-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        {trail.map((item, index) => (
          <li key={item.name} className="flex items-center gap-1.5">
            {index > 0 ? <span aria-hidden="true" className="text-slate-300">/</span> : null}
            {item.href ? (
              <Link href={item.href} className="hover:text-slate-900">{item.name}</Link>
            ) : (
              <span className="text-slate-700" aria-current="page">{item.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function prettyDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}.${month}.${day}`;
}

function Thumbnail({ article, priority, sizes }: { article: Article; priority: boolean; sizes: string }) {
  if (!article.coverImage) {
    return (
      <div
        className="flex h-full w-full flex-col justify-between p-6"
        style={{ background: `color-mix(in srgb, ${HOSPITAL.color} 12%, #f3eee7)` }}
      >
        <span className="text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: HOSPITAL.color }}>
          {article.category || "칼럼"}
        </span>
        <p className="line-clamp-3 text-xl font-semibold leading-[1.28] tracking-tight text-slate-800">{article.title}</p>
      </div>
    );
  }
  return (
    <Image
      src={article.coverImage}
      alt={article.coverImageAlt || article.title}
      fill
      sizes={sizes}
      priority={priority}
      fetchPriority={priority ? "high" : undefined}
      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
    />
  );
}

function categoryHref(category: string) {
  return category === "all" ? "/blog" : `/blog?category=${encodeURIComponent(category)}`;
}

export function BlogList({
  articles,
  categories,
  current,
}: {
  articles: Article[];
  categories: string[];
  current: string;
}) {
  const heading = hospitalSeoTitle();
  const lead = HOSPITAL.description;

  return (
    <div className="bg-[#faf9f7]">
      <div className="mx-auto max-w-[1080px] px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
        <Breadcrumb trail={[{ name: "홈", href: "/" }, { name: heading }]} />
        <header className="mt-6 mb-10 sm:mb-14">
          <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-slate-900 sm:text-[2rem]">{heading}</h1>
          {lead ? <p className="mt-4 max-w-2xl text-[15px] leading-[1.85] text-slate-500">{lead}</p> : null}
          {categories.length > 1 ? (
            <nav aria-label="카테고리" className="mt-8 flex flex-wrap gap-1.5">
              {categories.map((item) => (
                <Link
                  key={item}
                  href={categoryHref(item)}
                  aria-current={current === item ? "page" : undefined}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] ${
                    current === item ? "bg-slate-900 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200/80"
                  }`}
                >
                  {item === "all" ? "전체" : item}
                </Link>
              ))}
            </nav>
          ) : null}
          <p className="mt-6 text-[13px] text-slate-400">전체 {articles.length}개의 글</p>
        </header>

        {articles.length === 0 ? (
          <p className="py-28 text-center text-sm text-slate-400">아직 발행된 글이 없습니다. 새 글이 올라오면 여기에서 확인할 수 있습니다.</p>
        ) : (
          <ul className="grid gap-x-10 gap-y-14 sm:grid-cols-2">
            {articles.map((article, index) => (
              <li key={article.id} className="group flex flex-col">
                <Link
                  href={`/blog/${article.slug}`}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="relative aspect-[16/10] overflow-hidden rounded-[1.2rem] bg-[#efeae3]"
                >
                  <Thumbnail article={article} priority={index === 0} sizes="(max-width: 640px) 100vw, 500px" />
                </Link>
                <h2 className="mt-6 text-[1.15rem] font-semibold leading-snug tracking-[-0.03em] text-slate-900 sm:text-[1.25rem]">
                  <Link href={`/blog/${article.slug}`} className="group-hover:text-slate-600">{article.title}</Link>
                </h2>
                {article.excerpt ? (
                  <p className="mt-2.5 line-clamp-2 text-[14px] leading-7 text-slate-500">{article.excerpt}</p>
                ) : null}
                <p className="mt-4 flex flex-wrap items-center gap-x-2 text-[12px] tracking-wide text-slate-400">
                  {article.category ? (
                    <>
                      <span>{article.category}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                    </>
                  ) : null}
                  <time dateTime={article.createdAt.slice(0, 10)}>{prettyDate(article.createdAt)}</time>
                </p>
              </li>
            ))}
          </ul>
        )}

        <aside className="mt-20 rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200/80">
          <p className="text-lg font-semibold text-slate-900">우리 병원에 맞는 광고 자리부터 확인하세요</p>
          <p className="mt-2 text-sm text-slate-500">위치와 진료과를 알려주시면 집행 가능한 매체와 예상 비용을 정리해 드립니다.</p>
          <Link href="/#diagnosis" className="mt-5 inline-flex rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
            무료진단 신청하기
          </Link>
        </aside>
      </div>
    </div>
  );
}

export function BlogArticle({ article, related }: { article: Article; related: Article[] }) {
  const html = renderArticleHtml(article.content);
  const toc = extractToc(html);
  const faqs = resolveFaqs(article);
  const author = articleAuthorName();

  return (
    <article>
      <header className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <Breadcrumb
            trail={[
              { name: "홈", href: "/" },
              { name: hospitalSeoTitle(), href: "/blog" },
              { name: article.title },
            ]}
          />
          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            {article.category ? <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">{article.category}</span> : null}
            <time dateTime={article.createdAt.slice(0, 10)}>{formatDate(article.createdAt)}</time>
            <span>{author}</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{article.title}</h1>
          {article.excerpt ? <p className="mt-4 text-base leading-8 text-slate-600">{article.excerpt}</p> : null}
        </div>
      </header>

      {article.coverImage ? (
        <figure className="mx-auto mt-8 max-w-3xl px-4 sm:px-6">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-100">
            <Image
              src={article.coverImage}
              alt={article.coverImageAlt || article.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              priority
              fetchPriority="high"
              className="object-cover"
            />
          </div>
        </figure>
      ) : null}

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
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
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <aside className="mt-12 rounded-2xl bg-slate-900 p-8 text-center text-white">
          <h2 className="text-lg font-semibold">광고 자리부터 비용까지 한 번에 정리해 드립니다</h2>
          <p className="mt-2 text-sm text-white/70">병원 위치와 진료과에 맞는 매체와 예상 비용을 무료로 진단해 드립니다.</p>
          <Link href="/#diagnosis" className="mt-5 inline-flex rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900">
            무료진단 신청하기
          </Link>
        </aside>

        {related.length > 0 ? (
          <nav aria-label="관련 글" className="mt-12 border-t border-slate-200 pt-8">
            <h2 className="text-lg font-semibold text-slate-900">함께 보면 좋은 정보</h2>
            <ul className="mt-4 space-y-3">
              {related.map((item) => (
                <li key={item.id}>
                  <Link href={`/blog/${item.slug}`} className="text-slate-700 hover:underline">{item.title}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <p className="mt-10">
          <Link href="/blog" className="text-sm font-medium text-slate-500 hover:text-slate-900">← 목록으로 돌아가기</Link>
        </p>
      </div>
    </article>
  );
}
