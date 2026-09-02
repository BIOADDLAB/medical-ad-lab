import type { Metadata } from 'next';
import Link from 'next/link';

import { BottomCta } from '@/components/home/bottom-cta';
import { Breadcrumb, breadcrumbJsonLd, type Crumb } from '@/components/layout/breadcrumb';
import { DiagnosisButton } from '@/components/lead/diagnosis-button';
import { faqs, mediaItems, processItems } from '@/data';
import { SITE_URL } from '@/lib/site';

/**
 * 검색·AI 답변이 "병원광고연구소는 무엇을 하는 회사인가"에 인용할 수 있는 평문 페이지.
 * 각 h2는 질문 하나에 대한 독립 답변으로 두고, 첫 문장에 결론을 먼저 둔다.
 */

const DEFINITION =
    '병원광고연구소(MEDICAL AD LAB)는 병원 위치와 진료과를 기준으로 지하철·버스·버스정류장·아파트·현수막·전광판 옥외광고 매체와 비용을 같은 조건으로 비교해 실행 플랜을 제안하는 병원 전문 옥외광고 대행사입니다.';

const trail: Crumb[] = [
    { name: '홈', href: '/' },
    { name: '회사소개', href: '/company' },
];

/** 매체별 적합 진료과는 자사 칼럼에서 정리한 기준을 그대로 쓴다 */
const MEDIA_FIT: Record<string, string> = {
    subway: '출퇴근 반복 노출이 필요한 정형외과·통증의학과',
    bus: '상권 전체 인지도가 필요한 개원 초기 병원',
    shelter: '지역 타깃이 분명한 생활권 밀착 진료과',
    apartment: '주거지 접점이 중요한 소아과·가정의학과',
    banner: '개원·이전·진료과 신설 안내',
    billboard: '상권 체류 지점이 유효한 피부과·성형외과',
};

export const metadata: Metadata = {
    title: '회사소개',
    description: DEFINITION,
    keywords: ['병원 옥외광고 업체', '병원 옥외광고 대행사', '병원광고 대행사', '병원 마케팅 회사', '옥외광고 대행사'],
    alternates: { canonical: '/company' },
    openGraph: {
        title: '병원광고연구소 회사소개',
        description: DEFINITION,
        url: '/company',
        type: 'website',
        siteName: '병원광고연구소',
        locale: 'ko_KR',
        images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: '병원광고연구소 MEDICAL AD LAB' }],
    },
    twitter: { card: 'summary_large_image', title: '병원광고연구소 회사소개', description: DEFINITION },
};

export default function CompanyPage() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'AboutPage',
                '@id': `${SITE_URL}/company#about`,
                name: '병원광고연구소 회사소개',
                description: DEFINITION,
                url: `${SITE_URL}/company`,
                inLanguage: 'ko-KR',
                mainEntity: { '@id': `${SITE_URL}#organization` },
                isPartOf: { '@id': `${SITE_URL}#website` },
            },
            {
                '@type': 'FAQPage',
                '@id': `${SITE_URL}/company#faq`,
                mainEntity: faqs.map(([question, answer]) => ({
                    '@type': 'Question',
                    name: question,
                    acceptedAnswer: { '@type': 'Answer', text: answer.replace(/\n+/g, ' ') },
                })),
            },
            breadcrumbJsonLd(trail),
        ],
    };

    return (
        <main className="pb-section pt-[100px] lg:pt-[170px]">
            <article className="site-container mb-16 max-w-[900px] lg:mb-24">
                <Breadcrumb trail={trail} />
                <p className="m-0 mt-6 text-xs font-extrabold tracking-[.14em] text-brand">ABOUT MEDICAL AD LAB</p>
                <h1 className="mt-4 text-h1">병원광고연구소 소개</h1>
                <p className="mt-6 text-lead font-semibold leading-[1.8] text-ink">{DEFINITION}</p>

                <section className="mt-14 border-t border-line pt-10">
                    <h2 className="m-0 text-h4">병원광고연구소는 어떤 회사인가요?</h2>
                    <p className="mt-4 text-body leading-[1.9] text-slate">
                        병원 옥외광고만 다루는 전문 대행사입니다. 특정 매체를 먼저 정해두고 파는 방식이 아니라, 병원
                        위치와 진료권, 환자 동선을 먼저 확인한 뒤 해당 상권에서 실제로 집행할 수 있는 매체를 추려
                        비교합니다. 매체비뿐 아니라 디자인 제작비, 설치비, 의료광고 심의 비용까지 합한 총집행비용을 같은
                        기준으로 정리해 드리기 때문에, 업체마다 다르게 나온 견적이 적정한지 판단할 수 있습니다. 병원
                        네트워크 800곳 이상, 옥외매체 네트워크 1,400곳 이상을 기반으로 운영합니다.
                    </p>
                </section>

                <section className="mt-12">
                    <h2 className="m-0 text-h4">어떤 옥외광고 매체를 취급하나요?</h2>
                    <p className="mt-4 text-body leading-[1.9] text-slate">
                        지하철, 버스, 버스정류장, 아파트 엘리베이터, 현수막, 전광판 여섯 가지 매체를 다룹니다. 같은
                        예산이라도 진료과와 환자 동선에 따라 유효한 매체가 달라집니다.
                    </p>
                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-line-strong">
                                    <th scope="col" className="py-3 pr-4 font-extrabold">
                                        매체
                                    </th>
                                    <th scope="col" className="py-3 pr-4 font-extrabold">
                                        노출 특성
                                    </th>
                                    <th scope="col" className="py-3 font-extrabold">
                                        적합한 경우
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {mediaItems.map((item) => (
                                    <tr key={item.key} className="border-b border-line align-top">
                                        <th scope="row" className="whitespace-nowrap py-3 pr-4 font-bold text-brand">
                                            {item.title}
                                        </th>
                                        <td className="py-3 pr-4 text-slate">{item.description}</td>
                                        <td className="py-3 text-slate">{MEDIA_FIT[item.key]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="mt-12">
                    <h2 className="m-0 text-h4">무료진단은 어떻게 진행되나요?</h2>
                    <p className="mt-4 text-body leading-[1.9] text-slate">
                        병원명과 지역 등 간단한 정보를 남기면 24시간 이내에 1차 안내를 드립니다. 신청부터 설치까지 다섯
                        단계로 진행되며, 진단 결과를 받아본 뒤 진행하지 않으셔도 비용이나 불이익은 없습니다.
                    </p>
                    <ol className="mt-6 grid gap-3">
                        {processItems.map(([number, title, description]) => (
                            <li key={number} className="flex gap-4 border-b border-line pb-3 text-body">
                                <span className="w-7 shrink-0 font-extrabold text-brand">{number}</span>
                                <span className="font-bold">{title}</span>
                                <span className="text-slate">{description}</span>
                            </li>
                        ))}
                    </ol>
                </section>

                <section className="mt-12">
                    <h2 className="m-0 text-h4">다른 옥외광고 대행사와 무엇이 다른가요?</h2>
                    <p className="mt-4 text-body leading-[1.9] text-slate">
                        세 가지가 다릅니다. 첫째, 매체를 먼저 정하지 않습니다. 병원 위치와 환자 동선을 확인한 뒤 후보
                        매체를 좁힙니다. 둘째, 위치·기간·규격과 제작 조건을 동일하게 맞춰 비교합니다. 기준이 다르면 적정
                        가격을 판단할 수 없기 때문입니다. 셋째, 집행 직전에 추가되는 비용을 미리 확인합니다. 디자인
                        제작, 설치, 의료광고 심의까지 포함한 총집행비용과 일정을 함께 검토해 처음 견적에 없던 비용이
                        나중에 붙지 않도록 합니다.
                    </p>
                </section>

                <section className="mt-12">
                    <h2 className="m-0 text-h4">어느 지역까지 진행할 수 있나요?</h2>
                    <p className="mt-4 text-body leading-[1.9] text-slate">
                        전국 단위로 상담과 집행이 가능합니다. 서울·경기·인천은 물론 지방 주요 도시까지 병원 주변의
                        지하철, 버스, 버스정류장, 아파트 엘리베이터, 전광판, 빌보드 매체를 검토할 수 있습니다. 특정
                        매체를 미리 정하실 필요는 없습니다. 병원 위치와 예산을 기준으로 실제 이용 가능한 매체를 확인한
                        뒤 적합한 후보를 제안드립니다.
                    </p>
                </section>

                <section className="mt-12">
                    <h2 className="m-0 text-h4">의료광고 심의도 대행하나요?</h2>
                    <p className="mt-4 text-body leading-[1.9] text-slate">
                        네. 광고 집행이 결정되면 매체 계약뿐 아니라 광고 디자인과 의료광고 심의 절차까지 함께
                        진행합니다. 병원 옥외광고는 일반 광고와 달리 의료법상 의료광고 규정과 매체별 제작 규격을 함께
                        고려해야 합니다. 병원에서 여러 업체를 따로 알아보지 않도록 기획부터 디자인, 심의, 매체 집행까지
                        한 번에 상담해 드립니다. 다만 광고 내용과 매체 유형에 따라 심의 대상 여부와 절차가 달라질 수
                        있어, 실제 소재와 집행계획을 확인한 뒤 안내드립니다.
                    </p>
                </section>

                <section className="mt-14 border-t border-line pt-10">
                    <h2 className="m-0 text-h4">자주 묻는 질문</h2>
                    <div className="mt-6 grid gap-6">
                        {faqs.map(([question, answer]) => (
                            <div key={question}>
                                <h3 className="m-0 text-h5">{question}</h3>
                                <p className="mt-2 whitespace-pre-line text-body leading-[1.9] text-slate">{answer}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mt-14 border-t border-line pt-10">
                    <h2 className="m-0 text-h4">회사 정보</h2>
                    <dl className="mt-6 grid gap-0 text-sm">
                        {[
                            ['상호', '바이오애드랩'],
                            ['서비스명', '병원광고연구소 (MEDICAL AD LAB)'],
                            ['사업자등록번호', '216-86-02932'],
                            ['주소', '서울특별시 강남구 학동로3길 27 2층 201호'],
                            ['전화', '02-2038-0088'],
                            ['이메일', 'medicaladlab@gmail.com'],
                            ['서비스 지역', '전국'],
                        ].map(([term, value]) => (
                            <div key={term} className="flex gap-6 border-b border-line py-3">
                                <dt className="w-[120px] shrink-0 text-muted">{term}</dt>
                                <dd className="m-0 font-bold">{value}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                {/* btn-outline 은 h-12(48px), btn-primary 는 min-h 52/56px 이라 그냥 두면 높이가 어긋난다 */}
                <div className="mt-12 flex flex-wrap items-center gap-3">
                    <DiagnosisButton className="btn-primary">무료진단 신청하기</DiagnosisButton>
                    <Link href="/cases" className="btn-outline min-h-[52px] rounded-xl lg:min-h-[56px]">
                        병원광고 사례 보기
                    </Link>
                </div>
            </article>

            <BottomCta />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
            />
        </main>
    );
}
