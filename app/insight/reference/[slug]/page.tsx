import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumb, breadcrumbJsonLd, type Crumb } from '@/components/layout/breadcrumb';
import { DiagnosisButton } from '@/components/lead/diagnosis-button';
import { GOAL_FALLBACK, getReference, getReferences, getRelatedReferences, PLAN_FALLBACK } from '@/lib/references';
import { SITE_URL } from '@/lib/site';

export async function generateStaticParams() {
    const references = await getReferences();
    return references.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const item = await getReference(slug);
    if (!item) return {};
    // 검색·AI 답변에 그대로 인용되므로 요약을 우선 쓴다
    const description = item.summary || `${item.area} ${item.type} 집행 레퍼런스입니다.`;
    return {
        title: `${item.title} · ${item.type}`,
        description,
        keywords: [item.area, item.type, '병원 옥외광고', `${item.area} ${item.type}`],
        alternates: { canonical: `/insight/reference/${item.slug}` },
        openGraph: {
            title: `${item.title} · ${item.type}`,
            description,
            url: `/insight/reference/${item.slug}`,
            type: 'article',
            siteName: '병원광고연구소',
            locale: 'ko_KR',
            images: [{ url: item.image, alt: `${item.title} ${item.type}`, width: 1200, height: 630 }],
        },
        twitter: { card: 'summary_large_image', title: item.title, description, images: [item.image] },
    };
}

export default async function ReferenceDetail({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const item = await getReference(slug);
    if (!item) notFound();

    const baseUrl = SITE_URL;
    const related = await getRelatedReferences(item);
    const trail: Crumb[] = [
        { name: '홈', href: '/' },
        { name: '병원집행 옥외레퍼런스', href: '/insight?tab=reference' },
        { name: item.title, href: `/insight/reference/${item.slug}` },
    ];
    // AI 답변 엔진이 매체·지역·집행 내용을 그대로 읽을 수 있게 남긴다
    const structuredData = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'CreativeWork',
                name: item.title,
                about: `${item.area} ${item.type}`,
                description: item.summary || `${item.area} ${item.type} 집행 레퍼런스입니다.`,
                contentLocation: { '@type': 'Place', name: item.area },
                image: item.image,
                inLanguage: 'ko-KR',
                url: `${baseUrl}/insight/reference/${item.slug}`,
                creator: { '@type': 'Organization', name: '병원광고연구소', url: baseUrl },
            },
            breadcrumbJsonLd(trail),
        ],
    };

    return (
        <main className="pt-[60px] lg:pt-0">
            <article>
                <section className="border-b border-line bg-soft pb-10 pt-10 lg:pb-[90px] lg:pt-[174px]">
                    <div className="site-container">
                        <Breadcrumb trail={trail} />
                        <h1 className="mb-2.5 mt-6 text-h1 lg:mt-8">{item.title}</h1>
                        <span className="text-sm font-bold text-brand">{item.area}</span>
                    </div>
                </section>

                <section className="py-section">
                    <div className="site-container grid gap-8 lg:grid-cols-[1.4fr_.6fr] lg:gap-14">
                        <div className="relative aspect-[16/10] overflow-hidden rounded-panel bg-brand-pale">
                            <Image
                                src={item.image}
                                alt={`${item.title} ${item.type}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 800px) 100vw, 62vw"
                                priority
                            />
                        </div>
                        <aside className="card-base p-6 lg:p-9">
                            <p className="m-0 text-xs font-extrabold tracking-[.14em] text-brand">REFERENCE INFO</p>
                            <h2 className="mb-6 mt-3 text-h4 lg:mb-7">집행 정보</h2>
                            <dl className="m-0 mb-7">
                                {[
                                    ['매체', item.type],
                                    ['지역', item.area],
                                    ['목표', item.goal || GOAL_FALLBACK],
                                    ['구성', item.plan || PLAN_FALLBACK],
                                ].map(([term, value]) => (
                                    <div
                                        className="flex justify-between gap-5 border-b border-line py-4 text-xs"
                                        key={term}
                                    >
                                        <dt className="text-muted">{term}</dt>
                                        <dd className="m-0 font-bold">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                            {item.summary && <p className="mb-6 text-sm text-muted">{item.summary}</p>}
                            <DiagnosisButton className="btn-primary w-full">비슷한 광고 문의하기</DiagnosisButton>
                            <Link
                                href="/insight?tab=spot"
                                className="mt-3 block text-center text-xs font-bold text-brand"
                            >
                                집행 가능한 광고 자리 보기
                            </Link>
                        </aside>
                    </div>

                    {related.length > 0 && (
                        <nav aria-label="관련 레퍼런스" className="site-container mt-12 lg:mt-16">
                            <h2 className="m-0 mb-5 text-h4">함께 보면 좋은 레퍼런스</h2>
                            <ul className="grid gap-4 sm:grid-cols-3">
                                {related.map((other) => (
                                    <li key={other.slug} className="card-base p-5">
                                        <span className="text-[10px] font-extrabold text-brand">{other.type}</span>
                                        <p className="mb-1 mt-2 text-sm font-bold">
                                            <Link href={`/insight/reference/${other.slug}`}>{other.title}</Link>
                                        </p>
                                        <p className="m-0 text-xs text-muted">{other.area}</p>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    )}

                    <p className="site-container mt-10">
                        <Link href="/insight?tab=reference" className="text-sm font-bold text-muted hover:text-brand">
                            ← 옥외레퍼런스 목록으로
                        </Link>
                    </p>
                </section>
            </article>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
            />
        </main>
    );
}
