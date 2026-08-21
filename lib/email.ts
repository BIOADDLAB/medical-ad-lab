import type { Lead } from './lead';
import { sheetUrl } from './sheets';

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.MAIL_FROM ?? '병원광고연구소 <onboarding@resend.dev>';
const notifyEmails = (process.env.NOTIFY_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

export const emailReady = Boolean(apiKey && notifyEmails.length);

const escape = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const row = (label: string, value: string) => `
  <tr>
    <td style="padding:14px 18px;border-bottom:1px solid #eef1f6;color:#64748b;font-size:13px;white-space:nowrap;">${label}</td>
    <td style="padding:14px 18px;border-bottom:1px solid #eef1f6;color:#0d1b2a;font-size:14px;font-weight:600;">${escape(value) || '-'}</td>
  </tr>`;

function buildHtml(lead: Lead) {
    return `<!doctype html>
<html lang="ko"><body style="margin:0;padding:32px 12px;background:#f3f5f7;font-family:'Apple SD Gothic Neo','Malgun Gothic',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(13,27,42,.08);">
    <tr>
      <td style="padding:28px 24px;background:#0d1b2a;">
        <p style="margin:0;color:#7faeff;font-size:11px;font-weight:800;letter-spacing:.18em;">MEDICAL AD LAB</p>
        <h1 style="margin:10px 0 0;color:#fff;font-size:20px;font-weight:700;">새 무료진단 신청이 접수되었습니다</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,.6);font-size:13px;">${escape(lead.createdAt)} 접수 · 영업일 24시간 내 연락</p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 6px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${row('병원명', lead.hospital)}
          ${row('지역', lead.area)}
          ${row('연락처', lead.phone)}
          ${row('이메일', lead.email)}
          ${row('문의내용', lead.message)}
          ${row('유입경로', lead.source)}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        ${sheetUrl ? `<a href="${sheetUrl}" style="display:block;padding:15px;border-radius:12px;background:#2468f0;color:#fff;font-size:14px;font-weight:700;text-align:center;text-decoration:none;">구글시트에서 전체 리드 보기</a>` : ''}
        <p style="margin:18px 0 0;color:#94a3b8;font-size:12px;line-height:1.7;">연락 후 시트의 처리상태를 신규 → 연락완료 → 제안발송 → 종료 순으로 갱신해 주세요.</p>
      </td>
    </tr>
  </table>
</body></html>`;
}

export async function sendLeadEmail(lead: Lead) {
    if (!emailReady) throw new Error('Resend 환경변수가 설정되지 않았습니다.');

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from,
            to: notifyEmails,
            reply_to: lead.email,
            subject: `[신규 리드] ${lead.hospital} / ${lead.area}`,
            html: buildHtml(lead),
        }),
    });

    if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`);
}
