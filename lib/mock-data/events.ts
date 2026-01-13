// 가상 이벤트 데이터 전용 설정
const today = '20241124'; // 2024년 11월 24일
let sequence = 1;

const generateEventId = (domain: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'): string => {
  return `${domain}-${today}-${String(sequence++).padStart(3, '0')}`;
};

// events-data에서 사용하는 BaseEvent 구조를 이 파일에서도 그대로 정의
interface BaseEvent {
  eventId: string;
  id: string;
  type: string;
  title: string;
  time: string;
  location: string;
  description?: string;
  source?: string;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'URGENT' | 'ACTIVE' | 'NEW' | 'IN_PROGRESS' | 'CLOSED';
  pScore?: number;
  domain: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
}

// 기존 allEvents 배열을 그대로 옮긴 가상 이벤트 데이터
export const MOCK_EVENTS: BaseEvent[] = [
  // A - 112 치안 · 방범
  {
    eventId: generateEventId('A'),
    id: 'event-1',
    type: '폭행 · 상해',
    title: '흉기 소지 남성 위협 행동',
    time: '18:42',
    location: '안양시 동안구 비산동 123-7',
    description: '112 신고자 "흉기 든 남성이 위협 중"',
    source: '안양112센터',
    risk: 'HIGH',
    status: 'URGENT',
    pScore: 92,
    domain: 'A',
  },
  {
    eventId: generateEventId('A'),
    id: 'event-2',
    type: '절도 · 강도',
    title: '상가 절도 의심, 현금 절취 포착',
    time: '18:33',
    location: '안양시 만안구 안양동 674',
    description: 'AI 감지: 가방에서 현금 다발을 넣는 장면 포착',
    source: 'AI',
    risk: 'MEDIUM',
    status: 'ACTIVE',
    pScore: 78,
    domain: 'A',
  },
  {
    eventId: 'A-20251210-003',
    id: 'event-3',
    type: '유괴 의심 · 아동 실종',
    title: '유괴 의심 신고, 아동 납치 추정',
    time: '15:20',
    location: '안양시 동안구 관양동 관양초등학교 앞 놀이터',
    description: '112 신고: 검은 후드티 남성이 파란 가방 멘 아이를 억지로 끌고 갔다',
    source: '안양112센터',
    risk: 'HIGH',
    status: 'URGENT',
    pScore: 95,
    domain: 'A',
  },
];


