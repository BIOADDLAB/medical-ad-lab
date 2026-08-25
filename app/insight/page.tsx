import Image from 'next/image';
import Link from 'next/link';
import { BottomCta } from '@/components/home/bottom-cta';
import { PageBanner } from '@/components/layout/page-banner';
import { getCategories } from '@/lib/categories';
import { getReferences, getSpots, type Reference } from '@/lib/references';

export const metadata = {
    title: '옥외광고 자리와 집행 레퍼런스',
    description:
        '지금 집행할 수 있는 병원 옥외광고 자리와, 병원광고연구소가 실제로 집행한 지하철·버스·아파트·전광판 레퍼런스를 확인하세요.',
    alternates: { canonical: '/insight' },
};

const TABS = [
    { id: 'spot', label: '병원광고 자리' },
    { id: 'reference', label: '병원집행 옥외레퍼런스' },
] as const;

export default async function InsightPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const params = await searchParams;
    const tab = params.tab === 'reference' ? 'reference' : 'spot';
    const isSpot = tab === 'spot';
    const activeKey = typeof params.type === 'string' ? params.type : 'all';

    // 탭마다 목록도 카테고리도 다르다. 보고 있는 탭만 읽는다
    const [items, categories] = await Promise.all([
        isSpot ? getSpots() : getReferences(),
        getCategories(isSpot ? 'spots' : 'references'),
    ]);

    const activeTitle = categories.find((item) => item.key === activeKey)?.title;
    const visible: Reference[] = activeKey === 'all' ? items : items.filter((item) => item.type === activeTitle);
    const detailPath = isSpot ? 'spot' : 'reference';

    const href = (next: Record<string, string>) => {
        const query = new URLSearchParams({ tab, ...next });
        if (query.get('type') === 'all') query.delete('type');
        return `/insight?${query.toString()}`;
    };

    return (
        <main className="pt-[60px] lg:pt-0">
            <PageBanner variant="reference" />

            {/* 탭. 서버 렌더라 링크로 바꾼다. 탭을 옮기면 필터는 전체로 돌아간다 */}
            <nav className="bg-white pt-10 lg:pt-16" aria-label="옥외광고 보기 방식">
                <div className="site-container">
                    <div className="tab-scroll flex gap-7 overflow-x-auto border-b border-line lg:gap-16">
                        {TABS.map((item) => {
                            const on = item.id === tab;
                            return (
                                <Link
                                    key={item.id}
                                    href={`/insight?tab=${item.id}`}
                                    aria-current={on ? 'page' : undefined}
                                    className={`relative -mb-px whitespace-nowrap pb-4 text-[17px] font-extrabold tracking-[-0.035em] transition-colors sm:text-[24px] lg:pb-6 lg:text-h3 ${
                                        on ? 'text-brand' : 'text-ink hover:text-brand'
                                    }`}
                                >
                                    {item.label}
                                    {on && <span className="absolute -inset-x-2 bottom-0 h-1 bg-brand" />}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>

            <section className="bg-white pb-section pt-10 lg:pt-12">
                <div className="site-container">
                    <h2 className="m-0 text-h3">{isSpot ? '지금 집행할 수 있는 광고 자리' : '최근 집행된 옥외광고'}</h2>
                    <p className="mb-6 mt-2 text-[15px] text-slate lg:mb-9 lg:text-[17px]">
                        {isSpot
                            ? '매체와 지역별로 지금 잡을 수 있는 자리를 확인하세요.'
                            : '매체와 업종별 실제 사례를 확인하세요.'}
                    </p>

                    <div className="mb-6 flex flex-wrap gap-2 lg:mb-9" aria-label="매체 필터">
                        {[{ key: 'all', title: '전체' }, ...categories].map((item) => {
                            const on = item.key === activeKey;
                            return (
                                <Link
                                    key={item.key}
                                    href={href({ type: item.key })}
                                    scroll={false}
                                    className={`inline-flex h-9 items-center rounded-full px-4 text-xs font-bold transition-colors lg:h-[38px] ${
                                        on ? 'bg-brand text-white' : 'border border-line bg-white text-muted'
                                    }`}
                                >
                                    {item.title.replace(' 광고', '')}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                        {visible.map((item) => (
                            <article className="card-base overflow-hidden" key={item.slug}>
                                <Link href={`/insight/${detailPath}/${item.slug}`}>
                                    <div className="relative aspect-[16/10] bg-brand-tint">
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 25vw"
                                        />
                                    </div>
                                    <div className="p-5">
                                        <span className="inline-flex rounded-md bg-line px-2 py-1 text-[10px] font-extrabold text-brand">
                                            {item.type}
                                        </span>
                                        <h3 className="mb-2 mt-3 text-h5">{item.title}</h3>
                                        <p className="m-0 text-xs text-muted">{item.area}</p>
                                    </div>
                                </Link>
                            </article>
                        ))}
                    </div>

                    {visible.length === 0 && (
                        <p className="py-16 text-center text-sm text-muted">
                            {items.length === 0
                                ? isSpot
                                    ? '집행 가능한 광고 자리를 정리하고 있습니다.'
                                    : '집행 레퍼런스를 정리하고 있습니다.'
                                : '해당 매체의 자료를 준비하고 있습니다.'}
                        </p>
                    )}
                </div>
            </section>

            <BottomCta />
        </main>
    );
}
