import { NextResponse } from 'next/server';
import { emailReady, sendLeadEmail } from '@/lib/email';
import { formatKST, leadToRow, type Lead } from '@/lib/lead';
import { appendLeadRow, sheetsReady } from '@/lib/sheets';

export const runtime = 'nodejs';

const required = ['hospital', 'area', 'phone', 'email', 'privacy'] as const;
const recent = new Map<string, number[]>();

/** 동일 IP 분당 3회 제한. 서버리스 인스턴스 단위이므로 1차 방어용이다. */
function tooManyRequests(ip: string) {
    const now = Date.now();
    const hits = (recent.get(ip) ?? []).filter((time) => now - time < 60_000);
    hits.push(now);
    recent.set(ip, hits);
    if (recent.size > 500) recent.clear();
    return hits.length > 3;
}

export async function POST(request: Request) {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ message: '필수 항목을 확인해 주세요.' }, { status: 400 });

    // 허니팟: 봇에게는 실패를 알리지 않는다.
    if (typeof body.company === 'string' && body.company.trim()) return NextResponse.json({ ok: true });

    if (required.some((key) => !body[key])) {
        return NextResponse.json({ message: '필수 항목을 확인해 주세요.' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    if (tooManyRequests(ip)) {
        return NextResponse.json({ message: '잠시 후 다시 시도해 주세요.' }, { status: 429 });
    }

    const lead: Lead = {
        createdAt: formatKST(),
        hospital: String(body.hospital).trim(),
        area: String(body.area).trim(),
        phone: String(body.phone).trim(),
        email: String(body.email).trim(),
        message: String(body.message ?? '')
            .trim()
            .slice(0, 300),
        source: String(body.source ?? '').trim(),
    };

    if (!sheetsReady && !emailReady) {
        console.warn('[lead] 연동 전 데모 모드로 처리됨', lead.hospital);
        return NextResponse.json({ ok: true, mode: 'demo' }, { status: 202 });
    }

    // 리드 유실이 최악이므로 시트 저장과 메일 발송을 독립 실행한다.
    const [sheetResult, mailResult] = await Promise.allSettled([
        sheetsReady ? appendLeadRow(leadToRow(lead)) : Promise.reject(new Error('sheets skipped')),
        emailReady ? sendLeadEmail(lead) : Promise.reject(new Error('email skipped')),
    ]);

    if (sheetResult.status === 'rejected') {
        console.error('[lead] 시트 저장 실패', sheetResult.reason);

        return NextResponse.json({ message: '문의 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 });
    }

    if (mailResult.status === 'rejected') {
        console.error('[lead] 메일 발송 실패', mailResult.reason);
    }

    return NextResponse.json({ ok: true });
}
