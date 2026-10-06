'use client';

import { useEffect } from 'react';
import { captureTraffic } from '@/lib/traffic';

/** 어느 페이지로 들어오든 최초 진입 시점의 query·referrer를 잡아 둔다 */
export function TrafficCapture() {
    useEffect(() => {
        captureTraffic();
    }, []);

    return null;
}
