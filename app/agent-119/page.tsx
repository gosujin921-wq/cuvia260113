'use client';

import React, { useEffect, useRef, useState, useMemo, Suspense } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { allEvents, getEventsByDomain, getEventById, generateAIInsight, domainLabels } from '@/lib/events-data';

interface DisasterEvent {
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
}

// 공통 데이터에서 119 재난·구조(B) 이벤트만 필터링
const getDisasterEvents = (): DisasterEvent[] => {
  return getEventsByDomain('B').map((event) => ({
    id: event.eventId,
    type: event.type,
    title: event.title,
    time: event.time,
    location: event.location,
    description: event.description || '',
    source: event.source || '119 신고',
    pScore: event.pScore || 0,
    risk: event.risk,
    status: event.status === 'URGENT' ? 'URGENT' : event.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : event.status === 'ACTIVE' ? 'ACTIVE' : 'NEW',
  }));
};

const chatBlocks = [
  {
    title: '사건 해석',
    icon: 'mdi:fire-alert',
    content: '화재 발생이 확인되었습니다. 강풍 영향으로 확산 위험이 높으며, 접근 가능한 도로가 제한적입니다.',
  },
  {
    title: '환경 영향 분석',
    icon: 'mdi:weather-windy',
    content: '현재 강풍주의보 발령 중. 바람 방향 북서풍, 풍속 12m/s. 화재 확산 속도 증가 가능성 높음.',
  },
  {
    title: '출동 경로 분석',
    icon: 'mdi:route',
    content: '최단 출동 경로: 중앙로 → 비산동 입구 (ETA 4분). 대체 경로: 평촌대로 → 골목길 (ETA 6분)',
  },
  {
    title: '대응 추천',
    icon: 'mdi:fire-truck',
    content: '즉시 소방대 출동이 필요합니다. 주민 대피 경로 확보 및 화재 확산 방지 조치를 권장합니다.',
  },
];

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  buttons?: string[];
  isCCTVRecommendation?: boolean;
}

const quickCommands = [
  '이 사건 분석해줘',
  '출동 경로 추천해줘',
  '환경 영향 분석해줘',
  '전파문 초안 작성해줘',
  '위험도 재계산해줘',
  '유사 사건 찾아줘',
];

const behaviorHighlights = [
  '화재 발생: 주택 2층 연기',
  '강풍 영향: 확산 위험 높음',
  '주민 대피: 진행 중',
  '현재 상태: 소방대 출동 중',
];

const movementTimeline = [
  { time: '00:10:15', label: '화재 감지', desc: '주택 2층 연기 발생', color: 'text-red-400' },
  { time: '00:11:20', label: '119 신고', desc: '주민 신고 접수', color: 'text-blue-400' },
  { time: '00:12:30', label: '소방대 출동', desc: '소방차 2대 출동', color: 'text-yellow-400' },
  { time: '00:13:45', label: '현장 도착', desc: '진압 시작', color: 'text-green-400' },
];

const routeRecommendation = '최단 출동 경로: 중앙로 → 비산동 입구 (ETA 4분)';

const cctvInfo: Record<string, { id: string; name: string; location: string; status: string; confidence: number }> = {
  'CCTV-3 (현장)': {
    id: 'CCTV-3',
    name: '비산동 주택가',
    location: '현장',
    status: '활성',
    confidence: 95,
  },
  'CCTV-7 (북쪽)': {
    id: 'CCTV-7',
    name: '평촌대로 사거리',
    location: '북쪽 100m',
    status: '모니터링',
    confidence: 82,
  },
  'CCTV-11 (동쪽)': {
    id: 'CCTV-11',
    name: '비산2동 골목',
    location: '동쪽 80m',
    status: '대기',
    confidence: 68,
  },
};

const DisasterAgentPageContent = () => {
  const searchParams = useSearchParams();
  const events = useMemo(() => getDisasterEvents(), []);
  const urgentCount = useMemo(() => events.filter((e) => e.status === 'URGENT' || e.status === 'IN_PROGRESS').length, [events]);
  const activeCount = useMemo(() => events.filter((e) => e.status === 'ACTIVE').length, [events]);
  const totalCount = events.length;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'URGENT' | 'ACTIVE' | 'ALL'>('URGENT');
  const [selectedEvent, setSelectedEvent] = useState<DisasterEvent | null>(events[0] || null);

  useEffect(() => {
    const eventId = searchParams.get('eventId');
    if (eventId) {
      const baseEvent = getEventById(eventId);
      if (baseEvent && baseEvent.domain === 'B') {
        const disasterEvent = events.find((e) => e.id === eventId);
        if (disasterEvent) {
          setSelectedEvent(disasterEvent);
          setSelectedCategory(disasterEvent.status === 'URGENT' || disasterEvent.status === 'IN_PROGRESS' ? 'URGENT' : disasterEvent.status === 'ACTIVE' ? 'ACTIVE' : 'ALL');
        }
      }
    }
  }, [searchParams, events]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'chat-1',
      role: 'assistant',
      content: '현재 사건 요약을 기반으로 즉시 대응 전략을 준비했습니다. 필요한 분석이나 정보가 있으면 자연어로 요청해주세요.',
      timestamp: '00:10:20',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [showCCTVPopup, setShowCCTVPopup] = useState(false);
  const [selectedCCTV, setSelectedCCTV] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(332);
  const [savedClips, setSavedClips] = useState<Array<{ id: string; cctvId: string; cctvName: string; timestamp: string; duration: string; status: 'saved' | 'ready' }>>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const filteredEvents = events.filter((event) => {
    if (selectedCategory === 'URGENT' && event.status !== 'URGENT' && event.status !== 'IN_PROGRESS') return false;
    if (selectedCategory === 'ACTIVE' && event.status !== 'ACTIVE') return false;
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      return (
        event.id.toLowerCase().includes(lowerSearch) ||
        event.title.toLowerCase().includes(lowerSearch) ||
        event.location.toLowerCase().includes(lowerSearch)
      );
    }
    return true;
  });

  const handleEventSelect = (event: DisasterEvent) => {
    setSelectedEvent(event);
  };

  const addMessage = (role: 'assistant' | 'user', content: string, buttons?: string[], isCCTVRecommendation?: boolean) => {
    const timestamp = new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setChatMessages((prev) => [...prev, { 
      id: `${role}-${Date.now()}`, 
      role, 
      content, 
      timestamp,
      buttons,
      isCCTVRecommendation
    }]);
  };

  const generateAssistantReply = (prompt: string) => {
    const title = selectedEvent?.title ?? '선택된 사건';
    const location = selectedEvent?.location ?? '현장';
    const pScore = selectedEvent?.pScore ?? 0;
    const eventType = selectedEvent?.type ?? '';
    const baseEvent = selectedEvent?.id ? getEventById(selectedEvent.id) : null;
    
    if (prompt.includes('분석') || prompt.includes('이 사건')) {
      let situationSummary = '';
      let keyFeatures = '';
      let recommendations = '';

      if (baseEvent) {
        const insight = generateAIInsight(baseEvent);
        situationSummary = insight;
      } else {
        if (eventType.includes('화재') || eventType.includes('연기')) {
          situationSummary = '화재 발생이 확인되었습니다. 강풍 영향으로 확산 위험이 높으며, 접근 가능한 도로가 제한적입니다. 주민 대피가 진행 중입니다.';
          keyFeatures = '• 화재 발생 위치: 주택 2층\n• 연기 발생 확인\n• 강풍 영향: 확산 위험 높음\n• 주민 대피: 진행 중';
          recommendations = '즉시 소방대 출동이 필요합니다. CCTV-3, CCTV-7이 주요 관제 지점입니다.';
        } else if (eventType.includes('교통사고')) {
          situationSummary = '다중 추돌 사고가 발생했습니다. 부상자 발생으로 즉시 소방대 및 구급대 출동이 필요합니다.';
          keyFeatures = '• 차량 3대 추돌\n• 부상자 2명 발생\n• 도로 통제 필요';
          recommendations = '즉시 소방대 및 구급대 출동이 필요합니다. 도로 통제 및 응급처치가 진행 중입니다.';
        } else if (eventType.includes('쓰러짐')) {
          situationSummary = '보행 중 갑자기 쓰러진 것으로 보이며, 즉시 구급대 출동이 필요합니다.';
          keyFeatures = '• 보행 중 쓰러짐\n• 응급 상황\n• 의식 확인 필요';
          recommendations = '즉시 구급대 출동이 필요합니다. 응급처치 및 병원 이송이 진행 중입니다.';
        } else {
          situationSummary = '119 신고 접수와 CCTV AI 감지가 동시에 이루어진 고신뢰도 사건입니다.';
          keyFeatures = '• CCTV 포착: CCTV-3, CCTV-7';
          recommendations = '즉시 소방대 출동이 필요하며, CCTV 집중 모니터링을 권장합니다.';
        }
      }

      return `📊 ${title} 사건 종합 분석

**사건 개요**
• 발생 시간: ${selectedEvent?.time ?? '알 수 없음'}
• 발생 위치: ${location}
• 사건 유형: ${eventType}
• 현재 위험도: ${selectedEvent?.risk ?? '알 수 없음'} (위험도 수치: ${pScore}%)

**상황 요약**
${situationSummary || '119 신고 접수와 CCTV AI 감지가 동시에 이루어진 고신뢰도 사건입니다.'}

${keyFeatures ? `**주요 특징**\n${keyFeatures}\n\n` : ''}**대응 권고사항**
${recommendations || '즉시 소방대 출동이 필요하며, CCTV 집중 모니터링을 권장합니다.'}`;
    } else if (prompt.includes('경로') || prompt.includes('출동')) {
      return `🚒 출동 경로 추천

**최단 출동 경로**
• 경로: 중앙로 → 비산동 입구
• 예상 소요 시간: 4분
• 거리: 약 2.3km

**대체 경로**
• 경로: 평촌대로 → 골목길
• 예상 소요 시간: 6분
• 거리: 약 3.1km

**현재 교통 상황**
• 중앙로: 정상 통행 가능
• 평촌대로: 일부 정체 (예상 지연 1분)

**권고사항**
최단 경로인 중앙로 경로를 권장합니다. 현재 교통 상황 양호하며, 예상 도착 시간 내 현장 도착 가능합니다.`;
    } else if (prompt.includes('환경') || prompt.includes('기상')) {
      return `🌪️ 환경 영향 분석

**기상 정보**
• 강풍주의보: 발령 중
• 바람 방향: 북서풍
• 풍속: 12m/s
• 기온: 11°C
• 습도: 62%

**화재 확산 영향**
• 강풍 영향으로 확산 속도 증가 가능성 높음
• 바람 방향: 북서 → 남동
• 예상 확산 방향: 남동쪽 주거지

**대응 권고**
• 남동쪽 주거지 주민 대피 우선
• 화재 확산 방지 조치 강화
• 바람 방향 고려한 진압 전략 수립`;
    } else if (prompt.includes('전파문') || prompt.includes('초안')) {
      return `📄 전파문 초안

**사건 개요**
• 사건번호: ${selectedEvent?.id}
• 사건유형: ${selectedEvent?.type}
• 발생시간: ${selectedEvent?.time}
• 발생장소: ${location}
• 위험도: ${selectedEvent?.risk}

**사건 내용**
119 신고 접수 - ${selectedEvent?.title}. CCTV AI도 동시 감지하여 고신뢰도 사건으로 분류되었습니다.

**현황**
• 화재 발생 위치 확인
• 강풍 영향으로 확산 위험 높음
• 주민 대피 진행 중
• 소방대 출동 중

**대응 조치**
• 즉시 소방대 출동 필요
• CCTV-3, CCTV-7 집중 모니터링
• 주민 대피 경로 확보

**추가 정보**
• 관련 CCTV: CCTV-3 (현장), CCTV-7 (북쪽 100m)
• 출동 경로: 중앙로 → 비산동 입구 (ETA 4분)`;
    } else if (prompt.includes('위험도') || prompt.includes('재계산')) {
      return `⚠️ 위험도 재평가 결과

**기존 위험도**
• 위험도 수치: ${pScore}%
• 위험도 등급: ${selectedEvent?.risk ?? '알 수 없음'}

**재계산 결과**
• 새로운 위험도 수치: ${pScore + 3}%
• 위험도 등급: ${selectedEvent?.risk} (유지)

**재평가 근거**
• 강풍 영향 증가: +3점
• 주민 대피 진행: -1점
• 소방대 출동 중: -1점

**위험도 상승 요인**
1. 강풍주의보 발령으로 확산 위험 증가
2. 접근 도로 제한적
3. 주거지 인접 지역

**대응 권고**
현재 위험도가 높은 수준을 유지하고 있어 즉시 대응이 필요합니다. 소방대 출동 강화 및 주민 대피 조치를 권장합니다.`;
    } else if (prompt.includes('유사') || prompt.includes('사건')) {
      return `🔍 유사 사건 검색 결과

**검색 기준**
• 사건 유형: ${selectedEvent?.type}
• 발생 장소: ${location} 인근
• 행동 패턴: 화재 → 진압

**유사 사건 3건 발견**

**1. 사건번호: B-20240115-001**
• 발생일: 2024년 1월 15일
• 유사도: 89%
• 특징: 동일 장소, 강풍 영향 화재
• 대응 시간: 5분 20초

**2. 사건번호: B-20240203-002**
• 발생일: 2024년 2월 3일
• 유사도: 82%
• 특징: 유사 기상 조건, 주거지 화재
• 대응 시간: 4분 45초

**3. 사건번호: B-20240228-003**
• 발생일: 2024년 2월 28일
• 유사도: 76%
• 특징: 동일 시간대, 유사 확산 패턴
• 대응 시간: 6분 10초

**공통 패턴**
• 모두 강풍 영향으로 확산 속도 증가
• 평균 대응 시간: 5분 25초
• 주민 대피 완료 시간: 평균 8분

**권고사항**
과거 유사 사건들의 대응 패턴을 참고하여 강풍 영향 고려한 진압 전략을 수립하는 것을 권장합니다.`;
    } else if (prompt.includes('cctv') || prompt.includes('CCTV') || prompt.includes('추천')) {
      return `📹 관련 CCTV 추가 추천

**현재 추천 CCTV**
1. **CCTV-3 (현장)**
   • 위치: 비산동 주택가
   • 신뢰도: 95%
   • 상태: 활성
   • 특징: 사건 발생 지점, 주요 증거 영상 확보 가능

2. **CCTV-7 (북쪽 100m)**
   • 위치: 평촌대로 사거리
   • 신뢰도: 82%
   • 상태: 모니터링
   • 특징: 확산 방향 모니터링, 주민 대피 경로 확인

**추가 추천 CCTV**
3. **CCTV-11 (동쪽 80m)**
   • 위치: 비산2동 골목
   • 신뢰도: 68%
   • 상태: 대기
   • 특징: 예상 확산 경로, 예방적 모니터링 권장

**모니터링 우선순위**
1순위: CCTV-3 (현장 모니터링)
2순위: CCTV-7 (확산 방향 모니터링)
3순위: CCTV-11 (예방적 모니터링)

**권고사항**
현재 2개 CCTV가 활발히 모니터링 중이며, 추가 1개 CCTV를 예방적으로 모니터링하는 것을 권장합니다.`;
    } else {
      return `"${prompt}" 요청에 대해 ${title} 사건 기준으로 정보를 정리했습니다. 필요한 세부 데이터가 있다면 추가로 지시해주세요.`;
    }
  };

  const handleSendMessage = (messageText?: string) => {
    const text = (messageText ?? chatInput).trim();
    if (!text || isResponding) return;
    addMessage('user', text);
    setChatInput('');
    setIsResponding(true);
    setTimeout(() => {
      const reply = generateAssistantReply(text);
      const isCCTV = text.includes('cctv') || text.includes('CCTV') || text.includes('추천');
      const buttons = isCCTV ? ['CCTV-3 (현장)', 'CCTV-7 (북쪽 100m)', 'CCTV-11 (동쪽 80m)'] : undefined;
      addMessage('assistant', reply, buttons, isCCTV);
      setIsResponding(false);
    }, 700);
  };

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chatMessages, isResponding]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= duration) {
          setIsPlaying(false);
          return duration;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  return (
    <div className="flex flex-col h-screen bg-[#161719] overflow-hidden">
      <header className="flex h-16 items-center justify-between bg-[#1a1a1a] border-b border-[#31353a] px-6" style={{ borderWidth: '1px' }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-24 h-5 flex items-center justify-center">
              <img src="/logo.svg" alt="CUVIA Logo" className="h-5 w-auto object-contain" />
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Icon icon="mdi:fire-truck" className="w-6 h-6 text-white" />
            <span className="text-xl font-semibold text-white">119 재난 · 구조 Agent</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/agent-hub" className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-full transition-colors text-sm">
            Agent Hub
          </Link>
          <Link href="/" className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-full transition-colors text-sm">
            대시보드
          </Link>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - 사건 목록 */}
        <aside className="w-80 flex-shrink-0 bg-[#1a1a1a] border-r border-[#31353a] flex flex-col" style={{ borderWidth: '1px' }}>
          <div className="p-4 border-b border-[#31353a] flex flex-col gap-3" style={{ borderWidth: '1px', height: '156px' }}>
            <div className="relative">
              <Icon icon="mdi:magnify" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Q 사건 ID, 키워드 검색..."
                className="w-full bg-[#161719] border border-[#31353a] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                style={{ borderWidth: '1px' }}
              />
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-1.5 bg-[#161719] border border-[#31353a] rounded-lg text-white text-xs hover:bg-[#2a2a2a] transition-colors" style={{ borderWidth: '1px' }}>
                사건유형
              </button>
              <button className="flex-1 px-3 py-1.5 bg-[#161719] border border-[#31353a] rounded-lg text-white text-xs hover:bg-[#2a2a2a] transition-colors" style={{ borderWidth: '1px' }}>
                위험도
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCategory('URGENT')}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  selectedCategory === 'URGENT'
                    ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                    : 'bg-[#161719] border border-[#31353a] text-gray-400 hover:bg-[#2a2a2a]'
                }`}
                style={{ borderWidth: '1px' }}
              >
                긴급 ({urgentCount})
              </button>
              <button
                onClick={() => setSelectedCategory('ACTIVE')}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  selectedCategory === 'ACTIVE'
                    ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
                    : 'bg-[#161719] border border-[#31353a] text-gray-400 hover:bg-[#2a2a2a]'
                }`}
                style={{ borderWidth: '1px' }}
              >
                진행중 ({activeCount})
              </button>
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  selectedCategory === 'ALL'
                    ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                    : 'bg-[#161719] border border-[#31353a] text-gray-400 hover:bg-[#2a2a2a]'
                }`}
                style={{ borderWidth: '1px' }}
              >
                전체 ({totalCount})
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="mb-3">
              <h3 className="text-white font-semibold text-sm mb-2">실시간 사건 목록</h3>
            </div>
            <div className="space-y-2">
              {filteredEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleEventSelect(event)}
                  className={`w-full text-left border rounded-lg p-3 transition-all ${
                    selectedEvent?.id === event.id
                      ? 'bg-red-500/10 border-red-500/50 ring-2 ring-red-500/30'
                      : 'bg-[#1f1f1f] border-[#31353a] hover:bg-[#2a2a2a]'
                  }`}
                  style={{ borderWidth: '1px' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">{event.time}</span>
                      <span className="text-gray-500 text-xs font-mono">{event.id}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      event.pScore >= 80 ? 'bg-red-500/20 text-red-400' :
                      event.pScore >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      P{event.pScore}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      event.type.includes('화재') || event.type.includes('연기') ? 'bg-red-500/20 text-red-400' :
                      event.type.includes('교통사고') ? 'bg-yellow-500/20 text-yellow-400' :
                      event.type.includes('쓰러짐') ? 'bg-orange-500/20 text-orange-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {event.type}
                    </span>
                    <span className="text-blue-400 text-xs">{domainLabels.B}</span>
                  </div>
                  <div className="text-white font-semibold text-sm mb-1">{event.title}</div>
                  <div className="text-gray-400 text-xs mb-1">{event.location}</div>
                  <div className="text-gray-500 text-xs">{event.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-[#31353a] bg-[#1a1a1a]" style={{ borderWidth: '1px' }}>
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>오늘 처리 사건</span>
              <span className="text-white font-semibold">18건</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>평균 응답시간</span>
              <span className="text-white font-semibold">2분 15초</span>
            </div>
          </div>
        </aside>

        {/* Center Panel - 사건 상세 */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#161719]">
          {selectedEvent ? (
            <>
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* AI Chat Blocks */}
                <div className="space-y-4">
                  {chatBlocks.map((block) => (
                    <div key={block.title} className="bg-[#1a1a1a] border border-[#31353a] rounded-lg p-4" style={{ borderWidth: '1px' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon icon={block.icon} className="w-4 h-4 text-blue-300" />
                        <h4 className="text-white font-semibold text-sm">{block.title}</h4>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{block.content}</p>
                    </div>
                  ))}
                </div>

                {/* CCTV 추천 */}
                <div className="bg-[#1a1a1a] border border-[#31353a] rounded-lg p-4" style={{ borderWidth: '1px' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon icon="mdi:cctv" className="w-4 h-4 text-blue-300" />
                    <h4 className="text-white font-semibold text-sm">CCTV 추천</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['CCTV-3 (현장)', 'CCTV-7 (북쪽 100m)', 'CCTV-11 (동쪽 80m)'].map((cctv) => (
                      <button
                        key={cctv}
                        onClick={() => {
                          setSelectedCCTV(cctv);
                          setShowCCTVPopup(true);
                        }}
                        className="px-3 py-1.5 bg-[#161719] border border-[#31353a] rounded-lg text-white text-sm hover:border-blue-500/50 transition-colors"
                        style={{ borderWidth: '1px' }}
                      >
                        {cctv}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 저장된 클립 목록 */}
                {savedClips.length > 0 && (
                  <div className="bg-[#1a1a1a] border border-[#31353a] rounded-lg p-4" style={{ borderWidth: '1px' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon icon="mdi:video-box" className="w-4 h-4 text-green-300" />
                        <h4 className="text-white font-semibold text-sm">저장된 클립 ({savedClips.length})</h4>
                      </div>
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                        전파 준비 완료
                      </span>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {savedClips.map((clip) => (
                        <div
                          key={clip.id}
                          className="bg-[#161719] border border-[#31353a] rounded-lg p-3 hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                          style={{ borderWidth: '1px' }}
                          onClick={() => {
                            setSelectedCCTV(Object.keys(cctvInfo).find((key) => cctvInfo[key].id === clip.cctvId) || null);
                            setShowCCTVPopup(true);
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Icon icon="mdi:play-circle" className="w-4 h-4 text-blue-400" />
                              <span className="text-white text-sm font-semibold">{clip.cctvId}</span>
                            </div>
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                              전파 준비
                            </span>
                          </div>
                          <div className="text-gray-400 text-xs mb-1">{clip.cctvName}</div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{clip.timestamp}</span>
                            <span className="flex items-center gap-1">
                              <Icon icon="mdi:clock-outline" className="w-3 h-3" />
                              {clip.duration}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="h-px bg-[#1f1f1f]"></div>

                {/* 대화 로그 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C62F0] to-[#5A3FEA] flex items-center justify-center text-white">
                      <Icon icon="mdi:sparkles" className="w-4 h-4" />
                    </div>
                    <span>119 Agent</span>
                  </div>
                  <div className="space-y-3">
                    {chatMessages.map((message) => (
                      <div key={message.id} className="space-y-2">
                        <div
                          className={`flex ${message.role === 'user' ? 'justify-end' : ''}`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-2 rounded-2xl border text-sm ${
                              message.role === 'user'
                                ? 'bg-blue-600 text-white border-blue-500'
                                : 'bg-[#161719] text-gray-200 border-[#31353a]'
                            }`}
                            style={{ borderWidth: '1px' }}
                          >
                            <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                              {message.timestamp}
                            </div>
                          </div>
                        </div>
                        {message.role === 'assistant' && message.buttons && message.buttons.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {message.buttons.map((button) => (
                              <button
                                key={button}
                                onClick={() => {
                                  setSelectedCCTV(button);
                                  setShowCCTVPopup(true);
                                }}
                                className="px-3 py-1.5 bg-[#161719] border border-[#31353a] rounded-lg text-white text-sm hover:border-blue-500/50 transition-colors"
                                style={{ borderWidth: '1px' }}
                              >
                                {button}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {isResponding && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    )}
                  </div>
                </div>

                <div ref={bottomRef} className="h-1" />
              </div>

              {/* 빠른 명령 + 자연어 입력 */}
              <div className="border-t border-[#31353a] bg-[#1a1a1a] p-4 sticky bottom-0 left-0 right-0" style={{ borderWidth: '1px' }}>
                <div className="flex flex-wrap gap-2 mb-3">
                  {quickCommands.map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => handleSendMessage(cmd)}
                      className="px-3 py-1.5 rounded-full text-xs text-gray-300 transition-colors"
                      style={{
                        borderWidth: '1px',
                        borderColor: '#7C62F099',
                        backgroundColor: '#7C62F01A',
                      }}
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="자연어로 질문하세요... (예: '출동 경로 추천해줘', '환경 영향 분석해줘')"
                    className="flex-1 bg-[#161719] border border-[#31353a] rounded-full px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    style={{ borderWidth: '1px' }}
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isResponding}
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${
                      isResponding ? 'bg-blue-900 text-blue-200 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    전송
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              사건을 선택하세요
            </div>
          )}
        </main>

        {/* Right Panel - CCTV & 환경 분석 */}
        <aside className="w-80 flex-shrink-0 bg-[#1a1a1a] border-l border-[#31353a] flex flex-col overflow-y-auto" style={{ borderWidth: '1px' }}>
          <div className="p-4 border-b border-[#31353a]" style={{ borderWidth: '1px' }}>
            <h3 className="text-white font-semibold text-sm">CCTV 모니터링</h3>
          </div>
          <div className="p-4 space-y-4">
            {/* CCTV-3 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-semibold text-sm">CCTV-3</span>
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">활성</span>
              </div>
              <div className="text-gray-400 text-xs mb-2">현장</div>
              <div className="bg-[#161719] border border-[#31353a] rounded-lg aspect-video flex items-center justify-center" style={{ borderWidth: '1px' }}>
                <div className="text-center">
                  <Icon icon="mdi:cctv" className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs">연결 중...</p>
                </div>
              </div>
            </div>

            {/* CCTV-7 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-semibold text-sm">CCTV-7</span>
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">모니터링</span>
              </div>
              <div className="text-gray-400 text-xs mb-2">북쪽 100m</div>
              <div className="bg-[#161719] border-2 border-yellow-500/50 rounded-lg aspect-video flex items-center justify-center" style={{ borderWidth: '2px' }}>
                <div className="text-center">
                  <Icon icon="mdi:cctv" className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs">연결 중...</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-[#31353a] space-y-4" style={{ borderWidth: '1px' }}>
            <div className="bg-[#1a1a1a] border border-[#31353a] rounded-lg p-4 space-y-3" style={{ borderWidth: '1px' }}>
              <div className="flex items-center gap-2 text-sm text-white font-semibold">
                <Icon icon="mdi:weather-windy" className="w-4 h-4 text-blue-300" />
                환경 영향 분석
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">강풍주의보</p>
                  <p className="text-red-400">발령 중</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">바람 방향</p>
                  <p>북서풍</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">풍속</p>
                  <p>12m/s</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">확산 위험</p>
                  <p className="text-red-400 font-semibold">높음</p>
                </div>
              </div>
            </div>

            <div className="bg-[#2a1313] border border-red-500/40 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-red-300 font-semibold">
                <Icon icon="mdi:alert" className="w-4 h-4" />
                상황 요약
              </div>
              <ul className="text-sm text-red-100 space-y-1">
                {behaviorHighlights.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="bg-[#1a1a1a] border border-[#31353a] rounded-lg p-4 space-y-4" style={{ borderWidth: '1px' }}>
              <div className="flex items-center gap-2 text-sm text-white font-semibold">
                <Icon icon="mdi:clock-outline" className="w-4 h-4 text-green-300" />
                대응 타임라인
              </div>
              <div className="space-y-2 text-sm">
                {movementTimeline.map((entry) => (
                  <div key={entry.time} className="flex gap-3">
                    <div className="text-xs text-gray-500 w-16">{entry.time}</div>
                    <div>
                      <p className={`font-semibold ${entry.color}`}>{entry.label}</p>
                      <p className="text-gray-400 text-xs">{entry.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0f1f14] border border-green-500/40 rounded-lg p-4" style={{ borderWidth: '1px' }}>
              <div className="flex items-center gap-2 text-sm text-green-300 font-semibold mb-2">
                <Icon icon="mdi:route" className="w-4 h-4" />
                출동 경로 추천
              </div>
              <p className="text-gray-200 text-sm">{routeRecommendation}</p>
            </div>
          </div>
        </aside>
      </div>

      {/* CCTV 팝업 - 미디어 플레이어 */}
      {showCCTVPopup && selectedCCTV && cctvInfo[selectedCCTV] && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => {
            setShowCCTVPopup(false);
            setSelectedCCTV(null);
            setIsPlaying(false);
            setCurrentTime(0);
          }}
        >
          <div
            className="bg-[#161719] border border-[#31353a] rounded-lg w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col"
            style={{ borderWidth: '1px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#31353a]" style={{ borderWidth: '1px' }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                    REC
                  </button>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">CCTV 빠른 보기</h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCCTVPopup(false);
                  setSelectedCCTV(null);
                  setIsPlaying(false);
                  setCurrentTime(0);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Icon icon="mdi:close" className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 bg-black relative">
                <div className="absolute top-4 left-4 z-10">
                  <div className="text-white font-semibold text-lg">{cctvInfo[selectedCCTV].id}</div>
                  <div className="text-gray-300 text-sm">{cctvInfo[selectedCCTV].name}</div>
                </div>

                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-400 text-sm mb-1">CCTV {cctvInfo[selectedCCTV].id.toLowerCase()} 연결 중...</p>
                    <p className="text-gray-500 text-xs">실시간 스트리밍</p>
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 text-white text-sm font-mono">
                  {new Date().toISOString().slice(0, 19).replace('T', ' ')}
                </div>
              </div>

              <div className="w-80 bg-[#1a1a1a] border-l border-[#31353a] flex flex-col" style={{ borderWidth: '1px' }}>
                <div className="p-4 border-b border-[#31353a]" style={{ borderWidth: '1px' }}>
                  <h4 className="text-white font-semibold text-sm mb-4">CCTV 빠른 보기</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
                        className="p-2 bg-[#161719] border border-[#31353a] rounded-lg text-white hover:bg-[#2a2a2a] transition-colors"
                        style={{ borderWidth: '1px' }}
                      >
                        <Icon icon="mdi:skip-backward" className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="flex-1 p-2 bg-[#161719] border border-[#31353a] rounded-lg text-white hover:bg-[#2a2a2a] transition-colors flex items-center justify-center"
                        style={{ borderWidth: '1px' }}
                      >
                        <Icon icon={isPlaying ? 'mdi:pause' : 'mdi:play'} className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => setCurrentTime(Math.min(duration, currentTime + 10))}
                        className="p-2 bg-[#161719] border border-[#31353a] rounded-lg text-white hover:bg-[#2a2a2a] transition-colors"
                        style={{ borderWidth: '1px' }}
                      >
                        <Icon icon="mdi:skip-forward" className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="relative h-2 bg-[#161719] rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full bg-blue-500"
                          style={{ width: `${(currentTime / duration) * 100}%` }}
                        ></div>
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-400 rounded-full"
                          style={{ left: `${(currentTime / duration) * 100}%`, transform: 'translate(-50%, -50%)' }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
                        <span>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-4 space-y-3">
                  <h4 className="text-white font-semibold text-sm mb-3">감지 이벤트</h4>
                  <div className="space-y-2">
                    <button
                      className="w-full px-4 py-2.5 bg-[#161719] border border-[#31353a] rounded-lg text-white text-sm hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2"
                      style={{ borderWidth: '1px' }}
                    >
                      <Icon icon="mdi:target" className="w-4 h-4" />
                      추적 모드 활성화
                    </button>
                    <button
                      onClick={() => {
                        const clipId = `clip-${Date.now()}`;
                        const clip = {
                          id: clipId,
                          cctvId: cctvInfo[selectedCCTV].id,
                          cctvName: cctvInfo[selectedCCTV].name,
                          timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
                          duration: `${Math.floor(currentTime / 60)}:${String(Math.floor(currentTime % 60)).padStart(2, '0')} - ${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}`,
                          status: 'ready' as const,
                        };
                        setSavedClips((prev) => [...prev, clip]);
                        alert(`${cctvInfo[selectedCCTV].id} 클립 저장 완료. 전파 준비됨.`);
                      }}
                      className="w-full px-4 py-2.5 bg-[#161719] border border-[#31353a] rounded-lg text-white text-sm hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2"
                      style={{ borderWidth: '1px' }}
                    >
                      <Icon icon="mdi:content-save" className="w-4 h-4" />
                      클립 저장
                      <Icon icon="mdi:help-circle-outline" className="w-4 h-4 text-gray-400 ml-auto" />
                    </button>
                  </div>

                  {savedClips.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#31353a]" style={{ borderWidth: '1px' }}>
                      <h4 className="text-white font-semibold text-sm mb-3">저장된 클립 ({savedClips.length})</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {savedClips
                          .filter((clip) => clip.cctvId === cctvInfo[selectedCCTV].id)
                          .map((clip) => (
                            <div
                              key={clip.id}
                              className="bg-[#161719] border border-[#31353a] rounded-lg p-3"
                              style={{ borderWidth: '1px' }}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-white text-xs font-semibold">{clip.cctvId}</span>
                                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                                  전파 준비
                                </span>
                              </div>
                              <div className="text-gray-400 text-xs mb-1">{clip.cctvName}</div>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{clip.timestamp}</span>
                                <span>{clip.duration}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function DisasterAgentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-[#161719]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">로딩 중...</p>
        </div>
      </div>
    }>
      <DisasterAgentPageContent />
    </Suspense>
  );
}

