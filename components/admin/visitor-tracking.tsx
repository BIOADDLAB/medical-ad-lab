'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { getIdToken, type User } from 'firebase/auth';
import type { LeadRow } from '@/lib/lead';
import { evidenceLabel, isHttpUrl, trafficLabel } from '@/lib/traffic';
import { locationLabel, visitTime, type VisitPage, type VisitRecord } from '@/lib/visit';
import { fetchLeads } from './lead-table';

const field =
    'h-11 w-full rounded-lg border border-line-strong bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-brand';
const button =
    'min-h-11 rounded-lg border border-line-strong bg-white px-4 text-sm font-bold hover:bg-soft focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50';
const day = (at: number) => new Date(at + 9 * 3600000).toISOString().slice(0, 10);
const start = () => day(Date.now() - 6 * 86400000);
const end = () => day(Date.now());
const hasQuery = (visit: VisitRecord) =>
    !!visit.keyword && ['naver_query', 'referrer_query'].includes(visit.keywordType);

type Payload = { ready: boolean; visits: VisitRecord[]; truncated: boolean; message?: string };
async function adminFetch<T>(user: User, url: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${await getIdToken(user)}` },
        cache: 'no-store',
        signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || '방문 기록을 불러오지 못했습니다. 다시 조회해 주세요.');
    return payload as T;
}
function PageLink({ url, title }: { url: string; title?: string }) {
    return isHttpUrl(url) ? (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-brand underline underline-offset-4"
        >
            {title || new URL(url).pathname}
        </a>
    ) : (
        <span>{title || '기록 없음'}</span>
    );
}
function VisitDetail({ user, visit, lead }: { user: User; visit: VisitRecord; lead?: LeadRow }) {
    const [pages, setPages] = useState<VisitPage[] | null>(null);
    const [error, setError] = useState('');
    const [truncated, setTruncated] = useState(false);
    const [refresh, setRefresh] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        adminFetch<{ pages: VisitPage[]; truncated: boolean }>(
            user,
            `/api/admin/visits?session=${visit.id}`,
            controller.signal,
        )
            .then((data) => {
                if (!controller.signal.aborted) {
                    setPages(data.pages);
                    setTruncated(data.truncated);
                }
            })
            .catch((cause) => {
                if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '경로 조회 실패');
            });
        return () => controller.abort();
    }, [user, visit.id, refresh]);
    const info = [
        ['익명 방문자 ID', visit.visitorId],
        ['방문 세션 ID', visit.id],
        ['위치 (IP 기준 추정)', locationLabel(visit)],
        ['출처 근거', evidenceLabel(visit.evidence)],
        ['광고 등록 키워드', visit.adKeyword],
        ['운영 태그 (검색어 아님)', visit.term],
        ['캠페인', visit.campaign],
        ['링크 식별자', visit.content],
        ['문의 접수', lead?.createdAt || visit.inquiryAt],
        ['연락처', lead?.phone.replace(/(\d{2,3})[- ]?(\d{3,4})[- ]?(\d{4})/, '$1-****-$3')],
    ];
    return (
        <div className="grid gap-6 p-5 text-sm lg:grid-cols-[1fr_1.2fr]">
            <div>
                <h3 className="mb-4 mt-0 font-bold">방문 정보</h3>
                <dl className="m-0 grid gap-3">
                    {info
                        .filter(([, value]) => value)
                        .map(([label, value]) => (
                            <div key={label} className="grid gap-1">
                                <dt className="text-slate">{label}</dt>
                                <dd className="m-0 break-all">{value}</dd>
                            </div>
                        ))}
                    <div>
                        <dt className="mb-1 text-slate">외부 유입 글</dt>
                        <dd className="m-0">
                            <PageLink url={visit.externalUrl} title={visit.externalTitle} />
                        </dd>
                    </div>
                </dl>
            </div>
            <div>
                <h3 className="mb-4 mt-0 font-bold">시간순 조회 페이지</h3>
                {error ? (
                    <p role="alert" className="text-red-800">
                        {error}{' '}
                        <button
                            className="underline"
                            type="button"
                            onClick={() => {
                                setError('');
                                setRefresh((value) => value + 1);
                            }}
                        >
                            다시 불러오기
                        </button>
                    </p>
                ) : pages === null ? (
                    <p role="status">방문 경로를 불러오는 중…</p>
                ) : pages.length ? (
                    <ol className="m-0 grid gap-3 pl-5">
                        {pages.map((page) => (
                            <li key={page.id} className="pl-1">
                                <span className="mr-3 text-xs tabular-nums text-slate">{visitTime(page.at)}</span>
                                <PageLink url={page.url} title={page.title} />
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p>아직 저장된 조회 페이지가 없습니다. 잠시 후 새로고침해 주세요.</p>
                )}
                {truncated && <p className="text-xs text-slate">이 방문의 처음 200개 페이지를 표시합니다.</p>}
            </div>
        </div>
    );
}

export function VisitorTracking({ user }: { user: User }) {
    const [from, setFrom] = useState(start);
    const [to, setTo] = useState(end);
    const [query, setQuery] = useState(() => ({ from: start(), to: end(), refresh: 0 }));
    const [payload, setPayload] = useState<Payload | null>(null);
    const [leads, setLeads] = useState<LeadRow[]>([]);
    const [leadWarning, setLeadWarning] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [source, setSource] = useState('');
    const [conversion, setConversion] = useState('');
    const [location, setLocation] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [expanded, setExpanded] = useState('');
    const [updatedAt, setUpdatedAt] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        const run = async () => {
            const [visits, inquiry] = await Promise.allSettled([
                adminFetch<Payload>(user, `/api/admin/visits?from=${query.from}&to=${query.to}`, controller.signal),
                fetchLeads(user),
            ]);
            if (controller.signal.aborted) return;
            if (visits.status === 'fulfilled') {
                setPayload(visits.value);
                setUpdatedAt(visitTime(new Date().toISOString()));
            } else setError(visits.reason instanceof Error ? visits.reason.message : '방문 기록 조회 실패');
            if (inquiry.status === 'fulfilled') {
                setLeads(inquiry.value.leads);
                setLeadWarning(
                    inquiry.value.ready ? '' : '문의 시트가 연결되지 않아 문의 연결 정보를 모두 확인할 수 없습니다.',
                );
            } else setLeadWarning('문의 시트 조회에 실패했습니다. 저장된 방문·문의 연결 정보만 표시합니다.');
            setLoading(false);
        };
        void run();
        return () => controller.abort();
    }, [user, query]);

    const leadMap = useMemo(() => {
        const result = new Map<string, LeadRow>();
        for (const lead of leads) {
            if (lead.visitSessionId && !result.has(lead.visitSessionId)) result.set(lead.visitSessionId, lead);
        }
        return result;
    }, [leads]);
    const visits = payload?.visits || [];
    const sources = [...new Set(visits.map((visit) => trafficLabel(visit.source, visit.medium)))].sort();
    const locations = [...new Set(visits.map(locationLabel))].sort();
    const filtered = visits.filter((visit) => {
        if (source && trafficLabel(visit.source, visit.medium) !== source) return false;
        if (location && locationLabel(visit) !== location) return false;
        const lead = leadMap.get(visit.id);
        const linked = !!lead || !!visit.hospital;
        if ((conversion === 'yes' && !linked) || (conversion === 'no' && linked)) return false;
        return [
            visit.visitorId,
            visit.hospital,
            lead?.hospital,
            trafficLabel(visit.source, visit.medium),
            visit.keyword,
            visit.externalTitle,
            visit.landingTitle,
            visit.landingUrl,
            locationLabel(visit),
        ]
            .join(' ')
            .toLowerCase()
            .includes(search.trim().toLowerCase());
    });
    const pages = Math.max(1, Math.ceil(filtered.length / 25));
    const currentPage = Math.min(page, pages);
    const rows = filtered.slice((currentPage - 1) * 25, currentPage * 25);
    const linkedCount = filtered.filter((visit) => leadMap.has(visit.id) || visit.hospital).length;
    const apply = () => {
        const distance = Date.parse(`${to}T00:00:00+09:00`) - Date.parse(`${from}T00:00:00+09:00`);
        if (!Number.isFinite(distance) || distance < 0 || distance >= 90 * 86400000) {
            setError('조회 기간은 시작일과 종료일을 포함해 최대 90일입니다.');
            return;
        }
        setLoading(true);
        setError('');
        setPayload(null);
        setPage(1);
        setExpanded('');
        setQuery({ from, to, refresh: query.refresh + 1 });
    };
    const filter = (setter: (value: string) => void, value: string) => {
        setter(value);
        setPage(1);
        setExpanded('');
    };
    const download = () => {
        const data = [
            [
                '방문 시작 (KST)',
                '최근 활동 (KST)',
                '익명 방문자 ID',
                '방문 세션 ID',
                '문의 병원',
                '이번 방문 출처',
                '출처 근거',
                '전달된 검색어',
                'IP 기준 추정 위치',
                '첫 페이지',
                '조회 페이지 수',
                '기기',
                '문의 접수 시각',
            ],
            ...filtered.map((visit) => [
                new Date(visit.startedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
                visitTime(visit.lastAt),
                visit.visitorId,
                visit.id,
                leadMap.get(visit.id)?.hospital || visit.hospital || '',
                trafficLabel(visit.source, visit.medium),
                evidenceLabel(visit.evidence),
                hasQuery(visit) ? visit.keyword : '',
                locationLabel(visit),
                visit.landingUrl,
                String(visit.pageCount),
                visit.device,
                leadMap.get(visit.id)?.createdAt || visit.inquiryAt,
            ]),
        ];
        const cell = (value: string) => `"${(/^[\s]*[=+@-]/.test(value) ? "'" + value : value).replace(/"/g, '""')}"`;
        const url = URL.createObjectURL(
            new Blob(['\uFEFF' + data.map((row) => row.map(cell).join(',')).join('\r\n')], {
                type: 'text/csv;charset=utf-8;',
            }),
        );
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `방문-유입-${query.from}-${query.to}.csv`;
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    return (
        <section aria-label="방문 유입 기록" className="min-w-0">
            <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto]">
                <label className="grid gap-1.5 text-xs font-bold">
                    방문 시작일
                    <input
                        className={field}
                        type="date"
                        value={from}
                        onChange={(event) => setFrom(event.target.value)}
                    />
                </label>
                <label className="grid gap-1.5 text-xs font-bold">
                    방문 종료일
                    <input className={field} type="date" value={to} onChange={(event) => setTo(event.target.value)} />
                </label>
                <button type="button" className={`${button} self-end`} onClick={apply} disabled={loading}>
                    {loading ? '불러오는 중…' : '조회 / 새로고침'}
                </button>
                <button
                    type="button"
                    className={`${button} self-end`}
                    onClick={download}
                    disabled={loading || !!error || !filtered.length}
                >
                    CSV 다운로드
                </button>
            </div>
            <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <label className="grid gap-1.5 text-xs font-bold">
                    이번 방문 출처
                    <select
                        className={field}
                        value={source}
                        onChange={(event) => filter(setSource, event.target.value)}
                    >
                        <option value="">전체 출처</option>
                        {sources.map((item) => (
                            <option key={item}>{item}</option>
                        ))}
                    </select>
                </label>
                <label className="grid gap-1.5 text-xs font-bold">
                    위치 (IP 기준 추정)
                    <select
                        className={field}
                        value={location}
                        onChange={(event) => filter(setLocation, event.target.value)}
                    >
                        <option value="">전체 위치</option>
                        {locations.map((item) => (
                            <option key={item}>{item}</option>
                        ))}
                    </select>
                </label>
                <label className="grid gap-1.5 text-xs font-bold">
                    문의 여부
                    <select
                        className={field}
                        value={conversion}
                        onChange={(event) => filter(setConversion, event.target.value)}
                    >
                        <option value="">전체 방문</option>
                        <option value="yes">문의로 연결</option>
                        <option value="no">이 방문에서 문의 미확인</option>
                    </select>
                </label>
                <label className="grid gap-1.5 text-xs font-bold">
                    목록 검색
                    <input
                        type="search"
                        className={field}
                        placeholder="방문자 ID, 병원명, 검색어, 글 제목"
                        value={search}
                        onChange={(event) => filter(setSearch, event.target.value)}
                    />
                </label>
            </div>
            {error && (
                <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
                    {error}
                </p>
            )}
            {loading ? (
                <p role="status" className="py-12 text-center text-sm">
                    방문 기록을 불러오고 있습니다.
                </p>
            ) : !error && !payload?.ready ? (
                <div className="rounded-lg bg-soft p-5 text-sm leading-7">
                    <strong>방문 저장소 연결이 필요합니다.</strong>
                    <p className="mb-0">
                        {payload?.message} 구글시트 서비스 계정에 Firebase 프로젝트의 Cloud Datastore User 권한을
                        부여하면 방문 기록이 저장됩니다. 적용 가이드에 설정 순서를 넣었습니다.
                    </p>
                </div>
            ) : (
                !error && (
                    <>
                        {leadWarning && (
                            <p role="status" className="text-sm text-slate">
                                {leadWarning}
                            </p>
                        )}
                        {payload?.truncated && (
                            <p role="status" className="rounded-lg bg-soft p-3 text-sm">
                                이 기간의 최신 1,000개 방문을 표시합니다. 더 이전 기록은 날짜 범위를 줄여 조회하세요.
                                필터와 CSV는 표시된 기록 기준입니다.
                            </p>
                        )}
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                            <span aria-live="polite">
                                방문 <strong className="tabular-nums">{filtered.length}</strong>건 · 방문자{' '}
                                {new Set(filtered.map((visit) => visit.visitorId)).size}명 · 문의 연결 {linkedCount}건
                            </span>
                            <span className="text-xs text-slate">최근 조회 {updatedAt} · KST</span>
                        </div>
                        <div
                            className="admin-scroll max-h-[680px] overflow-auto rounded-lg border border-line focus-visible:outline-2 focus-visible:outline-brand"
                            tabIndex={0}
                            role="region"
                            aria-label="방문 기록 테이블, 가로 스크롤 가능"
                        >
                            <table className="w-full min-w-[1320px] border-collapse text-left text-sm">
                                <caption className="sr-only">
                                    방문 시작 최신순. 출처는 이번 방문 기준이고, 위치는 IP 기준 추정입니다.
                                </caption>
                                <thead className="sticky top-0 z-20 bg-soft text-xs text-slate">
                                    <tr>
                                        {[
                                            '방문 시각',
                                            '방문자 / 문의처',
                                            '이번 방문 출처',
                                            '위치 (추정)',
                                            '전달된 검색어',
                                            '첫 페이지 / 유입 글',
                                            '조회 / 문의',
                                            '상세',
                                        ].map((label, index) => (
                                            <th
                                                key={label}
                                                scope="col"
                                                className={`whitespace-nowrap border-b border-line px-4 py-4 ${index === 0 ? 'sticky left-0 z-30 bg-soft' : ''}`}
                                            >
                                                {label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((visit) => {
                                        const lead = leadMap.get(visit.id),
                                            hospital = lead?.hospital || visit.hospital;
                                        return (
                                            <Fragment key={visit.id}>
                                                <tr className="border-b border-line align-top hover:bg-soft/50">
                                                    <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-4 text-xs tabular-nums leading-6">
                                                        <div>{visitTime(visit.startedAt)}</div>
                                                        <span className="text-slate">
                                                            최근 {visitTime(visit.lastAt)}
                                                        </span>
                                                    </td>
                                                    <td className="min-w-36 max-w-48 break-words px-4 py-4">
                                                        <strong>{hospital || '익명 방문자'}</strong>
                                                        <button
                                                            type="button"
                                                            className="mt-2 block text-xs text-brand underline underline-offset-4"
                                                            title={visit.visitorId}
                                                            onClick={() => filter(setSearch, visit.visitorId)}
                                                        >
                                                            ID {visit.visitorId.slice(0, 8)}
                                                        </button>
                                                    </td>
                                                    <td className="min-w-44 max-w-56 px-4 py-4">
                                                        <strong>{trafficLabel(visit.source, visit.medium)}</strong>
                                                        <p className="mb-0 mt-2 text-xs text-slate">
                                                            {evidenceLabel(visit.evidence)}
                                                        </p>
                                                    </td>
                                                    <td className="min-w-36 max-w-44 break-words px-4 py-4">
                                                        {locationLabel(visit)}
                                                    </td>
                                                    <td className="min-w-36 max-w-44 break-words px-4 py-4">
                                                        <span className={hasQuery(visit) ? 'font-bold' : 'text-slate'}>
                                                            {hasQuery(visit) ? visit.keyword : '전달되지 않음'}
                                                        </span>
                                                    </td>
                                                    <td className="min-w-64 max-w-72 px-4 py-4">
                                                        <PageLink url={visit.landingUrl} title={visit.landingTitle} />
                                                        {visit.externalUrl && (
                                                            <div className="mt-2 text-xs">
                                                                <span className="text-slate">외부 · </span>
                                                                <PageLink
                                                                    url={visit.externalUrl}
                                                                    title={visit.externalTitle}
                                                                />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-4 text-xs leading-6">
                                                        <div>페이지 {visit.pageCount}회</div>
                                                        <span
                                                            className={hospital ? 'font-bold text-brand' : 'text-slate'}
                                                        >
                                                            {hospital ? '문의 연결' : '문의 미확인'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <button
                                                            type="button"
                                                            className={button}
                                                            aria-label={`방문 ${visit.visitorId.slice(0, 8)} 상세 ${expanded === visit.id ? '닫기' : '보기'}`}
                                                            aria-expanded={expanded === visit.id}
                                                            aria-controls={`visit-detail-${visit.id}`}
                                                            onClick={() =>
                                                                setExpanded(expanded === visit.id ? '' : visit.id)
                                                            }
                                                        >
                                                            {expanded === visit.id ? '닫기' : '보기'}
                                                        </button>
                                                    </td>
                                                </tr>
                                                {expanded === visit.id && (
                                                    <tr
                                                        id={`visit-detail-${visit.id}`}
                                                        className="border-b border-line bg-soft"
                                                    >
                                                        <td colSpan={8}>
                                                            <VisitDetail user={user} visit={visit} lead={lead} />
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                    {!rows.length && (
                                        <tr>
                                            <td colSpan={8} className="px-5 py-14 text-center text-slate">
                                                {visits.length
                                                    ? '조건에 맞는 방문이 없습니다. 필터를 변경해 주세요.'
                                                    : '이 기간에 저장된 방문이 없습니다. 설정·배포 후 공개 페이지를 방문하면 기록됩니다.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-3">
                            <span className="text-xs text-slate">페이지당 25건</span>
                            <nav aria-label="방문 기록 페이지" className="flex items-center gap-3">
                                <button
                                    type="button"
                                    className={button}
                                    disabled={currentPage <= 1}
                                    onClick={() => {
                                        setPage(currentPage - 1);
                                        setExpanded('');
                                    }}
                                >
                                    이전
                                </button>
                                <span className="text-sm tabular-nums" aria-live="polite">
                                    {currentPage} / {pages}
                                </span>
                                <button
                                    type="button"
                                    className={button}
                                    disabled={currentPage >= pages}
                                    onClick={() => {
                                        setPage(currentPage + 1);
                                        setExpanded('');
                                    }}
                                >
                                    다음
                                </button>
                            </nav>
                        </div>
                    </>
                )
            )}
            <p className="mb-0 mt-5 max-w-3xl text-xs leading-6 text-slate">
                문의 전 방문은 익명 ID로 표시합니다. 같은 브라우저의 ID를 눌러 재방문을 모아 볼 수 있습니다. 위치는 IP
                기준 추정이며 VPN·통신망에 따라 다를 수 있습니다. 미전달 검색어와 AI 질문은 가져올 수 없습니다. 방문
                기록은 새 기능 적용 후부터 수집됩니다.
            </p>
        </section>
    );
}
