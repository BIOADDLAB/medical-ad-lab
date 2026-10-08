'use client';

import { useEffect, useState } from 'react';
import { getIdToken, type User } from 'firebase/auth';
import type { LeadRow } from '@/lib/lead';
import { evidenceLabel, isHttpUrl, readViewedArticles, trafficLabel } from '@/lib/traffic';

export type LeadPayload = {
    ready: boolean;
    sheetUrl: string;
    leads: LeadRow[];
    connections: { sheets: boolean; email: boolean };
};

/** 시트를 매번 읽어 보여주기만 한다. 서버·브라우저 어디에도 저장하지 않는다 */
export async function fetchLeads(user: User): Promise<LeadPayload> {
    const response = await fetch('/api/admin/leads', {
        headers: { Authorization: `Bearer ${await getIdToken(user)}` },
        cache: 'no-store',
    });
    if (!response.ok) throw new Error(String(response.status));
    return response.json();
}

const toneOf = (status: string) =>
    status === '종료'
        ? 'bg-line text-muted'
        : status === '신규'
          ? 'bg-brand-pale text-brand'
          : 'bg-success-pale text-success-deep';

function SourceLink({ label, url, title }: { label: string; url: string; title?: string }) {
    return (
        <div className="grid gap-1">
            <dt className="text-muted">{label}</dt>
            <dd className="m-0 break-words">
                {isHttpUrl(url) ? (
                    <a
                        className="text-brand underline underline-offset-2"
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={url}
                    >
                        {title || url}
                    </a>
                ) : (
                    title || '기록 없음'
                )}
            </dd>
        </div>
    );
}

function LeadSource({ lead }: { lead: LeadRow }) {
    const label = lead.trafficSource
        ? trafficLabel(lead.trafficSource, lead.trafficMedium)
        : lead.source || '기록 없음';
    const articles = readViewedArticles(lead.viewedArticles);
    const current = lead.trackingVersion === '2';
    const queryLabel = current ? '전달된 검색어' : '기존 키워드 (유형 미구분)';
    const query =
        lead.trafficKeyword || (lead.trafficMedium === 'ai' ? '질문·대화 내용은 전달되지 않음' : '전달되지 않음');
    const values = [
        ['판별 근거', evidenceLabel(lead.trafficEvidence)],
        [queryLabel, query],
        [
            '검색어 근거',
            lead.trafficKeywordType === 'naver_query'
                ? '네이버 광고 n_query'
                : lead.trafficKeywordType === 'referrer_query'
                  ? '이전 검색 URL'
                  : '',
        ],
        ['광고 등록 키워드', lead.trafficAdKeyword],
        ['운영 태그 (utm_term)', lead.trafficTerm],
        ['캠페인', lead.trafficCampaign],
        ['글·링크 식별자', lead.trafficContent],
        [
            '출처 확인 시각',
            lead.trafficCapturedAt
                ? new Date(lead.trafficCapturedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
                : '',
        ],
        ['이번 방문', lead.sessionSource],
        ['최초 방문', lead.firstTouch],
        ['기기', lead.device],
    ].filter(([, value]) => value);
    return (
        <div className="grid min-w-44 max-w-sm gap-1 break-words">
            <strong>{label}</strong>
            {lead.trafficTitle && <span>{lead.trafficTitle}</span>}
            {current && <span className="text-muted">{evidenceLabel(lead.trafficEvidence)}</span>}
            {articles.length > 0 && <span className="text-muted">홈페이지 블로그 {articles.length}개 글 조회</span>}
            <details className="mt-1">
                <summary className="cursor-pointer text-brand focus-visible:outline-2 focus-visible:outline-brand">
                    유입 상세 보기
                </summary>
                <dl className="my-3 grid gap-3 text-xs leading-relaxed">
                    {values.map(([name, value]) => (
                        <div key={name} className="grid gap-1">
                            <dt className="text-muted">{name}</dt>
                            <dd className="m-0">{value}</dd>
                        </div>
                    ))}
                    {!current && (
                        <p className="m-0 text-muted">
                            이전 버전의 기록입니다. 기존 키워드에는 캠페인명이나 운영 태그가 섞여 있을 수 있습니다.
                        </p>
                    )}
                    {(lead.trafficUrl || lead.trafficTitle) && (
                        <SourceLink
                            label={lead.trafficEvidence === 'utm' ? '유입 콘텐츠 (추적 링크 지정)' : '유입 콘텐츠'}
                            url={lead.trafficUrl}
                            title={lead.trafficTitle}
                        />
                    )}
                    {lead.trafficReferrer && (
                        <div>
                            <dt className="text-muted">브라우저가 전달한 이전 주소</dt>
                            <dd className="m-0 break-all">{lead.trafficReferrer}</dd>
                        </div>
                    )}
                    {lead.landingUrl && (
                        <SourceLink
                            label="최근 확인 출처의 진입 페이지"
                            url={lead.landingUrl}
                            title={lead.landingTitle}
                        />
                    )}
                    {lead.sessionLandingUrl && (
                        <SourceLink
                            label="이번 방문의 진입 페이지"
                            url={lead.sessionLandingUrl}
                            title={lead.sessionLandingTitle}
                        />
                    )}
                    {lead.firstLandingUrl && (
                        <SourceLink
                            label="최초 방문의 진입 페이지"
                            url={lead.firstLandingUrl}
                            title={lead.firstLandingTitle}
                        />
                    )}
                    {lead.firstTouchUrl && <SourceLink label="최초 방문의 외부 콘텐츠" url={lead.firstTouchUrl} />}
                    {lead.submitUrl && <SourceLink label="문의한 페이지" url={lead.submitUrl} />}
                    {articles.map((article) => (
                        <SourceLink
                            key={article.url}
                            label="이번 방문에서 본 홈페이지 글"
                            url={article.url}
                            title={article.title}
                        />
                    ))}
                    {lead.journeyPages && (
                        <div>
                            <dt className="text-muted">이번 방문의 페이지 이동 (최근 20개)</dt>
                            <dd className="m-0 whitespace-pre-line">{lead.journeyPages}</dd>
                        </div>
                    )}
                </dl>
            </details>
        </div>
    );
}

export function LeadTable({ user }: { user: User }) {
    const [state, setState] = useState<'loading' | 'error' | 'done'>('loading');
    const [data, setData] = useState<LeadPayload | null>(null);

    useEffect(() => {
        fetchLeads(user)
            .then((payload) => {
                setData(payload);
                setState('done');
            })
            .catch(() => setState('error'));
    }, [user]);

    if (state === 'loading') return <p className="m-0 text-xs text-muted">불러오는 중...</p>;
    if (state === 'error')
        return <p className="m-0 text-xs text-red-600">시트를 읽지 못했습니다. 환경변수를 확인해 주세요.</p>;
    if (!data?.ready)
        return (
            <p className="m-0 rounded-lg bg-soft p-3 text-[12px] leading-relaxed text-muted">
                구글시트 환경변수를 넣으면 접수된 문의가 여기 표시됩니다.
            </p>
        );
    if (!data.leads.length) return <p className="m-0 text-xs text-muted">아직 접수된 문의가 없습니다.</p>;

    return (
        <>
            <p className="mb-4 mt-0 text-xs leading-relaxed text-muted">
                유입경로는 최대 90일 내 최근 확인된 출처입니다. 직접 재방문은 이전 출처를 유지하며, 이번 방문 정보는
                상세에서 확인할 수 있습니다.
            </p>
            <div className="admin-scroll grid max-h-[min(560px,calc(100vh-220px))] gap-3 overflow-y-auto lg:hidden">
                {data.leads.map((lead, index) => (
                    <article className="rounded-xl border border-line bg-soft p-4" key={`${lead.createdAt}-${index}`}>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <strong className="block text-sm text-ink">{lead.hospital}</strong>
                                <span className="mt-1 block text-xs text-muted">
                                    {lead.area} · {lead.createdAt}
                                </span>
                            </div>
                            <span
                                className={`inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[10px] font-extrabold ${toneOf(lead.status)}`}
                            >
                                {lead.status}
                            </span>
                        </div>
                        <dl className="mt-4 grid gap-2 text-xs">
                            <div className="grid grid-cols-[58px_1fr] gap-2">
                                <dt className="text-muted">연락처</dt>
                                <dd className="m-0 break-all text-slate">{lead.phone}</dd>
                            </div>
                            <div className="grid grid-cols-[58px_1fr] gap-2">
                                <dt className="text-muted">이메일</dt>
                                <dd className="m-0 break-all text-slate">{lead.email}</dd>
                            </div>
                            <div className="grid grid-cols-[58px_1fr] gap-2">
                                <dt className="text-muted">문의내용</dt>
                                <dd className="m-0 whitespace-pre-wrap text-slate">{lead.message || '-'}</dd>
                            </div>
                            <div className="grid grid-cols-[58px_1fr] gap-2">
                                <dt className="text-muted">유입경로</dt>
                                <dd className="m-0 text-slate">
                                    <LeadSource lead={lead} />
                                </dd>
                            </div>
                        </dl>
                    </article>
                ))}
            </div>
            <div className="admin-scroll hidden max-h-[min(560px,calc(100vh-220px))] overflow-auto lg:block">
                <table className="w-full min-w-[760px] border-collapse text-xs">
                    <thead>
                        <tr className="sticky top-0 z-10 border-b border-line-strong bg-white text-left text-muted">
                            {['접수일시', '병원명', '지역', '연락처', '이메일', '문의내용', '유입경로', '상태'].map(
                                (label) => (
                                    <th key={label} className="whitespace-nowrap py-3 pr-4 font-bold">
                                        {label}
                                    </th>
                                ),
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {data.leads.map((lead, index) => (
                            <tr key={`${lead.createdAt}-${index}`} className="border-b border-line text-slate">
                                <td className="whitespace-nowrap py-3 pr-4">{lead.createdAt}</td>
                                <td className="py-3 pr-4 font-bold text-ink">{lead.hospital}</td>
                                <td className="py-3 pr-4">{lead.area}</td>
                                <td className="whitespace-nowrap py-3 pr-4">{lead.phone}</td>
                                <td className="py-3 pr-4">{lead.email}</td>
                                <td className="min-w-[260px] whitespace-pre-wrap py-3 pr-4">{lead.message || '-'}</td>
                                <td className="py-3 pr-4">
                                    <LeadSource lead={lead} />
                                </td>
                                <td className="py-3">
                                    <span
                                        className={`inline-flex h-6 items-center rounded-full px-2.5 text-[10px] font-extrabold ${toneOf(lead.status)}`}
                                    >
                                        {lead.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
