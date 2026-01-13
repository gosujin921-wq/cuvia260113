"use client";

import React, { Suspense, useRef, useEffect as useEffectReact } from "react";
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface InsightCard {
  title: string;
  value: string;
  change: string;
  reason?: string;
  location?: string;
  timeRange?: string;
  impact?: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  count?: number;
}

interface Filter {
  id: string;
  label: string;
  type: 'period' | 'region' | 'type' | 'severity' | 'source' | 'detection';
  value: string;
  options?: string[];
}

interface TrendEvent {
  id: string;
  type: string;
  change: string;
  icon: string;
  color: string;
}

const StatisticsPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('overview');
  const [insight, setInsight] = useState<InsightCard | null>(null);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [aiRecommendedFilters, setAiRecommendedFilters] = useState<string[]>([]);
  const [isResponding, setIsResponding] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: string; buttons?: string[]; data?: any; chartData?: any }>>([]);
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);

  const addMessage = (role: 'assistant' | 'user', content: string, buttons?: string[], chartData?: any) => {
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
      chartData
    }]);
  };

  // 통계 카테고리
  const categories: Category[] = [
    { id: 'overview', name: '전체 사건 통계', icon: 'mdi:chart-box' },
    { id: 'type', name: '유형별 통계', icon: 'mdi:format-list-bulleted' },
    { id: 'region', name: '지역별 통계', icon: 'mdi:map' },
    { id: 'time', name: '시간대별 통계', icon: 'mdi:clock-outline' },
    { id: 'sensor', name: '센서/AI 감지 통계', icon: 'mdi:radar' },
    { id: 'response', name: '응답시간/처리시간', icon: 'mdi:timer' },
    { id: 'monthly', name: 'Monthly 종합 리포트', icon: 'mdi:file-document' },
    { id: 'heatmap', name: '고위험 구역 분석', icon: 'mdi:fire' },
  ];

  // 최근 증가 이벤트
  const trendEvents: TrendEvent[] = [
    { id: '1', type: '화재', change: '18% 증가', icon: 'mdi:fire', color: 'text-red-400' },
    { id: '2', type: '112 신고', change: '11% 증가', icon: 'mdi:phone', color: 'text-blue-400' },
    { id: '3', type: '배회 감지', change: '25% 증가', icon: 'mdi:eye', color: 'text-yellow-400' },
  ];

  // 가상 데이터
  const weeklyData = [
    { day: '월', count: 12 },
    { day: '화', count: 18 },
    { day: '수', count: 15 },
    { day: '목', count: 22 },
    { day: '금', count: 19 },
    { day: '토', count: 14 },
    { day: '일', count: 10 },
  ];

  const categoryData = [
    { category: '화재', count: 35, color: 'bg-red-500' },
    { category: '미아', count: 28, color: 'bg-yellow-500' },
    { category: '약자', count: 22, color: 'bg-blue-500' },
    { category: '배회', count: 15, color: 'bg-purple-500' },
  ];

  const maxCount = Math.max(...weeklyData.map(d => d.count));
  const totalCount = weeklyData.reduce((sum, d) => sum + d.count, 0);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chatMessages, isResponding]);

  useEffect(() => {
    const query = searchParams.get('query');
    if (query) {
      setInput(query);
      handleSendMessage(query);
    }
  }, [searchParams]);

  const generateStatisticsReply = (query: string): { content: string; insight: InsightCard | null; chartData?: any } => {
    const lowerQuery = query.toLowerCase();
    let insightData: InsightCard | null = null;
    let content = '';
    let chartData = null;
    
    // "통계" + "화재" 키워드 감지 시 안양시 화재 통계 시각화
    if (lowerQuery.includes('통계') && lowerQuery.includes('화재')) {
      const monthlyFireData = [
        { month: '1월', count: 28, area: '동안구' },
        { month: '2월', count: 32, area: '만안구' },
        { month: '3월', count: 45, area: '동안구' },
        { month: '4월', count: 38, area: '동안구' },
        { month: '5월', count: 52, area: '만안구' },
        { month: '6월', count: 48, area: '동안구' },
        { month: '7월', count: 61, area: '동안구' },
        { month: '8월', count: 55, area: '만안구' },
        { month: '9월', count: 42, area: '동안구' },
        { month: '10월', count: 39, area: '만안구' },
        { month: '11월', count: 35, area: '동안구' },
        { month: '12월', count: 31, area: '동안구' },
      ];
      
      const areaFireData = [
        { area: '동안구', count: 328, percentage: 48.2 },
        { area: '만안구', count: 285, percentage: 41.8 },
        { area: '기타', count: 68, percentage: 10.0 },
      ];
      
      const timeFireData = [
        { time: '00-03시', count: 15 },
        { time: '03-06시', count: 8 },
        { time: '06-09시', count: 42 },
        { time: '09-12시', count: 68 },
        { time: '12-15시', count: 95 },
        { time: '15-18시', count: 128 },
        { time: '18-21시', count: 142 },
        { time: '21-24시', count: 123 },
      ];
      
      chartData = {
        type: 'fire-statistics',
        monthlyData: monthlyFireData,
        areaData: areaFireData,
        timeData: timeFireData,
      };
      
      insightData = {
        title: '2024년 안양시 화재 통계',
        value: '2024년 총 681건 발생',
        change: '전년 대비 +12.3%',
        reason: '동안구 지역 집중 발생 (48.2%)',
        location: '오후 15-21시 시간대 집중',
        timeRange: '15-21시: 365건 (53.6%)',
        impact: '관제 강화 필요',
      };
      
      content = `📊 2024년 안양시 화재 통계\n\n총 발생 건수: 681건\n전년 대비: +12.3% 증가\n\n주요 발생 지역:\n• 동안구: 328건 (48.2%)\n• 만안구: 285건 (41.8%)\n\n주요 발생 시간대:\n• 18-21시: 142건\n• 15-18시: 128건\n• 21-24시: 123건`;
      
      setSelectedCategory('type');
    } else if (lowerQuery.includes('화재') && (lowerQuery.includes('늘') || lowerQuery.includes('증가'))) {
      insightData = {
        title: '화재 발생 추이',
        value: '지난달 대비 화재 32% 증가',
        change: '+32%',
        reason: '강풍일 18건 중 12건 화재 발생',
        location: '동안구·비산동',
        timeRange: '20~22시 집중',
        impact: '관제 시간 증가: +11%',
      };
      content = `📊 화재 발생 추이 분석\n\n${insightData.value}\n\n증가 원인: ${insightData.reason}\n주요 지역: ${insightData.location}\n사고 시간대: ${insightData.timeRange}\n→ ${insightData.impact}`;
      setSelectedCategory('type');
      setAiRecommendedFilters(['강풍일 필터 추천', '화재 관련 통계 확인 추천']);
    } else if (lowerQuery.includes('112') && lowerQuery.includes('위험')) {
      insightData = {
        title: '112 신고 위험도 분석',
        value: '112 신고 중 긴급 184건, 전체의 12.4%',
        change: '12.4%',
        reason: '주요 원인: 배회 행동 감지 증가',
        location: '동안구·만안구',
        timeRange: '야간 시간대 집중',
        impact: '긴급 대응 필요',
      };
      content = `📊 112 신고 위험도 분석\n\n${insightData.value}\n\n증가 원인: ${insightData.reason}\n주요 지역: ${insightData.location}\n사고 시간대: ${insightData.timeRange}\n→ ${insightData.impact}`;
      setSelectedCategory('type');
      setFilters([
        { id: 'source', label: '출처', type: 'source', value: '112' },
        { id: 'severity', label: '우선순위', type: 'severity', value: '긴급' },
      ]);
    } else {
      insightData = {
        title: '전체 사건 통계',
        value: `이번주 총 ${totalCount}건 발생`,
        change: '일평균 ' + Math.round(totalCount / 7) + '건',
        reason: '주요 발생 유형: 화재, 미아, 약자',
        location: '전 지역',
        timeRange: '주간 집중',
        impact: '안정적 관리 중',
      };
      content = `📊 전체 사건 통계\n\n${insightData.value}\n\n일평균: ${insightData.change}\n주요 발생 유형: ${insightData.reason}\n주요 지역: ${insightData.location}\n사고 시간대: ${insightData.timeRange}\n→ ${insightData.impact}`;
    }
    
    return { content, insight: insightData, chartData };
  };

  const handleSendMessage = (messageText?: string) => {
    const text = (messageText ?? input).trim();
    if (!text || isResponding) return;

    addMessage('user', text);
    setInput('');
    setInsight(null);

    setIsResponding(true);
    setTimeout(() => {
      const { content, insight: insightData, chartData } = generateStatisticsReply(text);
      setInsight(insightData);
      addMessage('assistant', content, undefined, chartData);
      setIsResponding(false);
    }, 700);
  };


  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // 카테고리별 차트 업데이트
  };

  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prev => prev.map(f => f.id === filterId ? { ...f, value } : f));
  };

  return (
    <div className="flex flex-col h-screen bg-[#161719] overflow-hidden relative">
      {/* 우측 하단 로고 */}
      <div className="fixed bottom-6 right-6 z-10">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <g transform="translate(8.5, 13)">
            <path className="paused" d="M13.3 15.2 L2.34 1 V12.6" fill="none" stroke="url(#next_logo_paint0_linear_1357_10853)" strokeWidth="1.86" mask="url(#next_logo_mask0)" strokeDasharray="29.6" strokeDashoffset="29.6"></path>
            <path className="paused" d="M11.825 1.5 V13.1" strokeWidth="1.86" stroke="url(#next_logo_paint1_linear_1357_10853)" strokeDasharray="11.6" strokeDashoffset="11.6"></path>
          </g>
          <defs>
            <linearGradient id="next_logo_paint0_linear_1357_10853" x1="9.95555" y1="11.1226" x2="15.4778" y2="17.9671" gradientUnits="userSpaceOnUse">
              <stop stopColor="white"></stop>
              <stop offset="0.604072" stopColor="white" stopOpacity="0"></stop>
              <stop offset="1" stopColor="white" stopOpacity="0"></stop>
            </linearGradient>
            <linearGradient id="next_logo_paint1_linear_1357_10853" x1="11.8222" y1="1.40039" x2="11.791" y2="9.62542" gradientUnits="userSpaceOnUse">
              <stop stopColor="white"></stop>
              <stop offset="1" stopColor="white" stopOpacity="0"></stop>
            </linearGradient>
            <mask id="next_logo_mask0">
              <rect width="100%" height="100%" fill="white"></rect>
              <rect width="5" height="1.5" fill="black"></rect>
            </mask>
          </defs>
        </svg>
      </div>
      <div className="flex-1 flex overflow-hidden">
        {/* 좌측: 통계 카테고리 패널 */}
        <aside className="flex flex-col flex-shrink-0 border-r border-[#31353a] pl-4 pr-5" style={{ width: '258px' }}>
          <div className="py-4 px-3">
            <Link href="/" className="w-24 h-5 flex items-center justify-start">
              <img 
                src="/logo.svg" 
                alt="CUVIA Logo" 
                className="h-5 w-auto object-contain"
              />
            </Link>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="w-full bg-[#161719] flex flex-col h-full">
              <div className="px-3 pt-3 pb-4 border-b border-[#31353a]" style={{ paddingLeft: '14px' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="mdi:chart-line" className="w-5 h-5 text-blue-400" />
                  <span className="text-white text-base font-semibold">통계조회</span>
                </div>
              </div>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`w-full text-left border-b pt-3 pb-3 pr-3 transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'bg-blue-500/10 border-blue-500/50 ring-2 ring-blue-500/30'
                        : 'bg-transparent border-[#2f3136] shadow-[0_4px_14px_-8px_rgba(0,0,0,0.8)] hover:bg-[#24272d] hover:border-[#4f7cff] hover:shadow-[0_6px_18px_-6px_rgba(79,124,255,0.35)]'
                    }`}
                    style={{ paddingLeft: '14px' }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon icon={category.icon} className={`w-5 h-5 ${
                        selectedCategory === category.id ? 'text-blue-400' : 'text-gray-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                        selectedCategory === category.id ? 'text-blue-400' : 'text-gray-400 hover:text-white'
                      }`}>{category.name}</span>
                    </div>
                  </button>
                ))}
                {/* Agent Hub 메뉴 */}
                <div className="px-3 pt-4" style={{ paddingLeft: '14px' }}>
                  <Link
                    href="/agent-hub"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Agent Hub
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* 중앙: 메인 컨텐츠 영역 (챗봇 형태) */}
        <main className="flex-1 flex flex-col min-w-0 bg-white">
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 pr-[21rem] space-y-6" style={{ paddingTop: '52px' }}>
            {/* AI Agent 헤더 */}
            <div className="flex items-center gap-2 text-gray-700 text-sm">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C62F0] to-[#5A3FEA] flex items-center justify-center text-white">
                <Icon icon="mdi:sparkles" className="w-4 h-4" />
              </div>
              <span className="text-gray-900">통계조회 Agent</span>
            </div>

            {/* 통계 인사이트 차트 (항상 표시) */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 전체 사건 추이 */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6" style={{ borderWidth: '1px' }}>
                  <h3 className="text-gray-900 font-semibold text-lg mb-6">전체 사건 추이</h3>
                  <div className="flex items-end justify-between gap-2 h-48">
                    {weeklyData.map((data, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div className="relative w-full flex items-end justify-center" style={{ height: '150px' }}>
                          <div
                            className="w-full bg-blue-500 rounded-t-lg transition-all duration-500 hover:bg-blue-400"
                            style={{
                              height: `${(data.count / maxCount) * 100}%`,
                              minHeight: '4px',
                            }}
                          />
                          <div className="absolute -bottom-6 text-xs text-gray-600">{data.count}</div>
                        </div>
                        <div className="text-sm text-gray-700 mt-8">{data.day}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 유형별 비율 */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6" style={{ borderWidth: '1px' }}>
                  <h3 className="text-gray-900 font-semibold text-lg mb-6">유형별 비율</h3>
                  <div className="space-y-4">
                    {categoryData.map((data, index) => {
                      const maxCategoryCount = Math.max(...categoryData.map(d => d.count));
                      return (
                        <div key={index} className="flex items-center gap-4">
                          <div className="w-20 text-sm text-gray-700">{data.category}</div>
                          <div className="flex-1 relative">
                            <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${data.color} rounded-full transition-all duration-500 flex items-center justify-end pr-3`}
                                style={{ width: `${(data.count / maxCategoryCount) * 100}%` }}
                              >
                                <span className="text-white text-xs font-medium">{data.count}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 최근 증가 이벤트 Top3 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6" style={{ borderWidth: '1px' }}>
                <h3 className="text-gray-900 font-semibold text-lg mb-4">최근 증가 이벤트 Top3</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {trendEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg" style={{ borderWidth: '1px' }}>
                      <Icon icon={event.icon} className={`w-6 h-6 ${event.color}`} />
                      <div>
                        <div className="text-gray-900 font-medium">{event.type}</div>
                        <div className={`text-sm ${event.color}`}>{event.change}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-200"></div>

            {/* 채팅 메시지 영역 */}
            <div className="space-y-3">
              <div className="space-y-3">
                {chatMessages.map((message) => (
                  <div key={message.id} className="space-y-2">
                    <div
                      className={`flex ${message.role === 'user' ? 'justify-end' : ''}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl border text-sm ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-[#7C62F0] to-[#5A3FEA] text-white border-transparent'
                            : 'bg-gray-100 text-gray-900 border-gray-200'
                        }`}
                        style={{ borderWidth: '1px' }}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-purple-100' : 'text-gray-500'}`}>
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
                              handleSendMessage(button);
                            }}
                            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            style={{ borderWidth: '1px' }}
                          >
                            {button}
                          </button>
                        ))}
                      </div>
                    )}
                    {message.role === 'assistant' && message.chartData && message.chartData.type === 'fire-statistics' && (
                      <div className="mt-3 space-y-4">
                        {/* 월별 화재 발생 추이 */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4" style={{ borderWidth: '1px' }}>
                          <h4 className="text-gray-900 font-semibold text-sm mb-4">월별 화재 발생 추이</h4>
                          <div className="flex items-end justify-between gap-1 h-32">
                            {message.chartData.monthlyData.map((data: any, index: number) => {
                              const maxCount = Math.max(...message.chartData.monthlyData.map((d: any) => d.count));
                              return (
                                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                                  <div className="relative w-full flex items-end justify-center" style={{ height: '100px' }}>
                                    <div
                                      className="w-full bg-red-500 rounded-t transition-all duration-500 hover:bg-red-400"
                                      style={{
                                        height: `${(data.count / maxCount) * 100}%`,
                                        minHeight: '4px',
                                      }}
                                    />
                                    <div className="absolute -bottom-5 text-xs text-gray-600">{data.count}</div>
                                  </div>
                                  <div className="text-xs text-gray-600 mt-6 transform -rotate-45 origin-center">{data.month}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 지역별 화재 발생 현황 */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4" style={{ borderWidth: '1px' }}>
                          <h4 className="text-gray-900 font-semibold text-sm mb-4">지역별 화재 발생 현황</h4>
                          <div className="space-y-3">
                            {message.chartData.areaData.map((data: any, index: number) => (
                              <div key={index} className="flex items-center gap-3">
                                <div className="w-16 text-sm text-gray-700">{data.area}</div>
                                <div className="flex-1 relative">
                                  <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-red-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                                      style={{ width: `${data.percentage}%` }}
                                    >
                                      <span className="text-white text-xs font-medium">{data.count}건 ({data.percentage}%)</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 시간대별 화재 발생 현황 */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4" style={{ borderWidth: '1px' }}>
                          <h4 className="text-gray-900 font-semibold text-sm mb-4">시간대별 화재 발생 현황</h4>
                          <div className="space-y-2">
                            {message.chartData.timeData.map((data: any, index: number) => {
                              const maxCount = Math.max(...message.chartData.timeData.map((d: any) => d.count));
                              return (
                                <div key={index} className="flex items-center gap-3">
                                  <div className="w-16 text-xs text-gray-700">{data.time}</div>
                                  <div className="flex-1 relative">
                                    <div className="h-5 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-orange-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                                        style={{ width: `${(data.count / maxCount) * 100}%` }}
                                      >
                                        <span className="text-white text-xs font-medium">{data.count}건</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isResponding && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                )}
              </div>
            </div>

            {/* 스크롤 앵커 */}
            <div ref={bottomRef} className="h-1" />
          </div>

          {/* 빠른 명령 + 자연어 입력 */}
          <div className="border-t border-gray-200 bg-white p-4 pr-[21rem] sticky bottom-0 left-0 right-0" style={{ borderWidth: '1px' }}>
            <div className="flex flex-wrap gap-2 mb-3">
              {['요즘 화재가 늘었어?', '112 신고 위험도 알려줘', '전체 사건 통계', '지역별 통계'].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => handleSendMessage(cmd)}
                  className="px-3 py-1.5 rounded-full text-xs text-gray-700 transition-colors border border-gray-300 bg-gray-50 hover:bg-gray-100"
                  style={{ borderWidth: '1px' }}
                >
                  {cmd}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="통계를 조회하세요... (예: 요즘 화재가 늘었어?)"
                  className="flex-1 bg-gray-50 border border-gray-300 rounded-full px-4 py-3 text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white"
                  style={{ borderWidth: '1px' }}
                  disabled={isResponding}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isResponding}
                className={`px-4 py-2 rounded-full text-sm transition-colors flex items-center justify-center gap-2 ${
                  isResponding 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-gradient-to-br from-[#7C62F0] to-[#5A3FEA] hover:from-[#8B72F5] hover:to-[#6A4FFA] text-white'
                }`}
              >
                <Icon icon="mdi:sparkles" className="w-4 h-4" />
                전송
              </button>
            </div>
          </div>
        </main>

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
                  <option>이번주</option>
                  <option>지난주</option>
                  <option>이번달</option>
                  <option>지난달</option>
                  <option>올해</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">지역</label>
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
                <label className="text-gray-400 text-sm mb-2 block">심각도</label>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function StatisticsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-[#0f0f0f]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">로딩 중...</p>
        </div>
      </div>
    }>
      <StatisticsPageContent />
    </Suspense>
  );
}
