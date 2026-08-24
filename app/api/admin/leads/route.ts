import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { emailReady } from '@/lib/email';
import { rowToLead } from '@/lib/lead';
import { readLeadRows, sheetsReady, sheetUrl } from '@/lib/sheets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 최근 문의가 위로 오게 뒤집는다 */
const rows2leads = (rows: string[][]) => rows.map(rowToLead).reverse();

export async function GET(request: Request) {
    if (!(await verifyAdmin(request))) {
        return NextResponse.json({ message: '권한이 없습니다.' }, { status: 401 });
    }
    if (!sheetsReady) {
        return NextResponse.json({
            ready: false,
            sheetUrl: '',
            leads: [],
            connections: { sheets: false, email: emailReady },
        });
    }

    try {
        // 관리자가 바로 연락해야 하므로 원본 그대로 내려보낸다.
        // 이 응답은 관리자 인증을 통과해야만 나가고, 서버·브라우저 어디에도 저장하지 않는다
        const leads = rows2leads(await readLeadRows());
        return NextResponse.json({
            ready: true,
            sheetUrl,
            leads,
            connections: { sheets: true, email: emailReady },
        });
    } catch (error) {
        console.error('[admin] 리드 조회 실패', error);
        return NextResponse.json({ message: '시트를 읽지 못했습니다.' }, { status: 502 });
    }
}
