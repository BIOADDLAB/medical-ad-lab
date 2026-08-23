'use client';

import { useEffect, useState } from 'react';
import { SCROLL_TOP_VARIANT } from '@/lib/ui-config';

const variantClass = {
    1: 'h-12 w-12 rounded-full border-white/60 bg-brand text-white shadow-[0_12px_32px_rgba(36,104,240,.28)] md:h-14 md:w-14 xl:h-16 xl:w-16',
    2: 'h-12 w-[84px] rounded-full border-brand/15 bg-brand text-white shadow-[0_12px_32px_rgba(36,104,240,.24)] md:h-14 md:w-[98px] xl:h-16 xl:w-[116px]',
    3: 'h-12 w-12 rounded-[15px] border-white/10 bg-deep text-white shadow-[0_12px_32px_rgba(7,17,37,.26)] md:h-14 md:w-14 xl:h-16 xl:w-16 xl:rounded-[19px]',
    4: 'h-12 w-12 rounded-full border-white/45 bg-deep/65 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.4),0_14px_34px_rgba(7,17,37,.2)] backdrop-blur-xl md:h-14 md:w-14 xl:h-16 xl:w-16',
    5: 'h-12 w-12 rounded-full border-line-strong bg-white/92 text-ink shadow-[0_10px_28px_rgba(14,24,42,.1)] backdrop-blur-md md:h-14 md:w-14 xl:h-16 xl:w-16',
} as const;

export function ScrollTopButton({ hidden = false }: { hidden?: boolean }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const update = () => setVisible(window.scrollY > 600);
        update();
        window.addEventListener('scroll', update, { passive: true });
        return () => window.removeEventListener('scroll', update);
    }, []);

    return (
        <button
            type="button"
            aria-label="페이지 상단으로 이동"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`fixed bottom-5 right-5 z-[80] grid place-items-center border transition-[opacity,transform,visibility,filter] duration-300 hover:brightness-105 sm:bottom-7 sm:right-7 xl:bottom-9 xl:right-9 ${variantClass[SCROLL_TOP_VARIANT]} ${
                visible && !hidden ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-3 opacity-0'
            }`}
        >
            <span className={SCROLL_TOP_VARIANT === 2 ? 'flex items-center gap-2' : 'grid justify-items-center gap-0.5'}>
                <svg
                    aria-hidden
                    viewBox="0 0 20 20"
                    className="h-3.5 w-3.5 fill-none stroke-current stroke-[1.8] md:h-4 md:w-4 xl:h-[18px] xl:w-[18px]"
                >
                    <path d="m5 11 5-5 5 5" />
                    <path d="M10 6v9" />
                </svg>
                <span className="text-[8px] font-black tracking-[.08em] md:text-[9px] xl:text-[10px]">TOP</span>
            </span>
        </button>
    );
}
