'use client';

import { useEffect } from 'react';

/** 1차 구현 모션. lib/motion-config.ts에서 legacy로 바꾸면 다시 적용됩니다. */
export function LegacyHomeMotion() {
    useEffect(() => {
        let dispose = () => {};
        let cancelled = false;

        (async () => {
            const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
            if (cancelled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            gsap.registerPlugin(ScrollTrigger);

            const context = gsap.context(() => {
                gsap.timeline({ defaults: { ease: 'power3.out' } })
                    .fromTo(
                        '.hero-copy > *',
                        { y: 28, opacity: 0 },
                        { y: 0, opacity: 1, duration: 0.85, stagger: 0.07 },
                    )
                    .fromTo(
                        '.hero-form-column',
                        { y: 34, opacity: 0, scale: 0.985 },
                        { y: 0, opacity: 1, scale: 1, duration: 0.85 },
                        '-=0.62',
                    );

                gsap.to('.hero-bg', {
                    backgroundPosition: '52% 58%',
                    ease: 'none',
                    scrollTrigger: { trigger: '.hero-bg', start: 'top top', end: 'bottom top', scrub: 1.2 },
                });

                gsap.utils.toArray<HTMLElement>('.story-row').forEach((row) => {
                    const image = row.querySelector<HTMLElement>('.story-image');
                    if (!image) return;
                    gsap.fromTo(
                        image,
                        { y: 20 },
                        {
                            y: -20,
                            ease: 'none',
                            scrollTrigger: { trigger: row, start: 'top 88%', end: 'bottom 18%', scrub: 1 },
                        },
                    );
                });
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
