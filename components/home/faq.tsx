'use client';

import { useState } from 'react';
import { faqs } from '@/data';

export function Faq() {
    const [open, setOpen] = useState<number | null>(null);
    return (
        <section className="bg-soft py-section">
            <div className="site-container max-w-[1000px]">
                <div className="mb-10 text-center lg:mb-[72px]">
                    <span className="section-title lg:text-[100px] font-black text-brand/15 not-italic ">FAQ</span>
                    <h2 className="section-title -m-5 lg:text-h1">
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
                                    className="flex w-full items-center justify-between gap-5 border-0 bg-transparent py-6 text-left lg:pt-[24px]"
                                >
                                    <span className="text-[16px] font-semibold lg:text-h5">{question}</span>
                                    <i className="text-[24px] font-bold not-italic text-[#0E182A]">
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
                                        className={`m-0 overflow-hidden text-sm text-muted ${expanded ? 'pb-6 lg:pb-[30px]' : ''}`}
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
