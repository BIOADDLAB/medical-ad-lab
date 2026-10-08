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
                <section className="border-t border-line py-7">
                    <h2 className="m-0 mb-4 text-h5">방문 통계 수집 안내</h2>
                    <p className="text-sm leading-8 text-muted">
                        웹사이트 유입 분석과 서비스 개선을 위해 익명 방문자 ID, 방문 시각, 유입 출처, 전달된 검색어,
                        조회 페이지와 IP 기준으로 추정한 국가·지역·도시 정보를 기록합니다. 문의를 제출하면 해당 방문
                        기록과 문의정보가 연결됩니다.
                    </p>
                    <p className="text-sm leading-8 text-muted">
                        실제 IP 주소와 GPS 좌표는 방문 기록에 저장하지 않습니다. 추정 위치는 VPN이나 통신망에 따라 실제
                        위치와 다를 수 있습니다. 방문자 구분에 사용하는 브라우저 저장정보는 최대 90일 동안 유지되며,
                        브라우저가 추적 금지(DNT)를 요청하면 방문 기록 수집을 생략합니다.
                    </p>
                </section>
                <p className="mt-8 text-xs font-bold text-slate">시행일자: {privacyEffectiveDate}</p>
                <p className="mt-3 text-xs text-muted">{privacyConsentNote}</p>
            </div>
        </main>
    );
}
