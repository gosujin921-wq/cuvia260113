'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface InsightCard {
  title: string;
  summary: string;
  similarCases?: string;
  responseTime?: string;
  pattern?: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  count?: number;
}

interface EventHistory {
  id: string;
  date: string;
  type: string;
  title: string;
  location: string;
  severity: string;
  source: string;
  details?: string;
}

interface TimelineEvent {
  time: string;
  event: string;
  description?: string;
}

interface SimilarCase {
  id: string;
  date: string;
  title: string;
  similarity: string;
  factors: string[];
}

const EventHistoryPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [insight, setInsight] = useState<InsightCard | null>(null);
  const [filters, setFilters] = useState<any[]>([]);
  const [aiRecommendedFilters, setAiRecommendedFilters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 이력 카테고리
  const categories: Category[] = [
    { id: 'all', name: '전체 사건 이력', icon: 'mdi:format-list-bulleted' },
    { id: 'type', name: '유형별 이력', icon: 'mdi:tag-multiple' },
    { id: 'location', name: '장소 기반 이력', icon: 'mdi:map-marker' },
    { id: 'time', name: '시간 기반 이력', icon: 'mdi:clock-outline' },
    { id: 'cctv', name: 'CCTV 이력 보기', icon: 'mdi:cctv' },
    { id: 'similar', name: '유사 사건 추천', icon: 'mdi:compare' },
    { id: 'thread', name: '스레드형 사건 이력', icon: 'mdi:link-variant' },
    { id: 'report', name: '전파·보고서 이력', icon: 'mdi:file-document' },
  ];

  // 가상 이력 데이터
  const eventHistory: EventHistory[] = [
    { id: '1', date: '2024-01-15', type: '화재', title: '동안구 아파트 화재', location: '동안구', severity: '긴급', source: '119' },
    { id: '2', date: '2024-01-12', type: '미아', title: '아동 실종 신고', location: '만안구', severity: '긴급', source: '112' },
    { id: '3', date: '2024-01-10', type: '화재', title: '강풍 화재 사건', location: '동안구', severity: '긴급', source: '119', details: '강풍 영향으로 확산' },
    { id: '4', date: '2024-01-08', type: '약자', title: '약자 쓰러짐', location: '비산동', severity: '경계', source: 'AI' },
    { id: '5', date: '2024-01-05', type: '배회', title: '배회 행동 감지', location: '동안구', severity: '경계', source: 'AI' },
  ];

  // 타임라인 데이터
  const timelineData: TimelineEvent[] = [
    { time: '12:31', event: '화재 감지', description: '배회자 포착' },
    { time: '12:32', event: '신고 접수', description: '119 신고' },
    { time: '12:34', event: '출동', description: '소방서 출동' },
    { time: '12:37', event: 'CCTV 포착', description: '현장 도착' },
    { time: '12:42', event: '진압', description: '화재 진압 완료' },
  ];

  // 유사 사건 데이터
  const similarCases: SimilarCase[] = [
    {
      id: '1',
      date: '2023-09-12',
      title: '강풍 화재 사건',
      similarity: '95%',
      factors: ['강풍 영향', '배회 → 화재', '야간'],
    },
    {
      id: '2',
      date: '2023-08-20',
      title: '동안구 아파트 화재',
      similarity: '87%',
      factors: ['강풍 영향', '배회 → 화재', '야간'],
    },
    {
      id: '3',
      date: '2023-07-15',
      title: '야간 화재 사건',
      similarity: '82%',
      factors: ['강풍 영향', '배회 → 화재', '야간'],
    },
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
    
    // AI 인사이트 생성
    if (lowerQuery.includes('작년') && lowerQuery.includes('동안구') && lowerQuery.includes('화재')) {
      setInsight({
        title: '동안구 화재 이력 분석',
        summary: '동안구에서 작년 발생한 화재는 총 312건이며, 그중 18건이 대형 화재였습니다.',
        similarCases: '현재 사건과 가장 유사한 케이스는 23년 9월 12일 발생한 강풍 화재 사건입니다.',
        responseTime: '당시 대응시간은 7분이었으며, 동일 패턴 경향이 확인됩니다.',
        pattern: '강풍일 + 배회 행동 → 화재 발생 패턴',
      });
      setSelectedCategory('location');
      setFilters([
        { id: 'period', label: '기간', value: '작년' },
        { id: 'location', label: '지역', value: '동안구' },
        { id: 'type', label: '유형', value: '화재' },
      ]);
      setAiRecommendedFilters(['대형 화재 필터 추천', '유사 패턴 사건 확인 추천']);
    } else if (lowerQuery.includes('비슷') || lowerQuery.includes('유사')) {
      setInsight({
        title: '유사 사건 분석',
        summary: '현재 사건과 유사한 패턴을 가진 사건 12건을 찾았습니다.',
        similarCases: '가장 유사한 케이스는 2023년 9월 12일 발생한 강풍 화재 사건입니다.',
        responseTime: '평균 대응시간: 7분',
        pattern: '강풍 영향 + 배회 행동 → 화재 발생',
      });
      setSelectedCategory('similar');
      setAiRecommendedFilters(['유사 사건 비교 추천', '동일 패턴 사건 확인']);
    } else if (lowerQuery.includes('지난달') && lowerQuery.includes('미아')) {
      setInsight({
        title: '지난달 미아 사건 이력',
        summary: '지난달 미아 사건은 총 28건 발생했습니다.',
        similarCases: '주로 야간 시간대에 발생하며, 평균 발견 시간은 45분입니다.',
        responseTime: '평균 대응시간: 12분',
        pattern: '야간 시간대 집중 발생',
      });
      setSelectedCategory('type');
      setFilters([
        { id: 'period', label: '기간', value: '지난달' },
        { id: 'type', label: '유형', value: '미아' },
      ]);
    } else {
      // 기본 인사이트
      setInsight({
        title: '전체 사건 이력',
        summary: '최근 1년간 발생한 사건은 총 812건입니다.',
        similarCases: '현재 사건과 유사한 패턴을 가진 사건이 12건 있습니다.',
        responseTime: '평균 대응시간: 8분',
        pattern: '주요 발생 유형: 화재, 미아, 약자',
      });
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

  const handleEventSelect = (eventId: string) => {
    setSelectedEvent(eventId);
  };

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
            <Icon icon="mdi:history" className="w-6 h-6 text-blue-400" />
            <span className="text-xl font-semibold text-white">이벤트 이력</span>
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
        {/* 좌측: 이력 카테고리 패널 */}
        <div className="w-64 flex-shrink-0 bg-[#1a1a1a] border-r border-[#31353a] overflow-y-auto" style={{ borderWidth: '1px' }}>
          <div className="p-4 border-b border-[#31353a]" style={{ borderWidth: '1px' }}>
            <h2 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
              <Icon icon="mdi:folder" className="w-5 h-5 text-blue-400" />
              이력 카테고리
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
          <div className="p-4 border-b border-[#31353a] bg-[#1a1a1a]" style={{ borderWidth: '1px' }}>
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
                  placeholder="이력을 조회하세요... (예: 작년 동안구 화재 중 큰 거 뭐 있었지?)"
                  className="w-full pl-12 pr-14 py-3 bg-[#0f0f0f] border border-[#31353a] rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/20 transition-all"
                  style={{ borderWidth: '1px' }}
                  disabled={isLoading}
                />
                {input && (
                  <button
                    onClick={() => {
                      setInput('');
                      setInsight(null);
                      setFilters([]);
                      setSelectedEvent(null);
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
            {/* 상단: AI 인사이트 카드 */}
            {insight && (
              <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6" style={{ borderWidth: '1px' }}>
                <div className="flex items-start gap-3 mb-4">
                  <Icon icon="mdi:lightbulb-on" className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-2">📌 AI 인사이트</h3>
                    <div className="space-y-2 text-sm">
                      <div className="text-white font-medium">{insight.summary}</div>
                      {insight.similarCases && (
                        <div className="text-gray-300">{insight.similarCases}</div>
                      )}
                      {insight.responseTime && (
                        <div className="text-gray-300">{insight.responseTime}</div>
                      )}
                      {insight.pattern && (
                        <div className="text-blue-400 font-medium">→ 패턴: {insight.pattern}</div>
                      )}
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

            {/* 중앙: 이력 리스트 및 타임라인 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* 이벤트 이력 리스트 */}
              <div className="bg-[#1a1a1a] border border-[#31353a] rounded-lg p-6" style={{ borderWidth: '1px' }}>
                <h3 className="text-white font-semibold text-lg mb-4">사건 이력 리스트</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#31353a]" style={{ borderWidth: '1px' }}>
                        <th className="text-left py-2 text-gray-400 font-medium">날짜</th>
                        <th className="text-left py-2 text-gray-400 font-medium">유형</th>
                        <th className="text-left py-2 text-gray-400 font-medium">제목</th>
                        <th className="text-left py-2 text-gray-400 font-medium">위치</th>
                        <th className="text-left py-2 text-gray-400 font-medium">위험도</th>
                        <th className="text-left py-2 text-gray-400 font-medium">출처</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventHistory.map((event) => (
                        <tr
                          key={event.id}
                          onClick={() => handleEventSelect(event.id)}
                          className={`border-b border-[#31353a] cursor-pointer transition-colors ${
                            selectedEvent === event.id
                              ? 'bg-blue-500/20 hover:bg-blue-500/30'
                              : 'hover:bg-[#242424]'
                          }`}
                          style={{ borderWidth: '1px' }}
                        >
                          <td className="py-3 text-gray-300">{event.date}</td>
                          <td className="py-3 text-white">{event.type}</td>
                          <td className="py-3 text-white font-medium">{event.title}</td>
                          <td className="py-3 text-gray-400">{event.location}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              event.severity === '긴급' ? 'bg-red-500/20 text-red-400' :
                              event.severity === '경계' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {event.severity}
                            </span>
                          </td>
                          <td className="py-3 text-gray-400">{event.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 타임라인 뷰 */}
              {selectedEvent && (
                <div className="bg-[#1a1a1a] border border-[#31353a] rounded-lg p-6" style={{ borderWidth: '1px' }}>
                  <h3 className="text-white font-semibold text-lg mb-4">사건 타임라인</h3>
                  <div className="space-y-4">
                    {timelineData.map((item, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full" />
                          {index < timelineData.length - 1 && (
                            <div className="w-0.5 h-12 bg-[#2a2a2a] mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-blue-400 font-medium">{item.time}</span>
                            <span className="text-white font-medium">{item.event}</span>
                          </div>
                          {item.description && (
                            <div className="text-gray-400 text-sm">{item.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 유사 사건 비교 카드 */}
            {insight && similarCases.length > 0 && (
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 mb-6" style={{ borderWidth: '1px' }}>
                <h3 className="text-white font-semibold text-lg mb-4">유사 사건 비교</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {similarCases.map((case_) => (
                    <div key={case_.id} className="bg-[#242424] border border-[#2a2a2a] rounded-lg p-4" style={{ borderWidth: '1px' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-xs">{case_.date}</span>
                        <span className="text-blue-400 text-xs font-medium">{case_.similarity} 유사</span>
                      </div>
                      <div className="text-white font-medium mb-3">{case_.title}</div>
                      <div className="space-y-1">
                        {case_.factors.map((factor, idx) => (
                          <div key={idx} className="text-gray-400 text-xs flex items-center gap-2">
                            <Icon icon="mdi:check-circle" className="w-3 h-3 text-green-400" />
                            {factor}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CCTV 이력 및 문서 기록 */}
            {selectedEvent && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CCTV 이력 미리보기 */}
                <div className="bg-[#1a1a1a] border border-[#31353a] rounded-lg p-6" style={{ borderWidth: '1px' }}>
                  <h3 className="text-white font-semibold text-lg mb-4">CCTV 이력</h3>
                  <div className="bg-[#242424] rounded-lg p-4 aspect-video flex items-center justify-center">
                    <div className="text-center">
                      <Icon icon="mdi:cctv" className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                      <div className="text-gray-400 text-sm">CCTV-021</div>
                      <div className="text-gray-500 text-xs mt-1">2024-01-10 12:37</div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 px-3 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg text-sm transition-colors">
                      재생
                    </button>
                    <button className="flex-1 px-3 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg text-sm transition-colors">
                      프레임 탐색
                    </button>
                  </div>
                </div>

                {/* 문서/전파 기록 */}
                <div className="bg-[#1a1a1a] border border-[#31353a] rounded-lg p-6" style={{ borderWidth: '1px' }}>
                  <h3 className="text-white font-semibold text-lg mb-4">전파·보고서 기록</h3>
                  <div className="space-y-3">
                    <div className="bg-[#242424] border border-[#2a2a2a] rounded-lg p-4 cursor-pointer hover:bg-[#2a2a2a] transition-colors" style={{ borderWidth: '1px' }}>
                      <div className="flex items-center gap-3">
                        <Icon icon="mdi:file-document" className="w-5 h-5 text-blue-400" />
                        <div className="flex-1">
                          <div className="text-white text-sm font-medium">119 전파문</div>
                          <div className="text-gray-400 text-xs">2024-01-10 12:32</div>
                        </div>
                        <Icon icon="mdi:chevron-right" className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                    <div className="bg-[#242424] border border-[#2a2a2a] rounded-lg p-4 cursor-pointer hover:bg-[#2a2a2a] transition-colors" style={{ borderWidth: '1px' }}>
                      <div className="flex items-center gap-3">
                        <Icon icon="mdi:file-document-outline" className="w-5 h-5 text-yellow-400" />
                        <div className="flex-1">
                          <div className="text-white text-sm font-medium">사건 보고서</div>
                          <div className="text-gray-400 text-xs">2024-01-10 13:00</div>
                        </div>
                        <Icon icon="mdi:chevron-right" className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 우측: 필터/조건 패널 */}
        <div className="w-80 flex-shrink-0 bg-[#1a1a1a] border-l border-[#2a2a2a] overflow-y-auto hidden" style={{ borderWidth: '1px' }}>
          <div className="p-4 border-b border-[#2a2a2a]" style={{ borderWidth: '1px' }}>
            <h2 className="text-white font-semibold text-sm mb-2">필터/조건</h2>
          </div>
          <div className="p-4 space-y-4">
            {/* AI 추천 필터 */}
            {aiRecommendedFilters.length > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4" style={{ borderWidth: '1px' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon icon="mdi:robot" className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-medium text-sm">AI 추천 필터</span>
                </div>
                <div className="space-y-2">
                  {aiRecommendedFilters.map((filter, index) => (
                    <div key={index} className="text-sm text-gray-300">{filter}</div>
                  ))}
                </div>
              </div>
            )}

            {/* 필수 필터 */}
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">기간</label>
                <select className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm" style={{ borderWidth: '1px' }}>
                  <option>오늘</option>
                  <option>지난주</option>
                  <option>지난달</option>
                  <option>1년</option>
                  <option>사용자 지정</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">위치/지역</label>
                <select className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm" style={{ borderWidth: '1px' }}>
                <option>전체</option>
                <option>동안구</option>
                <option>만안구</option>
                <option>비산동</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">사건 유형</label>
                <select className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm" style={{ borderWidth: '1px' }}>
                  <option>전체</option>
                  <option>화재</option>
                  <option>미아</option>
                  <option>약자</option>
                  <option>배회</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">위험도</label>
                <select className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm" style={{ borderWidth: '1px' }}>
                  <option>전체</option>
                  <option>긴급</option>
                  <option>경계</option>
                  <option>주의</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">출처</label>
                <select className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm" style={{ borderWidth: '1px' }}>
                  <option>전체</option>
                  <option>112</option>
                  <option>119</option>
                  <option>AI</option>
                  <option>NDMS</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">CCTV ID</label>
                <input
                  type="text"
                  placeholder="CCTV-021"
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm placeholder-gray-500"
                  style={{ borderWidth: '1px' }}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-400 text-sm">
                  <input type="checkbox" className="rounded" />
                  스레드 여부 (묶인 사건만)
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function EventHistoryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-[#0f0f0f]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">로딩 중...</p>
        </div>
      </div>
    }>
      <EventHistoryPageContent />
    </Suspense>
  );
}

