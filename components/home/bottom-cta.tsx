import { DiagnosisButton } from '@/components/lead/diagnosis-button';

export function BottomCta() {
    return (
        <section className="bg-deep py-section text-center text-white">
            <div className="site-container">
                <p className="m-0 text-label font-black text-sm tracking-tight text-brand-light-02">BEFORE YOU SPEND</p>
                <h2 className="section-title mt-5 font-bold leading-[1.5] lg:mt-7 lg:text-h1">
                    광고비를 쓰기 전에,
                    <br />
                    <em className="not-italic font-black text-mint">우리 병원 주변부터 확인해보세요.</em>
                </h2>
                <p className="mx-auto mb-8 mt-5 text-sm font-bold text-[#B8C4D6] lg:mb-11 lg:mt-6 lg:text-[20px]">
                    받은 견적이 있다면 적정 가격을 확인하고, 없다면 맞는 광고부터 찾아드립니다.
                </p>
                <DiagnosisButton className="btn-primary mx-auto min-h-14 w-full max-w-[320px] px-5 text-[16px] sm:w-auto sm:min-w-[320px] lg:min-h-[64px] lg:max-w-none lg:px-10 lg:text-[18px]">
                    우리 병원 광고비 무료로 확인하기
                </DiagnosisButton>
            </div>
        </section>
    );
}
