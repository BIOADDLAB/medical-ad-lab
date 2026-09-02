'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getFirebase } from '@/lib/firebase';
import { type Category, FALLBACK_CATEGORIES } from '@/lib/categories';
import { CategoryManager } from '@/components/admin/category-manager';
import { GOAL_FALLBACK, type Kind, PLAN_FALLBACK, SPOT_GOAL_FALLBACK, SPOT_PLAN_FALLBACK } from '@/lib/references';

type Row = {
    id: string;
    slug: string;
    type: string;
    title: string;
    area: string;
    image: string;
    summary: string;
    goal: string;
    plan: string;
    order: number;
};

const SLUG_GUIDE =
    '주소는 검색 결과에 그대로 노출됩니다. 지역-매체 순서로 짧게 적으세요. 예) songpa-subway, gangnam-bus. 영문 소문자·숫자·하이픈만 되고 한글과 띄어쓰기는 쓸 수 없습니다. 자동 버튼을 누르면 지역과 카테고리로 만들어 줍니다. 한번 정한 주소는 바꾸지 마세요. 바꾸면 기존 검색 순위가 사라집니다.';

/** 영문 URL 자동 제안용. 목록에 없는 지역은 직접 적는다 */
// prettier-ignore
const AREA_ROMAN: Record<string, string> = {
    강남: 'gangnam', 강동: 'gangdong', 강북: 'gangbuk', 강서: 'gangseo', 관악: 'gwanak',
    광진: 'gwangjin', 구로: 'guro', 금천: 'geumcheon', 노원: 'nowon', 도봉: 'dobong',
    동대문: 'dongdaemun', 동작: 'dongjak', 마포: 'mapo', 서대문: 'seodaemun', 서초: 'seocho',
    성동: 'seongdong', 성북: 'seongbuk', 송파: 'songpa', 양천: 'yangcheon', 영등포: 'yeongdeungpo',
    용산: 'yongsan', 은평: 'eunpyeong', 종로: 'jongno', 중랑: 'jungnang', 중구: 'jung',
    부산: 'busan', 대구: 'daegu', 인천: 'incheon', 광주: 'gwangju', 대전: 'daejeon',
    울산: 'ulsan', 세종: 'sejong', 제주: 'jeju', 수원: 'suwon', 성남: 'seongnam',
    용인: 'yongin', 고양: 'goyang', 화성: 'hwaseong', 부천: 'bucheon', 남양주: 'namyangju',
    안산: 'ansan', 평택: 'pyeongtaek', 안양: 'anyang', 시흥: 'siheung', 김포: 'gimpo',
    광명: 'gwangmyeong', 하남: 'hanam', 의정부: 'uijeongbu', 파주: 'paju', 천안: 'cheonan',
    청주: 'cheongju', 전주: 'jeonju', 창원: 'changwon',
};

/** 지역 + 카테고리 = 검색엔진이 읽기 좋은 주소. 예) songpa-subway */
const suggestSlug = (area: string, type: string, categories: Category[]) => {
    // 긴 이름부터 찾아야 중구와 중랑구가 섞이지 않는다
    const matched = Object.keys(AREA_ROMAN)
        .sort((a, b) => b.length - a.length)
        .find((name) => area.includes(name));
    if (!matched) return '';
    const media = categories.find((item) => item.title === type);
    return [AREA_ROMAN[matched], media?.key ?? ''].filter(Boolean).join('-');
};

const panel = 'rounded-2xl border border-line bg-white p-5 shadow-[0_7px_24px_rgba(19,43,80,.035)] lg:p-6';
/* content-start 가 없으면 옆 칸이 길어질 때 라벨 줄이 늘어나 입력칸이 아래로 밀린다 */
const label = 'grid content-start gap-2 text-xs font-bold text-slate';
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
                goal: String(data.goal ?? ''),
                plan: String(data.plan ?? ''),
                order: typeof data.order === 'number' ? data.order : Number.MAX_SAFE_INTEGER,
            } satisfies Row;
        })
        .sort((a, b) => a.order - b.order);

const uploadImage = async (file: File, slug: string, kind: Kind) => {
    const firebase = getFirebase();
    if (!firebase) throw new Error('Firebase 연결을 확인해 주세요.');

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
    const path = `${kind}/${slug}-${Date.now()}-${safeName || 'image'}`;
    const uploaded = await uploadBytes(ref(firebase.storage, path), file, { contentType: file.type });
    return getDownloadURL(uploaded.ref);
};

export function ReferenceManager({ kind = 'references' }: { kind?: Kind }) {
    const firebase = getFirebase();
    const isSpot = kind === 'spots';
    const noun = isSpot ? '광고 장소' : '레퍼런스';
    // 사용자 페이지 경로. spots -> /media, references -> /cases
    const detailPath = isSpot ? 'media' : 'cases';
    const goalHint = isSpot ? SPOT_GOAL_FALLBACK : GOAL_FALLBACK;
    const planHint = isSpot ? SPOT_PLAN_FALLBACK : PLAN_FALLBACK;
    const [rows, setRows] = useState<Row[]>([]);
    const [filter, setFilter] = useState('all');
    const [editing, setEditing] = useState<Row | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>('loading');
    const [formOpen, setFormOpen] = useState(false);
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [toast, setToast] = useState('');
    const [message, setMessage] = useState('');
    const [reloadKey, setReloadKey] = useState(0);
    // 등록 폼: 지역·카테고리·주소는 서로 연결돼 있어 state 로 잡는다
    const [area, setArea] = useState('');
    const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
    const [type, setType] = useState<string>(FALLBACK_CATEGORIES[0].title);
    const [slug, setSlug] = useState('');
    const [created, setCreated] = useState<{ title: string; slug: string; type: string; image: string } | null>(null);

    // 등록 화면에서도 목록을 읽는다. 주소 중복을 저장 전에 알려주기 위해서다
    useEffect(() => {
        if (!firebase) return;

        let alive = true;

        getDocs(collection(firebase.db, kind))
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
    }, [firebase, kind, reloadKey]);

    // 카테고리는 관리자가 사이트 설정에서 바꿀 수 있다. 저장한 적 없으면 기본 6종
    useEffect(() => {
        if (!firebase) return;
        let alive = true;
        getDocs(collection(firebase.db, 'categories'))
            .then((snapshot) => {
                if (!alive) return;
                const list = snapshot.docs
                    .map((item) => item.data() as { kind?: string; key?: string; title?: string; order?: number })
                    .filter((item) => item.kind === kind && item.key && item.title)
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((item) => ({ key: String(item.key), title: String(item.title) }));
                if (!list.length) return;
                setCategories(list);
                setType((current) => (list.some((item) => item.title === current) ? current : list[0].title));
            })
            .catch(() => undefined);
        return () => {
            alive = false;
        };
    }, [firebase, kind, reloadKey]);

    const visibleRows = useMemo(
        () => (filter === 'all' ? rows : rows.filter((row) => row.type === filter)),
        [filter, rows],
    );

    const refresh = () => {
        setStatus('loading');
        setReloadKey((key) => key + 1);
    };

    /** 저장 결과는 화면 위쪽에 잠깐 띄운다. 목록이 길어 아래에서는 안 보인다 */
    const notify = (text: string) => {
        setToast(text);
        window.setTimeout(() => setToast(''), 2600);
    };

    const takenSlugs = useMemo(() => new Set(rows.map((row) => row.slug)), [rows]);
    const slugTaken = slug.length > 0 && takenSlugs.has(slug);

    /** 이미 쓰는 주소면 뒤에 숫자를 붙여 빈 자리를 찾는다 */
    const freeSlug = (base: string) => {
        if (!base) return '';
        if (!takenSlugs.has(base)) return base;
        for (let n = 2; n < 50; n += 1) {
            if (!takenSlugs.has(`${base}-${n}`)) return `${base}-${n}`;
        }
        return `${base}-${rows.length + 1}`;
    };

    /** 지역과 카테고리로 영문 URL을 채워 준다 */
    const fillSlug = () => {
        const base = suggestSlug(area, type, categories);
        if (!base) {
            setMessage('지역을 먼저 적어 주세요. 목록에 없는 지역은 영문으로 직접 적으시면 됩니다.');
            setStatus('error');
            return;
        }
        setMessage('');
        setStatus('idle');
        setSlug(freeSlug(base));
    };

    const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!firebase) return;

        const form = event.currentTarget;
        const data = new FormData(form);
        const file = data.get('image') as File | null;
        const title = String(data.get('title') ?? '').trim();

        setStatus('saving');
        setMessage('');
        setCreated(null);

        try {
            const snapshot = await getDocs(collection(firebase.db, kind));
            const currentRows = readRows(snapshot);

            if (currentRows.some((row) => row.slug === slug)) {
                setRows(currentRows);
                throw new Error(
                    `이미 쓰고 있는 주소입니다. ${freeSlug(slug)} 처럼 뒤에 숫자를 붙이거나 다른 이름을 적어 주세요.`,
                );
            }

            if (!file?.size) throw new Error('대표 이미지를 올려 주세요.');
            const image = await uploadImage(file, slug, kind);
            const batch = writeBatch(firebase.db);
            const referenceDoc = doc(collection(firebase.db, kind));

            batch.set(referenceDoc, {
                slug,
                type,
                title,
                area: area.trim(),
                summary: String(data.get('summary') ?? '').trim(),
                goal: String(data.get('goal') ?? '').trim(),
                plan: String(data.get('plan') ?? '').trim(),
                image,
                order: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            currentRows.forEach((row, index) => {
                batch.update(doc(firebase.db, kind, row.id), { order: index + 1 });
            });

            await batch.commit();
            form.reset();
            setCreated({ title, slug, type, image });
            setArea('');
            setSlug('');
            setType(categories[0]?.title ?? '');
            setMessage('');
            setStatus('idle');
            setFormOpen(false);
            notify(`${noun}를 등록했습니다.`);
            refresh();
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

            const nextImage = file?.size ? await uploadImage(file, slug, kind) : editing.image;

            await updateDoc(doc(firebase.db, kind, editing.id), {
                slug,
                type: String(data.get('type') ?? ''),
                title: String(data.get('title') ?? '').trim(),
                area: String(data.get('area') ?? '').trim(),
                summary: String(data.get('summary') ?? '').trim(),
                goal: String(data.get('goal') ?? '').trim(),
                plan: String(data.get('plan') ?? '').trim(),
                image: nextImage,
                updatedAt: serverTimestamp(),
            });

            if (file?.size && editing.image !== nextImage) {
                deleteObject(ref(firebase.storage, editing.image)).catch(() => undefined);
            }

            setEditing(null);
            setMessage('');
            notify(`${noun}를 수정했습니다.`);
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
            await deleteDoc(doc(firebase.db, kind, row.id));
            deleteObject(ref(firebase.storage, row.image)).catch(() => undefined);
            setRows((current) => current.filter((item) => item.id !== row.id));
            setStatus('idle');
            setMessage('');
            notify(`${noun}를 삭제했습니다.`);
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
                batch.update(doc(firebase.db, kind, row.id), { order: index, updatedAt: serverTimestamp() });
            });
            await batch.commit();
            setMessage('');
            notify('노출 순서를 저장했습니다.');
            setStatus('idle');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : '순서를 저장하지 못했습니다.');
            setStatus('error');
            refresh();
        }
    };

    const createForm = (
        <>
            <form className="grid gap-5 md:grid-cols-2" onSubmit={handleCreate}>
                <label className={label}>
                    <span>제목</span>
                    <input
                        name="title"
                        required
                        placeholder={isSpot ? '예: 잠실역 2번출구 와이드컬러' : '예: 환승역 디지털 포스터 패키지'}
                        className={input}
                    />
                </label>
                <label className={label}>
                    <span>카테고리</span>
                    <select
                        name="type"
                        value={type}
                        onChange={(event) => setType(event.target.value)}
                        className={input}
                    >
                        {categories.map((item) => (
                            <option key={item.key}>{item.title}</option>
                        ))}
                    </select>
                </label>
                <label className={label}>
                    <span>지역</span>
                    <input
                        name="area"
                        required
                        value={area}
                        onChange={(event) => setArea(event.target.value)}
                        placeholder="예: 서울 송파구"
                        className={input}
                    />
                </label>
                <div className={label}>
                    <span>영문 URL</span>
                    <div
                        className={`flex h-11 items-center overflow-hidden rounded-[9px] border ${
                            slugTaken ? 'border-red-400' : 'border-line-strong'
                        }`}
                    >
                        <b className="flex h-full items-center bg-field px-3 text-[11px] font-semibold text-muted">
                            /{isSpot ? 'media' : 'cases'}/
                        </b>
                        <input
                            name="slug"
                            required
                            pattern="[a-z0-9-]+"
                            value={slug}
                            onChange={(event) => setSlug(event.target.value.toLowerCase())}
                            placeholder="songpa-subway"
                            className="min-w-0 flex-1 px-2 text-sm outline-none"
                        />
                        <button
                            type="button"
                            onClick={fillSlug}
                            className="h-full shrink-0 border-l border-line-strong px-3 text-[11px] font-bold text-brand"
                        >
                            자동
                        </button>
                    </div>
                    {slugTaken ? (
                        <p className="m-0 flex flex-wrap items-center gap-2 font-medium text-red-600">
                            이미 쓰고 있는 주소입니다.
                            <button
                                type="button"
                                onClick={() => setSlug(freeSlug(slug))}
                                className="rounded-md bg-red-50 px-2 py-1 font-bold text-red-700"
                            >
                                {freeSlug(slug)} 로 바꾸기
                            </button>
                        </p>
                    ) : (
                        <p className="m-0 font-medium leading-relaxed text-muted">{SLUG_GUIDE}</p>
                    )}
                </div>
                <label className={`${label} md:col-span-2`}>
                    <span>요약</span>
                    <textarea
                        name="summary"
                        rows={3}
                        required
                        maxLength={240}
                        placeholder={
                            isSpot
                                ? '규격, 노출 위치, 집행 가능 시기를 간단히 적어주세요.'
                                : '집행 위치, 목적과 매체 구성을 간단히 적어주세요.'
                        }
                        className={textarea}
                    />
                </label>
                <label className={label}>
                    <span>{isSpot ? '규격' : '목표'}</span>
                    <input name="goal" placeholder={goalHint} className={input} />
                </label>
                <label className={label}>
                    <span>{isSpot ? '집행 조건' : '구성'}</span>
                    <input name="plan" placeholder={planHint} className={input} />
                </label>
                <p className="m-0 -mt-2 text-[11px] leading-relaxed text-muted md:col-span-2">
                    상세페이지 {isSpot ? '자리 정보' : '집행 정보'}에 표시됩니다. 비우면 기본 문구가 들어갑니다.
                </p>
                <label className={`${label} md:col-span-2`}>
                    <span>대표 이미지 · 선택</span>
                    <input
                        name="image"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="rounded-[10px] border border-dashed border-line-strong bg-soft p-3 text-xs"
                    />
                    <span className="font-medium text-muted">
                        올리지 않으면 카테고리에 맞는 기본 이미지가 들어갑니다.
                    </span>
                </label>
                <div className="flex flex-wrap items-center gap-4 md:col-span-2">
                    <button className="btn-primary w-full sm:w-auto" type="submit" disabled={status === 'saving'}>
                        {status === 'saving' ? '업로드 중...' : `${noun} 등록`}
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

            {/* 안내 문구만으로는 된 건지 알기 어렵다. 등록된 결과를 그대로 보여준다 */}
            {created && (
                <div className="mt-6 rounded-xl border border-success/30 bg-success-pale p-4 sm:p-5">
                    <p className="m-0 text-xs font-extrabold text-success-deep">등록이 완료됐습니다</p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-[140px_1fr] sm:items-center">
                        <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-white">
                            <Image src={created.image} alt="" fill className="object-cover" sizes="140px" />
                        </div>
                        <div>
                            <span className="rounded-md bg-white px-2 py-1 text-[10px] font-extrabold text-brand">
                                {created.type}
                            </span>
                            <h3 className="mb-1 mt-2 text-[17px] font-extrabold text-ink">{created.title}</h3>
                            <p className="m-0 break-all text-[11px] text-success-deep">
                                /{detailPath}/{created.slug}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <a
                                    href={`/${detailPath}/${created.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-xs font-bold text-white"
                                >
                                    사이트에서 보기
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setCreated(null)}
                                    className="inline-flex h-10 items-center rounded-lg border border-line-strong bg-white px-4 text-xs font-bold text-muted"
                                >
                                    하나 더 등록
                                </button>
                            </div>
                            <p className="m-0 mt-3 text-[11px] leading-relaxed text-muted">
                                사이트 목록에는 최대 1분 뒤 반영됩니다. 지금 바로 보이지 않아도 정상입니다.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    return (
        <>
            {/* 저장 결과 알림. 목록이 길어도 항상 눈에 들어오게 화면 위에 고정한다 */}
            <div
                aria-live="polite"
                className={`pointer-events-none fixed inset-x-0 top-4 z-[300] flex justify-center transition-opacity duration-200 ${
                    toast ? 'opacity-100' : 'opacity-0'
                }`}
            >
                {toast && (
                    <p className="m-0 rounded-full bg-ink px-5 py-3 text-xs font-bold text-white shadow-lg">{toast}</p>
                )}
            </div>

            <article className={`${panel} mb-4`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="m-0 text-h5">새 {noun} 등록</h2>
                        <p className="m-0 mt-1 text-xs text-muted">이미지는 Storage, 정보는 Firestore에 저장됩니다.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setFormOpen((open) => !open);
                            setCreated(null);
                            setMessage('');
                        }}
                        className={
                            formOpen
                                ? 'h-11 rounded-lg border border-line-strong px-5 text-xs font-bold text-muted'
                                : 'btn-primary min-h-11 px-5 text-xs'
                        }
                    >
                        {formOpen ? '닫기' : `+ ${noun} 등록`}
                    </button>
                </div>

                {formOpen && <div className="mt-6 border-t border-line pt-6">{createForm}</div>}
            </article>

            <article className={`${panel} mb-4`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="m-0 text-h5">{noun} 카테고리</h2>
                        <p className="m-0 mt-1 text-xs text-muted">
                            이 화면의 카테고리만 바뀝니다. 사이트 필터와 등록 선택지가 함께 바뀝니다.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setCategoryOpen((open) => !open)}
                        className={
                            categoryOpen
                                ? 'h-11 rounded-lg border border-line-strong px-5 text-xs font-bold text-muted'
                                : 'h-11 rounded-lg border border-line-strong px-5 text-xs font-bold text-brand'
                        }
                    >
                        {categoryOpen ? '닫기' : '카테고리 관리'}
                    </button>
                </div>

                {categoryOpen && (
                    <div className="mt-6 border-t border-line pt-6">
                        <CategoryManager kind={kind} onNotify={notify} onChange={refresh} />
                    </div>
                )}
            </article>

            <article className={panel}>
                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="m-0 text-h5">등록된 {noun}</h2>
                        <p className="m-0 mt-1 text-xs text-muted">
                            카드를 눌러 수정·삭제하고, 전체 탭에서 끌어 노출 순서를 바꿉니다.
                        </p>
                    </div>
                    <button type="button" onClick={refresh} className="text-xs font-bold text-brand">
                        새로고침
                    </button>
                </div>

                <div className="mb-6 flex flex-wrap gap-2" aria-label="카테고리 필터">
                    <button
                        type="button"
                        onClick={() => setFilter('all')}
                        className={`h-9 rounded-full px-4 text-xs font-bold ${
                            filter === 'all' ? 'bg-brand text-white' : 'border border-line bg-white text-muted'
                        }`}
                    >
                        전체 {rows.length}
                    </button>
                    {categories.map((item) => {
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
                        아직 등록된 {noun}가 없습니다. 위에서 추가해 주세요.
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
                                        alt={row.title}
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
                                    <small className="mt-3 block truncate text-[10px] text-muted">
                                        /{detailPath}/{row.slug}
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
                        해당 카테고리에 등록된 {noun}가 없습니다.
                    </p>
                )}
            </article>

            {editing && (
                <div className="fixed inset-0 z-[200] grid place-items-center bg-deep/60 p-3 backdrop-blur-sm sm:p-4">
                    <section className="admin-scroll max-h-[calc(100dvh-24px)] w-full max-w-[680px] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:max-h-[92vh] sm:p-6 lg:p-8">
                        <div className="mb-6 flex items-start justify-between gap-4">
                            <div>
                                <p className="m-0 text-[10px] font-extrabold tracking-[.12em] text-brand">
                                    {isSpot ? 'EDIT SPOT' : 'EDIT REFERENCE'}
                                </p>
                                <h2 className="mb-0 mt-2 text-h4">{noun} 수정</h2>
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
                                    {categories.map((item) => (
                                        <option key={item.key}>{item.title}</option>
                                    ))}
                                </select>
                            </label>
                            <label className={label}>
                                <span>지역</span>
                                <input name="area" required defaultValue={editing.area} className={input} />
                            </label>
                            <label className={label}>
                                <span>영문 URL · 바꾸면 기존 검색 순위가 사라집니다</span>
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
                            <label className={label}>
                                <span>{isSpot ? '규격' : '목표'}</span>
                                <input
                                    name="goal"
                                    defaultValue={editing.goal}
                                    placeholder={goalHint}
                                    className={input}
                                />
                            </label>
                            <label className={label}>
                                <span>{isSpot ? '집행 조건' : '구성'}</span>
                                <input
                                    name="plan"
                                    defaultValue={editing.plan}
                                    placeholder={planHint}
                                    className={input}
                                />
                            </label>
                            <label className={`${label} sm:col-span-2`}>
                                <span>대표 이미지 교체 · 선택하지 않으면 기존 이미지 유지</span>
                                <div className="grid gap-3 rounded-xl bg-soft p-3 sm:grid-cols-[120px_1fr] sm:items-center">
                                    <div className="relative aspect-[16/10] overflow-hidden rounded-lg">
                                        <Image
                                            src={editing.image}
                                            alt="현재 대표 이미지"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <input
                                        name="image"
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        className="text-xs"
                                    />
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
