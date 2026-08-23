'use client';

import { useEffect } from 'react';

/** 절제된 방향성·마스크·시차만 사용한 2차 모션 */
export function HomeMotion() {
    useEffect(() => {
        let dispose = () => {};
        let cancelled = false;

        (async () => {
            const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
            if (cancelled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            gsap.registerPlugin(ScrollTrigger);

            const context = gsap.context(() => {
                const heroTimeline = gsap.timeline({ defaults: { ease: 'power4.out' } });

                heroTimeline
                    .fromTo('.hero-eyebrow', { x: -18, opacity: 0 }, { x: 0, opacity: 1, duration: 0.65 })
                    .fromTo(
                        '.hero-title-line',
                        { yPercent: 108 },
                        { yPercent: 0, duration: 0.9, stagger: 0.1 },
                        '-=0.38',
                    )
                    .fromTo('.hero-support', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.52')
                    .fromTo(
                        '.hero-badge',
                        { x: -12, opacity: 0 },
                        { x: 0, opacity: 1, duration: 0.55, stagger: 0.08 },
                        '-=0.42',
                    )
                    .fromTo(
                        '.hero-form-column',
                        { x: 34, opacity: 0, scale: 0.99 },
                        { x: 0, opacity: 1, scale: 1, duration: 0.9 },
                        '-=0.88',
                    );

                // cover 크기는 CSS에 맡긴다. backgroundSize를 px/%로 덮어쓰면
                // 세로가 긴 브라우저에서 이미지 아래 배경색이 띠처럼 노출된다.
                if (window.matchMedia('(min-width: 1280px)').matches) {
                    gsap.fromTo(
                        '.hero-bg',
                        { backgroundPosition: '50% 48%' },
                        {
                            backgroundPosition: '52% 56%',
                            ease: 'none',
                            scrollTrigger: { trigger: '.hero-bg', start: 'top top', end: 'bottom top', scrub: 1.4 },
                        },
                    );
                }

                gsap.utils.toArray<HTMLElement>('.story-row').forEach((row, index) => {
                    const image = row.querySelector<HTMLElement>('.story-image');
                    const copy = row.querySelector<HTMLElement>('.story-copy');
                    if (!image || !copy) return;

                    const direction = index % 2 === 0 ? 1 : -1;
                    gsap.fromTo(
                        copy,
                        { x: -18 * direction, opacity: 0 },
                        {
                            x: 0,
                            opacity: 1,
                            duration: 0.72,
                            ease: 'power3.out',
                            scrollTrigger: { trigger: row, start: 'top 78%', once: true },
                        },
                    );
                    gsap.fromTo(
                        image,
                        { x: 18 * direction, y: 14, scale: 0.96, opacity: 0 },
                        {
                            x: 0,
                            y: -14,
                            scale: 1,
                            opacity: 1,
                            ease: 'none',
                            scrollTrigger: { trigger: row, start: 'top 86%', end: 'bottom 24%', scrub: 0.8 },
                        },
                    );
                });

                gsap.utils.toArray<HTMLElement>('.lab-row').forEach((row, index) => {
                    const image = row.querySelector<HTMLElement>('.lab-image');
                    if (!image) return;
                    gsap.fromTo(
                        image,
                        { y: 22, rotate: index % 2 ? 2 : -2 },
                        {
                            y: -12,
                            rotate: 0,
                            ease: 'none',
                            scrollTrigger: { trigger: row, start: 'top 90%', end: 'bottom 28%', scrub: 1 },
                        },
                    );
                });

                const pageBanner = document.querySelector<HTMLElement>('.page-banner');
                const bannerArt = document.querySelector<HTMLElement>('.banner-art-primary');

                if (pageBanner && bannerArt) {
                    gsap.to(bannerArt, {
                        yPercent: 5,
                        rotate: 1.2,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: pageBanner,
                            start: 'top top',
                            end: 'bottom top',
                            scrub: 1,
                        },
                    });
                }
            });
            dispose = () => context.revert();
        })();

        return () => {
            cancelled = true;
            dispose();
        };
    }, []);

    return null;
}
