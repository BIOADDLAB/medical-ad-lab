import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DiagnosisButton } from '@/components/lead/diagnosis-button';
import { getSpot, getSpots, SPOT_GOAL_FALLBACK, SPOT_PLAN_FALLBACK } from '@/lib/references';
import { SITE_URL } from '@/lib/site';

export async function generateStaticParams() {
    const spots = await getSpots();
    return spots.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const item = await getSpot(slug);
    if (!item) return {};
    const description = item.summary || `${item.area} ${item.type} 집행 가능한 광고 자리입니다.`;
    return {
        title: `${item.title} · ${item.type}`,
        description,
        keywords: [item.area, item.type, '병원 옥외광고', `${item.area} ${item.type}`],
        alternates: { canonical: `/insight/spot/${item.slug}` },
        openGraph: { title: `${item.title} · ${item.type}`, description, images: [item.image], type: 'article' },
    };
}

export default async function SpotDetail({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const item = await getSpot(slug);
    if (!item) notFound();

    const baseUrl = SITE_URL;
    // 집행 가능한 자리이므로 사례(CreativeWork)가 아니라 판매 중인 상품으로 표시한다
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: item.title,
        category: item.type,
        description: item.summary || `${item.area} ${item.type} 집행 가능한 광고 자리입니다.`,
        image: item.image,
        url: `${baseUrl}/insight/spot/${item.slug}`,
        brand: { '@type': 'Organization', name: '병원광고연구소', url: baseUrl },
        areaServed: { '@type': 'Place', name: item.area },
    };

    return (
        <main className="pt-[60px] lg:pt-0">
            <section className="border-b border-line bg-soft pb-10 pt-10 lg:pb-[90px] lg:pt-[174px]">
                <div className="site-container">
                    <p className="flex gap-2 text-xs text-muted">
                        <Link href="/insight?tab=spot">광고 자리 알아보기</Link>
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
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 800px) 100vw, 62vw"
                            priority
                        />
                    </div>
                    <aside className="card-base p-6 lg:p-9">
                        <p className="m-0 text-xs font-extrabold tracking-[.14em] text-brand">SPOT INFO</p>
                        <h2 className="mb-6 mt-3 text-h4 lg:mb-7">자리 정보</h2>
                        <dl className="m-0 mb-7">
                            {[
                                ['매체', item.type],
                                ['지역', item.area],
                                ['규격', item.goal || SPOT_GOAL_FALLBACK],
                                ['집행 조건', item.plan || SPOT_PLAN_FALLBACK],
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
                        <DiagnosisButton className="btn-primary w-full">이 자리 문의하기</DiagnosisButton>
                    </aside>
                </div>
            </section>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        </main>
    );
}
