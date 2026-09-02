import Image from 'next/image';
import Link from 'next/link';

import { Breadcrumb, breadcrumbJsonLd, type Crumb } from '@/components/layout/breadcrumb';
import { DiagnosisButton } from '@/components/lead/diagnosis-button';
import type { Category } from '@/lib/categories';
import type { Reference } from '@/lib/references';
import { SITE_URL } from '@/lib/site';


export type CatalogKind = 'media' | 'cases';

export const CATALOG = {
    media: {
        path: '/media',
        label: '광고자리 찾기',
        heading: '지금 집행할 수 있는 광고매체',
        lead: '매체와 지역별로 지금 잡을 수 있는 자리와 조건을 확인하세요.',
        description:
            '병원 주변에서 지금 집행할 수 있는 지하철·버스·버스정류장·아파트·전광판 옥외광고 매체를 지역과 매체별로 확인하세요.',
        empty: '집행 가능한 광고 자리를 정리하고 있습니다.',
        relatedHeading: '함께 보면 좋은 광고매체',
        backLabel: '← 광고매체 목록으로',
        infoEyebrow: 'MEDIA INFO',
        infoHeading: '매체 정보',
        cta: '이 매체 문의하기',
        crossHref: '/cases',
        crossLabel: '실제 집행 사례 보기',
    },
    cases: {
        path: '/cases',
        label: '병원광고 사례',
        heading: '최근 집행된 병원 옥외광고',
        lead: '매체와 진료과별 실제 집행 사례를 확인하세요.',
        description:
            '병원광고연구소가 실제로 집행한 지하철·버스·버스정류장·아파트·전광판 병원 옥외광고 사례를 매체와 지역별로 확인하세요.',
        empty: '집행 사례를 정리하고 있습니다.',
        relatedHeading: '함께 보면 좋은 집행 사례',
        backLabel: '← 병원광고 사례 목록으로',
        infoEyebrow: 'CASE INFO',
        infoHeading: '집행 정보',
        cta: '비슷한 광고 문의하기',
        crossHref: '/media',
        crossLabel: '집행 가능한 광고매체 보기',
    },
} as const;

const TABS: CatalogKind[] = ['media', 'cases'];

export function listTrail(kind: CatalogKind): Crumb[] {
    return [
        { name: '홈', href: '/' },
        { name: CATALOG[kind].label, href: CATALOG[kind].path },
    ];
}

export function detailTrail(kind: CatalogKind, item: Reference): Crumb[] {
    return [...listTrail(kind), { name: item.title, href: `${CATALOG[kind].path}/${item.slug}` }];
}

export function listJsonLd(kind: CatalogKind, items: Reference[]) {
    const meta = CATALOG[kind];
    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'CollectionPage',
                name: meta.label,
                description: meta.description,
                url: `${SITE_URL}${meta.path}`,
                inLanguage: 'ko-KR',
                isPartOf: { '@id': `${SITE_URL}#website` },
                mainEntity: {
                    '@type': 'ItemList',
                    name: `${meta.label} 목록`,
                    itemListElement: items.map((item, index) => ({
                        '@type': 'ListItem',
                        position: index + 1,
                        name: item.title,
                        url: `${SITE_URL}${meta.path}/${item.slug}`,
                    })),
                },
            },
            breadcrumbJsonLd(listTrail(kind)),
        ],
    };
}

function Tabs({ kind }: { kind: CatalogKind }) {
    return (
        <nav className="bg-white pt-8 sm:pt-10 lg:pt-12" aria-label="옥외광고 보기 방식">
            <div className="site-container">
                <div className="tab-scroll flex gap-8 overflow-x-auto border-b border-line sm:gap-12 lg:gap-16">
                    {TABS.map((id) => {
                        const on = id === kind;
                        return (
                            <Link
                                key={id}
                                href={CATALOG[id].path}
                                aria-current={on ? 'page' : undefined}
                                className={`relative -mb-px shrink-0 whitespace-nowrap pb-4 text-left text-[18px] font-extrabold leading-[1.4] tracking-[-0.035em] transition-colors sm:pb-5 sm:text-[22px] lg:pb-6 lg:text-[24px] ${
                                    on ? 'text-brand' : 'text-ink hover:text-brand'
                                }`}
                            >
                                {CATALOG[id].label}
                                {on && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-brand" />}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}

export function CatalogList({
    kind,
    items,
    categories,
    activeKey,
    total,
}: {
    kind: CatalogKind;
    items: Reference[];
    categories: Category[];
    activeKey: string;
    total: number;
}) {
    const meta = CATALOG[kind];
    const filterHref = (key: string) => (key === 'all' ? meta.path : `${meta.path}?type=${encodeURIComponent(key)}`);

    return (
        <>
            <Tabs kind={kind} />
            <section className="bg-white pb-section pt-10 lg:pt-12">
                <div className="site-container">
                    <Breadcrumb trail={listTrail(kind)} />
                    <h1 className="m-0 mt-4 text-h3">{meta.heading}</h1>
                    <p className="mt-2 text-[15px] text-slate lg:text-[17px]">{meta.lead}</p>
                    <p className="mb-6 mt-4 text-xs text-muted lg:mb-9">전체 {items.length}개</p>

                    <div
                        className="tab-scroll -mx-gutter mb-6 flex flex-nowrap gap-2 overflow-x-auto px-gutter pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 lg:mb-9"
                        aria-label="매체 필터"
                    >
                        {[{ key: 'all', title: '전체' }, ...categories].map((item) => {
                            const on = item.key === activeKey;
                            return (
                                <Link
                                    key={item.key}
                                    href={filterHref(item.key)}
                                    scroll={false}
                                    className={`inline-flex h-9 shrink-0 items-center rounded-full px-4 text-xs font-bold transition-colors lg:h-[38px] ${
                                        on ? 'bg-brand text-white' : 'border border-line bg-white text-muted'
                                    }`}
                                >
                                    {item.title.replace(' 광고', '')}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                        {items.map((item, index) => (
                            <article className="card-base overflow-hidden" key={item.slug}>
                                {/* 앵커 텍스트가 제목이 되도록 링크는 제목에만 건다. 썸네일은 보조 링크다 */}
                                <Link
                                    href={`${meta.path}/${item.slug}`}
                                    tabIndex={-1}
                                    aria-hidden="true"
                                    className="relative block aspect-[16/10] bg-brand-tint"
                                >
                                    <Image
                                        src={item.image}
                                        alt={`${item.title} ${item.type}`}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 25vw"
                                        priority={index === 0}
                                    />
                                </Link>
                                <div className="p-5">
                                    <span className="inline-flex rounded-md bg-line px-2 py-1 text-[10px] font-extrabold text-brand">
                                        {item.type}
                                    </span>
                                    <h2 className="mb-2 mt-3 text-h5">
                                        <Link href={`${meta.path}/${item.slug}`}>{item.title}</Link>
                                    </h2>
                                    <p className="m-0 text-xs text-muted">{item.area}</p>
                                </div>
                            </article>
                        ))}
                    </div>

                    {items.length === 0 && (
                        <p className="py-16 text-center text-sm text-muted">
                            {total === 0 ? meta.empty : '해당 매체의 자료를 준비하고 있습니다.'}
                        </p>
                    )}
                </div>
            </section>
        </>
    );
}

export function CatalogDetail({
    kind,
    item,
    related,
    rows,
}: {
    kind: CatalogKind;
    item: Reference;
    related: Reference[];
    rows: [string, string][];
}) {
    const meta = CATALOG[kind];

    return (
        <article>
            <section className="border-b border-line bg-soft pb-10 pt-10 lg:pb-[90px] lg:pt-[174px]">
                <div className="site-container">
                    <Breadcrumb trail={detailTrail(kind, item)} />
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
                            fetchPriority="high"
                        />
                    </div>
                    <aside className="card-base p-6 lg:p-9">
                        <p className="m-0 text-xs font-extrabold tracking-[.14em] text-brand">{meta.infoEyebrow}</p>
                        <h2 className="mb-6 mt-3 text-h4 lg:mb-7">{meta.infoHeading}</h2>
                        <dl className="m-0 mb-7">
                            {rows.map(([term, value]) => (
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
                        <DiagnosisButton className="btn-primary w-full">{meta.cta}</DiagnosisButton>
                        <Link href={meta.crossHref} className="mt-3 block text-center text-xs font-bold text-brand">
                            {meta.crossLabel}
                        </Link>
                    </aside>
                </div>

                {related.length > 0 && (
                    <nav aria-label={meta.relatedHeading} className="site-container mt-12 lg:mt-16">
                        <h2 className="m-0 mb-5 text-h4">{meta.relatedHeading}</h2>
                        <ul className="grid gap-4 sm:grid-cols-3">
                            {related.map((other) => (
                                <li key={other.slug} className="card-base p-5">
                                    <span className="text-[10px] font-extrabold text-brand">{other.type}</span>
                                    <p className="mb-1 mt-2 text-sm font-bold">
                                        <Link href={`${meta.path}/${other.slug}`}>{other.title}</Link>
                                    </p>
                                    <p className="m-0 text-xs text-muted">{other.area}</p>
                                </li>
                            ))}
                        </ul>
                    </nav>
                )}

                <p className="site-container mt-10">
                    <Link href={meta.path} className="text-sm font-bold text-muted hover:text-brand">
                        {meta.backLabel}
                    </Link>
                </p>
            </section>
        </article>
    );
}
