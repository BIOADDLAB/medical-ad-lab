'use client';

import { useEffect, useMemo, useState } from 'react';
import { getIdToken, type User } from 'firebase/auth';
import { trafficLabel, visitAttribution } from '@/lib/traffic';
import type { VisitRecord } from '@/lib/visit';

type VisitPayload = { ready: boolean; visits: VisitRecord[]; truncated: boolean; message?: string };
type Props = { user: User; onViewDetails: () => void };
const dayKST = (value: number) => new Date(value + 9 * 3600000).toISOString().slice(0, 10);
const dayLabel = (value: string) => value.slice(5).replace('-', '.');
const num = (value: number) => value.toLocaleString('ko-KR');
const sourceLabel = (visit: VisitRecord) => {
    const { source, medium } = visitAttribution(visit);
    return trafficLabel(source, medium);
};

export function TrafficOverview({ user, onViewDetails }: Props) {
    const [payload, setPayload] = useState<VisitPayload | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [refresh, setRefresh] = useState(0);
    const [asOf, setAsOf] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        const run = async () => {
            setLoading(true);
            setError('');
            const today = Date.now();
            const from = dayKST(today - 6 * 86400000);
            const to = dayKST(today);
            try {
                const token = await getIdToken(user);
                const response = await fetch(`/api/admin/visits?from=${from}&to=${to}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: 'no-store',
                    signal: controller.signal,
                });
                const result = (await response.json()) as VisitPayload;
                if (!response.ok) throw new Error(result.message || '방문 현황을 불러오지 못했습니다.');
                if (!controller.signal.aborted) {
                    setPayload(result);
                    setAsOf(dayKST(Date.now()));
                }
            } catch (cause) {
                if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '방문 조회 실패');
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };
        void run();
        return () => controller.abort();
    }, [user, refresh]);

    const summary = useMemo(() => {
        const visits = payload?.visits || [];
        const now = Date.now();
        const days = Array.from({ length: 7 }, (_, index) => dayKST(now - (6 - index) * 86400000));
        const daily = days.map((date) => ({ date, count: 0 }));
        const channels = new Map<string, number>();
        const landing = new Map<string, { title: string; count: number }>();
        const today = dayKST(now);
        let todayVisits = 0;
        let aiVisits = 0;
        let linked = 0;
        const todayIds = new Set<string>();

        for (const visit of visits) {
            const date = dayKST(Date.parse(visit.startedAt));
            const cell = daily.find((item) => item.date === date);
            if (cell) cell.count++;
            if (date === today) {
                todayVisits++;
                todayIds.add(visit.visitorId);
            }
            const label = sourceLabel(visit);
            channels.set(label, (channels.get(label) || 0) + 1);
            if (visitAttribution(visit).medium === 'ai') aiVisits++;
            if (visit.inquiryAt || visit.hospital) linked++;
            const path = (() => {
                try {
                    return new URL(visit.landingUrl).pathname;
                } catch {
                    return '';
                }
            })();
            if (path) {
                const previous = landing.get(path);
                landing.set(path, {
                    title: visit.landingTitle || previous?.title || (path === '/' ? '메인 페이지' : path),
                    count: (previous?.count || 0) + 1,
                });
            }
        }
        const sorted = (map: Map<string, number>) => [...map].sort((a, b) => b[1] - a[1]).slice(0, 5);
        return {
            total: visits.length,
            todayVisits,
            todayUnique: todayIds.size,
            aiVisits,
            linked,
            daily,
            channels: sorted(channels),
            landing: [...landing].sort((a, b) => b[1].count - a[1].count).slice(0, 5),
        };
    }, [payload]);

    const metrics: [string, string, string][] = [
        ['오늘 총 방문', num(summary.todayVisits), '재방문 포함 · 세션 기준'],
        ['오늘 고유 방문자', num(summary.todayUnique), '브라우저 ID 기준'],
        ['최근 7일 방문', num(summary.total), '오늘 포함 · 세션 기준'],
        ['최근 7일 AI 유입', num(summary.aiVisits), '출처가 확인된 방문만'],
    ];
    const maxDay = Math.max(1, ...summary.daily.map((item) => item.count));
    const maxChannel = Math.max(1, ...summary.channels.map(([, count]) => count));

    return (
        <section className="mb-7" aria-label="홈페이지 방문 분석">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="m-0 text-h5">홈페이지 방문 현황</h2>
                    <p className="mb-0 mt-1 text-xs leading-5 text-muted">
                        한국시간 기준 · 같은 사람의 재방문은 별도 방문으로 집계 · 새로고침은 중복 집계하지 않음
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setRefresh((x) => x + 1)} className="text-xs font-bold text-brand">
                        새로고침
                    </button>
                    <button type="button" onClick={onViewDetails} className="text-xs font-bold text-brand">
                        방문 상세 보기
                    </button>
                </div>
            </div>
            {error ? (
                <div role="alert" className="rounded-xl border border-red-200 bg-white p-5 text-sm text-red-700">{error}</div>
            ) : !loading && payload && !payload.ready ? (
                <div className="rounded-xl border border-line bg-white p-5 text-sm text-muted">
                    {payload.message || '방문 기록 저장소 연결 후 집계를 확인할 수 있습니다.'}
                </div>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {metrics.map(([label, value, note]) => (
                            <div key={label} className="rounded-2xl border border-line bg-white p-5 shadow-[0_7px_24px_rgba(19,43,80,.035)]">
                                <span className="text-xs text-muted">{label}</span>
                                <strong className="mt-2 block text-h3 tabular-nums">{loading ? '—' : value}</strong>
                                <small className="mt-2 block text-xs text-muted">{note}</small>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 grid gap-4 xl:grid-cols-3">
                        <article className="rounded-2xl border border-line bg-white p-5">
                            <h3 className="m-0 text-sm font-bold">일별 방문 추이</h3>
                            <div className="mt-5 flex h-36 items-end gap-2" aria-label="최근 7일 일별 방문 횟수">
                                {summary.daily.map(({ date, count }) => (
                                    <div key={date} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                                        <span className="text-[11px] tabular-nums text-muted">{loading ? '-' : count}</span>
                                        <div className="flex h-24 w-full items-end rounded-md bg-soft">
                                            <div className="w-full rounded-md bg-brand transition-[height]" style={{ height: `${(count / maxDay) * 100}%` }} />
                                        </div>
                                        <span className="whitespace-nowrap text-[10px] text-muted">{dayLabel(date)}</span>
                                    </div>
                                ))}
                            </div>
                        </article>
                        <article className="rounded-2xl border border-line bg-white p-5">
                            <h3 className="m-0 text-sm font-bold">주요 유입 경로</h3>
                            <div className="mt-4 grid gap-3">
                                {summary.channels.map(([source, count]) => (
                                    <div key={source}>
                                        <div className="flex justify-between gap-3 text-xs">
                                            <span className="truncate" title={source}>{source}</span>
                                            <strong className="tabular-nums">{num(count)}회</strong>
                                        </div>
                                        <div className="mt-1.5 h-1.5 rounded-full bg-soft">
                                            <div className="h-full rounded-full bg-brand" style={{ width: `${(count / maxChannel) * 100}%` }} />
                                        </div>
                                    </div>
                                ))}
                                {!summary.channels.length && <p className="text-xs text-muted">아직 방문 기록이 없습니다.</p>}
                            </div>
                        </article>
                        <article className="rounded-2xl border border-line bg-white p-5">
                            <h3 className="m-0 text-sm font-bold">인기 첫 방문 페이지</h3>
                            <ol className="mt-4 grid list-none gap-3 p-0">
                                {summary.landing.map(([path, item], index) => (
                                    <li key={path} className="flex items-start gap-3 text-xs">
                                        <span className="text-slate">{index + 1}.</span>
                                        <span className="min-w-0 flex-1 break-words">{item.title}<small className="mt-0.5 block truncate text-muted" title={path}>{path}</small></span>
                                        <strong className="shrink-0 tabular-nums">{num(item.count)}회</strong>
                                    </li>
                                ))}
                                {!summary.landing.length && <li className="text-xs text-muted">아직 방문 기록이 없습니다.</li>}
                            </ol>
                        </article>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-muted">
                        최근 7일 문의 연결 확인 {loading ? '—' : num(summary.linked)}건 · 출처 정보가 전달되지 않은 AI 추천은 직접 방문·출처 미확인으로 표시됩니다.
                        {payload?.truncated ? ' 조회 가능한 최근 1,000건 기준이며 실제 방문 수는 더 많을 수 있습니다.' : ''}
                        {asOf ? ` · 조회 기준 ${asOf} (KST)` : ''}
                    </p>
                </>
            )}
        </section>
    );
}
