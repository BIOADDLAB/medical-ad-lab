import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { validReportRange } from '@/lib/traffic-report';
import { readTrafficReport } from '@/lib/traffic-report-store';
import { visitsReady, VisitStoreError } from '@/lib/visits-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(request: Request) {
    try {
        if (!(await verifyAdmin(request)))
            return NextResponse.json({ message: '관리자 로그인 권한을 확인해 주세요.' }, { status: 401, headers });
        const search = new URL(request.url).searchParams;
        const from = search.get('from');
        const to = search.get('to');
        if (!validReportRange(from, to))
            return NextResponse.json(
                { message: '조회 기간은 오늘까지 최대 90일입니다. 날짜를 확인해 주세요.' },
                { status: 400, headers },
            );
        if (!visitsReady)
            return NextResponse.json(
                {
                    ready: false,
                    message: '방문 저장소가 연결되지 않았습니다. 기존 Firebase·서비스 계정 설정을 확인해 주세요.',
                },
                { headers },
            );
        return NextResponse.json({ ready: true, report: await readTrafficReport({ from, to: to! }) }, { headers });
    } catch (error) {
        const message =
            error instanceof VisitStoreError && error.status === 403
                ? '서비스 계정의 Cloud Datastore User 권한을 확인해 주세요.'
                : '전체 방문 집계를 완료하지 못했습니다. 연결 상태를 확인하거나 조회 기간을 줄여 다시 시도해 주세요.';
        console.error('[traffic-report]', error instanceof Error ? error.message : 'unknown');
        return NextResponse.json({ message }, { status: 502, headers });
    }
}
