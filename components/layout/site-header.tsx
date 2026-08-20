'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/icon';

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
    onMenuOpen: () => void;
    menuOpen: boolean;
};

export function SiteHeader({ solid, onDiagnosis, onMenuOpen, menuOpen }: Props) {
    const pathname = usePathname();

    return (
        <header
            className={`fixed inset-x-0 top-0 z-[100] h-[60px] border-b transition-[height,color,background,border-color] duration-200 lg:h-[88px] ${
                solid ? 'border-ink/10 bg-white/95 text-ink backdrop-blur-lg lg:h-20' : 'border-white/20 text-white'
            }`}
        >
            <div className="site-container flex h-full items-center gap-4 lg:gap-[30px]">
                <Link href="/" className="shrink-0" aria-label="병원광고연구소 홈">
                    <Image
                        src={solid ? '/images/logo-blue-02.svg' : '/images/logo.svg'}
                        alt="병원광고연구소"
                        width={161}
                        height={25}
                        priority
                        unoptimized
                        className="h-[18px] w-auto lg:h-[25px]"
                    />
                    {/* <span className="block text-[24px] font-black  text-brand">병원광고연구소</span> */}
                </Link>

                <nav className="hidden flex-1 items-center justify-center gap-11 lg:flex" aria-label="주요 메뉴">
                    {navItems.map(([label, href]) => (
                        <Link
                            key={href}
                            href={href}
                            className={`relative whitespace-nowrap py-[30px] text-body font-semibold after:absolute after:inset-x-0 after:bottom-[22px] after:h-px after:rounded after:bg-current after:transition-transform hover:after:scale-x-100 ${
                                isCurrent(pathname, href) ? 'after:scale-x-100' : 'after:scale-x-0'
                            }`}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:gap-0">
                    <button
                        type="button"
                        onClick={(event) => onDiagnosis(event.currentTarget)}
                        className={`h-9 rounded-lg px-3.5 text-[13px] font-extrabold transition-colors lg:h-12 lg:px-[26px] lg:text-body ${
                            solid ? 'bg-brand text-white' : 'bg-white text-brand'
                        }`}
                    >
                        <span className="lg:hidden">무료진단</span>
                        <span className="hidden lg:inline">무료진단 받기</span>
                    </button>
                    <button
                        type="button"
                        aria-label="메뉴 열기"
                        aria-expanded={menuOpen}
                        aria-controls="mobile-navigation"
                        onClick={onMenuOpen}
                        className="grid h-9 w-9 place-items-center rounded-lg text-current lg:hidden"
                    >
                        <Icon name="menu" className="w-6" />
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
            className={`fixed inset-0 z-[210] flex flex-col bg-white px-gutter pb-7 pt-5 transition-[opacity,transform,visibility] duration-300 lg:hidden ${
                open ? 'visible translate-x-0 opacity-100' : 'invisible translate-x-full opacity-0'
            }`}
        >
            <div className="flex items-center justify-between">
                <Link href="/" onClick={onClose} aria-label="병원광고연구소 홈">
                    <Image
                        src="/images/logo-blue-02.svg"
                        alt="병원광고연구소"
                        width={161}
                        height={25}
                        unoptimized
                        className="h-[18px] w-auto"
                    />
                </Link>
                <button
                    type="button"
                    aria-label="메뉴 닫기"
                    onClick={onClose}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-line"
                >
                    <Icon name="close" className="w-5" />
                </button>
            </div>
            <nav className="mb-auto mt-10" aria-label="모바일 메뉴">
                {navItems.map(([label, href, section]) => (
                    <Link
                        key={href}
                        href={href}
                        onClick={onClose}
                        className="grid min-h-16 grid-cols-[100px_1fr_20px] items-center border-b border-line text-h5 first:border-t"
                    >
                        <small className="text-[9px] font-extrabold tracking-[.11em] text-subtle">{section}</small>
                        <span className={isCurrent(pathname, href) ? 'text-brand' : ''}>{label}</span>
                        <Icon name="arrow" className="w-[18px] text-subtle" />
                    </Link>
                ))}
            </nav>
            <button className="btn-primary w-full" type="button" onClick={(event) => onDiagnosis(event.currentTarget)}>
                무료진단 받기
            </button>
        </div>
    );
}
