import Link from 'next/link';
import { DiagnosisButton } from '@/components/lead/diagnosis-button';

type Article = {
    slug: string;
    category: string;
    title: string;
    excerpt: string;
    date: string;
    readTime: string;
    body: {
        lead: string;
        sections: readonly { heading: string; text: string }[];
        checklist: readonly string[];
    };
};

export function ArticleDetail({ article, section = '연구소 저널' }: { article: Article; section?: string }) {
    const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.excerpt,
        datePublished: article.date.replaceAll('.', '-').replace(/-$/, ''),
        author: { '@type': 'Organization', name: '병원광고연구소' },
        publisher: { '@type': 'Organization', name: '병원광고연구소' },
    };

    return (
        <main className="pt-[60px] lg:pt-0">
            <article>
                <header className="border-b border-line bg-soft pb-12 pt-10 lg:pb-[90px] lg:pt-[174px]">
                    <div className="site-container max-w-[860px]">
                        <p className="flex gap-2 text-xs text-muted">
                            <Link href="/">홈</Link>
                            <span>/</span>
                            <Link href="/about">{section}</Link>
                        </p>
                        <span className="mb-4 mt-8 inline-flex rounded-md bg-brand-tint px-2.5 py-1.5 text-[10px] font-extrabold text-brand lg:mt-11">
                            {article.category}
                        </span>
                        <h1 className="m-0 text-h1">{article.title}</h1>
                        <p className="my-5 text-sm text-muted lg:text-lead">{article.excerpt}</p>
                        <small className="text-xs text-muted">
                            {article.date} · 읽는 시간 {article.readTime}
                        </small>
                    </div>
                </header>

                <div className="site-container max-w-[860px] pb-section pt-10 lg:pt-[90px]">
                    <p className="mb-8 text-body font-bold leading-[2] text-ink lg:text-[21px]">{article.body.lead}</p>
                    {article.body.sections.map((section) => (
                        <section key={section.heading}>
                            <h2 className="mb-5 mt-14 text-h4 lg:mt-[72px]">{section.heading}</h2>
                            <p className="mb-8 text-sm leading-[2] text-slate">{section.text}</p>
                        </section>
                    ))}
                    <aside className="my-12 border-l-[3px] border-brand bg-soft p-6 lg:p-8">
                        <strong className="text-body">실무 체크포인트</strong>
                        <ul className="mt-4 list-disc pl-5 text-sm leading-[1.9] text-muted">
                            {article.body.checklist.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </aside>

                    <div className="mt-16 grid gap-6 rounded-panel bg-ink p-7 text-white lg:mt-20 lg:grid-cols-[1fr_auto] lg:items-center lg:p-9">
                        <div>
                            <span className="text-[9px] font-extrabold tracking-[.15em] text-brand-light">
                                FREE DIAGNOSIS
                            </span>
                            <h3 className="mb-1.5 mt-2.5 text-h5">우리 병원 기준으로 비교해 보세요.</h3>
                            <p className="m-0 text-xs text-white/55">
                                견적이 없어도 위치와 진료과부터 확인할 수 있습니다.
                            </p>
                        </div>
                        <DiagnosisButton className="btn-primary w-full lg:w-auto">무료진단 신청하기</DiagnosisButton>
                    </div>
                </div>
            </article>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
        </main>
    );
}
