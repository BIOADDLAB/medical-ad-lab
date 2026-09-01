import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumb, breadcrumbJsonLd, type Crumb } from '@/components/layout/breadcrumb';
import { DiagnosisButton } from '@/components/lead/diagnosis-button';
import { getRelatedSpots, getSpot, getSpots, SPOT_GOAL_FALLBACK, SPOT_PLAN_FALLBACK } from '@/lib/references';
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
        openGraph: {
            title: `${item.title} · ${item.type}`,
            description,
            url: `/insight/spot/${item.slug}`,
            type: 'article',
            siteName: '병원광고연구소',
            locale: 'ko_KR',
            images: [{ url: item.image, alt: `${item.title} ${item.type}`, width: 1200, height: 630 }],
        },
        twitter: { card: 'summary_large_image', title: item.title, description, images: [item.image] },
    };
}

export default async function SpotDetail({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const item = await getSpot(slug);
    if (!item) notFound();

    const baseUrl = SITE_URL;
    const related = await getRelatedSpots(item);
    const trail: Crumb[] = [
        { name: '홈', href: '/' },
        { name: '병원광고 자리', href: '/insight?tab=spot' },
        { name: item.title, href: `/insight/spot/${item.slug}` },
    ];
    // 집행 가능한 자리이므로 사례(CreativeWork)가 아니라 판매 중인 상품으로 표시한다
    const structuredData = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Product',
                name: item.title,
                category: item.type,
                description: item.summary || `${item.area} ${item.type} 집행 가능한 광고 자리입니다.`,
                image: item.image,
                inLanguage: 'ko-KR',
                url: `${baseUrl}/insight/spot/${item.slug}`,
                brand: { '@type': 'Organization', name: '병원광고연구소', url: baseUrl },
                areaServed: { '@type': 'Place', name: item.area },
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
                            <Link
                                href="/insight?tab=reference"
                                className="mt-3 block text-center text-xs font-bold text-brand"
                            >
                                실제 집행 사례 보기
                            </Link>
                        </aside>
                    </div>

                    {related.length > 0 && (
                        <nav aria-label="관련 광고 자리" className="site-container mt-12 lg:mt-16">
                            <h2 className="m-0 mb-5 text-h4">함께 보면 좋은 광고 자리</h2>
                            <ul className="grid gap-4 sm:grid-cols-3">
                                {related.map((other) => (
                                    <li key={other.slug} className="card-base p-5">
                                        <span className="text-[10px] font-extrabold text-brand">{other.type}</span>
                                        <p className="mb-1 mt-2 text-sm font-bold">
                                            <Link href={`/insight/spot/${other.slug}`}>{other.title}</Link>
                                        </p>
                                        <p className="m-0 text-xs text-muted">{other.area}</p>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    )}

                    <p className="site-container mt-10">
                        <Link href="/insight?tab=spot" className="text-sm font-bold text-muted hover:text-brand">
                            ← 광고 자리 목록으로
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
