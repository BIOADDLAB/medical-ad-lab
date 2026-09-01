import Link from 'next/link';
import { SITE_URL } from '@/lib/site';

export type Crumb = { name: string; href: string };

/** 마지막 항목이 현재 페이지다. 링크로 만들지 않는다 */
export function Breadcrumb({ trail }: { trail: Crumb[] }) {
    return (
        <nav aria-label="브레드크럼" className="text-xs text-muted">
            <ol className="flex flex-wrap items-center gap-2">
                {trail.map((step, index) => {
                    const current = index === trail.length - 1;
                    return (
                        <li key={step.href} className="flex items-center gap-2">
                            {index > 0 && <span aria-hidden="true">/</span>}
                            {current ? (
                                <span aria-current="page">{step.name}</span>
                            ) : (
                                <Link href={step.href} className="hover:text-brand">
                                    {step.name}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

/** 화면에 보이는 브레드크럼과 항목이 1:1로 같아야 한다 */
export function breadcrumbJsonLd(trail: Crumb[]) {
    return {
        '@type': 'BreadcrumbList',
        itemListElement: trail.map((step, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: step.name,
            item: `${SITE_URL}${step.href}`,
        })),
    };
}
