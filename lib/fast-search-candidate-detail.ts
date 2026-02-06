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
  '05': '밝은색 상의 착용자가 인도에 등장한 뒤 체류하였고, 이후 화면을 이탈함.',
  '06': '밝은색 상의 착용자가 흰색 운동화를 신고 인도에 등장한 뒤 체류하였고, 이후 화면을 이탈함.',
  '07': '회색 패딩·검정 바지 착용자가 우산을 들고 편의점 앞에 등장한 뒤 체류하였고, 이후 화면을 이탈함.',
  '08': '회색 패딩·검정 바지 착용자가 우산과 백팩을 메고 편의점 앞에 등장한 뒤 체류하였고, 이후 화면을 이탈함.',
  '09': '어두운색 아우터 착용자가 우산을 들고 야간에 등장한 뒤 체류하였고, 이후 화면을 이탈함.',
  '10': '회색 상의 착용자가 비닐백/쇼핑백을 들고 출입문을 통과한 뒤 화면을 이탈함.',
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
  '59': '상단 중앙',
};

const MOCK_BEHAVIORS: Partial<Record<ImageId, string>> = {
  '01': '체류 후 반복 출입',
  '02': '체류 후 반복 출입',
  '03': '체류 후 반복 출입',
  '04': '체류 후 반복 출입',
  '59': '편의점 입구 근처 체류, 전화, 입구 이동',
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
