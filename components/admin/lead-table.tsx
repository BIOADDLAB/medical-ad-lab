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
            <p className="m-0 rounded-lg bg-soft p-3 text-[12px] leading-relaxed text-muted">
                구글시트 환경변수를 넣으면 접수된 문의가 여기 표시됩니다.
            </p>
        );
    if (!data.leads.length) return <p className="m-0 text-xs text-muted">아직 접수된 문의가 없습니다.</p>;

    return (
        <>
            <div className="admin-scroll grid max-h-[560px] gap-3 overflow-y-auto md:hidden">
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
                                <dd className="m-0 text-slate">{lead.source || '-'}</dd>
                            </div>
                        </dl>
                    </article>
                ))}
            </div>
            <div className="admin-scroll hidden max-h-[560px] overflow-auto md:block">
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
        </>
    );
}
