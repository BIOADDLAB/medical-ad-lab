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

export default function Home() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://medicaladlab.example.com';
    const structuredData = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Service',
                name: '병원 옥외광고 무료진단',
                serviceType: '병원 옥외광고 매체·위치·비용 비교',
                provider: { '@type': 'Organization', name: '병원광고연구소', url: baseUrl },
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
