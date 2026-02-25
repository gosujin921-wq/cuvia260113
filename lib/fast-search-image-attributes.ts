/**
 * 고속검색 리스트 썸네일에 쓰이는 public 이미지(qs_img)별 속성 정의.
 * 에이전트 "무슨 속성 삭제" + 결과 재검색 시, 해당 속성을 가진 이미지의 카드가 리스트에서 숨김 처리된다.
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
  /** 필터용 속성. "청바지 삭제", "우산 제거" 등으로 제외 시 사용 */
  attributes: string[];
  /** 상의 */
  top?: string;
  /** 하의 */
  bottom?: string;
  /** 신발 */
  shoes?: string;
  /** 소지품 */
  belongings?: string;
  /** 외형상 성별 추정 */
  genderEstimate?: string;
  /** 특징 */
  characteristics?: string;
}

/** 이미지 ID별 속성 맵 (10개로 축소) */
export const IMAGE_ATTRIBUTES: Partial<Record<ImageId, ImageAttributeMeta>> = {
  '05': {
    path: '/fastsearch_img/qs_img_05_n.png',
    top: '밝은색 패딩/재킷',
    bottom: '검은색 바지',
    shoes: '확인 어려움',
    belongings: '없음',
    genderEstimate: '여성으로 보임 (확실하지 않음)',
    characteristics: '표지판 옆에 서 있는 행인, 전화 중인 듯한 자세',
    attributes: ['밝은색 패딩', '밝은색 재킷', '검은색 바지', '여성', '표지판', '전화 중'],
  },
  '11': {
    path: '/fastsearch_img/qs_img_11_n.png',
    top: '회색 패딩',
    bottom: '검정 바지',
    shoes: '흰색 운동화',
    belongings: '우산(투명)',
    genderEstimate: '알 수 없음',
    characteristics: '뒷모습, 보행 중',
    attributes: ['회색 패딩', '검정 바지', '흰색 운동화', '우산', '뒷모습', '보행 중'],
  },
  '15': {
    path: '/fastsearch_img/qs_img_15_n.png',
    top: '밝은색 패딩',
    bottom: '검정 바지',
    shoes: '흰색 운동화',
    belongings: '쇼핑백(종이백)',
    genderEstimate: '알 수 없음',
    characteristics: '캡모자 착용',
    attributes: ['밝은색 패딩', '검정 바지', '흰색 운동화', '쇼핑백', '캡모자'],
  },
  '21': {
    path: '/fastsearch_img/qs_img_21_y.png',
    top: '회색 후드티',
    bottom: '어두운색 바지',
    shoes: '흰색 운동화',
    belongings: '휴대폰',
    genderEstimate: '남성으로 보임 (확실하지 않음)',
    characteristics: '뒷모습, 차량 인접 보행',
    attributes: ['회색 후드티', '어두운색 바지', '흰색 운동화', '휴대폰', '남성', '뒷모습', '차량 인접 보행'],
  },
  '25': {
    path: '/fastsearch_img/qs_img_25_y.png',
    top: '회색 후드티',
    bottom: '청바지',
    shoes: '흰색 운동화',
    belongings: '휴대폰',
    genderEstimate: '남성으로 보임 (확실하지 않음)',
    characteristics: '정면, 보행 중',
    attributes: ['회색 후드티', '청바지', '흰색 운동화', '휴대폰', '남성', '정면', '보행 중'],
  },
  '30': {
    path: '/fastsearch_img/qs_img_30_y.png',
    top: '회색 후드티',
    bottom: '어두운색 바지',
    shoes: '흰색 운동화',
    belongings: '없음',
    genderEstimate: '알 수 없음',
    characteristics: '뒷모습, 보행',
    attributes: ['회색 후드티', '어두운색 바지', '흰색 운동화', '뒷모습', '보행'],
  },
  '40': {
    path: '/fastsearch_img/qs_img_40_y.png',
    top: '회색 후드티',
    bottom: '어두운색 바지',
    shoes: '흰색 운동화',
    belongings: '없음',
    genderEstimate: '남성으로 보임 (확실하지 않음)',
    characteristics: '뒷모습, 차도 보행',
    attributes: ['회색 후드티', '어두운색 바지', '흰색 운동화', '남성', '뒷모습', '차도 보행'],
  },
  '47': {
    path: '/fastsearch_img/qs_img_47_y.png',
    top: '회색 후드티',
    bottom: '어두운색 바지',
    shoes: '흰색 운동화',
    belongings: '스마트폰',
    genderEstimate: '남성으로 보임 (확실하지 않음)',
    characteristics: '양손으로 스마트폰 조작, 보행 중',
    attributes: ['회색 후드티', '어두운색 바지', '흰색 운동화', '스마트폰', '남성', '양손 조작', '보행 중'],
  },
  '51': {
    path: '/fastsearch_img/qs_img_51_y.png',
    top: '회색 후드티',
    bottom: '청바지',
    shoes: '흰색 운동화',
    belongings: '스마트폰',
    genderEstimate: '남성으로 보임 (확실하지 않음)',
    characteristics: '고개 숙이고 스마트폰 조작, 정면',
    attributes: ['회색 후드티', '청바지', '흰색 운동화', '스마트폰', '남성', '고개 숙임', '정면'],
  },
  '59': {
    path: '/fastsearch_img/qs_img_59_y.png',
    top: '회색 후드티',
    bottom: '어두운색 바지',
    shoes: '확인 어려움',
    belongings: '휴대폰',
    genderEstimate: '남성으로 보임 (확실하지 않음)',
    characteristics: '편의점 입구 근처 체류, 전화하는 듯한 모습',
    attributes: ['회색 후드티', '어두운색 바지', '휴대폰', '남성', '편의점 입구', '체류', '전화'],
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
  '21': 98,
  '47': 97,
  '40': 96,
  '59': 95,
  '51': 93,
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
