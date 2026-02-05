/**
 * 고속검색 리스트 썸네일에 쓰이는 public 이미지(qs_img)별 속성 정의.
 * 에이전트 "무슨 속성 삭제" + 결과 재검색 시, 해당 속성을 가진 이미지의 카드가 리스트에서 숨김 처리된다.
 *
 * - 이미지: fastsearch_img/qs_img_01_n.png ~ qs_img_57_y.png
 * - 리스트 아이템은 item.id 기준 1~42 → 이미지 01~40, 48, 57 (1:1 매핑)
 */

export type ImageId =
  | '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10'
  | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' | '20'
  | '21' | '22' | '23' | '24' | '25' | '26' | '27' | '28' | '29' | '30'
  | '31' | '32' | '33' | '34' | '35' | '36' | '37' | '38' | '39' | '40'
  | '48' | '57' | '59';

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

/** 이미지 ID별 속성 맵 (1·2·3차분: 01~40) */
export const IMAGE_ATTRIBUTES: Record<ImageId, ImageAttributeMeta> = {
  '01': {
    path: '/fastsearch_img/qs_img_01_n.png',
    top: '밝은색 패딩 점퍼',
    bottom: '어두운색 바지',
    shoes: '확인 어려움',
    belongings: '없음',
    genderEstimate: '알 수 없음',
    attributes: ['밝은색 패딩 점퍼', '어두운색 바지'],
  },
  '02': {
    path: '/fastsearch_img/qs_img_02_n.png',
    top: '어두운색 아우터(코트/점퍼 계열)',
    bottom: '어두운색 바지',
    shoes: '어두운색 운동화',
    belongings: '없음',
    genderEstimate: '알 수 없음',
    characteristics: '뒷모습, 원거리',
    attributes: ['어두운색 아우터', '어두운색 바지', '어두운색 운동화', '뒷모습', '원거리', '우산'],
  },
  '03': {
    path: '/fastsearch_img/qs_img_03_n.png',
    top: '회색 패딩',
    bottom: '검정 바지',
    shoes: '흰색 운동화',
    belongings: '우산(파랑 계열)',
    genderEstimate: '알 수 없음',
    attributes: ['회색 패딩', '검정 바지', '흰색 운동화', '우산'],
  },
  '04': {
    path: '/fastsearch_img/qs_img_04_y.png',
    top: '회색 후드티',
    bottom: '청바지',
    shoes: '흰색 스니커즈',
    belongings: '휴대폰',
    genderEstimate: '남성으로 보임 (확실하지 않음)',
    characteristics: '캡모자 착용',
    attributes: ['회색 후드티', '청바지', '흰색 스니커즈', '휴대폰', '캡모자', '남성'],
  },
  '05': {
    path: '/fastsearch_img/qs_img_05_n.png',
    top: '밝은색 상의',
    bottom: '어두운색 바지',
    shoes: '확인 어려움',
    belongings: '없음',
    genderEstimate: '여성으로 보임 (확실하지 않음)',
    attributes: ['밝은색 상의', '어두운색 바지', '여성'],
  },
  '06': {
    path: '/fastsearch_img/qs_img_06_n.png',
    top: '밝은색 상의',
    bottom: '어두운색 바지',
    shoes: '흰색 운동화',
    belongings: '없음',
    genderEstimate: '여성으로 보임 (확실하지 않음)',
    attributes: ['밝은색 상의', '어두운색 바지', '흰색 운동화', '여성'],
  },
  '07': {
    path: '/fastsearch_img/qs_img_07_n.png',
    top: '회색 패딩',
    bottom: '검정 바지',
    shoes: '어두운색 신발',
    belongings: '우산(어두운색)',
    genderEstimate: '알 수 없음',
    attributes: ['회색 패딩', '검정 바지', '어두운색 신발', '우산'],
  },
  '08': {
    path: '/fastsearch_img/qs_img_08_n.png',
    top: '회색 패딩',
    bottom: '검정 바지',
    shoes: '흰색 운동화',
    belongings: '우산(보라/파랑 계열), 백팩',
    genderEstimate: '알 수 없음',
    attributes: ['회색 패딩', '검정 바지', '흰색 운동화', '우산', '백팩'],
  },
  '09': {
    path: '/fastsearch_img/qs_img_09_n.png',
    top: '어두운색 아우터',
    bottom: '어두운색 바지',
    shoes: '확인 어려움',
    belongings: '우산(검정)',
    genderEstimate: '알 수 없음',
    characteristics: '뒷모습, 야간',
    attributes: ['어두운색 아우터', '어두운색 바지', '우산', '뒷모습', '야간'],
  },
  '10': {
    path: '/fastsearch_img/qs_img_10_n.png',
    top: '회색 상의',
    bottom: '어두운색 바지',
    shoes: '흰색 운동화',
    belongings: '비닐백/쇼핑백',
    genderEstimate: '알 수 없음',
    characteristics: '출입문 통과 장면',
    attributes: ['회색 상의', '어두운색 바지', '흰색 운동화', '비닐백', '쇼핑백', '출입문 통과'],
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
  '12': {
    path: '/fastsearch_img/qs_img_12_n.png',
    top: '회색 패딩',
    bottom: '검정 바지',
    shoes: '흰색 운동화',
    belongings: '우산(검정)',
    genderEstimate: '알 수 없음',
    characteristics: '측면/후면 각도',
    attributes: ['회색 패딩', '검정 바지', '흰색 운동화', '우산', '측면', '후면'],
  },
  '13': {
    path: '/fastsearch_img/qs_img_13_n.png',
    top: '어두운색 아우터',
    bottom: '청바지',
    shoes: '밝은색 운동화',
    belongings: '우산(파랑 계열)',
    genderEstimate: '알 수 없음',
    characteristics: '뒷모습, 골목 보행',
    attributes: ['어두운색 아우터', '청바지', '밝은색 운동화', '우산', '뒷모습', '골목 보행'],
  },
  '14': {
    path: '/fastsearch_img/qs_img_14_n.png',
    top: '회색 패딩',
    bottom: '검정 바지',
    shoes: '흰색 운동화',
    belongings: '우산(투명)',
    genderEstimate: '알 수 없음',
    characteristics: '차량 인접, 측면',
    attributes: ['회색 패딩', '검정 바지', '흰색 운동화', '우산', '차량 인접', '측면'],
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
  '16': {
    path: '/fastsearch_img/qs_img_16_y.png',
    top: '회색 후드티',
    bottom: '진청 와이드 팬츠',
    shoes: '흰색 운동화',
    belongings: '휴대폰',
    genderEstimate: '남성으로 보임 (확실하지 않음)',
    characteristics: '정면, 횡단보도',
    attributes: ['회색 후드티', '진청 와이드 팬츠', '흰색 운동화', '휴대폰', '남성', '정면', '횡단보도'],
  },
  '17': {
    path: '/fastsearch_img/qs_img_17_n.png',
    top: '회색 패딩',
    bottom: '검정 바지',
    shoes: '흰색 운동화',
    belongings: '우산(연분홍)',
    genderEstimate: '알 수 없음',
    characteristics: '차량 옆 보행',
    attributes: ['회색 패딩', '검정 바지', '흰색 운동화', '우산', '차량 옆 보행'],
  },
  '18': {
    path: '/fastsearch_img/qs_img_18_y.png',
    top: '회색 후드티',
    bottom: '청바지',
    shoes: '흰색 운동화',
    belongings: '휴대폰',
    genderEstimate: '남성으로 보임 (확실하지 않음)',
    characteristics: '원거리 정면',
    attributes: ['회색 후드티', '청바지', '흰색 운동화', '휴대폰', '남성', '원거리', '정면'],
  },
  '19': {
    path: '/fastsearch_img/qs_img_19_y.png',
    top: '회색 후드티',
    bottom: '청바지',
    shoes: '흰색 운동화',
    belongings: '휴대폰',
    genderEstimate: '남성으로 보임 (확실하지 않음)',
    characteristics: '정면 보행, 단독',
    attributes: ['회색 후드티', '청바지', '흰색 운동화', '휴대폰', '남성', '정면', '단독'],
  },
  '20': {
    path: '/fastsearch_img/qs_img_20_n.png',
    top: '회색 패딩',
    bottom: '청바지',
    shoes: '흰색 운동화',
    belongings: '우산(검정)',
    genderEstimate: '알 수 없음',
    characteristics: '정면, 우산 펼침',
    attributes: ['회색 패딩', '청바지', '흰색 운동화', '우산', '정면'],
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
  '22': {
    path: '/fastsearch_img/qs_img_22_n.png',
    top: '회색 패딩',
    bottom: '청바지',
    shoes: '흰색 운동화',
    belongings: '우산(검정), 백팩',
    genderEstimate: '알 수 없음',
    characteristics: '측면, 정지 상태',
    attributes: ['회색 패딩', '청바지', '흰색 운동화', '우산', '백팩', '측면', '정지 상태'],
  },
  '23': {
    path: '/fastsearch_img/qs_img_23_y.png',
    top: '회색 후드티',
    bottom: '청바지',
    shoes: '흰색 운동화',
    belongings: '휴대폰',
    genderEstimate: '남성으로 보임 (확실하지 않음)',
    characteristics: '측면, 차량 옆 보행',
    attributes: ['회색 후드티', '청바지', '흰색 운동화', '휴대폰', '남성', '측면', '차량 옆 보행'],
  },
  '24': {
    path: '/fastsearch_img/qs_img_24_n.png',
    top: '회색 패딩',
    bottom: '검정 바지',
    shoes: '흰색 운동화',
    belongings: '우산(검정)',
    genderEstimate: '알 수 없음',
    characteristics: '원거리 정면',
    attributes: ['회색 패딩', '검정 바지', '흰색 운동화', '우산', '원거리', '정면'],
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
  '26': {
    path: '/fastsearch_img/qs_img_26_y.png',
    top: '회색 후드티',
    bottom: '청바지',
    shoes: '흰색 운동화',
    belongings: '휴대폰',
    genderEstimate: '남성으로 보임 (확실하지 않음)',
    characteristics: '원거리, 정면',
    attributes: ['회색 후드티', '청바지', '흰색 운동화', '휴대폰', '남성', '원거리', '정면'],
  },
  '27': {
    path: '/fastsearch_img/qs_img_27_n.png',
    top: '어두운색 아우터',
    bottom: '청바지',
    shoes: '흰색 운동화',
    belongings: '우산(검정)',
    genderEstimate: '알 수 없음',
    characteristics: '뒷모습, 보행',
    attributes: ['어두운색 아우터', '청바지', '흰색 운동화', '우산', '뒷모습', '보행'],
  },
  '28': {
    path: '/fastsearch_img/qs_img_28_n.png',
    top: '어두운색 아우터',
    bottom: '어두운색 바지',
    shoes: '어두운색 운동화',
    belongings: '없음',
    genderEstimate: '알 수 없음',
    characteristics: '측면, 팔 벌린 동작',
    attributes: ['어두운색 아우터', '어두운색 바지', '어두운색 운동화', '측면', '팔 벌린 동작'],
  },
  '29': {
    path: '/fastsearch_img/qs_img_29_n.png',
    top: '회색 후드티',
    bottom: '어두운색 바지',
    shoes: '흰색 운동화',
    belongings: '없음',
    genderEstimate: '알 수 없음',
    characteristics: '뒷모습, 보행',
    attributes: ['회색 후드티', '어두운색 바지', '흰색 운동화', '뒷모습', '보행'],
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
  '31': {
    path: '/fastsearch_img/qs_img_31_n.png',
    top: '어두운색 아우터',
    bottom: '어두운색 바지',
    shoes: '확인 어려움',
    belongings: '없음',
    genderEstimate: '알 수 없음',
    characteristics: '원거리, 다수 인물 포함 컷',
    attributes: ['어두운색 아우터', '어두운색 바지', '원거리', '다수 인물'],
  },
  '32': {
    path: '/fastsearch_img/qs_img_32_y.png',
    top: '회색 후드티',
    bottom: '어두운색 바지',
    shoes: '흰색 운동화',
    belongings: '없음',
    genderEstimate: '남성으로 보임 (확실하지 않음)',
    characteristics: '뒷모습, 인도 보행',
    attributes: ['회색 후드티', '어두운색 바지', '흰색 운동화', '남성', '뒷모습', '인도 보행'],
  },
  '33': {
    path: '/fastsearch_img/qs_img_33_n.png',
    top: '어두운색 아우터',
    bottom: '연청바지',
    shoes: '밝은색 운동화',
    belongings: '우산(파랑 계열)',
    genderEstimate: '알 수 없음',
    characteristics: '차량 옆, 뒷모습',
    attributes: ['어두운색 아우터', '연청바지', '밝은색 운동화', '우산', '차량 옆', '뒷모습'],
  },
  '34': {
    path: '/fastsearch_img/qs_img_34_n.png',
    top: '회색 후드티',
    bottom: '어두운색 바지',
    shoes: '흰색 운동화',
    belongings: '우산(검정)',
    genderEstimate: '알 수 없음',
    characteristics: '뒷모습, 골목 보행',
    attributes: ['회색 후드티', '어두운색 바지', '흰색 운동화', '우산', '뒷모습', '골목 보행'],
  },
  '35': {
    path: '/fastsearch_img/qs_img_35_n.png',
    top: '어두운색 상의',
    bottom: '어두운색 바지',
    shoes: '흰색 운동화',
    belongings: '비닐백',
    genderEstimate: '알 수 없음',
    characteristics: '원거리, 측면',
    attributes: ['어두운색 상의', '어두운색 바지', '흰색 운동화', '비닐백', '원거리', '측면'],
  },
  '36': {
    path: '/fastsearch_img/qs_img_36_n.png',
    top: '어두운색 아우터',
    bottom: '청바지',
    shoes: '흰색 운동화',
    belongings: '없음',
    genderEstimate: '알 수 없음',
    characteristics: '원거리, 정면',
    attributes: ['어두운색 아우터', '청바지', '흰색 운동화', '원거리', '정면'],
  },
  '37': {
    path: '/fastsearch_img/qs_img_37_n.png',
    top: '보라/남색 계열 아우터',
    bottom: '검정 바지',
    shoes: '흰색 운동화',
    belongings: '휴대폰',
    genderEstimate: '알 수 없음',
    characteristics: '정면, 보행',
    attributes: ['보라', '남색', '보라/남색 계열 아우터', '검정 바지', '흰색 운동화', '휴대폰', '정면', '보행'],
  },
  '38': {
    path: '/fastsearch_img/qs_img_38_n.png',
    top: '어두운색 아우터',
    bottom: '청바지',
    shoes: '흰색 운동화',
    belongings: '없음',
    genderEstimate: '알 수 없음',
    characteristics: '정면, 한 손 머리 접촉',
    attributes: ['어두운색 아우터', '청바지', '흰색 운동화', '정면', '한 손 머리 접촉'],
  },
  '39': {
    path: '/fastsearch_img/qs_img_39_n.png',
    top: '회색 패딩',
    bottom: '어두운색 바지',
    shoes: '흰색 운동화',
    belongings: '우산(파랑 계열)',
    genderEstimate: '알 수 없음',
    characteristics: '정면, 우산 펼침',
    attributes: ['회색 패딩', '어두운색 바지', '흰색 운동화', '우산', '정면'],
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
  '48': {
    path: '/fastsearch_img/qs_img_48_n.png',
    top: '어두운색 상의(후드 아님)',
    bottom: '어두운색 바지',
    shoes: '어두운색 신발',
    belongings: '우산(검정)',
    genderEstimate: '알 수 없음',
    characteristics: '정면, 우산으로 상체 일부 가림',
    attributes: ['어두운색 상의', '어두운색 바지', '어두운색 신발', '우산', '정면'],
  },
  '57': {
    path: '/fastsearch_img/qs_img_57_y.png',
    top: '회색 후드티',
    bottom: '청바지',
    shoes: '흰색 운동화',
    belongings: '없음',
    genderEstimate: '남성으로 보임 (확실하지 않음)',
    characteristics: '정면 보행, 주머니에 손 넣은 상태',
    attributes: ['회색 후드티', '청바지', '흰색 운동화', '남성', '정면', '보행'],
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
 * 높은 점수: 회색 후드티 + 어두운색 바지 + 휴대폰 + 남성 (4개 일치: 95~99점)
 * 중간 점수: 회색 후드티 + 어두운색 바지 (2~3개 일치: 85~94점)
 * 낮은 점수: 1개 이하 일치 (70~84점)
 */
export const IMAGE_CONFIDENCE: Record<ImageId, number> = {
  // 높은 유사도 (회색 후드티 + 어두운색 바지 + 휴대폰 + 남성)
  '04': 99, // 회색 후드티, 청바지(유사), 휴대폰, 남성 - 4개 일치
  '21': 98, // 회색 후드티, 어두운색 바지, 휴대폰, 남성 - 4개 완벽 일치
  '40': 98, // 회색 후드티, 어두운색 바지, 남성 - 3개 일치
  '32': 97, // 회색 후드티, 어두운색 바지, 남성 - 3개 일치
  
  // 59번 기준
  '59': 95, // 회색 후드티, 어두운색 바지, 휴대폰, 남성 - 기준점
  
  // 중상위 유사도 (회색 후드티 + 청바지 + 휴대폰 + 남성)
  '16': 94, // 회색 후드티, 청바지, 휴대폰, 남성 - 3개 일치
  '18': 93, // 회색 후드티, 청바지, 휴대폰, 남성 - 3개 일치
  '19': 93, // 회색 후드티, 청바지, 휴대폰, 남성 - 3개 일치
  '23': 92, // 회색 후드티, 청바지, 휴대폰, 남성 - 3개 일치
  '25': 92, // 회색 후드티, 청바지, 휴대폰, 남성 - 3개 일치
  '26': 91, // 회색 후드티, 청바지, 휴대폰, 남성 - 3개 일치
  
  // 중위 유사도 (회색 후드티 + 어두운색 바지)
  '29': 89, // 회색 후드티, 어두운색 바지 - 2개 일치
  '30': 89, // 회색 후드티, 어두운색 바지 - 2개 일치
  '34': 88, // 회색 후드티, 어두운색 바지, 우산 - 2개 일치
  
  // 중하위 유사도 (회색 패딩/후드티 유사)
  '57': 87, // 회색 후드티, 청바지, 남성 - 2개 일치
  '03': 85, // 회색 패딩, 검정 바지, 우산 - 1개 유사
  '07': 84, // 회색 패딩, 검정 바지, 우산 - 1개 유사
  '08': 84, // 회색 패딩, 검정 바지, 우산, 백팩 - 1개 유사
  '11': 83, // 회색 패딩, 검정 바지, 우산 - 1개 유사
  '12': 83, // 회색 패딩, 검정 바지, 우산 - 1개 유사
  '14': 82, // 회색 패딩, 검정 바지, 우산 - 1개 유사
  '17': 82, // 회색 패딩, 검정 바지, 우산 - 1개 유사
  '20': 81, // 회색 패딩, 청바지, 우산 - 1개 유사
  '22': 81, // 회색 패딩, 청바지, 우산, 백팩 - 1개 유사
  '24': 81, // 회색 패딩, 검정 바지, 우산 - 1개 유사
  '39': 80, // 회색 패딩, 어두운색 바지, 우산 - 1개 유사
  
  // 낮은 유사도 (속성 1개 이하 일치)
  '01': 79, // 밝은색 패딩, 어두운색 바지
  '02': 78, // 어두운색 아우터, 어두운색 바지, 우산
  '05': 77, // 밝은색 상의, 어두운색 바지
  '06': 77, // 밝은색 상의, 어두운색 바지
  '09': 76, // 어두운색 아우터, 어두운색 바지, 우산
  '10': 76, // 회색 상의, 어두운색 바지, 비닐백
  '13': 75, // 어두운색 아우터, 청바지, 우산
  '15': 75, // 밝은색 패딩, 검정 바지, 쇼핑백
  '27': 74, // 어두운색 아우터, 청바지, 우산
  '28': 73, // 어두운색 아우터, 어두운색 바지
  '31': 72, // 어두운색 아우터, 어두운색 바지
  '33': 72, // 어두운색 아우터, 연청바지, 우산
  '35': 71, // 어두운색 상의, 어두운색 바지, 비닐백
  '36': 71, // 어두운색 아우터, 청바지
  '37': 70, // 보라/남색 계열 아우터, 검정 바지, 휴대폰
  '38': 70, // 어두운색 아우터, 청바지
  '48': 70, // 어두운색 상의, 어두운색 바지, 우산
};

/** 이미지 ID별 CCTV명 */
export const IMAGE_CCTV_NAME: Record<ImageId, string> = {
  '01': '원미A-230', '02': '원미A-230', '03': '원미A-230', '04': '원미A-230',
  '05': '원미A-230', '06': '원미A-230', '07': '원미A-230', '08': '원미A-230', '09': '원미A-230', '10': '원미A-230',
  '11': '원미A-230', '12': '원미A-230', '13': '원미A-230', '14': '원미A-230',
  '15': '원미A-230', '16': '원미A-230', '17': '원미A-230', '18': '원미A-230', '19': '원미A-230',
  '20': '원미A-444', '21': '원미A-444', '22': '원미A-444', '23': '원미A-444', '24': '원미A-444',
  '25': '원미A-444', '26': '원미A-444',
  '27': '원미A-444', '28': '원미A-444', '29': '원미A-444',
  '30': '원미A-481', '31': '원미A-481', '32': '원미A-481', '33': '원미A-481', '34': '원미A-481',
  '35': '원미A-498', '36': '원미A-498', '37': '원미A-498', '38': '원미A-498', '39': '원미A-498', '40': '원미A-498',
  '48': '원미A-583',
  '57': '원미A-604',
  '59': '원미A-604',
};

/** 이미지 ID별 위치 */
export const IMAGE_LOCATION: Record<ImageId, string> = {
  '01': '원미구 부천로 245번길 15 (참사랑교회)', '02': '원미구 부천로 245번길 15 (참사랑교회)',
  '03': '원미구 부천로 245번길 15 (참사랑교회)', '04': '원미구 부천로 245번길 15 (참사랑교회)',
  '05': '원미구 부천로 245번길 15 (참사랑교회)', '06': '원미구 부천로 245번길 15 (참사랑교회)',
  '07': '원미구 부천로 245번길 15 (참사랑교회)', '08': '원미구 부천로 245번길 15 (참사랑교회)',
  '09': '원미구 부천로 245번길 15 (참사랑교회)', '10': '원미구 부천로 245번길 15 (참사랑교회)',
  '11': '원미구 부천로 245번길 15 (참사랑교회)', '12': '원미구 부천로 245번길 15 (참사랑교회)',
  '13': '원미구 부천로 245번길 15 (참사랑교회)', '14': '원미구 부천로 245번길 15 (참사랑교회)',
  '15': '원미구 부천로 245번길 15 (참사랑교회)', '16': '원미구 부천로 245번길 15 (참사랑교회)',
  '17': '원미구 부천로 245번길 15 (참사랑교회)', '18': '원미구 부천로 245번길 15 (참사랑교회)',
  '19': '원미구 부천로 245번길 15 (참사랑교회)',
  '20': '길주로363번길 48', '21': '길주로363번길 48', '22': '길주로363번길 48', '23': '길주로363번길 48', '24': '길주로363번길 48',
  '25': '길주로363번길 48', '26': '길주로363번길 48',
  '27': '길주로363번길 48', '28': '길주로363번길 48', '29': '길주로363번길 48',
  '30': '계남로301번길 28', '31': '계남로301번길 28', '32': '계남로301번길 28', '33': '계남로301번길 28', '34': '계남로301번길 28',
  '35': '계남로301번길 54', '36': '계남로301번길 54', '37': '계남로301번길 54', '38': '계남로301번길 54', '39': '계남로301번길 54', '40': '계남로301번길 54',
  '48': '원미구 부천로 245번길 41',
  '57': '길주로391번길 29',
  '59': '길주로391번길 29 (검지2, 약대파출소)',
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
 * 규칙: id 1~40 → img 01~40, id 41 → img 48, id 42 → img 57, id 43 → img 59
 */
export const getImageIdFromCaptureItem = (item: { id: string }): ImageId => {
  const raw = parseInt(item.id, 10);
  if (raw === 41) return '48';
  if (raw === 42) return '57';
  if (raw === 43) return '59';
  const n = raw >= 1 && raw <= 40 ? raw : ((raw - 1) % 40) + 1;
  return String(n).padStart(2, '0') as ImageId;
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
  return IMAGE_CCTV_NAME[imageId] ?? '원미A-230';
};

/** 캡처 아이템의 위치 */
export const getLocationForCaptureItem = (item: { id: string }): string => {
  const imageId = getImageIdFromCaptureItem(item);
  return IMAGE_LOCATION[imageId] ?? '원미구 부천로 245번길 15';
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
