import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [{ protocol: 'https', hostname: 'firebasestorage.googleapis.com' }],
        // 레퍼런스 기본 이미지가 SVG다. 우리가 만든 public 파일만 쓰므로 스크립트를 막고 허용한다
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    /** 임시 저널(/about)을 CMS 블로그로 넘긴다. 이미 색인된 주소라 301 로 보낸다 */
    async redirects() {
        return [
            { source: '/about', destination: '/blog', permanent: true },
            { source: '/about/:slug', destination: '/blog', permanent: true },
        ];
    },
};

export default nextConfig;
