'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MobileNav, SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

export function SiteShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isMain = pathname === '/';
    const isAdmin = pathname.startsWith('/admin');

    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    if (isAdmin) return <>{children}</>;

    return (
        <>
            <SiteHeader
                solid={scrolled || !isMain}
                menuOpen={menuOpen}
                onMenuOpen={() => setMenuOpen(true)}
                onDiagnosis={() => {}}
            />
            <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} onDiagnosis={() => {}} />
            {children}
            <SiteFooter />
        </>
    );
}
