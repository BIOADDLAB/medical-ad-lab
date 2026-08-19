import Link from 'next/link';
import { DiagnosisButton } from '@/components/lead/diagnosis-button';

/** 도메인·사업자 정보 확정 전 자리값 */
const businessInfo = ['사업자 정보', '주소', '연락처 영역'];

export function SiteFooter() {
    return (
        <footer className="border-t border-line bg-white py-14 lg:py-[70px]">
            <div className="site-container flex flex-col justify-between gap-9 lg:flex-row lg:items-start lg:gap-10">
                <div>
                    <strong className="block text-[16px] font-extrabold">병원광고연구소</strong>
                    <p className="mb-5 mt-2.5 text-sm text-subtle lg:mb-[46px]">병원 광고를 더 쉽고, 더 투명하게.</p>
                    <small className="text-sm text-subtle">{businessInfo.join(' · ')}</small>
                </div>
                <div className="grid gap-6 lg:justify-items-end lg:gap-[46px]">
                    <div className="flex gap-5 text-sm font-bold">
                        <Link href="/about">회사소개</Link>
                        <Link href="/privacy">개인정보처리방침</Link>
                        <DiagnosisButton>문의하기</DiagnosisButton>
                    </div>
                    <small className="text-sm tracking-[.02em] text-subtle">© 2026 MEDICAL AD LAB</small>
                </div>
            </div>
        </footer>
    );
}
