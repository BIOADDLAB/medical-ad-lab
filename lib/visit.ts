import type { Touch } from './traffic';

export type VisitInput = {
    visitorId: string;
    visitSessionId: string;
    eventId: string;
    entry: Touch;
    pageUrl: string;
    pageTitle: string;
    pageAt: string;
};

export type VisitLocation = { country: string; region: string; city: string; locationSource: string };
export type VisitRecord = VisitLocation & {
    id: string;
    visitorId: string;
    startedAt: string;
    lastAt: string;
    source: string;
    medium: string;
    evidence: string;
    keyword: string;
    keywordType: string;
    adKeyword: string;
    term: string;
    campaign: string;
    content: string;
    referrer: string;
    externalUrl: string;
    externalTitle: string;
    landingUrl: string;
    landingTitle: string;
    device: string;
    pageCount: number;
    hospital: string;
    inquiryAt: string;
};
export type VisitPage = { id: string; url: string; title: string; at: string };

const regions: Record<string, string> = {
    '11': '서울',
    '26': '부산',
    '27': '대구',
    '28': '인천',
    '29': '광주',
    '30': '대전',
    '31': '울산',
    '41': '경기',
    '42': '강원',
    '43': '충북',
    '44': '충남',
    '45': '전북',
    '46': '전남',
    '47': '경북',
    '48': '경남',
    '49': '제주',
    '50': '세종',
};
const cities: Record<string, string> = {
    Seoul: '서울',
    Busan: '부산',
    Daegu: '대구',
    Incheon: '인천',
    Gwangju: '광주',
    Daejeon: '대전',
    Ulsan: '울산',
    Sejong: '세종',
    Suwon: '수원',
    Seongnam: '성남',
    Yongin: '용인',
    Goyang: '고양',
    Jeju: '제주',
    Chuncheon: '춘천',
    Cheongju: '청주',
};

export function locationLabel(value: VisitLocation) {
    let country = value.country;
    if (/^[A-Z]{2}$/.test(country)) {
        try {
            country = new Intl.DisplayNames(['ko'], { type: 'region' }).of(country) || country;
        } catch {}
    }
    const region = value.country === 'KR' ? regions[value.region] || value.region : value.region;
    const city = cities[value.city] || value.city;
    return [...new Set([country, region, city].filter(Boolean))].join(' · ') || '위치 정보 미제공';
}

export const visitTime = (value: string) =>
    Number.isFinite(Date.parse(value))
        ? new Intl.DateTimeFormat('ko-KR', {
              timeZone: 'Asia/Seoul',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hourCycle: 'h23',
          }).format(new Date(value))
        : '기록 없음';
