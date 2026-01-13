'use client';

import { useState, useMemo, useEffect } from 'react';
import EventSummary from '@/components/EventSummary';
import EventList from '@/components/EventList';
import MapView from '@/components/MapView';
import RightPanel from '@/components/RightPanel';
import { ScaledLayout } from '@/components/layouts/ScaledLayout';
import { Event, EventSummary as EventSummaryType } from '@/types';
import { allEvents, convertToDashboardEvent } from '@/lib/events-data';

export default function Home() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  const [mapZoomLevel, setMapZoomLevel] = useState<number>(0);

  // 공통 데이터 사용
  const events: Event[] = useMemo(() => {
    return allEvents
      .map((event, index) => convertToDashboardEvent(event, index))
      .filter((event) => event.processingStage !== '종결');
  }, []);

  // 이벤트 요약 계산 (처리결과 기준)
  const eventSummary: EventSummaryType = useMemo(() => {
    // 모든 이벤트를 변환 (종결 포함)
    const allConvertedEvents = allEvents.map((event, index) => convertToDashboardEvent(event, index));
    
    // 진행중: 생성, 선별, 착수, 사실 검증, 추적 · 지원, 전파
    const inProgressStages: Array<'생성' | '선별' | '착수' | '사실 검증' | '추적 · 지원' | '전파'> = [
      '생성',
      '선별',
      '착수',
      '사실 검증',
      '추적 · 지원',
      '전파',
    ];
    const inProgress = allConvertedEvents.filter((event) =>
      inProgressStages.includes(event.processingStage as any)
    ).length;
    
    // 종결: 종결 상태만
    const closed = allConvertedEvents.filter((event) => event.processingStage === '종결').length;
    
    return {
      total: allConvertedEvents.length,
      inProgress,
      closed,
    };
  }, []);

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    setHighlightedEventId(eventId);
  };

  const handleEventHover = (eventId: string | null) => {
    setHighlightedEventId(eventId);
  };

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setHighlightedEventId(eventId);
  };

  // 숫자 1 키를 누르면 유괴 의심 사건으로 이동
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // 입력 필드에 포커스가 있으면 무시
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === '1') {
        // 유괴 의심 사건 찾기
        const abductionEvent = events.find(event => 
          event.title.includes('유괴 의심') || 
          (event.eventId && event.eventId === 'A-20251210-003')
        );
        
        if (abductionEvent) {
          setSelectedEventId(abductionEvent.id);
          setHighlightedEventId(abductionEvent.id);
          setMapZoomLevel(1); // 확대
        }
      } else if (e.key === 'Escape') {
        // ESC 키로 선택 해제
        setSelectedEventId(null);
        setHighlightedEventId(null);
        setMapZoomLevel(0);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [events]);

  return (
    <ScaledLayout>
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0, height: '100%' }}>
        <div className="flex flex-1 overflow-hidden relative" style={{ minHeight: 0, height: '100%' }}>
          <div className="flex flex-col flex-shrink-0 border-r border-[#31353a] pl-4 pr-5" style={{ width: '370px' }}>
            <div className="py-4 px-3">
              <div className="w-24 h-5 flex items-center justify-start">
                <img 
                  src="/logo.svg" 
                  alt="CUVIA Logo" 
                  className="h-5 w-auto object-contain"
                />
              </div>
            </div>
            <div className="py-3">
              <EventSummary summary={eventSummary} />
            </div>
            <div className="flex-1 overflow-hidden">
              <EventList
                events={events}
                selectedEventId={selectedEventId || undefined}
                onEventSelect={handleEventSelect}
                onEventHover={handleEventHover}
              />
            </div>
          </div>
          <div className="flex-1 relative" style={{ minHeight: 0, width: '100%', height: '100%' }}>
            <MapView
              events={events}
              highlightedEventId={highlightedEventId}
              selectedEventId={selectedEventId}
              onEventClick={handleEventClick}
              onMapClick={() => {
                setSelectedEventId(null);
                setHighlightedEventId(null);
              }}
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
