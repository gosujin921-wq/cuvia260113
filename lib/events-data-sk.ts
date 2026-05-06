import type { ProcessingStage, ResolutionCategory, EventType } from '@/types';
import i18n from '@/src/i18n';

/**
 * ============================================================================
 * 📡 SK 페이지 (/sk) 전용 — 기밀문서 반출 시나리오
 * ============================================================================
 *
 * 이 파일은 /sk 페이지에서만 사용됩니다.
 * v2 (/tutorial) 페이지는 기존 lib/events-data.ts 를 계속 사용합니다.
 *
 * 시나리오: 사내 설계실(M16 3F)에서 반도체 설계문서가 외부로 반출 시도된
 *           정황이 DLP에 의해 감지되었고, 용의자 동선을 사내 CCTV로 추적하는 흐름.
 * ============================================================================
 */

export interface BaseEvent {
  eventId: string; // 규칙에 따른 이벤트 ID
  id: string; // 내부 사용 ID
  type: string;
  title: string;
  time: string;
  location: string;
  description?: string;
  source?: string;
  risk: '긴급' | '경계' | '주의' | '일반';
  status: '진행중' | '종결' | '오탐';
  domain: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; // 도메인 코드 (기존 호환)
  broadcastHistory?: {
    count: number;
    lastBroadcastTime?: string;
  };
}

// SK 전용 더미 이벤트 (단일 시나리오)
const MOCK_EVENTS_SK: BaseEvent[] = [
  {
    eventId: 'S-20260107-001',
    id: 'S-20260107-001',
    type: '기밀문서 반출',
    title: '박지훈(남, 35세, 연구원) 기밀문서 반출 의심',
    time: '14:08',
    location: 'M16 동 3F 설계실',
    description:
      '14:08 DLP 알림: 인가 등급 외 설계문서(반도체 회로도) 외장 매체 복사 시도 감지. ' +
      '대상자 박지훈 / 35세 / 175cm·70kg / 다크 자켓·블랙 백팩·사원증 패용. ' +
      'M16 3F 설계실 PC에서 USB 연결 1건, 비인가 구역 진입 패턴 4건 동반. 즉시 사내 CCTV 추적 필요.',
    source: '산업보안센터',
    risk: '긴급',
    status: '진행중',
    domain: 'A',
    broadcastHistory: {
      count: 0,
    },
  },
];

// 사건별 하드코딩 데이터 (좌표는 v2와 동일하게 유지 — 사용자 요청)
const eventSpecificData: Record<
  string,
  {
    type: EventType;
    processingStage: ProcessingStage;
    resolution: {
      category: ResolutionCategory;
      code: string;
    };
    coordinates?: [number, number];
    listTitle?: string;
    listLocation?: string;
  }
> = {
  'S-20260107-001': {
    type: '기밀문서 반출',
    processingStage: '생성',
    resolution: {
      category: 'AI',
      code: 'DLP 알림 확인 완료',
    },
    // 좌표는 v2와 동일 (지도 그대로 두라는 사용자 요청)
    coordinates: [126.99656, 37.43527] as [number, number],
    listTitle: '',
    listLocation: '',
  },
};

const resolutionDescriptionTemplates: Record<ResolutionCategory, string> = {
  '112': '112 상황실',
  '119': '119 지휘센터',
  약자: '약자 보호 센터',
  AI: '산업보안센터', // SK 시나리오: AI 모니터링 허브 → 산업보안센터로 표기
  재난: '재난 대응 본부',
  도시운영: '도시 운영 센터',
};

const buildResolutionDescription = (category: ResolutionCategory, code: string): string => {
  const prefix = resolutionDescriptionTemplates[category];
  return `${prefix}에서 "${code}" 조치가 보고되었습니다.`;
};

/**
 * 📡 API 연동 필요: 이벤트 목록 조회
 */
export const allEvents: BaseEvent[] = MOCK_EVENTS_SK;

/**
 * 📡 API 연동 필요: 이벤트 ID로 이벤트 조회
 */
export const getEventById = (eventId: string): BaseEvent | undefined => {
  return allEvents.find((event) => event.eventId === eventId || event.id === eventId);
};

// 도메인 코드 라벨 (sk 시나리오는 단일 도메인 사용)
export const domainLabels: Record<'A' | 'B' | 'C' | 'D' | 'E' | 'F', string> = {
  A: '산업 보안',
  B: '119 재난 · 구조',
  C: '사회적 약자 보호',
  D: 'AI 이상행동',
  E: '재난',
  F: '도시 운영 · 환경',
};

export const getEventCategory = (event: BaseEvent): string => {
  return domainLabels[event.domain];
};

// 좌표 생성 (v2와 동일하게 유지)
const generateCoordinates = (index: number): [number, number] => {
  const baseLat = 37.433686188524;
  const baseLng = 126.978706819665;
  const offset = index * 0.001;
  return [baseLng + offset, baseLat + offset];
};

// 대시보드용 Event 타입으로 변환
export const convertToDashboardEvent = (event: BaseEvent, index: number) => {
  const statusMap: Record<string, 'NEW' | 'MONITORING' | 'RESOLVED' | 'EVIDENCE'> = {
    진행중: 'MONITORING',
    종결: 'RESOLVED',
    오탐: 'RESOLVED',
  };

  const eventData = eventSpecificData[event.id] || eventSpecificData[event.eventId];

  if (!eventData) {
    return {
      id: event.id,
      eventId: event.eventId,
      type: '기밀문서 반출' as EventType,
      title: event.title,
      priority: event.risk,
      status: statusMap[event.status] || 'NEW',
      timestamp: event.time,
      location: {
        name: event.location,
        coordinates: generateCoordinates(index),
      },
      description: event.description || event.title,
      processingStage: '생성' as ProcessingStage,
      resolution: {
        category: 'AI' as ResolutionCategory,
        code: 'DLP 알림 확인 완료',
        description: buildResolutionDescription('AI', 'DLP 알림 확인 완료'),
      },
    };
  }

  const resolutionDescription = buildResolutionDescription(
    eventData.resolution.category,
    eventData.resolution.code
  );

  const coordinates = eventData.coordinates ?? generateCoordinates(index);
  const eventKey = event.id || event.eventId;
  const listTitleKey = `sk.events.${eventKey}.listTitle`;
  const listLocationKey = `sk.events.${eventKey}.listLocation`;
  const i18nTitle = i18n.exists(listTitleKey) ? i18n.t(listTitleKey) : '';
  const i18nLocation = i18n.exists(listLocationKey) ? i18n.t(listLocationKey) : '';
  const listTitle = i18nTitle || eventData.listTitle || event.title;
  const listLocation = i18nLocation || eventData.listLocation || event.location;

  return {
    id: event.id,
    eventId: event.eventId,
    type: eventData.type,
    title: listTitle,
    priority: event.risk,
    status: statusMap[event.status] || 'NEW',
    timestamp: event.time,
    location: {
      name: listLocation,
      coordinates,
    },
    description: event.description || event.title,
    processingStage: eventData.processingStage,
    resolution: {
      category: eventData.resolution.category,
      code: eventData.resolution.code,
      description: resolutionDescription,
    },
  };
};

/**
 * AI 인사이트 — 기밀문서 반출 시나리오용
 */
export const generateAIInsight = (event: BaseEvent): string => {
  const { title, description, risk, location } = event;

  if (event.id === 'S-20260107-001' || event.eventId === 'S-20260107-001') {
    return (
      `기밀문서 반출 의심 사건 발생. ${description || title}. ` +
      `${location}에서 DLP 알림이 접수되었습니다. 위험도 ${risk}입니다. ` +
      `최근 출입 게이트 4지점에서 비인가 구역 진입 패턴이 감지되었고, ` +
      `외장 USB 연결 이력 1건이 확인되었습니다. ` +
      `즉시 사내 CCTV 동선 추적 및 출입 통제팀 협조가 필요합니다.`
    );
  }

  return `${title} 이벤트 발생. ${description || ''} ${location}에서 발생한 이벤트로 위험도 ${risk}입니다. 현재 상황을 분석 중이며, 필요시 즉시 대응이 필요합니다.`;
};

/**
 * 이벤트 완료 메시지 (sk 시나리오용)
 */
export const generateEventCompletionMessage = (
  event: BaseEvent,
  dashboardEvent: ReturnType<typeof convertToDashboardEvent> | null
): string => {
  const resolution = dashboardEvent?.resolution;
  const resolutionCode = resolution?.code || '상황 종료';
  const resolutionDescription = resolution?.description || '사건이 종결되었습니다.';

  let message = `이 사건이 종료되었습니다.\n\n`;
  message += `**처리 결과**\n`;
  message += `${resolutionCode}\n`;
  message += `${resolutionDescription}\n\n`;

  if (event.id === 'S-20260107-001' || event.eventId === 'S-20260107-001') {
    message += `용의자 동선이 확보되었고, 외장 매체 봉인 및 정문 출입 차단이 완료되었습니다.`;
  } else {
    message += `사건이 성공적으로 해결되었습니다.`;
  }

  message += `\n\n더 이상 모니터링이 필요하지 않습니다.`;
  return message;
};

/**
 * AI 인사이트 키워드 (sk 시나리오용)
 */
export const getAIInsightKeywords = (event: BaseEvent): string[] => {
  if (event.id === 'S-20260107-001' || event.eventId === 'S-20260107-001') {
    return ['기밀유출', '추적필요', '즉시격리'];
  }
  return ['이벤트', '분석중', '대응필요'];
};

export const formatEventDateTime = (eventId: string, time?: string) => {
  const segments = eventId?.split('-') ?? [];
  const datePart = segments[1];
  if (!datePart || datePart.length !== 8) {
    return time || '';
  }
  const year = datePart.slice(0, 4);
  const month = datePart.slice(4, 6);
  const day = datePart.slice(6, 8);
  const formattedDate = `${year}.${month}.${day}`;
  if (!time) {
    return formattedDate;
  }
  return `${formattedDate} ${time}`;
};
