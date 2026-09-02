import type { Metadata } from 'next';
import '@sun-typeface/suit/fonts/variable/woff2/SUIT-Variable.css';
import './globals.css';
import { SiteShell } from '@/components/layout/site-shell';
import { Analytics } from '@/components/layout/analytics';
import { SITE_URL, SITE_VERIFICATION } from '@/lib/site';

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    /* 브랜드명만으로는 카테고리 검색에 걸리지 않는다. title에 무엇을 하는 회사인지 넣는다 */
    title: {
        default: '병원광고연구소 | 병원 옥외광고 전문 대행사',
        template: '%s | 병원광고연구소',
    },
    /* AI 답변이 회사를 한 문장으로 인용할 때 이 문장을 그대로 쓴다 */
    description:
        '병원광고연구소는 병원 위치와 진료과를 기준으로 지하철·버스·버스정류장·아파트·전광판 옥외광고 매체와 비용을 같은 조건으로 비교해 실행 플랜을 제안하는 병원 전문 옥외광고 대행사입니다.',
    keywords: [
        '병원 옥외광고',
        '병원 옥외광고 업체',
        '병원 옥외광고 대행사',
        '병원광고 대행사',
        '지하철 광고',
        '버스 광고',
        '전광판 광고',
        '병원 마케팅',
    ],
    openGraph: {
        title: '병원광고연구소 | 병원 옥외광고 전문 대행사',
        description: '병원 위치와 진료과에 맞는 옥외광고 매체와 비용을 같은 조건으로 비교해 드립니다.',
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
    /* 사업자 정보는 푸터 표기·네이버 플레이스와 같은 값이어야 한다 */
    const organization = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': ['Organization', 'LocalBusiness'],
                '@id': `${SITE_URL}#organization`,
                name: '병원광고연구소',
                alternateName: ['MEDICAL AD LAB', '바이오애드랩'],
                description: '병원 위치와 진료과에 맞는 옥외광고 매체·지역·비용을 비교하고 실행 플랜을 제안합니다.',
                url: SITE_URL,
                logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/logo-ori.svg` },
                image: `${SITE_URL}/og-image.jpg`,
                telephone: '+82-2-2038-0088',
                email: 'medicaladlab@gmail.com',
                address: {
                    '@type': 'PostalAddress',
                    streetAddress: '학동로3길 27 2층 201호',
                    addressLocality: '강남구',
                    addressRegion: '서울특별시',
                    addressCountry: 'KR',
                },
                areaServed: { '@type': 'Country', name: '대한민국' },
                knowsAbout: [
                    '병원 옥외광고',
                    '지하철 광고',
                    '버스 광고',
                    '아파트 광고',
                    '전광판 광고',
                    '의료광고 심의',
                ],
            },
            {
                '@type': 'WebSite',
                '@id': `${SITE_URL}#website`,
                url: SITE_URL,
                name: '병원광고연구소',
                inLanguage: 'ko-KR',
                publisher: { '@id': `${SITE_URL}#organization` },
            },
        ],
    };
    return (
        <html lang="ko" data-scroll-behavior="smooth">
            <body>
                <SiteShell>{children}</SiteShell>
                <Analytics />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, '\\u003c') }}
                />
            </body>
        </html>
    );
}
