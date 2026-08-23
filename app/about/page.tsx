import Link from 'next/link';
import type { Metadata } from 'next';
import { BottomCta } from '@/components/home/bottom-cta';
import { PageBanner } from '@/components/layout/page-banner';
import { insightPosts } from '@/data';

export const metadata: Metadata = {
    title: '병원광고연구소',
    description: '병원광고연구소가 직접 기록한 매체 분석과 실행 노트입니다.',
    alternates: { canonical: '/about' },
    openGraph: {
        title: '병원광고연구소 저널',
        description: '현장에서 얻은 데이터와 판단 기준을 병원광고연구소가 직접 기록합니다.',
        url: '/about',
        type: 'website',
        siteName: '병원광고연구소',
        locale: 'ko_KR',
        images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: '병원광고연구소 저널' }],
    },
};

export default function AboutPage() {
    const [featured, ...rest] = insightPosts;

    return (
        <main className="pt-[60px] md:pt-[72px] xl:pt-20">
            <PageBanner variant="journal" />

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

            <BottomCta />
        </main>
    );
}
