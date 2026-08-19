'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SiteHeader } from '@/components/layout/site-header';

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
            {children}
        </>
    );
}
