import Link from 'next/link';
import { Icon } from '@/components/ui/icon';
import type { MobileMenuVariant } from '@/lib/ui-config';

type NavigationItem = readonly [label: string, href: string, section: string];

type Props = {
    variant: MobileMenuVariant;
    pathname: string;
    items: readonly NavigationItem[];
    onClose: () => void;
    onDiagnosis: (opener: HTMLElement) => void;
};

const isActive = (pathname: string, href: string) =>
    (pathname.startsWith('/insight') && href === '/insight') || (pathname.startsWith('/blog') && href === '/blog');

function DiagnosisButton({
    onDiagnosis,
    dark = false,
}: {
    onDiagnosis: (opener: HTMLElement) => void;
    dark?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={(event) => onDiagnosis(event.currentTarget)}
            className={`min-h-[54px] w-full rounded-xl px-6 text-sm font-extrabold transition-colors md:mx-auto md:max-w-[440px] ${
                dark ? 'bg-white text-brand' : 'bg-brand text-white'
            }`}
        >
            무료진단 받기
        </button>
    );
}

function IndexPanel({ pathname, items, onClose, onDiagnosis }: Omit<Props, 'variant'>) {
    return (
        <div className="flex min-h-full flex-col px-gutter pb-7 pt-6 md:pb-10 md:pt-8">
            <div className="flex items-end justify-between border-b border-ink pb-5">
                <div>
                    <small className="text-[10px] font-extrabold tracking-[.18em] text-brand">MEDICAL AD LAB</small>
                </div>
            </div>

            <nav className="mb-auto" aria-label="모바일 메뉴">
                {items.map(([label, href, section], index) => {
                    const active = isActive(pathname, href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={onClose}
                            className="group grid min-h-[70px] grid-cols-[42px_1fr_24px] items-center border-b border-line md:min-h-[78px] md:grid-cols-[54px_1fr_28px]"
                        >
                            <span className={`text-xs font-extrabold ${active ? 'text-brand' : 'text-muted'}`}>
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <span>
                                <strong
                                    className={`block text-[18px] md:text-[20px] ${active ? 'text-brand' : 'text-ink'}`}
                                >
                                    {label}
                                </strong>
                                <small className="mt-1 block text-[9px] font-bold tracking-[.08em] text-muted">
                                    {section}
                                </small>
                            </span>
                            <Icon
                                name="arrow"
                                className="w-5 text-muted transition-transform group-hover:translate-x-1"
                            />
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-8">
                <DiagnosisButton onDiagnosis={onDiagnosis} />
                <p className="mb-0 mt-3 text-center text-[11px] font-semibold text-muted">
                    견적 없이 신청 가능 · 계약 의무 없음
                </p>
            </div>
        </div>
    );
}

function JournalPanel({ pathname, items, onClose, onDiagnosis }: Omit<Props, 'variant'>) {
    return (
        <div className="flex min-h-full flex-col bg-deep px-gutter pb-7 pt-7 text-white md:pb-10 md:pt-10">
            <div className="mb-5 flex items-center justify-between">
                <small className="text-[10px] font-extrabold tracking-[.18em] text-brand-light-02">
                    LAB NAVIGATION
                </small>
                <span className="h-px w-[72px] bg-white/20" />
            </div>

            <nav className="mb-auto" aria-label="모바일 메뉴">
                {items.map(([label, href], index) => {
                    const active = isActive(pathname, href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={onClose}
                            className="group grid min-h-[66px] grid-cols-[46px_1fr_22px] items-center border-b border-white/10 md:min-h-[76px]"
                        >
                            <span className={`text-[11px] font-black ${active ? 'text-mint' : 'text-white/35'}`}>
                                0{index + 1}
                            </span>
                            <strong
                                className={`text-[22px] tracking-[-.035em] md:text-[26px] ${active ? 'text-mint' : ''}`}
                            >
                                {label}
                            </strong>
                            <Icon
                                name="arrow"
                                className="w-5 text-white/35 transition-transform group-hover:translate-x-1"
                            />
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-8 border-t border-white/12 pt-6">
                <p className="mb-5 mt-0 text-xs font-semibold leading-6 text-white/55">
                    매체·위치·비용을 같은 기준으로 검토합니다.
                </p>
                <DiagnosisButton onDiagnosis={onDiagnosis} dark />
            </div>
        </div>
    );
}

function CardPanel({ pathname, items, onClose, onDiagnosis }: Omit<Props, 'variant'>) {
    return (
        <div className="flex min-h-full flex-col bg-soft px-gutter pb-7 pt-6 md:pb-10 md:pt-8">
            <div className="mb-6">
                <small className="text-[10px] font-extrabold tracking-[.18em] text-brand">QUICK ACCESS</small>
                <h2 className="mb-0 mt-2 text-[24px] font-black tracking-[-.04em] text-ink">무엇을 확인하시겠어요?</h2>
            </div>

            <nav className="mb-auto grid grid-cols-2 gap-3 md:gap-4" aria-label="모바일 메뉴">
                {items.map(([label, href, section], index) => {
                    const active = isActive(pathname, href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={onClose}
                            className={`group flex min-h-[126px] flex-col rounded-2xl border p-4 transition-colors md:min-h-[144px] md:p-5 ${
                                active ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink'
                            }`}
                        >
                            <span className={`text-[11px] font-extrabold ${active ? 'text-white/65' : 'text-brand'}`}>
                                0{index + 1}
                            </span>
                            <strong className="mt-auto text-[17px] leading-[1.35] md:text-[20px]">{label}</strong>
                            <small
                                className={`mt-1 text-[8px] font-bold tracking-[.04em] ${active ? 'text-white/55' : 'text-muted'}`}
                            >
                                {section}
                            </small>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-7">
                <DiagnosisButton onDiagnosis={onDiagnosis} />
            </div>
        </div>
    );
}

function TimelinePanel({ pathname, items, onClose, onDiagnosis }: Omit<Props, 'variant'>) {
    return (
        <div className="flex min-h-full flex-col px-gutter pb-7 pt-6 md:pb-10 md:pt-8">
            <div className="mb-5 flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                <small className="text-[10px] font-extrabold tracking-[.18em] text-brand">RESEARCH FLOW</small>
            </div>

            <nav
                className="relative mb-auto pl-8 before:absolute before:bottom-7 before:left-[5px] before:top-7 before:w-px before:bg-line-strong before:content-['']"
                aria-label="모바일 메뉴"
            >
                {items.map(([label, href, section], index) => {
                    const active = isActive(pathname, href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={onClose}
                            className="group relative flex min-h-[72px] items-center justify-between border-b border-line"
                        >
                            <span
                                className={`absolute -left-[31px] top-1/2 h-[11px] w-[11px] -translate-y-1/2 rounded-full border-[3px] border-white ${
                                    active ? 'bg-brand ring-4 ring-brand/12' : 'bg-line-strong'
                                }`}
                            />
                            <span>
                                <small className="block text-[9px] font-extrabold tracking-[.08em] text-muted">
                                    STEP 0{index + 1} · {section}
                                </small>
                                <strong
                                    className={`mt-1 block text-[19px] md:text-[22px] ${active ? 'text-brand' : 'text-ink'}`}
                                >
                                    {label}
                                </strong>
                            </span>
                            <Icon
                                name="arrow"
                                className="w-5 text-muted transition-transform group-hover:translate-x-1"
                            />
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-8 rounded-2xl bg-brand-pale p-4 md:p-5">
                <p className="mb-4 mt-0 text-xs font-bold text-slate">
                    필요한 메뉴를 확인한 뒤 바로 무료진단을 신청할 수 있습니다.
                </p>
                <DiagnosisButton onDiagnosis={onDiagnosis} />
            </div>
        </div>
    );
}

function MinimalPanel({ pathname, items, onClose, onDiagnosis }: Omit<Props, 'variant'>) {
    return (
        <div className="flex min-h-full flex-col px-gutter pb-7 pt-8 text-center md:pb-10 md:pt-10">
            <div>
                <small className="text-[10px] font-extrabold tracking-[.22em] text-brand">MEDICAL AD LAB</small>
                <p className="m-0 mt-2 text-xs font-semibold text-muted">병원 광고를 더 쉽고, 더 투명하게.</p>
            </div>

            <nav className="my-auto grid py-7" aria-label="모바일 메뉴">
                {items.map(([label, href]) => {
                    const active = isActive(pathname, href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={onClose}
                            className={`relative flex min-h-[58px] items-center justify-center text-[22px] font-extrabold tracking-[-.035em] md:min-h-[66px] md:text-[26px] ${
                                active
                                    ? 'text-brand after:absolute after:bottom-2 after:h-0.5 after:w-5 after:bg-brand'
                                    : 'text-ink'
                            }`}
                        >
                            {label}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-line pt-6">
                <DiagnosisButton onDiagnosis={onDiagnosis} />
                <p className="mb-0 mt-3 text-[11px] text-muted">24시간 내 1차 안내</p>
            </div>
        </div>
    );
}

/** 6: 큰 글씨 스택형. 메뉴명만 왼쪽에 크게 쌓고 번호는 오른쪽 끝에 작게 */
function StackPanel({ pathname, items, onClose, onDiagnosis }: Omit<Props, 'variant'>) {
    return (
        <div className="flex min-h-full flex-col px-gutter pb-7 pt-10 md:pb-10 md:pt-14">
            <nav className="mb-auto grid gap-1" aria-label="모바일 메뉴">
                {items.map(([label, href], index) => {
                    const active = isActive(pathname, href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={onClose}
                            className="group flex items-baseline justify-between gap-4 py-2.5"
                        >
                            <strong
                                className={`text-[30px] leading-[1.25] tracking-[-.04em] transition-colors md:text-[36px] ${
                                    active ? 'text-brand' : 'text-ink/35 group-hover:text-ink'
                                }`}
                            >
                                {label}
                            </strong>
                            <span className="shrink-0 text-[10px] font-extrabold text-muted">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-10">
                <DiagnosisButton onDiagnosis={onDiagnosis} />
            </div>
        </div>
    );
}

/** 7: 무료진단을 맨 위에 크게 놓고 메뉴는 그 아래 조용히 */
function CtaFirstPanel({ pathname, items, onClose, onDiagnosis }: Omit<Props, 'variant'>) {
    return (
        <div className="flex min-h-full flex-col px-gutter pb-7 pt-6 md:pb-10 md:pt-8">
            <div className="rounded-2xl bg-brand p-6 text-white">
                <p className="m-0 text-[20px] font-black leading-[1.4]">
                    우리 병원 옥외광고,
                    <br />
                    24시간 안에 비교해 드립니다.
                </p>
                <p className="m-0 mb-5 mt-2 text-xs text-white/70">견적이 없어도 신청할 수 있습니다.</p>
                <DiagnosisButton onDiagnosis={onDiagnosis} dark />
            </div>

            <nav className="mb-auto mt-7 grid" aria-label="모바일 메뉴">
                {items.map(([label, href, section]) => {
                    const active = isActive(pathname, href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={onClose}
                            className="group flex min-h-[62px] items-center justify-between gap-4 border-b border-line"
                        >
                            <span className={`text-[17px] font-extrabold ${active ? 'text-brand' : 'text-ink'}`}>
                                {label}
                            </span>
                            <span className="text-[9px] font-bold tracking-[.08em] text-muted">{section}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}

/** 8: 아이콘 없는 2단 목록. 왼쪽에 얇은 브랜드 바가 붙는다 */
function RailPanel({ pathname, items, onClose, onDiagnosis }: Omit<Props, 'variant'>) {
    return (
        <div className="flex min-h-full flex-col bg-soft px-gutter pb-7 pt-7 md:pb-10 md:pt-9">
            <nav className="mb-auto grid gap-2.5" aria-label="모바일 메뉴">
                {items.map(([label, href, section]) => {
                    const active = isActive(pathname, href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={onClose}
                            className={`grid min-h-[72px] grid-cols-[4px_1fr] items-center gap-4 overflow-hidden rounded-xl bg-white pr-5 transition-colors ${
                                active ? 'shadow-[0_6px_18px_rgba(36,104,240,.12)]' : ''
                            }`}
                        >
                            <span className={`h-full w-1 ${active ? 'bg-brand' : 'bg-line-strong'}`} />
                            <span className="py-4">
                                <strong
                                    className={`block text-[17px] leading-tight ${active ? 'text-brand' : 'text-ink'}`}
                                >
                                    {label}
                                </strong>
                                <small className="mt-1 block text-[9px] font-bold tracking-[.08em] text-muted">
                                    {section}
                                </small>
                            </span>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-7">
                <DiagnosisButton onDiagnosis={onDiagnosis} />
            </div>
        </div>
    );
}

/** 9: 브랜드 컬러 전면. 흰 글씨 목록 */
function BrandPanel({ pathname, items, onClose, onDiagnosis }: Omit<Props, 'variant'>) {
    return (
        <div className="flex min-h-full flex-col bg-brand px-gutter pb-7 pt-8 text-white md:pb-10 md:pt-10">
            <small className="text-[10px] font-extrabold tracking-[.2em] text-white/60">MEDICAL AD LAB</small>

            <nav className="mb-auto mt-6 grid" aria-label="모바일 메뉴">
                {items.map(([label, href], index) => {
                    const active = isActive(pathname, href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={onClose}
                            className="grid min-h-[64px] grid-cols-[34px_1fr] items-center border-b border-white/15"
                        >
                            <span className="text-[11px] font-black text-white/45">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <strong className={`text-[20px] tracking-[-.03em] ${active ? 'text-mint' : 'text-white'}`}>
                                {label}
                            </strong>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-8">
                <DiagnosisButton onDiagnosis={onDiagnosis} dark />
                <p className="mb-0 mt-3 text-center text-[11px] text-white/60">견적 없이 신청 가능 · 계약 의무 없음</p>
            </div>
        </div>
    );
}

export function MobileNavPanel(props: Props) {
    if (props.variant === 2) return <JournalPanel {...props} />;
    if (props.variant === 3) return <CardPanel {...props} />;
    if (props.variant === 4) return <TimelinePanel {...props} />;
    if (props.variant === 5) return <MinimalPanel {...props} />;
    if (props.variant === 6) return <StackPanel {...props} />;
    if (props.variant === 7) return <CtaFirstPanel {...props} />;
    if (props.variant === 8) return <RailPanel {...props} />;
    if (props.variant === 9) return <BrandPanel {...props} />;
    return <IndexPanel {...props} />;
}
