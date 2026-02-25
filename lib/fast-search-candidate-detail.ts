/**
 * 고속검색 후보 상세 팝업용 mock 데이터.
 * 관찰 카드 톤(판단·단정 없음). API 연동 시 이 모듈만 교체하면 됨.
 */

import type { ImageId } from './fast-search-image-attributes';
import { getAttributesForImageId } from './fast-search-image-attributes';

export interface TimelineEntry {
  time: string;
  label: string;
  seconds: number;
}

export interface CandidateDetailMeta {
  cameraId: string;
  detectedObject: string;
  mainAttributes: string;
  behavior: string;
  exitDirection: string;
  score: number;
}

export interface CandidateDetailData {
  observationSummary: string;
  timeline: TimelineEntry[];
  meta: CandidateDetailMeta;
}

const DEFAULT_TIMELINE: Omit<TimelineEntry, 'seconds'>[] = [
  { time: '00:00', label: '화면 내 등장' },
  { time: '00:10', label: '체류' },
  { time: '06:02', label: '화면 이탈' },
];

const MOCK_SUMMARIES: Partial<Record<ImageId, string>> = {
  '01': '밝은색 패딩 점퍼 착용자가 인도에 등장한 뒤 편의점 앞에 잠시 체류하였고, 이후 상단 좌측 방향으로 이동하여 화면을 이탈함.',
  '02': '어두운색 아우터 착용자가 우산을 들고 편의점 입구 부근에 등장하여 잠시 체류한 뒤 입·퇴장을 반복하고, 상단 중앙 방향으로 이동하여 화면을 이탈함.',
  '03': '회색 패딩·검정 바지 착용자가 우산을 들고 편의점 앞에 등장한 뒤 체류하며 출입을 반복하고, 이후 우측 상단 방향으로 이동하여 화면을 이탈함.',
  '04': '회색 후드티 착용 남성이 편의점 앞에 체류한 뒤 입·퇴장을 반복하고, 이후 상단 중앙 방향으로 이동하여 화면을 이탈함.',
  '05': '밝은 아이보리/베이지색 패딩(이미지) 또는 어두운색 외투(영상)와 검은색 하의를 착용한 인물이 파란색 장우산을 쓰고 참사랑교회 앞 붉은색 보행자 우선도로를 따라 이동하며, \'일방통행\' 표지판 옆 지점에서 약 5초간 정지하여 휴대폰을 조작한 후 화면 상단 방향(교회 입구 방면)으로 이동하여 화면을 이탈함.',
  '06': '밝은색 상의 착용자가 흰색 운동화를 신고 인도에 등장한 뒤 체류하였고, 이후 화면을 이탈함.',
  '07': '회색 패딩·검정 바지 착용자가 우산을 들고 편의점 앞에 등장한 뒤 체류하였고, 이후 화면을 이탈함.',
  '08': '회색 패딩·검정 바지 착용자가 우산과 백팩을 메고 편의점 앞에 등장한 뒤 체류하였고, 이후 화면을 이탈함.',
  '09': '어두운색 아우터 착용자가 우산을 들고 야간에 등장한 뒤 체류하였고, 이후 화면을 이탈함.',
  '10': '회색 상의 착용자가 비닐백/쇼핑백을 들고 출입문을 통과한 뒤 화면을 이탈함.',
  '11': '밝은 회색 또는 흰색 계열의 상의와 검은색 하의, 흰색 운동화를 착용한 슬림한 체격의 인물이 투명한 패턴 우산을 쓴 상태로 참사랑교회 인근 이면도로에 등장하여 화면 우측 하단에서 중앙 도로 방향으로 보행을 시작한 후 일정한 속도를 유지하며 카메라 반대 방향(화면 상단)으로 최종 이탈함.',
  '15': '흰색(또는 매우 밝은 회색) 패딩 상의와 검은색 하의, 흰색 운동화를 착용한 인물이 손에 스마트폰을 든 채 참사랑교회 인근 사거리에 진입하여 \'세종공인중개사\' 앞 횡단보도를 대각선 방향으로 횡단하며 지속적으로 휴대폰 화면을 응시하는 보행 패턴을 보인 후 화면 하단 왼쪽 방향(남서 방향)으로 보행을 유지하며 최종 이탈함.',
  '21': '회색 후드 티셔츠와 어두운색 바지(청바지), 흰색 운동화를 착용한 흑색 짧은 머리의 슬림한 체격 인물이 은색 차량 옆 도로에 등장하여 양손으로 휴대폰을 들고 조작하며 주변을 살피지 않고 휴대폰 화면을 응시하며 도로를 따라 서행 보행한 후 일정한 보행 속도를 유지하며 화면 상단 방향(북동 방향)으로 최종 이탈함.',
  '25': '회색 후드티와 짙은 색 청바지, 흰색 운동화를 착용한 인물이 원미A-444 검지2 화각 상단(노란색 지주대 부근)에 등장하여 양손으로 휴대폰을 들고 고개를 숙인 채 화면에 집중하며 도로 중앙을 따라 서행 보행한 후 카메라 정면 하단 방향(남서 방향)으로 보행 속도를 유지하며 최종 이탈함.',
  '30': '회색 후드 티셔츠와 어두운색 청바지, 흰색 운동화를 착용한 흑색 짧은 머리의 슬림한 체격 인물이 원미A-481 검지1 화각 하단에 등장하여 휴대폰을 손에 든 채 일정한 속도로 도로 중앙을 따라 전방 이동한 후 화면 상단 방향(달빛로 방면, 북서 방향)으로 보행을 유지하며 최종 이탈함.',
  '40': '회색 후드 티셔츠와 어두운색 청바지, 흰색 운동화를 착용한 흑색 머리의 슬림한 체격(176cm, 65kg 추정) 인물이 \'길주로377번길 28\' 표지판 인근 도로 화각 하단에 등장하여 보행 중 손에 든 휴대폰을 응시하며 일방통행 화살표 방향(화면 상단)으로 직선 보행을 유지한 후 화면 상단 방향(북동 방향)으로 최종 이탈함.',
  '47': '회색 후드 티셔츠와 어두운색 바지, 흰색 운동화를 착용한 흑색 짧은 머리의 슬림한 체격(실종자 김도연과 동일한 신체 조건) 인물이 원미A-583 검지3 화각 하단(횡단보도 인근)에 등장하여 양손으로 스마트폰을 들고 주변 도로 상황을 확인하지 않고 스마트폰 조작에 집중하며 도로 중앙을 따라 상단 방향으로 이동한 후 일정한 보행 속도를 유지하며 화면 상단 방향(북서 방향)으로 최종 이탈함.',
  '51': '회색 후드 티셔츠와 어두운색 청바지, 흰색 운동화를 착용한 흑색 짧은 머리의 슬림한 체격 인물이 원미A-583 검지3 화각 상단(성기약국 앞 도로)에 등장하여 고개를 숙이고 양손으로 스마트폰을 조작하며 주변 보행자나 차량 흐름을 확인하지 않고 스마트폰 화면에 집중하며 카메라 정면 방향으로 이동한 후 카메라 정면 하단 방향(남서 방향)으로 일정한 보행 속도를 유지하며 최종 이탈함.',
  '48': '회색 후드티·청색 바지 착용자가 휴대폰을 조작하며 인도에 등장한 뒤 체류하였고, 이후 하단 우측 방향으로 이동하여 화면을 이탈함.',
  '59': '회색 후드 남성이 편의점 앞에 체류하다가 입장·퇴장 후 상단 중앙 방향으로 화면을 이탈함',
};

const MOCK_TIMELINES: Partial<Record<ImageId, Omit<TimelineEntry, 'seconds'>[]>> = {
  '01': [
    { time: '00:00', label: '우측 하단 밝은색 패딩 점퍼 착용자 등장' },
    { time: '00:10', label: '편의점 앞 체류' },
    { time: '06:02', label: '상단 좌측 방향으로 이동 후 화면 이탈' },
  ],
  '02': [
    { time: '00:00', label: '우측 하단 어두운색 아우터 착용자(뒷모습) 등장' },
    { time: '00:10', label: '편의점 앞 체류' },
    { time: '06:02', label: '상단 중앙 방향으로 이동 후 화면 이탈' },
  ],
  '03': [
    { time: '00:00', label: '우측 하단 회색 패딩·우산 착용자 등장' },
    { time: '00:10', label: '편의점 앞 체류' },
    { time: '06:02', label: '우측 상단 방향으로 이동 후 화면 이탈' },
  ],
  '04': [
    { time: '00:00', label: '우측 하단 회색 후드티 착용자 등장' },
    { time: '00:10', label: '편의점 앞 체류' },
    { time: '06:02', label: '상단 중앙 방향으로 이동 후 화면 이탈' },
  ],
  '05': [
    { time: '00:00', label: '참사랑교회 앞 붉은색 보행자 우선도로 진입 확인' },
    { time: '00:05', label: '파란색 우산을 지탱하며 화면 상단 방향(교회 입구 방면)으로 보행' },
    { time: '00:22', label: '\'일방통행\' 표지판 옆 지점에서 약 5초간 정지하여 휴대폰 조작' },
    { time: '00:27', label: '화면 상단 방향으로 이동 후 화면 이탈' },
  ],
  '11': [
    { time: '00:00', label: '참사랑교회 인근 이면도로 화각 진입 (추정)' },
    { time: '00:00', label: '우산을 쓴 상태로 화면 우측 하단에서 중앙 도로 방향으로 보행 시작' },
    { time: '00:04', label: '카메라 반대 방향(화면 상단)으로 일정한 속도를 유지하며 최종 이탈 확인' },
  ],
  '15': [
    { time: '00:00', label: '참사랑교회 인근 사거리(고정4 화각) 진입 확인 (추정)' },
    { time: '00:02', label: '\'세종공인중개사\' 앞 횡단보도를 대각선 방향으로 횡단하며 휴대폰 조작' },
    { time: '00:08', label: '화면 하단 왼쪽 방향으로 보행 유지하며 최종 이탈' },
  ],
  '21': [
    { time: '00:00', label: '카메라 화각 하단, 은색 차량 옆 도로에 인물 등장 (추정)' },
    { time: '00:02', label: '주변을 살피지 않고 휴대폰 화면을 응시하며 도로를 따라 서행 보행' },
    { time: '00:05', label: '화면 상단 방향으로 일정한 보행 속도를 유지하며 최종 이탈 확인' },
  ],
  '25': [
    { time: '00:00', label: '원미A-444 검지2 화각 상단(노란색 지주대 부근)에 인물 등장 (추정)' },
    { time: '00:07', label: '휴대폰을 지속적으로 조작하며 도로 중앙을 따라 서행 보행' },
    { time: '00:13', label: '카메라 정면 하단 방향으로 보행 속도를 유지하며 최종 이탈 확인' },
  ],
  '30': [
    { time: '00:00', label: '원미A-481 검지1 화각 하단에 인물 등장 (추정)' },
    { time: '00:05', label: '휴대폰을 확인하며 일정한 속도로 도로 중앙을 따라 전방 이동' },
    { time: '00:12', label: '화면 상단 방향(달빛로 방면)으로 보행을 유지하며 최종 이탈 확인' },
  ],
  '40': [
    { time: '00:00', label: '\'길주로377번길 28\' 표지판 인근 도로 화각 하단에 인물 등장 (추정)' },
    { time: '00:05', label: '보행 중 손에 든 휴대폰을 응시하며 일방통행 화살표 방향(화면 상단)으로 직선 보행 유지' },
    { time: '00:10', label: '보행 속도를 유지하며 화면 상단 방향으로 최종 이탈 확인' },
  ],
  '47': [
    { time: '00:00', label: '원미A-583 검지3 화각 하단(횡단보도 인근)에 인물 등장 (추정)' },
    { time: '00:02', label: '주변 도로 상황을 확인하지 않고 스마트폰 조작에 집중하며 도로 중앙을 따라 상단 방향으로 이동' },
    { time: '00:10', label: '일정한 보행 속도를 유지하며 화면 상단 방향으로 최종 이탈 확인' },
  ],
  '51': [
    { time: '00:00', label: '원미A-583 검지3 화각 상단(성기약국 앞 도로)에 인물 등장 (추정)' },
    { time: '00:05', label: '주변 보행자나 차량 흐름을 확인하지 않고 스마트폰 화면에 집중하며 정면으로 이동' },
    { time: '00:09', label: '카메라 정면 하단 방향으로 일정한 보행 속도를 유지하며 최종 이탈 확인' },
  ],
  '48': [
    { time: '00:00', label: '좌측 상단 회색 후드티·청색 바지 착용자 등장' },
    { time: '00:05', label: '휴대폰 조작하며 천천히 이동' },
    { time: '00:15', label: '인도 중앙 체류, 휴대폰 계속 조작' },
    { time: '00:25', label: '하단 우측 방향으로 이동 시작' },
    { time: '00:35', label: '화면 우측 하단으로 이동 후 화면 이탈' },
  ],
  '59': [
    { time: '00:00', label: '회색 후드티 착용 남성 등장, 편의점 입구 근처 체류' },
    { time: '00:20', label: '전화하는 듯한 모습, 입구 쪽으로 이동' },
    { time: '00:25', label: '검은색 옷 + 우산 착용 행인 도로 이동' },
    { time: '00:40', label: '초록색 큰 우산 착용 행인 도로 이동, 검은색 SUV 서행 통과' },
    { time: '01:10', label: '승용차 서행 통과' },
    { time: '01:12', label: '형광색 안전 조끼 + 흰색 헬멧 착용 작업자 등장' },
    { time: '01:30', label: '작업자 도로 가로질러 위쪽으로 이동, 화면 이탈' },
  ],
};

const MOCK_EXIT_DIRECTIONS: Partial<Record<ImageId, string>> = {
  '01': '상단 좌측',
  '02': '상단 중앙',
  '03': '우측 상단',
  '04': '상단 중앙',
  '05': '상단 방향',
  '11': '화면 상단',
  '15': '남서 방향 (화면 하단 좌측)',
  '21': '북동 방향 (화면 상단)',
  '25': '하단 중앙 (남서 방향)',
  '30': '북서 방향 (화면 상단)',
  '40': '북동 방향 (화면 상단)',
  '47': '북서 방향 (화면 상단)',
  '51': '남서 방향 (화면 하단)',
  '48': '하단 우측',
  '59': '상단 중앙',
};

const MOCK_BEHAVIORS: Partial<Record<ImageId, string>> = {
  '01': '체류 후 반복 출입',
  '02': '체류 후 반복 출입',
  '03': '체류 후 반복 출입',
  '04': '체류 후 반복 출입',
  '05': '우산을 쓰고 붉은색 보행로를 따라 이동하거나, 표지판 옆에서 멈춰 휴대폰을 확인하는 자세',
  '11': '우산을 쓴 상태로 일정한 속도를 유지하며 보행',
  '15': '횡단보도를 건너며 지속적으로 휴대폰 화면을 응시하는 보행 패턴',
  '21': '양손으로 휴대폰을 들고 조작하며 걷는 보행 패턴',
  '25': '양손으로 휴대폰을 들고 고개를 숙인 채 화면에 집중하며 걷는 보행 패턴',
  '30': '휴대폰을 손에 든 채 도로 중앙을 따라 카메라에서 멀어지는 방향으로 보행',
  '40': '보행 중 휴대폰을 꺼내어 확인하거나 조작하는 패턴 관찰',
  '47': '양손으로 스마트폰을 들고 화면을 지속적으로 응시하며 걷는 보행 패턴',
  '51': '고개를 숙이고 양손으로 스마트폰을 조작하며 카메라 방향으로 걸어오는 보행 패턴',
  '48': '휴대폰 조작하며 천천히 이동',
  '59': '편의점 입구 근처 체류, 전화, 입구 이동',
};

export interface SimilarityTableRow {
  category: string;
  missing: string;
  captured: string;
  match: boolean | 'special';
}

const SIMILARITY_TABLES: Partial<Record<ImageId, SimilarityTableRow[]>> = {
  '05': [
    { category: '의류(상의)', missing: '회색 후드', captured: '밝은색 패딩/어두운색 외투', match: false },
    { category: '의류(하의)', missing: '청바지', captured: '검은색 하의', match: false },
    { category: '소지품', missing: '-', captured: '파란색 장우산', match: 'special' },
    { category: '행동 특징', missing: '-', captured: '표지판 옆 정지 약 5초', match: 'special' },
  ],
  '11': [
    { category: '의류(상의)', missing: '회색 후드', captured: '밝은 회색/흰색 상의', match: true },
    { category: '의류(하의)', missing: '청바지', captured: '검은색 하의', match: false },
    { category: '신발', missing: '흰색 운동화', captured: '흰색 운동화', match: true },
    { category: '소지품', missing: '-', captured: '투명 패턴 우산', match: 'special' },
    { category: '체격', missing: '슬림', captured: '슬림 (뒷모습)', match: true },
  ],
  '15': [
    { category: '의류(상의)', missing: '회색 후드', captured: '흰색 패딩', match: false },
    { category: '의류(하의)', missing: '청바지', captured: '검은색 하의', match: false },
    { category: '신발', missing: '흰색 운동화', captured: '흰색 운동화', match: true },
    { category: '행동 특징', missing: '-', captured: '횡단보도 대각선 횡단', match: 'special' },
  ],
  '21': [
    { category: '의류(상의)', missing: '회색 후드', captured: '회색 후드티', match: true },
    { category: '의류(하의)', missing: '청바지', captured: '어두운색 청바지', match: true },
    { category: '신발', missing: '흰색 운동화', captured: '흰색 운동화', match: true },
    { category: '헤어스타일', missing: '흑색 짧은 머리', captured: '흑색 짧은 머리', match: true },
    { category: '체격', missing: '슬림', captured: '슬림', match: true },
  ],
  '25': [
    { category: '의류(상의)', missing: '회색 후드', captured: '회색 후드티', match: true },
    { category: '의류(하의)', missing: '청바지', captured: '짙은 색 청바지', match: true },
    { category: '신발', missing: '흰색 운동화', captured: '흰색 운동화', match: true },
    { category: '행동 특징', missing: '-', captured: '고개 숙인 채 도로 중앙 보행', match: 'special' },
  ],
  '30': [
    { category: '의류(상의)', missing: '회색 후드', captured: '회색 후드티', match: true },
    { category: '의류(하의)', missing: '청바지', captured: '어두운색 청바지', match: true },
    { category: '신발', missing: '흰색 운동화', captured: '흰색 운동화', match: true },
    { category: '헤어스타일', missing: '흑색 짧은 머리', captured: '흑색 짧은 머리', match: true },
    { category: '체격', missing: '슬림', captured: '슬림 (뒷모습)', match: true },
  ],
  '40': [
    { category: '의류(상의)', missing: '회색 후드', captured: '회색 후드티', match: true },
    { category: '의류(하의)', missing: '청바지', captured: '어두운색 청바지', match: true },
    { category: '신발', missing: '흰색 운동화', captured: '흰색 운동화', match: true },
    { category: '헤어스타일', missing: '흑색 머리', captured: '흑색 머리', match: true },
    { category: '체격', missing: '176cm, 65kg', captured: '슬림 체격 (추정 일치)', match: true },
  ],
  '47': [
    { category: '의류(상의)', missing: '회색 후드', captured: '회색 후드티', match: true },
    { category: '의류(하의)', missing: '청바지', captured: '어두운색 바지', match: true },
    { category: '신발', missing: '흰색 운동화', captured: '흰색 운동화', match: true },
    { category: '헤어스타일', missing: '흑색 짧은 머리', captured: '흑색 짧은 머리', match: true },
    { category: '체격', missing: '슬림', captured: '슬림 (실종자와 동일)', match: true },
  ],
  '51': [
    { category: '의류(상의)', missing: '회색 후드', captured: '회색 후드티', match: true },
    { category: '의류(하의)', missing: '청바지', captured: '어두운색 청바지', match: true },
    { category: '신발', missing: '흰색 운동화', captured: '흰색 운동화', match: true },
    { category: '헤어스타일', missing: '흑색 짧은 머리', captured: '흑색 짧은 머리', match: true },
    { category: '체격', missing: '슬림', captured: '슬림', match: true },
  ],
  '59': [
    { category: '의류(상의)', missing: '회색 후드', captured: '회색 후드티', match: true },
    { category: '의류(하의)', missing: '청바지', captured: '어두운색 바지', match: true },
    { category: '신발', missing: '흰색 운동화', captured: '확인 어려움', match: false },
    { category: '행동 특징', missing: '-', captured: '편의점 앞 체류 및 출입', match: 'special' },
  ],
};

export const getSimilarityTableForImageId = (imageId: ImageId): SimilarityTableRow[] => {
  return SIMILARITY_TABLES[imageId] ?? [];
};

const parseTimeToSeconds = (time: string): number => {
  const [m, s] = time.split(':').map(Number);
  return (m ?? 0) * 60 + (s ?? 0);
};

/** "HH:MM:SS" 형식에 분을 더한 결과 반환 (24h overflow 무시, 00~23 유지) */
export const addMinutesToTime = (time: string, minutes: number): string => {
  const [h, m, s] = time.split(':').map(Number);
  const totalSec = (h ?? 0) * 3600 + (m ?? 0) * 60 + (s ?? 0) + minutes * 60;
  const bounded = ((totalSec % 86400) + 86400) % 86400;
  const nh = Math.floor(bounded / 3600);
  const nm = Math.floor((bounded % 3600) / 60);
  const ns = bounded % 60;
  return [nh, nm, ns].map((n) => String(n).padStart(2, '0')).join(':');
};

/**
 * 이미지 ID(01~10) 기준으로 후보 상세 mock 반환.
 * score·cameraId·location 등은 호출부에서 캡처 아이템 정보로 덮어쓸 수 있음.
 */
export const getCandidateDetailData = (
  imageId: ImageId,
  overrides: { cameraId: string; score: number } | null
): CandidateDetailData => {
  const attrs = getAttributesForImageId(imageId);
  const mainAttributes = attrs.length ? attrs.slice(0, 3).join(', ') : '-';
  const timelineData = MOCK_TIMELINES[imageId] ?? DEFAULT_TIMELINE;
  const timeline = timelineData.map((t) => ({
    ...t,
    seconds: parseTimeToSeconds(t.time),
  }));

  const score = overrides?.score ?? 85;
  const cameraId = overrides?.cameraId ?? 'CCTV-V-1';

  return {
    observationSummary: MOCK_SUMMARIES[imageId] ?? '인도에 등장한 뒤 체류하였고, 이후 화면을 이탈함.',
    timeline,
    meta: {
      cameraId,
      detectedObject: '사람',
      mainAttributes,
      behavior: MOCK_BEHAVIORS[imageId] ?? '체류 후 이동',
      exitDirection: MOCK_EXIT_DIRECTIONS[imageId] ?? '상단 중앙',
      score,
    },
  };
};

/**
 * 후보 상세 정보를 마크다운 형식으로 변환
 */
export const generateMarkdownAnalysis = (
  imageId: ImageId,
  cctvName: string,
  location: string,
  timestamp: string,
  confidence: number
): string => {
  const detail = getCandidateDetailData(imageId, { cameraId: cctvName, score: confidence });
  
  let markdown = `# 포착 후보 분석 보고서\n\n`;
  markdown += `## 기본 정보\n\n`;
  markdown += `- **카메라**: ${cctvName}\n`;
  markdown += `- **위치**: ${location}\n`;
  markdown += `- **포착 시각**: ${timestamp}\n`;
  markdown += `- **유사도**: ${confidence}%\n\n`;
  
  markdown += `## 관찰 요약\n\n`;
  markdown += `${detail.observationSummary}\n\n`;
  
  markdown += `## 시간 기반 관찰 기록\n\n`;
  detail.timeline.forEach((entry) => {
    markdown += `- **${entry.time}**: ${entry.label}\n`;
  });
  markdown += `\n`;
  
  markdown += `## 후보 메타 정보\n\n`;
  markdown += `- **감지 객체**: ${detail.meta.detectedObject}\n`;
  markdown += `- **주요 속성**: ${detail.meta.mainAttributes}\n`;
  markdown += `- **행동 특징**: ${detail.meta.behavior}\n`;
  markdown += `- **이탈 방향**: ${detail.meta.exitDirection}\n`;
  markdown += `- **유사도 점수**: ${detail.meta.score}점\n\n`;
  
  // 05번 후보인 경우 유사도 근거 추가
  if (imageId === '05') {
    markdown += `## 후보 근거\n\n`;
    markdown += `실종자 김도연은 회색 후드티와 청바지를 착용 중이나, 본 지점의 객체는 밝은색 패딩 및 우산을 쓴 어두운 점퍼를 착용하고 있어 의복 속성 불일치도가 매우 높음. 이에 따라 하위 후보군으로 분류됨.\n\n`;
  }
  
  // 11번 후보인 경우 유사도 근거 추가
  if (imageId === '11') {
    markdown += `## 후보 근거\n\n`;
    markdown += `실종자 김도윤의 핵심 정보인 '밝은 회색 상의'와 '흰색 운동화' 속성이 본 영상의 인물과 높은 정합성을 보임. 뒷모습만 포착되어 얼굴 식별은 불가능하나, 전체적인 신체 비율과 의복 색상 조합이 실종자 프로필과 상당히 유사하여 유력 후보로 분류됨.\n\n`;
  }
  
  // 15번 후보인 경우 유사도 근거 추가
  if (imageId === '15') {
    markdown += `## 후보 근거\n\n`;
    markdown += `실종자 김도윤의 '흰색 운동화'와 '휴대폰 상시 조작' 패턴은 일치하나, 결정적으로 실종자는 회색 후드티를 착용하고 있는 반면 본 객체는 부피감이 큰 흰색 패딩을 입고 있음. 의복 카테고리의 상이함으로 인해 유사도가 낮게 산출됨.\n\n`;
  }
  
  // 21번 후보인 경우 유사도 근거 추가
  if (imageId === '21') {
    markdown += `## 후보 근거\n\n`;
    markdown += `실종자(김도윤)의 인상착의인 회색 후드, 어두운색 바지, 흰색 운동화 조합이 본 영상의 객체 속성과 완벽하게 일치함. 특히 보행 중 휴대폰을 상시 조작하는 행동 패턴이 실종자 고유 속성과 정합하여 매우 유력한 후보로 분류됨.\n\n`;
  }
  
  // 25번 후보인 경우 유사도 근거 추가
  if (imageId === '25') {
    markdown += `## 후보 근거\n\n`;
    markdown += `실종자(김도연)의 핵심 속성인 회색 후드, 청바지, 흰색 운동화 조합이 고해상도로 포착되어 정합성이 매우 높음. 특히 이전 지점들에서 관찰된 '보행 중 스마트폰 상시 조작' 습관이 명확하게 재현되어 동일인일 가능성이 확실시됨.\n\n`;
  }
  
  // 30번 후보인 경우 유사도 근거 추가
  if (imageId === '30') {
    markdown += `## 후보 근거\n\n`;
    markdown += `실종자(김도윤)의 핵심 속성인 회색 후드와 어두운 하의 조합이 뒷모습에서도 명확히 식별됨. 이전 지점(원미A-444)에서의 이탈 방향 및 보행 속도를 고려할 때, 시공간적 연속성이 매우 뛰어난 유력 후보로 분석됨.\n\n`;
  }
  
  // 40번 후보인 경우 유사도 근거 추가
  if (imageId === '40') {
    markdown += `## 후보 근거\n\n`;
    markdown += `실종자(김도연)의 핵심 속성인 회색 후드, 어두운 하의, 흰색 운동화 조합이 뒷모습에서도 명확하게 식별되며, 이전 지점(원미A-481 등)에서의 이동 방향 및 보행 습관(휴대폰 상시 조작)과 완벽하게 정합함.\n\n`;
  }
  
  // 47번 후보인 경우 유사도 근거 추가
  if (imageId === '47') {
    markdown += `## 후보 근거\n\n`;
    markdown += `실종자(김도연)의 대표 착장인 회색 후드와 어두운색 바지 조합이 명확하게 식별됨. 특히 타 지점에서도 반복 포착된 **'스마트폰 상시 조작 보행'**이라는 고유한 행동 특징이 일치하여 매우 유력한 후보로 분류됨.\n\n`;
  }
  
  // 51번 후보인 경우 유사도 근거 추가
  if (imageId === '51') {
    markdown += `## 후보 근거\n\n`;
    markdown += `실종자(김도연)의 핵심 속성인 회색 후드와 청바지 조합이 정면 각도에서 명확하게 식별됨. 이전 지점(47번 영상)에서 이탈한 후의 예상 경로 및 시간대와 정합하며, 특유의 '스마트폰 집중 보행' 습관이 동일하게 관찰되어 매우 유력한 후보로 유지됨.\n\n`;
  }
  
  // 48번 후보인 경우 유사도 근거 추가
  if (imageId === '48') {
    markdown += `## 유사도 근거\n\n`;
    markdown += `| 항목 | 실종자 정보 | 포착 인물 정보 | 일치 여부 |\n`;
    markdown += `|------|------------|---------------|----------|\n`;
    markdown += `| 의류(상의) | 회색 후드 | 회색 후드티 | ✅ 일치 |\n`;
    markdown += `| 의류(하의) | 청바지 | 흑색/청색 계열 하의 | ✅ 일치 |\n`;
    markdown += `| 헤어스타일 | 흑색 짧은 머리 | 흑색 짧은 머리 | ✅ 일치 |\n`;
    markdown += `| 소지품/행동 | - | 휴대폰 조작 | ⚠️ 특이점 |\n\n`;
    markdown += `**최종 유사도**: 95.0점\n`;
  }
  
  return markdown;
};
