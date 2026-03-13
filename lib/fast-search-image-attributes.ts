/**
 * 고속 검색용 초정밀 이미지 속성 데이터 세트 (v2.0)
 * 영상 시퀀스 분석을 통해 환경, 행동, 세부 복장을 정밀하게 분류함
 *
 * - 이미지: fastsearch_img/qs_img_05_n.png ~ qs_img_59_y.png (10개)
 * - 리스트 아이템은 item.id 기준 1~10 → 이미지 05, 11, 15, 21, 25, 30, 40, 47, 51, 59 (1:1 매핑)
 */

export type ImageId =
  | '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10'
  | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' | '20'
  | '21' | '22' | '23' | '24' | '25' | '26' | '27' | '28' | '29' | '30'
  | '31' | '32' | '33' | '34' | '35' | '36' | '37' | '38' | '39' | '40'
  | '47' | '48' | '51' | '57' | '59';

export interface ImageAttributeMeta {
  /** public 경로 */
  path: string;
  /** 필터용 속성 */
  attributes: string[];
}

/**
 * 동의어 및 유사어 확장 맵 (자연어 검색 대응력 강화)
 *
 * 구조:
 *   정규값(canonical) : [동의어1, 동의어2, ...]
 */
export const ATTRIBUTE_SYNONYM_MAP: Record<string, string[]> = {
  // [인물 및 체격]
  '남성': ['남자', '남성분', '청년'],
  '여성': ['여자', '여성분', '학생'],

  // [상의 - 재질 및 핏]
  '그레이후드티': ['회색후드', '회색티', '그레이후디', '잿빛상의', '후드쓴', '후드', '후드티', '후디'],
  '화이트패딩': ['흰색패딩', '하얀색파카', '아이보리점퍼', '밝은패딩', '경량패딩', '패딩', '점퍼', '파카'],
  '그레이패딩': ['회색점퍼', '회색파카', '짙은색아우터', '회색패딩'],

  // [하의 및 신발 - 디테일]
  '데님팬츠': ['청바지', '청색바지', '블루진', '남색바지', '진바지'],
  '블랙팬츠': ['검정바지', '검정색하의', '어두운바지', '블랙진', '슬랙스', '바지', '하의'],
  '화이트스니커즈': ['흰색운동화', '하얀신발', '밝은신발', '흰색신발', '운동화', '신발', '스니커즈'],

  // [소지품 및 장비 - 관제 핵심]
  '폰화면주시': ['스마트폰사용', '핸드폰조작', '폰보는중', '화면빛', '휴대폰', '핸드폰', '스마트폰'],
  '투명우산': ['비닐우산', '우산든', '우산'],
  '화이트볼캡': ['흰색모자', '모자쓴', '야구모자', '모자', '볼캡', '캡모자'],
  '화이트쇼핑백': ['흰봉투', '쇼핑백', '가방든', '짐든', '가방', '봉투', '쇼핑백든'],

  // [환경 및 위치]
  '야간': ['어두운곳', '밤에', '저녁', '어두울때', '밤시간'],
  '주간': ['밝을때', '낮에', '낮시간', '대낮'],
  '횡단보도': ['도로건너는', '길위', '하얀선', '건너는중', '횡단', '건널목'],
  '편의점앞': ['가게앞', '매장입구', '간판근처', '편의점', '가게'],

  // [행동 및 방향]
  '보행중': ['걷는중', '이동중', '움직이는', '걷는', '걸어가는', '걸어'],
  '정지상태': ['가만히있는', '멈춰있는', '서있는', '멈춘', '서있는사람'],
  '정면': ['앞모습', '전면', '얼굴'],
  '후면': ['뒷모습', '등쪽', '뒤'],
  '측면': ['옆모습', '옆쪽', '좌우'],
};

/** 이미지 ID별 정규 속성 맵 (초정밀 v2.0) */
export const IMAGE_ATTRIBUTES: Partial<Record<ImageId, ImageAttributeMeta>> = {
  // 05_n: 야간, 측면, 밝은 아우터가 대조되는 시점
  '05': {
    path: '/fastsearch_img/qs_img_05_n.png',
    attributes: ['여성', '화이트패딩', '블랙팬츠', '측면', '야간', '인도', '정지상태'],
  },
  // 11_n: 비 오는 상황, 투명 소지품이 핵심
  '11': {
    path: '/fastsearch_img/qs_img_11_n.png',
    attributes: ['성별미상', '그레이패딩', '블랙팬츠', '후면', '주간', '투명우산', '보행중'],
  },
  // 15_n: 복합 소지품 및 액세서리 식별
  '15': {
    path: '/fastsearch_img/qs_img_15_n.png',
    attributes: ['남성', '화이트패딩', '블랙팬츠', '후면', '화이트볼캡', '화이트쇼핑백', '화이트스니커즈', '주간'],
  },
  // 21_y ~ 59_y: 회색 후드 남성 추적 시퀀스 (행동 및 환경 중심)
  '21': {
    path: '/fastsearch_img/qs_img_21_y.png',
    attributes: ['남성', '그레이후드티', '데님팬츠', '후면', '주간', '도로위'],
  },
  '25': {
    path: '/fastsearch_img/qs_img_25_y.png',
    attributes: ['남성', '그레이후드티', '데님팬츠', '정면', '폰화면주시', '화이트스니커즈', '주간'],
  },
  '30': {
    path: '/fastsearch_img/qs_img_30_y.png',
    attributes: ['남성', '그레이후드티', '데님팬츠', '후면', '주간', '아스팔트'],
  },
  '40': {
    path: '/fastsearch_img/qs_img_40_y.png',
    attributes: ['남성', '그레이후드티', '데님팬츠', '후면', '보행중', '횡단보도'],
  },
  '47': {
    path: '/fastsearch_img/qs_img_47_y.png',
    attributes: ['남성', '그레이후드티', '데님팬츠', '측면', '폰화면주시', '보행중', '횡단보도'],
  },
  '51': {
    path: '/fastsearch_img/qs_img_51_y.png',
    attributes: ['남성', '그레이후드티', '데님팬츠', '정면', '폰화면주시', '화이트스니커즈', '횡단보도'],
  },
  '59': {
    path: '/fastsearch_img/qs_img_59_y.png',
    attributes: ['남성', '그레이후드티', '데님팬츠', '정면', '폰화면주시', '편의점앞', '야간'],
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
 * 이미지 ID별 유사도(%) - 59번(회색 후드티, 어두운색 바지, 휴대폰, 남성) 기준
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

/** 이미지 ID별 CCTV명 */
export const IMAGE_CCTV_NAME: Partial<Record<ImageId, string>> = {
  '05': '별빛A-230',
  '11': '별빛A-230',
  '15': '별빛A-230',
  '21': '별빛A-444',
  '25': '별빛A-444',
  '30': '별빛A-481',
  '40': '별빛A-498',
  '47': '별빛A-583',
  '51': '별빛A-583',
  '59': '별빛A-604',
};

/** 이미지 ID별 위치 */
export const IMAGE_LOCATION: Partial<Record<ImageId, string>> = {
  '05': '은하로363번길 48',
  '11': '은하로363번길 48',
  '15': '은하로363번길 48',
  '21': '은하로363번길 48',
  '25': '은하로363번길 48',
  '30': '달빛로301번길 28',
  '40': '달빛로301번길 54',
  '47': '별빛구 하늘로 245번길 41',
  '51': '별빛구 하늘로 245번길 41',
  '59': '은하로391번길 29 (검지2, 하늘파출소)',
};

/**
 * "만 보여줘" 전용: 대상 속성을 가진 이미지만 남기기 위해 제외할 속성 목록 계산.
 *
 * 복합 조건(2개 이상) 시 AND-first 전략:
 *   1. 모든 대상 속성을 동시에 가진 이미지만 매칭 (AND)
 *   2. AND 결과가 0이면 하나라도 가진 이미지로 폴백 (OR)
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

/** 이미지 ID로 속성 목록 반환 */
export const getAttributesForImageId = (imageId: ImageId): string[] => {
  const meta = IMAGE_ATTRIBUTES[imageId];
  return meta ? [...meta.attributes] : [];
};

/** 이미지 ID로 경로 반환 */
export const getPathForImageId = (imageId: ImageId): string => {
  const meta = IMAGE_ATTRIBUTES[imageId];
  return meta?.path ?? '';
};

/** 경로에서 이미지 ID 추출 후 속성 반환 */
export const getAttributesForImagePath = (path: string): string[] => {
  const m = path.match(/qs_img_0?(\d+)_[ny]\.\w+$/i);
  const num = m ? parseInt(m[1], 10) : 0;
  const id = ((num >= 1 && num <= 40) || num === 48 || num === 57
    ? String(num).padStart(2, '0')
    : '') as ImageId;
  if (!id || !IMAGE_IDS.includes(id)) return [];
  return getAttributesForImageId(id);
};

/**
 * 고속검색 캡처 아이템(item.id)이 사용하는 이미지 ID.
 * 10개 이미지 1:1 매핑
 */
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

/** 캡처 아이템이 쓰는 썸네일 경로 */
export const getPathForCaptureItem = (item: { id: string }): string => {
  return getPathForImageId(getImageIdFromCaptureItem(item));
};

/** 캡처 아이템의 유사도(%) */
export const getConfidenceForCaptureItem = (item: { id: string }): number => {
  const imageId = getImageIdFromCaptureItem(item);
  return IMAGE_CONFIDENCE[imageId] ?? 50;
};

/** 캡처 아이템의 CCTV명 */
export const getCctvNameForCaptureItem = (item: { id: string }): string => {
  const imageId = getImageIdFromCaptureItem(item);
  return IMAGE_CCTV_NAME[imageId] ?? '별빛A-230';
};

/** 캡처 아이템의 위치 */
export const getLocationForCaptureItem = (item: { id: string }): string => {
  const imageId = getImageIdFromCaptureItem(item);
  return IMAGE_LOCATION[imageId] ?? '은하로363번길 48';
};

/** 해당 이미지가 제외 대상 속성 중 하나라도 가지는지 */
export const imageHasAnyExcludedAttribute = (
  imageId: ImageId,
  excludedAttributes: string[]
): boolean => {
  if (!excludedAttributes.length) return false;
  const attrs = getAttributesForImageId(imageId);
  return excludedAttributes.some((ex) => attrs.includes(ex));
};

/** 캡처 아이템이 제외 대상이면 true (리스트에서 숨김) */
export const shouldHideCaptureItem = (
  item: { id: string },
  excludedAttributes: string[]
): boolean => {
  const imageId = getImageIdFromCaptureItem(item);
  return imageHasAnyExcludedAttribute(imageId, excludedAttributes);
};

/** 이미지 ID로 비디오 경로 반환 (비디오가 있는 경우) */
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
