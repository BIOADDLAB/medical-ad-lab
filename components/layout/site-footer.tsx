import Link from 'next/link';
import { DiagnosisButton } from '@/components/lead/diagnosis-button';
import { ContactEmail } from '@/components/layout/contact-email';

/** 임시값: 실제 사업자등록증·회사 연락처 확인 후 교체 */
const businessInfo = [
    '상호명 바이오애드랩',
    '대표자 추후 입력',
    '사업자등록번호 000-00-00000',
    '서울특별시 강남구 테헤란로 000',
    '대표전화 02-0000-0000',
];

export function SiteFooter() {
    return (
        <footer className="border-t border-line bg-white py-14 lg:py-[70px]">
            <div className="site-container">
                <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-start lg:gap-10">
                    <div>
                        <strong className="block text-[16px] font-extrabold">병원광고연구소</strong>
                        <p className="mb-0 mt-2.5 text-sm">병원 광고를 더 쉽고, 더 투명하게.</p>
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
                        <ContactEmail />
                    </div>
                    <small className="shrink-0 text-sm tracking-[.02em] text-muted">© 2026 MEDICAL AD LAB</small>
                </div>
            </div>
        </footer>
    );
}
