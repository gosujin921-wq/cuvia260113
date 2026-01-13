import type { ProcessingStage, ResolutionCategory, EventType } from '@/types';
import { MOCK_EVENTS } from './mock-data/events';

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
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'URGENT' | 'ACTIVE' | 'NEW' | 'IN_PROGRESS' | 'CLOSED';
  pScore?: number;
  domain: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; // 도메인 코드
}

const processingStages: ProcessingStage[] = [
  '생성',
  '선별',
  '착수',
  '사실 검증',
  '추적 · 지원',
  '전파',
  '종결',
];

const resolutionCategoryMap: Record<EventType, ResolutionCategory> = {
  '112-미아': '112',
  '112-치안': '112',
  '119-화재': '119',
  '119-구조': '119',
  약자: '약자',
  'AI-배회': 'AI',
  NDMS: '재난',
  소방서: '도시운영',
};

const resolutionCodeMap: Record<ResolutionCategory, string[]> = {
  '112': [
    '출동 후 현장지도 완료',
    '용의자 확보',
    '용의차량 추적 종료',
    '단순 오인/종결',
    '신고자 귀가/안전확보',
    'CCTV 확인 완료',
    '오탐(무해)',
  ],
  '119': [
    '화재 진화',
    '연기 소멸',
    '구조자 인계',
    '구급 이송',
    '출동 취소',
    '오인/오경보',
    '현장대응 완료',
  ],
  약자: [
    '보호자 인계',
    '긴급연락 성공',
    '배회 종결',
    '위치 이탈 복귀',
    '약자 신고 오작동',
    '현장 출동 후 인계',
    '병원 이송',
  ],
  AI: [
    '정탐(실제 사건)',
    '오탐(무해)',
    '미탐(추후 발견)',
    '재학습 반영',
    '영상 품질 문제로 판단 불가',
  ],
  재난: [
    '대피 완료',
    '재난경보 해제',
    '인명피해 없음',
    '인명피해 발생',
    '구조 종료',
    '위험도 감소',
    '상황 종료(지자체 승인)',
  ],
  도시운영: [
    '정상 복구 완료',
    '일시 장애 / 자동 복구',
    '현장 조치 필요',
    '원격 조치 완료',
    '지속 장애 / 미복구',
    '오경보 / 오인감지',
    '외부 기관 인계',
    '상황 종료',
  ],
};

const resolutionDescriptionTemplates: Record<ResolutionCategory, string> = {
  '112': '112 상황실',
  '119': '119 지휘센터',
  약자: '약자 보호 센터',
  AI: 'AI 모니터링 허브',
  재난: '재난 대응 본부',
  도시운영: '도시 운영 센터',
};

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};

const pickDeterministicValue = <T,>(values: T[], seed: string, salt: string): T => {
  if (!values.length) {
    throw new Error('values must not be empty');
  }
  const index = Math.abs(hashString(`${seed}-${salt}`)) % values.length;
  return values[index];
};

const buildResolutionDescription = (category: ResolutionCategory, code: string): string => {
  const prefix = resolutionDescriptionTemplates[category];
  return `${prefix}에서 "${code}" 조치가 보고되었습니다.`;
};

export const allEvents: BaseEvent[] = MOCK_EVENTS;

// 도메인별 이벤트 필터링
export const getEventsByDomain = (domain: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'ALL'): BaseEvent[] => {
  if (domain === 'ALL') return allEvents;
  return allEvents.filter((event) => event.domain === domain);
};

// 이벤트 ID로 이벤트 찾기
export const getEventById = (eventId: string): BaseEvent | undefined => {
  return allEvents.find((event) => event.eventId === eventId || event.id === eventId);
};

// 상태별 이벤트 필터링
export const getEventsByStatus = (status: BaseEvent['status']): BaseEvent[] => {
  return allEvents.filter((event) => event.status === status);
};

// 위험도별 이벤트 필터링
export const getEventsByRisk = (risk: BaseEvent['risk']): BaseEvent[] => {
  return allEvents.filter((event) => event.risk === risk);
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

// 좌표 생성 (안양시 기준)
const generateCoordinates = (index: number): [number, number] => {
  const baseLat = 37.3925;
  const baseLng = 126.9529;
  const offset = index * 0.001;
  return [baseLat + offset, baseLng + offset];
};

// 대시보드용 Event 타입으로 변환
export const convertToDashboardEvent = (event: BaseEvent, index: number) => {
  const typeMap: Record<string, string> = {
    // A - 112 치안 · 방범
    '폭행': '112-치안',
    '상해': '112-치안',
    '절도': '112-치안',
    '강도': '112-치안',
    '주취자 소란': '112-치안',
    '실종': '112-미아',
    '미아': '112-미아',
    '유괴': '112-미아',
    '납치': '112-미아',
    '위험행동': '112-치안',
    '배회(치안 관점)': '112-치안',
    '차량도주': '112-치안',
    '용의차량 추적': '112-치안',
    '기물파손': '112-치안',
    '다툼': '112-치안',
    '시비': '112-치안',
    // B - 119 재난 · 구조
    '화재': '119-화재',
    '연기 감지': '119-화재',
    '폭발': '119-화재',
    '가스 누출': '119-화재',
    '교통사고': '119-구조',
    '쓰러짐(응급)': '119-구조',
    '호흡곤란': '119-구조',
    '의식저하': '119-구조',
    '붕괴': 'NDMS',
    '침수': 'NDMS',
    // C - 사회적 약자 보호
    '약자 긴급 호출': '약자',
    '배회(장기)': 'AI-배회',
    '보호구역 이탈': '112-미아',
    '위험구역 접근': '약자',
    '쓰러짐(고령자/약자)': '약자',
    '보호자 연결 요청': '약자',
    // D - AI 이상행동/상황
    '싸움': '112-치안',
    '격투': '112-치안',
    '방화 의심': '119-화재',
    '무단침입': '112-치안',
    '월담': '112-치안',
    '위험한 군중 밀집': '112-치안',
    '도로 위험 객체': '소방서',
    '역주행': '소방서',
    // E - 재난(NDMS)
    '산불': 'NDMS',
    '호우': 'NDMS',
    '지진': 'NDMS',
    '대규모 교통 마비': 'NDMS',
    '대피 요청': 'NDMS',
    '대피소': 'NDMS',
    '강풍': 'NDMS',
    '낙하물 위험': 'NDMS',
    // F - 도시 운영 · 환경
    '환경 센서 이상': '소방서',
    '도시 기반시설 장애': '소방서',
    '조명 인프라 이상': '소방서',
    'IoT 장비 장애': '소방서',
    '공공시설 안전': '소방서',
    '교통 운영 이벤트': '소방서',
    '에너지 사용 이상': '소방서',
  };
  
  // 유형 매칭 (includes 방식)
  let matchedType = '112-치안';
  for (const [key, value] of Object.entries(typeMap)) {
    if (event.type.includes(key)) {
      matchedType = value;
      break;
    }
  }

  const priorityMap: Record<string, '긴급' | '경계' | '주의'> = {
    HIGH: '긴급',
    MEDIUM: '경계',
    LOW: '주의',
  };

  const statusMap: Record<string, 'NEW' | 'MONITORING' | 'RESOLVED' | 'EVIDENCE'> = {
    URGENT: 'MONITORING',
    ACTIVE: 'MONITORING',
    NEW: 'NEW',
    IN_PROGRESS: 'MONITORING',
    CLOSED: 'RESOLVED',
  };

  const normalizedType = matchedType as EventType;
  let processingStage = pickDeterministicValue<ProcessingStage>(processingStages, event.id, 'stage');
  if (event.eventId === 'A-20241124-003') {
    processingStage = '착수';
  }
  const resolutionCategory = resolutionCategoryMap[normalizedType] || '112';
  const resolutionOptions = resolutionCodeMap[resolutionCategory];
  const resolutionCode = pickDeterministicValue(resolutionOptions, event.id, 'resolution');
  const resolutionDescription = buildResolutionDescription(resolutionCategory, resolutionCode);

  // 특정 이벤트 우선순위 강제 설정
  let finalPriority: '긴급' | '경계' | '주의' = priorityMap[event.risk];
  
  // "유괴 의심 신고, 아동 납치 추정" 이벤트는 항상 긴급
  if (event.title.includes('유괴 의심') && event.title.includes('아동 납치')) {
    finalPriority = '긴급';
  }
  // 우선순위별 개수 조정: 긴급 < 경계 < 주의 순서로
  // 일부 이벤트의 우선순위를 재조정하여 개수 균형 맞추기
  const eventPriorityOverrides: Record<string, '긴급' | '경계' | '주의'> = {
    // 긴급 (5개) - 가장 적게
    'event-1': '긴급', // 흉기 소지 남성 위협 행동
    'event-3': '긴급', // 유괴 의심 신고, 아동 납치 추정
    'event-5': '긴급', // 8세 남아 실종
    'event-6': '긴급', // 흉기 소지 위험 행동
    'event-7': '긴급', // 주택 2층 연기 발생
    
    // 경계 (9개) - 중간
    'event-2': '경계', // 상가 절도 의심
    'event-8': '경계', // 산림 인접 연기 발생
    'event-10': '경계', // 보행 중 갑자기 쓰러짐
    'event-12': '경계', // 치매 노인 보호구역 이탈
    'event-14': '경계', // 80대 여성 쓰러짐
    'event-15': '경계', // 보행 중 갑자기 쓰러짐
    'event-16': '경계', // 주먹 공격 행위 포착
    'event-19': '경계', // 연기 발생, 산불 가능성
    'event-21': '경계', // 강풍주의보, 낙하물 위험
    
    // 주의 (11개) - 가장 많음
    'event-4': '주의', // 음주 난동 및 기물 파손
    'event-9': '주의', // 차량 3대 추돌
    'event-11': '주의', // 80대 남성 배회
    'event-13': '주의', // 노인 낙상
    'event-17': '주의', // 야간 상가 창문 부수고 침입 시도
    'event-18': '주의', // 3시간 이상 동일 구역 배회
    'event-20': '주의', // 시간당 50mm 이상 강우 예상
    'event-22': '주의', // CCTV 센서 신호 이상
    'event-23': '주의', // 가로등 5개 전원 차단
    'event-24': '주의', // 교통 신호등 제어 시스템 오류
    'event-25': '주의', // 미세먼지 센서 데이터 미전송
    // 일반 (8개) - 낮은 우선순위
    'event-26': '주의', // 야간 소음 민원
    'event-27': '주의', // 주차장 불법주차 신고
    'event-28': '주의', // 경미한 접촉 사고
    'event-29': '주의', // 단기 배회 행동 감지
    'event-30': '주의', // 정상 범위 내 이상 행동
    'event-31': '주의', // 보통 강수량 예상
    'event-32': '주의', // 온도 센서 일시적 오류
    'event-33': '주의', // IoT 센서 데이터 지연
  };
  
  if (eventPriorityOverrides[event.id]) {
    finalPriority = eventPriorityOverrides[event.id];
  }

  return {
    id: event.id,
    eventId: event.eventId,
    type: normalizedType,
    title: event.title,
    priority: finalPriority,
    status: statusMap[event.status] || 'NEW',
    timestamp: event.time,
    location: {
      name: event.location,
      coordinates: generateCoordinates(index),
    },
    confidence: event.pScore,
    description: event.description || event.title,
    processingStage,
    resolution: {
      category: resolutionCategory,
      code: resolutionCode,
      description: resolutionDescription,
    },
  };
};

// 각 이벤트 타입별 AI Agent 답변 생성
export const generateAIInsight = (event: BaseEvent): string => {
  const { type, title, description, risk, pScore, location, domain, source } = event;
  const riskScore = pScore || 0;

  // 타입별 상세 인사이트 (includes 방식으로 유연하게 처리)
  // A - 112 치안 · 방범
  if (domain === 'A') {
    if (type.includes('폭행') || type.includes('상해')) {
      return `폭행 사건 발생. ${description || title}. ${location}에서 발생한 폭행 사건으로 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 피해자와 가해자 구분이 명확하며, 가해자는 현재 도주 중입니다. 즉시 경찰 출동이 필요하며, CCTV-7, CCTV-12, CCTV-15 집중 모니터링을 권장합니다.`;
    } else if (type.includes('절도') || type.includes('강도')) {
      return `절도 사건 발생. ${description || title}. ${location}에서 절도 의심 행위가 AI에 의해 감지되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 현장 CCTV 분석 결과, 용의자 동선 반복 및 급가속 구간이 확인되었습니다. 즉시 경찰 출동 및 현장 보전이 필요합니다.`;
    } else if (type.includes('차량도주') || type.includes('추적')) {
      return `차량도주 사건 발생. ${description || title}. ${location}에서 차량도주가 감지되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 도주 차량/인물과 추격자의 이동 경로가 CCTV로 추적 중입니다. 즉시 경찰 출동 및 도로 차단이 필요할 수 있습니다.`;
    } else if (type.includes('유괴') || type.includes('납치')) {
      return `유괴 의심 사건 발생. ${description || title}. ${location}에서 유괴 의심 신고가 접수되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 인접 CCTV에서 유괴범과 아동이 함께 이동하는 장면이 포착되었으며, 용의자가 차량에 아이를 태우는 장면도 확인되었습니다. 차량 도주 추적 중입니다. 즉시 경찰 출동 및 전방 차단이 필요합니다.`;
    } else if (type.includes('실종') || type.includes('미아')) {
      return `실종 사건 발생. ${description || title}. ${location}에서 실종 신고가 접수되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 마지막 목격 좌표 기준 반경 300m 내에서 배회 행동이 감지되었습니다. 즉시 수색대 출동이 필요합니다.`;
    } else if (type.includes('위험행동') || type.includes('흉기')) {
      return `위험행동 감지. ${description || title}. ${location}에서 흉기 소지 등 위험 행동이 감지되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. AI에 의해 긴 물체 소지 및 위협 행동이 포착되었습니다. 즉시 경찰 출동이 필요합니다.`;
    } else if (type.includes('기물파손')) {
      return `기물파손 사건 발생. ${description || title}. ${location}에서 기물파손이 발생했습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 음주 난동 및 기물 파손이 다수 신고되었습니다. 즉시 경찰 출동 및 현장 진압이 필요합니다.`;
    } else if (type.includes('다툼') || type.includes('시비')) {
      return `다툼 사건 발생. ${description || title}. ${location}에서 다툼이 발생했습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 시비로 인한 다툼이 확인되었습니다. 즉시 경찰 출동 및 현장 확인이 필요합니다.`;
    } else if (type.includes('주취자') || type.includes('소란')) {
      return `주취자 소란 발생. ${description || title}. ${location}에서 주취자 소란이 발생했습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 음주 상태의 소란 행위가 확인되었습니다. 즉시 경찰 출동이 필요합니다.`;
    }
  }
  
  // B - 119 재난 · 구조
  if (domain === 'B') {
    if (type.includes('화재') || type.includes('연기')) {
      return `화재 발생. ${description || title}. ${location}에서 화재가 발생했습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 강풍 영향으로 확산 위험이 높으며, 접근 가능한 도로가 제한적입니다. 주민 대피가 진행 중이며, 즉시 소방대 출동이 필요합니다. CCTV-03, CCTV-07이 주요 관제 지점입니다.`;
    } else if (type.includes('교통사고')) {
      return `교통사고 발생. ${description || title}. ${location}에서 다중 추돌 사고가 발생했습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 부상자 ${risk === 'HIGH' ? '다수' : '2명'} 발생, 즉시 소방대 및 구급대 출동이 필요합니다. 도로 통제 및 응급처치가 진행 중입니다.`;
    } else if (type.includes('쓰러짐')) {
      return `쓰러짐 응급 상황. ${description || title}. ${location}에서 쓰러짐이 발생했습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 보행 중 갑자기 쓰러진 것으로 보이며, 즉시 구급대 출동이 필요합니다. 응급처치 및 병원 이송이 진행 중입니다.`;
    } else if (type.includes('폭발') || type.includes('가스')) {
      return `폭발/가스 누출 의심. ${description || title}. ${location}에서 가스 누출 의심 상황이 감지되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 즉시 소방대 출동 및 주변 대피가 필요합니다.`;
    } else if (type.includes('호흡곤란') || type.includes('의식저하')) {
      return `호흡곤란/의식저하 발생. ${description || title}. ${location}에서 호흡곤란 또는 의식저하가 발생했습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 즉시 구급대 출동이 필요합니다.`;
    } else if (type.includes('붕괴') || type.includes('침수')) {
      return `특수재난 발생. ${description || title}. ${location}에서 특수재난이 발생했습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 즉시 소방대 및 구조대 출동이 필요합니다.`;
    }
  }
  
  // C - 사회적 약자 보호
  if (domain === 'C') {
    if (type.includes('배회')) {
      return `배회 감지. ${description || title}. ${location}에서 ${source === 'AI' ? 'AI에 의해' : ''} 장기 배회 행동이 감지되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. ${description?.includes('시간') ? description : '장시간 동일 구역 배회'}가 확인되었습니다. 즉시 현장 확인 및 보호 조치가 필요합니다.`;
    } else if (type.includes('이탈') || type.includes('보호구역')) {
      return `보호구역 이탈 발생. ${description || title}. ${location}에서 보호구역 이탈이 발생했습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 요양원/보호시설에서 이탈한 것으로 보이며, 현재 추적 중입니다. 즉시 수색대 출동 및 가족 연락이 필요합니다.`;
    } else if (type.includes('긴급 호출') || type.includes('단말기')) {
      return `약자 긴급 호출. ${description || title}. ${location}에서 약자 긴급 호출이 접수되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 단말기를 통한 긴급 호출로 즉시 구급대 출동이 필요합니다.`;
    } else if (type.includes('쓰러짐')) {
      return `약자 쓰러짐 발생. ${description || title}. ${location}에서 고령자/약자 쓰러짐이 발생했습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 즉시 구급대 출동 및 응급처치가 필요합니다.`;
    } else if (type.includes('위험구역') || type.includes('접근')) {
      return `위험구역 접근. ${description || title}. ${location}에서 위험구역 접근이 감지되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 도로/수변 등 위험구역에 접근한 것으로 보입니다. 즉시 보호 조치가 필요합니다.`;
    } else if (type.includes('보호자')) {
      return `보호자 연결 요청. ${description || title}. ${location}에서 보호자 연결 요청이 접수되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 즉시 보호자 연락 및 현장 확인이 필요합니다.`;
    }
  }
  
  // D - AI 이상행동/상황
  if (domain === 'D') {
    if (type.includes('쓰러짐')) {
      return `쓰러짐 감지. ${description || title}. ${location}에서 AI에 의해 쓰러짐 행동이 감지되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 보행 중 갑자기 쓰러진 것으로 보이며, 즉시 구급대 출동이 필요합니다. CCTV 분석 결과 응급 상황으로 판단됩니다.`;
    } else if (type.includes('싸움') || type.includes('격투')) {
      return `싸움/격투 감지. ${description || title}. ${location}에서 AI에 의해 싸움/격투 행위가 감지되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 주먹으로 공격하는 행위가 포착되었으며, 즉시 경찰 출동이 필요합니다. CCTV 연속 추적 모드 활성화를 권장합니다.`;
    } else if (type.includes('침입') || type.includes('월담')) {
      return `무단침입 감지. ${description || title}. ${location}에서 AI에 의해 무단침입/월담이 감지되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 야간 상가 창문 부수고 침입 시도가 확인되었습니다. 즉시 경찰 출동 및 현장 보전이 필요합니다.`;
    } else if (type.includes('배회')) {
      return `배회 감지. ${description || title}. ${location}에서 AI에 의해 배회 행동이 감지되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 장시간 동일 구역 배회가 확인되었습니다. 즉시 현장 확인이 필요합니다.`;
    } else if (type.includes('방화')) {
      return `방화 의심 감지. ${description || title}. ${location}에서 AI에 의해 방화 의심 행위가 감지되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 즉시 소방대 및 경찰 출동이 필요합니다.`;
    } else if (type.includes('군중') || type.includes('밀집')) {
      return `위험한 군중 밀집 감지. ${description || title}. ${location}에서 AI에 의해 위험한 군중 밀집이 감지되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 즉시 현장 확인 및 통제가 필요합니다.`;
    } else if (type.includes('도로') || type.includes('방치')) {
      return `도로 위험 객체 감지. ${description || title}. ${location}에서 AI에 의해 도로 위험 객체가 감지되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 방치된 물품으로 인한 위험이 확인되었습니다. 즉시 제거가 필요합니다.`;
    } else if (type.includes('역주행')) {
      return `역주행 감지. ${description || title}. ${location}에서 AI에 의해 역주행이 감지되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 즉시 교통 통제 및 안전 조치가 필요합니다.`;
    }
  }
  
  // E - 재난(NDMS)
  if (domain === 'E') {
    if (type.includes('산불')) {
      return `산불 경보. ${description || title}. ${location} 인근에서 산불 의심 상황이 감지되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 연기 발생 및 산불 가능성이 확인되었습니다. 즉시 소방대 및 산림청 출동이 필요하며, 주변 주민 대피가 필요할 수 있습니다.`;
    } else if (type.includes('호우') || type.includes('침수')) {
      return `호우(침수) 경보. ${description || title}. 안양시 전역에 집중 호우 경보가 발령되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 시간당 50mm 이상 강우가 예상되며, 침수 및 도로 통제가 필요할 수 있습니다. 즉시 대비 조치가 필요합니다.`;
    } else if (type.includes('지진')) {
      return `지진 경보. ${description || title}. ${location}에서 지진이 감지되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 즉시 안전 확인 및 대피 조치가 필요합니다.`;
    } else if (type.includes('교통 마비')) {
      return `대규모 교통 마비. ${description || title}. ${location}에서 대규모 교통 마비가 발생했습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 즉시 교통 통제 및 우회 경로 안내가 필요합니다.`;
    } else if (type.includes('대피') || type.includes('대피소')) {
      return `대피 요청. ${description || title}. ${location}에서 대피 요청이 접수되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 즉시 대피소 안내 및 대피 조치가 필요합니다.`;
    } else if (type.includes('강풍') || type.includes('낙하물')) {
      return `강풍·낙하물 위험. ${description || title}. ${location}에서 강풍주의보가 발령되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 낙하물 위험이 높아지고 있습니다. 즉시 안전 조치가 필요합니다.`;
    }
  }
  
  // F - 도시 운영 · 환경
  if (domain === 'F') {
    if (type.includes('센서') || type.includes('미세먼지') || type.includes('온습도') || type.includes('풍속') || type.includes('소음') || type.includes('대기질')) {
      return `환경 센서 이상. ${description || title}. ${location}에서 환경 센서 이상이 감지되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 센서 데이터 이상으로 모니터링이 제한될 수 있습니다. 즉시 점검 및 복구가 필요합니다.`;
    } else if (type.includes('상·하수도') || type.includes('전력') || type.includes('가스')) {
      return `도시 기반시설 장애. ${description || title}. ${location}에서 도시 기반시설 장애가 발생했습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 즉시 점검 및 복구가 필요합니다.`;
    } else if (type.includes('가로등') || type.includes('조도')) {
      return `조명 인프라 이상. ${description || title}. ${location}에서 조명 인프라 이상이 발생했습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 가로등 또는 조도 센서 이상으로 야간 안전에 영향을 줄 수 있습니다. 즉시 점검 및 복구가 필요합니다.`;
    } else if (type.includes('IoT') || type.includes('오프라인') || type.includes('미전송') || type.includes('불량')) {
      return `IoT 장비 장애. ${description || title}. ${location}에서 IoT 장비 장애가 발생했습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. IoT 장비 오프라인 또는 데이터 미전송으로 모니터링이 제한될 수 있습니다. 즉시 점검 및 복구가 필요합니다.`;
    } else if (type.includes('교량') || type.includes('터널') || type.includes('구조물')) {
      return `공공시설 안전. ${description || title}. ${location}에서 공공시설 안전 이슈가 감지되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 교량/터널/구조물 센서 이상이 확인되었습니다. 즉시 점검 및 안전 확인이 필요합니다.`;
    } else if (type.includes('신호기') || type.includes('교통량') || type.includes('정체')) {
      return `교통 운영 이벤트. ${description || title}. ${location}에서 교통 운영 이벤트가 발생했습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 교통 신호기 오류 또는 교통량 이상이 확인되었습니다. 즉시 점검 및 복구가 필요합니다.`;
    } else if (type.includes('에너지')) {
      return `에너지 사용 이상. ${description || title}. ${location}에서 에너지 사용 이상이 감지되었습니다. 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 즉시 점검 및 확인이 필요합니다.`;
    }
  }

  // 기본 인사이트
  return `${title} 이벤트 발생. ${description || ''} ${location}에서 발생한 이벤트로 위험도 ${risk} (위험도 수치: ${riskScore}%)입니다. 현재 상황을 분석 중이며, 필요시 즉시 대응이 필요합니다.`;
};

// 사건 완료 시 알림 메시지 생성
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

// 간단한 AI 인사이트 (EventDetail용)
export const generateSimpleAIInsight = (event: BaseEvent): string => {
  const insight = generateAIInsight(event);
  // 첫 문장만 추출하거나 요약
  const sentences = insight.split('. ');
  if (sentences.length > 1) {
    return sentences.slice(0, 2).join('. ') + '.';
  }
  return insight;
};

// AI 인사이트 주요 키워드 추출
export const getAIInsightKeywords = (event: BaseEvent): string[] => {
  const keywords: string[] = [];
  const { type, domain, description, risk } = event;

  // 도메인별 키워드
  if (domain === 'A') {
    if (type.includes('폭행') || type.includes('상해')) {
      keywords.push('흉기소지', '도주중', 'CCTV추적');
    } else if (type.includes('절도') || type.includes('강도')) {
      keywords.push('AI감지', '현금절도', '동선반복');
    } else if (type.includes('유괴') || type.includes('납치')) {
      keywords.push('유괴의심', '아동납치', '차량도주추적');
    } else if (type.includes('차량도주') || type.includes('추적')) {
      keywords.push('도주차량', '추적중', '은행강도연관');
    } else if (type.includes('실종') || type.includes('미아')) {
      keywords.push('아동실종', '수색필요', '긴급');
    } else if (type.includes('위험행동')) {
      keywords.push('흉기소지', '위협행동', 'AI감지');
    } else if (type.includes('기물파손')) {
      keywords.push('난동', '기물파손', '음주');
    } else if (type.includes('다툼') || type.includes('시비')) {
      keywords.push('싸움', '시비', '현장확인');
    }
  } else if (domain === 'B') {
    if (type.includes('화재') || type.includes('연기')) {
      keywords.push('강풍영향', '산림인접', '야간');
    } else if (type.includes('교통사고')) {
      keywords.push('다중추돌', '부상자', '도로통제');
    } else if (type.includes('쓰러짐')) {
      keywords.push('응급상황', '구급대출동', '의식확인');
    } else if (type.includes('폭발') || type.includes('가스')) {
      keywords.push('가스누출', '폭발위험', '대피필요');
    } else if (type.includes('호흡곤란') || type.includes('의식저하')) {
      keywords.push('응급상황', '호흡곤란', '의식저하');
    } else if (type.includes('붕괴') || type.includes('침수')) {
      keywords.push('특수재난', '붕괴위험', '구조필요');
    }
  } else if (domain === 'C') {
    if (type.includes('배회')) {
      keywords.push('약자보호', '장기배회', '보호필요');
    } else if (type.includes('이탈') || type.includes('보호구역')) {
      keywords.push('보호구역이탈', '추적중', '수색필요');
    } else if (type.includes('쓰러짐')) {
      keywords.push('고령자', '응급처치', '구급대출동');
    } else if (type.includes('긴급 호출') || type.includes('단말기')) {
      keywords.push('약자긴급호출', '단말기', '즉시대응');
    } else if (type.includes('위험구역') || type.includes('접근')) {
      keywords.push('위험구역접근', '도로/수변', '보호필요');
    } else if (type.includes('보호자')) {
      keywords.push('보호자연결', '가족연락', '현장확인');
    }
  } else if (domain === 'D') {
    keywords.push('AI감지', '이상행동', '실시간추적');
    if (type.includes('싸움') || type.includes('격투')) {
      keywords.push('폭력행위', 'CCTV포착');
    } else if (type.includes('침입') || type.includes('월담')) {
      keywords.push('무단침입', '월담');
    } else if (type.includes('배회')) {
      keywords.push('장기배회', '이상행동');
    } else if (type.includes('방화')) {
      keywords.push('방화의심', '화재위험');
    } else if (type.includes('군중') || type.includes('밀집')) {
      keywords.push('군중밀집', '위험상황');
    } else if (type.includes('도로') || type.includes('방치')) {
      keywords.push('도로위험객체', '방치물품');
    } else if (type.includes('역주행')) {
      keywords.push('역주행', '교통위험');
    }
  } else if (domain === 'E') {
    keywords.push('재난경보', '기상영향', '대피필요');
    if (type.includes('산불')) {
      keywords.push('산불의심', '연기발생');
    } else if (type.includes('호우') || type.includes('침수')) {
      keywords.push('집중호우', '침수위험');
    } else if (type.includes('지진')) {
      keywords.push('지진감지', '안전확인');
    } else if (type.includes('교통 마비')) {
      keywords.push('교통마비', '우회경로');
    } else if (type.includes('대피') || type.includes('대피소')) {
      keywords.push('대피요청', '대피소안내');
    } else if (type.includes('강풍') || type.includes('낙하물')) {
      keywords.push('강풍주의보', '낙하물위험');
    }
  } else if (domain === 'F') {
    keywords.push('IoT장애', '시설점검', '복구필요');
    if (type.includes('센서') || type.includes('미세먼지') || type.includes('온습도') || type.includes('풍속') || type.includes('소음') || type.includes('대기질')) {
      keywords.push('환경센서이상', '데이터미전송');
    } else if (type.includes('상·하수도') || type.includes('전력') || type.includes('가스')) {
      keywords.push('기반시설장애', '복구필요');
    } else if (type.includes('가로등') || type.includes('조도')) {
      keywords.push('조명장애', '전원차단');
    } else if (type.includes('IoT') || type.includes('오프라인') || type.includes('미전송') || type.includes('불량')) {
      keywords.push('IoT장비장애', '오프라인');
    } else if (type.includes('교량') || type.includes('터널') || type.includes('구조물')) {
      keywords.push('공공시설안전', '센서이상');
    } else if (type.includes('신호기') || type.includes('교통량') || type.includes('정체')) {
      keywords.push('교통신호', '시스템오류');
    } else if (type.includes('에너지')) {
      keywords.push('에너지이상', '사용량확인');
    }
  }

  return keywords.slice(0, 3); // 최대 3개 키워드
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

