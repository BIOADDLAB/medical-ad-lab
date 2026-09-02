import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CATALOG, CatalogDetail, detailTrail } from '@/components/catalog/catalog';
import { breadcrumbJsonLd } from '@/components/layout/breadcrumb';
import { GOAL_FALLBACK, getReference, getReferences, getRelatedReferences, PLAN_FALLBACK } from '@/lib/references';
import { SITE_URL } from '@/lib/site';

type PageProps = { params: Promise<{ slug: string }> };

const META = CATALOG.cases;

export async function generateStaticParams() {
    const references = await getReferences();
    return references.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const item = await getReference(slug);
    if (!item) return { title: '집행 사례를 찾을 수 없습니다', robots: { index: false, follow: false } };
    // 검색·AI 답변에 그대로 인용되므로 요약을 우선 쓴다
    const description = item.summary || `${item.area} ${item.type} 집행 사례입니다.`;
    return {
        title: `${item.title} · ${item.type}`,
        description,
        keywords: [item.area, item.type, '병원 옥외광고 사례', `${item.area} ${item.type}`],
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

export default async function CaseDetail({ params }: PageProps) {
    const { slug } = await params;
    const item = await getReference(slug);
    if (!item) notFound();
    const related = await getRelatedReferences(item);

    // AI 답변 엔진이 매체·지역·집행 내용을 그대로 읽을 수 있게 남긴다
    const structuredData = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'CreativeWork',
                name: item.title,
                about: `${item.area} ${item.type}`,
                description: item.summary || `${item.area} ${item.type} 집행 사례입니다.`,
                contentLocation: { '@type': 'Place', name: item.area },
                image: item.image,
                inLanguage: 'ko-KR',
                url: `${SITE_URL}${META.path}/${item.slug}`,
                creator: { '@id': `${SITE_URL}#organization` },
            },
            breadcrumbJsonLd(detailTrail('cases', item)),
        ],
    };

    return (
        <main className="pt-[60px] lg:pt-0">
            <CatalogDetail
                kind="cases"
                item={item}
                related={related}
                rows={[
                    ['매체', item.type],
                    ['지역', item.area],
                    ['목표', item.goal || GOAL_FALLBACK],
                    ['구성', item.plan || PLAN_FALLBACK],
                ]}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
            />
        </main>
    );
}
