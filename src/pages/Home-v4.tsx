import { useState, useMemo, useEffect, useRef, useCallback, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import EventList from '@/components/dashboard/HOME/EventList';
import MapView from '@/components/dashboard/HOME-v4/MapView';
import ObjectTrackingMapView from '@/components/dashboard/HOME-v4/ObjectTrackingMapView';
import LeftPanel from '@/components/dashboard/HOME-v4/LeftPanel';
import LeftMenuPanel from '@/components/dashboard/HOME-v4/LeftMenuPanel';
import HeatmapPanel from '@/components/dashboard/HeatmapPanel';
import BottomPanel from '@/components/dashboard/BottomPanel';
import ReportPopup from '@/components/dashboard/HOME-v4/ReportPopup';
import FastSearchListPanel from '@/components/dashboard/HOME-v4/FastSearchListPanel';
import FastSearchCandidateDetailPopup from '@/components/dashboard/HOME-v4/FastSearchCandidateDetailPopup';
import TargetCapturePopup from '@/components/dashboard/HOME-v4/TargetCapturePopup';
import { getCctvNameForCaptureItem, getLocationForCaptureItem, getConfidenceForCaptureItem } from '@/lib/fast-search-image-attributes';
import PredictedCCTVListPanel from '@/components/dashboard/HOME-v4/PredictedCCTVListPanel';
import CaptureListPanel, { CaptureItem } from '@/components/dashboard/HOME-v4/CaptureListPanel';
import PropagationListPanel from '@/components/dashboard/HOME-v4/PropagationListPanel';
import AIAgentPopup from '@/components/dashboard/HOME-v4/AIAgentPopup';
import ConfirmDialog from '@/components/dashboard/HOME-v4/ConfirmDialog';
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
  | { type: 'SHOW_AGENT_POPUP' };

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
    case 'SHOW_NET_MONITORING_DIALOG':
      return { ...state, showNetMonitoringDialog: true };
    case 'HIDE_NET_MONITORING_DIALOG':
      return { ...state, showNetMonitoringDialog: false };
    case 'SHOW_AGENT_POPUP':
      return { ...state, showAIAgentPopup: true };
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
  });

  // 나머지 필요한 state들
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
  const [flyToLocation, setFlyToLocation] = useState<[number, number] | null>(null);
  const [reSearchResult, setReSearchResult] = useState<{ excludedAttributes: string[]; deletedCount: number } | null>(null);
  const [showReSearchSkeleton, setShowReSearchSkeleton] = useState<boolean>(false); // 재검색 스켈레톤 표시 여부
  const [excludedImageIds, setExcludedImageIds] = useState<string[]>([]); // 직접 제외할 이미지 ID (예: ['1', '2', '3'])
  const [visibleTrackingPins, setVisibleTrackingPins] = useState<number>(0); // 0~4: 보이는 핀 개수
  const [showPredictedCCTVList, setShowPredictedCCTVList] = useState<boolean>(false); // 예측 CCTV 리스트 표시 여부
  const [showFeaturedLayout, setShowFeaturedLayout] = useState<boolean>(false); // 2키 눌렀을 때 별빛A-655 상단 1x1 레이아웃
  const [isObjectTrackingTransitioning, setIsObjectTrackingTransitioning] = useState<boolean>(false); // 객체추적 전환 애니메이션 중
  const [reportFadeIn, setReportFadeIn] = useState<boolean>(false);
  const [objectTrackingCompleted, setObjectTrackingCompleted] = useState<boolean>(false); // 객체 추적 애니메이션 완료 여부
  const [captureItems, setCaptureItems] = useState<CaptureItem[]>([]); // 포착 목록
  const [showCaptureNotification, setShowCaptureNotification] = useState<boolean>(false); // 포착 알림 애니메이션
  const [captureNotificationMessage, setCaptureNotificationMessage] = useState<string>(''); // 포착 알림 메시지
  const [lastMapState, setLastMapState] = useState<{ center: [number, number]; zoom: number; pitch: number; bearing: number }>({
    center: [126.8136, 37.4865],
    zoom: 15,
    pitch: 60,
    bearing: -17.6
  });
  const [hoveredCCTVId, setHoveredCCTVId] = useState<string | null>(null); // 호버된 CCTV ID
  const [showCCTVLabel, setShowCCTVLabel] = useState<boolean>(false); // CCTV 정보 라벨 표시 여부
  const [triggerCaptureForCctvId, setTriggerCaptureForCctvId] = useState<string | null>(null); // 전파 초안 요청 시 별빛A-655 캡처 트리거
  const [showFastSearchPopupOverlay, setShowFastSearchPopupOverlay] = useState<boolean>(false); // 사건 영상 바로 보기 시 딤+고속검색 팝업
  const [captureProgressMessage, setCaptureProgressMessage] = useState<string | null>(null); // 2키 시 에이전트 팝업 프로그레스 문구

  // Refs
  const previousListCardCountRef = useRef<number>(0);
  const currentExcludedAttributesRef = useRef<string[]>([]);
  const isReSearchingRef = useRef<boolean>(false);
  const cctvScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUserScrollingRef = useRef<boolean>(false);
  const userScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 신고 팝업 이미지 선로드 (캐시 미리 워밍)
  useEffect(() => {
    const img = new Image();
    img.src = '/people.jpg';
  }, []);

  // 모든 이벤트를 한 번만 변환 (종결되지 않은 것만)
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
        type: '약자',
        title: '노인 낙상 부상 신고',
        priority: '일반' as const,
        status: 'NEW' as const,
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 25)),
        location: { name: '하늘시 별빛구 중앙공원 산책로', coordinates: [126.99, 37.43] as [number, number] },
        processingStage: '선별',
        resolution: { category: '약자', code: '002', description: '' },
      },
      {
        id: 'mock-3',
        type: '112-치안',
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
        type: 'AI-배회',
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
        type: '112-치안',
        title: '차량 사고 교통 정체',
        priority: '일반' as const,
        status: 'MONITORING' as const,
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 55)),
        location: { name: '하늘시 별빛구 구름대로', coordinates: [126.95, 37.39] as [number, number] },
        processingStage: '선별',
        resolution: { category: '112', code: '005', description: '' },
      },
      // 주의 3개
      {
        id: 'mock-6',
        type: '112-미아',
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
        type: '119-구조',
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
        type: '112-치안',
        title: '말다툼 주먹다짐 발생',
        priority: '주의' as const,
        status: 'MONITORING' as const,
        timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 30)),
        location: { name: '하늘시 별빛구 구름역 인근 상가 앞', coordinates: [126.97, 37.41] as [number, number] },
        processingStage: '착수',
        resolution: { category: '112', code: '008', description: '' },
      },
      // 경계 2개
      {
        id: 'mock-9',
        type: '119-화재',
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
        type: '112-치안',
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

  // 보이는 이벤트만 필터링 (중복 로직 제거)
  const visibleEvents: Event[] = useMemo(() => {
    // 가상 이벤트는 항상 표시
    const realEvents = visibleEventIds.size > 0 
      ? allConvertedEvents.filter((event) => visibleEventIds.has(event.id))
      : [];
    return [...mockEvents, ...realEvents];
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

  // 메뉴 선택 핸들러 (useCallback으로 메모이제이션)
  const handleMenuSelect = useCallback((menuId: 'net-monitoring' | 'fast-search' | 'object-tracking' | 'capture-list' | 'propagation' | 'broadcast') => {
    dispatch({ type: 'SET_MENU', payload: menuId });

    if (menuId === 'net-monitoring') {
      dispatch({ type: 'SHOW_NET_MONITORING_DIALOG' });
    } else if (menuId === 'fast-search') {
      // 예측 CCTV 리스트 패널 닫기
      setShowPredictedCCTVList(false);
      setShowFeaturedLayout(false);
      setObjectTrackingCompleted(false);
      setVisibleTrackingPins(0);
      // 고속검색 시작 시 신고 팝업을 위한 이벤트 선택
      const missingEvent = allConvertedEvents.find(event =>
        event.eventId === 'A-20260107-004' || event.id === 'A-20260107-004'
      );
      if (missingEvent) {
        dispatch({ type: 'SET_SELECTED_EVENT', payload: missingEvent.id });
        // 이벤트 핀을 지도에 표시하기 위해 visibleEventIds에 추가
        setVisibleEventIds(new Set([missingEvent.id]));
        // 이벤트 좌표로 지도 이동
        setFlyToLocation(missingEvent.location.coordinates as [number, number]);
      }
      dispatch({ type: 'START_FAST_SEARCH' });
    } else if (menuId === 'object-tracking') {
      // 객체 추적 메뉴 선택 시 - 에이전트 팝업과 동일한 로직
      // 고속검색 리스트가 있으면 확인 다이얼로그만 표시
      dispatch({ type: 'SHOW_OBJECT_TRACKING_CONFIRM' });
    } else if (menuId === 'capture-list') {
      dispatch({ type: 'SHOW_CAPTURE_LIST' });
    } else if (menuId === 'propagation') {
      dispatch({ type: 'SHOW_PROPAGATION_LIST' });
    }
  }, [allConvertedEvents]);

  // 포착 아이템 추가 핸들러
  const handleAddCaptureItem = useCallback((
    cctvName: string, 
    location: string, 
    confidence: number, 
    thumbnailUrlOrAnalysisResult?: string | any, 
    analysisResultParam?: string | any,
    videoUrlParam?: string,
    optionsParam?: { hideOverlayWithPopup?: boolean; trackingPinNumber?: number }
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
      ...(optionsParam?.trackingPinNumber != null && { trackingPinNumber: optionsParam.trackingPinNumber }),
    };
    
    setCaptureItems((prev) => [newItem, ...prev]);
    
    // 알림 메시지 설정
    const message = `${cctvName} | ${location}의 클립을 포착 목록에 추가했습니다.\n전파 패키지를 생성하여 전파를 보내세요.`;
    setCaptureNotificationMessage(message);
    setShowCaptureNotification(true);
    
    // 팝업과 동시에 오버레이 숨김(고속검색, onAddCapture 300ms 후 호출 → 400ms면 700ms에 오버레이 제거) vs 5초 유지(객체추적 등)
    const overlayDuration = optionsParam?.hideOverlayWithPopup ? 400 : 5000;
    setTimeout(() => {
      setShowCaptureNotification(false);
    }, overlayDuration);
  }, []);

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
    setPinOffset({ x: 0, y: 0 });
    setExcludedAttributes([]);
    setFlyToLocation(null);
    setShowPredictedCCTVList(false);
    setShowFeaturedLayout(false);
    setObjectTrackingCompleted(false);
    setVisibleTrackingPins(0);
  }, []);

  // 완전 초기화
  const handleBackToInitial = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
    setCaptureItems([]);
    setPinOffset({ x: 0, y: 0 });
    setExcludedAttributes([]);
    setExcludedImageIds([]);
    setFlyToLocation(null);
    setShowPredictedCCTVList(false);
    setShowFeaturedLayout(false);
    setObjectTrackingCompleted(false);
    setVisibleTrackingPins(0);
    setReSearchResult(null);
    setOpenCandidateId(null);
  }, []);

  // 객체 추적 애니메이션 완료 핸들러
  const handleTrackingComplete = useCallback(() => {
    setShowPredictedCCTVList(true);
    setObjectTrackingCompleted(true);
  }, []);

  // 객체 추적 시퀀스 시작 핸들러
  const handleStartTrackingSequence = useCallback(() => {
    // 기존 이벤트 핀 숨기기 (하지만 selectedEventId는 유지하여 신고 팝업 표시)
    setVisibleEventIds(new Set());
    
    // 기존 추적 핀 초기화
    setVisibleTrackingPins(0);
    
    // 예측 CCTV 리스트 숨기기
    setShowPredictedCCTVList(false);
    setShowFeaturedLayout(false);
    
    // 객체 추적 완료 플래그 리셋
    setObjectTrackingCompleted(false);
    
    // 추적 경로 좌표
    const trackingSequence = [
      [126.783853180335, 37.5049838114765], // 1번: 초기 목격 지점
      [126.7843434, 37.5042779],            // 2번: 목격 지점 (은하로363번길 48)
      [126.7828196, 37.50501939999999],     // 3번: 목격 지점 (은하로363번길 48)
      [126.7828168, 37.504067],             // 4번: 목격 지점 (달빛로301번길 28)
    ];
    
    // 1단계: 1번 핀 표시 및 줌인 (초기화 후 약간의 딜레이)
    setTimeout(() => {
      setVisibleTrackingPins(1);
      setFlyToLocation(trackingSequence[0] as [number, number]);
    }, 100);
    
    // 2단계: 2번 핀 표시 및 이동 (2.1초 후)
    setTimeout(() => {
      setVisibleTrackingPins(2);
      setFlyToLocation(trackingSequence[1] as [number, number]);
    }, 2100);
    
    // 3단계: 3번 핀 표시 및 이동 (4.1초 후)
    setTimeout(() => {
      setVisibleTrackingPins(3);
      setFlyToLocation(trackingSequence[2] as [number, number]);
    }, 4100);
    
    // 4단계: 4번 핀 표시 및 이동 (6.1초 후)
    setTimeout(() => {
      setVisibleTrackingPins(4);
      setFlyToLocation(trackingSequence[3] as [number, number]);
    }, 6100);
  }, []);

  /** 에이전트 팝업: 객체추적 시 신고팝업 아래 배치, 그 외 top: 16px */
  const BOTTOM_PANEL_HEIGHT = 198;
  const AGENT_TOP_GAP = 16;
  const AGENT_BOTTOM_GAP = 16;
  const REPORT_POPUP_GAP = 24;
  /** 초기화면 Agent Hub 플로팅 버튼: 패널 위 30px + 버튼 높이 56px + 여백 8px */
  const AGENT_FLOATING_BUTTON_RESERVE = 198 + 30 + 56 + 8;
  const reportPopupVisible = !!(uiState.selectedEventId && !uiState.showPropagationList && (uiState.showObjectTracking || isObjectTrackingTransitioning));
  const reportHeightForAgent = reportPopupHeight > 0 ? reportPopupHeight : 180; // 전환 시 폴백
  const agentTopPx = reportPopupVisible ? 20 + reportHeightForAgent + REPORT_POPUP_GAP : AGENT_TOP_GAP;
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      const bottomPanelVisible = uiState.showCCTV && !uiState.showFastSearchList && !uiState.showObjectTracking && !uiState.showCaptureList && !uiState.showPropagationList;
      const topPx = reportPopupVisible ? 20 + (reportPopupHeight > 0 ? reportPopupHeight : 180) + REPORT_POPUP_GAP : AGENT_TOP_GAP;
      const reserveBottom = (uiState.showFastSearchList || uiState.showObjectTracking || uiState.showCaptureList || uiState.showPropagationList || isObjectTrackingTransitioning) ? 24 : 24 + 56 + 8;
      const height = bottomPanelVisible
        ? window.innerHeight - AGENT_FLOATING_BUTTON_RESERVE - topPx
        : window.innerHeight - topPx - reserveBottom;
      setAgentPopupMaxHeight(Math.max(200, height));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [uiState.showCCTV, uiState.showFastSearchList, uiState.showObjectTracking, uiState.showCaptureList, uiState.showPropagationList, reportPopupHeight, reportPopupVisible, isObjectTrackingTransitioning]);

  // Report 팝업 페이드인 (객체추적 전환 시)
  useEffect(() => {
    if (isObjectTrackingTransitioning) {
      const raf = requestAnimationFrame(() => setReportFadeIn(true));
      return () => cancelAnimationFrame(raf);
    }
    setReportFadeIn(false);
  }, [isObjectTrackingTransitioning]);

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

  // 키보드 단축키 핸들러 (시나리오 프로토타입용)
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    const isInputFocused = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
    if (isInputFocused && e.key !== '2') return;
    
    const missingEvent = allConvertedEvents.find(event => 
      event.eventId === 'A-20260107-004' || event.id === 'A-20260107-004'
    );
    
    if (e.key === '1' && missingEvent) {
      dispatch({ type: 'SET_SELECTED_EVENT', payload: missingEvent.id });
      dispatch({ type: 'SET_HIGHLIGHTED_EVENT', payload: missingEvent.id });
      dispatch({ type: 'SHOW_AGENT_POPUP' });
      setVisibleEventIds(prev => new Set([...prev, missingEvent.id]));
      setPinOffset({ x: -100, y: 0 }); // 좌표 기준 좌측 100px
      setFlyToLocation(missingEvent.location.coordinates as [number, number]);
    } else if (e.key === '2') {
      // 예측 CCTV에서 포착대상 감지 시나리오: 에이전트 로딩 완료 후 5번 핀 이동
      setCaptureProgressMessage('예측 CCTV 분석 중...');
      setTimeout(() => setCaptureProgressMessage('포착 가능 구역 산정 중...'), 600);
      setTimeout(() => setCaptureProgressMessage('포착대상 감지 중...'), 1400);
      setTimeout(() => setCaptureProgressMessage('별빛A-655에서 포착 확인'), 2200);
      setTimeout(() => {
        setCaptureProgressMessage(null);
        setShowFeaturedLayout(true);
        setObjectTrackingCompleted(true);
        setVisibleTrackingPins(5);
        setShowPredictedCCTVList(true);
      }, 3000);
    } else if (e.key === '3') {
      handleStartTrackingSequence();
    } else if (e.key === '4') {
      dispatch({ type: 'SHOW_FAST_SEARCH_LIST' });
      setPinOffset({ x: 0, y: 0 });
      setOpenCandidateId('43');
    }
  }, [allConvertedEvents, handleStartTrackingSequence]);

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
              onCCTVHover={(cctvId, showLabel) => {
                setHoveredCCTVId(cctvId);
                setShowCCTVLabel(showLabel || false);
              }}
              hoveredCCTVId={hoveredCCTVId}
              showCCTVLabel={showCCTVLabel}
              pulseRadius={captureListRadius}
              showPredictedCCTVList={showPredictedCCTVList && !uiState.showCaptureList && !uiState.showPropagationList}
              showFeaturedLayout={showFeaturedLayout}
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
            externalShowCCTV={!uiState.showObjectTracking}
            onMapStateChange={setLastMapState}
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
        <div className="rounded-lg p-4 flex-1 overflow-hidden gradient-border-right-bottom" style={{ minHeight: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
          <EventList
            events={visibleEvents}
            selectedEventId={uiState.selectedEventId || undefined}
            onEventSelect={handleEventAction}
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

      {/* ReportPopup - 객체추적 모드 또는 전환 애니메이션 중 노출, 에이전트 팝업 위에 배치 */}
      {uiState.selectedEventId && !uiState.showPropagationList && (uiState.showObjectTracking || isObjectTrackingTransitioning) && (
        <div
          style={{
            opacity: uiState.showObjectTracking || reportFadeIn ? 1 : 0,
            transition: 'opacity 0.3s ease-out',
          }}
        >
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
          position={uiState.showFastSearchList || uiState.showObjectTracking || uiState.showCaptureList || uiState.showPropagationList || isObjectTrackingTransitioning ? { top: '1.25rem', right: '20px' } : { top: '1.25rem', right: '370px' }}
        />
        </div>
      )}

      {/* 대상포착 팝업 (사건 영상 바로 보기 클릭 시) */}
      <TargetCapturePopup
        isOpen={showFastSearchPopupOverlay}
        onClose={() => setShowFastSearchPopupOverlay(false)}
        thumbnailItems={[
          { id: 'people01', thumbnailUrl: '/hijacking/people01.png', label: '인물A (가해자 추정)' },
          { id: 'people02', thumbnailUrl: '/hijacking/people02.png', label: '인물B (피해자 추정)' },
          {
            id: 'car',
            thumbnailUrl: '/hijacking/car.png',
            label: '차량',
            bbox: { x: 720, y: 320, width: 480, height: 360 },
          },
        ]}
        videoUrlOverride="/hijacking/cnc_01_1.mp4"
        observationSummaryOverride="흰색 SUV(014저 4515)가 별빛A-444 검지 영역 중앙 도로상에 급정차한 후, 남색 상의를 착용한 인물이 하늘색 상의 인물의 신체를 강하게 결착하여 뒷좌석 승차를 강요함. 피해 의심 인물이 승차하자마자 즉시 문을 폐쇄하고 현장을 이탈하려는 긴박한 행동 패턴이 관찰됨."
        timelineOverride={[
          { time: '00:00 - 00:01', label: '흰색 SUV 차량이 은하로363번길 48 지점에 정차. 차량 뒤편에서 인물 2명 포착.', remarks: '상황 발생', seconds: 0, endSeconds: 2 },
          { time: '00:02 - 00:04', label: '남색 상의 인물이 상대방의 팔을 강하게 잡고 뒷좌석으로 밀어 넣는 강제 승차 시도 감지.', remarks: '위험 단계', seconds: 2, endSeconds: 5 },
          { time: '00:05 - 00:06', label: '피해 의심 인물 승차 완료 확인 및 즉각적인 차량 도어 폐쇄.', remarks: '상황 종료 및 이탈', seconds: 5, endSeconds: 7 },
        ]}
        metaDetailOverride={[
          {
            title: '1. 인물 A (가해자 추정)',
            detectedObject: '사람 (성인 남성)',
            mainAttributes: '남색 상의, 어두운색 바지',
            behavior: '인물 B의 신체를 강하게 결착하여 이동 경로를 강제로 제어함. 인물 B를 차량 뒷좌석으로 밀어 넣은 뒤, 즉시 문을 폐쇄하고 주변을 감시하는 행동 패턴을 보임.',
            exitDirection: '차량 뒷좌석 탑승 및 차량 이동 방향과 동일 (상단 방향)',
          },
          {
            title: '2. 인물 B (피해자 추정)',
            detectedObject: '사람 (고령자 또는 거동 불편자 추정)',
            mainAttributes: '하늘색 상의, 밝은색 바지',
            behavior: '자의적인 보행이 아닌 인물 A의 물리력에 의해 이동됨. 신체적 저항 능력이 현저히 낮은 상태로 관찰되며, 인물 A에 의해 차량 내부로 강제 진입됨.',
            exitDirection: '차량 내부 (뒷좌석)',
          },
          {
            title: '3. 차량',
            icon: 'mdi:car',
            detectedObject: '차량 (흰색 SUV)',
            mainAttributes: '번호판 014저 4515, 도로 중앙 정차',
            behavior: '좁은 이면도로 중앙을 점유하여 정차한 상태로 인물 B의 승차를 대기함. 엔진 가동 상태를 유지하며, 인물들이 모두 승차한 직후 즉각 현장을 이탈하려는 준비 동작이 감지됨.',
            exitDirection: '화면 상단 (북서 방향)',
          },
        ]}
        candidate={showFastSearchPopupOverlay ? {
          id: '5',
          cctvId: getCctvNameForCaptureItem({ id: '5' }),
          cctvName: getCctvNameForCaptureItem({ id: '5' }),
          timestamp: '10:33:40',
          confidence: getConfidenceForCaptureItem({ id: '5' }),
          location: getLocationForCaptureItem({ id: '5' }),
        } : null}
        onAddCapture={handleAddCaptureItem}
        onObjectTracking={() => {
          if (uiState.showFastSearchList) {
            dispatch({ type: 'SHOW_OBJECT_TRACKING_CONFIRM' });
          } else {
            setIsObjectTrackingTransitioning(true);
            setTimeout(() => {
              dispatch({ type: 'START_OBJECT_TRACKING' });
              handleStartTrackingSequence();
              setIsObjectTrackingTransitioning(false);
              setReportFadeIn(false);
            }, 350);
          }
        }}
      />

      {/* FastSearchListPanel (고속검색 화면 진입 시) */}
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
        showFeaturedLayout={showFeaturedLayout}
        triggerCaptureForCctvId={triggerCaptureForCctvId}
      />

      {/* CaptureListPanel - 포착 목록 */}
      <CaptureListPanel
        isVisible={uiState.showCaptureList}
        captureItems={captureItems}
        onCreatePropagationPackage={() => {
          dispatch({ type: 'SHOW_PROPAGATION_LIST' });
        }}
      />

      {/* PropagationListPanel - 전파 */}
      <PropagationListPanel
        isVisible={uiState.showPropagationList}
        onClose={() => dispatch({ type: 'HIDE_PROPAGATION_LIST' })}
        onBackToInitial={handleBackToInitial}
        captureItems={captureItems}
      />

      {/* 투망감시 안내 다이얼로그 */}
      <ConfirmDialog
        isOpen={uiState.showNetMonitoringDialog}
        title="투망감시"
        message="현재 객체 추적, 포착목록, 전파, CUVIA Link를 위한 데모 페이지입니다.\n다른 메뉴를 선택해 보세요."
        confirmText="확인"
        cancelText=""
        onConfirm={() => dispatch({ type: 'HIDE_NET_MONITORING_DIALOG' })}
        onCancel={() => dispatch({ type: 'HIDE_NET_MONITORING_DIALOG' })}
      />

      {/* 객체 추적 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={uiState.showObjectTrackingConfirm}
        title="객체 추적 검사"
        message={`현재 고속 검색 결과 ${listCardCount}건이 있습니다.\n객체 추적 검사를 시작하시겠습니까?`}
        confirmText="시작"
        cancelText="취소"
        onConfirm={() => {
          dispatch({ type: 'HIDE_OBJECT_TRACKING_CONFIRM' });
          dispatch({ type: 'START_OBJECT_TRACKING' });
          handleStartTrackingSequence();
        }}
        onCancel={() => dispatch({ type: 'HIDE_OBJECT_TRACKING_CONFIRM' })}
      />

      {/* 에이전트 팝업: 1키/시작 시 신고팝업 위치(top:1.25rem, right:370px), 고속검색 등 패널 슬라이드 시 우측 상단(20px) (전파 모드일 때는 숨김) */}
      {uiState.showAIAgentPopup && (
        <div style={{ display: uiState.showPropagationList ? 'none' : 'block' }}>
          <AIAgentPopup
            isOpen={uiState.showAIAgentPopup && !uiState.showPropagationList}
            onClose={() => dispatch({ type: 'COMPLETE_FAST_SEARCH' })}
            hideControls={uiState.hideControls}
            position={
              uiState.showFastSearchList || uiState.showObjectTracking || uiState.showCaptureList || isObjectTrackingTransitioning
                ? { top: `${agentTopPx}px`, right: '20px' }
                : { top: `${AGENT_TOP_GAP}px`, right: '370px' }
            }
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
            maxHeight={agentPopupMaxHeight}
            reSearchResult={reSearchResult}
            isObjectTracking={uiState.showObjectTracking}
            captureNotificationMessage={captureNotificationMessage}
            onObjectTrackingStart={() => {
              if (uiState.showFastSearchList) {
                dispatch({ type: 'SHOW_OBJECT_TRACKING_CONFIRM' });
              } else {
                // 초기화면: 신고 페이드인 + 에이전트 축소 애니메이션 후 전환
                setIsObjectTrackingTransitioning(true);
                setTimeout(() => {
                  dispatch({ type: 'START_OBJECT_TRACKING' });
                  handleStartTrackingSequence();
                  setIsObjectTrackingTransitioning(false);
                  setReportFadeIn(false);
                }, 350);
              }
            }}
            objectTrackingCompleted={objectTrackingCompleted}
            showFeaturedLayout={showFeaturedLayout}
            captureProgressMessage={captureProgressMessage}
            onPropagationDraftRequest={() => {
              setTriggerCaptureForCctvId('5');
              setTimeout(() => setTriggerCaptureForCctvId(null), 1500);
            }}
            onVideoView={() => setShowFastSearchPopupOverlay(true)}
            onPropagationPanelRequest={() => dispatch({ type: 'SHOW_PROPAGATION_LIST' })}
            showFastSearchProgress={uiState.showFastSearchProgress && !uiState.showCaptureList}
            onFastSearchComplete={() => {
              dispatch({ type: 'COMPLETE_FAST_SEARCH_PROGRESS' });
              setPinOffset({ x: 0, y: 0 });
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

    </div>
  );
}
