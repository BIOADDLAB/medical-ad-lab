import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { validReportRange } from '@/lib/traffic-report';
import {
    readSearchReport,
    SearchConsoleError,
    searchConsoleReady,
    searchConsoleProperty,
    searchConsoleAccount,
} from '@/lib/search-console';

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
        const setup = {
            ready: searchConsoleReady,
            siteUrl: searchConsoleProperty,
            serviceAccount: searchConsoleAccount,
        };
        if (!searchConsoleReady)
            return NextResponse.json(
                {
                    ...setup,
                    message: '검색어 자동 조회 설정이 필요합니다. 아래 연결 안내를 확인해 주세요.',
                },
                { headers },
            );
        try {
            return NextResponse.json({ ...setup, report: await readSearchReport({ from, to: to! }) }, { headers });
        } catch (error) {
            const message =
                error instanceof SearchConsoleError
                    ? error.message
                    : '구글 검색어 조회에 실패했습니다. 서비스 계정 인증과 네트워크 상태를 확인해 주세요.';
            return NextResponse.json({ ...setup, message }, { status: 502, headers });
        }
    } catch {
        return NextResponse.json(
            { message: '관리자 인증을 확인하지 못했습니다. 다시 로그인해 주세요.' },
            { status: 502, headers },
        );
    }
}
