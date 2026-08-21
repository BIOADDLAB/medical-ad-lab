'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { mediaItems } from '@/data';
import { getFirebase } from '@/lib/firebase';

type Row = { id: string; slug: string; type: string; title: string; area: string; image: string };

const panel = 'rounded-2xl border border-line bg-white p-5 shadow-[0_7px_24px_rgba(19,43,80,.035)] lg:p-6';
const label = 'grid gap-2 text-xs font-bold text-slate';
const input = 'h-11 rounded-[9px] border border-line-strong px-3.5 text-sm outline-none focus:border-brand';

export function ReferenceManager({ mode }: { mode: 'list' | 'create' }) {
    const firebase = getFirebase();
    const [rows, setRows] = useState<Row[]>([]);
    const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if (!firebase || mode !== 'list') return;
        let alive = true;
        getDocs(query(collection(firebase.db, 'references'), orderBy('createdAt', 'desc')))
            .then((snapshot) => {
                if (!alive) return;
                setRows(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Row, 'id'>) })));
                setStatus('idle');
            })
            .catch((error: unknown) => {
                if (!alive) return;
                setMessage(error instanceof Error ? error.message : '목록을 불러오지 못했습니다.');
                setStatus('error');
            });
        return () => {
            alive = false;
        };
    }, [firebase, mode, reloadKey]);

    const refresh = () => {
        setStatus('loading');
        setReloadKey((key) => key + 1);
    };

    const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!firebase) return;
        const form = event.currentTarget;
        const data = new FormData(form);
        const file = data.get('image') as File | null;
        if (!file || !file.size) {
            setMessage('대표 이미지를 선택해 주세요.');
            setStatus('error');
            return;
        }

        setStatus('saving');
        setMessage('');
        try {
            const slug = String(data.get('slug')).trim();
            const path = `references/${slug}-${Date.now()}-${file.name.replace(/[^\w.-]/g, '')}`;
            const uploaded = await uploadBytes(ref(firebase.storage, path), file, { contentType: file.type });
            const image = await getDownloadURL(uploaded.ref);

            await addDoc(collection(firebase.db, 'references'), {
                slug,
                type: String(data.get('type')),
                title: String(data.get('title')).trim(),
                area: String(data.get('area')).trim(),
                summary: String(data.get('summary') ?? '').trim(),
                image,
                createdAt: serverTimestamp(),
            });

            form.reset();
            setMessage('등록했습니다. 사이트에는 최대 1분 뒤 반영됩니다.');
            setStatus('idle');
            refresh();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : '등록에 실패했습니다.');
            setStatus('error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!firebase || !window.confirm('이 레퍼런스를 삭제할까요?')) return;
        await deleteDoc(doc(firebase.db, 'references', id));
        refresh();
    };

    if (mode === 'create') {
        return (
            <article className={panel}>
                <form className="grid gap-5 lg:grid-cols-2" onSubmit={handleCreate}>
                    <label className={label}>
                        <span>제목</span>
                        <input name="title" required placeholder="예: 환승역 디지털 포스터 패키지" className={input} />
                    </label>
                    <label className={label}>
                        <span>매체</span>
                        <select name="type" defaultValue={mediaItems[0].title} className={input}>
                            {mediaItems.map((item) => (
                                <option key={item.key}>{item.title}</option>
                            ))}
                        </select>
                    </label>
                    <label className={label}>
                        <span>지역</span>
                        <input name="area" required placeholder="예: 서울 송파구" className={input} />
                    </label>
                    <label className={label}>
                        <span>영문 URL</span>
                        <div className="flex h-11 items-center overflow-hidden rounded-[9px] border border-line-strong">
                            <b className="flex h-full items-center bg-field px-3 text-[11px] font-semibold text-muted">
                                /insight/reference/
                            </b>
                            <input
                                name="slug"
                                required
                                pattern="[a-z0-9-]+"
                                placeholder="songpa-subway"
                                className="min-w-0 flex-1 px-2 text-sm outline-none"
                            />
                        </div>
                    </label>
                    <label className={`${label} lg:col-span-2`}>
                        <span>요약</span>
                        <textarea
                            name="summary"
                            rows={3}
                            placeholder="집행 목적과 결과를 간단히 적어주세요."
                            className="rounded-[9px] border border-line-strong p-3 text-sm outline-none focus:border-brand"
                        />
                    </label>
                    <label className={`${label} lg:col-span-2`}>
                        <span>대표 이미지</span>
                        <input
                            name="image"
                            type="file"
                            accept="image/*"
                            required
                            className="rounded-[10px] border border-dashed border-line-strong bg-soft p-3 text-xs"
                        />
                    </label>
                    <div className="flex flex-wrap items-center gap-4 lg:col-span-2">
                        <button className="btn-primary" type="submit" disabled={status === 'saving'}>
                            {status === 'saving' ? '업로드 중...' : '레퍼런스 등록'}
                        </button>
                        {message && (
                            <p
                                className={`m-0 flex-1 rounded-lg p-3 text-[10px] leading-relaxed ${status === 'error' ? 'bg-red-50 text-red-700' : 'bg-soft text-muted'}`}
                            >
                                {message}
                            </p>
                        )}
                    </div>
                </form>
            </article>
        );
    }

    return (
        <article className={panel}>
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h2 className="m-0 text-h5">등록된 레퍼런스</h2>
                    <p className="m-0 mt-1 text-xs text-muted">Firestore에 저장된 실제 데이터입니다.</p>
                </div>
                <button type="button" onClick={refresh} className="text-xs font-bold text-brand">
                    새로고침
                </button>
            </div>

            {status === 'loading' && (
                <p className="m-0 rounded-lg bg-soft p-3 text-[10px] text-muted">불러오는 중...</p>
            )}
            {status === 'error' && <p className="m-0 rounded-lg bg-red-50 p-3 text-[10px] text-red-700">{message}</p>}
            {status === 'idle' && rows.length === 0 && (
                <p className="m-0 rounded-lg bg-soft p-3 text-[10px] text-muted">
                    아직 등록된 레퍼런스가 없습니다. 레퍼런스 등록에서 추가해 주세요.
                </p>
            )}

            {rows.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse whitespace-nowrap">
                        <thead>
                            <tr>
                                {['이미지', '제목', '매체', '지역', ''].map((head) => (
                                    <th
                                        key={head}
                                        className="border-b border-line px-3.5 py-3 text-left text-[9px] font-bold text-muted"
                                    >
                                        {head}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id}>
                                    <td className="border-b border-line px-3.5 py-4">
                                        <Image
                                            className="h-11 w-16 rounded-md object-cover"
                                            src={row.image}
                                            alt=""
                                            width={64}
                                            height={44}
                                        />
                                    </td>
                                    <td className="border-b border-line px-3.5 py-4">
                                        <strong className="text-xs text-ink">{row.title}</strong>
                                        <small className="mt-0.5 block text-[10px] text-muted">/{row.slug}</small>
                                    </td>
                                    <td className="border-b border-line px-3.5 py-4 text-[11px] text-slate">
                                        {row.type}
                                    </td>
                                    <td className="border-b border-line px-3.5 py-4 text-[11px] text-slate">
                                        {row.area}
                                    </td>
                                    <td className="border-b border-line px-3.5 py-4">
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(row.id)}
                                            className="text-[11px] font-bold text-brand"
                                        >
                                            삭제
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </article>
    );
}
