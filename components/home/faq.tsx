'use client';

import { useState } from 'react';
import { faqs } from '@/data';

export function Faq() {
    const [open, setOpen] = useState<number | null>(null);
    return (
        <section className="bg-soft py-section">
            <div className="site-container max-w-[1000px]">
                {/* 워터마크는 제목 위에 두고 제목이 그 아래에 살짝 걸치게 한다. 겹치는 양은 글자 크기에 비례해야 한다 */}
                <div className="relative mb-10 text-center lg:mb-[72px]">
                    <span
                        aria-hidden
                        className="pointer-events-none block select-none text-[56px] font-black not-italic leading-[0.8] text-brand/10 lg:text-[100px]"
                    >
                        FAQ
                    </span>
                    <h2 className="section-title relative -mt-3 lg:-mt-6 lg:text-h1">
                        <em className="not-italic font-bold">신청 전, </em>
                        많이 물어보시는 질문
                    </h2>
                </div>
                <div className="rounded-card bg-white px-5 py-2 shadow-[0_10px_30px_rgba(21,49,94,.04)] lg:px-18 lg:py-8">
                    {faqs.map(([question, answer], index) => {
                        const expanded = open === index;
                        return (
                            <div
                                className={`faq-item border-line [&+&]:border-t ${expanded ? 'is-open' : ''}`}
                                key={question}
                            >
                                <button
                                    type="button"
                                    aria-expanded={expanded}
                                    aria-controls={`faq-panel-${index}`}
                                    onClick={() => setOpen(expanded ? null : index)}
                                    className="flex w-full items-center justify-between gap-4 border-0 bg-transparent py-5 text-left lg:gap-5 lg:py-6 lg:pt-[24px]"
                                >
                                    <span className="text-[17px] font-bold leading-[1.45] lg:text-h5">{question}</span>
                                    <i className="shrink-0 text-[24px] font-bold not-italic text-[#0E182A]">
                                        {expanded ? '−' : '+'}
                                    </i>
                                </button>
                                <div
                                    id={`faq-panel-${index}`}
                                    className="faq-panel"
                                    role="region"
                                    aria-hidden={!expanded}
                                >
                                    <p
                                        className={`m-0 overflow-hidden text-sm leading-[1.65] text-muted ${expanded ? 'pb-5 lg:pb-[30px]' : ''}`}
                                    >
                                        {answer}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
