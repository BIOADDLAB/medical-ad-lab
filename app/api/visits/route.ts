import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { parseVisit, saveVisitPage, visitsReady } from '@/lib/visits-store';
import { requestTrackingDisabled } from '@/lib/visitor';

export const runtime = 'nodejs';
const recent = new Map<string, { at: number; count: number }>();

export async function POST(request: Request) {
    const origin = request.headers.get('origin');
    if (origin !== new URL(request.url).origin)
        return NextResponse.json({ message: '허용되지 않은 요청입니다.' }, { status: 403 });
    if (
        requestTrackingDisabled(request) ||
        /bot|crawl|spider|preview|ChatGPT-User|Claude-User/i.test(request.headers.get('user-agent') || '')
    )
        return new Response(null, { status: 204 });
    if (!visitsReady) return NextResponse.json({ message: '방문 저장소를 연결해 주세요.' }, { status: 503 });
    const ip = request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'local';
    const hash = createHash('sha256').update(ip).digest('hex');
    const now = Date.now();
    if (recent.size > 2000) for (const [id, item] of recent) if (now - item.at > 60000) recent.delete(id);
    const prev = recent.get(hash);
    const next = prev && now - prev.at < 60000 ? { ...prev, count: prev.count + 1 } : { at: now, count: 1 };
    if (recent.size < 5000 || recent.has(hash)) recent.set(hash, next);
    if (next.count > 120) return new Response(null, { status: 429 });
    const raw = await request.text();
    if (raw.length > 12000) return new Response(null, { status: 413 });
    let body: Record<string, unknown>;
    try {
        body = JSON.parse(raw);
    } catch {
        return new Response(null, { status: 400 });
    }
    if (!body || typeof body !== 'object') return new Response(null, { status: 400 });
    const input = parseVisit(request, body);
    if (!input) return NextResponse.json({ message: '방문정보를 확인할 수 없습니다.' }, { status: 400 });
    try {
        await saveVisitPage(input, request);
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('[visits] 저장 실패', error instanceof Error ? error.message : 'unknown');
        return NextResponse.json({ message: '방문정보 저장에 실패했습니다.' }, { status: 502 });
    }
}
