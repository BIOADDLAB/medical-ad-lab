'use client';

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
        <section ref={rootRef} className={`bg-white py-section ${played ? 'is-played' : ''}`} id="process">
            <div className="site-container">
                <div className="mb-12 text-center lg:mb-[72px]">
                    <h2 className="section-title lg:text-h1">
                        병원이 해야 할 일은
                        <em className="not-italic text-brand"> 신청뿐입니다.</em>
                    </h2>
                </div>
                <ol className="relative m-0 grid list-none grid-cols-1 gap-10 p-0 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0 lg:before:absolute lg:before:inset-x-[10%] lg:before:top-9 lg:before:h-px lg:before:bg-line lg:before:content-['']">
                    {processItems.map(([number, title, description], index) => (
                        <li
                            key={number}
                            className="process-item relative grid justify-items-center text-center"
                            style={{ '--delay': `${index * 110}ms` } as React.CSSProperties}
                        >
                            <span className="grid h-[60px] w-[60px] place-items-center rounded-full bg-brand text-sm font-extrabold text-white lg:h-[75px] lg:w-[89px] lg:text-[16px]">
                                <span className="text-h5 font-bold">{number}</span>
                            </span>
                            <h3 className="mt-5 text-h5 font-extrabold lg:mt-7 lg:text-[32px]">{title}</h3>
                            <p className="mt-2.5 text-body text-muted lg:mt-px">{description}</p>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
