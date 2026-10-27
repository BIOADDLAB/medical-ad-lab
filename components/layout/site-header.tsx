'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MobileMenuIcon } from '@/components/layout/mobile-menu-icon';
import { MobileNavPanel } from '@/components/layout/mobile-nav-panel';
import { MOBILE_MENU_VARIANT } from '@/lib/ui-config';

/** 메뉴 이름이 곧 내부링크 앵커 텍스트다. 업계 용어 대신 검색하는 말로 둔다 */
export const navItems = [
    ['서비스 소개', '/#service', 'SECTION 02'],
    ['무료진단 안내', '/#diagnosis', 'SECTION 04'],
    ['매체 소개', '/#media', 'SECTION 05'],
    ['진행 방식', '/#process', 'SECTION 08'],
    ['광고자리 찾기', '/media', 'MEDIA & RATES'],
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
function navTone(light: boolean, current: boolean) {
    if (light) return current ? 'text-ink' : 'text-ink/60 hover:text-ink';
    return current ? 'text-white' : 'text-white/80 hover:text-white';
}

/** 맨 위가 어두운 페이지(홈 히어로, 블로그 배너). 투명할 때 흰 글씨를 쓴다 */
const isDarkTop = (pathname: string) => pathname === '/' || pathname.startsWith('/blog');

/** 20px 내리면 회색 배경, 400px 넘게 내리면 숨기고 조금이라도 올리면 다시 보인다 */
function useSmartHeader() {
    const [scrolled, setScrolled] = useState(false);
    const [down, setDown] = useState(false);

    useEffect(() => {
        let last = window.scrollY;
        let frame = 0;
        const update = () => {
            frame = 0;
            const y = window.scrollY;
            setScrolled(y > 20);
            if (y <= 400) {
                setDown(false);
                last = y;
            } else if (Math.abs(y - last) >= 4) {
                // 관성 스크롤의 1~2px 흔들림은 방향으로 치지 않는다
                setDown(y > last);
                last = y;
            }
        };
        const onScroll = () => {
            frame ||= requestAnimationFrame(update);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
        };
    }, []);

    return { scrolled, down };
}

type Props = {
    onDiagnosis: (opener: HTMLElement) => void;
    onMenuToggle: () => void;
    menuOpen: boolean;
};

export function SiteHeader({ onDiagnosis, onMenuToggle, menuOpen }: Props) {
    const pathname = usePathname();
    const { scrolled, down } = useSmartHeader();
    const [hovered, setHovered] = useState(false);
    const darkTop = isDarkTop(pathname);
    const active = scrolled || hovered || menuOpen;
    // 밝은 바탕 위라 진한 글씨와 파란 로고를 쓴다
    const light = active || !darkTop;
    // 마우스를 올려 둔 동안, 메뉴가 열려 있는 동안은 숨기지 않는다. 높이는 scrolled에만 맞춘다(마우스 올림에 맞추면 줄어든 헤더 밖으로 커서가 빠져 깜빡인다)
    const hidden = down && !hovered && !menuOpen;

    return (
        <header
            onPointerEnter={(event) => {
                if (event.pointerType === 'mouse') setHovered(true);
            }}
            onPointerLeave={() => setHovered(false)}
            className={`fixed inset-x-0 top-0 z-[100] h-[60px] border-b transition-[height,color,background-color,border-color,translate] duration-300 ease-out has-[:focus-visible]:translate-y-0 motion-reduce:transition-none md:h-[72px] xl:h-[88px] ${
                scrolled ? 'xl:h-20' : ''
            } ${
                active
                    ? 'border-line bg-field/95 text-ink backdrop-blur-lg'
                    : darkTop
                      ? 'border-white/20 text-white'
                      : 'border-transparent text-ink'
            } ${hidden ? '-translate-y-full' : ''}`}
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
                        src={light ? '/images/logo-blue-02.svg' : '/images/logo.svg'}
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
                            className={`whitespace-nowrap py-[28px] text-[15px] font-semibold transition-colors duration-200 2xl:py-[30px] ${navTone(light, isCurrent(pathname, href))}`}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-2 xl:ml-0 xl:gap-0">
                    {/* 링크라서 JS 없이도 홈 신청 폼(/#apply)으로 간다. JS가 있으면 진단 창을 연다 */}
                    <Link
                        href="/#apply"
                        data-track-cta="consultation"
                        onClick={(event) => {
                            event.preventDefault();
                            onDiagnosis(event.currentTarget);
                        }}
                        className={`inline-flex h-9 items-center rounded-lg px-3.5 text-[14px] font-extrabold transition-colors xl:h-12 xl:px-5 xl:text-[14px] 2xl:px-8 2xl:text-body ${
                            light ? 'bg-brand text-white' : 'bg-white text-brand'
                        }`}
                    >
                        <span className="xl:hidden">무료진단</span>
                        <span className="hidden xl:inline">무료진단 받기</span>
                    </Link>
                    <button
                        type="button"
                        aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
                        aria-expanded={menuOpen}
                        aria-controls="mobile-navigation"
                        onClick={onMenuToggle}
                        className={`grid h-10 place-items-center rounded-xl border shadow-sm transition-[width,background,border-color,transform] active:scale-95 xl:hidden ${
                            MOBILE_MENU_VARIANT === 5 ? 'w-[64px]' : 'w-10'
                        } ${
                            light
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
