

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Event, EventPriority } from '@/types';
import { getEventById, getEventCategory, getAIInsightKeywords, formatEventDateTime } from '@/lib/events-data';

interface EventListProps {
  events: Event[];
  selectedEventId?: string;
  onEventSelect?: (eventId: string) => void;
  onEventHover?: (eventId: string | null) => void;
}

const EventList = ({ events, selectedEventId, onEventSelect, onEventHover }: EventListProps) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const eventItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const agentPathByDomain: Record<string, string> = {
    A: '/agent-112',
    B: '/agent-119',
    C: '/agent-vulnerable',
    D: '/agent-ai-behavior',
    E: '/agent-disaster',
    F: '/agent-city',
  };
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | '긴급' | '경계' | '주의' | 'GENERAL'>('ALL');
  // 이벤트 정렬: 특정 이벤트 최우선 > 우선순위 > 경보 수준 > 최신순
  const sortedEvents = [...events].sort((a, b) => {
    // Evidence는 가장 아래로
    if (a.status === 'EVIDENCE' && b.status !== 'EVIDENCE') return 1;
    if (b.status === 'EVIDENCE' && a.status !== 'EVIDENCE') return -1;
    
    // 특정 이벤트를 최우선으로 (오토바이 도주, 은행강도 연관의심)
    const topPriorityTitles = ['오토바이 도주', '은행강도 연관의심', '은행 강도'];
    const aIsTopPriority = topPriorityTitles.some(title => a.title?.includes(title));
    const bIsTopPriority = topPriorityTitles.some(title => b.title?.includes(title));
    
    if (aIsTopPriority && !bIsTopPriority) return -1;
    if (!aIsTopPriority && bIsTopPriority) return 1;
    
    // 우선순위 순서
    const priorityOrder: Record<EventPriority, number> = { 긴급: 3, 경계: 2, 주의: 1, 일반: 0 };
    const priorityDiff = (priorityOrder[b.priority] ?? 0) - (priorityOrder[a.priority] ?? 0);
    if (priorityDiff !== 0) return priorityDiff;
    
    // 최신순 (timestamp 숫자로 변환)
    return parseInt(b.timestamp.replace(':', '')) - parseInt(a.timestamp.replace(':', ''));
  });

  // 메인 이벤트와 증거 이벤트 그룹화
  const groupedEvents: Array<{ main: Event; evidence?: Event[] }> = [];
  const processedEventIds = new Set<string>();
  
  sortedEvents.forEach((event) => {
    // 이미 처리된 이벤트는 스킵
    if (processedEventIds.has(event.id)) return;
    
    if (event.status === 'EVIDENCE') {
      // 증거 이벤트는 해당 메인 이벤트에 연결
      const mainEvent = sortedEvents.find((e) => 
        e.id !== event.id && 
        !processedEventIds.has(e.id) &&
        e.evidenceEvents?.includes(event.id)
      );
      if (mainEvent) {
        processedEventIds.add(event.id);
        processedEventIds.add(mainEvent.id);
        
        // 해당 메인 이벤트의 모든 증거 이벤트 수집
        const allEvidence = sortedEvents.filter((e) => 
          e.status === 'EVIDENCE' && 
          e.id !== event.id &&
          mainEvent.evidenceEvents?.includes(e.id)
        );
        groupedEvents.push({ 
          main: mainEvent, 
          evidence: [event, ...allEvidence].filter((e, idx, arr) => 
            arr.findIndex(a => a.id === e.id) === idx // 중복 제거
          )
        });
      }
    } else {
      // 메인 이벤트
      processedEventIds.add(event.id);
      
      // 해당 메인 이벤트의 모든 증거 이벤트 수집
      const evidence = sortedEvents.filter((e) => 
        e.status === 'EVIDENCE' && 
        !processedEventIds.has(e.id) &&
        event.evidenceEvents?.includes(e.id)
      );
      
      // 증거 이벤트도 처리됨으로 표시
      evidence.forEach(evt => processedEventIds.add(evt.id));
      
      groupedEvents.push({ 
        main: event, 
        evidence: evidence.length > 0 ? evidence : undefined 
      });
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case '긴급':
        return 'border-red-500 bg-red-500/10';
      case '경계':
        return 'border-yellow-500 bg-yellow-500/10';
      case '주의':
        return 'border-blue-500 bg-blue-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return { label: 'NEW', color: 'bg-blue-600 text-white' };
      case 'MONITORING':
        return { label: '모니터링', color: 'bg-yellow-600 text-white' };
      case 'EVIDENCE':
        return { label: '증거', color: 'bg-gray-600 text-white' };
      default:
        return { label: status, color: 'bg-gray-600 text-white' };
    }
  };

  const getTypeColor = (type: string) => {
    if (type.includes('화재') || type.includes('구조')) {
      return 'bg-red-600 text-white font-semibold';
    }
    if (type.includes('미아') || type.includes('치안')) {
      return 'bg-blue-600 text-white font-semibold';
    }
    if (type.includes('약자')) {
      return 'bg-orange-600 text-white font-semibold';
    }
    if (type.includes('AI')) {
      return 'bg-green-600 text-white font-semibold';
    }
    return 'bg-gray-600 text-white font-semibold';
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case '119-화재':
        return 'mdi:fire';
      case '112-미아':
        return 'mdi:account-child';
      case '약자':
        return 'mdi:account-alert';
      case 'AI-배회':
        return 'mdi:walk';
      case 'NDMS':
        return 'mdi:alert';
      default:
        return 'mdi:alert-circle';
    }
  };

  // 일반 이벤트 ID 목록 (event-26부터 event-33)
  const generalEventIds = new Set([
    'event-26', 'event-27', 'event-28', 'event-29',
    'event-30', 'event-31', 'event-32', 'event-33',
  ]);

  const filteredGroups =
    priorityFilter === 'GENERAL'
      ? groupedEvents.filter(({ main }) => {
          // 일반 탭: 일반 이벤트 ID 목록에 포함된 이벤트들만 표시
          return generalEventIds.has(main.id);
        })
      : groupedEvents.filter(({ main }) =>
          priorityFilter === 'ALL' ? true : main.priority === priorityFilter,
        );

  // 우선순위별 건수 계산
  const getPriorityCount = (priority: '긴급' | '경계' | '주의') => {
    return groupedEvents.filter(({ main }) => main.priority === priority).length;
  };

  const formatCount = (count: number) => {
    return count > 99 ? '99+' : count.toString();
  };

  const urgentCount = getPriorityCount('긴급');
  const cautionCount = getPriorityCount('경계');
  const attentionCount = getPriorityCount('주의');
  const generalCount = groupedEvents.filter(({ main }) => generalEventIds.has(main.id)).length;

  const tabs = [
    { label: '전체', value: 'ALL' as const, count: null },
    { label: '긴급', value: '긴급' as const, count: urgentCount },
    { label: '경계', value: '경계' as const, count: cautionCount },
    { label: '주의', value: '주의' as const, count: attentionCount },
    { label: '일반', value: 'GENERAL' as const, count: generalCount },
  ];

  // selectedEventId가 변경될 때 호버 효과 적용 및 스크롤
  useEffect(() => {
    if (selectedEventId) {
      // 호버 효과 적용
      onEventHover?.(selectedEventId);
      
      // 스크롤 처리
      const eventElement = eventItemRefs.current[selectedEventId];
      const container = scrollContainerRef.current;
      
      if (eventElement && container) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = eventElement.getBoundingClientRect();
        
        // 요소가 컨테이너 밖에 있으면 스크롤
        if (
          elementRect.top < containerRect.top ||
          elementRect.bottom > containerRect.bottom
        ) {
          eventElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }
    }
  }, [selectedEventId, onEventHover]);

  return (
    <div className="w-full flex flex-col h-full overflow-y-auto">
      <div className="border-t border-b border-white/20 py-2.5">
        <div className="flex items-center justify-center px-2">
          <div className="inline-flex items-center rounded-full p-0.5 gap-0.5" style={{ background: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.15), inset 0 -1px 1px rgba(255, 255, 255, 0.03)' }}>
            {tabs.map((tab) => {
              const isActive = priorityFilter === tab.value;
              const getPriorityDot = () => {
                if (tab.value === '긴급') {
                  return <span className="w-1.5 h-1.5 rounded-full border-2 border-red-400 inline-block mr-1" style={{ borderWidth: '2px' }} />;
                } else if (tab.value === '경계') {
                  return <span className="w-1.5 h-1.5 rounded-full border-2 border-yellow-400 inline-block mr-1" style={{ borderWidth: '2px' }} />;
                } else if (tab.value === '주의') {
                  return <span className="w-1.5 h-1.5 rounded-full border-2 border-blue-400 inline-block mr-1" style={{ borderWidth: '2px' }} />;
                } else if (tab.value === 'GENERAL') {
                  return <span className="w-1.5 h-1.5 rounded-full border-2 border-gray-400 inline-block mr-1" style={{ borderWidth: '2px' }} />;
                }
                return null;
              };
              return (
                <button
                  key={tab.value}
                  onClick={() => setPriorityFilter(tab.value)}
                  className={`px-2 py-1 rounded-full text-xs font-bold tracking-tight transition-all flex items-center whitespace-nowrap ${
                    isActive
                      ? 'bg-white/90 text-gray-900'
                      : 'text-white/70 hover:text-white/90'
                  }`}
                  style={{ fontSize: '11px' }}
                >
                  {getPriorityDot()}
                  {tab.label}
                  {tab.count !== null && (
                    <span className={`ml-0.5 ${isActive ? 'text-gray-700' : 'text-white/90'}`}>
                      ({formatCount(tab.count)})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto py-3 space-y-2 floating-scrollbar">
        {filteredGroups.length === 0 ? (
          <div className="text-white text-sm px-4 py-8 rounded-lg text-center font-medium" style={{ background: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.15), inset 0 -1px 1px rgba(255, 255, 255, 0.03)' }}>
            표시할 이벤트가 없습니다.
          </div>
        ) : (
        filteredGroups.map((group) => {
          const { main, evidence } = group;
          const isSelected = selectedEventId === main.id;
          const statusBadge = getStatusBadge(main.status);
          const priorityColor = getPriorityColor(main.priority);

          return (
            <div key={main.id} className="space-y-2">
              {/* 메인 이벤트 */}
              <div
                ref={(el) => {
                  eventItemRefs.current[main.id] = el;
                }}
                onClick={() => {
                  // 가상 이벤트(mock-)는 클릭해도 상세 페이지로 이동하지 않음
                  if (main.id.startsWith('mock-')) {
                    onEventSelect?.(main.id);
                    return;
                  }
                  if (main.eventId) {
                    navigate(`/event/${main.eventId}`);
                    return;
                  }
                  onEventSelect?.(main.id);
                }}
                onMouseEnter={() => onEventHover?.(main.id)}
                onMouseLeave={() => onEventHover?.(null)}
                className={`w-full text-left px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'ring-2 ring-red-500/80'
                    : 'hover:ring-2 hover:ring-blue-400/60'
                }`}
                style={{ 
                  background: isSelected ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0, 0, 0, 0.2)', 
                  backdropFilter: 'blur(20px)', 
                  WebkitBackdropFilter: 'blur(20px)', 
                  border: isSelected ? '1px solid rgba(239, 68, 68, 0.5)' : 'none', 
                  boxShadow: isSelected ? '0 4px 16px 0 rgba(239, 68, 68, 0.2)' : 'inset 0 1px 2px rgba(0, 0, 0, 0.15), inset 0 -1px 1px rgba(255, 255, 255, 0.03)' 
                }}
              >
                {/* 1. 날짜 시간 신고기관 / 우선순위 뷸렛 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {main.id.startsWith('mock-') ? (
                      <>
                        <span className="text-white text-[0.7rem] font-semibold drop-shadow-md">
                          {(() => {
                            const now = new Date();
                            const year = now.getFullYear();
                            const month = String(now.getMonth() + 1).padStart(2, '0');
                            const day = String(now.getDate()).padStart(2, '0');
                            return `${year}.${month}.${day} ${main.timestamp}`;
                          })()}
                        </span>
                        <span className="text-white text-[0.7rem] font-semibold drop-shadow-md">
                          {main.type === '112-치안' ? '112 상황실' : 
                           main.type === '112-미아' ? '112 상황실' :
                           main.type === '119-화재' || main.type === '119-구조' ? '119 지휘센터' :
                           main.type === '약자' ? '약자 보호 센터' :
                           main.type === 'AI-배회' ? 'AI 시스템' : main.type}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-white text-[0.7rem] font-semibold drop-shadow-md">
                          {formatEventDateTime(main.eventId ?? '', main.timestamp)}
                        </span>
                        {main.eventId && (() => {
                          const baseEvent = getEventById(main.eventId);
                          const source = baseEvent?.source || '';
                          const isAI = source.includes('AI') || source === 'AI';
                          if (!source) return null;
                          return (
                            <span className="text-white text-[0.7rem] font-semibold drop-shadow-md">
                              {isAI ? 'AI' : source}
                            </span>
                          );
                        })()}
                      </>
                    )}
                  </div>
                  {main.priority === '긴급' && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-semibold rounded-full">
                      긴급
                    </span>
                  )}
                  {main.priority === '경계' && (
                    <span className="px-2 py-0.5 bg-yellow-500 text-gray-900 text-[10px] font-semibold rounded-full">
                      경계
                    </span>
                  )}
                  {main.priority === '주의' && generalEventIds.has(main.id) && (
                    <span className="px-2 py-0.5 bg-gray-500 text-white text-[10px] font-semibold rounded-full">
                      일반
                    </span>
                  )}
                  {main.priority === '주의' && !generalEventIds.has(main.id) && (
                    <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-semibold rounded-full">
                      주의
                    </span>
                  )}
                  {main.priority === '일반' && (
                    <span className="px-2 py-0.5 bg-gray-500 text-white text-[10px] font-semibold rounded-full">
                      일반
                    </span>
                  )}
                </div>

                {main.id.startsWith('mock-') ? (
                  <>
                    {/* 허구 이벤트: 카테고리(유형) 배지 */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${getTypeColor(main.type)}`}>
                        {main.type}
                      </span>
                    </div>
                    {/* 허구 이벤트: 신고 내용 */}
                    <div className="text-white text-sm font-bold mb-2 drop-shadow-md">{main.title}</div>
                    {/* 허구 이벤트: 주소 */}
                    <div className="text-white text-xs mb-2 drop-shadow-md">{main.location.name}</div>
                  </>
                ) : (
                  <>
                    {/* 2. 유형 */}
                    <div className="flex items-center gap-2 mb-2">
                      {(() => {
                        if (main.eventId) {
                          const baseEvent = getEventById(main.eventId);
                          if (!baseEvent) return null;
                          return (
                            <span                             className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              baseEvent.domain === 'A'
                                ? baseEvent.type.includes('폭행') || baseEvent.type.includes('상해')
                                  ? 'bg-red-600 text-white'
                                  : baseEvent.type.includes('절도') || baseEvent.type.includes('강도')
                                    ? 'bg-yellow-600 text-white'
                                    : baseEvent.type.includes('차량도주') || baseEvent.type.includes('추적')
                                      ? 'bg-orange-600 text-white'
                                      : 'bg-blue-600 text-white'
                                : baseEvent.domain === 'B'
                                  ? 'bg-red-600 text-white'
                                  : baseEvent.domain === 'C'
                                    ? 'bg-orange-600 text-white'
                                    : baseEvent.domain === 'D'
                                      ? 'bg-green-600 text-white'
                                      : baseEvent.domain === 'E'
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-gray-600 text-white'
                            }`}>
                              {baseEvent.type}
                            </span>
                          );
                        } else {
                          return (
                            <span className={`px-2 py-0.5 rounded text-xs ${getTypeColor(main.type)}`}>
                              {main.type}
                            </span>
                          );
                        }
                      })()}
                    </div>

                    {/* 3. 제목 (AI가 축약한 핵심 문장) */}
                    <div className="text-white text-sm font-bold mb-2 drop-shadow-md">{main.title}</div>

                    {/* 4. 장소 (정확한 주소) */}
                    <div className="text-white text-xs mb-2 drop-shadow-md">{main.location.name}</div>
                  </>
                )}


              </div>

              {/* 증거 이벤트 (들여쓰기) */}
              {evidence && evidence.length > 0 && (
                <div className="ml-4 space-y-2">
                  {evidence.map((evt, evtIndex) => (
                    <div
                      key={`${main.id}-evidence-${evt.id}-${evtIndex}`}
                      onClick={() => onEventSelect?.(evt.id)}
                      onMouseEnter={() => onEventHover?.(evt.id)}
                      onMouseLeave={() => onEventHover?.(null)}
                      className="px-3 py-2 rounded-lg cursor-pointer hover:ring-2 hover:ring-blue-400/60 transition-all duration-200"
                      style={{ 
                        background: 'rgba(0, 0, 0, 0.2)', 
                        backdropFilter: 'blur(20px)', 
                        WebkitBackdropFilter: 'blur(20px)', 
                        boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.15), inset 0 -1px 1px rgba(255, 255, 255, 0.03)' 
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        <span className="text-white text-[0.7rem] font-semibold drop-shadow-md">{evt.type}</span>
                        <span className="text-blue-300 text-[0.7rem] font-semibold drop-shadow-md">(Evidence)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }))}
      </div>

      <style>{`
        .floating-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
        }

        .floating-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .floating-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          margin: 8px 0;
        }

        .floating-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }

        .floating-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
          background-clip: padding-box;
        }
      `}</style>
    </div>
  );
};

export default EventList;
