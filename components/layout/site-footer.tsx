import Image from 'next/image';
import Link from 'next/link';
import { DiagnosisButton } from '@/components/lead/diagnosis-button';
import { ContactEmail } from '@/components/layout/contact-email';

const businessInfo = [
    '상호 바이오애드랩',
    '사업자등록번호 216-86-02932',
    '서울특별시 강남구 학동로3길 27 2층 201호',
    '전화 02-2038-0088',
];

export function SiteFooter() {
    return (
        <footer className="border-t border-line bg-white py-12 sm:py-14 lg:py-[70px]">
            <div className="site-container">
                <div className="grid gap-8 border-b border-line pb-8 sm:grid-cols-[1fr_auto] sm:items-start lg:pb-10">
                    <div>
                        <Image
                            src="/images/logo-ori.svg"
                            alt="병원광고연구소"
                            width={161}
                            height={25}
                            unoptimized
                            className="h-[24px] w-auto sm:h-[26px]"
                        />
                        <p className="mb-0 mt-3 text-sm font-semibold text-slate">병원 광고를 더 쉽고, 더 투명하게.</p>
                    </div>
                    <nav
                        className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm font-bold sm:flex sm:items-center sm:justify-end sm:gap-6"
                        aria-label="푸터 메뉴"
                    >
                        <Link className="whitespace-nowrap" href="/privacy">
                            개인정보처리방침
                        </Link>
                        <DiagnosisButton className="col-span-2 w-fit whitespace-nowrap text-brand sm:col-auto">
                            문의하기
                        </DiagnosisButton>
                    </nav>
                </div>

                <div className="grid gap-7 pt-7 lg:grid-cols-[1fr_auto] lg:items-end lg:pt-9">
                    <div className="min-w-0">
                        <address className="m-0 grid gap-1.5 text-[13px] not-italic leading-[1.7] text-muted sm:flex sm:max-w-[900px] sm:flex-wrap sm:gap-x-2 sm:gap-y-1">
                            {businessInfo.map((item) => (
                                <span
                                    key={item}
                                    className="sm:after:ml-2 sm:after:content-['·'] last:sm:after:content-none"
                                >
                                    {item}
                                </span>
                            ))}
                        </address>
                        <ContactEmail fallback="medicaladlab@gmail.com" />
                    </div>
                    <small className="shrink-0 text-xs tracking-[.02em] text-muted sm:text-sm">
                        Copyright ⓒ bioadd lab. All Rights Reserved.
                    </small>
                </div>
            </div>
        </footer>
    );
}
