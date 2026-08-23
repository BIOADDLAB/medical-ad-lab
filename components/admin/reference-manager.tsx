'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    serverTimestamp,
    updateDoc,
    writeBatch,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { mediaItems } from '@/data';
import { getFirebase } from '@/lib/firebase';

type Row = {
    id: string;
    slug: string;
    type: string;
    title: string;
    area: string;
    image: string;
    summary: string;
    order: number;
};

const panel = 'rounded-2xl border border-line bg-white p-5 shadow-[0_7px_24px_rgba(19,43,80,.035)] lg:p-6';
const label = 'grid gap-2 text-xs font-bold text-slate';
const input = 'h-11 rounded-[9px] border border-line-strong px-3.5 text-sm outline-none focus:border-brand';
const textarea = 'rounded-[9px] border border-line-strong p-3 text-sm outline-none focus:border-brand';

const readRows = (snapshot: Awaited<ReturnType<typeof getDocs>>) =>
    snapshot.docs
        .map((item) => {
            const data = item.data() as Record<string, unknown>;
            return {
                id: item.id,
                slug: String(data.slug ?? ''),
                type: String(data.type ?? ''),
                title: String(data.title ?? ''),
                area: String(data.area ?? ''),
                image: String(data.image ?? ''),
                summary: String(data.summary ?? ''),
                order: typeof data.order === 'number' ? data.order : Number.MAX_SAFE_INTEGER,
            } satisfies Row;
        })
        .sort((a, b) => a.order - b.order);

const uploadImage = async (file: File, slug: string) => {
    const firebase = getFirebase();
    if (!firebase) throw new Error('Firebase 연결을 확인해 주세요.');

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
    const path = `references/${slug}-${Date.now()}-${safeName || 'image'}`;
    const uploaded = await uploadBytes(ref(firebase.storage, path), file, { contentType: file.type });
    return getDownloadURL(uploaded.ref);
};

export function ReferenceManager({ mode }: { mode: 'list' | 'create' }) {
    const firebase = getFirebase();
    const [rows, setRows] = useState<Row[]>([]);
    const [filter, setFilter] = useState('all');
    const [editing, setEditing] = useState<Row | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>(
        mode === 'list' ? 'loading' : 'idle',
    );
    const [message, setMessage] = useState('');
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if (!firebase || mode !== 'list') return;

        let alive = true;

        getDocs(collection(firebase.db, 'references'))
            .then((snapshot) => {
                if (!alive) return;
                setRows(readRows(snapshot));
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

    const visibleRows = useMemo(
        () => (filter === 'all' ? rows : rows.filter((row) => row.type === filter)),
        [filter, rows],
    );

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
        const slug = String(data.get('slug') ?? '').trim();

        if (!file?.size) {
            setMessage('대표 이미지를 선택해 주세요.');
            setStatus('error');
            return;
        }

        setStatus('saving');
        setMessage('');

        try {
            const snapshot = await getDocs(collection(firebase.db, 'references'));
            const currentRows = readRows(snapshot);

            if (currentRows.some((row) => row.slug === slug)) {
                throw new Error('이미 사용 중인 영문 URL입니다.');
            }

            const image = await uploadImage(file, slug);
            const batch = writeBatch(firebase.db);
            const referenceDoc = doc(collection(firebase.db, 'references'));

            batch.set(referenceDoc, {
                slug,
                type: String(data.get('type') ?? ''),
                title: String(data.get('title') ?? '').trim(),
                area: String(data.get('area') ?? '').trim(),
                summary: String(data.get('summary') ?? '').trim(),
                image,
                order: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            currentRows.forEach((row, index) => {
                batch.update(doc(firebase.db, 'references', row.id), { order: index + 1 });
            });

            await batch.commit();
            form.reset();
            setMessage('등록했습니다. 사이트에는 최대 1분 뒤 반영됩니다.');
            setStatus('idle');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : '등록에 실패했습니다.');
            setStatus('error');
        }
    };

    const handleEdit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!firebase || !editing) return;

        const data = new FormData(event.currentTarget);
        const slug = String(data.get('slug') ?? '').trim();
        const file = data.get('image') as File | null;

        setStatus('saving');
        setMessage('');

        try {
            if (rows.some((row) => row.id !== editing.id && row.slug === slug)) {
                throw new Error('이미 사용 중인 영문 URL입니다.');
            }

            const nextImage = file?.size ? await uploadImage(file, slug) : editing.image;

            await updateDoc(doc(firebase.db, 'references', editing.id), {
                slug,
                type: String(data.get('type') ?? ''),
                title: String(data.get('title') ?? '').trim(),
                area: String(data.get('area') ?? '').trim(),
                summary: String(data.get('summary') ?? '').trim(),
                image: nextImage,
                updatedAt: serverTimestamp(),
            });

            if (file?.size && editing.image !== nextImage) {
                deleteObject(ref(firebase.storage, editing.image)).catch(() => undefined);
            }

            setEditing(null);
            setMessage('수정했습니다.');
            setStatus('idle');
            refresh();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : '수정에 실패했습니다.');
            setStatus('error');
        }
    };

    const handleDelete = async (row: Row) => {
        if (!firebase || !window.confirm('이 레퍼런스를 삭제할까요?')) return;

        setStatus('saving');
        try {
            await deleteDoc(doc(firebase.db, 'references', row.id));
            deleteObject(ref(firebase.storage, row.image)).catch(() => undefined);
            setRows((current) => current.filter((item) => item.id !== row.id));
            setStatus('idle');
            setMessage('삭제했습니다.');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : '삭제하지 못했습니다.');
            setStatus('error');
        }
    };

    const handleDrop = async (targetId: string) => {
        if (!firebase || !draggingId || draggingId === targetId || filter !== 'all') return;

        const fromIndex = rows.findIndex((row) => row.id === draggingId);
        const targetIndex = rows.findIndex((row) => row.id === targetId);
        if (fromIndex < 0 || targetIndex < 0) return;

        const reordered = [...rows];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(targetIndex, 0, moved);

        setRows(reordered);
        setDraggingId(null);
        setStatus('saving');

        try {
            const batch = writeBatch(firebase.db);
            reordered.forEach((row, index) => {
                batch.update(doc(firebase.db, 'references', row.id), { order: index, updatedAt: serverTimestamp() });
            });
            await batch.commit();
            setMessage('노출 순서를 저장했습니다.');
            setStatus('idle');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : '순서를 저장하지 못했습니다.');
            setStatus('error');
            refresh();
        }
    };

    if (mode === 'create') {
        return (
            <article className={panel}>
                <form className="grid gap-5 md:grid-cols-2" onSubmit={handleCreate}>
                    <label className={label}>
                        <span>제목</span>
                        <input name="title" required placeholder="예: 환승역 디지털 포스터 패키지" className={input} />
                    </label>
                    <label className={label}>
                        <span>카테고리</span>
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
                    <label className={`${label} md:col-span-2`}>
                        <span>요약</span>
                        <textarea
                            name="summary"
                            rows={3}
                            required
                            maxLength={240}
                            placeholder="집행 위치, 목적과 매체 구성을 간단히 적어주세요."
                            className={textarea}
                        />
                    </label>
                    <label className={`${label} md:col-span-2`}>
                        <span>대표 이미지</span>
                        <input
                            name="image"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            required
                            className="rounded-[10px] border border-dashed border-line-strong bg-soft p-3 text-xs"
                        />
                    </label>
                    <div className="flex flex-wrap items-center gap-4 md:col-span-2">
                        <button className="btn-primary w-full sm:w-auto" type="submit" disabled={status === 'saving'}>
                            {status === 'saving' ? '업로드 중...' : '레퍼런스 등록'}
                        </button>
                        {message && (
                            <p
                                className={`m-0 flex-1 rounded-lg p-3 text-[11px] leading-relaxed ${
                                    status === 'error' ? 'bg-red-50 text-red-700' : 'bg-soft text-muted'
                                }`}
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
        <>
            <article className={panel}>
                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="m-0 text-h5">등록된 레퍼런스</h2>
                        <p className="m-0 mt-1 text-xs text-muted">
                            전체 탭에서 카드를 끌어 사이트 노출 순서를 바꿀 수 있습니다.
                        </p>
                    </div>
                    <button type="button" onClick={refresh} className="text-xs font-bold text-brand">
                        새로고침
                    </button>
                </div>

                <div className="mb-6 flex flex-wrap gap-2" aria-label="레퍼런스 카테고리 필터">
                    <button
                        type="button"
                        onClick={() => setFilter('all')}
                        className={`h-9 rounded-full px-4 text-xs font-bold ${
                            filter === 'all' ? 'bg-brand text-white' : 'border border-line bg-white text-muted'
                        }`}
                    >
                        전체 {rows.length}
                    </button>
                    {mediaItems.map((item) => {
                        const count = rows.filter((row) => row.type === item.title).length;
                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setFilter(item.title)}
                                className={`h-9 rounded-full px-4 text-xs font-bold ${
                                    filter === item.title
                                        ? 'bg-brand text-white'
                                        : 'border border-line bg-white text-muted'
                                }`}
                            >
                                {item.title.replace(' 광고', '')} {count}
                            </button>
                        );
                    })}
                </div>

                {message && (
                    <p
                        className={`mb-5 mt-0 rounded-lg p-3 text-[11px] ${
                            status === 'error' ? 'bg-red-50 text-red-700' : 'bg-soft text-muted'
                        }`}
                    >
                        {message}
                    </p>
                )}

                {status === 'loading' && (
                    <p className="m-0 rounded-lg bg-soft p-3 text-[11px] text-muted">불러오는 중...</p>
                )}

                {status !== 'loading' && rows.length === 0 && (
                    <p className="m-0 rounded-lg bg-soft p-3 text-[11px] text-muted">
                        아직 등록된 레퍼런스가 없습니다. 레퍼런스 등록에서 추가해 주세요.
                    </p>
                )}

                {visibleRows.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                        {visibleRows.map((row) => (
                            <article
                                key={row.id}
                                draggable={filter === 'all' && status !== 'saving'}
                                onDragStart={() => setDraggingId(row.id)}
                                onDragEnd={() => setDraggingId(null)}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={() => handleDrop(row.id)}
                                className={`group overflow-hidden rounded-xl border bg-white transition ${
                                    draggingId === row.id
                                        ? 'border-brand opacity-50'
                                        : 'border-line hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lg'
                                }`}
                            >
                                <div className="relative aspect-[16/10] bg-brand-tint">
                                    <Image
                                        src={row.image}
                                        alt={`${row.title} 레퍼런스`}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                                    />
                                    {filter === 'all' && (
                                        <span className="absolute left-3 top-3 hidden rounded-full bg-deep/80 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur-sm md:inline-flex">
                                            끌어서 순서 변경
                                        </span>
                                    )}
                                </div>

                                <div className="p-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="rounded-md bg-brand-pale px-2 py-1 text-[10px] font-extrabold text-brand">
                                            {row.type}
                                        </span>
                                        <span className="text-[10px] text-muted">{row.area}</span>
                                    </div>
                                    <h3 className="mb-2 mt-3 text-[18px] font-extrabold text-ink">{row.title}</h3>
                                    <p className="m-0 min-h-10 text-xs leading-5 text-muted">
                                        {row.summary || '등록된 요약이 없습니다.'}
                                    </p>
                                    <small className="mt-3 block truncate text-[10px] text-subtle">
                                        /insight/reference/{row.slug}
                                    </small>

                                    <div className="mt-5 grid grid-cols-2 gap-2 border-t border-line pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setEditing(row)}
                                            className="h-10 rounded-lg bg-brand text-xs font-bold text-white"
                                        >
                                            수정
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(row)}
                                            className="h-10 rounded-lg border border-line-strong text-xs font-bold text-muted"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {rows.length > 0 && visibleRows.length === 0 && (
                    <p className="m-0 rounded-lg bg-soft p-8 text-center text-xs text-muted">
                        해당 카테고리에 등록된 레퍼런스가 없습니다.
                    </p>
                )}
            </article>

            {editing && (
                <div className="fixed inset-0 z-[200] grid place-items-center bg-deep/60 p-3 backdrop-blur-sm sm:p-4">
                    <section className="admin-scroll max-h-[calc(100dvh-24px)] w-full max-w-[680px] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:max-h-[92vh] sm:p-6 lg:p-8">
                        <div className="mb-6 flex items-start justify-between gap-4">
                            <div>
                                <p className="m-0 text-[10px] font-extrabold tracking-[.12em] text-brand">EDIT REFERENCE</p>
                                <h2 className="mb-0 mt-2 text-h4">레퍼런스 수정</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditing(null)}
                                className="grid h-9 w-9 place-items-center rounded-full bg-field text-lg text-muted"
                                aria-label="수정 창 닫기"
                            >
                                ×
                            </button>
                        </div>

                        <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleEdit}>
                            <label className={label}>
                                <span>제목</span>
                                <input name="title" required defaultValue={editing.title} className={input} />
                            </label>
                            <label className={label}>
                                <span>카테고리</span>
                                <select name="type" defaultValue={editing.type} className={input}>
                                    {mediaItems.map((item) => (
                                        <option key={item.key}>{item.title}</option>
                                    ))}
                                </select>
                            </label>
                            <label className={label}>
                                <span>지역</span>
                                <input name="area" required defaultValue={editing.area} className={input} />
                            </label>
                            <label className={label}>
                                <span>영문 URL</span>
                                <input
                                    name="slug"
                                    required
                                    pattern="[a-z0-9-]+"
                                    defaultValue={editing.slug}
                                    className={input}
                                />
                            </label>
                            <label className={`${label} sm:col-span-2`}>
                                <span>요약</span>
                                <textarea
                                    name="summary"
                                    required
                                    rows={4}
                                    maxLength={240}
                                    defaultValue={editing.summary}
                                    className={textarea}
                                />
                            </label>
                            <label className={`${label} sm:col-span-2`}>
                                <span>대표 이미지 교체 · 선택하지 않으면 기존 이미지 유지</span>
                                <div className="grid gap-3 rounded-xl bg-soft p-3 sm:grid-cols-[120px_1fr] sm:items-center">
                                    <div className="relative aspect-[16/10] overflow-hidden rounded-lg">
                                        <Image src={editing.image} alt="현재 대표 이미지" fill className="object-cover" />
                                    </div>
                                    <input name="image" type="file" accept="image/png,image/jpeg,image/webp" className="text-xs" />
                                </div>
                            </label>
                            <div className="flex justify-end gap-2 sm:col-span-2">
                                <button
                                    type="button"
                                    onClick={() => setEditing(null)}
                                    className="h-11 rounded-lg border border-line-strong px-5 text-xs font-bold text-muted"
                                >
                                    취소
                                </button>
                                <button className="btn-primary" type="submit" disabled={status === 'saving'}>
                                    {status === 'saving' ? '저장 중...' : '수정 저장'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </>
    );
}
