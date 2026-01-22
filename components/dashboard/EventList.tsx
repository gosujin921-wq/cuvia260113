

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
      <div className="border-t border-b border-[#31353a]">
        <div className="flex items-center justify-center gap-2" style={{ paddingTop: '14px' }}>
          {tabs.map((tab, index) => {
            const isActive = priorityFilter === tab.value;
            const getPriorityDot = () => {
              if (tab.value === '긴급') {
                return <span className="w-2 h-2 rounded-full border-2 border-red-400 inline-block mr-1.5" style={{ borderWidth: '3px' }} />;
              } else if (tab.value === '경계') {
                return <span className="w-2 h-2 rounded-full border-2 border-yellow-400 inline-block mr-1.5" style={{ borderWidth: '3px' }} />;
              } else if (tab.value === '주의') {
                return <span className="w-2 h-2 rounded-full border-2 border-blue-400 inline-block mr-1.5" style={{ borderWidth: '3px' }} />;
              } else if (tab.value === 'GENERAL') {
                return <span className="w-2 h-2 rounded-full border-2 border-gray-400 inline-block mr-1.5" style={{ borderWidth: '3px' }} />;
              }
              return null;
            };
            return (
              <React.Fragment key={tab.value}>
                <button
                  onClick={() => setPriorityFilter(tab.value)}
                  className={`pb-2 text-xs font-semibold tracking-tight transition-colors flex items-center ${
                    isActive
                      ? 'text-white border-b-2 border-blue-400'
                      : 'text-gray-400 border-b-2 border-transparent hover:text-white'
                  }`}
                >
                  {getPriorityDot()}
                  {tab.label}
                  {tab.count !== null && (
                    <span className="ml-1 text-gray-400">
                      ({formatCount(tab.count)})
                    </span>
                  )}
                </button>
                {(tab.value === 'ALL' || tab.value === '주의') && (
                  <span className="w-1 h-1 rounded-full bg-gray-500 self-center" style={{ marginBottom: '10px' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto space-y-2">
        {filteredGroups.length === 0 ? (
          <div className="text-gray-500 text-xs px-3 py-6 border-b border-[#2f3136]">
            표시할 이벤트가 없습니다.
          </div>
        ) : (
        filteredGroups.map((group) => {
          const { main, evidence } = group;
          const isSelected = selectedEventId === main.id;
          const statusBadge = getStatusBadge(main.status);
          const priorityColor = getPriorityColor(main.priority);

          return (
            <div key={main.id} className="space-y-1">
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
                className={`w-full text-left border-b pt-3 pb-3 pr-3 transition-all duration-200 ${
                  isSelected
                    ? 'bg-red-500/10 border-red-500/50 ring-2 ring-red-500/30'
                    : 'bg-transparent border-[#2f3136] shadow-[0_4px_14px_-8px_rgba(0,0,0,0.8)] hover:bg-[#24272d] hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.4),0_0_40px_rgba(59,130,246,0.2)]'
                }`}
                style={{ paddingLeft: '14px' }}
              >
                {/* 1. 시간 / 신고기관 / 우선순위 뷸렛 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300 text-[0.7rem] font-medium">
                      {formatEventDateTime(main.eventId ?? '', main.timestamp)}
                    </span>
                    {main.eventId && (() => {
                      const baseEvent = getEventById(main.eventId);
                      const source = baseEvent?.source || '';
                      const isAI = source.includes('AI') || source === 'AI';
                      if (!source) return null;
                      return (
                        <span className="text-gray-300 text-[0.7rem] font-medium">
                          {isAI ? 'AI' : source}
                        </span>
                      );
                    })()}
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

                {/* 2. 유형 */}
                <div className="flex items-center gap-2 mb-2">
                  {(() => {
                    if (main.eventId) {
                      const baseEvent = getEventById(main.eventId);
                      if (!baseEvent) return null;
                      return (
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          baseEvent.domain === 'A'
                            ? baseEvent.type.includes('폭행') || baseEvent.type.includes('상해')
                              ? 'bg-red-500/20 text-red-400'
                              : baseEvent.type.includes('절도') || baseEvent.type.includes('강도')
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : baseEvent.type.includes('차량도주') || baseEvent.type.includes('추적')
                                  ? 'bg-orange-500/20 text-orange-400'
                                  : 'bg-blue-500/20 text-blue-400'
                            : baseEvent.domain === 'B'
                              ? 'bg-red-500/20 text-red-400'
                              : baseEvent.domain === 'C'
                                ? 'bg-orange-500/20 text-orange-400'
                                : baseEvent.domain === 'D'
                                  ? 'bg-green-500/20 text-green-400'
                                  : baseEvent.domain === 'E'
                                    ? 'bg-orange-500/20 text-orange-400'
                                    : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {baseEvent.type}
                        </span>
                      );
                    } else {
                      // 가상 이벤트: type을 직접 표시
                      const getTypeColor = (type: string) => {
                        if (type.includes('화재') || type.includes('구조')) {
                          return 'bg-red-500/20 text-red-400';
                        } else if (type.includes('미아') || type.includes('치안')) {
                          return 'bg-blue-500/20 text-blue-400';
                        } else if (type.includes('약자')) {
                          return 'bg-orange-500/20 text-orange-400';
                        } else if (type.includes('AI')) {
                          return 'bg-green-500/20 text-green-400';
                        } else {
                          return 'bg-gray-500/20 text-gray-400';
                        }
                      };
                      return (
                        <span className={`px-2 py-0.5 rounded text-xs ${getTypeColor(main.type)}`}>
                          {main.type}
                        </span>
                      );
                    }
                  })()}
                </div>

                {/* 3. 제목 (AI가 축약한 핵심 문장) */}
                <div className="text-white text-sm font-semibold mb-2">{main.title}</div>

                {/* 4. 장소 (정확한 주소) */}
                <div className="text-gray-200 text-xs mb-2">{main.location.name}</div>


              </div>

              {/* 증거 이벤트 (들여쓰기) */}
              {evidence && evidence.length > 0 && (
                <div className="ml-4 space-y-1">
                  {evidence.map((evt, evtIndex) => (
                    <div
                      key={`${main.id}-evidence-${evt.id}-${evtIndex}`}
                      onClick={() => onEventSelect?.(evt.id)}
                      onMouseEnter={() => onEventHover?.(evt.id)}
                      onMouseLeave={() => onEventHover?.(null)}
                      className="p-2 border border-blue-500/30 bg-[#36383B] cursor-pointer hover:bg-[#091326] hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-200"
                      style={{ borderWidth: '1px' }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full" />
                        <span className="text-gray-200 text-[0.7rem]">{evt.type}</span>
                        <span className="text-gray-300 text-[0.7rem]">(Evidence)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }))}
      </div>
    </div>
  );
};

export default EventList;
