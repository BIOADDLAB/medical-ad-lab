'use client';

import { useEffect, useRef } from 'react';
import { Icon } from '@/components/ui/icon';
import { LeadForm } from '@/components/lead/lead-form';

type Props = {
    open: boolean;
    dirty: boolean;
    onClose: () => void;
    onDirty: () => void;
};

export function DiagnosisModal({ open, dirty, onClose, onDirty }: Props) {
    const dialogRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!open || !dialogRef.current) return;
        const dialog = dialogRef.current;
        const focusable = () =>
            Array.from(
                dialog.querySelectorAll<HTMLElement>(
                    "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
                ),
            );
        focusable()[0]?.focus();

        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
            if (event.key !== 'Tab') return;
            const items = focusable();
            const first = items[0];
            const last = items.at(-1);
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last?.focus();
            }
            if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first?.focus();
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open, onClose]);

    return (
        <div
            aria-hidden={!open}
            onMouseDown={(event) => {
                if (event.currentTarget === event.target && !dirty) onClose();
            }}
            className={`fixed inset-0 z-[200] transition-opacity duration-200 lg:grid lg:place-items-center lg:bg-deep/60 lg:p-6 lg:backdrop-blur-[4px] ${
                open ? 'visible opacity-100' : 'invisible opacity-0'
            }`}
        >
            <section
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="diagnosis-title"
                className="relative flex h-full w-full flex-col bg-white lg:h-auto lg:max-h-[92vh] lg:w-[560px] lg:rounded-panel"
            >
                <div className="flex items-center justify-between border-b border-line px-gutter py-4 lg:hidden">
                    <strong className="text-[17px] font-extrabold">무료진단</strong>
                    <button
                        type="button"
                        aria-label="무료진단 창 닫기"
                        onClick={onClose}
                        className="grid h-9 w-9 place-items-center rounded-lg bg-field text-muted"
                    >
                        <Icon name="close" className="w-[18px]" />
                    </button>
                </div>
                <button
                    type="button"
                    aria-label="무료진단 창 닫기"
                    onClick={onClose}
                    className="absolute right-6 top-6 hidden h-9 w-9 place-items-center rounded-full bg-field text-muted lg:grid"
                >
                    <Icon name="close" className="w-[18px]" />
                </button>
                <div className="flex-1 overflow-y-auto px-gutter py-7 lg:px-11 lg:py-11">
                    <h2 id="diagnosis-title" className="m-0 text-h4 lg:text-brand">
                        우리 병원 광고 무료진단
                    </h2>
                    <p className="mb-7 mt-3 text-sm text-muted">24시간 이내 안내드립니다.</p>
                    <LeadForm compact onDirty={onDirty} />
                </div>
            </section>
        </div>
    );
}
