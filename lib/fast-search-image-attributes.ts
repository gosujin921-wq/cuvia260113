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

/**
 * 동의어(변형) → 정규값 매핑.
 *
 * 구조:
 *   정규값(canonical) : [동의어1, 동의어2, ...]
 *
 * 이미지별 복합 태그(회색후드티, 휴대폰소지 등)도 상위 정규값의 동의어로 편입.
 * → "후드티 삭제" 한 마디로 회색후드티를 가진 모든 이미지가 일괄 제외됨.
 */
export const ATTRIBUTE_SYNONYM_MAP: Record<string, string[]> = {
  // ── 상의 종류 ──
  '후드티': ['후드', '후드 티', '후드티셔츠', '후드 티셔츠', '그레이 후드', '회색 후드', '회색후드티'],
  '패딩': ['패딩점퍼', '숏패딩', '롱패딩', '누빔점퍼', '패딩 자켓', '회색패딩', '흰패딩'],
  '코트': ['롱코트', '코트형 아우터', '긴 코트', '밝은회색아우터'],

  // ── 하의 종류 ──
  '청바지': ['청 바지', '데님', '데님팬츠', '데님 팬츠', '진', '진바지'],
  '검정바지': ['검은바지', '검은 바지', '블랙팬츠', '블랙 바지'],

  // ── 색상 ──
  '회색': ['그레이', '회 색', '애쉬', '쥐색'],
  '흰색': ['화이트', '하얀색', '하얀', '흰 색'],
  '검정': ['블랙', '검은색', '검은', '검 정'],
  '중청': ['중청색', '중간 청색'],
  '진청': ['진청색', '짙은 청색', '다크 데님'],

  // ── 신발 ──
  '운동화': ['스니커즈', '런닝화', '캐주얼화'],
  '흰운동화': ['흰 운동화', '화이트운동화', '화이트스니커즈', '하얀 운동화', '흰색 운동화'],
  '검흰운동화': ['검정흰색 운동화', '블랙화이트 운동화', '흑백 스니커즈'],
  '검정신발': ['검은신발', '검은 신발'],

  // ── 소지품 ──
  '휴대폰': ['핸드폰', '폰', '스마트폰', '핸드폰 들고 있음', '휴대폰소지'],
  '쇼핑백': ['봉투', '쇼핑 봉투', '비닐봉투', '종이봉투', '흰쇼핑백'],
  '가방': ['백', '숄더백', '토트백', '크로스백', '가방소지'],
  '우산': ['우산씀', '우산 사용'],
  '은색우산': ['실버우산', '메탈릭 우산', '회색 우산'],

  // ── 방향 / 구도 ──
  '정면': ['앞모습', '전면', '정면샷'],
  '후면': ['뒷모습', '뒤 모습', '후방'],
  '측면': ['옆모습', '사이드', '측면얼굴'],
  '후면직진': ['뒤에서 직진', '직진중', '직선 이동'],
  '후면사선': ['뒤 사선', '사선 후면', '비스듬한 뒷모습'],

  // ── 행동 ──
  '보행': ['걷는중', '걷는 중', '이동중', '걸어감'],
  '정지': ['서있음', '멈춤', '대기'],
  '뒤돌아봄': ['뒤 돌아봄', '고개돌림', '뒤봄'],

  // ── 기타 (이미지별 고유) ──
  '긴머리': ['긴 머리', '중간머리', '중간 머리'],
  '흰모자': ['흰 모자', '화이트캡', '하얀모자', '볼캡', '캡모자'],
  '양손모음': ['손 모음', '양손 앞으로', '손 가슴앞'],
  '양손앞': ['손 앞으로', '두 손 앞'],
  '매장입구': ['상점입구', '가게 앞', '출입문 앞', '매장 앞'],
  '실내외경계': ['실내외 경계', '실내 외부', '경계지역', '경계 지역'],
  '출입구근처': ['출입구 근처', '출입구', '입구 근처', '입구근처'],
};

/** 이미지 ID별 속성 맵 (10개로 축소) */
export const IMAGE_ATTRIBUTES: Partial<Record<ImageId, ImageAttributeMeta>> = {
  '05': {
    path: '/fastsearch_img/qs_img_05_n.png',
    top: '코트·롱 아우터 추정 / 밝은 회색·민트빛 회색·그레이그린 계열 / 긴팔 / 레귤러~약간 여유',
    bottom: '검정 긴바지 / 슬림~레귤러 / 무지',
    shoes: '검정 스니커즈·운동화 / 흰색 밑창·흰색 앞코 추정',
    belongings: '어두운색 숄더백·토트백·크로스백 추정 (오른쪽 몸 옆)',
    genderEstimate: '확실하지 않음',
    characteristics: '측면 사선, 건물 입구·키오스크 인근 대기, 한 손 몸 앞쪽, 어두운색 중단발~긴머리',
    attributes: ['긴머리', '밝은회색아우터', '검정바지', '검정신발', '가방소지', '실내외경계', '출입구근처'],
  },
  '11': {
    path: '/fastsearch_img/qs_img_11_n.png',
    top: '회색 패딩·누빔 점퍼 추정 / 가로 줄 퀼팅 / 허리 길이',
    bottom: '검정 또는 짙은 남색 긴바지 / 레귤러~슬림 / 무지',
    shoes: '어두운 본체 + 흰색 밑창·뒷축 포인트 운동화',
    belongings: '큰 은색·회색·메탈릭 펼친 우산',
    genderEstimate: '확실하지 않음',
    characteristics: '후면, 비 오는 상황 보행, 도로 가장자리, 우산으로 머리·얼굴 대부분 가림',
    attributes: ['우산', '은색우산', '회색패딩', '검정바지', '후면', '보행'],
  },
  '15': {
    path: '/fastsearch_img/qs_img_15_n.png',
    top: '흰색 숏패딩·패딩점퍼 / 도톰함·볼륨감 / 허리 길이 / 무지',
    bottom: '검정 긴바지 / 슬림~레귤러 / 무지',
    shoes: '흰색 운동화 / 흰색 밑창',
    belongings: '흰색 종이·비닐 쇼핑백 (오른손, 큼)',
    genderEstimate: '확실하지 않음',
    characteristics: '흰색 볼캡·캡모자, 어두운색 머리 일부 노출, 후면 사선, 횡단보도 인근 보행',
    attributes: ['흰모자', '흰패딩', '검정바지', '흰운동화', '흰쇼핑백', '보행'],
  },
  '21': {
    path: '/fastsearch_img/qs_img_21_y.png',
    top: '회색 후드티 / 오버핏·세미오버핏 / 엉덩이 위~걸치는 길이 / 무지 / 후드 내려짐',
    bottom: '진청~중청 청바지 / 스트레이트·레귤러핏 / 발목까지',
    shoes: '흰색 운동화 / 뒤꿈치·밑창 어두운 포인트 가능',
    belongings: '오른손 휴대폰 가능성 (확실하지 않음)',
    genderEstimate: '남성 추정',
    characteristics: '후면, 짧은 검정 머리, 좌측 차량, 도로 위 보행, 오른팔 약간 굽힘',
    attributes: ['회색후드티', '청바지', '흰운동화', '후면', '보행'],
  },
  '25': {
    path: '/fastsearch_img/qs_img_25_y.png',
    top: '회색 후드티 / 오버핏 / 긴팔 / 무지 / 후드 내려짐',
    bottom: '중청~진청 청바지 / 레귤러·스트레이트',
    shoes: '흰색 운동화',
    belongings: '양손 가슴 앞 모음 (휴대폰·작은 물건 가능, 확실하지 않음)',
    genderEstimate: '남성 추정',
    characteristics: '전면 사선, 짧은 검정 머리(앞머리), 빠른 보행, 상체 약간 앞 기울임',
    attributes: ['회색후드티', '청바지', '흰운동화', '전면', '양손모음', '보행'],
  },
  '30': {
    path: '/fastsearch_img/qs_img_30_y.png',
    top: '회색 후드티 / 세미오버핏~오버핏 / 무지 / 후드 내려짐',
    bottom: '중청~진청 청바지 / 스트레이트·레귤러',
    shoes: '흰색 운동화',
    belongings: '없음',
    genderEstimate: '남성 추정',
    characteristics: '후면, 짧은 검정 머리, 도로 위 직진 보행, 팔 자연스럽게 내림',
    attributes: ['회색후드티', '청바지', '흰운동화', '후면직진', '보행'],
  },
  '40': {
    path: '/fastsearch_img/qs_img_40_y.png',
    top: '회색 후드티 / 오버핏에 가까움 / 후드 내려짐',
    bottom: '중청~진청 청바지 / 스트레이트',
    shoes: '흰색 운동화',
    belongings: '없음',
    genderEstimate: '남성 추정',
    characteristics: '후면 사선, 짧은 검정 머리, 도로 방향 화살표 근처, 오른팔 약간 들림',
    attributes: ['회색후드티', '청바지', '흰운동화', '후면사선', '보행'],
  },
  '47': {
    path: '/fastsearch_img/qs_img_47_y.png',
    top: '회색 후드티 / 오버핏 / 후드 내려짐',
    bottom: '중청~진청 청바지 / 레귤러·스트레이트',
    shoes: '흰색 운동화',
    belongings: '오른손 휴대폰 (직사각형 검은색 기기)',
    genderEstimate: '남성 추정',
    characteristics: '후면에서 상반신 회전, 짧은 검정 머리, 얼굴 일부 측면 노출, 횡단보도·차선 근처',
    attributes: ['회색후드티', '청바지', '흰운동화', '휴대폰소지', '뒤돌아봄', '측면얼굴'],
  },
  '51': {
    path: '/fastsearch_img/qs_img_51_y.png',
    top: '회색 후드티 / 오버핏 / 무지 / 후드 내려짐',
    bottom: '중청~진청 청바지 / 레귤러·스트레이트',
    shoes: '흰색 운동화',
    belongings: '양손 앞 모음 (작은 물건 가능, 확실하지 않음)',
    genderEstimate: '남성 추정',
    characteristics: '정면, 짧은 검정 앞머리, 얼굴 정면 노출, 노란색 사선·안전표시 위 보행',
    attributes: ['회색후드티', '청바지', '흰운동화', '정면', '보행', '양손앞'],
  },
  '59': {
    path: '/fastsearch_img/qs_img_59_y.png',
    top: '회색 후드티 / 오버핏 / 무지 / 후드 내려짐',
    bottom: '중청~진청 청바지 / 레귤러·스트레이트',
    shoes: '검정+흰색 조합 운동화·스니커즈 / 밑창·측면 흰색 비중 큼',
    belongings: '한 손 휴대폰 추정',
    genderEstimate: '남성 추정',
    characteristics: '측면 사선, 짧은 검정 머리, 상점·매장 입구 근처, 광고 패널 옆, 출입문 앞 대기·진입 직전',
    attributes: ['회색후드티', '청바지', '검흰운동화', '휴대폰소지', '매장입구', '정지'],
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
 * 대상에 매칭되지 않는 이미지의 속성 중, 매칭 이미지와 겹치지 않는 것만 반환.
 */
export const computeExcludeForShowOnly = (
  targetAttributes: string[]
): { excludeAttrs: string[]; hiddenCount: number } => {
  const matchingIds = new Set<string>();
  const nonMatchingIds = new Set<string>();

  for (const [id, meta] of Object.entries(IMAGE_ATTRIBUTES)) {
    if (!meta) continue;
    if (meta.attributes.some((attr) => targetAttributes.includes(attr))) {
      matchingIds.add(id);
    } else {
      nonMatchingIds.add(id);
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

  return { excludeAttrs, hiddenCount: nonMatchingIds.size };
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
