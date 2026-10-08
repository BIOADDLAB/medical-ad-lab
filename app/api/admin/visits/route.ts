import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { listVisitPages, listVisits, visitsReady, VisitStoreError } from '@/lib/visits-store';
import { validVisitorId } from '@/lib/visitor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        if (!(await verifyAdmin(request)))
            return NextResponse.json({ message: '관리자 로그인 권한을 확인해 주세요.' }, { status: 401 });
        if (!visitsReady)
            return NextResponse.json({
                ready: false,
                visits: [],
                truncated: false,
                message: 'Firebase 프로젝트와 Google 서비스 계정 환경변수를 설정해 주세요.',
            });
        const search = new URL(request.url).searchParams;
        const id = search.get('session');
        if (id) {
            if (!validVisitorId(id)) return new Response(null, { status: 400 });
            return NextResponse.json(await listVisitPages(id), { headers: { 'Cache-Control': 'private, no-store' } });
        }
        const from = search.get('from'),
            to = search.get('to');
        if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to))
            return new Response(null, { status: 400 });
        const start = Date.parse(`${from}T00:00:00+09:00`);
        const end = Date.parse(`${to}T00:00:00+09:00`) + 86400000;
        if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start > 90 * 86400000)
            return NextResponse.json(
                { message: '조회 기간은 최대 90일입니다. 날짜를 확인해 주세요.' },
                { status: 400 },
            );
        return NextResponse.json(
            { ready: true, ...(await listVisits(new Date(start).toISOString(), new Date(end).toISOString())) },
            { headers: { 'Cache-Control': 'private, no-store' } },
        );
    } catch (error) {
        const denied = error instanceof VisitStoreError && error.status === 403;
        const message = denied
            ? '서비스 계정에 Firebase 프로젝트의 Cloud Datastore User 권한을 추가한 뒤 다시 조회해 주세요.'
            : '방문 기록을 불러오지 못했습니다. Firestore 연결과 서비스 계정 권한을 확인해 주세요.';
        console.error('[admin-visits]', error instanceof Error ? error.message : 'unknown');
        return NextResponse.json({ message }, { status: 502 });
    }
}
