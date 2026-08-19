import Image from 'next/image';
import { Reveal } from '@/components/ui/reveal';
import { whyOoh } from '@/data';

const IMAGE_WIDTH = [320, 400, 390];

export function WhyOoh() {
    return (
        <section className="bg-white py-section">
            <div className="site-container">
                <Reveal>
                    <h2 className="section-title mb-10 text-center lg:mb-[72px]">
                        같은 광고라도, 어디에 어떻게 쓰느냐에 따라
                        <br />
                        <em className="not-italic text-brand">결과는 완전히 달라집니다.</em>
                    </h2>
                </Reveal>
                <div className="mx-auto grid max-w-[1120px] gap-5 lg:gap-[60px]">
                    {whyOoh.map((item, index) => (
                        <Reveal
                            key={item.keyword}
                            className={`story-row card-base flex flex-col items-center gap-7 p-7 lg:min-h-[335px] lg:flex-row lg:justify-between lg:gap-[40px] lg:p-[20px_204px] ${index % 2 ? 'lg:flex-row-reverse' : ''}`}
                            delay={0.05}
                        >
                            <div className="lg:max-w-[340px]">
                                <span className="inline-flex h-9 items-center rounded-full border border-brand px-5 text-xs font-black text-brand lg:h-10 lg:px-[22px] lg:text-[16px]">
                                    {item.number}&#160; &#160;{item.keyword}
                                </span>
                                <h3 className="mb-3 mt-5 whitespace-pre-line text-h4 font-extrabold lg:mt-[25px] lg:mb-3.5 lg:text-[23px]">
                                    {item.title}
                                </h3>
                                <p className="m-0 max-w-[300px] whitespace-pre-line text-body font-extrabold text-muted">
                                    {item.description}
                                </p>
                            </div>
                            <div className="grid shrink-0 place-items-center">
                                <Image
                                    className="story-image h-auto w-full max-w-[260px] object-contain will-change-transform lg:w-(--w) lg:max-w-none"
                                    style={{ '--w': `${IMAGE_WIDTH[index]}px` } as React.CSSProperties}
                                    src={item.image}
                                    alt=""
                                    width={724}
                                    height={530}
                                />
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
