'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MobileNav, SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { ScrollTopButton } from '@/components/layout/scroll-top-button';
import { DiagnosisModal } from '@/components/lead/diagnosis-modal';

export function SiteShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isMain = pathname === '/';
    const isAdmin = pathname.startsWith('/admin');

    const [menuOpen, setMenuOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalDirty, setModalDirty] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const openerRef = useRef<HTMLElement | null>(null);

    // 메인은 히어로에 폼이 이미 있으므로 모달 대신 그쪽으로 보낸다
    const openDiagnosis = useCallback(
        (opener?: HTMLElement | null) => {
            setMenuOpen(false);
            if (isMain) {
                window.dispatchEvent(new CustomEvent('main-form-open'));
                return;
            }
            openerRef.current = opener || (document.activeElement as HTMLElement);
            setModalOpen(true);
        },
        [isMain],
    );

    const closeModal = useCallback(() => {
        setModalOpen(false);
        setModalDirty(false);
        window.setTimeout(() => openerRef.current?.focus(), 0);
    }, []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = modalOpen || menuOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [modalOpen, menuOpen]);

    useEffect(() => {
        const handler = (event: Event) => openDiagnosis((event as CustomEvent<HTMLElement>).detail);
        window.addEventListener('diagnosis-open', handler);
        return () => window.removeEventListener('diagnosis-open', handler);
    }, [openDiagnosis]);

    useEffect(() => {
        const closeMenu = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setMenuOpen(false);
        };
        document.addEventListener('keydown', closeMenu);
        return () => document.removeEventListener('keydown', closeMenu);
    }, []);

    if (isAdmin) return <>{children}</>;

    return (
        <>
            <SiteHeader
                solid={scrolled || !isMain}
                menuOpen={menuOpen}
                onMenuToggle={() => setMenuOpen((open) => !open)}
                onDiagnosis={openDiagnosis}
            />
            <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} onDiagnosis={openDiagnosis} />
            {children}
            <SiteFooter />
            <ScrollTopButton hidden={menuOpen || modalOpen} />
            {!isMain && (
                <DiagnosisModal
                    open={modalOpen}
                    dirty={modalDirty}
                    onClose={closeModal}
                    onDirty={() => setModalDirty(true)}
                />
            )}
        </>
    );
}
