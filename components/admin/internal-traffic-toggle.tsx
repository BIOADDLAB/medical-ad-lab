'use client';

import { useSyncExternalStore } from 'react';
import { internalTrafficExcluded, setInternalTrafficExcluded } from '@/lib/visitor';
import { clearPendingVisits } from '@/lib/visit-capture';

const eventName = 'medical-ad-lab-tracking-preference';
const subscribe = (listener: () => void) => {
    window.addEventListener(eventName, listener);
    window.addEventListener('focus', listener);
    return () => {
        window.removeEventListener(eventName, listener);
        window.removeEventListener('focus', listener);
    };
};

export function InternalTrafficToggle() {
    const excluded = useSyncExternalStore(subscribe, internalTrafficExcluded, () => false);
    return (
        <div className="mb-5 rounded-xl border border-line bg-white p-4">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-bold">
                <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand"
                    checked={excluded}
                    onChange={(event) => {
                        setInternalTrafficExcluded(event.target.checked);
                        clearPendingVisits();
                        window.dispatchEvent(new Event(eventName));
                    }}
                />
                이 브라우저의 내부 테스트 방문 집계 제외
            </label>
            <p className="mb-0 mt-2 text-xs leading-5 text-slate">
                {excluded ? '이 브라우저의 이후 방문은 집계하지 않습니다.' : '현재 이 브라우저의 방문도 집계합니다.'}{' '}
                이미 저장된 기록은 유지되며, 실제 유입을 점검할 때는 해제하거나 다른 브라우저를 사용하세요.
            </p>
        </div>
    );
}
