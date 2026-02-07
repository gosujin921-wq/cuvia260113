import { useState, useMemo, useEffect, useRef, useCallback, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import EventList from '@/components/dashboard/HOME/EventList';
import MapView from '@/components/dashboard/MapView';
import LeftPanel from '@/components/dashboard/LeftPanel';
import LeftMenuPanel from '@/components/dashboard/HOME-v2/LeftMenuPanel';
import HeatmapPanel from '@/components/dashboard/HeatmapPanel';
import BottomPanel from '@/components/dashboard/BottomPanel';
import ReportPopup from '@/components/dashboard/HOME/ReportPopup';
import FastSearchProgress from '@/components/dashboard/HOME-v2/FastSearchProgress';
import FastSearchListPanel from '@/components/dashboard/HOME-v2/FastSearchListPanel';
import AIAgentPopup from '@/components/dashboard/HOME-v2/AIAgentPopup';
import ConfirmDialog from '@/components/dashboard/HOME-v2/ConfirmDialog';
import { Event } from '@/types';
import { allEvents, convertToDashboardEvent } from '@/lib/events-data';
import { parseExcludedAttributesFromMessage } from '@/lib/fast-search-attribute-utils';

// UI 상태 관리를 위한 reducer
type UIState = {
  selectedEventId: string | null;
  highlightedEventId: string | null;
  hideControls: boolean;
  leftPanelCollapsed: boolean;
  panelsSlidOut: boolean;
  showFastSearch: boolean;
  showFastSearchList: boolean;
  showAIAgentPopup: boolean;
  showCCTV: boolean;
  showReSearchProgress: boolean;
  showObjectTrackingConfirm: boolean;
  showObjectTracking: boolean;
  selectedMenuId: 'fast-search' | 'object-tracking' | 'broadcast' | null;
};

type UIAction =
  | { type: 'SET_SELECTED_EVENT'; payload: string | null }
  | { type: 'SET_HIGHLIGHTED_EVENT'; payload: string | null }
  | { type: 'START_FAST_SEARCH' }
  | { type: 'COMPLETE_FAST_SEARCH' }
  | { type: 'SHOW_FAST_SEARCH_LIST' }
  | { type: 'HIDE_FAST_SEARCH_LIST' }
  | { type: 'START_RE_SEARCH' }
  | { type: 'COMPLETE_RE_SEARCH' }
  | { type: 'SHOW_OBJECT_TRACKING_CONFIRM' }
  | { type: 'HIDE_OBJECT_TRACKING_CONFIRM' }
  | { type: 'START_OBJECT_TRACKING' }
  | { type: 'SET_MENU'; payload: 'fast-search' | 'object-tracking' | 'broadcast' | null }
  | { type: 'TOGGLE_LEFT_PANEL' }
  | { type: 'CLEAR_ALL' };

const uiReducer = (state: UIState, action: UIAction): UIState => {
  switch (action.type) {
    case 'SET_SELECTED_EVENT':
      return { ...state, selectedEventId: action.payload };
    case 'SET_HIGHLIGHTED_EVENT':
      return { ...state, highlightedEventId: action.payload };
    case 'START_FAST_SEARCH':
      return {
        ...state,
        panelsSlidOut: true,
        showCCTV: false,
        hideControls: true,
        showFastSearch: true,
        selectedMenuId: 'fast-search',
      };
    case 'COMPLETE_FAST_SEARCH':
      return {
        ...state,
        showFastSearch: false,
        showFastSearchList: true,
        showAIAgentPopup: true,
      };
    case 'SHOW_FAST_SEARCH_LIST':
      return {
        ...state,
        panelsSlidOut: true,
        showCCTV: false,
        hideControls: true,
        showFastSearchList: true,
        selectedMenuId: 'fast-search',
      };
    case 'HIDE_FAST_SEARCH_LIST':
      return {
        ...state,
        showFastSearchList: false,
        showAIAgentPopup: false,
        panelsSlidOut: false,
        showCCTV: true,
        hideControls: false,
        showFastSearch: false,
        selectedMenuId: null,
      };
    case 'START_RE_SEARCH':
      return { ...state, showReSearchProgress: true };
    case 'COMPLETE_RE_SEARCH':
      return { ...state, showReSearchProgress: false };
    case 'SHOW_OBJECT_TRACKING_CONFIRM':
      return { ...state, showObjectTrackingConfirm: true };
    case 'HIDE_OBJECT_TRACKING_CONFIRM':
      return { ...state, showObjectTrackingConfirm: false };
    case 'START_OBJECT_TRACKING':
      return {
        ...state,
        showObjectTrackingConfirm: false,
        showObjectTracking: true,
        showFastSearchList: false,
        showAIAgentPopup: true,
        hideControls: true,
        selectedMenuId: 'object-tracking',
      };
    case 'SET_MENU':
      return { ...state, selectedMenuId: action.payload };
    case 'TOGGLE_LEFT_PANEL':
      return { ...state, leftPanelCollapsed: !state.leftPanelCollapsed };
    case 'CLEAR_ALL':
      return {
        selectedEventId: null,
        highlightedEventId: null,
        hideControls: false,
        leftPanelCollapsed: state.leftPanelCollapsed,
        panelsSlidOut: false,
        showFastSearch: false,
        showFastSearchList: false,
        showAIAgentPopup: false,
        showCCTV: true,
        showReSearchProgress: false,
        showObjectTrackingConfirm: false,
        showObjectTracking: false,
        selectedMenuId: null,
      };
    default:
      return state;
  }
};

export default function HomeV2() {
  const navigate = useNavigate();
  
  // UI 상태를 reducer로 통합 관리
  const [uiState, dispatch] = useReducer(uiReducer, {
    selectedEventId: null,
    highlightedEventId: null,
    hideControls: false,
    leftPanelCollapsed: false,
    panelsSlidOut: false,
    showFastSearch: false,
    showFastSearchList: false,
    showAIAgentPopup: false,
    showCCTV: true,
    showReSearchProgress: false,
    showObjectTrackingConfirm: false,
    showObjectTracking: false,
    selectedMenuId: null,
  });

  // 나머지 필요한 state들
  const [mapZoomLevel, setMapZoomLevel] = useState<number>(0);
  const [aiDetectionEventId, setAiDetectionEventId] = useState<string | null>(null);
  const [visibleEventIds, setVisibleEventIds] = useState<Set<string>>(new Set());
  const [listCardCount, setListCardCount] = useState<number>(0);
  const [fastSearchRadius, setFastSearchRadius] = useState<number>(300);
  const [reportPopupHeight, setReportPopupHeight] = useState<number>(0);
  const [pinOffset, setPinOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [excludedAttributes, setExcludedAttributes] = useState<string[]>([]);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);
  const [agentPopupMaxHeight, setAgentPopupMaxHeight] = useState<number>(500);
  const [openCandidateId, setOpenCandidateId] = useState<string | null>(null);
  const [flyToLocation, setFlyToLocation] = useState<[number, number] | null>(null);
  const [reSearchResult, setReSearchResult] = useState<{ excludedAttributes: string[]; deletedCount: number } | null>(null);
  const [showPredictedCCTV, setShowPredictedCCTV] = useState<boolean>(false);
  const [visibleTrackingPins, setVisibleTrackingPins] = useState<number>(0); // 0~4: 보이는 핀 개수
  
  // Refs
  const previousListCardCountRef = useRef<number>(0);
  const currentExcludedAttributesRef = useRef<string[]>([]);
  const isReSearchingRef = useRef<boolean>(false);
  const cctvScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUserScrollingRef = useRef<boolean>(false);
  const userScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 모든 이벤트를 한 번만 변환 (종결되지 않은 것만)
  const allConvertedEvents: Event[] = useMemo(() => {
    return allEvents
      .map((event, index) => convertToDashboardEvent(event, index))
      .filter((event) => event.processingStage !== '종결');
  }, []);

  // 보이는 이벤트만 필터링 (중복 로직 제거)
  const visibleEvents: Event[] = useMemo(() => {
    if (visibleEventIds.size === 0) return [];
    return allConvertedEvents.filter((event) => visibleEventIds.has(event.id));
  }, [allConvertedEvents, visibleEventIds]);

  // MapView용 이벤트 (선택된 이벤트를 맨 앞에 추가)
  const events: Event[] = useMemo(() => {
    // 객체 추적 중이거나 추적 핀이 표시되고 있으면 이벤트 핀 숨김
    if (uiState.showObjectTracking || visibleTrackingPins > 0) {
      return [];
    }
    
    if (uiState.showFastSearchList && uiState.selectedEventId) {
      const alreadyInList = visibleEvents.some((e) => e.id === uiState.selectedEventId);
      if (!alreadyInList) {
        const selected = allConvertedEvents.find((e) => e.id === uiState.selectedEventId);
        if (selected) return [selected, ...visibleEvents];
      }
    }
    return visibleEvents;
  }, [visibleEvents, uiState.showFastSearchList, uiState.selectedEventId, allConvertedEvents, uiState.showObjectTracking, visibleTrackingPins]);

  // 고속검색 리스트 패널이 열릴 때, 지도를 "조금만" 우측으로 이동시키기 위한 포커스 위치
  const fastSearchFocusXPercent = uiState.showFastSearchList ? 52 : 50;

  // 메뉴 선택 핸들러 (useCallback으로 메모이제이션)
  const handleMenuSelect = useCallback((menuId: 'fast-search' | 'object-tracking' | 'broadcast') => {
    dispatch({ type: 'SET_MENU', payload: menuId });
    
    if (menuId === 'fast-search') {
      dispatch({ type: 'START_FAST_SEARCH' });
    } else if (menuId === 'object-tracking') {
      if (uiState.showFastSearchList) {
        dispatch({ type: 'SHOW_OBJECT_TRACKING_CONFIRM' });
      }
    }
  }, [uiState.showFastSearchList]);

  // 이벤트 액션 핸들러 (useCallback으로 메모이제이션)
  const handleEventAction = useCallback((eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event?.eventId) {
      navigate(`/event/${event.eventId}`);
      return;
    }
    dispatch({ type: 'SET_SELECTED_EVENT', payload: eventId });
    dispatch({ type: 'SET_HIGHLIGHTED_EVENT', payload: eventId });
  }, [events, navigate]);

  // 이벤트 호버 핸들러 (useCallback으로 메모이제이션)
  const handleEventHover = useCallback((eventId: string | null) => {
    dispatch({ type: 'SET_HIGHLIGHTED_EVENT', payload: eventId });
  }, []);

  // 선택 초기화 핸들러 (useCallback으로 메모이제이션)
  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
    setAiDetectionEventId(null);
    setMapZoomLevel(0);
    setPinOffset({ x: 0, y: 0 });
    setExcludedAttributes([]);
    setFlyToLocation(null);
  }, []);

  // 객체 추적 시퀀스 시작 핸들러
  const handleStartTrackingSequence = useCallback(() => {
    console.log('[Home-v2] 객체 추적 시퀀스 시작');
    
    // 기존 이벤트 핀 숨기기
    setVisibleEventIds(new Set());
    dispatch({ type: 'SET_SELECTED_EVENT', payload: null });
    
    // 기존 추적 핀 초기화
    setVisibleTrackingPins(0);
    setShowPredictedCCTV(false);
    
    // 추적 경로 좌표
    const trackingSequence = [
      [126.783853180335, 37.5049838114765], // 1번: 사건 발생 지점
      [126.7843434, 37.5042779],            // 2번: 춘의동 126-18
      [126.7828196, 37.50501939999999],     // 3번: 춘의동 125-46
      [126.7828168, 37.504067],             // 4번: 춘의동 125-32
    ];
    
    // 1단계: 1번 핀 표시 및 줌인 (초기화 후 약간의 딜레이)
    setTimeout(() => {
      console.log('[Home-v2] 1단계: 1번 핀 표시');
      setVisibleTrackingPins(1);
      setFlyToLocation(trackingSequence[0] as [number, number]);
    }, 100);
    
    // 2단계: 2번 핀 표시 및 이동 (2.1초 후)
    setTimeout(() => {
      console.log('[Home-v2] 2단계: 2번 핀 표시');
      setVisibleTrackingPins(2);
      setFlyToLocation(trackingSequence[1] as [number, number]);
    }, 2100);
    
    // 3단계: 3번 핀 표시 및 이동 (4.1초 후)
    setTimeout(() => {
      console.log('[Home-v2] 3단계: 3번 핀 표시');
      setVisibleTrackingPins(3);
      setFlyToLocation(trackingSequence[2] as [number, number]);
    }, 4100);
    
    // 4단계: 4번 핀 표시 및 이동 (6.1초 후)
    setTimeout(() => {
      console.log('[Home-v2] 4단계: 4번 핀 표시');
      setVisibleTrackingPins(4);
      setFlyToLocation(trackingSequence[3] as [number, number]);
    }, 6100);
    
    // 5단계: 줌 아웃 (8.1초 후)
    setTimeout(() => {
      console.log('[Home-v2] 5단계: 줌 아웃');
      setShowPredictedCCTV(true);
    }, 8100);
  }, []);

  /** 에이전트 팝업 maxHeight 및 windowWidth 업데이트 */
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      const topPx = reportPopupHeight > 0 ? 20 + reportPopupHeight + 24 : 424; // 1.25rem = 20px
      const reserveBottom = 24 + 56 + 8; // 플로팅 버튼 영역
      setAgentPopupMaxHeight(Math.max(200, window.innerHeight - topPx - reserveBottom));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [reportPopupHeight]);

  // 재검색 완료 후 카드 개수 변경 감지
  useEffect(() => {
    if (!uiState.showReSearchProgress && isReSearchingRef.current) {
      if (previousListCardCountRef.current > 0 && listCardCount < previousListCardCountRef.current) {
        const deletedCount = previousListCardCountRef.current - listCardCount;
        setReSearchResult({
          excludedAttributes: currentExcludedAttributesRef.current,
          deletedCount: deletedCount,
        });
        isReSearchingRef.current = false;
      }
    }
  }, [listCardCount, uiState.showReSearchProgress]);

  // 키보드 단축키 핸들러 (useCallback으로 최적화)
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    const missingEvent = allConvertedEvents.find(event => 
      event.eventId === 'A-20260107-004' || event.id === 'A-20260107-004'
    );
    
    if (e.key === '1' && missingEvent) {
      dispatch({ type: 'SET_SELECTED_EVENT', payload: missingEvent.id });
      dispatch({ type: 'SET_HIGHLIGHTED_EVENT', payload: missingEvent.id });
      setVisibleEventIds(prev => new Set([...prev, missingEvent.id]));
      setFlyToLocation([126.783853180335, 37.5049838114765]);
    } else if (e.key === '2' && missingEvent) {
      dispatch({ type: 'SET_SELECTED_EVENT', payload: missingEvent.id });
      dispatch({ type: 'SET_HIGHLIGHTED_EVENT', payload: missingEvent.id });
      dispatch({ type: 'SHOW_FAST_SEARCH_LIST' });
      setVisibleEventIds(prev => new Set([...prev, missingEvent.id]));
      setFlyToLocation([126.783853180335, 37.5049838114765]);
      setPinOffset({ x: 0, y: 0 });
    } else if (e.key === '3') {
      console.log('[Home-v2] 3번 키 - 객체 추적 시작');
      handleStartTrackingSequence();
    } else if (e.key === '4') {
      dispatch({ type: 'SHOW_FAST_SEARCH_LIST' });
      setPinOffset({ x: 0, y: 0 });
      setOpenCandidateId('43');
    } else if (e.key === 'Escape') {
      if (uiState.showFastSearchList) {
        dispatch({ type: 'HIDE_FAST_SEARCH_LIST' });
      } else {
        clearSelection();
      }
    }
  }, [allConvertedEvents, uiState.showFastSearchList, clearSelection, handleStartTrackingSequence]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <div
      className="relative bg-[#0a0e14] overflow-hidden"
      style={{ width: '100vw', height: '100vh' }}
    >

      <div className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
        <MapView
          events={events}
          highlightedEventId={uiState.highlightedEventId}
          selectedEventId={uiState.selectedEventId}
          aiDetectionEventId={aiDetectionEventId}
          onEventClick={handleEventAction}
          onAiDetectionClose={clearSelection}
          onMapClick={undefined}
          externalZoomLevel={mapZoomLevel}
          onZoomLevelChange={setMapZoomLevel}
          hideControls={uiState.hideControls}
          showFastSearch={uiState.showFastSearch}
          showFastSearchList={uiState.showFastSearchList}
          fastSearchRadius={fastSearchRadius}
          leftPanelWidth={uiState.leftPanelCollapsed ? 80 : 416}
          pinOffset={pinOffset}
          focusTargetXPercent={fastSearchFocusXPercent}
          flyToLocation={flyToLocation}
          externalShowCCTV={!uiState.showObjectTracking}
          showPredictedCCTV={showPredictedCCTV}
          visibleTrackingPins={visibleTrackingPins}
        />
      </div>

      {/* 좌측 메뉴 패널 - 고속검색 또는 객체 추적 시 표시 */}
      <div 
        className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ease-out ${uiState.showFastSearchList || uiState.showObjectTracking ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}
        style={{ zIndex: 101 }}
      >
        <LeftMenuPanel onMenuSelect={handleMenuSelect} selectedMenuId={uiState.selectedMenuId} />
      </div>

      <div 
        className={`absolute top-0 bottom-0 transition-all duration-300 ease-out ${uiState.panelsSlidOut ? '-translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}
        style={{ zIndex: 100, left: '0px' }}
      >
        <LeftPanel onCollapsedChange={(collapsed) => dispatch({ type: 'TOGGLE_LEFT_PANEL' })} />
      </div>

      <div 
        className={`absolute right-0 top-0 bottom-0 flex flex-col pl-4 pr-5 gap-4 transition-all duration-300 ease-out ${uiState.panelsSlidOut ? 'translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}
        style={{ width: '370px', zIndex: 100, paddingTop: '16px', paddingBottom: '16px' }}
      >
        <HeatmapPanel 
          areaLabels={{
            zone1: '중동',
            zone2: '상동',
            zone3: '심곡동',
            zone4: '소사동',
            zone5: '역곡동',
            zone6: '송내동',
            zone7: '오정동',
            zone8: '원종동',
          }}
        />
        <div className="rounded-lg p-4 flex-1 overflow-hidden gradient-border-right-bottom" style={{ minHeight: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
          <EventList
            events={visibleEvents}
            selectedEventId={uiState.selectedEventId || undefined}
            onEventSelect={handleEventAction}
            onEventHover={handleEventHover}
          />
        </div>
      </div>

      {/* BottomPanel (CCTV 화면) */}
      <BottomPanel
        showCCTV={uiState.showCCTV}
        hideControls={uiState.hideControls}
        leftPanelWidth={uiState.leftPanelCollapsed ? 80 : 416}
        windowWidth={windowWidth}
        cctvScrollContainerRef={cctvScrollContainerRef}
        isUserScrollingRef={isUserScrollingRef}
        userScrollTimeoutRef={userScrollTimeoutRef}
        autoScrollIntervalRef={autoScrollIntervalRef}
      />

      {/* ReportPopup */}
      {uiState.selectedEventId && !uiState.showFastSearch && (
        <ReportPopup
          event={allConvertedEvents.find(e => e.id === uiState.selectedEventId) || null}
          onClose={clearSelection}
          onFastSearchStart={() => dispatch({ type: 'START_FAST_SEARCH' })}
          showFastSearchStartButton={!uiState.showFastSearchList && !uiState.showObjectTracking}
          onLayout={setReportPopupHeight}
          position={uiState.showFastSearchList || uiState.showObjectTracking ? { top: '1.25rem', right: '20px' } : { top: '1.25rem', right: '370px' }}
        />
      )}

      {/* FastSearchProgress */}
      <FastSearchProgress
        isVisible={uiState.showFastSearch}
        hideDim={false}
        onComplete={() => {
          dispatch({ type: 'COMPLETE_FAST_SEARCH' });
          setPinOffset({ x: 0, y: 0 });
        }}
      />

      {/* FastSearchListPanel - 재검색 시 리스트 박스 전체(상단 버튼 포함) 딤 + 프로그래스 중앙 */}
      <FastSearchListPanel
        isVisible={uiState.showFastSearchList && !uiState.showObjectTracking}
        onListCardCountChange={setListCardCount}
        onRadiusChange={setFastSearchRadius}
        showReSearchDim={uiState.showReSearchProgress}
        onReSearchComplete={() => {
          dispatch({ type: 'COMPLETE_RE_SEARCH' });
          isReSearchingRef.current = true;
        }}
        onReSearchClick={() => {
          previousListCardCountRef.current = listCardCount;
          currentExcludedAttributesRef.current = excludedAttributes;
          dispatch({ type: 'START_RE_SEARCH' });
        }}
        excludedAttributes={excludedAttributes}
        openCandidateId={openCandidateId}
        onCandidateOpened={() => setOpenCandidateId(null)}
      />

      {/* 객체 추적 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={uiState.showObjectTrackingConfirm}
        title="객체 추적 검사"
        message={`현재 고속 검색 결과 ${listCardCount}건이 있습니다.\n객체 추적 검사를 시작하시겠습니까?`}
        confirmText="시작"
        cancelText="취소"
        onConfirm={() => {
          dispatch({ type: 'START_OBJECT_TRACKING' });
          handleStartTrackingSequence();
        }}
        onCancel={() => dispatch({ type: 'HIDE_OBJECT_TRACKING_CONFIRM' })}
      />

      {/* 에이전트 팝업: 고속검색 리스트 시 신고팝업 아래 여백(24px) 유지, 사건팝업 높이 변동에 따라 위치 조정 */}
      {uiState.showAIAgentPopup && (
        <AIAgentPopup
          isOpen={uiState.showAIAgentPopup}
          onClose={() => dispatch({ type: 'COMPLETE_FAST_SEARCH' })}
          hideControls={uiState.hideControls}
          position={{
            top: `${reportPopupHeight > 0 ? 20 + reportPopupHeight + 24 : 424}px`,
            right: '20px',
          }}
          listCardCount={listCardCount}
          onDeleteLikeRequest={({ rawMessage }) => {
            const parsed = parseExcludedAttributesFromMessage(rawMessage);
            
            if (parsed.length) {
              previousListCardCountRef.current = listCardCount;
              currentExcludedAttributesRef.current = parsed;
              isReSearchingRef.current = true;
              setExcludedAttributes((prev) => Array.from(new Set([...prev, ...parsed])));
              dispatch({ type: 'START_RE_SEARCH' });
            }
            
            return parsed;
          }}
          maxHeight={agentPopupMaxHeight}
          reSearchResult={reSearchResult}
          isObjectTracking={uiState.showObjectTracking}
          onObjectTrackingComplete={handleStartTrackingSequence}
        />
      )}
    </div>
  );
}
