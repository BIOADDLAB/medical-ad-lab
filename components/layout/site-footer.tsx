import Image from 'next/image';
import Link from 'next/link';
import { DiagnosisButton } from '@/components/lead/diagnosis-button';
import { ContactEmail } from '@/components/layout/contact-email';

/** contactEmail: 관리자 설정의 대표 이메일(layout이 서버에서 읽어 넘김). 없으면 기본 주소 */
export function SiteFooter({ contactEmail = '' }: { contactEmail?: string }) {
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
                        <Link className="whitespace-nowrap" href="/company">
                            회사소개
                        </Link>
                        <Link className="whitespace-nowrap" href="/media">
                            광고자리 찾기
                        </Link>
                        <Link className="whitespace-nowrap" href="/cases">
                            병원광고 사례
                        </Link>
                        <Link className="whitespace-nowrap" href="/blog">
                            병원광고 가이드
                        </Link>
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
                        <ContactEmail email={contactEmail || 'medicaladlab@gmail.com'} />
                    </div>
                    <small className="shrink-0 text-xs tracking-[.02em] text-muted sm:text-sm">
                        Copyright ⓒ 병원광고연구소. All Rights Reserved.
                    </small>
                </div>
            </div>
        </footer>
    );
}
