import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import EventList from '@/components/dashboard/EventList';
import MapView, { MapViewState, MapViewHandlers } from '@/components/dashboard/MapView';
import LeftPanel from '@/components/dashboard/LeftPanel';
import SituationSummary from '@/components/dashboard/SituationSummary';
import AIDetectionPopup from '@/components/dashboard/AIDetectionPopup';
import MainDriftnetPopup from '@/components/dashboard/MainDriftnetPopup';
import CCTVVideoPanel from '@/components/dashboard/CCTVVideoPanel';
import MapCCTVControls from '@/components/dashboard/MapCCTVControls';
import { Event, EventSummary as EventSummaryType } from '@/types';
import { allEvents, convertToDashboardEvent } from '@/lib/events-data';
import { ScenarioConfig, getScenarioConfig } from '@/lib/dashboard/scenarios';
import { getKeyboardShortcuts } from '@/lib/dashboard/keyboard-shortcuts';
import { createKeyboardHandler } from '@/lib/dashboard/keyboard-handler';

interface DashboardProps {
  scenarioConfig?: ScenarioConfig;
}

const Dashboard = ({ scenarioConfig }: DashboardProps) => {
  // scenarioConfig가 없으면 기본값으로 surveillance 시나리오 사용
  const finalScenarioConfig = scenarioConfig || getScenarioConfig('surveillance');
  const navigate = useNavigate();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  const [mapZoomLevel, setMapZoomLevel] = useState<number>(0);
  const [aiDetectionEventId, setAiDetectionEventId] = useState<string | null>(null);
  const [mainDriftnetEventId, setMainDriftnetEventId] = useState<string | null>(null);
  const [visibleEventIds, setVisibleEventIds] = useState<Set<string>>(new Set());
  const [hideControls, setHideControls] = useState<boolean>(false);
  const [hidePanels, setHidePanels] = useState<boolean>(false);
  const [mapViewState, setMapViewState] = useState<MapViewState | null>(null);
  const [mapViewHandlers, setMapViewHandlers] = useState<MapViewHandlers | null>(null);

  // MapView 상태 변경 핸들러 - 안정적으로 유지
  const handleMapViewStateChange = useCallback((state: MapViewState, handlers: MapViewHandlers) => {
    setMapViewState(state);
    setMapViewHandlers(handlers);
  }, []);

  // 이벤트 목록 조회 (현재: 더미 데이터 사용, API 연동 필요)
  const allConvertedEvents: Event[] = useMemo(() => {
    return allEvents
      .map((event, index) => convertToDashboardEvent(event, index))
      .filter((event) => event.processingStage !== '종결');
  }, []);

  // 가상 이벤트 데이터 (레이아웃 확인용)
  const mockEvents: Event[] = useMemo(() => {
    const now = new Date();
    const formatTime = (hours: number, minutes: number) => {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    };
    
    return [
      // 일반 5개
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
      // 주의 3개
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
      // 경계 2개
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

  // 표시할 이벤트만 필터링 (숫자 키를 눌렀을 때만 표시)
  const events: Event[] = useMemo(() => {
    if (visibleEventIds.size === 0) {
      return [];
    }
    return allConvertedEvents.filter(event => visibleEventIds.has(event.id));
  }, [allConvertedEvents, visibleEventIds]);

  // 이벤트 리스트용 이벤트 (가상 이벤트 포함)
  const eventsForList: Event[] = useMemo(() => {
    // 가상 이벤트는 항상 표시
    const visibleRealEvents = visibleEventIds.size > 0
      ? allConvertedEvents.filter(event => visibleEventIds.has(event.id))
      : [];
    
    return [...mockEvents, ...visibleRealEvents];
  }, [allConvertedEvents, visibleEventIds, mockEvents]);

  // 이벤트 요약 계산 (처리결과 기준) - 모든 이벤트 포함 (종결 포함)
  const eventSummary: EventSummaryType = useMemo(() => {
    const allEventsForSummary = allEvents.map((event, index) => convertToDashboardEvent(event, index));
    
    // 대기: 생성, 선별
    const pendingStages: Array<'생성' | '선별'> = ['생성', '선별'];
    const pending = allEventsForSummary.filter((event) =>
      pendingStages.includes(event.processingStage as any)
    ).length;
    
    // 진행중: 착수, 사실 검증, 추적 · 지원, 전파
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
  const animateToEvent = useCallback((event: Event, callback?: () => void) => {
    const eventId = event.id;
    setVisibleEventIds(prev => new Set([...prev, eventId]));
    setHighlightedEventId(eventId);
    
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

  // 선택 해제 함수
  const clearSelection = () => {
    setSelectedEventId(null);
    setHighlightedEventId(null);
    setAiDetectionEventId(null);
    setMainDriftnetEventId(null);
    setMapZoomLevel(0);
    setHideControls(false);
    setHidePanels(false);
  };

  // 키보드 단축키 처리
  useEffect(() => {
    if (!finalScenarioConfig.features.enableAnimations) return;

    const shortcuts = getKeyboardShortcuts(finalScenarioConfig.type);
    
    const handleKeyPress = createKeyboardHandler(
      shortcuts,
      allConvertedEvents,
      {
        animateToEvent,
        clearSelection,
        setHideControls,
        setHidePanels,
        setAiDetectionEventId,
        setMainDriftnetEventId,
      }
    );

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [allConvertedEvents, animateToEvent, finalScenarioConfig.features.enableAnimations, finalScenarioConfig.type, clearSelection]);

  return (
    <div
      className="flex flex-col bg-[#0a0e14] overflow-hidden"
      style={{ width: '100vw', height: '100vh' }}
    >
      <div className="flex flex-1 overflow-hidden relative" style={{ minHeight: 0, height: '100%' }}>
        {/* MapView - 백그라운드 */}
        <div 
          className="absolute inset-0" 
          style={{ 
            width: '100%',
            height: '100%',
            zIndex: 1,
          }}
        >
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
            onStateChange={handleMapViewStateChange}
          />
        </div>

        {/* 컨테이너 - 좌측패널, 맵 버튼, CCTV 버튼, 우측패널, CCTV 화면, 팝업들 */}
        <div className="absolute inset-0 flex" style={{ zIndex: 10 }}>
          {/* 좌측: LeftPanel (운영 패널) */}
          {finalScenarioConfig.features.showLeftPanel && (
            <div
              className="flex-shrink-0 overflow-hidden"
              style={{
                width: '30rem',
                transform: hidePanels ? 'translateX(-100%)' : 'translateX(0)',
                opacity: hidePanels ? 0 : 1,
                transition: 'transform 0.5s ease-in-out, opacity 0.3s ease-in-out',
                zIndex: 300,
                position: 'relative',
              }}
            >
              <LeftPanel />
            </div>
          )}
          {/* 중앙: 빈 공간 (맵이 보이는 영역) - 맵 버튼, CCTV 버튼, CCTV 화면, 팝업들 렌더링 */}
          <div className="flex-1 relative" style={{ minWidth: 0 }}>
            {/* 맵 컨트롤 및 CCTV 컨트롤 버튼들 */}
            {mapViewState && mapViewHandlers && (
              <MapCCTVControls
                mapViewState={mapViewState}
                mapViewHandlers={mapViewHandlers}
                hideControls={hideControls}
              />
            )}
            {/* 하단 CCTV 비디오 플레이어 */}
            {mapViewState && (
              <CCTVVideoPanel showCCTV={mapViewState.showCCTV} hideControls={hideControls} />
            )}
            {/* 팝업들 */}
            {selectedEventId && !mainDriftnetEventId && (
              <SituationSummary
                event={events.find(e => e.id === selectedEventId) || null}
                onClose={clearSelection}
              />
            )}
            {aiDetectionEventId && (
              <AIDetectionPopup
                event={events.find(e => e.id === aiDetectionEventId) || null}
                onClose={clearSelection}
              />
            )}
            {mainDriftnetEventId && (
              <MainDriftnetPopup
                event={events.find(e => e.id === mainDriftnetEventId) || null}
                onClose={clearSelection}
              />
            )}
          </div>
          {/* 우측: 이벤트 리스트 패널 */}
          {finalScenarioConfig.features.showEventList && (
            <div
              className={`flex flex-col flex-shrink-0 bg-[#242a34] border-l border-[#31353a] pl-4 pr-5 ${
                hidePanels ? 'overflow-hidden' : ''
              }`}
              style={{
                width: '370px',
                transform: hidePanels ? 'translateX(100%)' : 'translateX(0)',
                opacity: hidePanels ? 0 : 1,
                pointerEvents: hidePanels ? 'none' : 'auto',
                transition: 'transform 0.5s ease-in-out, opacity 0.3s ease-in-out',
                zIndex: 300,
                position: 'relative',
              }}
            >
                <div className="py-3">
                  {/* 스코어 카드 */}
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
                    ].map((card) => (
                      <div
                        key={card.title}
                        className="bg-[#393a42] p-3 rounded-lg flex items-start justify-between relative"
                      >
                        {/* 타이틀과 숫자 */}
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-400 text-xs font-medium">{card.title}</span>
                          <div className="text-white text-2xl font-bold">
                            {card.value.toLocaleString()}
                          </div>
                        </div>
                        {/* 아이콘 */}
                        <div className="bg-[#393a42] rounded flex-shrink-0">
                          <Icon icon={card.icon} className={`w-6 h-6 ${card.color}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              <div className="flex-1 overflow-hidden">
                <EventList
                  events={eventsForList}
                  selectedEventId={selectedEventId || undefined}
                  onEventSelect={handleEventAction}
                  onEventHover={handleEventHover}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
