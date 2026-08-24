import Image from 'next/image';
import Link from 'next/link';
import { DiagnosisButton } from '@/components/lead/diagnosis-button';
import { ContactEmail } from '@/components/layout/contact-email';

/** 병원광고연구소는 바이오애드랩(주)의 브랜드다. 사업자정보는 모회사 기준으로 표기한다 */
const businessInfo = [
    '상호 바이오애드랩(주)',
    '대표자 전해성',
    '사업자등록번호 216-86-02932',
    '서울특별시 강남구 학동로3길 27 2층 201호',
    '전화 02-2038-0088',
];

export function SiteFooter() {
    return (
        <footer className="border-t border-line bg-white py-14 lg:py-[70px]">
            <div className="site-container">
                <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-start lg:gap-10">
                    <div>
                        <Image
                            src="/images/logo-ori.svg"
                            alt="병원광고연구소"
                            width={161}
                            height={25}
                            unoptimized
                            className="h-[30px] w-auto"
                        />
                        <p className="mb-0 mt-3 text-sm">병원 광고를 더 쉽고, 더 투명하게.</p>
                    </div>
                    <div className="flex gap-5 text-sm font-bold">
                        <Link href="/about">회사소개</Link>
                        <Link href="/privacy">개인정보처리방침</Link>
                        <DiagnosisButton>문의하기</DiagnosisButton>
                    </div>
                </div>

                <div className="mt-9 flex flex-col gap-5 border-t border-line pt-6 lg:mt-11 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <small className="block max-w-[760px] text-sm leading-[1.9] text-muted">
                            {businessInfo.slice(0, 3).join(' · ')}
                            <br />
                            {businessInfo.slice(3).join(' · ')}
                        </small>
                        <ContactEmail fallback="medicaladlab@gmail.com" />
                    </div>
                    <small className="shrink-0 text-sm tracking-[.02em] text-muted">
                        Copyright ⓒ bioadd lab. All Rights Reserved.
                    </small>
                </div>
            </div>
        </footer>
    );
}
