'use client';

import { FormEvent, useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { getFirebase } from '@/lib/firebase';
import { FALLBACK_CATEGORIES } from '@/lib/categories';
import type { Kind } from '@/lib/references';

type Row = { id: string; key: string; title: string; order: number };

const field = 'h-11 rounded-[9px] border border-line-strong px-3.5 text-sm outline-none focus:border-brand';

/** 문서 id 에 종류를 붙여 레퍼런스와 광고 자리가 같은 코드를 따로 쓸 수 있게 한다 */
const docId = (kind: Kind, key: string) => `${kind}__${key}`;

export function CategoryManager({
    kind,
    onNotify,
    onChange,
}: {
    kind: Kind;
    onNotify: (text: string) => void;
    onChange?: () => void;
}) {
    const firebase = getFirebase();
    const [rows, setRows] = useState<Row[]>([]);
    const [status, setStatus] = useState<'loading' | 'idle' | 'saving' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if (!firebase) return;
        let alive = true;
        getDocs(collection(firebase.db, 'categories'))
            .then((snapshot) => {
                if (!alive) return;
                setRows(
                    snapshot.docs
                        .map((item) => {
                            const data = item.data() as Record<string, unknown>;
                            return {
                                id: item.id,
                                kind: String(data.kind ?? ''),
                                key: String(data.key ?? ''),
                                title: String(data.title ?? ''),
                                order: typeof data.order === 'number' ? data.order : Number.MAX_SAFE_INTEGER,
                            };
                        })
                        .filter((item) => item.kind === kind && item.key)
                        .sort((a, b) => a.order - b.order)
                        .map(({ id, key, title, order }) => ({ id, key, title, order })),
                );
                setStatus('idle');
            })
            .catch((error: unknown) => {
                if (!alive) return;
                setMessage(error instanceof Error ? error.message : '카테고리를 불러오지 못했습니다.');
                setStatus('error');
            });
        return () => {
            alive = false;
        };
    }, [firebase, kind, reloadKey]);

    const done = (text: string) => {
        onNotify(text);
        setReloadKey((n) => n + 1);
        onChange?.();
    };

    /** 처음 한 번, 기본 6종을 복사해 넣는다. 이래야 지우거나 이름을 바꿀 수 있다 */
    const seed = async () => {
        if (!firebase) return;
        setStatus('saving');
        setMessage('');
        try {
            const batch = writeBatch(firebase.db);
            FALLBACK_CATEGORIES.forEach((item, index) => {
                batch.set(doc(firebase.db, 'categories', docId(kind, item.key)), { ...item, kind, order: index });
            });
            await batch.commit();
            setStatus('idle');
            done('기본 카테고리를 불러왔습니다.');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : '불러오지 못했습니다.');
            setStatus('error');
        }
    };

    const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!firebase) return;
        const form = event.currentTarget;
        const data = new FormData(form);
        const key = String(data.get('key') ?? '')
            .trim()
            .toLowerCase();
        const title = String(data.get('title') ?? '').trim();

        setStatus('saving');
        setMessage('');
        try {
            if (rows.some((row) => row.key === key)) throw new Error('이미 쓰고 있는 영문 코드입니다.');
            await setDoc(doc(firebase.db, 'categories', docId(kind, key)), {
                kind,
                key,
                title,
                order: rows.length,
                createdAt: serverTimestamp(),
            });
            form.reset();
            setStatus('idle');
            done(`${title} 카테고리를 추가했습니다.`);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : '추가하지 못했습니다.');
            setStatus('error');
        }
    };

    const rename = async (row: Row, title: string) => {
        if (!firebase || !title.trim() || title === row.title) return;
        try {
            await setDoc(doc(firebase.db, 'categories', row.id), { title: title.trim() }, { merge: true });
            done('카테고리 이름을 바꿨습니다.');
        } catch {
            setMessage('이름을 바꾸지 못했습니다.');
            setStatus('error');
        }
    };

    const remove = async (row: Row) => {
        if (!firebase) return;
        const ok = window.confirm(
            `"${row.title}" 카테고리를 지웁니다.\n이미 이 카테고리로 등록한 항목은 목록에 남지만 필터에서 사라집니다.`,
        );
        if (!ok) return;
        try {
            await deleteDoc(doc(firebase.db, 'categories', row.id));
            done('카테고리를 지웠습니다.');
        } catch {
            setMessage('지우지 못했습니다.');
            setStatus('error');
        }
    };

    const move = async (index: number, step: -1 | 1) => {
        if (!firebase) return;
        const next = [...rows];
        const target = index + step;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        setRows(next);
        try {
            const batch = writeBatch(firebase.db);
            next.forEach((row, order) => batch.set(doc(firebase.db, 'categories', row.id), { order }, { merge: true }));
            await batch.commit();
            onChange?.();
        } catch {
            setReloadKey((n) => n + 1);
        }
    };

    if (!firebase) {
        return (
            <p className="m-0 rounded-lg bg-soft p-3 text-[11px] leading-relaxed text-muted">
                Firebase 환경변수를 넣어야 카테고리를 관리할 수 있습니다.
            </p>
        );
    }

    return (
        <div className="grid gap-5">
            {status === 'loading' && <p className="m-0 text-[11px] text-muted">불러오는 중...</p>}

            {status !== 'loading' && rows.length === 0 && (
                <div className="rounded-xl bg-soft p-4">
                    <p className="m-0 text-[11px] leading-relaxed text-muted">
                        아직 저장한 카테고리가 없어 기본 6종이 그대로 쓰이고 있습니다. 이름을 바꾸거나 새로 추가하려면
                        먼저 불러오세요.
                    </p>
                    <button
                        type="button"
                        onClick={seed}
                        className="btn-primary mt-4 min-h-10 px-4 text-xs"
                        disabled={status === 'saving'}
                    >
                        기본 6종 불러오기
                    </button>
                </div>
            )}

            {rows.length > 0 && (
                <ul className="m-0 grid list-none gap-2 p-0">
                    {rows.map((row, index) => (
                        <li
                            key={row.id}
                            className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-line bg-white p-3"
                        >
                            <div className="grid gap-1">
                                <input
                                    defaultValue={row.title}
                                    onBlur={(event) => rename(row, event.target.value)}
                                    aria-label={`${row.title} 이름`}
                                    className="h-9 rounded-lg border border-transparent px-2 text-sm font-bold outline-none hover:border-line focus:border-brand"
                                />
                                <span className="px-2 text-[10px] text-muted">{row.key}</span>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    type="button"
                                    onClick={() => move(index, -1)}
                                    aria-label="위로"
                                    className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted"
                                >
                                    ↑
                                </button>
                                <button
                                    type="button"
                                    onClick={() => move(index, 1)}
                                    aria-label="아래로"
                                    className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted"
                                >
                                    ↓
                                </button>
                                <button
                                    type="button"
                                    onClick={() => remove(row)}
                                    className="h-9 rounded-lg border border-line px-3 text-xs font-bold text-muted"
                                >
                                    삭제
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {rows.length > 0 && (
                <form className="grid gap-3 border-t border-line pt-5 sm:grid-cols-[1fr_1fr_auto]" onSubmit={handleAdd}>
                    <label className="grid gap-2 text-xs font-bold text-slate">
                        <span>이름</span>
                        <input name="title" required placeholder="예: 엘리베이터 광고" className={field} />
                    </label>
                    <label className="grid gap-2 text-xs font-bold text-slate">
                        <span>영문 코드 · 주소에 쓰입니다</span>
                        <input
                            name="key"
                            required
                            pattern="[a-z0-9-]+"
                            placeholder="elevator"
                            title="영문 소문자, 숫자, 하이픈만"
                            className={field}
                        />
                    </label>
                    <button className="btn-primary min-h-11 self-end px-5 text-xs" disabled={status === 'saving'}>
                        추가
                    </button>
                </form>
            )}

            {message && (
                <p className="m-0 rounded-lg bg-red-50 p-3 text-[11px] leading-relaxed text-red-700">{message}</p>
            )}
        </div>
    );
}
