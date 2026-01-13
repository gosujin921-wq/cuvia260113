export type EventPriority = '긴급' | '경계' | '주의';
export type EventStatus = 'NEW' | 'MONITORING' | 'RESOLVED' | 'EVIDENCE';
export type EventType =
  | '119-화재'
  | '119-구조'
  | '112-미아'
  | '112-치안'
  | '약자'
  | 'AI-배회'
  | 'NDMS'
  | '소방서';

export type ProcessingStage =
  | '생성'
  | '선별'
  | '착수'
  | '사실 검증'
  | '추적 · 지원'
  | '전파'
  | '종결';

export type ResolutionCategory = '112' | '119' | '약자' | 'AI' | '재난' | '도시운영';

export interface EventResolution {
  category: ResolutionCategory;
  code: string;
  description: string;
}

export interface Event {
  id: string;
  eventId?: string; // 이벤트 ID: [도메인]-[연도월일]-[시퀀스]
  type: EventType;
  title: string;
  priority: EventPriority;
  status: EventStatus;
  timestamp: string;
  location: {
    name: string;
    coordinates: [number, number];
  };
  confidence?: number;
  description?: string;
  relatedEvents?: string[];
  isMain?: boolean;
  evidenceEvents?: string[];
  nearbyResources?: {
    fireStations?: Array<{
      id: string;
      name: string;
      distance: number;
      coordinates: [number, number];
    }>;
  };
  processingStage: ProcessingStage;
  resolution: EventResolution;
}

export interface AgentMessage {
  id: string;
  timestamp: string;
  content: string;
  type: 'info' | 'warning' | 'suggestion' | 'analysis';
}

export interface EventSummary {
  total: number;
  inProgress: number;
  closed: number;
}

export interface BroadcastDraft {
  id: string;
  eventId: string;
  type: 'fire' | 'missing' | 'elderly';
  content: string;
  recipients: string[];
  status: 'draft' | 'sent';
}
