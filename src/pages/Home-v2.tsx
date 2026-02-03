import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import EventList from '@/components/dashboard/HOME/EventList';
import MapView from '@/components/dashboard/MapView';
import LeftPanel from '@/components/dashboard/LeftPanel';
import BottomPanel from '@/components/dashboard/BottomPanel';
import ReportPopup from '@/components/dashboard/HOME/ReportPopup';
import FastSearchProgress from '@/components/dashboard/HOME-v2/FastSearchProgress';
import FastSearchListPanel from '@/components/dashboard/HOME-v2/FastSearchListPanel';
import AIAgentPopup from '@/components/dashboard/HOME-v2/AIAgentPopup';
import { Event, EventSummary as EventSummaryType } from '@/types';
import { allEvents, convertToDashboardEvent } from '@/lib/events-data';
import { parseExcludedAttributesFromMessage } from '@/lib/fast-search-attribute-utils';

export default function HomeV2() {
  const navigate = useNavigate();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  const [mapZoomLevel, setMapZoomLevel] = useState<number>(0);
  const [aiDetectionEventId, setAiDetectionEventId] = useState<string | null>(null);
  const [visibleEventIds, setVisibleEventIds] = useState<Set<string>>(new Set());
  const [hideControls, setHideControls] = useState<boolean>(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState<boolean>(false);
  const [panelsSlidOut, setPanelsSlidOut] = useState<boolean>(false);
  const [showFastSearch, setShowFastSearch] = useState<boolean>(false);
  const [showFastSearchList, setShowFastSearchList] = useState<boolean>(false);
  const [showAIAgentPopup, setShowAIAgentPopup] = useState<boolean>(false);
  const [listCardCount, setListCardCount] = useState<number>(0);
  const [fastSearchRadius, setFastSearchRadius] = useState<number>(500);
  const [reportPopupHeight, setReportPopupHeight] = useState<number>(0);
  const [pinOffset, setPinOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hideDimForFastSearch, setHideDimForFastSearch] = useState<boolean>(false);
  const [showReSearchProgress, setShowReSearchProgress] = useState<boolean>(false);
  const [excludedAttributes, setExcludedAttributes] = useState<string[]>([]);
  const [showCCTV, setShowCCTV] = useState<boolean>(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);
  /** 에이전트 팝업 최대 높이: 플로팅 버튼(Agent Hub)을 넘지 않도록 */
  const [agentPopupMaxHeight, setAgentPopupMaxHeight] = useState<number>(500);
  const [openCandidateId, setOpenCandidateId] = useState<string | null>(null); // 외부에서 열 후보 ID
  const cctvScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUserScrollingRef = useRef<boolean>(false);
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
    const base =
      visibleEventIds.size === 0
        ? []
        : allConvertedEvents.filter((event) => visibleEventIds.has(event.id));
    if (showFastSearchList && selectedEventId) {
      const alreadyInList = base.some((e) => e.id === selectedEventId);
      if (!alreadyInList) {
        const fromReal = allConvertedEvents.find((e) => e.id === selectedEventId);
        const fromMock = mockEvents.find((e) => e.id === selectedEventId);
        const selected = fromReal ?? fromMock;
        if (selected) return [selected, ...base];
      }
    }
    return base;
  }, [allConvertedEvents, visibleEventIds, showFastSearchList, selectedEventId, mockEvents]);

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

  // 고속검색 리스트 패널이 열릴 때, 지도를 "조금만" 우측으로 이동시키기 위한 포커스 위치
  // - 평상시: 50 (지도 컨테이너 정중앙)
  // - 리스트 패널 열림: 52 (약간 우측으로만 이동)
  const fastSearchFocusXPercent = useMemo(() => {
    if (!showFastSearchList) return 50;
    return 52;
  }, [showFastSearchList]);

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
    setHideControls(false);
    setPinOffset({ x: 0, y: 0 });
    setShowFastSearchList(false);
    setShowAIAgentPopup(false);
    setPanelsSlidOut(false);
    setShowCCTV(true);
    setShowFastSearch(false);
    setShowReSearchProgress(false);
    setExcludedAttributes([]);
  };

  /** 에이전트 팝업 maxHeight: 팝업 top ~ 플로팅 버튼 위까지 (Agent Hub bottom 24px + 높이 56px + 여유 8px) */
  useEffect(() => {
    const updateAgentPopupMaxHeight = () => {
      const topPx = reportPopupHeight > 0 ? 76 + reportPopupHeight + 24 : 480;
      const reserveBottom = 24 + 56 + 8; // 플로팅 버튼 영역
      setAgentPopupMaxHeight(Math.max(200, window.innerHeight - topPx - reserveBottom));
    };
    updateAgentPopupMaxHeight();
    window.addEventListener('resize', updateAgentPopupMaxHeight);
    return () => window.removeEventListener('resize', updateAgentPopupMaxHeight);
  }, [reportPopupHeight]);

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
          setHideControls(true);
          animateToEvent(missingEvent);
        }
      } else if (e.key === '2') {
        // 고속검색 시작 (FastSearchProgress 표시)
        // selectedEventId는 유지하여 지도 카메라 이동 가능하도록 함
        setPanelsSlidOut(true);
        setShowCCTV(false);
        setHideControls(true);
        setShowFastSearch(true);
        setHideDimForFastSearch(false);
      } else if (e.key === '3') {
        // 직접 FastSearchListPanel 열기 (테스트용)
        // selectedEventId는 유지하여 지도 카메라 이동 가능하도록 함
        setPanelsSlidOut(true);
        setShowCCTV(false);
        setHideControls(true);
        setShowFastSearchList(true);
        setPinOffset({ x: 0, y: 0 });
      } else if (e.key === '4') {
        // 57번 이미지 팝업 열기 (42번 카드 = qs_img_57_y)
        setPanelsSlidOut(true);
        setShowCCTV(false);
        setHideControls(true);
        setShowFastSearchList(true);
        setPinOffset({ x: 0, y: 0 });
        setShowAIAgentPopup(true);
        // 42번 카드 자동 열기
        setOpenCandidateId('42');
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
          showFastSearch={showFastSearch}
          showFastSearchList={showFastSearchList}
          fastSearchRadius={fastSearchRadius}
          leftPanelWidth={leftPanelCollapsed ? 80 : 480}
          pinOffset={pinOffset}
          focusTargetXPercent={fastSearchFocusXPercent}
        />
      </div>

      <div 
        className={`absolute left-0 top-0 bottom-0 transition-all duration-300 ease-out ${panelsSlidOut ? '-translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}
        style={{ zIndex: 100 }}
      >
        <LeftPanel onCollapsedChange={setLeftPanelCollapsed} />
      </div>

      <div 
        className={`absolute right-0 top-0 bottom-0 flex flex-col pl-4 pr-5 gap-4 transition-all duration-300 ease-out ${panelsSlidOut ? 'translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}
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

      {/* BottomPanel (CCTV 화면) */}
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

      {/* ReportPopup */}
      {selectedEventId && !showFastSearch && (
        <ReportPopup
          event={[...allConvertedEvents, ...mockEvents].find(e => e.id === selectedEventId) || null}
          onClose={clearSelection}
          onFastSearchStart={() => {
            setPanelsSlidOut(true);
            setShowCCTV(false);
            setHideControls(true);
            setShowFastSearch(true);
            setHideDimForFastSearch(false);
          }}
          showFastSearchStartButton={!showFastSearchList}
          onLayout={setReportPopupHeight}
          position={showFastSearchList ? { top: '76px', right: '20px' } : { top: '1.25rem', right: '370px' }}
        />
      )}

      {/* FastSearchProgress */}
      <FastSearchProgress
        isVisible={showFastSearch}
        hideDim={hideDimForFastSearch}
        onComplete={() => {
          if (!hideDimForFastSearch) {
            setShowFastSearch(false);
            setShowFastSearchList(true);
            setShowAIAgentPopup(true);
            setPinOffset({ x: 0, y: 0 });
          }
        }}
      />

      {/* FastSearchListPanel - 재검색 시 리스트 박스 전체(상단 버튼 포함) 딤 + 프로그래스 중앙 */}
      <FastSearchListPanel
        isVisible={showFastSearchList}
        onListCardCountChange={setListCardCount}
        onRadiusChange={setFastSearchRadius}
        showReSearchDim={showReSearchProgress}
        onReSearchComplete={() => setShowReSearchProgress(false)}
        onReSearchClick={() => setShowReSearchProgress(true)}
        excludedAttributes={excludedAttributes}
        openCandidateId={openCandidateId}
        onCandidateOpened={() => setOpenCandidateId(null)}
      />

      {/* 에이전트 팝업: 고속검색 리스트 시 신고팝업 아래 여백(24px) 유지, 사건팝업 높이 변동에 따라 위치 조정 */}
      {showFastSearchList && showAIAgentPopup && (
        <AIAgentPopup
          isOpen={showAIAgentPopup}
          onClose={() => setShowAIAgentPopup(false)}
          hideControls={hideControls}
          position={{
            top: `${reportPopupHeight > 0 ? 76 + reportPopupHeight + 24 : 480}px`,
            right: '20px',
          }}
          listCardCount={listCardCount}
          onDeleteLikeRequest={({ rawMessage }) => {
            const parsed = parseExcludedAttributesFromMessage(rawMessage);
            if (parsed.length) {
              setExcludedAttributes((prev) => Array.from(new Set([...prev, ...parsed])));
            }
            setShowReSearchProgress(true);
          }}
          maxHeight={agentPopupMaxHeight}
        />
      )}
    </div>
  );
}
