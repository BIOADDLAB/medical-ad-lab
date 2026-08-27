import Image from 'next/image';
import { Reveal } from '@/components/ui/reveal';
import { whyOoh } from '@/data';

export function WhyOoh() {
    return (
        <section className="bg-white py-section">
            <div className="site-container">
                <Reveal variant="heading">
                    <h2 className="section-title mb-10 text-center lg:mb-[72px]">
                        같은 광고라도, 어디에 어떻게 쓰느냐에 따라
                        <br />
                        <em className="not-italic text-brand">결과는 완전히 달라집니다.</em>
                    </h2>
                </Reveal>
                <div className="mx-auto grid max-w-[1144px] gap-5 lg:gap-[52px]">
                    {whyOoh.map((item, index) => (
                        <Reveal
                            key={item.keyword}
                            className="story-row card-base grid items-center gap-6 p-6 text-center sm:p-7 lg:h-[336px] lg:grid-cols-[340px_352px] lg:justify-center lg:gap-8 lg:p-0 lg:text-left"
                            delay={0.05}
                            variant="card"
                        >
                            {/* 모바일은 전부 가운데 정렬. 좌우 분할은 lg 부터 */}
                            <div className={`story-copy lg:w-[340px] ${index % 2 ? 'lg:order-2' : 'lg:order-1'}`}>
                                <span className="inline-flex h-9 items-center rounded-full border border-brand px-5 text-xs font-black text-brand lg:h-10 lg:px-[22px] lg:text-[16px]">
                                    {item.number}&#160; &#160;{item.keyword}
                                </span>
                                <h3 className="mb-3 mt-5 whitespace-pre-line text-h4 font-extrabold lg:mb-3.5 lg:mt-6 lg:text-[24px]">
                                    {item.title}
                                </h3>
                                {/* 모바일에서는 시안 줄바꿈을 무시하고 화면 폭에 맞춰 흘린다 */}
                                <p className="m-0 mx-auto max-w-[320px] whitespace-pre-line text-body font-extrabold text-muted lg:mx-0 lg:max-w-[300px] ">
                                    {item.description}
                                </p>
                            </div>
                            <div
                                className={`grid h-[200px] w-full shrink-0 place-items-center sm:h-[240px] lg:w-[352px] ${
                                    index % 2 ? 'lg:order-1' : 'lg:order-2'
                                }`}
                            >
                                <Image
                                    className={`story-image h-auto w-full object-contain will-change-transform ${
                                        index === 2
                                            ? 'max-w-[224px] lg:max-w-[272px]'
                                            : 'max-w-[260px] lg:max-w-[352px]'
                                    }`}
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
