import type { ReactNode } from 'react';

import { BlogTracker, HideSiteChrome } from '@/bioadd-blog/ui-client';
import { HOSPITAL } from '@/bioadd-blog/hospital.config';
import '@/bioadd-blog/styles.css';

export default function BlogLayout({ children }: { children: ReactNode }) {
    return (
        <div data-bioadd-blog="" className="min-h-screen bg-[#faf9f7] text-slate-900">
            <HideSiteChrome />
            <BlogTracker hospitalId={HOSPITAL.id} />
            {children}
        </div>
    );
}
