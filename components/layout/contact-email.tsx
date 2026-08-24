'use client';

import { useEffect, useState } from 'react';
import { loadSettings } from '@/lib/admin-store';
import { firebaseReady } from '@/lib/firebase';

/** 관리자 설정에 대표 이메일이 있으면 그걸, 없으면 fallback 을 보여준다 */
export function ContactEmail({ fallback = '' }: { fallback?: string }) {
    const [email, setEmail] = useState(fallback);

    useEffect(() => {
        if (!firebaseReady) return;
        loadSettings()
            .then((settings) => settings.contactEmail && setEmail(settings.contactEmail))
            .catch(() => {});
    }, []);

    if (!email) return null;
    return (
        <a href={`mailto:${email}`} className="mt-2 block text-sm text-muted">
            {email}
        </a>
    );
}
