import { HomeMotion } from '@/components/home/home-motion';
import { Hero } from '@/components/home/hero';
import { PainPoints } from '@/components/home/pain-points';
import { WhyOoh } from '@/components/home/why-ooh';
import { Results } from '@/components/home/results';
import { Media } from '@/components/home/media';
import { Metrics } from '@/components/home/metrics';
import { Lab } from '@/components/home/lab';
import { Process } from '@/components/home/process';
import { Faq } from '@/components/home/faq';
import { BottomCta } from '@/components/home/bottom-cta';
import { LegacyHomeMotion } from '@/components/home/home-motion-legacy';
import { MOTION_PRESET } from '@/lib/motion-config';
import { faqs } from '@/data';
import { SITE_URL } from '@/lib/site';
import type { Metadata } from 'next';

/** 홈의 공유 정보. og:url까지 넣는다(하위 페이지는 각자 자기 주소를 넣는다) */
export const metadata: Metadata = {
    alternates: { canonical: '/' },
    openGraph: {
        title: '병원광고연구소 | 병원 옥외광고 전문 대행사',
        description: '병원 위치와 진료과에 맞는 옥외광고 매체와 비용을 같은 조건으로 비교해 드립니다.',
        url: '/',
        siteName: '병원광고연구소',
        locale: 'ko_KR',
        type: 'website',
        images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: '병원광고연구소 병원 옥외광고 무료진단' }],
    },
};

export default function Home() {
    const baseUrl = SITE_URL;
    const structuredData = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Service',
                name: '병원 옥외광고 무료진단',
                serviceType: '병원 옥외광고 매체·위치·비용 비교',
                // 회사 정보는 layout의 Organization(@id) 하나로 잇는다
                provider: { '@id': `${baseUrl}#organization` },
                areaServed: { '@type': 'Country', name: '대한민국' },
                url: `${baseUrl}/#apply`,
            },
            {
                '@type': 'FAQPage',
                mainEntity: faqs.map(([question, answer]) => ({
                    '@type': 'Question',
                    name: question,
                    acceptedAnswer: { '@type': 'Answer', text: answer },
                })),
            },
        ],
    };

    return (
        <main>
            {MOTION_PRESET === 'legacy' ? <LegacyHomeMotion /> : <HomeMotion />}
            <Hero />
            <PainPoints />
            <WhyOoh />
            <Results />
            <Media />
            <Metrics />
            <Lab />
            <Process />
            <Faq />
            <BottomCta />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        </main>
    );
}
