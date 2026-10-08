'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { captureTraffic } from '@/lib/traffic';

function Capture() {
    const pathname = usePathname();
    const search = useSearchParams().toString();

    useEffect(() => {
        captureTraffic();
        const observer = new MutationObserver(captureTraffic);
        const title = document.querySelector('title');
        if (title) observer.observe(title, { childList: true, subtree: true, characterData: true });
        window.addEventListener('pageshow', captureTraffic);
        return () => {
            observer.disconnect();
            window.removeEventListener('pageshow', captureTraffic);
        };
    }, [pathname, search]);

    return null;
}

export function TrafficCapture() {
    return (
        <Suspense fallback={null}>
            <Capture />
        </Suspense>
    );
}
