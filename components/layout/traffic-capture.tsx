'use client';

import { useEffect } from 'react';
import { captureTraffic } from '@/lib/traffic';

/** 페이지를 새로 불러올 때마다 query·referrer 를 분류해 최초·직전 유입을 갱신한다. 사이트 안 이동은 다시 실행되지 않는다 */
export function TrafficCapture() {
    useEffect(() => {
        captureTraffic();
    }, []);

    return null;
}
