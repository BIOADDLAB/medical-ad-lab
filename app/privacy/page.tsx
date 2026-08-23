import { privacyEffectiveDate, privacySections } from '@/lib/privacy-policy';

export const metadata = {
    title: '개인정보처리방침',
    alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
    return (
        <main className="pb-section pt-[100px] lg:pt-[170px]">
            <div className="site-container max-w-[900px]">
                <p className="m-0 text-xs font-extrabold tracking-[.14em] text-brand">PRIVACY POLICY</p>
                <h1 className="mt-4 text-h1">개인정보처리방침</h1>
                <p className="mb-10 mt-4 text-sm text-muted lg:mb-14">
                    병원광고연구소는 무료진단 신청을 위해 필요한 최소한의 개인정보만 수집합니다.
                </p>
                {privacySections.map(([title, body]) => (
                    <section className="border-t border-line py-7" key={title}>
                        <h2 className="m-0 mb-3 text-h5">{title}</h2>
                        <p className="m-0 text-sm text-muted">{body}</p>
                    </section>
                ))}
                <p className="mt-8 text-xs text-muted">시행일자: {privacyEffectiveDate}</p>
            </div>
        </main>
    );
}
