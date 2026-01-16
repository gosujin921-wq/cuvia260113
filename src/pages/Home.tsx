import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Score from '@/components/dashboard/Score';
import EventList from '@/components/dashboard/EventList';
import MapView from '@/components/dashboard/MapView';
import RightPanel from '@/components/dashboard/RightPanel';
import { ScaledLayout } from '@/components/layouts/ScaledLayout';
import { Event, EventSummary as EventSummaryType } from '@/types';
import { allEvents, convertToDashboardEvent } from '@/lib/events-data';

export default function Home() {
  const navigate = useNavigate();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  const [mapZoomLevel, setMapZoomLevel] = useState<number>(0);
  const [aiDetectionEventId, setAiDetectionEventId] = useState<string | null>(null);
  const [visibleEventIds, setVisibleEventIds] = useState<Set<string>>(new Set());

  /**
   * ============================================================================
   * 📡 API 연동 포인트: 이벤트 목록 조회
   * ============================================================================
   * 현재: 더미 데이터(allEvents) 사용
   * 변경: API 호출로 대체 필요
   * 
   * 예시:
   * const [events, setEvents] = useState<Event[]>([]);
   * useEffect(() => {
   *   fetch('/api/events?status=active')
   *     .then(res => res.json())
   *     .then(data => setEvents(data));
   * }, []);
   * ============================================================================
   */
  const allConvertedEvents: Event[] = useMemo(() => {
    return allEvents
      .map((event, index) => convertToDashboardEvent(event, index))
      .filter((event) => event.processingStage !== '종결');
  }, []);

  // 표시할 이벤트만 필터링 (숫자 키를 눌렀을 때만 표시)
  const events: Event[] = useMemo(() => {
    if (visibleEventIds.size === 0) {
      return [];
    }
    return allConvertedEvents.filter(event => visibleEventIds.has(event.id));
  }, [allConvertedEvents, visibleEventIds]);

  // 이벤트 요약 계산 (처리결과 기준) - 모든 이벤트 포함 (종결 포함)
  const eventSummary: EventSummaryType = useMemo(() => {
    const allEventsForSummary = allEvents.map((event, index) => convertToDashboardEvent(event, index));
    
    // 진행중: 생성, 선별, 착수, 사실 검증, 추적 · 지원, 전파
    const inProgressStages: Array<'생성' | '선별' | '착수' | '사실 검증' | '추적 · 지원' | '전파'> = [
      '생성',
      '선별',
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
      inProgress,
      closed,
    };
  }, []);

  // 이벤트 선택/클릭 핸들러 (통합)
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

  // 공통 이벤트 애니메이션 함수
  // 순서: 1. 이벤트 표시 및 하이라이트 (즉시) → 2. 줌인 시작 (300ms 후) → 3. 팝업 표시 (줌인 완료 후 800ms)
  const animateToEvent = useCallback((event: Event, callback?: () => void) => {
    const eventId = event.id;
    // 1단계: 이벤트 표시 및 하이라이트 (즉시)
    setVisibleEventIds(prev => new Set([...prev, eventId]));
    setHighlightedEventId(eventId);
    
    // 2단계: 줌인 시작 (300ms 후)
    setTimeout(() => {
      setMapZoomLevel(1);
      
      // 3단계: 줌인 완료 후 팝업 표시 (300ms + 500ms = 800ms 후)
      setTimeout(() => {
        setSelectedEventId(eventId); // 팝업 표시
        if (callback) {
          callback();
        }
      }, 500); // 줌인 애니메이션 완료 시간
    }, 300);
  }, []);

  // 선택 해제 함수
  const clearSelection = () => {
    setSelectedEventId(null);
    setHighlightedEventId(null);
    setAiDetectionEventId(null);
    setMapZoomLevel(0);
  };

  // 키보드 단축키 핸들러
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
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
    <ScaledLayout>
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0, height: '100%' }}>
        <div className="flex flex-1 overflow-hidden relative" style={{ minHeight: 0, height: '100%' }}>
          <div className="flex flex-col flex-shrink-0 border-r border-[#31353a] pl-4 pr-5" style={{ width: '370px' }}>
            <div className="py-4 px-3">
              <Link to="/" className="w-24 h-5 flex items-center justify-start">
                <img 
                  src="/logo.svg" 
                  alt="CUVIA Logo" 
                  className="h-5 w-auto object-contain"
                />
              </Link>
            </div>
            <div className="py-3">
              <Score summary={eventSummary} />
            </div>
            <div className="flex-1 overflow-hidden">
              <EventList
                events={events}
                selectedEventId={selectedEventId || undefined}
                onEventSelect={handleEventAction}
                onEventHover={handleEventHover}
              />
            </div>
          </div>
          <div className="flex-1 relative" style={{ minHeight: 0, width: '100%', height: '100%' }}>
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
            />
          </div>
          {/* 우측: RightPanel */}
          <RightPanel />
        </div>
      </div>
    </ScaledLayout>
  );
}
