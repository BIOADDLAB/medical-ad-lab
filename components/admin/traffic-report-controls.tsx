'use client';

import { useState } from 'react';
import { dayKST, recentRange, validReportRange, type ReportRange } from '@/lib/traffic-report';

export const reportButton =
    'min-h-11 rounded-lg border border-line-strong bg-white px-4 text-sm font-bold hover:bg-soft focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50';
export const reportNumber = (value: number) => value.toLocaleString('ko-KR');
export const reportRate = (count: number, total: number) => (total ? `${((count / total) * 100).toFixed(1)}%` : '—');

export function ReportPeriod({
    value,
    onChange,
    busy,
}: {
    value: ReportRange;
    onChange: (range: ReportRange) => void;
    busy: boolean;
}) {
    const [draft, setDraft] = useState(value);
    const [error, setError] = useState('');
    const apply = (range: ReportRange) => {
        if (!validReportRange(range.from, range.to)) {
            setError('오늘까지 최대 90일 범위로 선택해 주세요.');
            return;
        }
        setError('');
        setDraft(range);
        onChange(range);
    };
    return (
        <form
            className="mb-5"
            onSubmit={(event) => {
                event.preventDefault();
                apply(draft);
            }}
        >
            <div className="flex flex-wrap items-end gap-2">
                {[1, 7, 30].map((days) => (
                    <button
                        key={days}
                        type="button"
                        className={reportButton}
                        disabled={busy}
                        onClick={() => apply(recentRange(days))}
                    >
                        {days === 1 ? '오늘' : `최근 ${days}일`}
                    </button>
                ))}
                {(['from', 'to'] as const).map((key) => (
                    <label key={key} className="grid gap-1 text-xs font-bold">
                        {key === 'from' ? '시작일' : '종료일'}
                        <input
                            type="date"
                            required
                            max={dayKST()}
                            value={draft[key]}
                            onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                            className="h-11 min-w-0 rounded-lg border border-line-strong bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-brand"
                        />
                    </label>
                ))}
                <button type="submit" className={reportButton} disabled={busy}>
                    {busy ? '조회 중…' : '조회 / 새로고침'}
                </button>
            </div>
            {error && (
                <p role="alert" className="mb-0 text-sm text-red-800">
                    {error}
                </p>
            )}
        </form>
    );
}

export function downloadReportCsv(filename: string, rows: (string | number)[][]) {
    const cell = (value: string | number) => {
        const text = String(value);
        return `"${(/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replace(/"/g, '""')}"`;
    };
    const url = URL.createObjectURL(
        new Blob(['\uFEFF' + rows.map((row) => row.map(cell).join(',')).join('\r\n')], {
            type: 'text/csv;charset=utf-8;',
        }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
