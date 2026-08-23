'use client';

import { useEffect, useRef } from 'react';
import { LeadForm } from '@/components/lead/lead-form';

const badges = ['견적 없어도 신청 가능', '계약 의무 없음', '24시간 내 1차 안내'];

export function Hero() {
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const focusForm = () => {
            const card = cardRef.current;
            if (!card) return;
            const focusFirstInput = () =>
                card.querySelector<HTMLInputElement>("input[name='hospital']")?.focus({ preventScroll: true });
            const hasScrollEnd = 'onscrollend' in window;
            card.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // 스크롤이 끝난 뒤 포커스해야 모바일 키보드가 스크롤을 가로채지 않는다
            if (hasScrollEnd) window.addEventListener('scrollend', focusFirstInput, { once: true });
            else window.setTimeout(focusFirstInput, 500);
        };
        window.addEventListener('main-form-open', focusForm);
        return () => window.removeEventListener('main-form-open', focusForm);
    }, []);

    return (
        <section
            className="hero-bg relative overflow-hidden pb-16 pt-[100px] text-white md:pb-24 md:pt-32 lg:flex lg:min-h-svh lg:items-center lg:py-[clamp(108px,10vh,150px)]"
            id="apply"
        >
            <div className="site-container grid items-center gap-11 lg:grid-cols-[minmax(0,1fr)_minmax(420px,500px)] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_580px] xl:gap-20">
                <div className="hero-copy md:max-w-[720px]">
                    <p className="hero-eyebrow m-0 mb-10 text-sm font-extrabold text-mint xl:mb-0 xl:text-[24px]">
                        병원 옥외광고 견적, 무료로 비교해드립니다
                    </p>
                    <h1 className="mt-0 text-display font-black xl:mt-10">
                        <span className="block overflow-hidden">
                            <span className="hero-title-line block">원장님, 그 옥외광고 견적</span>
                        </span>
                        <span className="block overflow-hidden">
                            <em className="hero-title-line block not-italic text-mint">적정한 가격인지</em>
                        </span>
                        <span className="block overflow-hidden">
                            <span className="hero-title-line block">확인해보셨나요?</span>
                        </span>
                    </h1>
                    <p className="hero-support mt-6 text-lead font-semibold text-white/90 xl:mt-[38px]">
                        업체마다 다른 매체비부터 제작·설치·의료광고 심의 비용까지.
                        <br />
                        병원 옥외광고 전문팀이 같은 조건으로 비교해드립니다.
                    </p>
                    <div className="mt-7 flex flex-wrap gap-2.5 xl:mt-[52px] xl:gap-4">
                        {badges.map((text) => (
                            <span
                                key={text}
                                className="hero-badge glass-pill inline-flex min-h-11 items-center rounded-full px-[18px] text-xs font-extrabold xl:min-h-[54px] xl:px-[26px] xl:text-[18px]"
                            >
                                {text}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="hero-form-column mx-auto w-full max-w-[680px] lg:max-w-none">
                    <div
                        ref={cardRef}
                        className="scroll-mt-[76px] rounded-panel bg-white p-7 text-ink shadow-[0_30px_80px_rgba(0,16,55,.22)] md:p-10 lg:p-8 xl:scroll-mt-[104px] xl:p-[46px]"
                    >
                        <h2 className="m-0 text-h4 font-black tracking-tighter text-brand xl:text-[36px] xl:leading-[1.3]">
                            우리 병원 광고 무료진단
                        </h2>
                        <p className="mb-7.5  font-extrabold text-sm text-muted">
                            간단한 정보를 남겨주시면 24시간 이내 안내드립니다.
                        </p>
                        <LeadForm />
                    </div>
                </div>
            </div>
        </section>
    );
}
