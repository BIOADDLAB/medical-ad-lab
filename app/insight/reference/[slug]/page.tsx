import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DiagnosisButton } from '@/components/lead/diagnosis-button';
import { GOAL_FALLBACK, getReference, getReferences, PLAN_FALLBACK } from '@/lib/references';
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
        openGraph: { title: `${item.title} · ${item.type}`, description, images: [item.image], type: 'article' },
    };
}

export default async function ReferenceDetail({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const item = await getReference(slug);
    if (!item) notFound();

    const baseUrl = SITE_URL;
    // AI 답변 엔진이 매체·지역·집행 내용을 그대로 읽을 수 있게 남긴다
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: item.title,
        about: `${item.area} ${item.type}`,
        description: item.summary || `${item.area} ${item.type} 집행 레퍼런스입니다.`,
        contentLocation: { '@type': 'Place', name: item.area },
        url: `${baseUrl}/insight/reference/${item.slug}`,
        creator: { '@type': 'Organization', name: '병원광고연구소', url: baseUrl },
    };

    return (
        <main className="pt-[60px] lg:pt-0">
            <section className="border-b border-line bg-soft pb-10 pt-10 lg:pb-[90px] lg:pt-[174px]">
                <div className="site-container">
                    <p className="flex gap-2 text-xs text-muted">
                        <Link href="/insight?tab=reference">옥외레퍼런스</Link>
                        <span>/</span>
                        {item.type}
                    </p>
                    <h1 className="mb-2.5 mt-6 text-h1 lg:mt-8">{item.title}</h1>
                    <span className="text-sm font-bold text-brand">{item.area}</span>
                </div>
            </section>

            <section className="py-section">
                <div className="site-container grid gap-8 lg:grid-cols-[1.4fr_.6fr] lg:gap-14">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-panel bg-brand-pale">
                        <Image
                            src={item.image}
                            alt={`${item.title} 레퍼런스`}
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
                    </aside>
                </div>
            </section>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        </main>
    );
}
