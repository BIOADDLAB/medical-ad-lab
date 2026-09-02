import type { Metadata } from 'next';

import { BottomCta } from '@/components/home/bottom-cta';
import { CATALOG, CatalogList, listJsonLd } from '@/components/catalog/catalog';
import { PageBanner } from '@/components/layout/page-banner';
import { getCategories } from '@/lib/categories';
import { getReferences, type Reference } from '@/lib/references';

type PageProps = { searchParams: Promise<{ type?: string }> };

const META = CATALOG.cases;

export const metadata: Metadata = {
    title: META.label,
    description: META.description,
    keywords: ['병원 옥외광고 사례', '병원광고 사례', '지하철 광고 사례', '버스 광고 사례', '병원 마케팅 사례'],
    alternates: { canonical: META.path },
    openGraph: {
        title: META.label,
        description: META.description,
        url: META.path,
        type: 'website',
        siteName: '병원광고연구소',
        locale: 'ko_KR',
        images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: '병원광고연구소 MEDICAL AD LAB' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: META.label,
        description: META.description,
        images: ['/og-image.jpg'],
    },
};

export default async function CasesPage({ searchParams }: PageProps) {
    const [{ type }, items, categories] = await Promise.all([
        searchParams,
        getReferences(),
        getCategories('references'),
    ]);
    const activeKey = type ?? 'all';
    const activeTitle = categories.find((item) => item.key === activeKey)?.title;
    const visible: Reference[] = activeKey === 'all' ? items : items.filter((item) => item.type === activeTitle);

    return (
        <main className="pt-[60px] md:pt-[72px] xl:pt-0">
            <PageBanner variant="reference" />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(listJsonLd('cases', visible)).replace(/</g, '\\u003c'),
                }}
            />
            <CatalogList
                kind="cases"
                items={visible}
                categories={categories}
                activeKey={activeKey}
                total={items.length}
            />
            <BottomCta />
        </main>
    );
}
