'use client';

import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

const copy = {
    journal: {
        label: 'MEDICAL AD LAB JOURNAL',
        title: (
            <>
                병원 광고를 연구하고,
                <br />
                직접 검증한 내용을 기록합니다.
            </>
        ),
        description: '현장에서 얻은 데이터와 판단 기준을 병원광고연구소가 직접 작성합니다.',
    },
    reference: {
        label: 'MEDICAL AD KNOWLEDGE',
        title: (
            <>
                병원 광고를 더 잘 판단할 수 있도록
                <br /> <em className="not-italic text-brand">직접 확인한 정보와 사례를 전합니다.</em>
            </>
        ),
        description: '실무 인사이트부터 실제 옥외광고 집행 사례까지 한곳에서 확인하세요.',
    },
} as const;

export function PageBanner({ variant }: { variant: keyof typeof copy }) {
    const root = useRef<HTMLElement>(null);
    const reduce = useReducedMotion();
    const [narrow, setNarrow] = useState(false);
    const { scrollYProgress } = useScroll({ target: root, offset: ['start start', 'end start'] });
    const artY = useTransform(scrollYProgress, [0, 1], [0, variant === 'journal' ? 54 : 34]);
    const content = copy[variant];
    const dark = variant === 'journal';

    // 모바일은 글 아래에 그림을 쌓는 구조라 패럴랙스가 들어가면 그림이 잘린다
    useEffect(() => {
        const query = window.matchMedia('(max-width: 767px)');
        const update = () => setNarrow(query.matches);
        update();
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);

    const still = reduce || narrow;

    return (
        <section
            ref={root}
            className={`page-banner relative overflow-hidden ${dark ? 'h-[460px] bg-deep text-white' : 'h-[380px] bg-[#f5f8fd] text-ink'}`}
            data-variant={variant}
        >
            <div className="page-banner-frame relative z-10 mx-auto h-full max-w-[1496px]">
                <motion.div
                    className="page-banner-copy absolute z-20"
                    initial={still ? false : { opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                >
                    <p
                        className={`m-0 text-[16px] font-extrabold tracking-[-.01em] ${dark ? 'text-brand-light-02' : 'text-brand'}`}
                    >
                        {content.label}
                    </p>
                    {/* 배너 슬로건은 제목이 아니다. 페이지 h1은 각 페이지 본문이 하나만 갖는다 */}
                    <p className="page-banner-title text-[32px] font-black leading-[1.42] tracking-[-.04em] sm:text-[38px] lg:text-[48px]">
                        {content.title}
                    </p>
                    <p
                        className={`page-banner-description text-sm font-semibold lg:text-[18px] ${dark ? 'text-white/58' : 'text-muted'}`}
                    >
                        {content.description}
                    </p>
                </motion.div>

                <motion.div
                    aria-hidden
                    className="page-banner-art pointer-events-none absolute z-0"
                    style={still ? undefined : { y: artY }}
                    initial={still ? false : { opacity: 0, x: 32, scale: 0.97 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ delay: 0.16, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                >
                    {variant === 'reference' ? (
                        <Image
                            src="/images/img-banner-01.png"
                            alt=""
                            width={912}
                            height={760}
                            priority
                            className="banner-art-primary h-auto w-full"
                        />
                    ) : (
                        <Image
                            src="/images/img-banner-02.png"
                            alt=""
                            width={650}
                            height={430}
                            priority
                            className="banner-art-primary h-auto w-full"
                        />
                    )}
                </motion.div>
            </div>
        </section>
    );
}
