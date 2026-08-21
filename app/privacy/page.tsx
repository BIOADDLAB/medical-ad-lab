const sections = [
    ['1. 수집하는 개인정보 항목', '병원명, 지역, 휴대폰 번호, 이메일 주소'],
    ['2. 개인정보 수집 및 이용 목적', '무료진단 신청 확인, 옥외광고 상담, 진단 결과 및 실무자료 발송'],
    [
        '3. 보유 및 이용 기간',
        '상담 종료 후 1년 또는 이용자의 삭제 요청 시까지 보관합니다. 관계 법령에 따라 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.',
    ],
    [
        '4. 동의 거부 권리',
        '개인정보 수집 및 이용에 동의하지 않을 수 있으나, 동의를 거부하면 무료진단 신청이 제한될 수 있습니다.',
    ],
    [
        '5. 개인정보 보호 문의',
        '최종 운영사 정보와 개인정보 보호 담당자 연락처는 서비스 오픈 전 실제 정보로 교체해야 합니다.',
    ],
];

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
                {sections.map(([title, body]) => (
                    <section className="border-t border-line py-7" key={title}>
                        <h2 className="m-0 mb-3 text-h5">{title}</h2>
                        <p className="m-0 text-sm text-muted">{body}</p>
                    </section>
                ))}
                <p className="mt-8 text-xs text-muted">시행일자: 2026년 8월 14일</p>
            </div>
        </main>
    );
}
