import type { Metadata } from 'next';
import '@sun-typeface/suit/fonts/variable/woff2/SUIT-Variable.css';
import './globals.css';
import { SiteShell } from '@/components/layout/site-shell';
import { Analytics } from '@/components/layout/analytics';

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://medicaladlab.example.com'),
    title: {
        default: '병원광고연구소 | MEDICAL AD LAB',
        template: '%s | 병원광고연구소',
    },
    description: '병원 위치와 진료과를 기준으로 옥외광고 매체, 지역, 비용을 비교하고 맞춤 실행 플랜을 제안합니다.',
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
    icons: { icon: '/favicon.ico', shortcut: '/favicon.ico', apple: '/og-image.jpg' },
    alternates: { canonical: '/' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const organization = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: '병원광고연구소',
        alternateName: 'MEDICAL AD LAB',
        url: process.env.NEXT_PUBLIC_SITE_URL || 'https://medicaladlab.example.com',
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
