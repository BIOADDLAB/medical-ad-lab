'use client';

import { useEffect, useState } from 'react';
import { getIdToken, type User } from 'firebase/auth';
import { evidenceLabel, isHttpUrl } from '@/lib/traffic';
import { dayKST, recentRange, type ReportRange, type TrafficReportPayload } from '@/lib/traffic-report';
import { visitTime } from '@/lib/visit';
import {
    ReportPeriod,
    downloadReportCsv,
    reportButton,
    reportNumber as num,
    reportRate as rate,
} from './traffic-report-controls';

type Props = {
    user: User;
    onViewDetails?: () => void;
    range?: ReportRange;
    refreshKey?: number;
    aiOnly?: boolean;
};
function PageLink({ url, title }: { url: string; title: string }) {
    return isHttpUrl(url) ? (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="break-words text-brand underline underline-offset-4"
        >
            {title || new URL(url).pathname}
        </a>
    ) : (
        <span>{title || '기록 없음'}</span>
    );
}

export function TrafficOverview({ user, onViewDetails, range, refreshKey = 0, aiOnly = false }: Props) {
    const [selected, setSelected] = useState(() => recentRange());
    const [refresh, setRefresh] = useState(0);
    const [payload, setPayload] = useState<TrafficReportPayload | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const { from, to } = range || selected;
    useEffect(() => {
        const controller = new AbortController();
        const run = async () => {
            setLoading(true);
            setError('');
            setPayload(null);
            try {
                const response = await fetch(`/api/admin/traffic-report?${new URLSearchParams({ from, to })}`, {
                    headers: { Authorization: `Bearer ${await getIdToken(user)}` },
                    cache: 'no-store',
                    signal: controller.signal,
                });
                const result = (await response.json()) as TrafficReportPayload;
                if (!response.ok) throw new Error(result.message || '방문 성과를 불러오지 못했습니다.');
                if (!controller.signal.aborted) setPayload(result);
            } catch (cause) {
                if (!controller.signal.aborted)
                    setError(cause instanceof Error ? cause.message : '방문 성과 조회 실패');
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };
        void run();
        return () => controller.abort();
    }, [user, from, to, refresh, refreshKey]);

    const report = payload?.report;
    const metrics: [string, string, string][] = !report
        ? []
        : aiOnly
          ? [
                ['AI 유입 방문', num(report.aiVisits), '출처가 식별된 방문'],
                ['AI 문의 발생 방문', num(report.aiConvertedVisits), '한 방문은 최대 1회 집계'],
                ['AI 문의 전환율', rate(report.aiConvertedVisits, report.aiVisits), '문의 발생 방문 ÷ AI 방문'],
                ['전체 방문 중 AI', rate(report.aiVisits, report.visits), 'AI 방문 ÷ 전체 방문'],
            ]
          : [
                ['방문 횟수', num(report.visits), '같은 브라우저 재방문 포함'],
                ['고유 방문자', num(report.uniqueVisitors), '브라우저 ID 중복 제외'],
                ['AI 유입 방문', num(report.aiVisits), '출처가 식별된 방문'],
                ['문의 발생 방문', num(report.convertedVisits), '한 방문은 최대 1회 집계'],
                ['문의 전환율', rate(report.convertedVisits, report.visits), '문의 발생 방문 ÷ 전체 방문'],
            ];
    const dailyMax = Math.max(1, ...(report?.daily || []).map((item) => (aiOnly ? item.aiVisits : item.visits)));
    const channels = aiOnly ? report?.platforms || [] : (report?.channels || []).slice(0, 5);
    const landings = aiOnly ? report?.aiLandings || [] : report?.landings || [];

    return (
        <section className="mb-7 min-w-0" aria-label={aiOnly ? 'AI 유입 성과' : '방문 성과 요약'}>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="m-0 text-h5">{aiOnly ? 'AI 유입 성과' : '홈페이지 방문 현황'}</h2>
                    <p className="mb-0 mt-1 text-xs leading-5 text-slate">
                        {from} ~ {to} · 한국시간 · 방문 시작일 기준
                    </p>
                </div>
                {onViewDetails && (
                    <button type="button" className={reportButton} onClick={onViewDetails}>
                        방문 상세 보기
                    </button>
                )}
            </div>
            {!range && (
                <ReportPeriod
                    value={selected}
                    busy={loading}
                    onChange={(next) => {
                        setSelected(next);
                        setRefresh((value) => value + 1);
                    }}
                />
            )}
            {loading ? (
                <p role="status" className="rounded-xl bg-soft p-5 text-sm">
                    선택 기간 전체 방문을 집계하고 있습니다.
                </p>
            ) : error ? (
                <div role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">
                    {error}
                    <button type="button" onClick={() => setRefresh((value) => value + 1)} className="ml-3 underline">
                        다시 조회
                    </button>
                </div>
            ) : !payload?.ready || !report ? (
                <p role="status" className="rounded-xl bg-soft p-5 text-sm">
                    {payload?.message || '방문 저장소 연결이 필요합니다.'}
                </p>
            ) : (
                <>
                    {onViewDetails && from <= dayKST() && to >= dayKST() && (
                        <p className="text-sm">
                            오늘 방문 <strong>{num(report.todayVisits)}회</strong> · 오늘 고유 방문자{' '}
                            <strong>{num(report.todayUnique)}명</strong>
                        </p>
                    )}
                    <div className={`grid gap-3 sm:grid-cols-2 ${aiOnly ? 'xl:grid-cols-4' : 'xl:grid-cols-5'}`}>
                        {metrics.map(([label, value, caption]) => (
                            <article key={label} className="rounded-xl border border-line bg-white p-4">
                                <p className="m-0 text-xs font-bold text-slate">{label}</p>
                                <strong className="my-2 block text-3xl tabular-nums">{value}</strong>
                                <p className="m-0 text-xs leading-5 text-muted">{caption}</p>
                            </article>
                        ))}
                    </div>
                    {report.warning && (
                        <p role="status" className="rounded-lg bg-amber-50 p-3 text-xs leading-6 text-amber-900">
                            {report.warning}
                        </p>
                    )}
                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                        <article className="min-w-0 rounded-xl border border-line bg-white p-5">
                            <h3 className="m-0 text-sm font-bold">{aiOnly ? '날짜별 AI 방문' : '날짜별 방문'}</h3>
                            <div className="mt-4 overflow-x-auto">
                                <ol
                                    className="m-0 flex h-40 min-w-full list-none items-end gap-2 p-0"
                                    aria-label="날짜별 방문 횟수"
                                >
                                    {report.daily.map((item) => {
                                        const count = aiOnly ? item.aiVisits : item.visits;
                                        return (
                                            <li
                                                key={item.date}
                                                className="flex h-full min-w-8 flex-1 flex-col items-center justify-end gap-1 text-[10px]"
                                                title={`${item.date}: ${num(count)}회`}
                                            >
                                                <span className="tabular-nums">{num(count)}</span>
                                                <div
                                                    className="w-full max-w-10 rounded-t bg-brand"
                                                    style={{
                                                        height: `${Math.max(count ? 3 : 0, (count / dailyMax) * 100)}px`,
                                                    }}
                                                />
                                                <span className="whitespace-nowrap text-muted">
                                                    {item.date.slice(5).replace('-', '.')}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </div>
                        </article>
                        <article className="min-w-0 rounded-xl border border-line bg-white p-5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="m-0 text-sm font-bold">
                                    {aiOnly ? '플랫폼별 방문·문의' : '유입처 상위 5개'}
                                </h3>
                                {aiOnly && (
                                    <button
                                        type="button"
                                        className="text-xs text-brand underline"
                                        onClick={() =>
                                            downloadReportCsv(`AI-유입-${from}-${to}.csv`, [
                                                [
                                                    '기간 시작',
                                                    '기간 종료',
                                                    '플랫폼',
                                                    '방문',
                                                    '문의 발생 방문',
                                                    '문의 전환율',
                                                ],
                                                ...channels.map((item) => [
                                                    from,
                                                    to,
                                                    item.label,
                                                    item.visits,
                                                    item.convertedVisits,
                                                    rate(item.convertedVisits, item.visits),
                                                ]),
                                            ])
                                        }
                                    >
                                        CSV 다운로드
                                    </button>
                                )}
                            </div>
                            <div className="mt-3 overflow-x-auto">
                                <table className="w-full min-w-[320px] text-left text-xs">
                                    <caption className="sr-only">유입처별 방문과 문의 발생 방문</caption>
                                    <thead className="border-b border-line text-slate">
                                        <tr>
                                            {['유입처', '방문', '문의', '전환율'].map((label) => (
                                                <th scope="col" className="py-3 pr-3" key={label}>
                                                    {label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {channels.map((item) => (
                                            <tr
                                                key={`${item.source}:${item.medium}`}
                                                className="border-b border-line last:border-0"
                                            >
                                                <th scope="row" className="py-3 pr-3 font-medium">
                                                    {item.label}
                                                </th>
                                                <td className="pr-3 tabular-nums">{num(item.visits)}</td>
                                                <td className="pr-3 tabular-nums">{num(item.convertedVisits)}</td>
                                                <td className="tabular-nums">
                                                    {rate(item.convertedVisits, item.visits)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {!channels.length && (
                                    <p className="text-xs text-muted">선택 기간의 방문 기록이 없습니다.</p>
                                )}
                            </div>
                        </article>
                    </div>
                    <article className="mt-4 rounded-xl border border-line bg-white p-5">
                        <h3 className="m-0 text-sm font-bold">
                            {aiOnly ? 'AI에서 처음 들어온 페이지' : '인기 첫 방문 페이지'}
                        </h3>
                        <p className="mt-1 text-xs text-muted">
                            {aiOnly ? '플랫폼과 페이지별 상위 20개' : '방문 횟수 상위 10개'} · 문의는 해당 페이지로
                            진입한 방문에서 발생한 경우입니다.
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[420px] text-left text-xs">
                                <caption className="sr-only">첫 방문 페이지별 성과</caption>
                                <thead className="border-b border-line text-slate">
                                    <tr>
                                        {(aiOnly
                                            ? ['유입처', '첫 페이지', '방문', '문의']
                                            : ['첫 페이지', '방문', '문의']
                                        ).map((label) => (
                                            <th key={label} scope="col" className="py-3 pr-3">
                                                {label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {landings.map((item) => (
                                        <tr
                                            key={`${item.source}:${item.url}`}
                                            className="border-b border-line last:border-0"
                                        >
                                            {aiOnly && <td className="py-3 pr-3">{item.label}</td>}
                                            <td className="max-w-lg py-3 pr-5">
                                                <PageLink url={item.url} title={item.title} />
                                            </td>
                                            <td className="pr-3 tabular-nums">{num(item.visits)}</td>
                                            <td className="tabular-nums">{num(item.convertedVisits)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {!landings.length && (
                            <p className="text-xs text-muted">
                                선택 기간에 {aiOnly ? '출처가 식별된 AI ' : ''}방문이 없습니다.
                            </p>
                        )}
                    </article>
                    {aiOnly && (
                        <article className="mt-4 rounded-xl border border-line bg-white p-5">
                            <h3 className="m-0 text-sm font-bold">최근 AI 방문 20건</h3>
                            <div className="mt-3 overflow-x-auto">
                                <table className="w-full min-w-[620px] text-left text-xs">
                                    <caption className="sr-only">
                                        최근 AI 방문 시각, 출처, 판별 근거, 첫 페이지, 문의 여부
                                    </caption>
                                    <thead className="border-b border-line text-slate">
                                        <tr>
                                            {['방문 시각', '유입처 / 근거', '첫 페이지', '문의'].map((label) => (
                                                <th scope="col" className="py-3 pr-3" key={label}>
                                                    {label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.recentAi.map((item) => (
                                            <tr key={item.id} className="border-b border-line last:border-0">
                                                <td className="whitespace-nowrap py-3 pr-4">{visitTime(item.at)}</td>
                                                <td className="py-3 pr-4">
                                                    {item.label}
                                                    <span className="mt-1 block text-muted">
                                                        {evidenceLabel(item.evidence)}
                                                    </span>
                                                </td>
                                                <td className="max-w-sm py-3 pr-4">
                                                    <PageLink url={item.url} title={item.title} />
                                                </td>
                                                <td>{item.converted ? '문의 연결' : '미확인'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {!report.recentAi.length && (
                                <p className="text-xs text-muted">표시할 AI 방문이 없습니다.</p>
                            )}
                        </article>
                    )}
                    <p className="mt-3 text-xs leading-6 text-slate">
                        전체 {num(report.visits)}회 중 직접 방문·출처 미확인 {num(report.unknownVisits)}회. 출처가
                        전달되지 않은 AI 방문도 여기에 포함될 수 있습니다. 문의 전환율은 문의가 발생한 방문 수를
                        기준으로 하며, 다른 기기나 브라우저의 방문은 연결하지 않습니다.
                        {aiOnly &&
                            ' AI 유입에는 이전 사이트 정보 또는 추적 링크로 식별된 방문이 포함됩니다. 추적 링크는 공유될 수 있으므로 판별 근거를 함께 확인하세요.'}
                        <span className="block">
                            최근 기록 활동 {report.latestVisitAt ? visitTime(report.latestVisitAt) : '기록 없음'} · 집계
                            완료 {visitTime(report.generatedAt)} · 보관 중인 전체 방문 기준
                        </span>
                    </p>
                </>
            )}
        </section>
    );
}
