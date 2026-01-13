'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { allEvents, getEventById } from '@/lib/events-data';

interface InsightCard {
  riskLevel: string;
  riskScore: number;
  weatherImpact: string;
  resources: string;
  relatedEvent: string;
  cctvRecommendation: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface CCTV {
  id: string;
  name: string;
  location: string;
  relevance: number;
  thumbnail?: string;
}

interface ThreadEvent {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  isMain: boolean;
  isEvidence: boolean;
}

interface PreAction {
  id: string;
  title: string;
  status: 'ready' | 'pending';
  description: string;
}

interface EnvironmentImpact {
  factor: string;
  value: string;
  impact: string;
  riskChange: number;
}

const IncidentResponsePageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('summary');
  const [selectedCCTV, setSelectedCCTV] = useState<string | null>(null);
  const [insight, setInsight] = useState<InsightCard | null>(null);
  const [filters, setFilters] = useState<any[]>([]);
  const [aiRecommendedActions, setAiRecommendedActions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const defaultInsight: InsightCard = {
    riskLevel: 'HIGH',
    riskScore: 92,
    weatherImpact: '지금 바람이 강해 확산 가능성 ↑',
    resources: '가장 가까운 119 출동 반경 내 2개 차량 있음',
    relatedEvent: '3분 전 배회 감지 이벤트와 이동 경로 유사 (67%)',
    cctvRecommendation: 'CCTV 03·07 번이 주요 지점입니다',
  };

  // 사건 분석 카테고리
  const categories: Category[] = [
    { id: 'summary', name: '실시간 사건 요약', icon: 'mdi:file-document-outline' },
    { id: 'risk', name: '위험도 분석', icon: 'mdi:alert-circle' },
    { id: 'thread', name: '연관 사건 후보(스레드)', icon: 'mdi:link-variant' },
    { id: 'cctv', name: '현장 CCTV 구성', icon: 'mdi:cctv' },
    { id: 'route', name: '출동 경로/반경 분석', icon: 'mdi:map-marker-path' },
    { id: 'weather', name: '환경·기상 영향', icon: 'mdi:weather-windy' },
    { id: 'classify', name: '112/119 분류 판단', icon: 'mdi:phone' },
    { id: 'priority', name: '대응 우선순위 추천', icon: 'mdi:priority-high' },
    { id: 'evidence', name: '현장 증거 요소', icon: 'mdi:eye' },
    { id: 'edit', name: '사건 스레드 편집', icon: 'mdi:pencil' },
  ];

  // CCTV 데이터
  const cctvList: CCTV[] = [
    { id: '1', name: 'CCTV-03', location: '평촌대로 북쪽', relevance: 95 },
    { id: '2', name: 'CCTV-07', location: '평촌대로 남쪽', relevance: 88 },
    { id: '3', name: 'CCTV-12', location: '인근 교차로', relevance: 72 },
    { id: '4', name: 'CCTV-15', location: '주거지 입구', relevance: 65 },
  ];

  // 스레드 이벤트
  const threadEvents: ThreadEvent[] = [
    { id: '1', type: '112-미아', title: '아동 실종 신고', timestamp: '00:05', isMain: true, isEvidence: false },
    { id: '2', type: 'AI-배회', title: '성인 남성 배회 행동 감지', timestamp: '00:04', isMain: false, isEvidence: true },
  ];

  // Pre-Actions
  const preActions: PreAction[] = [
    { id: '1', title: '전파 초안 1안 생성됨', status: 'ready', description: '119 전파문 초안 준비 완료' },
    { id: '2', title: '119 출동 경로 계산 완료', status: 'ready', description: '최적 경로: 2.5km, 예상 시간 7분' },
    { id: '3', title: 'CCTV 추적 모드 ON 가능', status: 'ready', description: 'CCTV-03, 07 자동 추적 준비' },
    { id: '4', title: '주변 배회 이벤트 병합 추천', status: 'pending', description: '3건의 배회 이벤트 병합 가능' },
  ];

  // 환경 영향
  const environmentImpacts: EnvironmentImpact[] = [
    { factor: '강풍', value: '15m/s', impact: '확산 가능성 ↑', riskChange: +15 },
    { factor: '기온', value: '5°C', impact: '정상', riskChange: 0 },
    { factor: '야간', value: '00:03', impact: '가시성 낮음', riskChange: +8 },
    { factor: '노면', value: '건조', impact: '정상', riskChange: 0 },
  ];

  useEffect(() => {
    const query = searchParams.get('query');
    if (query) {
      setInput(query);
      handleQuery(query);
    }
  }, [searchParams]);

  const handleQuery = (query: string) => {
    const lowerQuery = query.toLowerCase();
    
    // 이벤트 ID 패턴 매칭: [도메인]-[연도월일]-[시퀀스] 또는 단순 숫자
    const eventIdMatch = query.match(/([A-F])-(\d{8})-(\d{3})/i) || query.match(/(\d{3,})/);
    let foundEvent: ReturnType<typeof getEventById> | null = null;

    if (eventIdMatch) {
      const eventId = eventIdMatch[0];
      foundEvent = getEventById(eventId);
      
      if (foundEvent) {
        setInsight({
          riskLevel: foundEvent.risk,
          riskScore: foundEvent.pScore || 90,
          weatherImpact: foundEvent.domain === 'B' || foundEvent.domain === 'E' ? '기상 영향 확인됨' : '정상',
          resources: foundEvent.domain === 'B' ? '119 출동 차량 2대 대기 중' : '112 출동 차량 대기 중',
          relatedEvent: `유사 이벤트 ${allEvents.filter(e => e.type === foundEvent?.type).length - 1}건 확인`,
          cctvRecommendation: 'CCTV-03, CCTV-07 우선 모니터링',
        });
        setSelectedCategory('summary');
        setAiRecommendedActions([
          `${foundEvent.eventId} 대응 시나리오 생성`,
          '전파 초안 자동 작성',
          '출동 경로 재확인 완료',
        ]);
      } else {
        // 기존 로직 유지 (119-123 같은 형식)
        const incidentIdMatch = query.match(/119-?\d+/i);
        if (incidentIdMatch) {
          setInsight({
            riskLevel: 'HIGH',
            riskScore: 91,
            weatherImpact: `${incidentIdMatch[0]}: 강풍 영향으로 확산 가능성 높음`,
            resources: '119 출동 차량 2대, 경찰 1대 대기 중',
            relatedEvent: '배회 감지 이벤트와 65% 연관성 확인',
            cctvRecommendation: 'CCTV-03, CCTV-07 우선 모니터링',
          });
          setSelectedCategory('summary');
          setAiRecommendedActions([
            `${incidentIdMatch[0]} 대응 시나리오 생성`,
            '전파 초안 자동 작성',
            '출동 경로 재확인 완료',
          ]);
        }
      }
    } else if (lowerQuery.includes('우선순위') || lowerQuery.includes('재계산')) {
      setInsight({
        riskLevel: 'HIGH',
        riskScore: 92,
        weatherImpact: '강풍 영향으로 위험도 상향',
        resources: '119 출동 권장',
        relatedEvent: '연관 사건 2건 확인',
        cctvRecommendation: 'CCTV-03 우선 모니터링',
      });
      setSelectedCategory('priority');
      setAiRecommendedActions(['위험도 다시 계산 완료', '우선순위 재분석 완료']);
    } else if (lowerQuery.includes('연관') || lowerQuery.includes('관련')) {
      setInsight({
        riskLevel: 'HIGH',
        riskScore: 88,
        weatherImpact: '정상',
        resources: '2개 차량 대기',
        relatedEvent: '배회 이벤트와 67% 유사도 확인',
        cctvRecommendation: 'CCTV-03, 07 연속 추적 필요',
      });
      setSelectedCategory('thread');
      setAiRecommendedActions(['연관 사건 분석 완료', '스레드 묶기 제안']);
    } else if (lowerQuery.includes('cctv') || lowerQuery.includes('카메라')) {
      setInsight({
        riskLevel: 'HIGH',
        riskScore: 92,
        weatherImpact: '강풍',
        resources: '119 출동',
        relatedEvent: '배회 이벤트 연관',
        cctvRecommendation: 'CCTV-03 (95%), CCTV-07 (88%) 우선순위',
      });
      setSelectedCategory('cctv');
      setAiRecommendedActions(['CCTV 우선순위 분석 완료', '추적 모드 활성화 가능']);
    } else {
      setInsight(defaultInsight);
      setAiRecommendedActions([]);
    }
    
    setIsLoading(false);
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        setIsLoading(true);
        setTimeout(() => {
          handleQuery(input.trim());
        }, 500);
      }
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleActionClick = (action: string) => {
    // 액션 실행 로직
    console.log('Action clicked:', action);
  };

  const totalRiskChange = environmentImpacts.reduce((sum, item) => sum + item.riskChange, 0);

  return (
    <div className="flex flex-col h-screen bg-[#161719] overflow-hidden">
      {/* 상단 헤더 */}
      <header className="flex h-16 items-center justify-between bg-[#1a1a1a] border-b border-[#31353a] px-6" style={{ borderWidth: '1px' }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-24 h-5 flex items-center justify-center">
              <img 
                src="/logo.svg" 
                alt="CUVIA Logo" 
                className="h-5 w-auto object-contain"
              />
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Icon icon="mdi:alert-circle" className="w-6 h-6 text-blue-400" />
            <span className="text-xl font-semibold text-white">사건 대응 (실시간)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/agent-hub"
            className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-full transition-colors text-sm"
          >
            Agent Hub
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-full transition-colors text-sm"
          >
            대시보드
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        {/* 좌측: 사건 분석 카테고리 패널 */}
        <div className="w-64 flex-shrink-0 bg-[#1a1a1a] border-r border-[#31353a] overflow-y-auto" style={{ borderWidth: '1px' }}>
          <div className="p-4 border-b border-[#31353a]" style={{ borderWidth: '1px' }}>
            <h2 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
              <Icon icon="mdi:folder" className="w-5 h-5 text-blue-400" />
              사건 분석 카테고리
            </h2>
          </div>
          <div className="p-2 space-y-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all border ${
                  selectedCategory === category.id
                    ? 'bg-blue-500/20 border-blue-500/50 text-white'
                    : 'border-transparent text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                }`}
                style={{ borderWidth: '1px' }}
              >
                <div className="flex items-center gap-3">
                  <Icon icon={category.icon} className="w-5 h-5" />
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 중앙: 메인 컨텐츠 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* 검색창 */}
          <div className="p-4 border-b border-[#2a2a2a] bg-[#1a1a1a]" style={{ borderWidth: '1px' }}>
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Icon icon="mdi:magnify" className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleInputKeyPress}
                  placeholder="사건을 분석하세요... (예: 119-00124 사건 대응방법 알려줘)"
                  className="w-full pl-12 pr-14 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/20 transition-all"
                  style={{ borderWidth: '1px' }}
                  disabled={isLoading}
                />
                {input && (
                  <button
                    onClick={() => {
                      setInput('');
                      setInsight(defaultInsight);
                      setFilters([]);
                      setAiRecommendedActions([]);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-[#2a2a2a] rounded-full transition-colors"
                  >
                    <Icon icon="mdi:close" className="w-5 h-5 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* 상단: AI 실시간 대응 인사이트 */}
            {insight && (
              <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6" style={{ borderWidth: '1px' }}>
                <div className="flex items-start gap-3 mb-4">
                  <Icon icon="mdi:lightbulb-on" className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-3">📌 AI 대응 인사이트</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="text-gray-400 mb-1">위험도</div>
                          <div className="text-red-400 font-bold text-lg">{insight.riskLevel} ({insight.riskScore}%)</div>
                        </div>
                      </div>
                      <div className="text-gray-300">{insight.weatherImpact}</div>
                      <div className="text-gray-300">{insight.resources}</div>
                      <div className="text-gray-300">{insight.relatedEvent}</div>
                      <div className="text-blue-400 font-medium">→ {insight.cctvRecommendation}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 로딩 상태 */}
            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-gray-400 mb-6">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            )}

            {/* 사건 Summary */}
            {insight && (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 mb-6" style={{ borderWidth: '1px' }}>
              <h3 className="text-white font-semibold text-lg mb-4">사건 Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-gray-400 text-sm mb-1">사건 유형</div>
                  <div className="text-white font-medium">119-화재</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">위험도</div>
                  <div className="text-red-400 font-medium">HIGH (92%)</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">우선순위</div>
                  <div className="text-yellow-400 font-medium">즉시 대응</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">시간</div>
                  <div className="text-white font-medium">00:03</div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-400 text-sm mb-1">위치</div>
                  <div className="text-white font-medium">평촌대로</div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-400 text-sm mb-1">신고 내용</div>
                  <div className="text-white text-sm">산림 인접 밭에서 연기 발생, 강풍 영향으로 확산 위험</div>
                </div>
              </div>
            </div>
            )}

            {insight && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* CCTV Quick View */}
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6" style={{ borderWidth: '1px' }}>
                <h3 className="text-white font-semibold text-lg mb-4">CCTV Quick View (자동 선정)</h3>
                <div className="grid grid-cols-2 gap-3">
                  {cctvList.map((cctv) => (
                    <div
                      key={cctv.id}
                      onClick={() => setSelectedCCTV(cctv.id)}
                      className={`relative bg-[#242424] rounded-lg overflow-hidden cursor-pointer transition-all ${
                        selectedCCTV === cctv.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <Icon icon="mdi:cctv" className="w-8 h-8 text-gray-500" />
                      </div>
                      <div className="p-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white text-xs font-medium">{cctv.name}</span>
                          <span className="text-blue-400 text-xs">{cctv.relevance}%</span>
                        </div>
                        <div className="text-gray-400 text-xs">{cctv.location}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 스레드 구조 */}
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6" style={{ borderWidth: '1px' }}>
                <h3 className="text-white font-semibold text-lg mb-4">스레드 구조 (연관 이벤트 묶기)</h3>
                <div className="space-y-3">
                  {threadEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg border ${
                        event.isMain
                          ? 'bg-blue-500/10 border-blue-500/50'
                          : event.isEvidence
                            ? 'bg-yellow-500/10 border-yellow-500/50 ml-6'
                            : 'bg-[#242424] border-[#2a2a2a] ml-6'
                      }`}
                      style={{ borderWidth: '1px' }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {event.isMain && <Icon icon="mdi:star" className="w-4 h-4 text-blue-400" />}
                        {event.isEvidence && <Icon icon="mdi:eye" className="w-4 h-4 text-yellow-400" />}
                        <span className="text-white text-sm font-medium">{event.type}</span>
                        <span className="text-gray-400 text-xs">{event.timestamp}</span>
                      </div>
                      <div className="text-gray-300 text-sm">{event.title}</div>
                    </div>
                  ))}
                  <button className="w-full mt-3 px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 text-sm hover:bg-blue-500/30 transition-colors" style={{ borderWidth: '1px' }}>
                    스레드 묶기 제안 확인
                  </button>
                </div>
              </div>
            </div>
            )}

            {/* Pre-Actions */}
            {insight && (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 mb-6" style={{ borderWidth: '1px' }}>
              <h3 className="text-white font-semibold text-lg mb-4">Pre-Actions (기본 대응 준비)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {preActions.map((action) => (
                  <div
                    key={action.id}
                    className={`p-4 rounded-lg border ${
                      action.status === 'ready'
                        ? 'bg-green-500/10 border-green-500/50'
                        : 'bg-yellow-500/10 border-yellow-500/50'
                    }`}
                    style={{ borderWidth: '1px' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {action.status === 'ready' ? (
                        <Icon icon="mdi:check-circle" className="w-5 h-5 text-green-400" />
                      ) : (
                        <Icon icon="mdi:clock-outline" className="w-5 h-5 text-yellow-400" />
                      )}
                      <span className="text-white font-medium text-sm">{action.title}</span>
                    </div>
                    <div className="text-gray-400 text-xs">{action.description}</div>
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* 환경/기상 영향 분석 */}
            {insight && (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6" style={{ borderWidth: '1px' }}>
              <h3 className="text-white font-semibold text-lg mb-4">환경/기상 영향 분석</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {environmentImpacts.map((impact, index) => (
                  <div key={index} className="bg-[#242424] rounded-lg p-4">
                    <div className="text-gray-400 text-xs mb-1">{impact.factor}</div>
                    <div className="text-white font-medium mb-1">{impact.value}</div>
                    <div className="text-gray-300 text-xs mb-1">{impact.impact}</div>
                    {impact.riskChange !== 0 && (
                      <div className={`text-xs font-medium ${
                        impact.riskChange > 0 ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {impact.riskChange > 0 ? '+' : ''}{impact.riskChange}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="bg-[#242424] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">총 위험도 변동</span>
                  <span className={`text-lg font-bold ${
                    totalRiskChange > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {totalRiskChange > 0 ? '+' : ''}{totalRiskChange}%
                  </span>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>

        {/* 우측: 조건/필터 + AI 제안 액션 패널 */}
        <div className="w-80 flex-shrink-0 bg-[#1a1a1a] border-l border-[#2a2a2a] overflow-y-auto hidden" style={{ borderWidth: '1px' }}>
          <div className="p-4 border-b border-[#2a2a2a]" style={{ borderWidth: '1px' }}>
            <h2 className="text-white font-semibold text-sm mb-2">조건/필터</h2>
          </div>
          <div className="p-4 space-y-4">
            {/* 필터 */}
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">사건 유형</label>
                <select className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm" style={{ borderWidth: '1px' }}>
                  <option>전체</option>
                  <option>119-화재</option>
                  <option>112-미아</option>
                  <option>약자</option>
                  <option>배회</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">위험도</label>
                <select className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm" style={{ borderWidth: '1px' }}>
                  <option>전체</option>
                  <option>High (80+)</option>
                  <option>Medium (60-79)</option>
                  <option>Low (0-59)</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">연관 가능성</label>
                <select className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm" style={{ borderWidth: '1px' }}>
                  <option>전체</option>
                  <option>높음 (70%+)</option>
                  <option>중간 (50-69%)</option>
                  <option>낮음 (0-49%)</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">CCTV 범위</label>
                <select className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm" style={{ borderWidth: '1px' }}>
                  <option>전체</option>
                  <option>반경 100m</option>
                  <option>반경 300m</option>
                  <option>반경 500m</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">출동 반경</label>
                <select className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm" style={{ borderWidth: '1px' }}>
                  <option>전체</option>
                  <option>5km 이내</option>
                  <option>10km 이내</option>
                  <option>20km 이내</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-400 text-sm">
                  <input type="checkbox" className="rounded" />
                  스레드 여부
                </label>
              </div>
            </div>

            {/* AI 제안 액션 */}
            <div className="pt-4 border-t border-[#2a2a2a]" style={{ borderWidth: '1px' }}>
              <h3 className="text-white font-semibold text-sm mb-3">AI 제안 액션</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleActionClick('위험도 다시 계산')}
                  className="w-full px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 text-sm hover:bg-blue-500/30 transition-colors text-left"
                  style={{ borderWidth: '1px' }}
                >
                  🟦 위험도 다시 계산
                </button>
                <button
                  onClick={() => handleActionClick('연관 사건 분석')}
                  className="w-full px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 text-sm hover:bg-blue-500/30 transition-colors text-left"
                  style={{ borderWidth: '1px' }}
                >
                  🟦 연관 사건 분석
                </button>
                <button
                  onClick={() => handleActionClick('CCTV 연속 추적 시작')}
                  className="w-full px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 text-sm hover:bg-blue-500/30 transition-colors text-left"
                  style={{ borderWidth: '1px' }}
                >
                  🟦 CCTV 연속 추적 시작
                </button>
                <button
                  onClick={() => handleActionClick('119/112 구분 다시 판단')}
                  className="w-full px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 text-sm hover:bg-blue-500/30 transition-colors text-left"
                  style={{ borderWidth: '1px' }}
                >
                  🟦 119/112 구분 다시 판단
                </button>
                <button
                  onClick={() => handleActionClick('전파 초안 생성')}
                  className="w-full px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 text-sm hover:bg-blue-500/30 transition-colors text-left"
                  style={{ borderWidth: '1px' }}
                >
                  🟦 전파 초안 생성
                </button>
                <button
                  onClick={() => handleActionClick('사건 스레드 묶기 제안')}
                  className="w-full px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 text-sm hover:bg-blue-500/30 transition-colors text-left"
                  style={{ borderWidth: '1px' }}
                >
                  🟦 사건 스레드 묶기 제안
                </button>
                <button
                  onClick={() => handleActionClick('출동 경로 재계산')}
                  className="w-full px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 text-sm hover:bg-blue-500/30 transition-colors text-left"
                  style={{ borderWidth: '1px' }}
                >
                  🟦 출동 경로 재계산
                </button>
                <button
                  onClick={() => handleActionClick('환경 영향 분석 새로고침')}
                  className="w-full px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 text-sm hover:bg-blue-500/30 transition-colors text-left"
                  style={{ borderWidth: '1px' }}
                >
                  🟦 환경 영향 분석 새로고침
                </button>
              </div>
            </div>

            {/* AI 추천 액션 */}
            {aiRecommendedActions.length > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4" style={{ borderWidth: '1px' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon icon="mdi:robot" className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-medium text-sm">AI 추천 완료</span>
                </div>
                <div className="space-y-2">
                  {aiRecommendedActions.map((action, index) => (
                    <div key={index} className="text-sm text-gray-300 flex items-center gap-2">
                      <Icon icon="mdi:check-circle" className="w-4 h-4 text-green-400" />
                      {action}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function IncidentResponsePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-[#0f0f0f]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">로딩 중...</p>
        </div>
      </div>
    }>
      <IncidentResponsePageContent />
    </Suspense>
  );
}

