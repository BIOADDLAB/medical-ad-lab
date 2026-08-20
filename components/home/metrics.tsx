'use client';

import { useEffect, useRef } from 'react';
import { metrics } from '@/data';

/** 활성 숫자 크기 대비 장면 간격. 시안 1920 기준 107px × 1.35 ≒ 145px */
const STEP_RATIO = 1.35;
/** 좌우 장면 축소율. 시안 58 / 107 */
const INACTIVE_SCALE = 0.54;

export function Metrics() {
    const rootRef = useRef<HTMLElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cleanup = () => {};
        let cancelled = false;

        (async () => {
            const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
            if (cancelled || !rootRef.current || !stageRef.current) return;
            gsap.registerPlugin(ScrollTrigger);

            const root = rootRef.current;
            const stage = stageRef.current;
            const scenes = Array.from(stage.querySelectorAll<HTMLElement>('.metric-scene'));
            const labels = Array.from(stage.querySelectorAll<HTMLElement>('.metric-label'));

            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                root.classList.add('is-static');
                return;
            }

            // 모바일 주소창이 열고 닫힐 때 vh가 바뀌어 핀 구간이 다시 계산되면 장면이 되돌아간다
            ScrollTrigger.config({ ignoreMobileResize: true });

            // 간격은 글자 크기에 비례해야 화면 폭이 달라져도 시안 비율이 유지된다
            const step = () => parseFloat(getComputedStyle(scenes[0].querySelector('strong')!).fontSize) * STEP_RATIO;

            const context = gsap.context(() => {
                const paint = (position: number) => {
                    const gap = step();
                    scenes.forEach((scene, index) => {
                        const distance = index - position;
                        const abs = Math.abs(distance);
                        gsap.set(scene, {
                            y: distance * gap,
                            scale: 1 - (1 - INACTIVE_SCALE) * Math.min(abs, 1),
                            autoAlpha: abs <= 1 ? 1 : Math.max(0, 2 - abs),
                        });
                        scene.classList.toggle('is-active', abs < 0.5);
                    });
                    // 라벨은 가운데 장면에만 보인다
                    labels.forEach((label, index) =>
                        gsap.set(label, { autoAlpha: Math.max(0, 1 - Math.abs(index - position) * 2) }),
                    );
                };

                paint(0);

                // 고정은 CSS sticky 가 한다. ScrollTrigger 는 진행도만 준다.
                // GSAP pin 을 쓰면 핀이 풀린 뒤 섹션 아래쪽이 빈 화면으로 남는다
                const trigger = ScrollTrigger.create({
                    trigger: root,
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: 1,
                    invalidateOnRefresh: true,
                    onUpdate: (self) => paint(self.progress * (scenes.length - 1)),
                });
                cleanup = () => trigger.kill();
            }, root);
            const previousCleanup = cleanup;
            cleanup = () => {
                previousCleanup();
                context.revert();
            };
        })();

        return () => {
            cancelled = true;
            cleanup();
        };
    }, []);

    return (
        <section
            className="metrics-scroll relative h-[260svh] bg-night"
            ref={rootRef}
            aria-label="병원광고연구소 운영 데이터"
        >
            <div className="metrics-stage metrics-bg sticky top-0 h-svh w-full overflow-hidden" ref={stageRef}>
                <div
                    className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(2,6,15,.7),rgba(2,6,15,.36)_46%,transparent_74%)]"
                    aria-hidden
                />
                <div className="metric-stage-inner site-container relative z-[2] h-full">
                    <p className="metric-intro absolute inset-x-0 top-[20%] m-0 -translate-y-1/2 text-center text-h5 font-extrabold text-white lg:text-[37px]">
                        빠르게 비교하고 있는 <em className="not-italic text-mint">병원광고연구소</em>
                    </p>
                    <div className="metric-scenes absolute inset-0">
                        {metrics.map((metric) => (
                            <article
                                className="metric-scene absolute inset-0 grid place-items-center will-change-transform"
                                key={metric.label}
                            >
                                <span className="relative block text-center">
                                    <strong className="block text-[54px] font-extrabold leading-none tracking-[-.045em] text-white lg:text-[107px]">
                                        {metric.value !== null ? (
                                            <>
                                                {metric.value.toLocaleString('ko-KR')}
                                                {metric.suffix}
                                            </>
                                        ) : (
                                            metric.display
                                        )}
                                    </strong>
                                    <span className="metric-label absolute inset-x-0 top-full block whitespace-nowrap text-xs font-medium leading-[1.35] text-white/70 lg:text-[20px]">
                                        {metric.label}
                                    </span>
                                </span>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
