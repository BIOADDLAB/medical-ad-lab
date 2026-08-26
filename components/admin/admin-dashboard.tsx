'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { firebaseReady, getFirebase } from '@/lib/firebase';
import { loadSettings, saveSettings, type SiteSettings } from '@/lib/admin-store';
import { getReferences } from '@/lib/references';
import { monthPrefixKST } from '@/lib/lead';
import { ReferenceManager } from '@/components/admin/reference-manager';
import { fetchLeads, LeadTable, type LeadPayload } from '@/components/admin/lead-table';
import { TaskList } from '@/components/admin/task-list';

type View = 'dashboard' | 'inquiries' | 'references' | 'spots' | 'settings';

const nav: { id: View; label: string; caption: string }[] = [
    { id: 'dashboard', label: '대시보드', caption: '요약' },
    { id: 'inquiries', label: '무료진단 문의', caption: '리드' },
    { id: 'references', label: '옥외레퍼런스', caption: '콘텐츠' },
    { id: 'spots', label: '광고 장소', caption: '콘텐츠' },
    { id: 'settings', label: '사이트 설정', caption: '연동' },
];

const badgeTone = {
    blue: 'bg-line text-brand',
    green: 'bg-success-pale text-success-deep',
    gray: 'bg-line text-muted',
};

function Badge({ children, tone = 'blue' }: { children: React.ReactNode; tone?: keyof typeof badgeTone }) {
    return (
        <span
            className={`inline-flex h-6 items-center rounded-full px-2.5 text-[9px] font-extrabold tracking-[.05em] ${badgeTone[tone]}`}
        >
            {children}
        </span>
    );
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <article
            className={`rounded-2xl border border-line bg-white p-5 shadow-[0_7px_24px_rgba(19,43,80,.035)] lg:p-6 ${className}`}
        >
            {children}
        </article>
    );
}

const field = 'h-11 rounded-[9px] border border-line-strong px-3.5 text-sm outline-none focus:border-brand';

function LoginScreen() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

    const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const firebase = getFirebase();
        if (!firebase) return;
        const data = new FormData(event.currentTarget);
        setStatus('loading');
        try {
            await signInWithEmailAndPassword(firebase.auth, String(data.get('email')), String(data.get('password')));
        } catch {
            setStatus('error');
        }
    };

    return (
        <main className="grid min-h-screen place-items-center bg-ink p-6 text-white">
            <form onSubmit={handleLogin} className="grid w-full max-w-[380px] gap-4 rounded-panel bg-white/6 p-8">
                <div className="grid">
                    <strong className="text-h5">병원광고연구소</strong>
                    <span className="mt-1 text-[8px] font-extrabold tracking-[.16em] text-white/45">
                        MEDICAL AD LAB
                    </span>
                </div>
                <h1 className="m-0 text-h4">관리자 로그인</h1>
                <label className="grid gap-2 text-xs font-bold text-white/70">
                    <span>이메일</span>
                    <input
                        name="email"
                        type="email"
                        required
                        autoComplete="username"
                        className="h-11 rounded-[10px] border border-white/16 bg-white/5 px-3.5 text-sm text-white outline-none focus:border-brand-light"
                    />
                </label>
                <label className="grid gap-2 text-xs font-bold text-white/70">
                    <span>비밀번호</span>
                    <input
                        name="password"
                        type="password"
                        required
                        autoComplete="current-password"
                        className="h-11 rounded-[10px] border border-white/16 bg-white/5 px-3.5 text-sm text-white outline-none focus:border-brand-light"
                    />
                </label>
                {status === 'error' && (
                    <p className="m-0 rounded-lg bg-red-500/15 p-3 text-xs text-red-300">
                        이메일 또는 비밀번호를 확인해 주세요.
                    </p>
                )}
                <button className="btn-primary" type="submit" disabled={status === 'loading'}>
                    {status === 'loading' ? '확인 중...' : '로그인'}
                </button>
                <Link href="/" className="text-center text-xs text-white/50">
                    사이트로 돌아가기
                </Link>
            </form>
        </main>
    );
}

export function AdminDashboard() {
    const [view, setView] = useState<View>('dashboard');
    const [menuOpen, setMenuOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [checking, setChecking] = useState(firebaseReady);
    const [leads, setLeads] = useState<LeadPayload | null>(null);
    const [referenceCount, setReferenceCount] = useState<number | null>(null);
    const [taskLeft, setTaskLeft] = useState<number | null>(null);
    const [settings, setSettings] = useState<SiteSettings>({ gaId: '', pixelId: '', contactEmail: '' });
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const current = nav.find((item) => item.id === view)!;

    useEffect(() => {
        const firebase = getFirebase();
        if (!firebase) return;
        return onAuthStateChanged(firebase.auth, (next) => {
            setUser(next);
            setChecking(false);
        });
    }, []);

    useEffect(() => {
        if (!user) return;
        fetchLeads(user)
            .then(setLeads)
            .catch(() => setLeads(null));
        getReferences()
            .then((items) => setReferenceCount(items.length))
            .catch(() => setReferenceCount(null));
        loadSettings()
            .then(setSettings)
            .catch(() => {});
    }, [user]);

    const move = (next: View) => {
        setView(next);
        setMenuOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const onTaskCount = useCallback((left: number) => setTaskLeft(left), []);

    const submitSettings = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const next: SiteSettings = {
            gaId: String(data.get('gaId') ?? '').trim(),
            pixelId: String(data.get('pixelId') ?? '').trim(),
            contactEmail: String(data.get('contactEmail') ?? '').trim(),
        };
        setSaveState('saving');
        try {
            await saveSettings(next);
            setSettings(next);
            setSaveState('saved');
            window.setTimeout(() => setSaveState('idle'), 1800);
        } catch {
            setSaveState('error');
        }
    };

    if (checking) return <main className="grid min-h-screen place-items-center bg-ink text-white">확인 중...</main>;
    if (firebaseReady && !user) return <LoginScreen />;

    // 이번 달 접수 건수. 시트 접수일시가 "2026. 08. 19. 14:30" 형태라 앞부분만 비교한다
    const monthPrefix = monthPrefixKST();
    const thisMonth = (leads?.leads ?? []).filter((lead) => lead.createdAt.startsWith(monthPrefix)).length;
    const newCount = (leads?.leads ?? []).filter((lead) => lead.status === '신규').length;

    const stats: [string, string, string][] = [
        [
            '전체 문의',
            leads?.ready ? String(leads.leads.length) : '-',
            leads?.ready ? '구글시트 전체 행' : '시트 연결 전',
        ],
        ['이번 달 문의', leads?.ready ? String(thisMonth) : '-', monthPrefix],
        ['미처리 신규', leads?.ready ? String(newCount) : '-', '상태 = 신규'],
        [
            '레퍼런스',
            referenceCount === null ? '-' : String(referenceCount),
            firebaseReady ? 'Firestore' : '샘플 데이터',
        ],
    ];

    return (
        <main className="min-h-screen bg-field text-ink">
            <aside
                className={`fixed inset-y-0 left-0 z-60 flex w-[280px] max-w-[86vw] flex-col overflow-y-auto bg-ink px-5 pb-6 pt-[30px] text-white transition-transform duration-300 xl:w-[260px] xl:max-w-none xl:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="grid border-b border-white/10 px-2.5 pb-[30px]">
                    <strong className="text-h5">병원광고연구소</strong>
                    <span className="mt-1 text-[8px] font-extrabold tracking-[.16em] text-white/45">
                        MEDICAL AD LAB
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    aria-label="관리자 메뉴 닫기"
                    className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-xl border border-white/15 text-xl xl:hidden"
                >
                    ×
                </button>
                <nav className="mt-6 grid gap-2">
                    {nav.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => move(item.id)}
                            className={`grid min-h-[58px] grid-cols-[52px_1fr_18px] items-center rounded-xl px-3 text-left transition-colors ${view === item.id ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/10'}`}
                        >
                            <small className="text-[8px] font-extrabold tracking-[.08em] text-brand-light">
                                {item.caption}
                            </small>
                            <span className="text-sm font-bold">{item.label}</span>
                            <i className="not-italic opacity-45">→</i>
                        </button>
                    ))}
                </nav>
                <div className="mt-auto border-t border-white/10 px-2.5 pb-1 pt-[18px]">
                    <Badge tone={firebaseReady ? 'green' : 'gray'}>
                        {firebaseReady ? 'Firebase 연결됨' : '프런트 POC'}
                    </Badge>
                    <p className="my-3.5 whitespace-pre-line text-xs leading-relaxed text-white/50">
                        {firebaseReady
                            ? '레퍼런스는 Firestore와\nStorage에 저장됩니다.'
                            : 'Firebase 환경변수를 넣으면\n실제 저장이 켜집니다.'}
                    </p>
                    <Link href="/" className="text-xs font-bold text-brand-light">
                        사이트 보기 ↗
                    </Link>
                    {user && (
                        <button
                            type="button"
                            onClick={() => signOut(getFirebase()!.auth)}
                            className="mt-3.5 block text-xs font-bold text-white/50"
                        >
                            로그아웃
                        </button>
                    )}
                </div>
            </aside>

            {menuOpen && (
                <button
                    type="button"
                    aria-label="관리자 메뉴 닫기"
                    onClick={() => setMenuOpen(false)}
                    className="fixed inset-0 z-50 bg-black/40 xl:hidden"
                />
            )}

            <section className="min-h-screen xl:ml-[260px]">
                <header className="sticky top-0 z-40 flex h-[68px] items-center justify-between border-b border-line bg-white/90 px-5 backdrop-blur-lg md:px-7 xl:h-[76px] xl:px-9">
                    <button
                        type="button"
                        onClick={() => setMenuOpen(true)}
                        aria-label="관리자 메뉴 열기"
                        className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-xl shadow-sm xl:hidden"
                    >
                        ☰
                    </button>
                    <div className="grid">
                        <small className="text-[8px] font-extrabold tracking-[.12em] text-brand">
                            {current.caption}
                        </small>
                        <strong className="mt-1 text-sm">{current.label}</strong>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate">
                        <span className="hidden sm:inline">{user?.email ?? '관리자'}</span>
                        <i className="grid h-8 w-8 place-items-center rounded-full bg-brand not-italic font-extrabold text-white">
                            관
                        </i>
                    </div>
                </header>

                <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-5 md:px-7 md:py-10 xl:px-9 xl:py-14">
                    {view === 'dashboard' && (
                        <>
                            <div className="mb-8 flex flex-wrap items-end justify-between gap-5 lg:mb-10">
                                <div>
                                    <Badge tone="green">TODAY</Badge>
                                    <h1 className="mb-2 mt-3.5 text-h2">운영 현황을 확인하세요.</h1>
                                    <p className="m-0 text-xs text-muted">
                                        문의는 구글시트에서, 콘텐츠는 왼쪽 메뉴에서 관리합니다.
                                    </p>
                                </div>
                            </div>
                            <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {stats.map(([label, value, note]) => (
                                    <Panel key={label}>
                                        <span className="text-xs text-muted">{label}</span>
                                        <strong className="mt-2 block text-h3">{value}</strong>
                                        <small className="mt-2 block text-xs text-muted">{note}</small>
                                    </Panel>
                                ))}
                            </div>
                            <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
                                <Panel>
                                    <div className="mb-4 flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="m-0 text-h5">최근 문의</h2>
                                            <p className="m-0 mt-1 text-xs text-muted">
                                                연락처는 가려서 표시합니다. 원본은 구글시트에 있습니다.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => move('inquiries')}
                                            className="text-xs font-bold text-brand"
                                        >
                                            전체보기
                                        </button>
                                    </div>
                                    {leads?.ready ? (
                                        <ul className="admin-scroll grid max-h-[360px] list-none gap-3 overflow-y-auto p-0 pr-1 text-xs">
                                            {leads.leads.slice(0, 5).map((lead, index) => (
                                                <li
                                                    key={`${lead.createdAt}-${index}`}
                                                    className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3"
                                                >
                                                    <span className="font-bold text-ink">{lead.hospital}</span>
                                                    <span className="text-muted">
                                                        {lead.area} · {lead.createdAt}
                                                    </span>
                                                </li>
                                            ))}
                                            {!leads.leads.length && (
                                                <li className="text-muted">아직 문의가 없습니다.</li>
                                            )}
                                        </ul>
                                    ) : (
                                        <p className="m-0 rounded-lg bg-soft p-3 text-[11px] leading-relaxed text-muted">
                                            구글시트 환경변수를 넣으면 접수된 문의가 표시됩니다.
                                        </p>
                                    )}
                                </Panel>
                                <Panel>
                                    <h2 className="m-0 text-h5">
                                        오늘 할 일
                                        {taskLeft !== null && (
                                            <span className="ml-2 text-xs text-muted">남은 {taskLeft}건</span>
                                        )}
                                    </h2>
                                    <TaskList onCount={onTaskCount} />
                                </Panel>
                            </div>
                        </>
                    )}

                    {view === 'inquiries' && (
                        <>
                            <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
                                <div>
                                    <Badge>LEADS</Badge>
                                    <h1 className="mb-2 mt-3.5 text-h2">무료진단 문의</h1>
                                    <p className="m-0 text-xs text-muted">
                                        구글시트를 그때그때 읽어 보여줍니다. 연락처·이메일은 가려서 표시합니다.
                                    </p>
                                </div>
                                {leads?.sheetUrl && (
                                    <a
                                        className="btn-outline"
                                        href={leads.sheetUrl}
                                        target="_blank"
                                        rel="noreferrer noopener"
                                    >
                                        구글시트 열기 ↗
                                    </a>
                                )}
                            </div>
                            <Panel>{user && <LeadTable user={user} />}</Panel>
                        </>
                    )}

                    {view === 'references' && (
                        <>
                            <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
                                <div>
                                    <Badge>CONTENT</Badge>
                                    <h1 className="mb-2 mt-3.5 text-h2">옥외레퍼런스</h1>
                                    <p className="m-0 text-xs text-muted">
                                        사이트 /insight 페이지에 노출되는 집행 사례입니다.
                                    </p>
                                </div>
                            </div>
                            {firebaseReady ? (
                                <ReferenceManager />
                            ) : (
                                <Panel>
                                    <p className="m-0 rounded-lg bg-soft p-3 text-[11px] leading-relaxed text-muted">
                                        Firebase 환경변수를 넣으면 실제 목록이 표시됩니다. 지금은 샘플 데이터가 사이트에
                                        노출됩니다.
                                    </p>
                                </Panel>
                            )}
                        </>
                    )}

                    {view === 'spots' && (
                        <>
                            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <Badge>CONTENT</Badge>
                                    <h1 className="mb-2 mt-3.5 text-h2">광고 장소</h1>
                                    <p className="m-0 text-xs text-muted">
                                        사이트 /insight 페이지 맨 위에 노출되는 집행 가능한 광고 자리입니다.
                                    </p>
                                </div>
                            </div>
                            {firebaseReady ? (
                                <ReferenceManager kind="spots" />
                            ) : (
                                <Panel>
                                    <p className="m-0 rounded-lg bg-soft p-3 text-[11px] leading-relaxed text-muted">
                                        Firebase 환경변수를 넣으면 실제 목록이 표시됩니다.
                                    </p>
                                </Panel>
                            )}
                        </>
                    )}

                    {view === 'settings' && (
                        <form onSubmit={submitSettings}>
                            <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
                                <div>
                                    <Badge>SETTINGS</Badge>
                                    <h1 className="mb-2 mt-3.5 text-h2">사이트 설정</h1>
                                    <p className="m-0 text-xs text-muted">
                                        여기 저장한 값은 Firestore에 들어가고 사이트가 바로 읽어 씁니다. API 키는
                                        환경변수에만 둡니다.
                                    </p>
                                </div>
                                <button
                                    className="btn-primary"
                                    type="submit"
                                    disabled={!firebaseReady || saveState === 'saving'}
                                >
                                    {saveState === 'saving'
                                        ? '저장 중...'
                                        : saveState === 'saved'
                                          ? '저장됨'
                                          : '변경사항 저장'}
                                </button>
                            </div>
                            {saveState === 'error' && (
                                <p className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-600">
                                    저장하지 못했습니다. Firestore 규칙과 로그인 상태를 확인해 주세요.
                                </p>
                            )}
                            <div className="grid gap-4 lg:grid-cols-2">
                                <Panel className="grid gap-5">
                                    <div>
                                        <h2 className="m-0 text-h5">분석 도구</h2>
                                        <p className="m-0 mt-2 text-[11px] leading-relaxed text-muted">
                                            방문자가 어디서 들어와 어느 페이지를 보고 무료진단을 신청했는지 세어 주는
                                            도구입니다. 넣지 않아도 사이트는 정상 동작하며, 비우면 스크립트를 넣지
                                            않습니다.
                                        </p>
                                    </div>
                                    <label className="grid gap-2 text-xs font-bold text-slate">
                                        <span>GA4 측정 ID</span>
                                        <input
                                            name="gaId"
                                            defaultValue={settings.gaId}
                                            placeholder="G-XXXXXXXXXX"
                                            className={field}
                                        />
                                        <span className="font-medium leading-relaxed text-muted">
                                            구글 애널리틱스(analytics.google.com) 가입 → 속성 만들기 → 웹 → 데이터
                                            스트림에서 `G-` 로 시작하는 측정 ID를 복사해 넣습니다. 방문자 수와 유입
                                            경로를 봅니다.
                                        </span>
                                    </label>
                                    <label className="grid gap-2 text-xs font-bold text-slate">
                                        <span>Meta Pixel ID</span>
                                        <input
                                            name="pixelId"
                                            defaultValue={settings.pixelId}
                                            placeholder="000000000000000"
                                            className={field}
                                        />
                                        <span className="font-medium leading-relaxed text-muted">
                                            페이스북·인스타그램 광고를 돌릴 때만 필요합니다. 메타 비즈니스
                                            관리자(business.facebook.com) → 이벤트 관리자에서 픽셀을 만들면 나오는 숫자
                                            15자리입니다. 광고 계획이 없으면 비워 두세요.
                                        </span>
                                    </label>
                                </Panel>
                                <Panel className="grid gap-5">
                                    <h2 className="m-0 text-h5">연락처</h2>
                                    <label className="grid gap-2 text-xs font-bold text-slate">
                                        <span>대표 이메일</span>
                                        <input
                                            name="contactEmail"
                                            type="email"
                                            defaultValue={settings.contactEmail}
                                            placeholder="contact@medicaladlab.co.kr"
                                            className={field}
                                        />
                                    </label>
                                    <p className="m-0 text-[11px] leading-relaxed text-muted">
                                        푸터에 표시됩니다. 비우면 표시하지 않습니다.
                                    </p>
                                </Panel>
                                <Panel>
                                    <h2 className="m-0 mb-3 text-h5">연결 상태</h2>
                                    {(
                                        [
                                            ['Firebase Auth', firebaseReady],
                                            ['Firestore · Storage', firebaseReady],
                                            ['Google Sheets', leads?.connections.sheets ?? null],
                                            ['Resend', leads?.connections.email ?? null],
                                        ] as [string, boolean | null][]
                                    ).map(([label, ready]) => (
                                        <div
                                            className="flex min-h-11 items-center justify-between border-b border-line text-xs text-slate"
                                            key={label}
                                        >
                                            <span>{label}</span>
                                            {ready === null ? (
                                                <Badge tone="gray">확인 불가</Badge>
                                            ) : (
                                                <Badge tone={ready ? 'green' : 'gray'}>
                                                    {ready ? '연결됨' : '연결 전'}
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                </Panel>
                            </div>
                        </form>
                    )}
                </div>
            </section>
        </main>
    );
}
