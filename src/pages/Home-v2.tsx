import { useState, useMemo, useEffect, useRef, useCallback, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import EventList from '@/components/dashboard/EventList';
import MapView from '@/components/dashboard/HOME-v2/MapView';
import ObjectTrackingMapView from '@/components/dashboard/HOME-v2/ObjectTrackingMapView';
import LeftPanel from '@/components/dashboard/LeftPanel';
import LeftMenuPanel from '@/components/dashboard/HOME-v2/LeftMenuPanel';
import HeatmapPanel from '@/components/dashboard/HeatmapPanel';
import BottomPanel from '@/components/dashboard/BottomPanel';
import ReportPopup from '@/components/dashboard/HOME/ReportPopup';
import FastSearchListPanel from '@/components/dashboard/HOME-v2/FastSearchListPanel';
import PredictedCCTVListPanel from '@/components/dashboard/HOME-v2/PredictedCCTVListPanel';
import CaptureListPanel, { CaptureItem } from '@/components/dashboard/HOME-v2/CaptureListPanel';
import PropagationListPanel from '@/components/dashboard/HOME-v2/PropagationListPanel';
import PropagationPackagePopup from '@/components/dashboard/HOME-v2/PropagationPackagePopup';
import AIAgentPopup from '@/components/dashboard/HOME-v2/AIAgentPopup';
import ConfirmDialog from '@/components/dashboard/HOME-v2/ConfirmDialog';
import { MouseGuide } from '@/components/dashboard/HOME-v2/MouseGuide';
import { useMouseGuide } from '@/src/pages/useMouseGuide';
import { Event } from '@/types';
import { allEvents, convertToDashboardEvent } from '@/lib/events-data';
import { parseExcludedAttributesFromMessage, parseIncludedAttributesFromMessage, parseShowOnlyAttributesFromMessage, getCanonicalDisplayNames } from '@/lib/fast-search-attribute-utils';
import { computeExcludeForShowOnly } from '@/lib/fast-search-image-attributes';

const EndDialog = ({ onConfirm }: { onConfirm: () => void }) => {
  return (
    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-[10010]">
      <div
        className="gradient-border-right-bottom rounded-lg overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 4px 24px 0 rgba(31, 38, 135, 0.15)',
          minWidth: '420px',
        }}
      >
        <div className="px-6 pt-5 pb-3 text-left">
          <p className="text-gray-900 font-bold leading-relaxed" style={{ fontSize: '18px' }}>
            CUVIA 튜토리얼이 종료되었습니다.
          </p>
          <p className="text-gray-700 text-sm leading-relaxed mt-2">
            체험해주셔서 감사합니다.<br />
            확인 버튼을 누르면 초기 화면으로 돌아갑니다.
          </p>
        </div>
        <div className="px-6 pb-4 flex justify-end">
          <button
            onClick={onConfirm}
            className="px-8 py-2.5 rounded-lg text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            aria-label="확인"
            tabIndex={0}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

// UI 상태 관리를 위한 reducer
type UIState = {
  selectedEventId: string | null;
  highlightedEventId: string | null;
  hideControls: boolean;
  leftPanelCollapsed: boolean;
  panelsSlidOut: boolean;
  showFastSearchList: boolean;
  showAIAgentPopup: boolean;
  showCCTV: boolean;
  showReSearchProgress: boolean;
  showObjectTrackingConfirm: boolean;
  showObjectTracking: boolean;
  showCaptureList: boolean;
  showPropagationList: boolean;
  selectedMenuId: 'net-monitoring' | 'fast-search' | 'object-tracking' | 'capture-list' | 'propagation' | 'broadcast' | null;
  showFastSearchProgress: boolean;
  showNetMonitoringDialog: boolean;
  showAIAgentOnly: boolean;
  previousStateBeforePropagation: {
    showFastSearchList: boolean;
    showObjectTracking: boolean;
    showCaptureList: boolean;
    showAIAgentPopup: boolean;
    selectedMenuId: 'net-monitoring' | 'fast-search' | 'object-tracking' | 'capture-list' | 'propagation' | 'broadcast' | null;
  } | null;
};

type UIAction =
  | { type: 'SET_SELECTED_EVENT'; payload: string | null }
  | { type: 'SET_HIGHLIGHTED_EVENT'; payload: string | null }
  | { type: 'START_FAST_SEARCH' }
  | { type: 'START_FAST_SEARCH_WITH_PROGRESS' }
  | { type: 'COMPLETE_FAST_SEARCH' }
  | { type: 'SHOW_FAST_SEARCH_LIST' }
  | { type: 'HIDE_FAST_SEARCH_LIST' }
  | { type: 'START_RE_SEARCH' }
  | { type: 'COMPLETE_RE_SEARCH' }
  | { type: 'SHOW_OBJECT_TRACKING_CONFIRM' }
  | { type: 'HIDE_OBJECT_TRACKING_CONFIRM' }
  | { type: 'START_OBJECT_TRACKING' }
  | { type: 'SHOW_CAPTURE_LIST' }
  | { type: 'HIDE_CAPTURE_LIST' }
  | { type: 'SHOW_PROPAGATION_LIST' }
  | { type: 'HIDE_PROPAGATION_LIST' }
  | { type: 'SET_MENU'; payload: 'net-monitoring' | 'fast-search' | 'object-tracking' | 'capture-list' | 'propagation' | 'broadcast' | null }
  | { type: 'TOGGLE_LEFT_PANEL' }
  | { type: 'CLEAR_ALL' }
  | { type: 'COMPLETE_FAST_SEARCH_PROGRESS' }
  | { type: 'SHOW_NET_MONITORING_DIALOG' }
  | { type: 'HIDE_NET_MONITORING_DIALOG' }
  | { type: 'SHOW_AI_AGENT_ONLY' };

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
        showFastSearchList: true,
        selectedMenuId: 'fast-search',
        showAIAgentPopup: true,
        showFastSearchProgress: false,
        showObjectTracking: false,
        showCaptureList: false,
      };
    case 'START_FAST_SEARCH_WITH_PROGRESS':
      return {
        ...state,
        panelsSlidOut: true,
        showCCTV: false,
        hideControls: true,
        showFastSearchList: true,
        selectedMenuId: 'fast-search',
        showAIAgentPopup: true,
        showFastSearchProgress: true,
        showObjectTracking: false,
        showCaptureList: false,
      };
    case 'COMPLETE_FAST_SEARCH_PROGRESS':
      return {
        ...state,
        showFastSearchProgress: false,
        showFastSearchList: true,
      };
    case 'COMPLETE_FAST_SEARCH':
      return {
        ...state,
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
        showAIAgentOnly: false,
        panelsSlidOut: false,
        showCCTV: true,
        hideControls: false,
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
        showCaptureList: false,
        showAIAgentPopup: true,
        hideControls: true,
        selectedMenuId: 'object-tracking',
        selectedEventId: 'A-20260107-004', // 신고 팝업을 위한 이벤트 선택
        panelsSlidOut: true, // 좌우 패널 숨김
        showCCTV: false, // CCTV 패널 숨김
      };
    case 'SHOW_CAPTURE_LIST':
      return {
        ...state,
        showCaptureList: true,
        showFastSearchList: false,
        showObjectTracking: false,
        showPropagationList: false,
        panelsSlidOut: true,
        showCCTV: false,
        hideControls: true,
        selectedMenuId: 'capture-list',
      };
    case 'HIDE_CAPTURE_LIST':
      return {
        ...state,
        showCaptureList: false,
        showAIAgentOnly: false,
        panelsSlidOut: false,
        showCCTV: true,
        hideControls: false,
        selectedMenuId: null,
      };
    case 'SHOW_PROPAGATION_LIST':
      return {
        ...state,
        showPropagationList: true,
        showFastSearchList: false,
        showObjectTracking: false,
        showCaptureList: false,
        panelsSlidOut: true,
        showCCTV: false,
        hideControls: true,
        selectedMenuId: 'propagation',
        previousStateBeforePropagation: {
          showFastSearchList: state.showFastSearchList,
          showObjectTracking: state.showObjectTracking,
          showCaptureList: state.showCaptureList,
          showAIAgentPopup: state.showAIAgentPopup,
          selectedMenuId: state.selectedMenuId,
        },
      };
    case 'HIDE_PROPAGATION_LIST':
      const previousState = state.previousStateBeforePropagation;
      return {
        ...state,
        showPropagationList: false,
        showFastSearchList: previousState?.showFastSearchList || false,
        showObjectTracking: previousState?.showObjectTracking || false,
        showCaptureList: previousState?.showCaptureList || false,
        showAIAgentPopup: previousState?.showAIAgentPopup || false,
        selectedMenuId: previousState?.selectedMenuId || null,
        previousStateBeforePropagation: null,
      };
    case 'SHOW_AI_AGENT_ONLY':
      return {
        ...state,
        panelsSlidOut: true,
        showCCTV: false,
        hideControls: false,
        showAIAgentPopup: true,
        showAIAgentOnly: true,
        showFastSearchList: false,
        showObjectTracking: false,
        showCaptureList: false,
        showPropagationList: false,
      };
    case 'SHOW_NET_MONITORING_DIALOG':
      return { ...state, showNetMonitoringDialog: true };
    case 'HIDE_NET_MONITORING_DIALOG':
      return { ...state, showNetMonitoringDialog: false };
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
        showFastSearchList: false,
        showAIAgentPopup: false,
        showAIAgentOnly: false,
        showCCTV: true,
        showReSearchProgress: false,
        showObjectTrackingConfirm: false,
        showObjectTracking: false,
        showCaptureList: false,
        showPropagationList: false,
        selectedMenuId: null,
        showFastSearchProgress: false,
        showNetMonitoringDialog: false,
        previousStateBeforePropagation: null,
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
    previousStateBeforePropagation: null,
    hideControls: false,
    leftPanelCollapsed: false,
    panelsSlidOut: false,
    showFastSearchList: false,
    showAIAgentPopup: false,
    showCCTV: true,
    showReSearchProgress: false,
    showObjectTrackingConfirm: false,
    showObjectTracking: false,
    showCaptureList: false,
    showPropagationList: false,
    selectedMenuId: null,
    showFastSearchProgress: false,
    showNetMonitoringDialog: false,
    showAIAgentOnly: false,
  });

  // 나머지 필요한 state들
  const [showStartMessage, setShowStartMessage] = useState<boolean>(true); // 시작 메시지창 표시 여부
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [visibleEventIds, setVisibleEventIds] = useState<Set<string>>(new Set());
  const [listCardCount, setListCardCount] = useState<number>(0);
  const [fastSearchRadius, setFastSearchRadius] = useState<number>(200);
  const [appliedSearchRadius, setAppliedSearchRadius] = useState<number>(200);
  const [captureListRadius, setCaptureListRadius] = useState<number>(100);
  const [reportPopupHeight, setReportPopupHeight] = useState<number>(0);
  const [pinOffset, setPinOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [excludedAttributes, setExcludedAttributes] = useState<string[]>([]);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);
  const [agentPopupMaxHeight, setAgentPopupMaxHeight] = useState<number>(500);
  const [openCandidateId, setOpenCandidateId] = useState<string | null>(null);
  const [openCCTVId, setOpenCCTVId] = useState<string | null>(null);
  const [closeCCTVPopupSignal, setCloseCCTVPopupSignal] = useState(0);
  const [closePopupSignal, setClosePopupSignal] = useState(0);
  const [showPropagationPackagePopup, setShowPropagationPackagePopup] = useState(false);
  const [openReportPopupSignal, setOpenReportPopupSignal] = useState(0);
  const [propagationResetSignal, setPropagationResetSignal] = useState(0);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [dialogSource, setDialogSource] = useState<'net-monitoring' | 'broadcast'>('net-monitoring');
  const [candidateAutoCapture, setCandidateAutoCapture] = useState(false);
  const [cctvAutoCapture, setCCTVAutoCapture] = useState(false);
  const [flyToLocation, setFlyToLocation] = useState<[number, number] | null>(null);
  const [reSearchResult, setReSearchResult] = useState<{ excludedAttributes: string[]; deletedCount: number } | null>(null);
  const [showReSearchSkeleton, setShowReSearchSkeleton] = useState<boolean>(false); // 재검색 스켈레톤 표시 여부
  const [excludedImageIds, setExcludedImageIds] = useState<string[]>([]); // 직접 제외할 이미지 ID (예: ['1', '2', '3'])
  const [visibleTrackingPins, setVisibleTrackingPins] = useState<number>(0); // 0~4: 보이는 핀 개수
  const [showPredictedCCTVList, setShowPredictedCCTVList] = useState<boolean>(false); // 예측 CCTV 리스트 표시 여부
  const [objectTrackingCompleted, setObjectTrackingCompleted] = useState<boolean>(false); // 객체 추적 애니메이션 완료 여부
  const [captureItems, setCaptureItems] = useState<CaptureItem[]>([]); // 포착 목록
  const [showCaptureNotification, setShowCaptureNotification] = useState<boolean>(false); // 포착 알림 애니메이션
  const [captureNotificationMessage, setCaptureNotificationMessage] = useState<string>(''); // 포착 알림 메시지
  const [lastMapState, setLastMapState] = useState<{ center: [number, number]; zoom: number; pitch: number; bearing: number }>({
    center: [126.989127259713, 37.425989842666], // 정부과천청사역
    zoom: 15,
    pitch: 60,
    bearing: -17.6
  });
  const [hoveredCCTVId, setHoveredCCTVId] = useState<string | null>(null); // 호버된 CCTV ID
  const [showCCTVLabel, setShowCCTVLabel] = useState<boolean>(false); // CCTV 정보 라벨 표시 여부
  const [trackingMapResetSignal, setTrackingMapResetSignal] = useState<number>(0);
  const {
    showMouseGuide,
    setShowMouseGuide,
    mousePosition,
    guideTarget,
    guideMessage,
    guideType,
    currentStepIndex,
    currentStepId,
    jumpToStep,
    getStepId,
    resetGuide,
    toggleGuide,
    syncToAppState,
    totalSteps,
  } = useMouseGuide();
  
  // Refs
  const previousListCardCountRef = useRef<number>(0);
  const currentExcludedAttributesRef = useRef<string[]>([]);
  const isReSearchingRef = useRef<boolean>(false);
  const cctvScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUserScrollingRef = useRef<boolean>(false);
  const userScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captureTriggeredRef = useRef<boolean>(false);

  // 신고 팝업 이미지 선로드 (캐시 미리 워밍)
  useEffect(() => {
    const img = new Image();
    img.src = '/people.jpg';
  }, []);

  // 시작 메시지창: 3초 로딩 후 시작 버튼 활성화
  useEffect(() => {
    if (!showStartMessage) return;
    setIsInitialLoading(true);
    const timer = setTimeout(() => setIsInitialLoading(false), 3000);
    return () => clearTimeout(timer);
  }, [showStartMessage]);

  // 모든 이벤트를 한 번만 변환 (종결되지 않은 것만)
  const allConvertedEvents: Event[] = useMemo(() => {
    return allEvents
      .map((event, index) => convertToDashboardEvent(event, index))
      .filter((event) => event.processingStage !== '종결');
  }, []);

  // 가상 이벤트 데이터 (레이아웃 확인용) - 가상 지역(하늘시 별빛구), 과천 내부 좌표
  const mockEvents: Event[] = useMemo(() => {
    const now = new Date();
    const formatTime = (hours: number, minutes: number) => {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    };

    return [
      // 일반 5개
      {
        id: 'mock-1',
        type: '112 치안',
        title: '주차장 소음 민원 신고',
        priority: '일반' as const,
        status: 'NEW' as const,
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 15)),
        location: { name: '하늘시 별빛구 달빛동 지하주차장', coordinates: [127.192706819665, 37.350286188524] as [number, number] },
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
        location: { name: '하늘시 별빛구 별양동 중앙공원 북문 인근', coordinates: [127.202706819665, 37.360286188524] as [number, number] },
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
        location: { name: '하늘시 별빛구 막계동 관문사거리', coordinates: [127.182706819665, 37.340286188524] as [number, number] },
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
        location: { name: '하늘시 별빛구 문원동 하늘역 2번 출구', coordinates: [127.172706819665, 37.330286188524] as [number, number] },
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
        location: { name: '하늘시 별빛구 중앙동 구름대로 사당역 방향', coordinates: [127.162706819665, 37.320286188524] as [number, number] },
        processingStage: '선별',
        resolution: { category: '112', code: '005', description: '' },
      },
      // 주의 3개
      {
        id: 'mock-6',
        type: '112 실종',
        title: '미아 발생 긴급 수색',
        priority: '주의' as const,
        status: 'MONITORING' as const,
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 10)),
        location: { name: '하늘시 별빛구 별양동 달빛초등학교 정문 앞', coordinates: [127.192706819665, 37.350286188524] as [number, number] },
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
        location: { name: '하늘시 별빛구 중앙동 하늘시청 앞 교차로', coordinates: [127.202706819665, 37.360286188524] as [number, number] },
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
        location: { name: '하늘시 별빛구 중앙동 구름역 인근 상가 앞', coordinates: [127.182706819665, 37.340286188524] as [number, number] },
        processingStage: '착수',
        resolution: { category: '112', code: '008', description: '' },
      },
      // 경계 2개
      {
        id: 'mock-9',
        type: '119 화재',
        title: '쓰레기 수거함 화재 발생',
        priority: '경계' as const,
        status: 'MONITORING' as const,
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 5)),
        location: { name: '하늘시 별빛구 막계동 달빛동 아파트 단지 쓰레기 수거함', coordinates: [127.172706819665, 37.330286188524] as [number, number] },
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
        location: { name: '하늘시 별빛구 달빛동 상가 앞', coordinates: [127.162706819665, 37.320286188524] as [number, number] },
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

  // 포착 아이템 추가 핸들러
  const handleAddCaptureItem = useCallback((
    cctvName: string, 
    location: string, 
    confidence: number, 
    thumbnailUrlOrAnalysisResult?: string | any, 
    analysisResultParam?: string | any,
    videoUrlParam?: string,
    optionsParam?: { hideOverlayWithPopup?: boolean }
  ) => {
    // 6개 파라미터: thumbnailUrl + analysisResult + videoUrl (고속검색에서 호출)
    // 5개 파라미터: 
    //   - 케이스1: thumbnailUrl + analysisResult (고속검색에서 호출)
    //   - 케이스2: capturedImage(base64) + analysisResult(마크다운) (객체추적에서 호출)
    // 4개 파라미터: thumbnailUrl 또는 analysisResult 또는 캡처된 이미지(base64) (타입으로 구분)
    // 3개 파라미터: 기본 (썸네일 없음)
    let thumbnailUrl = '/images/cctv-placeholder.jpg';
    let analysisResult = undefined;
    let videoUrl = '/videos/sample-cctv.mp4';
    
    if (videoUrlParam !== undefined) {
      // 6개 파라미터: thumbnailUrl(4번째) + analysisResult(5번째) + videoUrl(6번째)
      thumbnailUrl = typeof thumbnailUrlOrAnalysisResult === 'string' ? thumbnailUrlOrAnalysisResult : '/images/cctv-placeholder.jpg';
      analysisResult = analysisResultParam;
      videoUrl = videoUrlParam;
    } else if (analysisResultParam !== undefined) {
      // 5개 파라미터: capturedImage/thumbnailUrl(4번째) + analysisResult(5번째)
      const is4thParamImage = typeof thumbnailUrlOrAnalysisResult === 'string' && 
                              (thumbnailUrlOrAnalysisResult.startsWith('/') || 
                               thumbnailUrlOrAnalysisResult.startsWith('http') ||
                               thumbnailUrlOrAnalysisResult.startsWith('data:image/'));
      
      if (is4thParamImage) {
        thumbnailUrl = thumbnailUrlOrAnalysisResult;
      }
      analysisResult = analysisResultParam;
    } else if (thumbnailUrlOrAnalysisResult !== undefined) {
      // 4개 파라미터: thumbnailUrl 또는 analysisResult 또는 캡처된 이미지(base64)
      const isUrl = typeof thumbnailUrlOrAnalysisResult === 'string' && 
                    (thumbnailUrlOrAnalysisResult.startsWith('/') || thumbnailUrlOrAnalysisResult.startsWith('http'));
      const isBase64Image = typeof thumbnailUrlOrAnalysisResult === 'string' && 
                            thumbnailUrlOrAnalysisResult.startsWith('data:image/');
      
      if (isUrl || isBase64Image) {
        thumbnailUrl = thumbnailUrlOrAnalysisResult;
      } else {
        analysisResult = thumbnailUrlOrAnalysisResult;
      }
    }
    
    const newItem: CaptureItem = {
      id: `capture-${Date.now()}`,
      cctvName,
      location,
      timestamp: new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      thumbnailUrl,
      videoUrl,
      analysisResult,
    };
    
    setCaptureItems((prev) => [newItem, ...prev]);
    captureTriggeredRef.current = true;
    
    // 알림 메시지 설정
    const message = `${cctvName} | ${location}의 클립을 포착 목록에 추가했습니다.\n전파 패키지를 생성하여 전파를 보내세요.`;
    setCaptureNotificationMessage(message);
    setShowCaptureNotification(true);
    
    // 팝업과 동시에 오버레이 숨김(고속검색, onAddCapture 300ms 후 호출 → 400ms면 700ms에 오버레이 제거) vs 5초 유지(객체추적 등)
    const overlayDuration = optionsParam?.hideOverlayWithPopup ? 400 : 5000;
    setTimeout(() => {
      setShowCaptureNotification(false);
    }, overlayDuration);

    if (showMouseGuide && optionsParam?.hideOverlayWithPopup && currentStepId !== 'candidate-detail') {
      setTimeout(() => {
        dispatch({ type: 'SHOW_CAPTURE_LIST' });
        setShowPredictedCCTVList(false);
        setVisibleTrackingPins(0);
        setFlyToLocation(null);
        jumpToStep('capture-list-review');
      }, 500);
    }
  }, [showMouseGuide, jumpToStep, currentStepId]);

  // 이벤트 액션 핸들러 (useCallback으로 메모이제이션)
  const handleEventAction = useCallback((eventId: string) => {
    const event = visibleEvents.find((e) => e.id === eventId);
    if (!event) return;
    const isEvent1 = event.eventId === 'A-20260107-004' || event.id === 'A-20260107-004';
    if (event.eventId && !isEvent1) {
      navigate(`/event/${event.eventId}`);
      return;
    }
    dispatch({ type: 'SET_SELECTED_EVENT', payload: eventId });
    dispatch({ type: 'SET_HIGHLIGHTED_EVENT', payload: eventId });
    // 선택한 이벤트 위치로 지도 이동
    const coords = event.location?.coordinates;
    if (coords && Array.isArray(coords) && coords.length >= 2) {
      setFlyToLocation([coords[0], coords[1]]);
    }
    // 실제 이벤트(allConvertedEvents)인 경우 핀 노출을 위해 visibleEventIds에 추가
    const isRealEvent = allConvertedEvents.some((e) => e.id === eventId);
    if (isRealEvent) {
      setVisibleEventIds((prev) => new Set([...prev, eventId]));
    }
  }, [visibleEvents, allConvertedEvents, navigate]);

  // 이벤트 호버 핸들러 (useCallback으로 메모이제이션)
  const handleEventHover = useCallback((eventId: string | null) => {
    dispatch({ type: 'SET_HIGHLIGHTED_EVENT', payload: eventId });
  }, []);

  // 선택 초기화 핸들러 (useCallback으로 메모이제이션)
  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
    setPinOffset({ x: 0, y: 0 });
    setExcludedAttributes([]);
    setFlyToLocation(null);
    setShowPredictedCCTVList(false);
    setObjectTrackingCompleted(false);
    setVisibleTrackingPins(0);
    resetGuide();
  }, [resetGuide]);

  // 완전 초기화: 시작 메시지 다이얼로그가 떠 있는 상태로 되돌림
  const handleBackToInitial = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
    setShowStartMessage(true);
    setCaptureItems([]);
    setPinOffset({ x: 0, y: 0 });
    setExcludedAttributes([]);
    setExcludedImageIds([]);
    setFlyToLocation(null);
    setShowPredictedCCTVList(false);
    setObjectTrackingCompleted(false);
    setVisibleTrackingPins(0);
    setReSearchResult(null);
    setOpenCandidateId(null);
    setOpenCCTVId(null);
    setShowPropagationPackagePopup(false);
    setCandidateAutoCapture(false);
    setCCTVAutoCapture(false);
    setOpenReportPopupSignal(0);
    setPropagationResetSignal(prev => prev + 1);
    setShowEndDialog(false);
    resetGuide();
  }, [resetGuide]);

  // 재검색 완료 후 가이드 이동 (에이전트 팝업 결과 표시 후)
  // - 우산 삭제(에이전트): 별빛A-604 가이드
  // - 결과재검색 버튼: 객체 추적 메뉴 가이드
  useEffect(() => {
    if (!showMouseGuide || !reSearchResult || uiState.showReSearchProgress) return;
    jumpToStep('review-candidates');
  }, [showMouseGuide, reSearchResult, uiState.showReSearchProgress, jumpToStep]);

  // 객체 추적 애니메이션 완료 핸들러
  const handleTrackingComplete = useCallback(() => {
    setShowPredictedCCTVList(true);
    setObjectTrackingCompleted(true);

    if (showMouseGuide) {
      jumpToStep('predicted-cctv');
    }
  }, [showMouseGuide, jumpToStep]);

  // syncToAppState: 앱 상태에 맞춰 가이드 마일스톤 동기화
  useEffect(() => {
    syncToAppState({
      fastSearchStarted: uiState.showFastSearchList,
      fastSearchProgressDone: !uiState.showFastSearchProgress,
      reSearchInProgress: uiState.showReSearchProgress,
      objectTrackingCompleted,
      showPredictedCCTVList,
      showCaptureList: uiState.showCaptureList,
    });
  }, [
    syncToAppState,
    uiState.showFastSearchList,
    uiState.showFastSearchProgress,
    uiState.showReSearchProgress,
    uiState.showCaptureList,
    objectTrackingCompleted,
    showPredictedCCTVList,
  ]);

  // 객체 추적 시퀀스 시작 핸들러
  const handleStartTrackingSequence = useCallback((resetFirst = false) => {
    setVisibleEventIds(new Set());
    setVisibleTrackingPins(0);
    setShowPredictedCCTVList(false);
    setObjectTrackingCompleted(false);

    const trackingSequence = [
      [126.99656, 37.43527],                // 1번: 초기 목격 지점
      [126.997050219665, 37.434564088524],  // 2번: 목격 지점
      [126.995526419665, 37.435305588524],  // 3번: 목격 지점
      [126.995523619665, 37.434353188524],  // 4번: 목격 지점
    ];

    const baseDelay = resetFirst ? 1600 : 0;

    if (resetFirst) {
      setTrackingMapResetSignal(prev => prev + 1);
    }

    setTimeout(() => {
      setVisibleTrackingPins(1);
      setFlyToLocation(trackingSequence[0] as [number, number]);
    }, baseDelay + 100);

    setTimeout(() => {
      setVisibleTrackingPins(2);
      setFlyToLocation(trackingSequence[1] as [number, number]);
    }, baseDelay + 2100);

    setTimeout(() => {
      setVisibleTrackingPins(3);
      setFlyToLocation(trackingSequence[2] as [number, number]);
    }, baseDelay + 4100);

    setTimeout(() => {
      setVisibleTrackingPins(4);
      setFlyToLocation(trackingSequence[3] as [number, number]);
    }, baseDelay + 6100);
  }, []);

  // 가이드 스텝 네비게이션: 이전/다음 버튼으로 앱 상태까지 전환
  const handleGuideNavigate = useCallback((targetStepId: string) => {
    setCandidateAutoCapture(false);
    setCCTVAutoCapture(false);
    // 전파 패키지 팝업: propagation step에서만 열고 나머지는 항상 닫기
    setShowPropagationPackagePopup(targetStepId === 'propagation');

    if (targetStepId !== 'candidate-detail') {
      setOpenCandidateId(null);
    }
    if (targetStepId === 'review-candidates') {
      setClosePopupSignal(prev => prev + 1);
    }
    if (targetStepId === 'predicted-cctv-detail') {
      setOpenCCTVId('4');
    } else if (targetStepId === 'predicted-cctv' || targetStepId === 'capture-list-review') {
      setCloseCCTVPopupSignal(prev => prev + 1);
    }

    const PHASE_INTRO = ['intro'];
    const PHASE_SEARCH_LIST = ['review-candidates', 'candidate-detail'];
    const PHASE_TRACKING = ['route-analysis'];
    const PHASE_TRACKING_DONE = ['predicted-cctv', 'predicted-cctv-detail'];
    const PHASE_CAPTURE = ['capture-list-review', 'propagation'];
    const PHASE_PROPAGATION = ['report-download', 'report-result'];

    const missingEvent = allConvertedEvents.find(
      e => e.eventId === 'A-20260107-004' || e.id === 'A-20260107-004'
    );

    if (PHASE_INTRO.includes(targetStepId)) {
      dispatch({ type: 'CLEAR_ALL' });
      setShowPredictedCCTVList(false);
      setObjectTrackingCompleted(false);
      setVisibleTrackingPins(0);
      setPinOffset({ x: 0, y: 0 });
      if (missingEvent) {
        dispatch({ type: 'SET_SELECTED_EVENT', payload: missingEvent.id });
        dispatch({ type: 'SET_HIGHLIGHTED_EVENT', payload: missingEvent.id });
        setVisibleEventIds(new Set([missingEvent.id]));
        setFlyToLocation([126.99656, 37.43527]);
      }
    } else if (PHASE_SEARCH_LIST.includes(targetStepId)) {
      dispatch({ type: targetStepId === 'candidate-detail' ? 'START_FAST_SEARCH' : 'START_FAST_SEARCH_WITH_PROGRESS' });
      setPinOffset({ x: 0, y: 0 });
      setShowPredictedCCTVList(false);
      setObjectTrackingCompleted(false);
      setVisibleTrackingPins(0);
      if (missingEvent) {
        dispatch({ type: 'SET_SELECTED_EVENT', payload: missingEvent.id });
        dispatch({ type: 'SET_HIGHLIGHTED_EVENT', payload: missingEvent.id });
        setVisibleEventIds(new Set([missingEvent.id]));
        setFlyToLocation([126.99656, 37.43527]);
      }
      if (targetStepId === 'candidate-detail') {
        setOpenCandidateId('10');
      }
    } else if (PHASE_TRACKING.includes(targetStepId)) {
      dispatch({ type: 'COMPLETE_FAST_SEARCH_PROGRESS' });
      dispatch({ type: 'START_OBJECT_TRACKING' });
      handleStartTrackingSequence(true);
    } else if (PHASE_TRACKING_DONE.includes(targetStepId)) {
      dispatch({ type: 'COMPLETE_FAST_SEARCH_PROGRESS' });
      dispatch({ type: 'START_OBJECT_TRACKING' });
      setShowPredictedCCTVList(true);
      setObjectTrackingCompleted(true);
    } else if (PHASE_CAPTURE.includes(targetStepId)) {
      dispatch({ type: 'COMPLETE_FAST_SEARCH_PROGRESS' });
      dispatch({ type: 'SHOW_CAPTURE_LIST' });
      setShowPredictedCCTVList(false);
      setVisibleTrackingPins(0);
      setFlyToLocation(null);
    } else if (PHASE_PROPAGATION.includes(targetStepId)) {
      dispatch({ type: 'COMPLETE_FAST_SEARCH_PROGRESS' });
      dispatch({ type: 'SHOW_PROPAGATION_LIST' });
      setShowPredictedCCTVList(false);
      setVisibleTrackingPins(0);
      setFlyToLocation(null);
      if (targetStepId === 'report-result') {
        setOpenReportPopupSignal(prev => prev + 1);
      }
    }

    jumpToStep(targetStepId);
  }, [allConvertedEvents, jumpToStep, handleStartTrackingSequence]);

  const isGuideNavigationDisabled = uiState.showFastSearchProgress || uiState.showReSearchProgress;
  const isGuideNextDisabled = currentStepId === 'route-analysis';

  const handleGuidePrev = useCallback(() => {
    if (isGuideNavigationDisabled) return;
    if (currentStepIndex <= 0) return;
    const prevId = getStepId(currentStepIndex - 1);
    if (prevId) handleGuideNavigate(prevId);
  }, [currentStepIndex, getStepId, handleGuideNavigate, isGuideNavigationDisabled]);

  const handleGuideNext = useCallback(() => {
    if (isGuideNavigationDisabled || isGuideNextDisabled) return;
    if (currentStepIndex >= totalSteps - 1) {
      setShowMouseGuide(false);
      setShowEndDialog(true);
      return;
    }
    if (currentStepId === 'candidate-detail') {
      setCandidateAutoCapture(true);
      return;
    }
    if (currentStepId === 'predicted-cctv-detail') {
      setCCTVAutoCapture(true);
      return;
    }
    const nextId = getStepId(currentStepIndex + 1);
    if (nextId) handleGuideNavigate(nextId);
  }, [currentStepIndex, totalSteps, currentStepId, getStepId, handleGuideNavigate, isGuideNavigationDisabled, isGuideNextDisabled]);

  // 메뉴 선택 핸들러 (useCallback으로 메모이제이션)
  const handleMenuSelect = useCallback((menuId: 'net-monitoring' | 'fast-search' | 'object-tracking' | 'capture-list' | 'propagation' | 'broadcast') => {
    if (showMouseGuide) {
      const menuToStep: Record<string, string> = {
        'fast-search': 'review-candidates',
        'object-tracking': 'route-analysis',
        'capture-list': 'capture-list-review',
        'propagation': 'report-download',
      };
      const targetStep = menuToStep[menuId];
      if (targetStep) {
        handleGuideNavigate(targetStep);
        return;
      }
    }

    dispatch({ type: 'SET_MENU', payload: menuId });

    if (menuId === 'net-monitoring' || menuId === 'broadcast') {
      setDialogSource(menuId);
      dispatch({ type: 'SHOW_NET_MONITORING_DIALOG' });
    } else if (menuId === 'fast-search') {
      setShowPredictedCCTVList(false);
      setObjectTrackingCompleted(false);
      setVisibleTrackingPins(0);
      const missingEvent = allConvertedEvents.find(event =>
        event.eventId === 'A-20260107-004' || event.id === 'A-20260107-004'
      );
      if (missingEvent) {
        dispatch({ type: 'SET_SELECTED_EVENT', payload: missingEvent.id });
        setVisibleEventIds(new Set([missingEvent.id]));
        setFlyToLocation([126.99656, 37.43527]);
      }
      dispatch({ type: 'START_FAST_SEARCH' });
    } else if (menuId === 'object-tracking') {
      dispatch({ type: 'SHOW_OBJECT_TRACKING_CONFIRM' });
    } else if (menuId === 'capture-list') {
      dispatch({ type: 'SHOW_CAPTURE_LIST' });
    } else if (menuId === 'propagation') {
      dispatch({ type: 'SHOW_PROPAGATION_LIST' });
    }
  }, [allConvertedEvents, showMouseGuide, handleGuideNavigate]);

  /** 에이전트 팝업 maxHeight 및 windowWidth 업데이트 */
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      const topPx = reportPopupHeight > 0 ? 20 + reportPopupHeight + 24 : 424; // 1.25rem = 20px
      // 고속검색 모드 또는 객체추적 모드 또는 포착목록 모드 또는 전파 모드일 때는 플로팅 버튼 영역 제외
      const reserveBottom = (uiState.showFastSearchList || uiState.showObjectTracking || uiState.showCaptureList || uiState.showPropagationList) ? 24 : 24 + 56 + 8;
      setAgentPopupMaxHeight(Math.max(200, window.innerHeight - topPx - reserveBottom));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [reportPopupHeight, uiState.showFastSearchList, uiState.showObjectTracking, uiState.showCaptureList, uiState.showPropagationList]);

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

  // 시작 버튼 핸들러
  const handleStartSimulation = useCallback(() => {
    const missingEvent = allConvertedEvents.find(event => 
      event.eventId === 'A-20260107-004' || event.id === 'A-20260107-004'
    );
    
    if (missingEvent) {
      setShowStartMessage(false);
      dispatch({ type: 'SET_SELECTED_EVENT', payload: missingEvent.id });
      dispatch({ type: 'SET_HIGHLIGHTED_EVENT', payload: missingEvent.id });
      setVisibleEventIds(prev => new Set([...prev, missingEvent.id]));
      setFlyToLocation([126.99656, 37.43527]);
      
      if (showMouseGuide) {
        jumpToStep('intro', 500);
      }
    }
  }, [allConvertedEvents, showMouseGuide, jumpToStep]);

  // 키보드 단축키 핸들러 (시나리오 프로토타입용)
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showPropagationPackagePopup) {
        setShowPropagationPackagePopup(false);
      }
      return;
    }

    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    const missingEvent = allConvertedEvents.find(event => 
      event.eventId === 'A-20260107-004' || event.id === 'A-20260107-004'
    );
    
    if (e.key === '0') {
      toggleGuide();
    } else if (e.key === '1' && missingEvent && !isInitialLoading) {
      setShowStartMessage(false);
      dispatch({ type: 'SET_SELECTED_EVENT', payload: missingEvent.id });
      dispatch({ type: 'SET_HIGHLIGHTED_EVENT', payload: missingEvent.id });
      setVisibleEventIds(prev => new Set([...prev, missingEvent.id]));
      setFlyToLocation([126.99656, 37.43527]);

      if (showMouseGuide) {
        jumpToStep('intro', 500);
      }
    }
  }, [allConvertedEvents, showMouseGuide, jumpToStep, toggleGuide, isInitialLoading, showPropagationPackagePopup]);

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
        {uiState.showObjectTracking ? (
            <ObjectTrackingMapView
              visibleTrackingPins={visibleTrackingPins}
              flyToLocation={flyToLocation}
              initialMapState={lastMapState}
              onTrackingComplete={handleTrackingComplete}
              resetSignal={trackingMapResetSignal}
              onCCTVHover={(cctvId, showLabel) => {
                setHoveredCCTVId(cctvId);
                setShowCCTVLabel(showLabel || false);
              }}
              hoveredCCTVId={hoveredCCTVId}
              showCCTVLabel={showCCTVLabel}
              pulseRadius={captureListRadius}
              showMapControls={showPredictedCCTVList && !uiState.showCaptureList && !uiState.showPropagationList}
            />
        ) : (
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
            showFastSearchList={uiState.showFastSearchList}
            fastSearchRadius={fastSearchRadius}
            appliedSearchRadius={appliedSearchRadius}
            leftPanelWidth={uiState.leftPanelCollapsed ? 80 : 416}
            pinOffset={pinOffset}
            focusTargetXPercent={fastSearchFocusXPercent}
            flyToLocation={flyToLocation}
            externalShowCCTV={showStartMessage ? false : !uiState.showObjectTracking}
            onMapStateChange={setLastMapState}
            hideAgentButton={uiState.showAIAgentOnly}
            showInitialCCTVClusters={showStartMessage}
            onAgentHubClick={() => {
              setDialogSource('broadcast');
              dispatch({ type: 'SHOW_NET_MONITORING_DIALOG' });
            }}
          />
        )}
      </div>

      {/* 좌측 메뉴 패널 - 고속검색 또는 객체 추적 또는 포착 목록 또는 전파 시 표시 */}
      <div 
        className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ease-out ${uiState.showFastSearchList || uiState.showObjectTracking || uiState.showCaptureList || uiState.showPropagationList ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}
        style={{ zIndex: 101 }}
      >
        <LeftMenuPanel 
          onMenuSelect={handleMenuSelect} 
          selectedMenuId={uiState.selectedMenuId}
          captureCount={captureItems.length}
          showNotification={showCaptureNotification}
        />
      </div>

      <div 
        className={`absolute top-0 bottom-0 transition-all duration-300 ease-out ${uiState.panelsSlidOut && !uiState.showAIAgentOnly ? '-translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}
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
            zone1: '달빛동',
            zone2: '해빛동',
            zone3: '바람동',
            zone4: '무지개동',
            zone5: '성운동',
            zone6: '구름동',
            zone7: '햇살동',
            zone8: '여명동',
          }}
        />
        <div className="rounded-lg p-4 flex-1 overflow-hidden gradient-border-right-bottom" style={{ minHeight: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
          <EventList
            events={visibleEvents}
            selectedEventId={currentStepId === 'intro' ? undefined : (uiState.selectedEventId || undefined)}
            onEventSelect={currentStepId === 'intro' ? () => {} : handleEventAction}
            onEventHover={handleEventHover}
          />
        </div>
      </div>

      {/* BottomPanel (CCTV 화면) - 고속검색 모드 또는 객체추적 모드 또는 포착목록 모드 또는 전파 모드일 때 숨김 */}
      <BottomPanel
        showCCTV={uiState.showCCTV && !uiState.showFastSearchList && !uiState.showObjectTracking && !uiState.showCaptureList && !uiState.showPropagationList}
        hideControls={uiState.hideControls}
        leftPanelWidth={uiState.leftPanelCollapsed ? 80 : 416}
        windowWidth={windowWidth}
        cctvScrollContainerRef={cctvScrollContainerRef}
        isUserScrollingRef={isUserScrollingRef}
        userScrollTimeoutRef={userScrollTimeoutRef}
        autoScrollIntervalRef={autoScrollIntervalRef}
      />

      {/* ReportPopup - 고속검색, 객체추적, 포착목록 모드일 때 우측 상단에 표시 (전파 모드일 때는 숨김) */}
      {uiState.selectedEventId && !uiState.showPropagationList && (
        <ReportPopup
          event={allConvertedEvents.find(e => e.id === uiState.selectedEventId) || null}
          onClose={() => {
            // 객체 추적 모드일 때는 신고 팝업만 닫고 객체 추적 상태는 유지
            if (uiState.showObjectTracking) {
              dispatch({ type: 'SET_SELECTED_EVENT', payload: null });
            } else {
              clearSelection();
            }
          }}
          onFastSearchStart={() => {
            dispatch({ type: 'START_FAST_SEARCH_WITH_PROGRESS' });
          }}
          showFastSearchStartButton={!uiState.showFastSearchList && !uiState.showObjectTracking && !uiState.showCaptureList && !uiState.showPropagationList}
          onLayout={setReportPopupHeight}
          position={uiState.showFastSearchList || uiState.showObjectTracking || uiState.showCaptureList || uiState.showPropagationList ? { top: '1.25rem', right: '20px' } : { top: '1.25rem', right: '370px' }}
        />
      )}

      {/* FastSearchListPanel */}
      <FastSearchListPanel
        isVisible={uiState.showFastSearchList && !uiState.showObjectTracking && !uiState.showCaptureList && !uiState.showPropagationList}
        onListCardCountChange={setListCardCount}
        onRadiusChange={setFastSearchRadius}
        onAppliedRadiusChange={setAppliedSearchRadius}
        onReSearchClick={() => {
          // 짧은 스켈레톤 표시 (0.5초)
          setShowReSearchSkeleton(true);
          setTimeout(() => {
            setShowReSearchSkeleton(false);
            dispatch({ type: 'COMPLETE_RE_SEARCH' });
            isReSearchingRef.current = true;
            
            // 재검색 결과를 에이전트 팝업에 표시
            setReSearchResult({
              excludedAttributes: ['대표 후보 기반 유사도 재검색'],
              deletedCount: 3, // 05, 11, 15번 제외
            });
          }, 500);
          
          // 05, 11, 15번 이미지 제외 (item.id: 1, 2, 3)
          setExcludedImageIds(['1', '2', '3']);
        }}
        excludedAttributes={excludedAttributes}
        excludedImageIds={excludedImageIds}
        openCandidateId={openCandidateId}
        onCandidateOpened={() => setOpenCandidateId(null)}
        showSkeleton={uiState.showFastSearchProgress || uiState.showReSearchProgress || showReSearchSkeleton}
        onAddCapture={handleAddCaptureItem}
        scrollToBottomTrigger={guideTarget}
        onCandidateSelect={() => {
          if (showMouseGuide) {
            jumpToStep('candidate-detail');
          }
        }}
        closePopupSignal={closePopupSignal}
        autoCapture={candidateAutoCapture}
        onPopupClose={() => {
          if (showMouseGuide && currentStepId === 'candidate-detail') {
            if (captureTriggeredRef.current) {
              captureTriggeredRef.current = false;
              setShowCaptureNotification(false);
              jumpToStep('route-analysis');
              dispatch({ type: 'START_OBJECT_TRACKING' });
              handleStartTrackingSequence();
            } else {
              jumpToStep('review-candidates');
            }
          }
        }}
      />

      {/* PredictedCCTVListPanel - 객체 추적 애니메이션 완료 후 표시 */}
      <PredictedCCTVListPanel
        isVisible={showPredictedCCTVList && !uiState.showCaptureList && !uiState.showPropagationList}
        onAddCapture={handleAddCaptureItem}
        hoveredCCTVId={hoveredCCTVId}
        onCCTVHover={(cctvId) => {
          setHoveredCCTVId(cctvId);
          setShowCCTVLabel(false); // 썸네일 호버 시 라벨 표시 안함
        }}
        onRadiusChange={setCaptureListRadius}
        onCCTVSelect={() => {
          if (showMouseGuide) {
            jumpToStep('predicted-cctv-detail');
          }
        }}
        onCCTVDetailClose={() => {
          if (showMouseGuide && currentStepId === 'predicted-cctv-detail') {
            if (captureTriggeredRef.current) {
              captureTriggeredRef.current = false;
              setShowCaptureNotification(false);
              dispatch({ type: 'SHOW_CAPTURE_LIST' });
              setShowPredictedCCTVList(false);
              setVisibleTrackingPins(0);
              setFlyToLocation(null);
              jumpToStep('capture-list-review');
            } else {
              jumpToStep('predicted-cctv');
            }
          }
        }}
        openCCTVId={openCCTVId}
        onCCTVOpened={() => setOpenCCTVId(null)}
        closeCCTVPopupSignal={closeCCTVPopupSignal}
        autoCapture={cctvAutoCapture}
      />

      {/* CaptureListPanel - 포착 목록 */}
      <CaptureListPanel
        isVisible={uiState.showCaptureList}
        captureItems={captureItems}
        onCreatePropagationPackage={() => {
          dispatch({ type: 'SHOW_PROPAGATION_LIST' });
        }}
      />

      {showPropagationPackagePopup && (
        <PropagationPackagePopup
          isOpen={showPropagationPackagePopup}
          onClose={() => setShowPropagationPackagePopup(false)}
          selectedItems={captureItems}
          onSendPropagation={() => {
            setShowPropagationPackagePopup(false);
            dispatch({ type: 'SHOW_PROPAGATION_LIST' });
          }}
        />
      )}

      {/* PropagationListPanel - 전파 */}
      <PropagationListPanel
        isVisible={uiState.showPropagationList}
        onClose={() => dispatch({ type: 'HIDE_PROPAGATION_LIST' })}
        onBackToInitial={handleBackToInitial}
        captureItems={captureItems}
        openReportPopupSignal={openReportPopupSignal}
        onSimulationEnd={() => {
          setShowMouseGuide(false);
          setShowEndDialog(true);
        }}
        resetSignal={propagationResetSignal}
      />

      {/* 투망감시/CUVIA Link 안내 다이얼로그 */}
      <ConfirmDialog
        isOpen={uiState.showNetMonitoringDialog}
        title="안내"
        message={dialogSource === 'broadcast'
          ? '<b>CUVIA Link는 별도 체험존에서 제공됩니다.</b><br/>CUVIA Link 체험존에서 이용해주세요.'
          : '이 페이지는 고속 검색, 객체 추적,<br/>포착 목록, 전파 기능을 체험하는 데모 화면입니다.<br/>해당 메뉴를 선택하여 기능을 확인해 보세요.'}
        confirmText="확인"
        hideCancel
        showDim
        zIndex={10020}
        onConfirm={() => dispatch({ type: 'HIDE_NET_MONITORING_DIALOG' })}
        onCancel={() => dispatch({ type: 'HIDE_NET_MONITORING_DIALOG' })}
      />

      {/* 객체 추적 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={uiState.showObjectTrackingConfirm}
        title="객체 추적 검사"
        message={`현재 고속 검색 결과 ${listCardCount}건이 있습니다.<br/>객체 추적 검사를 시작하시겠습니까?`}
        variant="dark"
        confirmText="시작"
        cancelText="취소"
        onConfirm={() => {
          dispatch({ type: 'HIDE_OBJECT_TRACKING_CONFIRM' });
          dispatch({ type: 'START_OBJECT_TRACKING' });
          handleStartTrackingSequence();
          if (showMouseGuide) {
            jumpToStep('route-analysis');
          }
        }}
        onCancel={() => dispatch({ type: 'HIDE_OBJECT_TRACKING_CONFIRM' })}
      />

      {/* 에이전트 팝업: 고속검색 리스트 시 신고팝업 아래 여백(24px) 유지, 사건팝업 높이 변동에 따라 위치 조정 (전파 모드일 때는 숨김) */}
      {uiState.showAIAgentPopup && (
        <div style={{ display: uiState.showPropagationList ? 'none' : 'block' }}>
          <AIAgentPopup
            isOpen={uiState.showAIAgentPopup && !uiState.showPropagationList}
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
                setExcludedAttributes((prev) => Array.from(new Set([...prev, ...parsed])));
              }
              
              return parsed;
            }}
            onShowOnlyRequest={({ rawMessage }) => {
              const parsed = parseShowOnlyAttributesFromMessage(rawMessage);
              if (!parsed.length) return [];

              const { excludeAttrs, hiddenCount } = computeExcludeForShowOnly(parsed);
              previousListCardCountRef.current = listCardCount;
              currentExcludedAttributesRef.current = excludeAttrs;
              setExcludedImageIds([]);
              setExcludedAttributes(excludeAttrs);

              const displayAttrs = getCanonicalDisplayNames(parsed);
              setReSearchResult({
                excludedAttributes: displayAttrs.map((a) => `${a}만 표시`),
                deletedCount: hiddenCount,
              });

              return parsed;
            }}
            onAddLikeRequest={({ rawMessage }) => {
              const parsed = parseIncludedAttributesFromMessage(rawMessage);

              if (parsed.length) {
                previousListCardCountRef.current = listCardCount;
                currentExcludedAttributesRef.current = parsed;
                const prevExcluded = excludedAttributes;
                const actuallyRestored = parsed.filter((attr) => prevExcluded.includes(attr));
                setExcludedAttributes((prev) => prev.filter((attr) => !parsed.includes(attr)));

                if (actuallyRestored.length > 0) {
                  setReSearchResult({
                    excludedAttributes: actuallyRestored.map((a) => `${a} 복원`),
                    deletedCount: -actuallyRestored.length,
                  });
                }
              }

              return parsed;
            }}
            maxHeight={agentPopupMaxHeight}
            reSearchResult={reSearchResult}
            isObjectTracking={uiState.showObjectTracking}
            captureNotificationMessage={captureNotificationMessage}
            onObjectTrackingStart={() => {
              if (uiState.showFastSearchList) {
                // 고속검색 리스트가 있으면 확인 다이얼로그만 표시
                dispatch({ type: 'SHOW_OBJECT_TRACKING_CONFIRM' });
              } else {
                // 고속검색 리스트가 없으면 바로 시작
                dispatch({ type: 'START_OBJECT_TRACKING' });
                handleStartTrackingSequence();
              }
            }}
            objectTrackingCompleted={objectTrackingCompleted}
            showFastSearchProgress={uiState.showFastSearchProgress && !uiState.showCaptureList}
            onFastSearchComplete={() => {
              dispatch({ type: 'COMPLETE_FAST_SEARCH_PROGRESS' });
              setPinOffset({ x: 0, y: 0 });

              if (showMouseGuide && currentStepId === 'intro') {
                jumpToStep('review-candidates');
              }
            }}
            onReSearchStart={() => {
              dispatch({ type: 'START_RE_SEARCH' });
              
              // 짧은 스켈레톤 표시 (0.5초)
              setShowReSearchSkeleton(true);
              setTimeout(() => {
                setShowReSearchSkeleton(false);
              }, 500);
            }}
            onReSearchComplete={() => {
              dispatch({ type: 'COMPLETE_RE_SEARCH' });
              isReSearchingRef.current = true;
              if (showMouseGuide) {
                jumpToStep('review-candidates');
              }
            }}
          />
        </div>
      )}

      {/* 포착 목록 아이콘 오버레이 */}
      {showCaptureNotification && !uiState.showPropagationList && (
        <div
          id="capture-menu-overlay"
          className="fixed"
          style={{ 
            left: '80px',
            top: '4px',
            zIndex: 200,
            pointerEvents: 'none',
            transform: 'translateX(-80px)',
          }}
        >
          <div className="py-6 px-3" style={{ width: '80px' }}>
            {/* 로고 영역 */}
            <div className="mb-4 pb-4 border-b border-gray-700/50 w-full flex justify-center">
              <div className="h-8 w-8" />
            </div>

            {/* 메뉴 아이템들 */}
            <div className="flex flex-col items-center gap-3 w-full">
              {/* 빈 메뉴 3개 */}
              <div style={{ height: '52px' }} />
              <div style={{ height: '52px' }} />
              <div style={{ height: '52px' }} />
              
              {/* 포착목록 아이콘 */}
              <button 
                onClick={() => handleMenuSelect('capture-list')}
                className="flex flex-col items-center justify-center w-full group relative"
              >
                <div className={`relative ${showCaptureNotification ? 'animate-icon-bounce' : ''}`}>
                  <svg className="w-7 h-7 text-gray-400 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1 5h2v14H1zm4 0h2v14H5zm17 0H10a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1M11 17l2.5-3.15L15.29 16l2.5-3.22L21 17z" />
                  </svg>
                  
                  {captureItems.length > 0 && (
                    <div
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold animate-capture-badge-pop"
                      style={{
                        boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
                      }}
                    >
                      {captureItems.length}
                    </div>
                  )}
                </div>
                
                <span className="text-[10px] font-medium mt-1.5 text-gray-400 group-hover:text-white transition-colors">
                  포착목록
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 시작 메시지창 */}
      {showEndDialog && (
        <EndDialog onConfirm={() => { sessionStorage.clear(); window.location.reload(); }} />
      )}

      {showStartMessage && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-[9999]">
          <div
            className="gradient-border-right-bottom rounded-lg overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              boxShadow: '0 4px 24px 0 rgba(31, 38, 135, 0.15)',
              minWidth: '420px',
            }}
          >
            <div className="px-6 pt-5 pb-3 text-left">
              <p className="text-gray-900 font-bold leading-relaxed" style={{ fontSize: '18px' }}>
                CUVIA 튜토리얼을 시작해보세요
              </p>
              <p className="text-gray-700 text-sm leading-relaxed mt-2">
                실종 사건 접수 상황을 바탕으로<br />
                CUVIA의 전체 대응 흐름을 직접 체험하실 수 있습니다.
              </p>
              <div className="mt-3 px-3 py-2.5 rounded-md border border-gray-300/60 bg-white/40">
                <p className="text-gray-800 text-xs font-semibold leading-relaxed">
                  사건 접수 → 고속검색 → 객체추적 → 전파 → 보고서 자동작성
                </p>
                <p className="text-gray-600 text-[11px] leading-relaxed mt-1">
                  체험 시간: 약 3~5분
                </p>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mt-3">
                시작 버튼을 누르면 튜토리얼이 바로 시작됩니다.
              </p>
              <p className="text-gray-700 text-[11px] leading-relaxed mt-2">
                화면에 표시되는 사건, 인물 및 데이터는 실제와 무관한 가상 데이터입니다.
              </p>
            </div>

            <div className="px-6 pb-4 flex justify-end">
              {isInitialLoading && (
                <>
                  <style>{`@keyframes loading-fill { from { width: 0%; } to { width: 100%; } }`}</style>
                  <div className="h-1 w-full bg-gray-300/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ animation: 'loading-fill 3s linear forwards' }}
                    />
                  </div>
                </>
              )}
              {!isInitialLoading && (
                <button
                  onClick={handleStartSimulation}
                  className="px-8 py-2.5 rounded-lg text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                  aria-label="시작"
                  tabIndex={0}
                >
                  시작
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <MouseGuide
        show={showMouseGuide}
        guideTarget={guideTarget}
        guideMessage={guideMessage}
        guideType={guideType}
        mousePosition={mousePosition}
        currentStepIndex={currentStepIndex}
        totalSteps={totalSteps}
        currentStepId={currentStepId}
        onPrev={handleGuidePrev}
        onNext={handleGuideNext}
        navigationDisabled={isGuideNavigationDisabled}
        nextDisabled={isGuideNextDisabled}
      />

    </div>
  );
}
