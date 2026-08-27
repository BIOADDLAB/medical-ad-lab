import type { ReactNode } from 'react';

import { BlogTracker } from '@/bioadd-blog/ui-client';
import { HOSPITAL } from '@/bioadd-blog/hospital.config';
import { PageBanner } from '@/components/layout/page-banner';
import '@/bioadd-blog/styles.css';

export default function BlogLayout({ children }: { children: ReactNode }) {
    return (
        <div data-bioadd-blog="" className="min-h-screen bg-[#faf9f7] pt-[60px] text-slate-900 lg:pt-0">
            <BlogTracker hospitalId={HOSPITAL.id} />
            <PageBanner variant="journal" />
            {children}
        </div>
    );
}
