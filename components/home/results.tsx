import Image from 'next/image';
import { Reveal } from '@/components/ui/reveal';
import { resultCards } from '@/data';

export function Results() {
    return (
        <section className="results-bg py-section text-white" id="diagnosis">
            <div className="site-container">
                <Reveal variant="heading">
                    <h2 className="section-title mb-10 text-center lg:mb-[80px] lg:text-h1">
                        상담이 아니라, 직접 검토할 수 있는
                        <br />
                        <em className="not-italic text-mint">결과물을 보내드립니다.</em>
                    </h2>
                </Reveal>
                <div className="mx-auto grid max-w-[830px] gap-5 sm:grid-cols-2 lg:gap-10">
                    {resultCards.map((card, index) => (
                        <Reveal
                            key={card.number}
                            className="result-card glass-pill flex flex-col rounded-panel p-7 text-white shadow-[0_26px_60px_rgba(4,16,41,.22)] lg:p-[64px_36px_50px]"
                            delay={index * 0.08}
                            variant="card"
                        >
                            <h3 className="mb-7 mt-3 text-center text-h4 lg:mb-[30px] lg:text-[30px]">{card.title}</h3>
                            <div className="mb-7.5 grid place-items-center rounded-2xl  lg:mb-10.5">
                                <Image
                                    src={card.image}
                                    alt=""
                                    width={246}
                                    height={246}
                                    className="h-auto w-full max-w-[190px]"
                                />
                            </div>
                            <ul
                                className={`m-0 mt-auto grid list-none gap-2 p-0 lg:gap-x-6 ${card.tags.length > 2 ? 'grid-cols-2 text-center' : ''}`}
                            >
                                {card.tags.map((tag) => (
                                    <li
                                        key={tag}
                                        className="text-h4 font-bold text-white flex items-center justify-center gap-4"
                                    >
                                        <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                            <Image
                                                src="/images/i-check.svg"
                                                alt=""
                                                width={24}
                                                height={24}
                                                className="h-auto w-full max-w-[16px]"
                                            />
                                        </span>
                                        {tag}
                                    </li>
                                ))}
                            </ul>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
