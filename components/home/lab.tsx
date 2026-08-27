import Image from 'next/image';
import { Reveal } from '@/components/ui/reveal';
import { whyLabItems } from '@/data';

export function Lab() {
    return (
        <section className="bg-soft py-section">
            <div className="site-container">
                <Reveal variant="heading">
                    <h2 className="section-title mb-10 text-center lg:mb-[72px] lg:text-h1">
                        옥외광고 회사는 많지만,
                        <br />
                        <em className="not-italic text-brand">병원의 입장에서 비교하는 곳은 드뭅니다.</em>
                    </h2>
                </Reveal>
                {/* 시안: 가운데를 기준으로 이미지와 글이 서로 안쪽으로 붙는다 */}
                <div className="mx-auto grid max-w-[800px] gap-12 lg:gap-y-[56px]">
                    {whyLabItems.map((item, index) => (
                        <Reveal
                            key={item.keyword}
                            className="lab-row grid items-center gap-6 text-center lg:grid-cols-[320px_360px] lg:justify-center lg:gap-x-[80px] lg:text-left"
                            delay={0.05}
                            variant="card"
                        >
                            <div
                                className={`justify-self-center ${
                                    index % 2 ? 'lg:order-2 lg:justify-self-start' : 'lg:order-1 lg:justify-self-end'
                                }`}
                            >
                                <Image
                                    src={item.image}
                                    alt=""
                                    width={608}
                                    height={608}
                                    className="lab-image h-auto w-[220px] will-change-transform lg:w-[320px]"
                                />
                            </div>
                            {/* 모바일은 전부 가운데. 좌우 엇갈림은 lg 부터 */}
                            <div
                                className={
                                    index % 2 ? 'lg:order-1 lg:justify-self-end' : 'lg:order-2 lg:justify-self-start'
                                }
                            >
                                <span className="inline-flex h-9 items-center rounded-full border border-brand px-5 text-xs font-black tracking-tight text-brand lg:h-[41px] lg:px-[22px] lg:text-[16px]">
                                    {item.number}&#160; &#160;{item.keyword}
                                </span>
                                <h3 className="mx-auto mb-3 mt-5 max-w-[360px] whitespace-pre-line text-h4 font-extrabold tracking-tight lg:mx-0 lg:mb-3.5 lg:mt-6 lg:text-[24px] lg:leading-[1.5]">
                                    {item.title}
                                </h3>
                                {/* 모바일에서는 시안 줄바꿈을 무시하고 화면 폭에 맞춰 흘린다 */}
                                <p
                                    className="m-0 mx-auto max-w-[330px] text-body leading-[1.6] text-muted lg:mx-0 lg:max-w-[310px] whitespace-pre-line lg:leading-[1.4]"
                                >
                                    {item.description}
                                </p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
