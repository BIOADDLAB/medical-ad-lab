import type { Metadata } from 'next';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

export const metadata: Metadata = {
    title: '관리자',
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
    // 루트 레이아웃의 canonical('/')을 물려받지 않게 자기 주소로 덮는다
    alternates: { canonical: '/admin' },
};

export default function AdminPage() {
    return <AdminDashboard />;
}
