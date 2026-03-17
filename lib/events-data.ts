import type { ProcessingStage, ResolutionCategory, EventType } from '@/types';
import { MOCK_EVENTS } from './mock-data/events';

/**
 * ============================================================================
 * 📡 API 연동 포인트
 * ============================================================================
 * 
 * 현재는 더미 데이터(MOCK_EVENTS)를 사용하고 있습니다.
 * 실제 API 연동 시 아래 함수들을 수정하세요:
 * 
 * 1. allEvents - 이벤트 목록 조회 API
 * 2. getEventById - 특정 이벤트 조회 API
 * 
 * 예시:
 * export const allEvents = async (): Promise<BaseEvent[]> => {
 *   const response = await fetch('/api/events');
 *   return response.json();
 * };
 * ============================================================================
 */

// 공통 이벤트 데이터 - 모든 페이지에서 공유
// 이벤트 ID 규칙: [도메인코드]-[연도월일]-[시퀀스]

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
  domain: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; // 도메인 코드
  broadcastHistory?: {
    count: number;
    lastBroadcastTime?: string; // ISO 8601 형식 또는 'YYYY-MM-DD HH:mm:ss'
  };
}

/**
 * ============================================================================
 * 📋 데이터 구조 및 그룹핑 참고 정보
 * ============================================================================
 * 
 * 아래는 API 연동 시 참고할 수 있는 데이터 구조와 그룹핑 정보입니다.
 * 현재는 실제 사용하는 이벤트만 하드코딩으로 처리하고 있습니다.
 * 
 * 1. 처리 단계 (ProcessingStage)
 *    - '생성' | '선별' | '착수' | '사실 검증' | '추적 · 지원' | '전파' | '종결'
 * 
 * 2. 이벤트 타입 매핑 (EventType)
 *    - BaseEvent.type (예: '폭행') -> EventType (예: '112 치안')
 *    - 도메인별 그룹:
 *      * A (112 치안·방범): '112 치안', '112 실종'
 *      * B (119 재난·구조): '119 화재', '119 구조'
 *      * D (AI 이상행동): 'AI 탐지'
 *      * E (재난): 'NDMS'
 *      * F (도시 운영·환경): '소방서'
 * 
 * 3. 해결 카테고리 (ResolutionCategory)
 *    - EventType에 따라 매핑: '112' | '119' | '약자' | 'AI' | '재난' | '도시운영'
 * 
 * 4. 해결 코드 (ResolutionCode)
 *    - 카테고리별 가능한 해결 코드 목록이 있음
 *    - 예: '112' 카테고리 -> ['출동 후 현장지도 완료', '용의자 확보', ...]
 * 
 * 5. 해결 설명 템플릿
 *    - 카테고리별 접두사: '112 상황실', '119 지휘센터', '약자 보호 센터' 등
 *    - 형식: "{접두사}에서 \"{해결코드}\" 조치가 보고되었습니다."
 * 
 * ============================================================================
 */

// 실제 사용하는 이벤트별 하드코딩 데이터
const eventSpecificData: Record<string, {
  type: EventType;
  processingStage: ProcessingStage;
  resolution: {
    category: ResolutionCategory;
    code: string;
  };
  /** 이벤트별 실제 좌표 [lng, lat] (없으면 generateCoordinates 사용) */
  coordinates?: [number, number];
  /** EventList용 제목 (신고팝업 내용 축약) */
  listTitle?: string;
  /** EventList용 장소 (신고팝업 실종 장소/시간) */
  listLocation?: string;
}> = {
  'A-20260107-004': {
    type: '112 실종',
    processingStage: '생성',
    resolution: {
      category: '112',
      code: 'CCTV 확인 완료',
    },
    // 1키 시나리오용 실제 사건 위치 (과천역 근처) [lng, lat]
    coordinates: [126.99656, 37.43527] as [number, number],
    /** EventList용: 신고팝업 내용 축약 (이름/나이, 인상착의, 장애·긴급) */
    listTitle: '김도연(22세, 남) 실종 - 회색 후드·청바지, 장애 있음. 긴급 수색 요망',
    listLocation: '은하로363번길 48, 09:30경',
  },
};

const resolutionDescriptionTemplates: Record<ResolutionCategory, string> = {
  '112': '112 상황실',
  '119': '119 지휘센터',
  약자: '약자 보호 센터',
  AI: 'AI 모니터링 허브',
  재난: '재난 대응 본부',
  도시운영: '도시 운영 센터',
};

const buildResolutionDescription = (category: ResolutionCategory, code: string): string => {
  const prefix = resolutionDescriptionTemplates[category];
  return `${prefix}에서 "${code}" 조치가 보고되었습니다.`;
};

/**
 * 📡 API 연동 필요: 이벤트 목록 조회
 * 현재: 더미 데이터 사용
 * 변경: API 호출로 대체 필요
 * 
 * @returns {BaseEvent[]} 전체 이벤트 목록
 */
export const allEvents: BaseEvent[] = MOCK_EVENTS;

/**
 * 📡 API 연동 필요: 이벤트 ID로 이벤트 조회
 * 현재: 클라이언트 사이드 검색
 * 변경: API 호출로 대체 필요
 * 
 * @param eventId - 이벤트 ID
 * @returns {BaseEvent | undefined} 조회된 이벤트 또는 undefined
 */
export const getEventById = (eventId: string): BaseEvent | undefined => {
  return allEvents.find((event) => event.eventId === eventId || event.id === eventId);
};

// 도메인 코드 설명
// 통일된 카테고리 라벨
export const domainLabels: Record<'A' | 'B' | 'C' | 'D' | 'E' | 'F', string> = {
  A: '112 치안 · 방범',
  B: '119 재난 · 구조',
  C: '사회적 약자 보호',
  D: 'AI 이상행동',
  E: '재난',
  F: '도시 운영 · 환경',
};

// 이벤트의 카테고리 가져오기
export const getEventCategory = (event: BaseEvent): string => {
  return domainLabels[event.domain];
};

// 좌표 생성 (과천 기준) - GeoJSON/MapLibre 형식 [lng, lat]
const generateCoordinates = (index: number): [number, number] => {
  const baseLat = 37.433686188524; // 과천 위도
  const baseLng = 126.978706819665; // 과천 경도
  const offset = index * 0.001;
  return [baseLng + offset, baseLat + offset];
};

// 대시보드용 Event 타입으로 변환
export const convertToDashboardEvent = (event: BaseEvent, index: number) => {
  const statusMap: Record<string, 'NEW' | 'MONITORING' | 'RESOLVED' | 'EVIDENCE'> = {
    '진행중': 'MONITORING',
    '종결': 'RESOLVED',
    '오탐': 'RESOLVED',
  };

  // 실제 사용하는 이벤트에 대한 하드코딩 데이터
  const eventData = eventSpecificData[event.id] || eventSpecificData[event.eventId];
  
  if (!eventData) {
    // 기본값 (실제로는 사용되지 않지만 타입 안정성을 위해)
    return {
      id: event.id,
      eventId: event.eventId,
      type: '112 치안' as EventType,
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
        category: '112' as ResolutionCategory,
        code: 'CCTV 확인 완료',
        description: buildResolutionDescription('112', 'CCTV 확인 완료'),
      },
    };
  }

  const resolutionDescription = buildResolutionDescription(
    eventData.resolution.category,
    eventData.resolution.code
  );

  const coordinates = eventData.coordinates ?? generateCoordinates(index);
  const listTitle = eventData.listTitle ?? event.title;
  const listLocation = eventData.listLocation ?? event.location;

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
 * 📡 API 연동 필요: AI 인사이트 생성
 * 현재: 실제 사용하는 이벤트만 하드코딩
 * 변경: AI API 호출로 대체 예정 (이벤트 정보를 AI에 전달하여 인사이트 생성)
 * 
 * 참고: AI 인사이트는 이벤트의 도메인, 유형, 위험도, 위치 등을 종합하여
 * 상황 분석 및 대응 권고사항을 제공합니다.
 * 
 * @param event - 이벤트 데이터
 * @returns {string} AI 인사이트 텍스트
 */
export const generateAIInsight = (event: BaseEvent): string => {
  const { type, title, description, risk, location, domain, source } = event;

  if (event.id === 'A-20260107-004' || event.eventId === 'A-20260107-004') {
    return `실종 사건 발생. ${description || title}. ${location}에서 실종 신고가 접수되었습니다. 위험도 ${risk}입니다. 마지막 목격 좌표 기준 반경 300m 내에서 배회 행동이 감지되었습니다. 즉시 수색대 출동이 필요합니다.`;
  }

  // 기본 인사이트 (실제로는 사용되지 않지만 타입 안정성을 위해)
  return `${title} 이벤트 발생. ${description || ''} ${location}에서 발생한 이벤트로 위험도 ${risk}입니다. 현재 상황을 분석 중이며, 필요시 즉시 대응이 필요합니다.`;
};

/**
 * ============================================================================
 * 📋 AI 인사이트 생성 참고 구조 (API 연동 시 참고용)
 * ============================================================================
 * 
 * AI 인사이트는 도메인별, 이벤트 유형별로 다른 템플릿을 사용합니다.
 * 
 * 도메인별 그룹:
 * - A (112 치안·방범): 폭행, 절도, 유괴, 실종, 위험행동 등
 * - B (119 재난·구조): 화재, 교통사고, 쓰러짐, 폭발 등
 * - C (사회적 약자 보호): 배회, 보호구역 이탈, 약자 긴급 호출 등
 * - D (AI 이상행동): 싸움, 침입, 배회, 방화 의심 등
 * - E (재난): 산불, 호우, 지진, 대피 요청 등
 * - F (도시 운영·환경): 센서 이상, 기반시설 장애, IoT 장비 장애 등
 * 
 * 인사이트 구성 요소:
 * - 사건 유형 및 발생 위치
 * - 위험도 정보
 * - CCTV 추적 정보 (해당 시)
 * - 대응 권고사항 (출동 필요, 모니터링 권장 등)
 * 
 * ============================================================================
 */

/**
 * AI 인사이트 생성 (구버전 - 참고용)
 * 
 * 아래는 이전에 사용하던 복잡한 템플릿 기반 로직입니다.
 * API 연동 시 참고용으로 주석 처리되어 있습니다.
 * 
 * 실제 구현 시에는 AI API에 이벤트 정보를 전달하여
 * 동적으로 인사이트를 생성하도록 변경됩니다.
 */
/*
export const generateAIInsight = (event: BaseEvent): string => {
  const { type, title, description, risk, location, domain, source } = event;

  // A - 112 치안 · 방범
  if (domain === 'A') {
    if (type.includes('폭행') || type.includes('상해')) {
      return `폭행 사건 발생. ${description || title}. ${location}에서 발생한 폭행 사건으로 위험도 ${risk}입니다. 피해자와 가해자 구분이 명확하며, 가해자는 현재 도주 중입니다. 즉시 경찰 출동이 필요하며, CCTV-7, CCTV-12, CCTV-15 집중 모니터링을 권장합니다.`;
    } else if (type.includes('절도') || type.includes('강도')) {
      return `절도 사건 발생. ${description || title}. ${location}에서 절도 의심 행위가 AI에 의해 감지되었습니다. 위험도 ${risk}입니다. 현장 CCTV 분석 결과, 용의자 동선 반복 및 급가속 구간이 확인되었습니다. 즉시 경찰 출동 및 현장 보전이 필요합니다.`;
    } else if (type.includes('차량도주') || type.includes('추적')) {
      return `차량도주 사건 발생. ${description || title}. ${location}에서 차량도주가 감지되었습니다. 위험도 ${risk}입니다. 도주 차량/인물과 추격자의 이동 경로가 CCTV로 추적 중입니다. 즉시 경찰 출동 및 도로 차단이 필요할 수 있습니다.`;
    } else if (type.includes('유괴') || type.includes('납치')) {
      return `유괴 의심 사건 발생. ${description || title}. ${location}에서 유괴 의심 신고가 접수되었습니다. 위험도 ${risk}입니다. 인접 CCTV에서 유괴범과 아동이 함께 이동하는 장면이 포착되었으며, 용의자가 차량에 아이를 태우는 장면도 확인되었습니다. 차량 도주 추적 중입니다. 즉시 경찰 출동 및 전방 차단이 필요합니다.`;
    } else if (type.includes('실종') || type.includes('미아')) {
      return `실종 사건 발생. ${description || title}. ${location}에서 실종 신고가 접수되었습니다. 위험도 ${risk}입니다. 마지막 목격 좌표 기준 반경 300m 내에서 배회 행동이 감지되었습니다. 즉시 수색대 출동이 필요합니다.`;
    } else if (type.includes('위험행동') || type.includes('흉기')) {
      return `위험행동 감지. ${description || title}. ${location}에서 흉기 소지 등 위험 행동이 감지되었습니다. 위험도 ${risk}입니다. AI에 의해 긴 물체 소지 및 위협 행동이 포착되었습니다. 즉시 경찰 출동이 필요합니다.`;
    } else if (type.includes('기물파손')) {
      return `기물파손 사건 발생. ${description || title}. ${location}에서 기물파손이 발생했습니다. 위험도 ${risk}입니다. 음주 난동 및 기물 파손이 다수 신고되었습니다. 즉시 경찰 출동 및 현장 진압이 필요합니다.`;
    } else if (type.includes('다툼') || type.includes('시비')) {
      return `다툼 사건 발생. ${description || title}. ${location}에서 다툼이 발생했습니다. 위험도 ${risk}입니다. 시비로 인한 다툼이 확인되었습니다. 즉시 경찰 출동 및 현장 확인이 필요합니다.`;
    } else if (type.includes('주취자') || type.includes('소란')) {
      return `주취자 소란 발생. ${description || title}. ${location}에서 주취자 소란이 발생했습니다. 위험도 ${risk}입니다. 음주 상태의 소란 행위가 확인되었습니다. 즉시 경찰 출동이 필요합니다.`;
    }
  }
  
  // B - 119 재난 · 구조
  if (domain === 'B') {
    if (type.includes('화재') || type.includes('연기')) {
      return `화재 발생. ${description || title}. ${location}에서 화재가 발생했습니다. 위험도 ${risk}입니다. 강풍 영향으로 확산 위험이 높으며, 접근 가능한 도로가 제한적입니다. 주민 대피가 진행 중이며, 즉시 소방대 출동이 필요합니다. CCTV-03, CCTV-07이 주요 관제 지점입니다.`;
    } else if (type.includes('교통사고')) {
      return `교통사고 발생. ${description || title}. ${location}에서 다중 추돌 사고가 발생했습니다. 위험도 ${risk}입니다. 부상자 ${risk === '긴급' ? '다수' : '2명'} 발생, 즉시 소방대 및 구급대 출동이 필요합니다. 도로 통제 및 응급처치가 진행 중입니다.`;
    } else if (type.includes('쓰러짐')) {
      return `쓰러짐 응급 상황. ${description || title}. ${location}에서 쓰러짐이 발생했습니다. 위험도 ${risk}입니다. 보행 중 갑자기 쓰러진 것으로 보이며, 즉시 구급대 출동이 필요합니다. 응급처치 및 병원 이송이 진행 중입니다.`;
    } else if (type.includes('폭발') || type.includes('가스')) {
      return `폭발/가스 누출 의심. ${description || title}. ${location}에서 가스 누출 의심 상황이 감지되었습니다. 위험도 ${risk}입니다. 즉시 소방대 출동 및 주변 대피가 필요합니다.`;
    } else if (type.includes('호흡곤란') || type.includes('의식저하')) {
      return `호흡곤란/의식저하 발생. ${description || title}. ${location}에서 호흡곤란 또는 의식저하가 발생했습니다. 위험도 ${risk}입니다. 즉시 구급대 출동이 필요합니다.`;
    } else if (type.includes('붕괴') || type.includes('침수')) {
      return `특수재난 발생. ${description || title}. ${location}에서 특수재난이 발생했습니다. 위험도 ${risk}입니다. 즉시 소방대 및 구조대 출동이 필요합니다.`;
    }
  }
  
  // C - 사회적 약자 보호
  if (domain === 'C') {
    if (type.includes('배회')) {
      return `배회 감지. ${description || title}. ${location}에서 ${source === 'AI' ? 'AI에 의해' : ''} 장기 배회 행동이 감지되었습니다. 위험도 ${risk}입니다. ${description?.includes('시간') ? description : '장시간 동일 구역 배회'}가 확인되었습니다. 즉시 현장 확인 및 보호 조치가 필요합니다.`;
    } else if (type.includes('이탈') || type.includes('보호구역')) {
      return `보호구역 이탈 발생. ${description || title}. ${location}에서 보호구역 이탈이 발생했습니다. 위험도 ${risk}입니다. 요양원/보호시설에서 이탈한 것으로 보이며, 현재 추적 중입니다. 즉시 수색대 출동 및 가족 연락이 필요합니다.`;
    } else if (type.includes('긴급 호출') || type.includes('단말기')) {
      return `약자 긴급 호출. ${description || title}. ${location}에서 약자 긴급 호출이 접수되었습니다. 위험도 ${risk}입니다. 단말기를 통한 긴급 호출로 즉시 구급대 출동이 필요합니다.`;
    } else if (type.includes('쓰러짐')) {
      return `약자 쓰러짐 발생. ${description || title}. ${location}에서 고령자/약자 쓰러짐이 발생했습니다. 위험도 ${risk}입니다. 즉시 구급대 출동 및 응급처치가 필요합니다.`;
    } else if (type.includes('위험구역') || type.includes('접근')) {
      return `위험구역 접근. ${description || title}. ${location}에서 위험구역 접근이 감지되었습니다. 위험도 ${risk}입니다. 도로/수변 등 위험구역에 접근한 것으로 보입니다. 즉시 보호 조치가 필요합니다.`;
    } else if (type.includes('보호자')) {
      return `보호자 연결 요청. ${description || title}. ${location}에서 보호자 연결 요청이 접수되었습니다. 위험도 ${risk}입니다. 즉시 보호자 연락 및 현장 확인이 필요합니다.`;
    }
  }
  
  // D - AI 이상행동/상황
  if (domain === 'D') {
    if (type.includes('쓰러짐')) {
      return `쓰러짐 감지. ${description || title}. ${location}에서 AI에 의해 쓰러짐 행동이 감지되었습니다. 위험도 ${risk}입니다. 보행 중 갑자기 쓰러진 것으로 보이며, 즉시 구급대 출동이 필요합니다. CCTV 분석 결과 응급 상황으로 판단됩니다.`;
    } else if (type.includes('싸움') || type.includes('격투')) {
      return `싸움/격투 감지. ${description || title}. ${location}에서 AI에 의해 싸움/격투 행위가 감지되었습니다. 위험도 ${risk}입니다. 주먹으로 공격하는 행위가 포착되었으며, 즉시 경찰 출동이 필요합니다. CCTV 연속 추적 모드 활성화를 권장합니다.`;
    } else if (type.includes('침입') || type.includes('월담')) {
      return `무단침입 감지. ${description || title}. ${location}에서 AI에 의해 무단침입/월담이 감지되었습니다. 위험도 ${risk}입니다. 야간 상가 창문 부수고 침입 시도가 확인되었습니다. 즉시 경찰 출동 및 현장 보전이 필요합니다.`;
    } else if (type.includes('배회')) {
      return `배회 감지. ${description || title}. ${location}에서 AI에 의해 배회 행동이 감지되었습니다. 위험도 ${risk}입니다. 장시간 동일 구역 배회가 확인되었습니다. 즉시 현장 확인이 필요합니다.`;
    } else if (type.includes('방화')) {
      return `방화 의심 감지. ${description || title}. ${location}에서 AI에 의해 방화 의심 행위가 감지되었습니다. 위험도 ${risk}입니다. 즉시 소방대 및 경찰 출동이 필요합니다.`;
    } else if (type.includes('군중') || type.includes('밀집')) {
      return `위험한 군중 밀집 감지. ${description || title}. ${location}에서 AI에 의해 위험한 군중 밀집이 감지되었습니다. 위험도 ${risk}입니다. 즉시 현장 확인 및 통제가 필요합니다.`;
    } else if (type.includes('도로') || type.includes('방치')) {
      return `도로 위험 객체 감지. ${description || title}. ${location}에서 AI에 의해 도로 위험 객체가 감지되었습니다. 위험도 ${risk}입니다. 방치된 물품으로 인한 위험이 확인되었습니다. 즉시 제거가 필요합니다.`;
    } else if (type.includes('역주행')) {
      return `역주행 감지. ${description || title}. ${location}에서 AI에 의해 역주행이 감지되었습니다. 위험도 ${risk}입니다. 즉시 교통 통제 및 안전 조치가 필요합니다.`;
    }
  }
  
  // E - 재난(NDMS)
  if (domain === 'E') {
    if (type.includes('산불')) {
      return `산불 경보. ${description || title}. ${location} 인근에서 산불 의심 상황이 감지되었습니다. 위험도 ${risk}입니다. 연기 발생 및 산불 가능성이 확인되었습니다. 즉시 소방대 및 산림청 출동이 필요하며, 주변 주민 대피가 필요할 수 있습니다.`;
    } else if (type.includes('호우') || type.includes('침수')) {
      return `호우(침수) 경보. ${description || title}. 하늘시 전역에 집중 호우 경보가 발령되었습니다. 위험도 ${risk}입니다. 시간당 50mm 이상 강우가 예상되며, 침수 및 도로 통제가 필요할 수 있습니다. 즉시 대비 조치가 필요합니다.`;

    } else if (type.includes('지진')) {
      return `지진 경보. ${description || title}. ${location}에서 지진이 감지되었습니다. 위험도 ${risk}입니다. 즉시 안전 확인 및 대피 조치가 필요합니다.`;
    } else if (type.includes('교통 마비')) {
      return `대규모 교통 마비. ${description || title}. ${location}에서 대규모 교통 마비가 발생했습니다. 위험도 ${risk}입니다. 즉시 교통 통제 및 우회 경로 안내가 필요합니다.`;
    } else if (type.includes('대피') || type.includes('대피소')) {
      return `대피 요청. ${description || title}. ${location}에서 대피 요청이 접수되었습니다. 위험도 ${risk}입니다. 즉시 대피소 안내 및 대피 조치가 필요합니다.`;
    } else if (type.includes('강풍') || type.includes('낙하물')) {
      return `강풍·낙하물 위험. ${description || title}. ${location}에서 강풍주의보가 발령되었습니다. 위험도 ${risk}입니다. 낙하물 위험이 높아지고 있습니다. 즉시 안전 조치가 필요합니다.`;
    }
  }
  
  // F - 도시 운영 · 환경
  if (domain === 'F') {
    if (type.includes('센서') || type.includes('미세먼지') || type.includes('온습도') || type.includes('풍속') || type.includes('소음') || type.includes('대기질')) {
      return `환경 센서 이상. ${description || title}. ${location}에서 환경 센서 이상이 감지되었습니다. 위험도 ${risk}입니다. 센서 데이터 이상으로 모니터링이 제한될 수 있습니다. 즉시 점검 및 복구가 필요합니다.`;
    } else if (type.includes('상·하수도') || type.includes('전력') || type.includes('가스')) {
      return `도시 기반시설 장애. ${description || title}. ${location}에서 도시 기반시설 장애가 발생했습니다. 위험도 ${risk}입니다. 즉시 점검 및 복구가 필요합니다.`;
    } else if (type.includes('가로등') || type.includes('조도')) {
      return `조명 인프라 이상. ${description || title}. ${location}에서 조명 인프라 이상이 발생했습니다. 위험도 ${risk}입니다. 가로등 또는 조도 센서 이상으로 야간 안전에 영향을 줄 수 있습니다. 즉시 점검 및 복구가 필요합니다.`;
    } else if (type.includes('IoT') || type.includes('오프라인') || type.includes('미전송') || type.includes('불량')) {
      return `IoT 장비 장애. ${description || title}. ${location}에서 IoT 장비 장애가 발생했습니다. 위험도 ${risk}입니다. IoT 장비 오프라인 또는 데이터 미전송으로 모니터링이 제한될 수 있습니다. 즉시 점검 및 복구가 필요합니다.`;
    } else if (type.includes('교량') || type.includes('터널') || type.includes('구조물')) {
      return `공공시설 안전. ${description || title}. ${location}에서 공공시설 안전 이슈가 감지되었습니다. 위험도 ${risk}입니다. 교량/터널/구조물 센서 이상이 확인되었습니다. 즉시 점검 및 안전 확인이 필요합니다.`;
    } else if (type.includes('신호기') || type.includes('교통량') || type.includes('정체')) {
      return `교통 운영 이벤트. ${description || title}. ${location}에서 교통 운영 이벤트가 발생했습니다. 위험도 ${risk}입니다. 교통 신호기 오류 또는 교통량 이상이 확인되었습니다. 즉시 점검 및 복구가 필요합니다.`;
    } else if (type.includes('에너지')) {
      return `에너지 사용 이상. ${description || title}. ${location}에서 에너지 사용 이상이 감지되었습니다. 위험도 ${risk}입니다. 즉시 점검 및 확인이 필요합니다.`;
    }
  }

  // 기본 인사이트
  return `${title} 이벤트 발생. ${description || ''} ${location}에서 발생한 이벤트로 위험도 ${risk}입니다. 현재 상황을 분석 중이며, 필요시 즉시 대응이 필요합니다.`;
};
*/

/**
 * 📡 API 연동 필요: 이벤트 완료 메시지 생성
 * 현재: 로컬 템플릿 기반 생성
 * 변경: 서버에서 완료 처리 후 메시지 반환
 */
export const generateEventCompletionMessage = (event: BaseEvent, dashboardEvent: ReturnType<typeof convertToDashboardEvent> | null): string => {
  const { type, title, location, domain } = event;
  const resolution = dashboardEvent?.resolution;
  const resolutionCode = resolution?.code || '상황 종료';
  const resolutionDescription = resolution?.description || '사건이 종결되었습니다.';

  // 사건 유형별 종료 메시지
  let message = `이 사건이 종료되었습니다.\n\n`;
  
  message += `**처리 결과**\n`;
  message += `${resolutionCode}\n`;
  message += `${resolutionDescription}\n\n`;

  // 사건 유형별 간단한 종료 메시지
  if (domain === 'A') {
    if (type.includes('유괴') || type.includes('납치')) {
      message += `용의자가 확보되었고, 아동은 안전하게 보호되었습니다.`;
    } else if (type.includes('폭행') || type.includes('상해')) {
      message += `용의자가 확보되었고, 피해자는 응급처치를 받았습니다.`;
    } else if (type.includes('절도') || type.includes('강도')) {
      message += `용의자가 확보되었고, 현장 보전이 완료되었습니다.`;
    } else {
      message += `사건이 성공적으로 해결되었습니다.`;
    }
  } else if (domain === 'B') {
    if (type.includes('화재')) {
      message += `화재가 진압되었고, 인명 피해는 없었습니다.`;
    } else if (type.includes('교통사고')) {
      message += `부상자는 병원으로 이송되었고, 도로 통제가 해제되었습니다.`;
    } else {
      message += `사건이 성공적으로 해결되었습니다.`;
    }
  } else if (domain === 'C') {
    if (type.includes('배회')) {
      message += `배회자가 확인되었고, 안전하게 보호되었습니다.`;
    } else if (type.includes('이탈') || type.includes('보호구역')) {
      message += `위치가 확인되었고, 보호자와 연락이 완료되었습니다.`;
    } else {
      message += `사건이 성공적으로 해결되었습니다.`;
    }
  } else {
    message += `사건이 성공적으로 해결되었습니다.`;
  }

  message += `\n\n더 이상 모니터링이 필요하지 않습니다.`;

  return message;
};


/**
 * AI 인사이트 주요 키워드 추출
 * 현재: 실제 사용하는 이벤트만 하드코딩
 * 변경: 하드코딩으로 대체 예정
 * 
 * @param event - 이벤트 데이터
 * @returns {string[]} 키워드 배열 (최대 3개)
 */
export const getAIInsightKeywords = (event: BaseEvent): string[] => {
  if (event.id === 'A-20260107-004' || event.eventId === 'A-20260107-004') {
    return ['아동실종', '수색필요', '긴급'];
  }

  // 기본 키워드 (실제로는 사용되지 않지만 타입 안정성을 위해)
  return ['이벤트', '분석중', '대응필요'];
};

/**
 * ============================================================================
 * 📋 AI 인사이트 키워드 추출 참고 구조 (하드코딩 대체 시 참고용)
 * ============================================================================
 * 
 * 키워드는 이벤트의 도메인, 유형, 위험도 등을 기반으로 추출됩니다.
 * 
 * 키워드 그룹 예시:
 * - 치안 관련: '흉기소지', '도주중', 'CCTV추적', '용의자확보' 등
 * - 실종 관련: '아동실종', '수색필요', '긴급', '보호필요' 등
 * - 재난 관련: '재난경보', '대피필요', '화재위험' 등
 * - 약자 관련: '약자보호', '장기배회', '보호필요' 등
 * 
 * 키워드는 최대 3개까지 추출되며, 이벤트의 핵심 특징을 나타냅니다.
 * 
 * ============================================================================
 */

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

