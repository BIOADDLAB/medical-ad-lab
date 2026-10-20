import type { NextConfig } from 'next';
import { HOSPITAL } from './bioadd-blog/hospital.config';

const nextConfig: NextConfig = {
    // 끝 슬래시 주소(/company/)는 Next 기본(308) 대신 proxy.ts가 301로 옮긴다
    trailingSlash: false,
    skipTrailingSlashRedirect: true,
    images: {
        // 블로그 이미지(CMS 저장소)는 블로그 코드(hospital.config.ts)의 목록을 따른다. 예전 CMS 주소도 남겨 둔다
        remotePatterns: [
            ...HOSPITAL.imageHosts.map((hostname) => ({ protocol: 'https' as const, hostname })),
            { protocol: 'https', hostname: 'bioaddlabgeo.web.app' },
        ],
        formats: ['image/webp'],
        // 레퍼런스 기본 이미지가 SVG다. 우리가 만든 public 파일만 쓰므로 스크립트를 막고 허용한다
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    /** 이미 색인된 옛 주소들. 전부 영구 리다이렉트(301)로 새 주소에 연결한다(permanent: true는 308) */
    async redirects() {
        return [
            { source: '/about', destination: '/blog', statusCode: 301 },
            { source: '/about/:slug', destination: '/blog', statusCode: 301 },
            // 한 주소를 탭으로 나눠 쓰던 /insight 를 주제별 주소로 분리했다
            {
                source: '/insight',
                has: [{ type: 'query', key: 'tab', value: 'reference' }],
                destination: '/cases',
                statusCode: 301,
            },
            { source: '/insight', destination: '/media', statusCode: 301 },
            { source: '/insight/reference/:slug', destination: '/cases/:slug', statusCode: 301 },
            { source: '/insight/spot/:slug', destination: '/media/:slug', statusCode: 301 },
        ];
    },
};

export default nextConfig;
