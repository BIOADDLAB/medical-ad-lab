import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { emailReady } from '@/lib/email';
import { maskEmail, maskPhone, rowToLead } from '@/lib/lead';
import { readLeadRows, sheetsReady, sheetUrl } from '@/lib/sheets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
        const rows = await readLeadRows();
        // 연락처·이메일은 가린 채 내려보낸다. 원본은 시트에만 둔다
        const leads = rows.map(rowToLead).map((lead) => ({
            ...lead,
            phone: maskPhone(lead.phone),
            email: maskEmail(lead.email),
        }));
        leads.reverse();
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
