'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { processItems } from '@/data';

export function Process() {
    const [played, setPlayed] = useState(false);
    const rootRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!rootRef.current || played) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setPlayed(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.25 },
        );
        observer.observe(rootRef.current);
        return () => observer.disconnect();
    }, [played]);

    return (
        <section ref={rootRef} className={`bg-white py-16 lg:py-20 ${played ? 'is-played' : ''}`} id="process">
            <div className="site-container">
                <div className="mb-10 text-center lg:mb-12">
                    <h2 className="section-title">
                        병원이 해야 할 일은
                        <em className="not-italic text-brand"> 신청뿐입니다.</em>
                    </h2>
                </div>
                <ol className="process-track relative mx-auto grid max-w-[1120px] list-none grid-cols-1 gap-8 p-0 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
                    {processItems.map(([number, title, description], index) => (
                        <li
                            key={number}
                            className="process-item relative grid grid-cols-[54px_1fr] items-start gap-x-4 text-left sm:grid-cols-1 sm:items-center sm:justify-items-center sm:text-center"
                            style={{ '--delay': `${index * 110}ms` } as React.CSSProperties}
                        >
                            <span className="process-node relative z-10 grid h-[51px] w-[54px] shrink-0 place-items-center bg-white text-white">
                                <Image
                                    src="/images/img-rounded.png"
                                    alt=""
                                    width={169}
                                    height={161}
                                    className="absolute inset-0 h-full w-full"
                                    sizes="54px"
                                />
                                <span className="relative z-10 text-sm font-bold">{number}</span>
                            </span>
                            <div className="pt-1 sm:pt-0">
                                <h3 className="m-0 text-[18px] font-extrabold sm:mt-4">{title}</h3>
                                <p className="mb-0 mt-1 text-sm text-muted sm:mt-1.5">{description}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
