import Script from 'next/script';

/** 관리자 화면에서 저장한 측정 ID(서버에서 읽어 넘김)로 스크립트를 넣는다. ID가 없으면 아무것도 넣지 않는다 */
export function Analytics({ gaId, pixelId }: { gaId: string; pixelId: string }) {
    return (
        <>
            {gaId && (
                <>
                    <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
                    <Script id="ga4" strategy="afterInteractive">
                        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}')`}
                    </Script>
                </>
            )}
            {pixelId && (
                <Script id="meta-pixel" strategy="afterInteractive">
                    {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView')`}
                </Script>
            )}
        </>
    );
}
