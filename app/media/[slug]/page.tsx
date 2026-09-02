import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CATALOG, CatalogDetail, detailTrail } from '@/components/catalog/catalog';
import { breadcrumbJsonLd } from '@/components/layout/breadcrumb';
import { getRelatedSpots, getSpot, getSpots, SPOT_GOAL_FALLBACK, SPOT_PLAN_FALLBACK } from '@/lib/references';
import { SITE_URL } from '@/lib/site';

type PageProps = { params: Promise<{ slug: string }> };

const META = CATALOG.media;

export async function generateStaticParams() {
    const spots = await getSpots();
    return spots.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const item = await getSpot(slug);
    if (!item) return { title: '광고매체를 찾을 수 없습니다', robots: { index: false, follow: false } };
    const description = item.summary || `${item.area} ${item.type} 집행 가능한 광고 자리입니다.`;
    return {
        title: `${item.title} · ${item.type}`,
        description,
        keywords: [item.area, item.type, '병원 옥외광고', `${item.area} ${item.type}`],
        alternates: { canonical: `${META.path}/${item.slug}` },
        openGraph: {
            title: `${item.title} · ${item.type}`,
            description,
            url: `${META.path}/${item.slug}`,
            type: 'article',
            siteName: '병원광고연구소',
            locale: 'ko_KR',
            images: [{ url: item.image, alt: `${item.title} ${item.type}`, width: 1200, height: 630 }],
        },
        twitter: { card: 'summary_large_image', title: item.title, description, images: [item.image] },
    };
}

export default async function MediaDetail({ params }: PageProps) {
    const { slug } = await params;
    const item = await getSpot(slug);
    if (!item) notFound();
    const related = await getRelatedSpots(item);

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
                url: `${SITE_URL}${META.path}/${item.slug}`,
                brand: { '@id': `${SITE_URL}#organization` },
                areaServed: { '@type': 'Place', name: item.area },
            },
            breadcrumbJsonLd(detailTrail('media', item)),
        ],
    };

    return (
        <main className="pt-[60px] lg:pt-0">
            <CatalogDetail
                kind="media"
                item={item}
                related={related}
                rows={[
                    ['매체', item.type],
                    ['지역', item.area],
                    ['규격', item.goal || SPOT_GOAL_FALLBACK],
                    ['집행 조건', item.plan || SPOT_PLAN_FALLBACK],
                ]}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
            />
        </main>
    );
}
