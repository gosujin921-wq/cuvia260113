export interface EventData {
  id: string;
  type: string;
  title: string;
  time: string;
  location: string;
  description: string;
  source: string;
  pScore: number;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'URGENT' | 'ACTIVE' | 'NEW' | 'IN_PROGRESS';
  domain: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
}

export type RiskLevel = 'high' | 'medium' | 'low' | 'strong';

export interface RiskFactor {
  label: string;
  value: string;
  reason: string;
  level: RiskLevel;
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




