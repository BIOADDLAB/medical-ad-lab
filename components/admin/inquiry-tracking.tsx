'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import type { LeadRow } from '@/lib/lead';
import { evidenceLabel, isHttpUrl, readViewedArticles, trafficLabel } from '@/lib/traffic';
import { fetchLeads, type LeadPayload } from './lead-table';

const field =
    'h-11 w-full rounded-lg border border-line-strong bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-brand';
const button =
    'min-h-11 rounded-lg border border-line-strong bg-white px-4 text-sm font-bold hover:bg-soft focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50';
const PAGE_SIZE = 25;

function timestamp(value: string) {
    const local = /^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{1,2}):(\d{2})/.exec(value);
    const normalized = local
        ? `${local[1]}-${local[2].padStart(2, '0')}-${local[3].padStart(2, '0')}T${local[4].padStart(2, '0')}:${local[5]}:00+09:00`
        : value;
    const parsed = Date.parse(normalized);
    return Number.isFinite(parsed) ? parsed : null;
}

function dateText(value: string) {
    const time = timestamp(value);
    return time === null
        ? value || '기록 없음'
        : new Intl.DateTimeFormat('ko-KR', {
              timeZone: 'Asia/Seoul',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hourCycle: 'h23',
          }).format(time);
}

const sourceText = (lead: LeadRow) =>
    lead.trafficSource ? trafficLabel(lead.trafficSource, lead.trafficMedium) : lead.source || '기록 없음';
const hasQuery = (lead: LeadRow) =>
    lead.trackingVersion === '2' &&
    ['naver_query', 'referrer_query'].includes(lead.trafficKeywordType) &&
    !!lead.trafficKeyword;
const queryText = (lead: LeadRow) =>
    hasQuery(lead)
        ? lead.trafficKeyword
        : lead.trackingVersion !== '2' && lead.trafficKeyword
          ? '기존 키워드 · 유형 미확인'
          : '전달되지 않음';
const maskedPhone = (value: string) => value.replace(/(\d{2,3})[- ]?(\d{3,4})[- ]?(\d{4})/, '$1-****-$3');

function PageLink({ url, title }: { url: string; title?: string }) {
    return isHttpUrl(url) ? (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-brand underline underline-offset-4"
        >
            {title || url}
        </a>
    ) : (
        <span>{title || '기록 없음'}</span>
    );
}

function Detail({ lead }: { lead: LeadRow }) {
    const articles = readViewedArticles(lead.viewedArticles);
    const values = [
        ['최초 유입', lead.firstTouch],
        ['이번 방문 출처', lead.sessionSource],
        ['최근 출처 판별 근거', evidenceLabel(lead.trafficEvidence)],
        [
            '검색어 근거',
            hasQuery(lead)
                ? lead.trafficKeywordType === 'naver_query'
                    ? '네이버 광고 n_query'
                    : '브라우저가 전달한 검색 URL'
                : '전달된 검색어 없음',
        ],
        ['광고 등록 키워드', lead.trafficAdKeyword],
        ['운영 태그 (검색어 아님)', lead.trafficTerm],
        ['캠페인', lead.trafficCampaign],
        ['글·링크 식별자', lead.trafficContent],
        ['기기', lead.device],
        ...(lead.trackingVersion !== '2' && lead.trafficKeyword
            ? [['기존 키워드 (유형 미구분)', lead.trafficKeyword]]
            : []),
    ];
    return (
        <div className="grid gap-6 p-5 text-sm lg:grid-cols-2">
            <div>
                <h3 className="mb-3 mt-0 font-bold">출처 확인 정보</h3>
                <dl className="m-0 grid gap-2">
                    {values
                        .filter(([, value]) => value)
                        .map(([label, value]) => (
                            <div key={label} className="grid gap-1 sm:grid-cols-[160px_1fr]">
                                <dt className="text-slate">{label}</dt>
                                <dd className="m-0 break-words">{value}</dd>
                            </div>
                        ))}
                </dl>
            </div>
            <div>
                <h3 className="mb-3 mt-0 font-bold">문의까지의 경로</h3>
                <dl className="m-0 grid gap-3">
                    <div>
                        <dt className="mb-1 text-slate">외부 유입 글</dt>
                        <dd className="m-0">
                            <PageLink url={lead.trafficUrl} title={lead.trafficTitle} />
                        </dd>
                    </div>
                    <div>
                        <dt className="mb-1 text-slate">이번 방문의 첫 페이지</dt>
                        <dd className="m-0">
                            <PageLink url={lead.sessionLandingUrl} title={lead.sessionLandingTitle} />
                        </dd>
                    </div>
                    <div>
                        <dt className="mb-1 text-slate">이번 방문에서 본 홈페이지 글</dt>
                        <dd className="m-0">
                            {articles.length ? (
                                <ul className="m-0 grid gap-2 pl-5">
                                    {articles.map((article) => (
                                        <li key={article.url}>
                                            <PageLink url={article.url} title={article.title} />
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                '기록 없음'
                            )}
                        </dd>
                    </div>
                    <div>
                        <dt className="mb-1 text-slate">문의한 페이지</dt>
                        <dd className="m-0">
                            <PageLink url={lead.submitUrl} />
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}

export function InquiryTracking({ user }: { user: User }) {
    const [payload, setPayload] = useState<LeadPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refresh, setRefresh] = useState(0);
    const [search, setSearch] = useState('');
    const [source, setSource] = useState('');
    const [queryFilter, setQueryFilter] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [page, setPage] = useState(1);
    const [expanded, setExpanded] = useState<number | null>(null);
    const [updatedAt, setUpdatedAt] = useState('');

    useEffect(() => {
        let active = true;
        fetchLeads(user)
            .then((data) => {
                if (!active) return;
                setPayload(data);
                setUpdatedAt(dateText(new Date().toISOString()));
            })
            .catch(() => {
                if (active)
                    setError('문의 정보를 불러오지 못했습니다. 로그인 상태와 시트 연결을 확인한 뒤 다시 불러오세요.');
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [user, refresh]);

    const records = useMemo(
        () =>
            (payload?.leads ?? [])
                .map((lead, id) => ({ lead, id }))
                .sort((a, b) => (timestamp(b.lead.createdAt) ?? 0) - (timestamp(a.lead.createdAt) ?? 0)),
        [payload],
    );
    const sources = useMemo(() => [...new Set(records.map(({ lead }) => sourceText(lead)))].sort(), [records]);
    const invalidRange = !!from && !!to && from > to;
    const filtered = useMemo(
        () =>
            records.filter(({ lead }) => {
                if (invalidRange) return false;
                const time = timestamp(lead.createdAt);
                if (from && (time === null || time < Date.parse(`${from}T00:00:00+09:00`))) return false;
                if (to && (time === null || time >= Date.parse(`${to}T00:00:00+09:00`) + 86400000)) return false;
                if (source && sourceText(lead) !== source) return false;
                if (queryFilter === 'known' && !hasQuery(lead)) return false;
                if (queryFilter === 'unknown' && hasQuery(lead)) return false;
                const text = [
                    lead.hospital,
                    lead.phone,
                    sourceText(lead),
                    lead.trafficKeyword,
                    lead.trafficTitle,
                    lead.trafficContent,
                    lead.trafficCampaign,
                    ...readViewedArticles(lead.viewedArticles).map((article) => article.title),
                ]
                    .join(' ')
                    .toLowerCase();
                return text.includes(search.trim().toLowerCase());
            }),
        [records, from, to, source, queryFilter, search, invalidRange],
    );
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, pages);
    const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const change = (setter: (value: string) => void, value: string) => {
        setter(value);
        setPage(1);
        setExpanded(null);
    };
    const reset = () => {
        setSearch('');
        setSource('');
        setQueryFilter('');
        setFrom('');
        setTo('');
        setPage(1);
        setExpanded(null);
    };
    const reload = () => {
        setError('');
        setLoading(true);
        setExpanded(null);
        setRefresh((value) => value + 1);
    };

    const download = () => {
        const rows = [
            [
                '문의 접수 시각 (KST)',
                '최근 출처 확인 시각 (KST)',
                '병원·문의처',
                '연락처 (마스킹)',
                '최근 확인 출처',
                '전달된 검색어',
                '검색어 근거',
                '유입 글',
                '조회한 홈페이지 글',
                '처리상태',
            ],
            ...filtered.map(({ lead }) => [
                dateText(lead.createdAt),
                dateText(lead.trafficCapturedAt),
                lead.hospital,
                maskedPhone(lead.phone),
                sourceText(lead),
                queryText(lead),
                hasQuery(lead) ? lead.trafficKeywordType : '',
                lead.trafficTitle,
                readViewedArticles(lead.viewedArticles)
                    .map((article) => article.title || article.url)
                    .join(' / '),
                lead.status,
            ]),
        ];
        const cell = (value: string) => `"${(/^[\s]*[=+@-]/.test(value) ? "'" + value : value).replace(/"/g, '""')}"`;
        const blob = new Blob(['\uFEFF' + rows.map((row) => row.map(cell).join(',')).join('\r\n')], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = '문의-유입-추적.csv';
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    return (
        <section className="min-w-0 text-ink" aria-label="문의 유입 추적 목록">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <p className="m-0 text-sm text-slate">문의 1건당 1행 · 문의 접수일 기준 · 한국시간(KST)</p>
                <div className="flex gap-2">
                    <button type="button" className={button} onClick={reload} disabled={loading}>
                        {loading ? '불러오는 중…' : '새로고침'}
                    </button>
                    <button
                        type="button"
                        className={button}
                        onClick={download}
                        disabled={loading || !!error || !filtered.length}
                    >
                        CSV 다운로드
                    </button>
                </div>
            </div>
            <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="grid gap-1.5 text-xs font-bold">
                    문의 시작일
                    <input
                        type="date"
                        className={field}
                        value={from}
                        max={to || undefined}
                        onChange={(event) => change(setFrom, event.target.value)}
                    />
                </label>
                <label className="grid gap-1.5 text-xs font-bold">
                    문의 종료일
                    <input
                        type="date"
                        className={field}
                        value={to}
                        min={from || undefined}
                        onChange={(event) => change(setTo, event.target.value)}
                    />
                </label>
                <label className="grid gap-1.5 text-xs font-bold">
                    최근 확인 출처
                    <select
                        className={field}
                        value={source}
                        onChange={(event) => change(setSource, event.target.value)}
                    >
                        <option value="">전체 출처</option>
                        {sources.map((item) => (
                            <option key={item}>{item}</option>
                        ))}
                    </select>
                </label>
                <label className="grid gap-1.5 text-xs font-bold">
                    검색어 확인
                    <select
                        className={field}
                        value={queryFilter}
                        onChange={(event) => change(setQueryFilter, event.target.value)}
                    >
                        <option value="">전체</option>
                        <option value="known">전달된 검색어 있음</option>
                        <option value="unknown">검색어 미확인</option>
                    </select>
                </label>
                <label className="grid gap-1.5 text-xs font-bold sm:col-span-2 lg:col-span-3">
                    목록 검색
                    <input
                        type="search"
                        className={field}
                        placeholder="병원명, 연락처, 검색어, 글 제목"
                        value={search}
                        onChange={(event) => change(setSearch, event.target.value)}
                    />
                </label>
                <button type="button" className={`${button} self-end`} onClick={reset}>
                    필터 초기화
                </button>
            </div>
            {invalidRange && (
                <p role="alert" className="text-sm text-red-700">
                    시작일은 종료일보다 늦을 수 없습니다.
                </p>
            )}
            {error && (
                <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
                    {error}{' '}
                    <button type="button" onClick={reload} className="underline">
                        다시 불러오기
                    </button>
                </p>
            )}
            {loading ? (
                <p role="status" className="py-12 text-center text-sm">
                    문의 유입정보를 불러오고 있습니다.
                </p>
            ) : !error && !payload?.ready ? (
                <p className="rounded-lg bg-soft p-6 text-sm">
                    구글시트 연결 후 문의 유입정보가 표시됩니다. 기존 문의 메뉴의 시트 연결 설정을 확인해 주세요.
                </p>
            ) : (
                !error && (
                    <>
                        <div className="mb-3 flex flex-wrap justify-between gap-2 text-sm">
                            <p className="m-0" aria-live="polite">
                                조회 <strong className="tabular-nums">{filtered.length}</strong>건{' '}
                                <span className="text-slate">/ 전체 {records.length}건</span>
                            </p>
                            <span className="text-xs text-slate">마지막 갱신 {updatedAt}</span>
                        </div>
                        <div
                            className="admin-scroll max-h-[680px] overflow-auto rounded-lg border border-line focus-visible:outline-2 focus-visible:outline-brand"
                            tabIndex={0}
                            role="region"
                            aria-label="문의 유입 테이블, 가로 스크롤 가능"
                        >
                            <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
                                <caption className="sr-only">
                                    문의 접수 최신순 유입정보. 시각은 한국시간이며 검색 시각을 의미하지 않습니다.
                                </caption>
                                <thead className="sticky top-0 z-10 bg-soft text-xs text-slate">
                                    <tr>
                                        {[
                                            '문의 접수 / 출처 확인',
                                            '병원·문의처',
                                            '최근 확인 출처',
                                            '전달된 검색어',
                                            '유입 글 / 홈페이지 글',
                                            '상태',
                                            '상세',
                                        ].map((label) => (
                                            <th
                                                scope="col"
                                                key={label}
                                                className="whitespace-nowrap border-b border-line px-4 py-4 font-bold"
                                            >
                                                {label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {visible.map(({ lead, id }) => (
                                        <Fragment key={id}>
                                            <tr className="border-b border-line align-top hover:bg-soft/50">
                                                <td className="whitespace-nowrap px-4 py-4 text-xs leading-6 tabular-nums">
                                                    <div>{dateText(lead.createdAt)}</div>
                                                    <div className="text-slate">
                                                        출처 {dateText(lead.trafficCapturedAt)}
                                                    </div>
                                                </td>
                                                <td className="min-w-36 px-4 py-4">
                                                    <strong className="block max-w-48 break-words">
                                                        {lead.hospital || '미입력'}
                                                    </strong>
                                                    <span className="mt-1 block whitespace-nowrap text-xs text-slate">
                                                        {maskedPhone(lead.phone)}
                                                    </span>
                                                </td>
                                                <td className="min-w-44 max-w-60 px-4 py-4">
                                                    <div className="font-bold">{sourceText(lead)}</div>
                                                    <p className="mb-0 mt-1 text-xs text-slate">
                                                        {evidenceLabel(lead.trafficEvidence)}
                                                    </p>
                                                </td>
                                                <td className="min-w-40 max-w-52 break-words px-4 py-4">
                                                    <span className={hasQuery(lead) ? 'font-bold' : 'text-slate'}>
                                                        {queryText(lead)}
                                                    </span>
                                                </td>
                                                <td className="min-w-64 max-w-80 px-4 py-4">
                                                    <PageLink url={lead.trafficUrl} title={lead.trafficTitle} />
                                                    {readViewedArticles(lead.viewedArticles).map((article) => (
                                                        <div key={article.url} className="mt-2 text-xs">
                                                            <span className="text-slate">홈페이지 글 · </span>
                                                            <PageLink url={article.url} title={article.title} />
                                                        </div>
                                                    ))}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-4 text-xs">
                                                    {lead.status || '신규'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <button
                                                        type="button"
                                                        className={button}
                                                        aria-expanded={expanded === id}
                                                        aria-controls={`inquiry-detail-${id}`}
                                                        aria-label={`${lead.hospital || '문의'} 유입 상세 ${expanded === id ? '닫기' : '보기'}`}
                                                        onClick={() => setExpanded(expanded === id ? null : id)}
                                                    >
                                                        {expanded === id ? '닫기' : '보기'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {expanded === id && (
                                                <tr
                                                    id={`inquiry-detail-${id}`}
                                                    className="border-b border-line bg-soft"
                                                >
                                                    <td colSpan={7}>
                                                        <Detail lead={lead} />
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    ))}
                                    {!visible.length && (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-14 text-center text-slate">
                                                {records.length
                                                    ? '조건에 맞는 문의가 없습니다. 필터를 변경하거나 초기화해 주세요.'
                                                    : '아직 접수된 문의가 없습니다. 문의가 접수되면 이곳에 표시됩니다.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-3">
                            <span className="text-xs text-slate">페이지당 {PAGE_SIZE}건</span>
                            <nav aria-label="문의 목록 페이지" className="flex items-center gap-3">
                                <button
                                    type="button"
                                    className={button}
                                    disabled={currentPage <= 1}
                                    onClick={() => {
                                        setPage(currentPage - 1);
                                        setExpanded(null);
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
                                        setExpanded(null);
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
                이 탭의 출처는 마지막으로 확인된 유입입니다. 이번 방문 출처는 상세 또는 전체 방문 탭에서 확인하세요.
                출처 확인 시각은 홈페이지에서 기록한 시각이며 검색 시각이 아닙니다. 문의하지 않은 방문자는 이 목록에
                포함되지 않습니다. 검색엔진의 미전달 검색어와 AI 질문은 표시할 수 없습니다.
            </p>
        </section>
    );
}
