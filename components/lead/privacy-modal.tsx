'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/ui/icon';
import { privacyEffectiveDate, privacySections } from '@/lib/privacy-policy';

export function PrivacyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const dialogRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!open || !dialogRef.current) return;

        const previousFocus = document.activeElement as HTMLElement | null;
        const previousOverflow = document.body.style.overflow;
        const dialog = dialogRef.current;
        document.body.style.overflow = 'hidden';
        const focusable = () =>
            Array.from(
                dialog.querySelectorAll<HTMLElement>(
                    "button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])",
                ),
            );
        focusable()[0]?.focus();

        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.stopPropagation();
                onClose();
                return;
            }
            if (event.key !== 'Tab') return;
            const items = focusable();
            const first = items[0];
            const last = items.at(-1);
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first?.focus();
            }
        };

        document.addEventListener('keydown', handleKey, true);
        return () => {
            document.removeEventListener('keydown', handleKey, true);
            document.body.style.overflow = previousOverflow;
            previousFocus?.focus({ preventScroll: true });
        };
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div
            onMouseDown={(event) => {
                if (event.currentTarget === event.target) onClose();
            }}
            className="fixed inset-0 z-[260] grid place-items-center bg-deep/65 p-4 backdrop-blur-[3px] md:p-6"
        >
            <section
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="privacy-modal-title"
                className="relative flex max-h-[min(720px,calc(100dvh-32px))] w-full max-w-[580px] flex-col overflow-hidden rounded-panel bg-white text-ink shadow-[0_30px_90px_rgba(0,16,55,.3)]"
            >
                <header className="flex shrink-0 items-start justify-between border-b border-line px-6 py-5 md:px-8 md:py-6">
                    <div>
                        <p className="m-0 text-[12px] font-extrabold tracking-[.12em] text-brand">PRIVACY POLICY</p>
                        <h2 id="privacy-modal-title" className="mb-0 mt-1 text-[22px] font-black md:text-[26px]">
                            개인정보 수집 및 이용 안내
                        </h2>
                    </div>
                    <button
                        type="button"
                        aria-label="개인정보 안내 닫기"
                        onClick={onClose}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-field text-muted transition-colors hover:bg-brand-pale hover:text-brand"
                    >
                        <Icon name="close" className="w-[18px]" />
                    </button>
                </header>

                <div className="admin-scroll min-h-0 flex-1 overflow-y-auto px-6 py-2 md:px-8">
                    <p className="mb-2 mt-5 text-sm leading-7 text-muted">
                        병원광고연구소는 무료진단 신청을 위해 필요한 최소한의 개인정보만 수집합니다.
                    </p>
                    {privacySections.map(([title, body]) => (
                        <div className="border-t border-line py-5" key={title}>
                            <h3 className="m-0 mb-2 text-[16px] font-extrabold">{title}</h3>
                            <p className="m-0 text-sm leading-7 text-muted">{body}</p>
                        </div>
                    ))}
                    <p className="mb-6 mt-1 text-[12px] text-muted">시행일자: {privacyEffectiveDate}</p>
                </div>

                <footer className="shrink-0 border-t border-line bg-white p-4 md:px-8 md:py-5">
                    <button type="button" onClick={onClose} className="btn-primary min-h-[52px] w-full">
                        확인했습니다
                    </button>
                </footer>
            </section>
        </div>,
        document.body,
    );
}
