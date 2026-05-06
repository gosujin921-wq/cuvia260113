/**
 * 고속 검색용 초정밀 이미지 속성 데이터 세트 — SK 페이지(/sk) 전용
 *
 * 시나리오: M16 동 3F 설계실에서 반도체 설계문서 반출 시도.
 *           대상자(다크 자켓·슬랙스·블랙 백팩·사원증)를 사내 CCTV로 추적.
 *
 * 이미지 자산은 v2와 동일한 fastsearch_img/qs_img_*.png 를 그대로 재사용함.
 * 속성/CCTV명/위치만 사내 보안 시나리오에 맞춰 재기술.
 */

import i18n from '@/src/i18n';

export type ImageId =
  | '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10'
  | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' | '20'
  | '21' | '22' | '23' | '24' | '25' | '26' | '27' | '28' | '29' | '30'
  | '31' | '32' | '33' | '34' | '35' | '36' | '37' | '38' | '39' | '40'
  | '47' | '48' | '51' | '57' | '59';

export interface ImageAttributeMeta {
  path: string;
  attributes: string[];
}

/**
 * 동의어 맵 (sk 시나리오에 맞춘 속성)
 */
export const ATTRIBUTE_SYNONYM_MAP: Record<string, string[]> = {
  // [인물]
  '남성': ['남자', '남성분', '연구원', '직원'],
  '여성': ['여자', '여성분'],

  // [상의 - 사내 복장]
  '다크자켓': ['검정자켓', '네이비자켓', '어두운자켓', '자켓', '재킷', '점퍼', '아우터'],
  '캐주얼셔츠': ['셔츠', '남방', '와이셔츠'],
  '그레이코트': ['회색코트', '회색아우터', '코트'],

  // [하의·신발]
  '슬랙스': ['정장바지', '면바지', '검정바지', '슬랙', '바지', '하의'],
  '데님팬츠': ['청바지', '청색바지', '진바지'],
  '검정구두': ['구두', '가죽화', '정장화', '검정신발', '신발'],

  // [소지품·장비]
  '블랙백팩': ['검정백팩', '검정가방', '백팩', '배낭', '책가방', '가방'],
  '사원증': ['ID카드', '신분증', '카드', '사번카드', '사원증패용'],
  '노트북파우치': ['노트북가방', '서류가방', '랩탑가방', '파우치'],
  '폰화면주시': ['스마트폰사용', '핸드폰조작', '폰보는중', '휴대폰', '핸드폰', '스마트폰'],
  'USB휴대': ['외장USB', 'USB소지', '외장매체', 'USB'],

  // [사내 환경·위치]
  '주간': ['낮시간', '낮에', '대낮'],
  '야간': ['밤시간', '저녁', '야근시간'],
  '사내복도': ['복도', '통로', '내부복도'],
  '게이트앞': ['출입구', '게이트', '보안게이트', '정문게이트'],
  '로비': ['1층로비', '메인로비', '엘리베이터홀', '로비공간'],
  '연구실앞': ['설계실앞', '랩앞', 'M16앞'],

  // [행동·방향]
  '보행중': ['걷는중', '이동중', '걸어가는'],
  '정지상태': ['멈춰있는', '서있는'],
  '정면': ['앞모습', '얼굴'],
  '후면': ['뒷모습', '뒤'],
  '측면': ['옆모습'],
};

/** 이미지 ID별 속성 — sk 시나리오로 재기술 */
export const IMAGE_ATTRIBUTES: Partial<Record<ImageId, ImageAttributeMeta>> = {
  '05': {
    path: '/fastsearch_img/qs_img_05_n.png',
    attributes: ['여성', '캐주얼셔츠', '슬랙스', '측면', '야간', '사내복도', '정지상태'],
  },
  '11': {
    path: '/fastsearch_img/qs_img_11_n.png',
    attributes: ['성별미상', '그레이코트', '슬랙스', '후면', '주간', '노트북파우치', '보행중'],
  },
  '15': {
    path: '/fastsearch_img/qs_img_15_n.png',
    attributes: ['남성', '다크자켓', '슬랙스', '후면', '사원증', '블랙백팩', '검정구두', '주간'],
  },
  // 21 ~ 59: 박지훈 연구원 추적 시퀀스 (다크 자켓 + 슬랙스 + 블랙 백팩)
  '21': {
    path: '/fastsearch_img/qs_img_21_y.png',
    attributes: ['남성', '다크자켓', '슬랙스', '후면', '주간', '사내복도'],
  },
  '25': {
    path: '/fastsearch_img/qs_img_25_y.png',
    attributes: ['남성', '다크자켓', '슬랙스', '정면', '폰화면주시', '검정구두', '주간'],
  },
  '30': {
    path: '/fastsearch_img/qs_img_30_y.png',
    attributes: ['남성', '다크자켓', '슬랙스', '후면', '주간', '연구실앞'],
  },
  '40': {
    path: '/fastsearch_img/qs_img_40_y.png',
    attributes: ['남성', '다크자켓', '슬랙스', '후면', '보행중', '게이트앞'],
  },
  '47': {
    path: '/fastsearch_img/qs_img_47_y.png',
    attributes: ['남성', '다크자켓', '슬랙스', '측면', '폰화면주시', '보행중', '게이트앞'],
  },
  '51': {
    path: '/fastsearch_img/qs_img_51_y.png',
    attributes: ['남성', '다크자켓', '슬랙스', '정면', '폰화면주시', '검정구두', '게이트앞'],
  },
  '59': {
    path: '/fastsearch_img/qs_img_59_y.png',
    attributes: ['남성', '다크자켓', '슬랙스', '정면', '폰화면주시', '로비', '야간'],
  },
};

const IMAGE_IDS: ImageId[] = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
  '31', '32', '33', '34', '35', '36', '37', '38', '39', '40',
  '48', '57', '59',
];

/**
 * 이미지 ID별 유사도(%) — 박지훈 후보(다크자켓·슬랙스·블랙백팩·남성) 기준
 */
export const IMAGE_CONFIDENCE: Partial<Record<ImageId, number>> = {
  '21': 94,
  '59': 95,
  '40': 94,
  '47': 93,
  '51': 92,
  '25': 92,
  '30': 89,
  '11': 83,
  '05': 77,
  '15': 75,
};

/** 이미지 ID별 사내 CCTV명 (한국어) */
export const IMAGE_CCTV_NAME: Partial<Record<ImageId, string>> = {
  '05': 'M16-LAB-CAM-12',
  '11': 'M16-LAB-CAM-12',
  '15': 'M16-LAB-CAM-12',
  '21': 'M16-EXIT-A03',
  '25': 'M16-EXIT-A03',
  '30': 'M16-3F-CORR-07',
  '40': 'GATE-WEST-07',
  '47': 'GATE-MAIN-02',
  '51': 'GATE-MAIN-02',
  '59': 'LOBBY-MAIN-01',
};

/** 영문 시연용 CCTV명 (한국어와 동일하게 영문 코드 그대로) */
export const IMAGE_CCTV_NAME_EN: Partial<Record<ImageId, string>> = {
  '05': 'M16-LAB-CAM-12',
  '11': 'M16-LAB-CAM-12',
  '15': 'M16-LAB-CAM-12',
  '21': 'M16-EXIT-A03',
  '25': 'M16-EXIT-A03',
  '30': 'M16-3F-CORR-07',
  '40': 'GATE-WEST-07',
  '47': 'GATE-MAIN-02',
  '51': 'GATE-MAIN-02',
  '59': 'LOBBY-MAIN-01',
};

/** 이미지 ID별 위치 — 사내 (한국어) */
export const IMAGE_LOCATION: Partial<Record<ImageId, string>> = {
  '05': 'M16 동 3F 설계실',
  '11': 'M16 동 3F 설계실',
  '15': 'M16 동 3F 설계실',
  '21': 'M16 동 3F 설계실 출구',
  '25': 'M16 동 3F 설계실 출구',
  '30': 'M16 동 3F 복도',
  '40': '서측 출입 게이트',
  '47': '정문 출입 게이트',
  '51': '정문 출입 게이트',
  '59': '본관 1F 메인 로비',
};

/** 이미지 ID별 위치 — 영문 시연용 */
export const IMAGE_LOCATION_EN: Partial<Record<ImageId, string>> = {
  '05': 'M16 / 3F Design Lab',
  '11': 'M16 / 3F Design Lab',
  '15': 'M16 / 3F Design Lab',
  '21': 'M16 / 3F Lab Exit',
  '25': 'M16 / 3F Lab Exit',
  '30': 'M16 / 3F Corridor',
  '40': 'West Gate',
  '47': 'Main Gate',
  '51': 'Main Gate',
  '59': 'HQ / 1F Lobby',
};

/**
 * "만 보여줘" 전용: 대상 속성을 가진 이미지만 남기기 위해 제외할 속성 목록 계산.
 */
export const computeExcludeForShowOnly = (
  targetAttributes: string[]
): { excludeAttrs: string[]; hiddenCount: number; visibleCount: number } => {
  let matchingIds = new Set<string>();
  let nonMatchingIds = new Set<string>();

  for (const [id, meta] of Object.entries(IMAGE_ATTRIBUTES)) {
    if (!meta) continue;
    if (targetAttributes.every((attr) => meta.attributes.includes(attr))) {
      matchingIds.add(id);
    } else {
      nonMatchingIds.add(id);
    }
  }

  if (matchingIds.size === 0 && targetAttributes.length > 1) {
    matchingIds = new Set<string>();
    nonMatchingIds = new Set<string>();
    for (const [id, meta] of Object.entries(IMAGE_ATTRIBUTES)) {
      if (!meta) continue;
      if (meta.attributes.some((attr) => targetAttributes.includes(attr))) {
        matchingIds.add(id);
      } else {
        nonMatchingIds.add(id);
      }
    }
  }

  const matchingAttrs = new Set<string>();
  for (const id of matchingIds) {
    IMAGE_ATTRIBUTES[id as ImageId]?.attributes.forEach((a) => matchingAttrs.add(a));
  }

  const excludeAttrs: string[] = [];
  for (const id of nonMatchingIds) {
    const meta = IMAGE_ATTRIBUTES[id as ImageId];
    if (!meta) continue;
    for (const a of meta.attributes) {
      if (!matchingAttrs.has(a) && !excludeAttrs.includes(a)) {
        excludeAttrs.push(a);
      }
    }
  }

  const pinnedImageId = getImageIdFromCaptureItem({ id: '10' });
  const pinnedExcluded = nonMatchingIds.has(pinnedImageId);
  const visibleCount = matchingIds.size + (pinnedExcluded ? 1 : 0);

  return { excludeAttrs, hiddenCount: nonMatchingIds.size, visibleCount };
};

export const getAttributesForImageId = (imageId: ImageId): string[] => {
  const meta = IMAGE_ATTRIBUTES[imageId];
  return meta ? [...meta.attributes] : [];
};

export const getPathForImageId = (imageId: ImageId): string => {
  const meta = IMAGE_ATTRIBUTES[imageId];
  return meta?.path ?? '';
};

export const getAttributesForImagePath = (path: string): string[] => {
  const m = path.match(/qs_img_0?(\d+)_[ny]\.\w+$/i);
  const num = m ? parseInt(m[1], 10) : 0;
  const id = ((num >= 1 && num <= 40) || num === 48 || num === 57
    ? String(num).padStart(2, '0')
    : '') as ImageId;
  if (!id || !IMAGE_IDS.includes(id)) return [];
  return getAttributesForImageId(id);
};

export const getImageIdFromCaptureItem = (item: { id: string }): ImageId => {
  const mapping: Record<string, ImageId> = {
    '1': '05',
    '2': '11',
    '3': '15',
    '4': '21',
    '5': '25',
    '6': '30',
    '7': '40',
    '8': '47',
    '9': '51',
    '10': '59',
  };
  return mapping[item.id] ?? '05';
};

export const getPathForCaptureItem = (item: { id: string }): string => {
  return getPathForImageId(getImageIdFromCaptureItem(item));
};

export const getConfidenceForCaptureItem = (item: { id: string }): number => {
  const imageId = getImageIdFromCaptureItem(item);
  return IMAGE_CONFIDENCE[imageId] ?? 50;
};

const isEnglish = (): boolean => {
  const lang = (i18n.resolvedLanguage || i18n.language || 'ko').slice(0, 2);
  return lang === 'en';
};

export const getCctvNameForCaptureItem = (item: { id: string }): string => {
  const imageId = getImageIdFromCaptureItem(item);
  if (isEnglish()) {
    return IMAGE_CCTV_NAME_EN[imageId] ?? 'M16-LAB-CAM-12';
  }
  return IMAGE_CCTV_NAME[imageId] ?? 'M16-LAB-CAM-12';
};

export const getLocationForCaptureItem = (item: { id: string }): string => {
  const imageId = getImageIdFromCaptureItem(item);
  if (isEnglish()) {
    return IMAGE_LOCATION_EN[imageId] ?? 'M16 / 3F Design Lab';
  }
  return IMAGE_LOCATION[imageId] ?? 'M16 동 3F 설계실';
};

export const imageHasAnyExcludedAttribute = (
  imageId: ImageId,
  excludedAttributes: string[]
): boolean => {
  if (!excludedAttributes.length) return false;
  const attrs = getAttributesForImageId(imageId);
  return excludedAttributes.some((ex) => attrs.includes(ex));
};

export const shouldHideCaptureItem = (
  item: { id: string },
  excludedAttributes: string[]
): boolean => {
  const imageId = getImageIdFromCaptureItem(item);
  return imageHasAnyExcludedAttribute(imageId, excludedAttributes);
};

export const getVideoPathForImageId = (imageId: ImageId): string | undefined => {
  const videoMap: Partial<Record<ImageId, string>> = {
    '05': '/fastsearch_img/qs_img_05_n.mp4',
    '11': '/fastsearch_img/qs_img_11_n.mp4',
    '15': '/fastsearch_img/qs_img_15_n.mp4',
    '21': '/fastsearch_img/qs_img_21_y.mp4',
    '25': '/fastsearch_img/qs_img_25_y.mp4',
    '30': '/fastsearch_img/qs_img_30_y.mp4',
    '40': '/fastsearch_img/qs_img_40_y.mp4',
    '47': '/fastsearch_img/qs_img_47_y.mp4',
    '51': '/fastsearch_img/qs_img_51_y.mp4',
    '59': '/fastsearch_img/qs_img_59_y.mp4',
  };
  return videoMap[imageId];
};
