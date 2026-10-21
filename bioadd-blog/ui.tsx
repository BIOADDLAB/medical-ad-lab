import Link from "next/link";
import Image from "next/image";
import { ArticleBody, allowedImage, prepareHtml } from "./body";
import { HOSPITAL } from "./hospital.config";
import { BLOG, CTA, MENU, PER_PAGE, articlePath, categoryKey, crumbs, ctaLinks, dateLabel, doctorShown, faqs, kst, listLead, listPath, reviewLabel, toc, type Article, type Crumb } from "./kit";

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
function DateLabel({ a }: { a: Article }) {
  return a.publishedAt ? <time dateTime={kst(a.publishedAt)}>{dateLabel(a.publishedAt)}</time> : null;
}
/** 등록한 이미지 호스트면 Next/Image, 아니면 일반 img로 보여 줍니다. first는 가장 먼저(LCP), eager는 첫 화면이라 바로 불러옵니다. */
function Picture({ src, alt, first, eager, sizes, className }: { src: string; alt: string; first?: boolean; eager?: boolean; sizes: string; className?: string }) {
  const load = { loading: first || eager ? "eager" : "lazy", fetchPriority: first ? "high" : undefined, decoding: "async" } as const;
  if (allowedImage(src)) return <Image className={className} src={src} alt={alt} width={1200} height={675} sizes={sizes} {...load} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={src} alt={alt} width={1200} height={675} {...load} />;
}
function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="브레드크럼">
      <ol className="blog-breadcrumb">
        {items.map((c, i) => <li key={c.path}>{i < items.length - 1 ? <Link href={c.path}>{c.name}</Link> : <span aria-current="page">{c.name}</span>}</li>)}
      </ol>
    </nav>
  );
}
function Cta({ article }: { article?: Article }) {
  const links = ctaLinks(article);
  if (!links.length) return null;
  return (
    <section className="blog-cta">
      <h2>{CTA.title}</h2>
      {CTA.text && <p className="blog-cta-text">{CTA.text}</p>}
      <div className="blog-cta-links">{links.map((l) => <Link key={l.href} href={l.href} data-track-cta="consultation">{l.label}</Link>)}</div>
    </section>
  );
}
function Category({ name }: { name: string }) {
  return categoryKey(name) ? <Link className="blog-category" href={listPath(name)}>{name}</Link> : <span className="blog-category">{name}</span>;
}

export function BlogList({ articles, categories, category, page, total }: { articles: Article[]; categories: string[]; category: string; page: number; total: number }) {
  const pages = Math.ceil(total / PER_PAGE);
  return (
    <div className="blog-list">
      <Breadcrumb items={crumbs(category)} />
      <header className="blog-heading">
        <h1>{category || MENU}</h1>
        <p>{listLead(category, total)}</p>
      </header>
      {categories.length > 0 && (
        <nav className="blog-filters" aria-label="카테고리">
          {["", ...categories].map((c) => <Link key={c || "all"} href={listPath(c)} aria-current={category === c ? "page" : undefined}>{c || "전체"}</Link>)}
        </nav>
      )}
      <p className="blog-count">전체 {total}개의 글</p>
      {/* 카드 링크는 제목 하나(앵커 텍스트 = 글 제목)이고, 그 링크가 카드 전체를 덮어 썸네일·요약 어디를 눌러도 글로 갑니다(styles.css .blog-card). */}
      <div className="blog-grid">
        {articles.map((a, i) => (
          <article key={a.id} className="blog-card">
            <div className="blog-thumb"><Picture src={a.coverImage} alt={a.coverImageAlt} first={i === 0} eager={i < 3} sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 960px) 50vw, 33vw" /></div>
            <h2><Link href={articlePath(a.slug)}>{a.title}</Link></h2>
            <p className="blog-excerpt">{a.excerpt}</p>
            <div className="blog-meta"><Category name={a.category} /><DateLabel a={a} /></div>
          </article>
        ))}
      </div>
      {!articles.length && <p className="blog-empty">아직 발행된 글이 없습니다.</p>}
      {pages > 1 && (
        <nav className="blog-pagination" aria-label="페이지">
          {Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 2).map((n) => <Link key={n} href={listPath(category, n)} aria-current={n === page ? "page" : undefined}>{n}</Link>)}
        </nav>
      )}
      <Cta />
    </div>
  );
}

export async function BlogArticle({ article: a, related, previous, next }: { article: Article; related: Article[]; previous?: Article; next?: Article }) {
  const html = prepareHtml(a.content), items = toc(html), faq = faqs(a);
  return (
    <article className="blog-article">
      <Breadcrumb items={crumbs(a.category, a)} />
      <header className="blog-heading">
        <div className="blog-meta"><Category name={a.category} /><DateLabel a={a} />{doctorShown && !a.reviewedAt && <span>{HOSPITAL.doctorName}{HOSPITAL.doctorTitle ? ` ${HOSPITAL.doctorTitle}` : ""}</span>}{a.reviewedAt && <span className="blog-reviewed">{reviewLabel(a)} <time dateTime={kst(a.reviewedAt)}>{dateLabel(a.reviewedAt)}</time></span>}</div>
        <h1>{a.title}</h1>
        <p className="blog-lead">{a.excerpt}</p>
        <small className="blog-updated">최종 수정 <time dateTime={kst(a.updatedAt)}>{dateLabel(a.updatedAt)}</time></small>
      </header>
      <figure className="blog-cover-figure">
        <Picture className="blog-cover" src={a.coverImage} alt={a.coverImageAlt} first sizes="(max-width: 840px) calc(100vw - 40px), 792px" />
        {a.coverImageCaption && <figcaption>{a.coverImageCaption}</figcaption>}
      </figure>
      {items.length > 1 && (
        <nav className="blog-toc" aria-label="목차">
          <strong>이 글의 내용</strong>
          <ol>{items.map((item) => <li key={item.id} className={item.level === "h3" ? "sub" : ""}><a href={`#${item.id}`}>{item.title}</a></li>)}</ol>
        </nav>
      )}
      <ArticleBody html={html} />
      {faq.length > 0 && (
        <section className="blog-section">
          <h2>자주 묻는 질문</h2>
          {faq.map((f) => <div key={f.question}><h3>Q. {f.question}</h3><p className="blog-faq-answer">A. {f.answer}</p></div>)}
        </section>
      )}
      {a.tags?.length > 0 && (
        <div className="blog-tags">
          <strong id="blog-tags-title">관련 키워드</strong>
          <ul aria-labelledby="blog-tags-title">{a.tags.map((tag) => <li key={tag}>#{tag}</li>)}</ul>
        </div>
      )}
      {doctorShown && (
        <section className="blog-doctor">
          <h2>의료진 소개</h2>
          <p className="blog-doctor-name"><strong>{HOSPITAL.doctorName}</strong>{HOSPITAL.doctorTitle && <span>{HOSPITAL.doctorTitle}</span>}</p>
          {HOSPITAL.doctorBio && <p className="blog-doctor-bio">{HOSPITAL.doctorBio}</p>}
        </section>
      )}
      <Cta article={a} />
      {related.length > 0 && (
        <section className="blog-section">
          <h2>함께 보면 좋은 정보</h2>
          <div className="blog-grid">
            {related.map((r) => (
              <article key={r.id} className="blog-card">
                <div className="blog-thumb"><Picture src={r.coverImage} alt={r.coverImageAlt} sizes="(max-width: 640px) 100vw, 33vw" /></div>
                <h3><Link href={articlePath(r.slug)}>{r.title}</Link></h3>
              </article>
            ))}
          </div>
        </section>
      )}
      <nav className="blog-adjacent" aria-label="이전글과 다음글">
        {previous && <Link href={articlePath(previous.slug)} rel="prev"><small>이전글</small>{previous.title}</Link>}
        {next && <Link href={articlePath(next.slug)} rel="next"><small>다음글</small>{next.title}</Link>}
      </nav>
      <Link className="blog-back" href={BLOG}>목록으로 돌아가기</Link>
    </article>
  );
}
