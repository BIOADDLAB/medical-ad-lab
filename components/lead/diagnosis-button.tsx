'use client';

/** 어느 페이지에서든 쓰는 무료진단 CTA. 셸의 내부 상태를 모르고 이벤트만 던진다 */
export function DiagnosisButton({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <button
            type="button"
            className={className}
            onClick={(event) =>
                window.dispatchEvent(new CustomEvent('diagnosis-open', { detail: event.currentTarget }))
            }
        >
            {children}
        </button>
    );
}
