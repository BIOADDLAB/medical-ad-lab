'use client';

import { useEffect, useState } from 'react';
import { getIdToken, type User } from 'firebase/auth';
import type { SearchPayload } from '@/lib/search-console';
import { recentRange } from '@/lib/traffic-report';
import { visitTime } from '@/lib/visit';
import { ReportPeriod, downloadReportCsv, reportButton, reportNumber as num } from './traffic-report-controls';

export function SearchTerms({ user }: { user: User }) {
    const [range, setRange] = useState(() => recentRange(28));
    const [refresh, setRefresh] = useState(0);
    const [payload, setPayload] = useState<SearchPayload | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    useEffect(() => {
        const controller = new AbortController();
        const run = async () => {
            setLoading(true);
            setError('');
            setPayload(null);
            try {
                const response = await fetch(`/api/admin/search-console?${new URLSearchParams(range)}`, {
                    headers: { Authorization: `Bearer ${await getIdToken(user)}` },
                    cache: 'no-store',
                    signal: controller.signal,
                });
                const result = (await response.json()) as SearchPayload;
                if (controller.signal.aborted) return;
                setPayload(result);
                if (!response.ok) throw new Error(result.message || '구글 검색어 조회에 실패했습니다.');
            } catch (cause) {
                if (!controller.signal.aborted)
                    setError(cause instanceof Error ? cause.message : '구글 검색어 조회 실패');
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };
        void run();
        return () => controller.abort();
    }, [user, range, refresh]);
    const report = payload?.report;
    const filtered = (report?.rows || []).filter((row) =>
        row.query.toLowerCase().includes(search.trim().toLowerCase()),
    );
    const pages = Math.max(1, Math.ceil(filtered.length / 25));
    const current = Math.min(page, pages);
    const rows = filtered.slice((current - 1) * 25, current * 25);
    const consoleUrl = `https://search.google.com/search-console/performance/search-analytics${payload?.siteUrl ? `?resource_id=${encodeURIComponent(payload.siteUrl)}` : ''}`;
    const totals = report?.totals;
    const metrics = [
        ['구글 검색 클릭', totals ? num(totals.clicks) : '—'],
        ['구글 검색 노출', totals ? num(totals.impressions) : '—'],
        ['클릭률', totals ? `${(totals.ctr * 100).toFixed(1)}%` : '—'],
        ['평균 게재순위', totals ? totals.position.toFixed(1) : '—'],
    ];
    return (
        <section className="min-w-0" aria-label="실제 검색어 분석">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="m-0 text-h5">실제 검색어</h2>
                    <p className="mb-0 mt-2 text-sm leading-6 text-slate">
                        구글 검색에서 홈페이지가 노출되거나 클릭된 검색어를 확인하세요.
                    </p>
                </div>
                <a
                    className={`${reportButton} inline-flex items-center`}
                    href={consoleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Search Console 열기
                </a>
            </div>
            <ReportPeriod
                value={range}
                busy={loading}
                onChange={(next) => {
                    setRange(next);
                    setPage(1);
                    setRefresh((value) => value + 1);
                }}
            />
            <p className="text-xs leading-6 text-slate">
                검색어 통계 날짜는 Google 기준(미국 태평양시간)입니다. 확정된 데이터만 표시하며, 오늘 방문 수와 갱신
                시점이 다릅니다.
            </p>
            {loading ? (
                <p role="status" className="rounded-xl bg-soft p-5 text-sm">
                    구글 검색어를 불러오고 있습니다.
                </p>
            ) : (
                <>
                    {error && (
                        <p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">
                            {error}
                        </p>
                    )}
                    {!report && !error && (
                        <p role="status" className="rounded-xl bg-soft p-5 text-sm">
                            {payload?.message || '검색어 조회 설정을 확인해 주세요.'}
                        </p>
                    )}
                    {!report && (
                        <details open className="my-4 rounded-xl border border-line bg-white p-5 text-sm leading-7">
                            <summary className="cursor-pointer font-bold">구글 검색어 연결 안내</summary>
                            <ol className="mb-0 pl-5">
                                <li>
                                    기존 구글시트 서비스 계정의 Google Cloud 프로젝트에서{' '}
                                    <a
                                        className="text-brand underline"
                                        href="https://console.cloud.google.com/apis/library/searchconsole.googleapis.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Google Search Console API
                                    </a>
                                    를 사용 설정합니다.
                                </li>
                                <li>
                                    Search Console에서 해당 사이트를 선택한 뒤{' '}
                                    <strong>설정 → 사용자 및 권한 → 사용자 추가</strong>에서 아래 서비스 계정을
                                    추가합니다. 검색 실적 조회에는 제한된 사용자 권한으로 충분합니다.
                                </li>
                                <li>
                                    Vercel 환경변수 <code>GOOGLE_SEARCH_CONSOLE_SITE_URL</code>에 등록된 속성 주소를
                                    그대로 넣고 재배포합니다.
                                </li>
                            </ol>
                            <dl className="mb-0 grid gap-2 rounded-lg bg-soft p-3 text-xs">
                                <div>
                                    <dt className="font-bold">조회용 서비스 계정</dt>
                                    <dd className="ml-0 break-all">
                                        {payload?.serviceAccount ||
                                            '기존 GOOGLE_SERVICE_ACCOUNT_EMAIL 설정을 확인해 주세요.'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="font-bold">설정된 속성</dt>
                                    <dd className="ml-0 break-all">{payload?.siteUrl || '미설정'}</dd>
                                </div>
                                <div>
                                    <dt className="font-bold">속성 주소 형식</dt>
                                    <dd className="ml-0 break-all">
                                        도메인 속성: sc-domain:medicaladlab.com
                                        <br />
                                        URL 접두어 속성: https://www.medicaladlab.com/
                                    </dd>
                                </div>
                            </dl>
                        </details>
                    )}
                    {report && (
                        <>
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                {metrics.map(([label, value]) => (
                                    <article key={label} className="rounded-xl border border-line bg-white p-4">
                                        <p className="m-0 text-xs font-bold text-slate">{label}</p>
                                        <strong className="mt-2 block text-3xl tabular-nums">{value}</strong>
                                    </article>
                                ))}
                            </div>
                            <p className="text-xs leading-6 text-slate">
                                조회 기간 {report.from} ~ {report.to} ·{' '}
                                {report.lastDataDate
                                    ? `기간 내 마지막 데이터 ${report.lastDataDate}`
                                    : '기간 내 확정 데이터 없음'}{' '}
                                · 조회 {visitTime(report.fetchedAt)} (한국시간)
                            </p>
                            <div className="my-4 flex flex-wrap items-center justify-between gap-3">
                                <label className="grid gap-1 text-xs font-bold">
                                    검색어 찾기
                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(event) => {
                                            setSearch(event.target.value);
                                            setPage(1);
                                        }}
                                        className="h-11 rounded-lg border border-line-strong px-3 text-sm"
                                        placeholder="검색어 입력"
                                    />
                                </label>
                                <button
                                    type="button"
                                    className={reportButton}
                                    disabled={!filtered.length}
                                    onClick={() =>
                                        downloadReportCsv(`구글-검색어-${report.from}-${report.to}.csv`, [
                                            [
                                                '시작일 (PT)',
                                                '종료일 (PT)',
                                                '실제 검색어',
                                                '클릭 수',
                                                '노출 수',
                                                '클릭률 (%)',
                                                '평균 게재순위',
                                            ],
                                            ...filtered.map((row) => [
                                                report.from,
                                                report.to,
                                                row.query,
                                                row.clicks,
                                                row.impressions,
                                                (row.ctr * 100).toFixed(2),
                                                row.position.toFixed(2),
                                            ]),
                                        ])
                                    }
                                >
                                    검색어 CSV 다운로드
                                </button>
                            </div>
                            <p className="text-xs text-slate">
                                검색어 {num(filtered.length)}개 · 클릭 수 내림차순
                                {report.truncated ? ' · 상위 1,000개 표시' : ''}
                            </p>
                            <div className="max-h-[600px] overflow-auto rounded-lg border border-line">
                                <table className="w-full min-w-[560px] text-left text-sm">
                                    <caption className="sr-only">
                                        구글이 공개한 실제 검색어별 클릭, 노출, 클릭률, 평균 게재순위
                                    </caption>
                                    <thead className="sticky top-0 bg-soft text-xs text-slate">
                                        <tr>
                                            {['실제 검색어', '클릭 수', '노출 수', '클릭률', '평균 순위'].map(
                                                (label) => (
                                                    <th scope="col" key={label} className="px-4 py-4">
                                                        {label}
                                                    </th>
                                                ),
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row) => (
                                            <tr key={row.query} className="border-t border-line">
                                                <th scope="row" className="max-w-lg break-words px-4 py-4 font-medium">
                                                    {row.query}
                                                </th>
                                                <td className="px-4 tabular-nums">{num(row.clicks)}</td>
                                                <td className="px-4 tabular-nums">{num(row.impressions)}</td>
                                                <td className="px-4 tabular-nums">{(row.ctr * 100).toFixed(1)}%</td>
                                                <td className="px-4 tabular-nums">{row.position.toFixed(1)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {!filtered.length && (
                                <p className="rounded-lg bg-soft p-5 text-sm">
                                    {search
                                        ? '조건에 맞는 검색어가 없습니다.'
                                        : '이 기간에 구글이 공개한 검색어가 없습니다. 반영 지연이 있을 수 있으니 기간을 넓혀 확인해 주세요.'}
                                </p>
                            )}
                            {pages > 1 && (
                                <nav
                                    className="mt-4 flex items-center justify-end gap-3"
                                    aria-label="검색어 목록 페이지"
                                >
                                    <button
                                        type="button"
                                        className={reportButton}
                                        disabled={current === 1}
                                        onClick={() => setPage(current - 1)}
                                    >
                                        이전
                                    </button>
                                    <span className="text-sm">
                                        {current} / {pages}
                                    </span>
                                    <button
                                        type="button"
                                        className={reportButton}
                                        disabled={current === pages}
                                        onClick={() => setPage(current + 1)}
                                    >
                                        다음
                                    </button>
                                </nav>
                            )}
                            <p className="text-xs leading-6 text-slate">
                                개인정보 보호와 Google 제공 범위에 따라 일부 검색어는 표시되지 않습니다. 상단 전체
                                지표와 검색어별 합계는 다를 수 있습니다. 검색어 통계는 개별 방문자나 문의자의 검색어를
                                뜻하지 않으며, AI 질문 원문과 운영 태그는 포함하지 않습니다.
                            </p>
                        </>
                    )}
                </>
            )}
            <article className="mt-6 rounded-xl border border-line bg-soft p-5">
                <h3 className="m-0 text-sm font-bold">네이버 검색어</h3>
                <p className="text-sm leading-6 text-slate">
                    서치어드바이저에서 홈페이지의 검색 키워드 상위 30개를 확인할 수 있습니다. 네이버 블로그 자체 유입은
                    해당 블로그 통계에서 확인하세요. 실제 방문에 전달된 검색어는 전체 방문 탭에도 표시됩니다.
                </p>
                <a
                    className={`${reportButton} inline-flex items-center`}
                    href="https://searchadvisor.naver.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    네이버 서치어드바이저 열기
                </a>
            </article>
        </section>
    );
}
