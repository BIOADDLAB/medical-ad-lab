/**
 * 사이트 주소. 도메인은 하나뿐이라 환경변수로 나누지 않고 여기서만 고친다.
 * canonical, sitemap, robots, 구조화 데이터가 전부 이 값을 쓴다
 */
export const SITE_URL = 'https://www.medicaladlab.com';

/**
 * 검색엔진 소유확인 코드. 콘솔이 주는 content 값만 따옴표 안에 넣으면 된다.
 * 비워 두면 해당 meta 태그를 아예 안 넣는다. 비밀값이 아니라 어차피 HTML 에 노출된다
 */
export const SITE_VERIFICATION = {
    /** 구글 서치콘솔 · HTML 태그 방식의 content 값 */
    google: 'AXPcBDYwU84aF3-4OBmzGuwwduwkMu3Ztt0IVv4q4yg',
    /** 네이버 서치어드바이저 · 사이트 소유확인의 content 값 */
    naver: '',
};
