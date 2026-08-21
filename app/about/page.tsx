import Link from 'next/link';
import { DiagnosisButton } from '@/components/lead/diagnosis-button';
import { insightPosts } from '@/data';

export const metadata = {
    title: '병원광고연구소',
    description: '병원광고연구소가 직접 기록한 매체 분석과 실행 노트입니다.',
    alternates: { canonical: '/about' },
};

export default function AboutPage() {
    const [featured, ...rest] = insightPosts;

    return (
        <main className="pt-[60px] lg:pt-0">
            <section className="relative overflow-hidden bg-ink pb-14 pt-10 text-white lg:pb-[100px] lg:pt-[178px]">
                <div className="site-container">
                    <p className="m-0 text-xs font-extrabold tracking-[.12em] text-brand-light">
                        MEDICAL AD LAB JOURNAL
                    </p>
                    <h1 className="mt-4 text-h1">
                        분석하고 실행한 것을
                        <br />
                        <em className="not-italic text-brand-light">직접 기록합니다.</em>
                    </h1>
                    <p className="mt-4 max-w-[520px] text-sm text-white/60 lg:mt-5 lg:text-body">
                        병원광고연구소가 현장에서 확인한 기준과 데이터를 정리하는 자체 제작 저널입니다.
                    </p>
                    <div
                        className="mt-8 h-[90px] w-[130px] rounded-2xl border border-white/20 bg-white/5 lg:absolute lg:right-[10%] lg:top-1/2 lg:mt-0 lg:h-[200px] lg:w-[280px]"
                        aria-hidden
                    />
                </div>
            </section>

            <section className="bg-white py-section">
                <div className="site-container">
                    <h2 className="m-0 mb-5 text-h4 lg:mb-8 lg:text-h2">이번 주 연구노트</h2>
                    <Link
                        href={`/about/${featured.slug}`}
                        className="block rounded-panel bg-field p-5 lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12 lg:p-10"
                    >
                        <div className="aspect-[16/10] rounded-2xl bg-brand-pale" aria-hidden />
                        <div className="pt-5 lg:pt-0">
                            <span className="text-xs font-bold text-brand">FEATURED · {featured.category}</span>
                            <h3 className="mb-3 mt-3 text-h4 lg:text-h3">{featured.title}</h3>
                            <p className="m-0 text-sm text-muted">{featured.excerpt}</p>
                            <small className="mt-4 block text-xs text-muted">
                                {featured.date} · {featured.readTime}
                            </small>
                        </div>
                    </Link>
                </div>
            </section>

            <section className="bg-white pb-section">
                <div className="site-container">
                    <h2 className="m-0 mb-5 text-h4 lg:mb-8 lg:text-h2">연구소가 직접 만든 인사이트</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                        {rest.map((post) => (
                            <article className="card-base overflow-hidden" key={post.slug}>
                                <Link href={`/about/${post.slug}`}>
                                    <div className="aspect-[16/10] bg-brand-tint" aria-hidden />
                                    <div className="p-5 lg:p-6">
                                        <span className="text-xs font-bold text-brand">{post.category}</span>
                                        <h3 className="mb-3 mt-3 text-h5">{post.title}</h3>
                                        <p className="m-0 text-xs text-muted">{post.excerpt}</p>
                                        <small className="mt-4 block text-xs text-muted">
                                            {post.date} · {post.readTime}
                                        </small>
                                    </div>
                                </Link>
                            </article>
                        ))}
                    </div>
                    <div className="mt-8 text-center lg:mt-12">
                        <Link href="/about" className="btn-outline">
                            연구노트 더보기
                        </Link>
                    </div>
                </div>
            </section>

            <section className="bg-deep py-section text-center text-white">
                <div className="site-container">
                    <h2 className="section-title">우리 병원에 직접 적용해 보고 싶다면</h2>
                    <p className="mb-8 mt-4 text-sm text-white/70 lg:mb-10">
                        연구한 기준을 바탕으로 매체와 비용을 비교해 드립니다.
                    </p>
                    <DiagnosisButton className="btn-primary">무료진단 신청하기</DiagnosisButton>
                </div>
            </section>
        </main>
    );
}
