import { PolicyBody } from '@/components/legal/policy-body';
import { privacyConsentNote, privacyEffectiveDate, privacyIntro, privacySections } from '@/lib/privacy-policy';

export const metadata = {
    title: '개인정보 수집 및 이용 안내',
    description:
        '병원광고연구소가 무료진단과 광고 상담 과정에서 수집하는 개인정보의 항목, 이용 목적, 보유기간과 이용자의 권리를 안내합니다.',
    alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
    return (
        <main className="pb-section pt-[100px] lg:pt-[170px]">
            <div className="site-container max-w-[900px]">
                <p className="m-0 text-xs font-extrabold tracking-[.14em] text-brand">PRIVACY POLICY</p>
                <h1 className="mt-4 text-h1">개인정보 수집 및 이용 안내</h1>
                <div className="mb-10 mt-6 grid gap-3 lg:mb-14">
                    {privacyIntro.map((line) => (
                        <p className="m-0 text-sm leading-8 text-muted" key={line}>
                            {line}
                        </p>
                    ))}
                </div>
                {privacySections.map((section) => (
                    <section className="border-t border-line py-7" key={section.title}>
                        <h2 className="m-0 mb-4 text-h5">{section.title}</h2>
                        <PolicyBody blocks={section.blocks} />
                    </section>
                ))}
                <p className="mt-8 text-xs font-bold text-slate">시행일자: {privacyEffectiveDate}</p>
                <p className="mt-3 text-xs text-muted">{privacyConsentNote}</p>
            </div>
        </main>
    );
}
