import type { Metadata } from 'next';
import '@sun-typeface/suit/fonts/variable/woff2/SUIT-Variable.css';
import './globals.css';
import { SiteShell } from '@/components/layout/site-shell';
import { Analytics } from '@/components/layout/analytics';
import { SITE_URL, SITE_VERIFICATION } from '@/lib/site';

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: '병원광고연구소 | MEDICAL AD LAB',
        template: '%s | 병원광고연구소',
    },
    description:
        '병원 옥외광고 견적을 무료로 비교해드립니다. 지하철·버스·아파트·전광판 매체비와 제작·설치·심의 비용까지, 병원 위치와 진료과에 맞는 실행 플랜을 제안합니다.',
    keywords: ['병원광고', '병원 옥외광고', '지하철 광고', '버스 광고', '병원 마케팅'],
    openGraph: {
        title: '병원광고연구소 | MEDICAL AD LAB',
        description: '병원에 맞는 옥외광고, 데이터로 먼저 진단하세요.',
        siteName: '병원광고연구소',
        locale: 'ko_KR',
        type: 'website',
        images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: '병원광고연구소 MEDICAL AD LAB' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: '병원광고연구소 | MEDICAL AD LAB',
        description: '병원에 맞는 옥외광고, 데이터로 먼저 진단하세요.',
        images: ['/og-image.jpg'],
    },
    icons: { icon: '/favicon.ico', shortcut: '/favicon.ico', apple: '/apple-touch-icon.png' },
    alternates: { canonical: '/' },
    /* 검색 결과에 큰 썸네일과 긴 설명을 허용한다. 넣지 않으면 구글이 작은 이미지만 쓴다 */
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    verification: {
        google: SITE_VERIFICATION.google || undefined,
        other: SITE_VERIFICATION.naver ? { 'naver-site-verification': SITE_VERIFICATION.naver } : {},
    },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const organization = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: '병원광고연구소',
        alternateName: 'MEDICAL AD LAB',
        url: SITE_URL,
    };
    return (
        <html lang="ko" data-scroll-behavior="smooth">
            <body>
                <SiteShell>{children}</SiteShell>
                <Analytics />
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
            </body>
        </html>
    );
}
