'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { captureTraffic } from '@/lib/traffic';
import { recordPageVisit, flushVisitQueue } from '@/lib/visit-capture';

function Capture() {
    const pathname = usePathname();
    const search = useSearchParams().toString();

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        const capture = () => {
            captureTraffic();
            clearTimeout(timer);
            timer = setTimeout(recordPageVisit, 250);
        };
        capture();
        const observer = new MutationObserver(capture);
        const title = document.querySelector('title');
        if (title) observer.observe(title, { childList: true, subtree: true, characterData: true });
        window.addEventListener('pageshow', capture);
        window.addEventListener('online', flushVisitQueue);
        const leave = () => {
            clearTimeout(timer);
            recordPageVisit();
        };
        window.addEventListener('pagehide', leave);
        return () => {
            clearTimeout(timer);
            observer.disconnect();
            window.removeEventListener('pageshow', capture);
            window.removeEventListener('online', flushVisitQueue);
            window.removeEventListener('pagehide', leave);
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
