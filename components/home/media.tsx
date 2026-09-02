import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/ui/reveal';
import { mediaItems } from '@/data';

export function Media() {
    return (
        <section className="bg-white py-section" id="media">
            <div className="site-container">
                <Reveal variant="heading">
                    <h2 className="section-title mb-10 text-center lg:mb-[78px] lg:text-h1">
                        우리 병원 환자가 움직이는 곳에
                        <br />
                        <em className="not-italic text-brand">맞는 광고를 찾습니다.</em>
                    </h2>
                </Reveal>
                {/* 시안: 카드 524×243 = 글 287 + 이미지 237, 두 칸 + 간격 50 = 1098 */}
                <div className="mx-auto grid max-w-[1098px] gap-4 lg:grid-cols-2 lg:gap-x-[50px] lg:gap-y-[40px]">
                    {mediaItems.map((item, index) => (
                        <Reveal
                            key={item.key}
                            className="media-card card-base grid overflow-hidden rounded-[28px] sm:grid-cols-[1fr_180px] lg:min-h-[244px] lg:grid-cols-[1fr_237px]"
                            delay={(index % 2) * 0.06}
                            variant="card"
                        >
                            <div className="order-2 p-7 sm:order-1 lg:p-[40px_40px_45px]">
                                <h3 className="m-0 mb-2 text-h5 font-black text-brand lg:mb-2">{item.title}</h3>
                                <p className="m-0 mb-6 max-w-[220px] whitespace-pre-line text-body font-bold tracking-tighter text-muted lg:max-w-[200px] lg:leading-[1.5]">
                                    {item.description}
                                </p>
                                <Link
                                    href={`/cases?type=${item.key}`}
                                    className="btn-outline"
                                    aria-label={`${item.title} 레퍼런스 보기`}
                                >
                                    대표 구성과 비용 확인
                                </Link>
                            </div>
                            <div className="media-visual order-1 grid place-items-center rounded-[28px] bg-brand-tint py-6 sm:order-2 sm:py-0">
                                <Image
                                    src={item.image}
                                    alt=""
                                    width={245}
                                    height={250}
                                    className="h-auto w-[52%] sm:w-[78%]"
                                />
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
