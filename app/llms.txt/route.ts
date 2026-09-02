import { faqs, mediaItems, processItems } from '@/data';
import { getReferences, getSpots } from '@/lib/references';
import { SITE_URL } from '@/lib/site';

export const revalidate = 3600;

/**
 * ChatGPT·Claude·Perplexity 같은 AI 답변 엔진이 읽는 요약 파일.
 * HTML을 헤매지 않고 무엇을 하는 회사인지 바로 알 수 있게 평문으로 둔다.
 */
export async function GET() {
    const baseUrl = SITE_URL;
    const [references, spots] = await Promise.all([getReferences(), getSpots()]);

    const text = [
        '# 병원광고연구소 (MEDICAL AD LAB)',
        '',
        '> 병원 위치와 진료과를 기준으로 옥외광고 매체·지역·비용을 비교하고 맞춤 실행 플랜을 제안하는 국내 병원 전문 옥외광고 대행사입니다. 무료진단은 비용이 들지 않고 계약 의무가 없습니다.',
        '',
        '## 취급 매체',
        ...mediaItems.map((item) => `- ${item.title}: ${item.description}`),
        '',
        '## 진행 방식',
        ...processItems.map(([number, title, description]) => `${number}. ${title} — ${description}`),
        '',
        '## 자주 묻는 질문',
        ...faqs.flatMap(([question, answer]) => [`### ${question}`, answer, '']),
        '## 집행 사례',
        ...references.map((item) => `- [${item.title} (${item.area} ${item.type})](${baseUrl}/cases/${item.slug})`),
        '',
        '## 집행 가능한 광고매체',
        ...spots.map((item) => `- [${item.title} (${item.area} ${item.type})](${baseUrl}/media/${item.slug})`),
        '',
        '## 칼럼',
        '',
        '## 문의',
        `- 회사소개: ${baseUrl}/company`,
        `- 무료진단 신청: ${baseUrl}/#apply`,
        `- 개인정보처리방침: ${baseUrl}/privacy`,
    ].join('\n');

    return new Response(text, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
    });
}
