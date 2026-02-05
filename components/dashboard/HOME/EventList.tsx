import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Event, EventPriority } from '@/types';
import { formatEventDateTime } from '@/lib/events-data';

interface EventListProps {
  events: Event[];
  selectedEventId?: string;
  onEventSelect?: (eventId: string) => void;
  onEventHover?: (eventId: string | null) => void;
  key1PressTime?: Date; // 1 키를 눌렀을 때의 시간
}

const EventList = ({ events, selectedEventId, onEventSelect, onEventHover, key1PressTime }: EventListProps) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const eventItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | '긴급' | '경계' | '주의' | 'GENERAL'>('ALL');
  
  // 이벤트 정렬: 우선순위 > 최신순
  const sortedEvents = [...events].sort((a, b) => {
    // 우선순위 순서
    const priorityOrder: Record<EventPriority, number> = { 긴급: 3, 경계: 2, 주의: 1, 일반: 0 };
    const priorityDiff = (priorityOrder[b.priority] ?? 0) - (priorityOrder[a.priority] ?? 0);
    if (priorityDiff !== 0) return priorityDiff;
    
    // 최신순 (timestamp 숫자로 변환)
    return parseInt(b.timestamp.replace(':', '')) - parseInt(a.timestamp.replace(':', ''));
  });

  // CCTV 이름 추출 함수 (이벤트 ID 기반으로 일관된 CCTV 할당)
  const getCCTVName = (event: Event): string => {
    // 1 키로 선택된 이벤트 (A-20260107-004)는 CCTV-V-11
    if (event.eventId === 'A-20260107-004' || event.id === 'A-20260107-004') {
      return 'CCTV-V-11';
    }
    // 다른 이벤트들은 이벤트 ID 기반으로 무작위 할당 (CCTV-V-1 ~ CCTV-V-12)
    const eventId = event.eventId || event.id;
    const hash = eventId.split('').reduce((acc, char, idx) => acc + char.charCodeAt(0) * (idx + 1), 0);
    const cctvNumber = (hash % 12) + 1; // 1~12
    return `CCTV-V-${cctvNumber}`;
  };

  // Hall 랜덤 선택 함수 (이벤트 ID 기반으로 일관된 Hall 할당)
  const getHallName = (event: Event): string => {
    // 이벤트 ID를 기반으로 일관된 Hall 할당 (같은 이벤트는 항상 같은 Hall)
    const eventId = event.eventId || event.id;
    const hash = eventId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hallNumber = (hash % 8) + 1; // 1~8
    return `Hall${hallNumber}`;
  };

  // 날짜 시간 포맷 함수
  const formatDateTime = (event: Event): string => {
    // 1 키를 눌렀을 때 나오는 이벤트는 key1PressTime 사용
    if ((event.eventId === 'A-20260107-004' || event.id === 'A-20260107-004') && key1PressTime) {
      const year = key1PressTime.getFullYear();
      const month = String(key1PressTime.getMonth() + 1).padStart(2, '0');
      const day = String(key1PressTime.getDate()).padStart(2, '0');
      const hours = String(key1PressTime.getHours()).padStart(2, '0');
      const minutes = String(key1PressTime.getMinutes()).padStart(2, '0');
      const seconds = String(key1PressTime.getSeconds()).padStart(2, '0');
      return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
    }
    
    // mock- 이벤트는 현재 시간 사용
    if (event.id.startsWith('mock-')) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}.${month}.${day} ${event.timestamp}`;
    }
    
    // 일반 이벤트는 formatEventDateTime 사용
    return formatEventDateTime(event.eventId ?? '', event.timestamp);
  };

  // 일반 이벤트 ID 목록 (event-26부터 event-33)
  const generalEventIds = new Set([
    'event-26', 'event-27', 'event-28', 'event-29',
    'event-30', 'event-31', 'event-32', 'event-33',
  ]);

  const filteredEvents =
    priorityFilter === 'GENERAL'
      ? sortedEvents.filter((event) => generalEventIds.has(event.id))
      : priorityFilter === 'ALL'
      ? sortedEvents
      : sortedEvents.filter((event) => event.priority === priorityFilter);

  // 우선순위별 건수 계산
  const getPriorityCount = (priority: '긴급' | '경계' | '주의') => {
    return sortedEvents.filter((event) => event.priority === priority).length;
  };

  const formatCount = (count: number) => {
    return count > 99 ? '99+' : count.toString();
  };

  const urgentCount = getPriorityCount('긴급');
  const cautionCount = getPriorityCount('경계');
  const attentionCount = getPriorityCount('주의');
  const generalCount = sortedEvents.filter((event) => generalEventIds.has(event.id)).length;

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
      onEventHover?.(selectedEventId);
      
      const eventElement = eventItemRefs.current[selectedEventId];
      const container = scrollContainerRef.current;
      
      if (eventElement && container) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = eventElement.getBoundingClientRect();
        
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
          {tabs.map((tab) => {
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
        {filteredEvents.length === 0 ? (
          <div className="text-gray-500 text-xs px-3 py-6 border-b border-[#2f3136]">
            표시할 이벤트가 없습니다.
          </div>
        ) : (
          filteredEvents.map((event) => {
            const isSelected = selectedEventId === event.id;
            const cctvName = getCCTVName(event);
            const hallName = getHallName(event);
            const dateTime = formatDateTime(event);
            
            // 1 키로 선택된 이벤트의 제목 변경
            const displayTitle = (event.eventId === 'A-20260107-004' || event.id === 'A-20260107-004')
              ? '폭력 의심 상황 발생'
              : event.title;

            return (
              <div
                key={event.id}
                ref={(el) => {
                  eventItemRefs.current[event.id] = el;
                }}
                onClick={() => {
                  if (event.id.startsWith('mock-')) {
                    onEventSelect?.(event.id);
                    return;
                  }
                  if (event.eventId) {
                    navigate(`/event/${event.eventId}`);
                    return;
                  }
                  onEventSelect?.(event.id);
                }}
                onMouseEnter={() => onEventHover?.(event.id)}
                onMouseLeave={() => onEventHover?.(null)}
                className={`w-full text-left border-b pt-3 pb-3 pr-3 transition-all duration-200 ${
                  isSelected
                    ? 'bg-red-500/10 border-red-500/50 ring-2 ring-red-500/30'
                    : 'bg-transparent border-[#2f3136] hover:bg-[#24272d] hover:border-blue-400'
                }`}
                style={{ paddingLeft: '14px' }}
              >
                {/* 날짜 시간 및 우선순위 배지 */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-gray-300 text-[0.7rem] font-medium">
                    {dateTime}
                  </div>
                  {event.priority === '긴급' && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-semibold rounded-full">
                      긴급
                    </span>
                  )}
                  {event.priority === '경계' && (
                    <span className="px-2 py-0.5 bg-yellow-500 text-gray-900 text-[10px] font-semibold rounded-full">
                      경계
                    </span>
                  )}
                  {event.priority === '주의' && !generalEventIds.has(event.id) && (
                    <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-semibold rounded-full">
                      주의
                    </span>
                  )}
                  {((event.priority === '주의' && generalEventIds.has(event.id)) || event.priority === '일반') && (
                    <span className="px-2 py-0.5 bg-gray-500 text-white text-[10px] font-semibold rounded-full">
                      일반
                    </span>
                  )}
                </div>
                
                {/* 이벤트 제목 */}
                <div className="text-white text-sm font-semibold mb-1.5">
                  {displayTitle}
                </div>
                
                {/* 위치 | CCTV 이름 */}
                <div className="text-gray-200 text-xs flex items-center gap-2">
                  <span>{hallName}</span>
                  <span className="text-gray-500">|</span>
                  <span>{cctvName}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default EventList;
