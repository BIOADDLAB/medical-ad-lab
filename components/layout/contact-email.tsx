'use client';

import { useEffect, useState } from 'react';
import { loadSettings } from '@/lib/admin-store';
import { firebaseReady } from '@/lib/firebase';

/** 관리자 설정에 대표 이메일이 있으면 푸터에 보여준다. 없으면 아무것도 그리지 않는다 */
export function ContactEmail() {
    const [email, setEmail] = useState('');

    useEffect(() => {
        if (!firebaseReady) return;
        loadSettings()
            .then((settings) => setEmail(settings.contactEmail))
            .catch(() => {});
    }, []);

    if (!email) return null;
    return (
        <a href={`mailto:${email}`} className="mt-2 block text-sm text-muted">
            {email}
        </a>
    );
}
