'use client';

import { useEffect, useState } from 'react';

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
            className={`fixed bottom-5 right-5 z-[80] grid h-12 w-12 place-items-center rounded-full border border-white/60 bg-brand text-white shadow-[0_12px_32px_rgba(36,104,240,.28)] transition-[opacity,transform,visibility,filter] duration-300 hover:brightness-105 sm:bottom-7 sm:right-7 md:h-14 md:w-14 xl:bottom-9 xl:right-9 xl:h-16 xl:w-16 ${
                visible && !hidden ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-3 opacity-0'
            }`}
        >
            <span className="grid justify-items-center gap-0.5">
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
