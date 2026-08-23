'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MobileMenuIcon } from '@/components/layout/mobile-menu-icon';
import { MobileNavPanel } from '@/components/layout/mobile-nav-panel';
import { MOBILE_MENU_VARIANT } from '@/lib/ui-config';

export const navItems = [
    ['서비스 소개', '/#service', 'SECTION 02'],
    ['무료진단 안내', '/#diagnosis', 'SECTION 04'],
    ['광고매체', '/#media', 'SECTION 05'],
    ['진행 방식', '/#process', 'SECTION 08'],
    ['옥외레퍼런스', '/insight', 'REFERENCE PAGE'],
    ['병원광고연구소', '/about', 'LAB JOURNAL'],
] as const;

/** 현재 경로가 그 메뉴에 속하는지 */
function isCurrent(pathname: string, href: string) {
    return (
        (pathname.startsWith('/insight') && href === '/insight') || (pathname.startsWith('/about') && href === '/about')
    );
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
                <Link href="/" className="shrink-0" aria-label="병원광고연구소 홈">
                    <Image
                        src={isSolid ? '/images/logo-blue-02.svg' : '/images/logo.svg'}
                        alt="병원광고연구소"
                        width={161}
                        height={25}
                        priority
                        unoptimized
                        className="h-[18px] w-auto xl:h-[25px]"
                    />
                    {/* <span className="block text-[24px] font-black  text-brand">병원광고연구소</span> */}
                </Link>

                <nav className="hidden flex-1 items-center justify-center gap-6 2xl:gap-11 xl:flex" aria-label="주요 메뉴">
                    {navItems.map(([label, href]) => (
                        <Link
                            key={href}
                            href={href}
                            className={`relative whitespace-nowrap py-[28px] text-sm font-semibold after:absolute after:inset-x-0 after:bottom-[20px] after:h-px after:rounded after:bg-current after:transition-transform hover:after:scale-x-100 2xl:py-[30px] 2xl:text-body 2xl:after:bottom-[22px] ${
                                isCurrent(pathname, href) ? 'after:scale-x-100' : 'after:scale-x-0'
                            }`}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-2 xl:ml-0 xl:gap-0">
                    <button
                        type="button"
                        onClick={(event) => onDiagnosis(event.currentTarget)}
                        className={`h-9 rounded-lg px-3.5 text-[14px] font-extrabold transition-colors xl:h-12 xl:px-[26px] xl:text-body ${
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
