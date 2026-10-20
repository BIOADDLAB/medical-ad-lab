'use client';

import Link from 'next/link';

/**
 * 어느 페이지에서든 쓰는 무료진단 CTA. 셸의 내부 상태를 모르고 이벤트만 던진다.
 * 링크(/#apply)라서 검색엔진·JS가 꺼진 브라우저도 홈의 신청 폼으로 갈 수 있다. JS가 있으면 진단 창을 연다.
 */
export function DiagnosisButton({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <Link
            href="/#apply"
            className={className}
            // 블로그를 본 방문의 문의 클릭으로 CMS에 셉니다
            data-track-cta="consultation"
            onClick={(event) => {
                event.preventDefault();
                window.dispatchEvent(new CustomEvent('diagnosis-open', { detail: event.currentTarget }));
            }}
        >
            {children}
        </Link>
    );
}
