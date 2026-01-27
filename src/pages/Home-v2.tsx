import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import EventList from '@/components/dashboard/EventList';
import MapView from '@/components/dashboard/MapView';
import LeftPanel from '@/components/dashboard/LeftPanel';
import BottomPanel from '@/components/dashboard/BottomPanel';
import ReportPopup from '@/components/dashboard/ReportPopup';
import { Event, EventSummary as EventSummaryType } from '@/types';
import { allEvents, convertToDashboardEvent } from '@/lib/events-data';

export default function HomeV2() {
  const navigate = useNavigate();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  const [mapZoomLevel, setMapZoomLevel] = useState<number>(0);
  const [aiDetectionEventId, setAiDetectionEventId] = useState<string | null>(null);
  const [visibleEventIds, setVisibleEventIds] = useState<Set<string>>(new Set());
  const [hideControls, setHideControls] = useState<boolean>(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState<boolean>(false);
  const [showCCTV, setShowCCTV] = useState<boolean>(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);
  const cctvScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUserScrollingRef = useRef(false);
  const userScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allConvertedEvents: Event[] = useMemo(() => {
    return allEvents
      .map((event, index) => convertToDashboardEvent(event, index))
      .filter((event) => event.processingStage !== '종결');
  }, []);

  const mockEvents: Event[] = useMemo(() => {
    const now = new Date();
    const formatTime = (hours: number, minutes: number) => {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    };
    
    return [
      {
        id: 'mock-1',
        type: '112-치안',
        title: '주차장 소음 신고',
        priority: '일반',
        status: 'NEW',
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 15)),
        location: { name: '관양동 주차장', coordinates: [126.98, 37.42] },
        processingStage: '생성',
        resolution: { category: '112', code: '001', description: '' },
      },
      {
        id: 'mock-2',
        type: '약자',
        title: '노인 낙상 신고',
        priority: '일반',
        status: 'NEW',
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 25)),
        location: { name: '부천시 중앙공원', coordinates: [126.99, 37.43] },
        processingStage: '선별',
        resolution: { category: '약자', code: '002', description: '' },
      },
      {
        id: 'mock-3',
        type: '112-치안',
        title: '횡단보도 신호 위반',
        priority: '일반',
        status: 'MONITORING',
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 35)),
        location: { name: '관양동 사거리', coordinates: [126.97, 37.41] },
        processingStage: '착수',
        resolution: { category: '112', code: '003', description: '' },
      },
      {
        id: 'mock-4',
        type: 'AI-배회',
        title: '의심 행동 탐지',
        priority: '일반',
        status: 'NEW',
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 45)),
        location: { name: '부천역 인근', coordinates: [126.96, 37.40] },
        processingStage: '생성',
        resolution: { category: 'AI', code: '004', description: '' },
      },
      {
        id: 'mock-5',
        type: '112-치안',
        title: '교통 혼잡 신고',
        priority: '일반',
        status: 'MONITORING',
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 55)),
        location: { name: '송내대로', coordinates: [126.95, 37.39] },
        processingStage: '선별',
        resolution: { category: '112', code: '005', description: '' },
      },
      {
        id: 'mock-6',
        type: '112-미아',
        title: '아동 미아 신고',
        priority: '주의',
        status: 'MONITORING',
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 10)),
        location: { name: '관양초등학교 앞', coordinates: [126.98, 37.42] },
        processingStage: '착수',
        resolution: { category: '112', code: '006', description: '' },
      },
      {
        id: 'mock-7',
        type: '119-구조',
        title: '교통사고 신고',
        priority: '주의',
        status: 'NEW',
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 20)),
        location: { name: '부천시청 앞', coordinates: [126.99, 37.43] },
        processingStage: '생성',
        resolution: { category: '119', code: '007', description: '' },
      },
      {
        id: 'mock-8',
        type: '112-치안',
        title: '싸움 신고',
        priority: '주의',
        status: 'MONITORING',
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 30)),
        location: { name: '송내역 인근', coordinates: [126.97, 37.41] },
        processingStage: '착수',
        resolution: { category: '112', code: '008', description: '' },
      },
      {
        id: 'mock-9',
        type: '119-화재',
        title: '작은 불꽃 발견',
        priority: '경계',
        status: 'MONITORING',
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 5)),
        location: { name: '부천시 아파트 단지', coordinates: [126.96, 37.40] },
        processingStage: '착수',
        resolution: { category: '119', code: '009', description: '' },
      },
      {
        id: 'mock-10',
        type: '112-치안',
        title: '절도 의심 신고',
        priority: '경계',
        status: 'NEW',
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 12)),
        location: { name: '관양동 상가', coordinates: [126.95, 37.39] },
        processingStage: '선별',
        resolution: { category: '112', code: '010', description: '' },
      },
    ];
  }, []);

  const events: Event[] = useMemo(() => {
    if (visibleEventIds.size === 0) {
      return [];
    }
    return allConvertedEvents.filter(event => visibleEventIds.has(event.id));
  }, [allConvertedEvents, visibleEventIds]);

  const eventsForList: Event[] = useMemo(() => {
    const visibleRealEvents = visibleEventIds.size > 0
      ? allConvertedEvents.filter(event => visibleEventIds.has(event.id))
      : [];
    
    return [...mockEvents, ...visibleRealEvents];
  }, [allConvertedEvents, visibleEventIds, mockEvents]);

  const eventSummary: EventSummaryType = useMemo(() => {
    const allEventsForSummary = allEvents.map((event, index) => convertToDashboardEvent(event, index));
    
    const pendingStages: Array<'생성' | '선별'> = ['생성', '선별'];
    const pending = allEventsForSummary.filter((event) =>
      pendingStages.includes(event.processingStage as any)
    ).length;
    
    const inProgressStages: Array<'착수' | '사실 검증' | '추적 · 지원' | '전파'> = [
      '착수',
      '사실 검증',
      '추적 · 지원',
      '전파',
    ];
    const inProgress = allEventsForSummary.filter((event) =>
      inProgressStages.includes(event.processingStage as any)
    ).length;
    
    const closed = allEventsForSummary.filter((event) => event.processingStage === '종결').length;
    
    return {
      total: allEventsForSummary.length,
      pending,
      inProgress,
      closed,
    };
  }, []);

  const handleEventAction = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event?.eventId) {
      navigate(`/event/${event.eventId}`);
      return;
    }
    setSelectedEventId(eventId);
    setHighlightedEventId(eventId);
  };

  const handleEventHover = (eventId: string | null) => {
    setHighlightedEventId(eventId);
  };

  // V2 프로토타입: 다른 애니메이션 로직 (필요시 수정)
  const animateToEvent = useCallback((event: Event, callback?: () => void) => {
    const eventId = event.id;
    setVisibleEventIds(prev => new Set([...prev, eventId]));
    setHighlightedEventId(eventId);
    
    // V2: 다른 타이밍으로 수정 가능
    setTimeout(() => {
      setMapZoomLevel(1);
      
      setTimeout(() => {
        setSelectedEventId(eventId);
        if (callback) {
          callback();
        }
      }, 500);
    }, 300);
  }, []);

  const clearSelection = () => {
    setSelectedEventId(null);
    setHighlightedEventId(null);
    setAiDetectionEventId(null);
    setMapZoomLevel(0);
  };

  // 윈도우 리사이즈 감지
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // V2 프로토타입: 다른 키보드 단축키 (필요시 수정)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // V2: 다른 키보드 동작으로 수정 가능
      if (e.key === '1') {
        const missingEvent = allConvertedEvents.find(event => 
          event.eventId === 'A-20260107-004' || event.id === 'A-20260107-004'
        );
        if (missingEvent) {
          animateToEvent(missingEvent);
        }
      } else if (e.key === '2') {
        const abductionEvent = allConvertedEvents.find(event => 
          event.eventId === 'A-20251210-003' || event.id === 'A-20251210-003'
        );
        if (abductionEvent) {
          animateToEvent(abductionEvent, () => {
            setAiDetectionEventId(abductionEvent.id);
          });
        }
      } else if (e.key === '3') {
        const assaultEvent = allConvertedEvents.find(event => 
          event.eventId === 'A-20241124-001' || event.id === 'A-20241124-001'
        );
        if (assaultEvent) {
          animateToEvent(assaultEvent);
        }
      } else if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [allConvertedEvents, animateToEvent]);

  return (
    <div
      className="relative bg-[#0a0e14] overflow-hidden"
      style={{ width: '100vw', height: '100vh' }}
    >
      {/* 페이지 설명 */}
      <div
        className="absolute left-4 top-4 z-[110] rounded px-2.5 py-1 text-xs font-medium text-gray-300 bg-black/50 backdrop-blur-sm"
        aria-label="페이지 설명"
      >
        데모(실종)
      </div>

      <div className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
        <MapView
          events={events}
          highlightedEventId={highlightedEventId}
          selectedEventId={selectedEventId}
          aiDetectionEventId={aiDetectionEventId}
          onEventClick={handleEventAction}
          onAiDetectionClose={clearSelection}
          onMapClick={clearSelection}
          externalZoomLevel={mapZoomLevel}
          onZoomLevelChange={setMapZoomLevel}
          hideControls={hideControls}
          leftPanelWidth={leftPanelCollapsed ? 80 : 480}
        />
      </div>

      <div className="absolute left-0 top-0 bottom-0" style={{ zIndex: 100 }}>
        <LeftPanel onCollapsedChange={setLeftPanelCollapsed} />
      </div>

      <div 
        className="absolute right-0 top-0 bottom-0 flex flex-col pl-4 pr-5 gap-4" 
        style={{ width: '370px', zIndex: 100, paddingTop: '16px', paddingBottom: '16px' }}
      >
        <div className="rounded-lg p-4 gradient-border-right-bottom" style={{ flexShrink: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                title: '전체',
                value: eventSummary.total,
                icon: 'mdi:chart-box',
                color: 'text-blue-400',
              },
              {
                title: '대기',
                value: eventSummary.pending || 0,
                icon: 'mdi:clock-outline',
                color: 'text-yellow-400',
              },
              {
                title: '진행중',
                value: eventSummary.inProgress,
                icon: 'mdi:progress-clock',
                color: 'text-blue-400',
              },
              {
                title: '종결',
                value: eventSummary.closed,
                icon: 'mdi:check-circle',
                color: 'text-green-400',
              },
            ].map((card, index) => {
              return (
              <div
                key={card.title}
                className="bg-[#393a42] p-3 rounded-lg flex items-start justify-between relative"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-gray-400 text-xs font-medium">{card.title}</span>
                  <div className="text-white text-2xl font-bold">
                    {card.value.toLocaleString()}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Icon icon={card.icon} className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-lg p-4 flex-1 overflow-hidden gradient-border-right-bottom" style={{ minHeight: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
          <EventList
            events={eventsForList}
            selectedEventId={selectedEventId || undefined}
            onEventSelect={handleEventAction}
            onEventHover={handleEventHover}
          />
        </div>
      </div>

      <BottomPanel
        showCCTV={showCCTV}
        hideControls={hideControls}
        leftPanelWidth={leftPanelCollapsed ? 80 : 480}
        windowWidth={windowWidth}
        cctvScrollContainerRef={cctvScrollContainerRef}
        isUserScrollingRef={isUserScrollingRef}
        userScrollTimeoutRef={userScrollTimeoutRef}
        autoScrollIntervalRef={autoScrollIntervalRef}
      />

      {selectedEventId && (
        <ReportPopup
          event={[...allConvertedEvents, ...mockEvents].find(e => e.id === selectedEventId) || null}
          onClose={clearSelection}
          position={{ top: '1.25rem', right: '370px' }}
        />
      )}
    </div>
  );
}
