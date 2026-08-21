'use client';

import { useEffect, useState } from 'react';
import { getIdToken, type User } from 'firebase/auth';
import type { LeadRow } from '@/lib/lead';

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
            <p className="m-0 rounded-lg bg-soft p-3 text-[11px] leading-relaxed text-muted">
                구글시트 환경변수를 넣으면 접수된 문의가 여기 표시됩니다.
            </p>
        );
    if (!data.leads.length) return <p className="m-0 text-xs text-muted">아직 접수된 문의가 없습니다.</p>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-xs">
                <thead>
                    <tr className="border-b border-line-strong text-left text-muted">
                        {['접수일시', '병원명', '지역', '연락처', '이메일', '유입경로', '상태'].map((label) => (
                            <th key={label} className="whitespace-nowrap py-3 pr-4 font-bold">
                                {label}
                            </th>
                        ))}
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
                            <td className="py-3 pr-4">{lead.source || '-'}</td>
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
    );
}
