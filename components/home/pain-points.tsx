import { Reveal } from '@/components/ui/reveal';
import { painPoints } from '@/data';

export function PainPoints() {
    return (
        <section className="bg-soft py-section" id="service">
            <Reveal className="site-container ">
                <h2 className="text-h1 font-black section-title mb-10 text-center lg:mb-[72px]">
                    지금 이런 고민을 하고 계신가요?
                </h2>
                <div className="grid gap-4 lg:grid-cols-3 lg:gap-7">
                    {painPoints.map((item, index) => (
                        <Reveal
                            key={item.title}
                            className="rounded-card border border-[#DCE4EE] bg-white p-8 shadow-[0_10px_30px_rgba(21,49,94,.04)] lg:p-[44px_40px_46px]"
                            delay={index * 0.07}
                        >
                            <span className="mb-5 grid h-9 w-9 place-items-center rounded-full bg-brand-pale text-body font-extrabold text-brand lg:mb-[18px]">
                                {item.number}
                            </span>
                            <h3 className="m-0 mb-3.25  whitespace-pre-line text-h4">{item.title}</h3>
                            <p className="m-0 whitespace-pre-line text-body font-bold wrap-break-word text-muted">
                                {item.description}
                            </p>
                        </Reveal>
                    ))}
                </div>
            </Reveal>
        </section>
    );
}
