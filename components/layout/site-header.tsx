'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MobileMenuIcon } from '@/components/layout/mobile-menu-icon';
import { MobileNavPanel } from '@/components/layout/mobile-nav-panel';
import { MOBILE_MENU_VARIANT } from '@/lib/ui-config';

/** 메뉴 이름이 곧 내부링크 앵커 텍스트다. 업계 용어 대신 검색하는 말로 둔다 */
export const navItems = [
    ['서비스 소개', '/#service', 'SECTION 02'],
    ['무료진단 안내', '/#diagnosis', 'SECTION 04'],
    ['매체 소개', '/#media', 'SECTION 05'],
    ['진행 방식', '/#process', 'SECTION 08'],
    ['광고매체 단가', '/media', 'MEDIA & RATES'],
    ['병원광고 사례', '/cases', 'CASE STUDIES'],
    ['병원광고 가이드', '/blog', 'GUIDE'],
] as const;

/** 현재 경로가 그 메뉴에 속하는지 */
function isCurrent(pathname: string, href: string) {
    if (href === '/blog') return pathname.startsWith('/blog');
    if (href === '/media') return pathname.startsWith('/media');
    if (href === '/cases') return pathname.startsWith('/cases');
    return false;
}

/** 밑줄 대신 글자색 농도로 표시한다. 시안은 전부 흰색이라 기본을 /80 까지만 낮춘다 */
function navTone(isSolid: boolean, current: boolean) {
    if (isSolid) return current ? 'text-ink' : 'text-ink/60 hover:text-ink';
    return current ? 'text-white' : 'text-white/80 hover:text-white';
}

type Props = {
    solid: boolean;
    onDiagnosis: (opener: HTMLElement) => void;
    onMenuToggle: () => void;
    menuOpen: boolean;
};

export function SiteHeader({ solid, onDiagnosis, onMenuToggle, menuOpen }: Props) {
    const pathname = usePathname();
    const isSolid = solid || menuOpen;

    return (
        <header
            className={`fixed inset-x-0 top-0 z-[100] h-[60px] border-b transition-[height,color,background,border-color] duration-200 md:h-[72px] xl:h-[88px] ${
                isSolid ? 'border-ink/10 bg-white/95 text-ink backdrop-blur-lg xl:h-20' : 'border-white/20 text-white'
            }`}
        >
            <div className="site-container flex h-full items-center gap-3 sm:gap-4 xl:gap-5 2xl:gap-[30px]">
                {/* 이미 홈이면 이동하지 않고 맨 위로 부드럽게 올린다 */}
                <Link
                    href="/"
                    className="shrink-0"
                    aria-label="병원광고연구소 홈"
                    onClick={(event) => {
                        if (pathname !== '/') return;
                        event.preventDefault();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                >
                    <Image
                        src={isSolid ? '/images/logo-blue-02.svg' : '/images/logo.svg'}
                        alt="병원광고연구소"
                        width={161}
                        height={25}
                        priority
                        unoptimized
                        className="h-[18px] w-auto xl:h-[22px] 2xl:h-[25px]"
                    />
                    {/* <span className="block text-[24px] font-black  text-brand">병원광고연구소</span> */}
                </Link>

                {/* 시안 1920 기준 항목 사이 잉크 간격 55px = CSS gap 60px */}
                {/* 랩탑(1280~1536)에서 13px·gap-4는 너무 빽빽했다. 2xl 값에 가깝게 올린다. 회사소개는 푸터에 둔다 */}
                <nav
                    className="hidden flex-1 items-center justify-center gap-7 2xl:gap-9 xl:flex"
                    aria-label="주요 메뉴"
                >
                    {navItems.map(([label, href]) => (
                        <Link
                            key={href}
                            href={href}
                            className={`whitespace-nowrap py-[28px] text-[15px] font-semibold transition-colors duration-200 2xl:py-[30px] ${navTone(isSolid, isCurrent(pathname, href))}`}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-2 xl:ml-0 xl:gap-0">
                    <button
                        type="button"
                        onClick={(event) => onDiagnosis(event.currentTarget)}
                        className={`h-9 rounded-lg px-3.5 text-[14px] font-extrabold transition-colors xl:h-12 xl:px-5 xl:text-[14px] 2xl:px-8 2xl:text-body ${
                            isSolid ? 'bg-brand text-white' : 'bg-white text-brand'
                        }`}
                    >
                        <span className="xl:hidden">무료진단</span>
                        <span className="hidden xl:inline">무료진단 받기</span>
                    </button>
                    <button
                        type="button"
                        aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
                        aria-expanded={menuOpen}
                        aria-controls="mobile-navigation"
                        onClick={onMenuToggle}
                        className={`grid h-10 place-items-center rounded-xl border shadow-sm transition-[width,background,border-color,transform] active:scale-95 xl:hidden ${
                            MOBILE_MENU_VARIANT === 5 ? 'w-[64px]' : 'w-10'
                        } ${
                            isSolid
                                ? 'border-line bg-white text-ink'
                                : 'border-white/30 bg-deep/15 text-white backdrop-blur-sm'
                        }`}
                    >
                        <MobileMenuIcon open={menuOpen} variant={MOBILE_MENU_VARIANT} />
                    </button>
                </div>
            </div>
        </header>
    );
}

export function MobileNav({
    open,
    onClose,
    onDiagnosis,
}: {
    open: boolean;
    onClose: () => void;
    onDiagnosis: (opener: HTMLElement) => void;
}) {
    const pathname = usePathname();

    return (
        <div
            id="mobile-navigation"
            aria-hidden={!open}
            role="dialog"
            aria-modal="true"
            aria-label="모바일 메뉴"
            className={`fixed inset-x-0 bottom-0 top-[60px] z-[90] overflow-y-auto bg-white transition-[opacity,transform,visibility] duration-300 ease-[cubic-bezier(.22,1,.36,1)] md:top-[72px] xl:hidden ${
                open ? 'visible translate-x-0 opacity-100' : 'invisible translate-x-full opacity-0'
            }`}
        >
            <MobileNavPanel
                variant={MOBILE_MENU_VARIANT}
                pathname={pathname}
                items={navItems}
                onClose={onClose}
                onDiagnosis={onDiagnosis}
            />
        </div>
    );
}
