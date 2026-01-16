export interface EventData {
  id: string;
  type: string;
  title: string;
  time: string;
  location: string;
  description: string;
  source: string;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  status: '진행중' | '종결' | '오탐';
  domain: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  broadcastHistory?: {
    count: number;
    lastBroadcastTime?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  buttons?: string[];
  isCCTVRecommendation?: boolean;
}

export interface SavedClip {
  id: string;
  cctvId: string;
  cctvName: string;
  timestamp: string;
  duration: string;
  frameTimestamp: string;
  thumbnail: string;
  status: 'saved' | 'ready';
}

export interface CCTVInfo {
  id: string;
  name: string;
  location: string;
  status: string;
  confidence: number;
}




