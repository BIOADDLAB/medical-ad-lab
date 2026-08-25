'use client';

import { useEffect, useRef } from 'react';
import { LeadForm } from '@/components/lead/lead-form';

/**
 * 세 칩에 글래스 세 가지를 하나씩 넣었다. 보고 마음에 드는 하나를 골라
 * 아래 style 값을 셋 다 같은 이름으로 바꾸면 된다.
 * recreated — 시안 값을 그대로 옮긴 것
 * pure     — 깨끗한 반투명 유리
 * sunset   — 노을빛 그라데이션 유리
 * floating — 떠 있는 듯한 입체 유리
 */
const badges = [
    { text: '견적 없어도 신청 가능', style: 'glass-recreated' },
    { text: '계약 의무 없음', style: 'glass-recreated' },
    { text: '24시간 내 1차 안내', style: 'glass-recreated' },
] as const;

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
            className="hero-bg relative overflow-hidden pb-16 pt-[104px] text-white md:pb-28 md:pt-[136px] xl:flex xl:min-h-svh xl:items-center xl:py-[clamp(112px,10vh,150px)]"
            id="apply"
        >
            <div className="hero-inner site-container grid items-center gap-12 md:gap-14 xl:grid-cols-[minmax(0,1fr)_minmax(460px,520px)] xl:gap-12 2xl:grid-cols-[minmax(0,1fr)_580px] 2xl:gap-20">
                <div className="hero-copy max-w-[760px]">
                    <p className="hero-eyebrow m-0 mb-8 text-sm font-extrabold text-mint md:mb-10 xl:mb-0 xl:text-[18px] 2xl:text-[24px]">
                        병원 옥외광고 견적, 무료로 비교해드립니다
                    </p>
                    <h1 className="mt-0 text-display font-black xl:mt-8 2xl:mt-10">
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
                    <p className="hero-support mt-6 text-lead font-semibold text-white/90 xl:mt-8 2xl:mt-[38px]">
                        업체마다 다른 매체비부터 제작·설치·의료광고 심의 비용까지.
                        <br />
                        병원 옥외광고 전문팀이 같은 조건으로 비교해드립니다.
                    </p>
                    <div className="mt-7 flex flex-wrap gap-2.5 xl:mt-10 xl:gap-3 2xl:mt-[52px] 2xl:gap-4">
                        {badges.map((badge) => (
                            <span
                                key={badge.text}
                                className={`hero-badge ${badge.style} inline-flex min-h-11 items-center justify-center rounded-full px-[18px] text-xs font-extrabold whitespace-nowrap xl:min-h-12 xl:w-[174px] xl:px-4 xl:text-[14px] 2xl:min-h-[54px] 2xl:w-[191px] 2xl:px-4 2xl:text-[18px]`}
                            >
                                <span className="figma-glass-pill-text">{badge.text}</span>
                            </span>
                        ))}
                    </div>
                </div>

                <div className="hero-form-column mx-auto w-full max-w-[720px] xl:max-w-none">
                    <div
                        ref={cardRef}
                        className="scroll-mt-[76px] rounded-panel bg-white p-7 text-ink shadow-[0_30px_80px_rgba(0,16,55,.22)] md:p-10 xl:scroll-mt-[104px] xl:p-9 2xl:p-[46px]"
                    >
                        <h2 className="m-0 text-h4 font-black tracking-tighter text-brand xl:text-[30px] xl:leading-[1.3] 2xl:text-[36px]">
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
