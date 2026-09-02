import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
            { protocol: 'https', hostname: 'bioaddlabgeo.web.app' },
        ],
        formats: ['image/webp'],
        // 레퍼런스 기본 이미지가 SVG다. 우리가 만든 public 파일만 쓰므로 스크립트를 막고 허용한다
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    /** 이미 색인된 옛 주소들. 전부 영구 리다이렉트로 새 주소에 연결한다 */
    async redirects() {
        return [
            { source: '/about', destination: '/blog', permanent: true },
            { source: '/about/:slug', destination: '/blog', permanent: true },
            // 한 주소를 탭으로 나눠 쓰던 /insight 를 주제별 주소로 분리했다
            {
                source: '/insight',
                has: [{ type: 'query', key: 'tab', value: 'reference' }],
                destination: '/cases',
                permanent: true,
            },
            { source: '/insight', destination: '/media', permanent: true },
            { source: '/insight/reference/:slug', destination: '/cases/:slug', permanent: true },
            { source: '/insight/spot/:slug', destination: '/media/:slug', permanent: true },
        ];
    },
};

export default nextConfig;
