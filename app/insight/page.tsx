import Image from 'next/image';
import Link from 'next/link';
import { DiagnosisButton } from '@/components/lead/diagnosis-button';
import { mediaItems } from '@/data';
import { getReferences } from '@/lib/references';

export const metadata = {
    title: '병원집행 옥외레퍼런스',
    description: '병원광고연구소가 실제로 집행한 지하철·버스·아파트·전광판 옥외광고 레퍼런스를 확인하세요.',
    alternates: { canonical: '/insight' },
};

export default async function ReferencePage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const params = await searchParams;
    const activeType = typeof params.type === 'string' ? params.type : 'all';
    const references = await getReferences();
    const activeTitle = mediaItems.find((media) => media.key === activeType)?.title;
    const visibleReferences =
        activeType === 'all' ? references : references.filter((item) => item.type === activeTitle);

    const chip = (active: boolean) =>
        `inline-flex h-9 items-center rounded-full px-4 text-xs font-bold transition-colors lg:h-[38px] ${
            active ? 'bg-brand text-white' : 'border border-line bg-white text-muted'
        }`;

    return (
        <main className="pt-[60px] lg:pt-0">
            <section className="bg-soft pb-12 pt-10 lg:pb-[100px] lg:pt-[178px]">
                <div className="site-container">
                    <p className="m-0 text-xs font-extrabold tracking-[.12em] text-brand">MEDICAL AD KNOWLEDGE</p>
                    <h1 className="mt-4 text-h1">
                        직접 확인한 정보와
                        <br />
                        <em className="not-italic text-brand">집행 사례를 전합니다.</em>
                    </h1>
                    <p className="mt-4 text-sm text-muted lg:mt-5 lg:text-body">
                        실무 인사이트부터 실제 옥외광고 사례까지
                    </p>
                </div>
            </section>

            <section className="bg-white py-section">
                <div className="site-container">
                    <h2 className="m-0 text-h4 lg:text-h2">최근 집행된 옥외광고</h2>
                    <p className="mb-6 mt-2 text-sm text-muted lg:mb-9">필터를 선택해 사례를 확인하세요.</p>

                    <div className="mb-6 flex flex-wrap gap-2 lg:mb-9" aria-label="매체 필터">
                        <Link href="/insight" className={chip(activeType === 'all')}>
                            전체
                        </Link>
                        {mediaItems.map((item) => (
                            <Link
                                key={item.key}
                                href={`/insight?type=${item.key}`}
                                className={chip(activeType === item.key)}
                            >
                                {item.title.replace(' 광고', '')}
                            </Link>
                        ))}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                        {visibleReferences.map((item) => (
                            <article className="card-base overflow-hidden" key={item.slug}>
                                <Link href={`/insight/reference/${item.slug}`}>
                                    <div className="relative aspect-[16/10] bg-brand-tint">
                                        <Image
                                            src={item.image}
                                            alt={`${item.title} 예시`}
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

                    {visibleReferences.length === 0 && (
                        <p className="py-16 text-center text-sm text-muted">
                            해당 매체의 레퍼런스를 준비하고 있습니다.
                        </p>
                    )}
                </div>
            </section>

            <section className="bg-deep py-section text-center text-white">
                <div className="site-container">
                    <h2 className="section-title">우리 병원에 맞는 기준이 필요하다면</h2>
                    <p className="mb-8 mt-4 text-sm text-white/70 lg:mb-10">
                        매체와 견적이 없어도 무료진단부터 시작할 수 있습니다.
                    </p>
                    <DiagnosisButton className="btn-primary">무료진단 신청하기</DiagnosisButton>
                </div>
            </section>
        </main>
    );
}
