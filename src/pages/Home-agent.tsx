import { useState, useMemo, useEffect, useRef, useCallback, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import EventList from '@/components/dashboard/EventList';
import MapView from '@/components/dashboard/HOME-v4/MapView';
import LeftPanel from '@/components/dashboard/LeftPanel';
import HeatmapPanel from '@/components/dashboard/HeatmapPanel';
import BottomPanel from '@/components/dashboard/BottomPanel';
import AIAgentPopup2 from '@/components/dashboard/HOME-v4/AIAgentPopup-2';
import { Event } from '@/types';
import { allEvents, convertToDashboardEvent } from '@/lib/events-data';

type UIState = {
  selectedEventId: string | null;
  highlightedEventId: string | null;
  hideControls: boolean;
  leftPanelCollapsed: boolean;
  panelsSlidOut: boolean;
  showAIAgentPopup: boolean;
  showCCTV: boolean;
  selectedMenuId: 'net-monitoring' | 'fast-search' | 'object-tracking' | 'capture-list' | 'propagation' | 'broadcast' | null;
};

type UIAction =
  | { type: 'SET_SELECTED_EVENT'; payload: string | null }
  | { type: 'SET_HIGHLIGHTED_EVENT'; payload: string | null }
  | { type: 'SET_MENU'; payload: UIState['selectedMenuId'] }
  | { type: 'TOGGLE_LEFT_PANEL' }
  | { type: 'CLEAR_ALL' }
  | { type: 'SHOW_AGENT_POPUP' }
  | { type: 'HIDE_AGENT_POPUP' };

const uiReducer = (state: UIState, action: UIAction): UIState => {
  switch (action.type) {
    case 'SET_SELECTED_EVENT':
      return { ...state, selectedEventId: action.payload };
    case 'SET_HIGHLIGHTED_EVENT':
      return { ...state, highlightedEventId: action.payload };
    case 'SET_MENU':
      return { ...state, selectedMenuId: action.payload };
    case 'TOGGLE_LEFT_PANEL':
      return { ...state, leftPanelCollapsed: !state.leftPanelCollapsed };
    case 'SHOW_AGENT_POPUP':
      return { ...state, showAIAgentPopup: true };
    case 'HIDE_AGENT_POPUP':
      return { ...state, showAIAgentPopup: false };
    case 'CLEAR_ALL':
      return {
        selectedEventId: null,
        highlightedEventId: null,
        hideControls: false,
        leftPanelCollapsed: state.leftPanelCollapsed,
        panelsSlidOut: false,
        showAIAgentPopup: false,
        showCCTV: true,
        selectedMenuId: null,
      };
    default:
      return state;
  }
};

export default function HomeAgent() {
  const navigate = useNavigate();

  const [uiState, dispatch] = useReducer(uiReducer, {
    selectedEventId: null,
    highlightedEventId: null,
    hideControls: false,
    leftPanelCollapsed: false,
    panelsSlidOut: false,
    showAIAgentPopup: false,
    showCCTV: true,
    selectedMenuId: null,
  });

  const [visibleEventIds, setVisibleEventIds] = useState<Set<string>>(new Set());
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);
  const [agentPopupMaxHeight, setAgentPopupMaxHeight] = useState<number>(500);
  const [flyToLocation, setFlyToLocation] = useState<[number, number] | null>(null);
  const [lastMapState, setLastMapState] = useState<{ center: [number, number]; zoom: number; pitch: number; bearing: number }>({
    center: [126.8136, 37.4865],
    zoom: 15,
    pitch: 60,
    bearing: -17.6,
  });
  const [agentMessage, setAgentMessage] = useState<string>('');
  const [agentMessages, setAgentMessages] = useState<Array<{ id: number; text: string; role: 'agent' | 'user' }>>([]);
  const [pendingPopupMessage, setPendingPopupMessage] = useState<string | null>(null);
  const [isAgentInputExpanded, setIsAgentInputExpanded] = useState(false);
  const [isAgentActive, setIsAgentActive] = useState(false);

  const agentMessagesEndRef = useRef<HTMLDivElement | null>(null);
  const agentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const agentIsComposingRef = useRef(false);
  const agentPendingEnterRef = useRef(false);
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
        type: '112 치안',
        title: '주차장 소음 민원 신고',
        priority: '일반' as const,
        status: 'NEW' as const,
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 15)),
        location: { name: '하늘시 별빛구 달빛로 지하주차장', coordinates: [126.98, 37.42] as [number, number] },
        processingStage: '생성',
        resolution: { category: '112', code: '001', description: '' },
      },
      {
        id: 'mock-2',
        type: '119 구조',
        title: '노인 낙상 부상 신고',
        priority: '일반' as const,
        status: 'NEW' as const,
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 25)),
        location: { name: '하늘시 별빛구 중앙공원 산책로', coordinates: [126.99, 37.43] as [number, number] },
        processingStage: '선별',
        resolution: { category: '119', code: '002', description: '' },
      },
      {
        id: 'mock-3',
        type: '112 치안',
        title: '횡단보도 신호 위반',
        priority: '일반' as const,
        status: 'MONITORING' as const,
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 35)),
        location: { name: '하늘시 별빛구 달빛로 사거리', coordinates: [126.97, 37.41] as [number, number] },
        processingStage: '착수',
        resolution: { category: '112', code: '003', description: '' },
      },
      {
        id: 'mock-4',
        type: 'AI 탐지',
        title: '이상 행동 AI 탐지',
        priority: '일반' as const,
        status: 'NEW' as const,
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 45)),
        location: { name: '하늘시 별빛구 하늘역 앞 광장', coordinates: [126.96, 37.4] as [number, number] },
        processingStage: '생성',
        resolution: { category: 'AI', code: '004', description: '' },
      },
      {
        id: 'mock-5',
        type: '112 치안',
        title: '차량 사고 교통 정체',
        priority: '일반' as const,
        status: 'MONITORING' as const,
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 55)),
        location: { name: '하늘시 별빛구 구름대로', coordinates: [126.95, 37.39] as [number, number] },
        processingStage: '선별',
        resolution: { category: '112', code: '005', description: '' },
      },
      {
        id: 'mock-6',
        type: '112 실종',
        title: '미아 발생 긴급 수색',
        priority: '주의' as const,
        status: 'MONITORING' as const,
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 10)),
        location: { name: '하늘시 별빛구 달빛초등학교 정문 앞', coordinates: [126.98, 37.42] as [number, number] },
        processingStage: '착수',
        resolution: { category: '112', code: '006', description: '' },
      },
      {
        id: 'mock-7',
        type: '119 구조',
        title: '차량 충돌 사고 발생',
        priority: '주의' as const,
        status: 'NEW' as const,
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 20)),
        location: { name: '하늘시 별빛구 하늘시청 앞 교차로', coordinates: [126.99, 37.43] as [number, number] },
        processingStage: '생성',
        resolution: { category: '119', code: '007', description: '' },
      },
      {
        id: 'mock-8',
        type: '112 치안',
        title: '말다툼 주먹다짐 발생',
        priority: '주의' as const,
        status: 'MONITORING' as const,
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 30)),
        location: { name: '하늘시 별빛구 구름역 인근 상가 앞', coordinates: [126.97, 37.41] as [number, number] },
        processingStage: '착수',
        resolution: { category: '112', code: '008', description: '' },
      },
      {
        id: 'mock-9',
        type: '119 화재',
        title: '쓰레기 수거함 화재 발생',
        priority: '경계' as const,
        status: 'MONITORING' as const,
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 5)),
        location: { name: '하늘시 별빛구 달빛로 아파트 단지 내 쓰레기 수거함', coordinates: [126.96, 37.4] as [number, number] },
        processingStage: '착수',
        resolution: { category: '119', code: '009', description: '' },
      },
      {
        id: 'mock-10',
        type: '112 치안',
        title: '절도 시도 의심 행동',
        priority: '경계' as const,
        status: 'NEW' as const,
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 12)),
        location: { name: '하늘시 별빛구 달빛로 상가 앞', coordinates: [126.95, 37.39] as [number, number] },
        processingStage: '선별',
        resolution: { category: '112', code: '010', description: '' },
      },
    ];
  }, []);

  const isKimDoyeonEvent = (event: Event) => event.eventId === "A-20260107-004" || event.id === "A-20260107-004";

  // 보이는 이벤트만 필터링: 김도연(A-20260107-004)만 1키 입력 시 노출, 나머지는 항상 노출
  const visibleEvents: Event[] = useMemo(() => {
    const alwaysVisibleReal = allConvertedEvents.filter((event) => !isKimDoyeonEvent(event));
    const kimDoyeon = allConvertedEvents.filter((event) => isKimDoyeonEvent(event) && visibleEventIds.has(event.id));
    return [...mockEvents, ...alwaysVisibleReal, ...kimDoyeon];
  }, [allConvertedEvents, visibleEventIds, mockEvents]);

  const events: Event[] = useMemo(() => visibleEvents, [visibleEvents]);

  const handleEventAction = useCallback((eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event?.eventId) {
      navigate(`/event/${event.eventId}`);
      return;
    }
    dispatch({ type: 'SET_SELECTED_EVENT', payload: eventId });
    dispatch({ type: 'SET_HIGHLIGHTED_EVENT', payload: eventId });
  }, [events, navigate]);

  const handleEventHover = useCallback((eventId: string | null) => {
    dispatch({ type: 'SET_HIGHLIGHTED_EVENT', payload: eventId });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
    setFlyToLocation(null);
  }, []);

  const AGENT_TOP_GAP = 16;
  const AGENT_FLOATING_BUTTON_RESERVE = 198 + 30 + 56 + 8;

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (isAgentActive) {
        setAgentPopupMaxHeight(Math.max(200, window.innerHeight - 48));
        return;
      }
      const height = uiState.showCCTV
        ? window.innerHeight - AGENT_FLOATING_BUTTON_RESERVE - AGENT_TOP_GAP
        : window.innerHeight - AGENT_TOP_GAP - (24 + 56 + 8);
      setAgentPopupMaxHeight(Math.max(200, height));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [uiState.showCCTV, isAgentActive]);

  useEffect(() => {
    agentMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages]);

  useEffect(() => {
    if (agentTextareaRef.current) {
      agentTextareaRef.current.style.height = 'auto';
      const scrollHeight = agentTextareaRef.current.scrollHeight;
      const lineHeight = 22;
      const maxHeight = lineHeight * 4;
      const newHeight = Math.min(scrollHeight, maxHeight);
      agentTextareaRef.current.style.height = `${newHeight}px`;
      setIsAgentInputExpanded(newHeight > lineHeight);
    }
  }, [agentMessage]);

  const handleSendAgentMessage = useCallback((messageText?: string) => {
    let currentValue = messageText;
    if (!currentValue && agentTextareaRef.current) currentValue = agentTextareaRef.current.value;
    if (!currentValue) currentValue = agentMessage;
    const trimmed = currentValue.trim();
    if (!trimmed) return;
    setAgentMessages(prev => [...prev, { id: Date.now(), text: trimmed, role: 'user' }]);
    setAgentMessage('');
    if (agentTextareaRef.current) agentTextareaRef.current.value = '';
    if (!isAgentActive) {
      setPendingPopupMessage(trimmed);
      setIsAgentActive(true);
      dispatch({ type: 'SHOW_AGENT_POPUP' });
    }
  }, [agentMessage]);

  const clearPendingPopupMessage = useCallback(() => setPendingPopupMessage(null), []);

  return (
    <div
      className="relative bg-[#0a0e14] overflow-hidden"
      style={{ width: '100vw', height: '100vh' }}
    >
      {/* 에이전트 채팅바 */}
      <div
        className="fixed flex flex-col"
        style={{
          bottom: uiState.showCCTV && !uiState.hideControls ? 228 : 24,
          left: uiState.panelsSlidOut
            ? 'calc(40px + (100vw - 80px) / 2)'
            : `calc(${uiState.leftPanelCollapsed ? 80 : 416}px + (100vw - ${uiState.leftPanelCollapsed ? 80 : 416}px - 370px) / 2)`,
          transform: 'translateX(-50%)',
          zIndex: 300,
          width: 'min(480px, calc(100vw - 32px))',
          transition: 'bottom 0.3s ease-in-out, left 0.3s ease-out, opacity 0.4s ease-out',
          opacity: isAgentActive ? 0 : 1,
          pointerEvents: isAgentActive ? 'none' : 'auto',
        }}
      >
        <div className="mb-2 flex flex-wrap gap-1.5 w-full">
          {['지난달 사건사고 요약해줘', '폭력 많은 지역 알려줘', '어제 밤 폭력사건 보여줘'].map((prompt) => (
            <button
              key={prompt}
              onClick={() => {
                setAgentMessage(prompt);
                agentTextareaRef.current?.focus();
              }}
              className="px-3 py-1 rounded-full text-[12px] text-gray-300 hover:text-white transition-all hover:scale-[1.03] active:scale-95 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              tabIndex={0}
              aria-label={prompt}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div
          className="relative flex items-center gap-2 px-4 py-2 cuvia-link-chat-input cuvia-link-chat-input-dark w-full"
          style={{
            isolation: 'isolate',
            borderRadius: isAgentInputExpanded ? '0.75rem' : '9999px',
            transition: 'border-radius 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }}
        >
          <textarea
            ref={agentTextareaRef}
            value={agentMessage}
            onChange={(e) => {
              const newValue = e.target.value;
              setAgentMessage(newValue);
              if (agentPendingEnterRef.current && !agentIsComposingRef.current) {
                agentPendingEnterRef.current = false;
                const textToSend = newValue.trim();
                if (textToSend) handleSendAgentMessage(textToSend);
              }
            }}
            onCompositionStart={() => { agentIsComposingRef.current = true; }}
            onCompositionEnd={(e) => {
              agentIsComposingRef.current = false;
              const newValue = (e.target as HTMLTextAreaElement).value;
              setAgentMessage(newValue);
              if (agentPendingEnterRef.current) {
                agentPendingEnterRef.current = false;
                const textToSend = newValue.trim();
                if (textToSend) handleSendAgentMessage(textToSend);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (agentIsComposingRef.current) {
                  agentPendingEnterRef.current = true;
                  return;
                }
                const target = e.target as HTMLTextAreaElement;
                const fullText = target.value.trim();
                if (fullText) handleSendAgentMessage(fullText);
              }
            }}
            placeholder="에이전트에게 명령을 입력하세요..."
            className="flex-1 bg-transparent border-none text-white placeholder-gray-400 focus:outline-none resize-none overflow-hidden relative z-10"
            style={{ minHeight: '22px', maxHeight: '88px', lineHeight: '22px', fontSize: '14px' }}
            rows={1}
            aria-label="에이전트 메시지 입력"
            tabIndex={0}
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const currentText = agentTextareaRef.current?.value || agentMessage;
              handleSendAgentMessage(currentText);
            }}
            disabled={!agentMessage.trim()}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all relative z-10 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #0066FF 0%, #8A2BE2 50%, #ff8566 100%)' }}
            aria-label="메시지 전송"
            tabIndex={0}
            type="button"
          >
            <svg className="w-4 h-4 text-white pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5" />
              <path d="M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* MapView */}
      <div className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
        <MapView
          events={events}
          highlightedEventId={uiState.highlightedEventId}
          selectedEventId={uiState.selectedEventId}
          aiDetectionEventId={null}
          onEventClick={handleEventAction}
          onAiDetectionClose={clearSelection}
          onMapClick={undefined}
          externalZoomLevel={0}
          onZoomLevelChange={() => {}}
          hideControls={uiState.hideControls}
          showFastSearch={false}
          showFastSearchList={false}
          fastSearchRadius={200}
          appliedSearchRadius={200}
          leftPanelWidth={uiState.leftPanelCollapsed ? 80 : 416}
          pinOffset={{ x: 0, y: 0 }}
          focusTargetXPercent={50}
          flyToLocation={flyToLocation}
          externalShowCCTV={true}
          onMapStateChange={setLastMapState}
          hideAgentButton={isAgentActive}
          isAgentActive={isAgentActive}
          keepControlPosition
        />
      </div>

      {/* 좌측 패널 */}
      <div
        className="absolute top-0 bottom-0 transition-all duration-500 ease-out"
        style={{ zIndex: 100, left: '0px', opacity: 1, transform: 'translateX(0)' }}
      >
        <LeftPanel onCollapsedChange={() => dispatch({ type: 'TOGGLE_LEFT_PANEL' })} />
      </div>

      {/* 우측 패널 (HeatmapPanel + EventList) */}
      <div
        className={`absolute right-0 top-0 bottom-0 flex flex-col pl-4 pr-5 gap-4 transition-all duration-300 ease-out ${
          uiState.panelsSlidOut ? 'translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'
        } ${isAgentActive ? 'pointer-events-none' : ''}`}
        style={{ width: '370px', zIndex: 100, paddingTop: '16px', paddingBottom: '16px' }}
      >
        <div
          className="transition-all duration-500 ease-out"
          style={{
            opacity: isAgentActive ? 0 : 1,
            transform: isAgentActive ? 'translateX(40px)' : 'translateX(0)',
            pointerEvents: isAgentActive ? 'none' : 'auto',
          }}
        >
          <HeatmapPanel
            areaLabels={{
              zone1: '달빛로',
              zone2: '해빛로',
              zone3: '바람로',
              zone4: '무지개로',
              zone5: '성운로',
              zone6: '구름대로',
              zone7: '햇살로',
              zone8: '여명로',
            }}
          />
        </div>
        <div
          className="rounded-lg p-4 flex-1 overflow-hidden gradient-border-right-bottom transition-all ease-out"
          style={{
            minHeight: 0,
            background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            opacity: isAgentActive ? 0 : 1,
            transform: isAgentActive ? 'translateX(40px)' : 'translateX(0)',
            pointerEvents: isAgentActive ? 'none' : 'auto',
            transitionDuration: '500ms',
            transitionDelay: isAgentActive ? '80ms' : '0ms',
          }}
        >
          <EventList
            events={visibleEvents}
            selectedEventId={uiState.selectedEventId || undefined}
            onEventSelect={handleEventAction}
            onEventHover={handleEventHover}
          />
        </div>
      </div>

      {/* 하단 CCTV 패널 */}
      <BottomPanel
        showCCTV={uiState.showCCTV}
        hideControls={uiState.hideControls || isAgentActive}
        leftPanelWidth={uiState.leftPanelCollapsed ? 80 : 416}
        windowWidth={windowWidth}
        cctvScrollContainerRef={cctvScrollContainerRef}
        isUserScrollingRef={isUserScrollingRef}
        userScrollTimeoutRef={userScrollTimeoutRef}
        autoScrollIntervalRef={autoScrollIntervalRef}
      />

      {/* AI 에이전트 팝업 */}
      {uiState.showAIAgentPopup && (
        <AIAgentPopup2
          isOpen={uiState.showAIAgentPopup}
          onClose={() => dispatch({ type: 'HIDE_AGENT_POPUP' })}
          hideControls={uiState.hideControls}
          position={{ bottom: '24px', right: '24px' }}
          maxHeight={agentPopupMaxHeight}
          initialMessage={pendingPopupMessage}
          onInitialMessageProcessed={clearPendingPopupMessage}
        />
      )}
    </div>
  );
}
