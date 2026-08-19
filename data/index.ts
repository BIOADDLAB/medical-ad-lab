export const painPoints = [
    {
        number: '01',
        title: '받은 견적이 적정한지\n모르겠어요',
        description: '같은 위치라도 업체와 조건에 따라 가격이 달라집니다.',
    },
    {
        number: '02',
        title: '어디에 광고해야 할지\n모르겠어요',
        description: '유명한 매체보다 실제 환자 동선이 중요합니다.',
    },
    {
        number: '03',
        title: '지금 광고를 계속해야\n할지 고민이에요',
        description: '집행 전 비용과 효과를 같은 기준으로 점검해야 합니다.',
    },
] as const;

export const mediaItems = [
    {
        key: 'subway',
        image: '/images/img-s4-01.png',
        title: '지하철 광고',
        description: '역사 이용객과 생활권 환자에게 높은 주목도로 노출합니다.',
    },
    {
        key: 'bus',
        image: '/images/img-s4-02.png',
        title: '버스광고',
        description: '병원 인근 노선을 따라 상권 전체에 반복적으로 노출합니다.',
    },
    {
        key: 'shelter',
        image: '/images/img-s4-03.png',
        title: '버스정류장 광고',
        description: '대기시간이 있는 정류장에서 선명한 지역 타깃팅이 가능합니다.',
    },
    {
        key: 'apartment',
        image: '/images/img-s4-04.png',
        title: '아파트 광고',
        description: '병원 인근 거주자에게 엘리베이터·게시판으로 반복 노출합니다.',
    },
    {
        key: 'banner',
        image: '/images/img-s4-05.png',
        title: '현수막 광고',
        description: '개원·이전·진료과 안내에 효과적인 생활권 접점 매체입니다.',
    },
    {
        key: 'billboard',
        image: '/images/img-s4-06.png',
        title: '전광판 광고',
        description: '대형 화면과 영상으로 상권 주요 지점에 강한 인상을 남깁니다.',
    },
] as const;

export const metrics = [
    { value: 800, suffix: '+', label: '병원 네트워크' },
    { value: 1400, suffix: '+', label: '옥외매체 네트워크' },
    { value: null, display: '통합 비교', label: '매체 · 위치 · 비용' },
] as const;

export const whyOoh = [
    {
        number: '01',
        keyword: 'PATIENT FLOW',
        title: '환자 동선보다 팔고 싶은 매체를\n추천하는 경우가 있습니다.',
        description: '특정 매체를 먼저 정하지 않고 병원 위치와 진료권부터 확인해야 합니다.',
        image: '/images/img-s2-01.png',
    },
    {
        number: '02',
        keyword: 'HIDDEN COST',
        title: '처음 견적에 없던 비용이\n집행 직전에 추가됩니다.',
        description: '제작·설치·의료광고 심의 비용까지 총집행비용으로 비교합니다.',
        image: '/images/img-s2-02.png',
    },
    {
        number: '03',
        keyword: 'SAME CONDITION',
        title: '비교 기준이 다르면 적정 가격을\n판단할 수 없습니다.',
        description: '위치·기간·규격과 제작 조건을 동일하게 맞춰 비교합니다.',
        image: '/images/img-s2-03.png',
    },
] as const;

export const resultCards = [
    {
        number: '01',
        title: '견적 검증 리포트',
        image: '/images/img-s3-01.png',
        tags: ['적정가격 · 누락비용', '심의비 · 총집행비용'],
    },
    {
        number: '02',
        title: '맞춤 광고 플랜',
        image: '/images/img-s3-02.png',
        tags: ['주변 매체 · 환자 동선', '예산별 비교안 · 일정'],
    },
] as const;

export const whyLabItems = [
    {
        number: '01',
        keyword: 'SAME STANDARD',
        title: '같은 조건으로 비교해야 가격이 보입니다.',
        description: '위치·기간·규격과 제작 조건을 맞춰 총집행비용을 비교합니다.',
        image: '/images/img-s6-01.png',
    },
    {
        number: '02',
        keyword: 'PATIENT FIRST',
        title: '팔고 싶은 매체보다 환자가 움직이는 곳을 찾습니다.',
        description: '특정 매체를 먼저 정하지 않고 병원 위치와 환자 동선부터 분석합니다.',
        image: '/images/img-s6-02.png',
    },
    {
        number: '03',
        keyword: 'FULL PROCESS',
        title: '집행 전에 심의와 추가비용까지 확인합니다.',
        description: '디자인·심의·제작·설치 과정의 비용과 일정을 함께 검토합니다.',
        image: '/images/img-s6-03.png',
    },
] as const;

export const processItems = [
    ['01', '무료진단 신청', '병원 정보 입력'],
    ['02', '위치·목표 확인', '진료권과 예산 파악'],
    ['03', '매체·견적 비교', '동일 조건 분석'],
    ['04', '디자인·심의', '규격과 심의 검토'],
    ['05', '설치·결과 관리', '현장과 집행 확인'],
] as const;

export const faqs = [
    [
        '정말 무료인가요?',
        '네. 견적 검증과 맞춤 광고 플랜 제안까지 비용이 발생하지 않습니다. 집행을 결정한 뒤에만 비용이 생깁니다.',
    ],
    [
        '신청하면 반드시 광고를 계약해야 하나요?',
        '아닙니다. 무료진단은 비교와 판단을 위한 단계이며 별도의 계약 의무가 없습니다.',
    ],
    [
        '아직 받은 견적이 없어도 신청할 수 있나요?',
        '네. 정해둔 매체나 견적이 없어도 병원 위치와 진료과를 기준으로 후보 매체부터 찾아드립니다.',
    ],
    [
        '의료광고 심의와 디자인도 가능한가요?',
        '네. 매체 규격에 맞춘 디자인 제작과 의료광고 심의, 설치까지 함께 진행할 수 있습니다.',
    ],
    [
        '어느 지역까지 진행할 수 있나요?',
        '전국에서 진행합니다. 수도권 외 지역도 매체 네트워크를 통해 조건과 비용을 확인해 드립니다.',
    ],
    ['진단 결과는 언제 받을 수 있나요?', '신청 내용을 확인한 뒤 영업일 기준 24시간 이내 1차 안내를 드립니다.'],
] as const;

export const insightPosts = [
    {
        slug: 'patient-flow-before-media',
        category: '매체 전략',
        title: '병원 옥외광고, 매체보다 생활권을 먼저 봐야 하는 이유',
        excerpt: '병원 반경과 환자 이동 동선을 기준으로 매체 조합을 설계하는 방법을 정리했습니다.',
        date: '2026.08.12',
        readTime: '6분',
        tone: 'blue',
    },
    {
        slug: 'three-local-standards',
        category: '지역 분석',
        title: '같은 구에서도 광고 효율이 달라지는 세 가지 기준',
        excerpt: '유동인구 숫자만으로는 보이지 않는 상권의 방향성과 진료과 적합도를 살펴봅니다.',
        date: '2026.08.08',
        readTime: '5분',
        tone: 'navy',
    },
    {
        slug: 'media-cost-checklist',
        category: '비용 가이드',
        title: '지하철·버스·아파트 광고 비용을 비교할 때 볼 것',
        excerpt: '표면 단가가 아니라 노출 기간, 제작비, 반복 접촉까지 포함해 비교하는 기준입니다.',
        date: '2026.08.01',
        readTime: '7분',
        tone: 'sky',
    },
    {
        slug: 'opening-schedule',
        category: '운영 노트',
        title: '개원 전 옥외광고는 언제부터 준비해야 할까',
        excerpt: '매체 탐색부터 심의, 제작, 설치까지 역산한 현실적인 준비 일정을 안내합니다.',
        date: '2026.07.24',
        readTime: '4분',
        tone: 'slate',
    },
    {
        slug: 'measure-ooh',
        category: '성과 측정',
        title: '옥외광고 성과를 상담 유입과 연결하는 기록 방법',
        excerpt: '온라인 광고처럼 클릭이 없는 옥외광고를 실무에서 측정하는 방식을 소개합니다.',
        date: '2026.07.17',
        readTime: '8분',
        tone: 'indigo',
    },
    {
        slug: 'hospital-copy',
        category: '브랜드',
        title: '환자에게 기억되는 병원 광고 문구의 공통점',
        excerpt: '과장 없이도 진료 강점과 지역성을 전달하는 메시지 구조를 예시로 살펴봅니다.',
        date: '2026.07.10',
        readTime: '5분',
        tone: 'cobalt',
    },
] as const;

export const references = [
    {
        slug: 'gangnam-bus',
        type: '버스광고',
        title: '도심 생활권 순환 노선 랩핑',
        area: '서울 강남구',
        image: '/images/img-ref-bus.svg',
    },
    {
        slug: 'songpa-subway',
        type: '지하철 광고',
        title: '환승역 디지털 포스터 패키지',
        area: '서울 송파구',
        image: '/images/img-ref-subway.svg',
    },
    {
        slug: 'seongnam-shelter',
        type: '버스정류장 광고',
        title: '병원 인근 쉘터 집중 노출',
        area: '경기 성남시',
        image: '/images/img-ref-shelter.svg',
    },
    {
        slug: 'gwangjin-apartment',
        type: '아파트 광고',
        title: '생활권 엘리베이터 미디어',
        area: '서울 광진구',
        image: '/images/img-ref-apartment.svg',
    },
    {
        slug: 'incheon-banner',
        type: '현수막 광고',
        title: '개원 초기 상권 진입 캠페인',
        area: '인천 연수구',
        image: '/images/img-ref-banner.svg',
    },
    {
        slug: 'mapo-billboard',
        type: '전광판 광고',
        title: '교차로 대형 LED 브랜딩',
        area: '서울 마포구',
        image: '/images/img-ref-billboard.svg',
    },
    {
        slug: 'jongno-subway',
        type: '지하철 광고',
        title: '역사 출구 동선 집중 패키지',
        area: '서울 종로구',
        image: '/images/img-ref-subway.svg',
    },
    {
        slug: 'suwon-bus',
        type: '버스광고',
        title: '병원 반경 핵심 노선 반복 노출',
        area: '경기 수원시',
        image: '/images/img-ref-bus.svg',
    },
] as const;
