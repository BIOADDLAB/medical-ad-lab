'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { loadSettings } from '@/lib/admin-store';
import { firebaseReady } from '@/lib/firebase';

/** 관리자 화면에서 저장한 측정 ID를 읽어 스크립트를 넣는다. ID가 없으면 아무것도 넣지 않는다 */
export function Analytics() {
    const [ids, setIds] = useState({ gaId: '', pixelId: '' });

    useEffect(() => {
        if (!firebaseReady) return;
        loadSettings()
            .then((settings) => setIds({ gaId: settings.gaId, pixelId: settings.pixelId }))
            .catch(() => {});
    }, []);

    return (
        <>
            {ids.gaId && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${ids.gaId}`}
                        strategy="afterInteractive"
                    />
                    <Script id="ga4" strategy="afterInteractive">
                        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ids.gaId}')`}
                    </Script>
                </>
            )}
            {ids.pixelId && (
                <Script id="meta-pixel" strategy="afterInteractive">
                    {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${ids.pixelId}');fbq('track','PageView')`}
                </Script>
            )}
        </>
    );
}
