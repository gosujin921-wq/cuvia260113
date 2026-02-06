import { useState, useMemo, useEffect, useRef } from 'react';
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
  const [fastSearchRadius, setFastSearchRadius] = useState<number>(300);
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
  const [selectedMenuId, setSelectedMenuId] = useState<'fast-search' | 'object-tracking' | 'broadcast' | null>(null);
  const [flyToLocation, setFlyToLocation] = useState<[number, number] | null>(null); // 지도 이동 좌표
  const [reSearchResult, setReSearchResult] = useState<{ excludedAttributes: string[]; deletedCount: number } | null>(null);
  const [showObjectTrackingConfirm, setShowObjectTrackingConfirm] = useState(false);
  const previousListCardCountRef = useRef<number>(0);
  const currentExcludedAttributesRef = useRef<string[]>([]);
  const isReSearchingRef = useRef<boolean>(false);
  const cctvScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUserScrollingRef = useRef<boolean>(false);
  const userScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allConvertedEvents: Event[] = useMemo(() => {
    return allEvents
      .map((event, index) => convertToDashboardEvent(event, index))
      .filter((event) => event.processingStage !== '종결');
  }, []);


  const events: Event[] = useMemo(() => {
    const base =
      visibleEventIds.size === 0
        ? []
        : allConvertedEvents.filter((event) => visibleEventIds.has(event.id));
    if (showFastSearchList && selectedEventId) {
      const alreadyInList = base.some((e) => e.id === selectedEventId);
      if (!alreadyInList) {
        const selected = allConvertedEvents.find((e) => e.id === selectedEventId);
        if (selected) return [selected, ...base];
      }
    }
    console.log('MapView에 전달되는 events:', base.length, 'visibleEventIds size:', visibleEventIds.size);
    return base;
  }, [allConvertedEvents, visibleEventIds, showFastSearchList, selectedEventId]);

  const eventsForList: Event[] = useMemo(() => {
    return visibleEventIds.size > 0
      ? allConvertedEvents.filter(event => visibleEventIds.has(event.id))
      : [];
  }, [allConvertedEvents, visibleEventIds]);

  // 고속검색 리스트 패널이 열릴 때, 지도를 "조금만" 우측으로 이동시키기 위한 포커스 위치
  // - 평상시: 50 (지도 컨테이너 정중앙)
  // - 리스트 패널 열림: 52 (약간 우측으로만 이동)
  const fastSearchFocusXPercent = useMemo(() => {
    if (!showFastSearchList) return 50;
    return 52;
  }, [showFastSearchList]);

  const handleMenuSelect = (menuId: 'fast-search' | 'object-tracking' | 'broadcast') => {
    setSelectedMenuId(menuId);
    
    // 메뉴별 동작 정의
    if (menuId === 'fast-search') {
      // 고속검색: 키보드 2번 단축키와 동일한 동작
      setPanelsSlidOut(true);
      setShowCCTV(false);
      setHideControls(true);
      setShowFastSearch(true);
      setHideDimForFastSearch(false);
    } else if (menuId === 'object-tracking') {
      // 객체추적: 고속검색 패널이 떠 있을 때만 다이얼로그 표시
      if (showFastSearchList) {
        setShowObjectTrackingConfirm(true);
      } else {
        console.log('객체추적 기능 - 고속검색 패널이 필요합니다');
      }
    } else if (menuId === 'broadcast') {
      // 전파: 추후 구현 예정
      console.log('전파 기능 준비중');
    }
  };

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
    setSelectedMenuId(null);
    setFlyToLocation(null);
  };

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
    console.log('[Home-v2] listCardCount 변경:', {
      isReSearching: isReSearchingRef.current,
      previousCount: previousListCardCountRef.current,
      currentCount: listCardCount,
      excludedAttributes: currentExcludedAttributesRef.current,
      showReSearchProgress,
    });
    
    // 재검색 프로그래스가 끝나고 카드 개수가 변경되었을 때
    if (!showReSearchProgress && isReSearchingRef.current) {
      if (previousListCardCountRef.current > 0 && listCardCount < previousListCardCountRef.current) {
        const deletedCount = previousListCardCountRef.current - listCardCount;
        console.log('[Home-v2] 삭제 결과 계산:', {
          excludedAttributes: currentExcludedAttributesRef.current,
          deletedCount,
        });
        setReSearchResult({
          excludedAttributes: currentExcludedAttributesRef.current,
          deletedCount: deletedCount,
        });
        isReSearchingRef.current = false;
      }
    }
  }, [listCardCount, showReSearchProgress]);

  // showFastSearchList 상태 변경 로그 및 메뉴 선택 상태 동기화
  useEffect(() => {
    console.log('[Home-v2] showFastSearchList 상태 변경:', showFastSearchList);
    if (showFastSearchList) {
      setSelectedMenuId('fast-search');
    }
  }, [showFastSearchList]);

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
        console.log('키보드 1 눌림, missingEvent:', missingEvent);
        if (missingEvent) {
          setHideControls(true);
          setSelectedEventId(missingEvent.id);
          setHighlightedEventId(missingEvent.id);
          setVisibleEventIds(prev => new Set([...prev, missingEvent.id]));
          // 춘의동 125-46 좌표로 지도 이동
          setFlyToLocation([126.783853180335, 37.5049838114765]);
        }
      } else if (e.key === '2') {
        // 고속검색 완료 화면 바로 표시 (프로그래스바 생략)
        const missingEvent = allConvertedEvents.find(event => 
          event.eventId === 'A-20260107-004' || event.id === 'A-20260107-004'
        );
        console.log('키보드 2 눌림, missingEvent:', missingEvent);
        if (missingEvent) {
          setHideControls(true);
          setSelectedEventId(missingEvent.id);
          setHighlightedEventId(missingEvent.id);
          setVisibleEventIds(prev => new Set([...prev, missingEvent.id]));
          // 춘의동 125-46 좌표로 지도 이동
          setFlyToLocation([126.783853180335, 37.5049838114765]);
          // 고속검색 완료 화면 표시
          setPanelsSlidOut(true);
          setShowCCTV(false);
          setShowFastSearchList(true);
          setShowAIAgentPopup(true);
          setPinOffset({ x: 0, y: 0 });
        }
      } else if (e.key === '3') {
        // 직접 FastSearchListPanel 열기 (테스트용)
        // selectedEventId는 유지하여 지도 카메라 이동 가능하도록 함
        setPanelsSlidOut(true);
        setShowCCTV(false);
        setHideControls(true);
        setShowFastSearchList(true);
        setPinOffset({ x: 0, y: 0 });
      } else if (e.key === '4') {
        // 59번 이미지 팝업 열기 (43번 카드 = qs_img_59_y)
        setPanelsSlidOut(true);
        setShowCCTV(false);
        setHideControls(true);
        setShowFastSearchList(true);
        setPinOffset({ x: 0, y: 0 });
        setShowAIAgentPopup(true);
        // 43번 카드 자동 열기
        setOpenCandidateId('43');
      } else if (e.key === 'Escape') {
        // 고속검색 리스트가 열려있으면 닫기만 하고, 아니면 전체 초기화
        if (showFastSearchList) {
          setShowFastSearchList(false);
          setShowAIAgentPopup(false);
          setPanelsSlidOut(false);
          setShowCCTV(true);
          setHideControls(false);
          setShowFastSearch(false);
          setSelectedMenuId(null);
        } else {
          clearSelection();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [allConvertedEvents]);

  return (
    <div
      className="relative bg-[#0a0e14] overflow-hidden"
      style={{ width: '100vw', height: '100vh' }}
    >

      <div className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
        <MapView
          events={events}
          highlightedEventId={highlightedEventId}
          selectedEventId={selectedEventId}
          aiDetectionEventId={aiDetectionEventId}
          onEventClick={handleEventAction}
          onAiDetectionClose={clearSelection}
          onMapClick={undefined}
          externalZoomLevel={mapZoomLevel}
          onZoomLevelChange={setMapZoomLevel}
          hideControls={hideControls}
          showFastSearch={showFastSearch}
          showFastSearchList={showFastSearchList}
          fastSearchRadius={fastSearchRadius}
          leftPanelWidth={leftPanelCollapsed ? 80 : 416}
          pinOffset={pinOffset}
          focusTargetXPercent={fastSearchFocusXPercent}
          flyToLocation={flyToLocation}
        />
      </div>

      {/* 좌측 메뉴 패널 - 고속검색 시작 시 좌측에서 우측으로 슬라이드 */}
      <div 
        className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ease-out ${showFastSearchList ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}
        style={{ zIndex: 101 }}
      >
        <LeftMenuPanel onMenuSelect={handleMenuSelect} selectedMenuId={selectedMenuId} />
      </div>

      <div 
        className={`absolute top-0 bottom-0 transition-all duration-300 ease-out ${panelsSlidOut ? '-translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}
        style={{ zIndex: 100, left: '0px' }}
      >
        <LeftPanel onCollapsedChange={setLeftPanelCollapsed} />
      </div>

      <div 
        className={`absolute right-0 top-0 bottom-0 flex flex-col pl-4 pr-5 gap-4 transition-all duration-300 ease-out ${panelsSlidOut ? 'translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}
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
        leftPanelWidth={leftPanelCollapsed ? 80 : 416}
        windowWidth={windowWidth}
        cctvScrollContainerRef={cctvScrollContainerRef}
        isUserScrollingRef={isUserScrollingRef}
        userScrollTimeoutRef={userScrollTimeoutRef}
        autoScrollIntervalRef={autoScrollIntervalRef}
      />

      {/* ReportPopup */}
      {selectedEventId && !showFastSearch && (
        <ReportPopup
          event={allConvertedEvents.find(e => e.id === selectedEventId) || null}
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
          position={showFastSearchList ? { top: '1.25rem', right: '20px' } : { top: '1.25rem', right: '370px' }}
        />
      )}

      {/* FastSearchProgress */}
      <FastSearchProgress
        isVisible={showFastSearch}
        hideDim={hideDimForFastSearch}
        onComplete={() => {
          if (!hideDimForFastSearch) {
            console.log('프로그래스바 완료 - showFastSearchList를 true로 설정');
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
        onReSearchComplete={() => {
          console.log('[Home-v2] 재검색 완료');
          setShowReSearchProgress(false);
          isReSearchingRef.current = true;
        }}
        onReSearchClick={() => {
          // 재검색 시작 시 현재 카드 개수와 제외 속성 저장
          console.log('[Home-v2] 재검색 시작:', {
            currentCount: listCardCount,
            excludedAttributes,
          });
          previousListCardCountRef.current = listCardCount;
          currentExcludedAttributesRef.current = excludedAttributes;
          setShowReSearchProgress(true);
        }}
        excludedAttributes={excludedAttributes}
        openCandidateId={openCandidateId}
        onCandidateOpened={() => setOpenCandidateId(null)}
      />

      {/* 객체 추적 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={showObjectTrackingConfirm}
        title="객체 추적 검사"
        message={`현재 고속 검색 결과 ${listCardCount}건이 있습니다.\n객체 추적 검사를 시작하시겠습니까?`}
        confirmText="시작"
        cancelText="취소"
        onConfirm={() => {
          setShowObjectTrackingConfirm(false);
          console.log('객체추적 시작');
          // TODO: 객체추적 로직 구현
        }}
        onCancel={() => {
          setShowObjectTrackingConfirm(false);
        }}
      />

      {/* 에이전트 팝업: 고속검색 리스트 시 신고팝업 아래 여백(24px) 유지, 사건팝업 높이 변동에 따라 위치 조정 */}
      {showFastSearchList && showAIAgentPopup && (
        <AIAgentPopup
          isOpen={showAIAgentPopup}
          onClose={() => setShowAIAgentPopup(false)}
          hideControls={hideControls}
          position={{
            top: `${reportPopupHeight > 0 ? 20 + reportPopupHeight + 24 : 424}px`,
            right: '20px',
          }}
          listCardCount={listCardCount}
          onDeleteLikeRequest={({ rawMessage }) => {
            const parsed = parseExcludedAttributesFromMessage(rawMessage);
            console.log('[Home-v2] 삭제 요청:', { rawMessage, parsed, currentCount: listCardCount });
            
            if (parsed.length) {
              // 재검색 시작 전에 현재 상태 저장
              previousListCardCountRef.current = listCardCount;
              currentExcludedAttributesRef.current = parsed;
              isReSearchingRef.current = true; // 재검색 시작
              setExcludedAttributes((prev) => Array.from(new Set([...prev, ...parsed])));
              setShowReSearchProgress(true);
            }
            
            // 파싱된 속성 배열 반환 (없으면 빈 배열)
            return parsed;
          }}
          maxHeight={agentPopupMaxHeight}
          reSearchResult={reSearchResult}
        />
      )}
    </div>
  );
}
