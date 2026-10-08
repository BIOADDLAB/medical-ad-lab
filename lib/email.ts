import type { Lead } from './lead';
import { sheetUrl } from './sheets';
import { evidenceLabel, readViewedArticles } from './traffic';

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.MAIL_FROM ?? '병원광고연구소 <onboarding@resend.dev>';
const notifyEmails = (process.env.NOTIFY_EMAILS ?? '')
    .split(/[,;\n]+/)
    .map((value) => value.trim())
    .filter(Boolean);

export const emailReady = Boolean(apiKey && notifyEmails.length);

const escape = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const row = (label: string, value: string) => `
  <tr>
    <td style="padding:14px 18px;border-bottom:1px solid #eef1f6;color:#64748b;font-size:13px;white-space:nowrap;">${label}</td>
    <td style="padding:14px 18px;border-bottom:1px solid #eef1f6;color:#0d1b2a;font-size:14px;font-weight:600;word-break:break-word;white-space:pre-line;">${escape(value) || '-'}</td>
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
          ${row('최근 확인된 유입', lead.source)}
          ${row('판별 근거', evidenceLabel(lead.trafficEvidence))}
          ${lead.trafficTitle ? row('유입 콘텐츠', lead.trafficTitle) : ''}
          ${row(lead.trackingVersion === '2' ? '전달된 검색어' : '기존 키워드 (유형 미구분)', lead.trafficKeyword || '전달되지 않음')}
          ${lead.trafficKeywordType ? row('검색어 근거', lead.trafficKeywordType === 'naver_query' ? '네이버 광고 n_query' : '이전 검색 URL') : ''}
          ${lead.trafficAdKeyword ? row('광고 등록 키워드', lead.trafficAdKeyword) : ''}
          ${lead.trafficTerm ? row('운영 태그 (utm_term)', lead.trafficTerm) : ''}
          ${lead.trafficContent ? row('글·링크 식별자', lead.trafficContent) : ''}
          ${lead.trafficCampaign ? row('캠페인', lead.trafficCampaign) : ''}
          ${lead.trafficUrl ? row('유입 콘텐츠 주소', lead.trafficUrl) : ''}
          ${lead.trafficReferrer ? row('브라우저 이전 주소', lead.trafficReferrer) : ''}
          ${lead.trafficCapturedAt ? row('출처 확인 시각', lead.trafficCapturedAt) : ''}
          ${lead.landingUrl ? row('최근 출처의 진입 페이지', [lead.landingTitle, lead.landingUrl].filter(Boolean).join('\n')) : ''}
          ${lead.sessionSource ? row('이번 방문', lead.sessionSource) : ''}
          ${lead.sessionLandingUrl ? row('이번 진입 페이지', [lead.sessionLandingTitle, lead.sessionLandingUrl].filter(Boolean).join('\n')) : ''}
          ${lead.firstTouch ? row('최초 방문', lead.firstTouch) : ''}
          ${lead.firstLandingUrl ? row('최초 진입 페이지', [lead.firstLandingTitle, lead.firstLandingUrl].filter(Boolean).join('\n')) : ''}
          ${readViewedArticles(lead.viewedArticles)
              .map((article) => row('조회한 홈페이지 글', `${article.title}\n${article.url}`))
              .join('')}
          ${lead.journeyPages ? row('페이지 이동', lead.journeyPages) : ''}
          ${lead.submitUrl ? row('문의한 페이지', lead.submitUrl) : ''}
          ${lead.device ? row('기기', lead.device) : ''}
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
    if (!emailReady) {
        console.error('[Resend] 환경변수 없음', {
            hasApiKey: Boolean(apiKey),
            notifyEmails,
        });

        throw new Error('Resend 환경변수가 설정되지 않았습니다.');
    }

    if (notifyEmails.length > 50 || notifyEmails.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
        throw new Error('NOTIFY_EMAILS에는 올바른 이메일 주소를 최대 50개까지 입력해 주세요.');
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from,
            to: notifyEmails,
            reply_to: lead.email,
            subject: `[신규 리드] ${lead.hospital} / ${lead.area}`,
            html: buildHtml(lead),
        }),
    });

    const responseBody = await response.text();

    console.log('[Resend 응답]', {
        status: response.status,
        ok: response.ok,
        body: responseBody,
    });

    if (!response.ok) {
        throw new Error(`Resend ${response.status}: ${responseBody}`);
    }
}
