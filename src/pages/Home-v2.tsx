import { useState, useMemo, useEffect, useRef, useCallback, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import EventList from '@/components/dashboard/HOME/EventList';
import MapView from '@/components/dashboard/HOME-v2/MapView';
import ObjectTrackingMapView from '@/components/dashboard/HOME-v2/ObjectTrackingMapView';
import LeftPanel from '@/components/dashboard/HOME-v2/LeftPanel';
import LeftMenuPanel from '@/components/dashboard/HOME-v2/LeftMenuPanel';
import HeatmapPanel from '@/components/dashboard/HeatmapPanel';
import BottomPanel from '@/components/dashboard/BottomPanel';
import ReportPopup from '@/components/dashboard/HOME/ReportPopup';
import FastSearchListPanel from '@/components/dashboard/HOME-v2/FastSearchListPanel';
import PredictedCCTVListPanel from '@/components/dashboard/HOME-v2/PredictedCCTVListPanel';
import CaptureListPanel, { CaptureItem } from '@/components/dashboard/HOME-v2/CaptureListPanel';
import PropagationListPanel from '@/components/dashboard/HOME-v2/PropagationListPanel';
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
  | { type: 'HIDE_NET_MONITORING_DIALOG' };

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
  const [showStartMessage, setShowStartMessage] = useState<boolean>(true); // 시작 메시지창 표시 여부
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
  const [showMouseGuide, setShowMouseGuide] = useState<boolean>(true); // 마우스 유도 애니메이션 표시 여부 (기본값 true)
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 }); // 마우스 위치
  const [guideTarget, setGuideTarget] = useState<string | null>(null); // 마우스 가이드 타겟 요소 ID
  const [guideMessage, setGuideMessage] = useState<string>(''); // 마우스 가이드 메시지
  const [guideType, setGuideType] = useState<'mouse' | 'eye' | 'keyboard'>('mouse'); // 가이드 타입 (mouse: 클릭, eye: 시선, keyboard: 입력)
  const [captureDetailCloseCount, setCaptureDetailCloseCount] = useState<number>(0); // 포착 디테일 팝업 닫기 횟수
  
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
        location: { name: '하늘시 별빛구 달빛동 지하주차장', coordinates: [126.98, 37.42] as [number, number] },
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
        location: { name: '하늘시 별빛구 달빛동 사거리', coordinates: [126.97, 37.41] as [number, number] },
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
        location: { name: '하늘시 별빛구 달빛동 아파트 단지 내 쓰레기 수거함', coordinates: [126.96, 37.4] as [number, number] },
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
        location: { name: '하늘시 별빛구 달빛동 상가 앞', coordinates: [126.95, 37.39] as [number, number] },
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
    console.log('[Home-v2] 메뉴 선택:', menuId);
    dispatch({ type: 'SET_MENU', payload: menuId });
    
    if (menuId === 'net-monitoring') {
      dispatch({ type: 'SHOW_NET_MONITORING_DIALOG' });
    } else if (menuId === 'fast-search') {
      console.log('[Home-v2] 고속검색 시작');
      // 예측 CCTV 리스트 패널 닫기
      setShowPredictedCCTVList(false);
      setObjectTrackingCompleted(false);
      setVisibleTrackingPins(0);
      // 고속검색 시작 시 신고 팝업을 위한 이벤트 선택
      const missingEvent = allConvertedEvents.find(event => 
        event.eventId === 'A-20260107-004' || event.id === 'A-20260107-004'
      );
      console.log('[Home-v2] 찾은 이벤트:', missingEvent);
      if (missingEvent) {
        dispatch({ type: 'SET_SELECTED_EVENT', payload: missingEvent.id });
        // 이벤트 핀을 지도에 표시하기 위해 visibleEventIds에 추가
        setVisibleEventIds(new Set([missingEvent.id]));
        // 이벤트 위치로 지도 이동
        setFlyToLocation([126.783853180335, 37.5049838114765]);
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
    videoUrlParam?: string
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
    
    // 알림 메시지 설정
    const message = `${cctvName} | ${location}의 클립을 포착 목록에 추가했습니다.\n전파 패키지를 생성하여 전파를 보내세요.`;
    setCaptureNotificationMessage(message);
    setShowCaptureNotification(true);
    
    // 5초 후 알림 애니메이션 종료
    setTimeout(() => {
      setShowCaptureNotification(false);
    }, 5000);
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
    setObjectTrackingCompleted(false);
    setVisibleTrackingPins(0);
    setGuideTarget(null);
    setGuideMessage('');
    setGuideType('mouse');
  }, []);

  // 반경 칩 클릭 감지
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'radius-chip-button') return;

    const radiusChip = document.getElementById('radius-chip-button');
    if (!radiusChip) return;

    const handleClick = () => {
      console.log('[Home-v2] 반경 칩 클릭 - 확인 버튼 유도');
      
      // 클릭 즉시 가이드 숨김
      setGuideTarget(null);
      setGuideMessage('');

      // 0.5초 후: 확인 버튼으로 가이드 이동
      setTimeout(() => {
        console.log('[Home-v2] 확인 버튼 유도');
        setGuideTarget('radius-confirm-button');
        setGuideMessage('400m 이상으로 설정 후 확인 버튼을 클릭하세요.');
      }, 500);
    };

    radiusChip.addEventListener('click', handleClick);
    return () => radiusChip.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);

  // 슬라이더 값 변경 감지 (400m 이상 선택 시 확인 버튼으로 가이드 이동)
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'radius-slider') return;

    const slider = document.getElementById('radius-slider') as HTMLInputElement;
    if (!slider) return;

    const handleChange = () => {
      const value = Number(slider.value);
      console.log('[Home-v2] 슬라이더 값 변경:', value);
      
      if (value >= 400) {
        console.log('[Home-v2] 400m 이상 선택 완료 - 확인 버튼 유도');
        
        // 가이드를 확인 버튼으로 이동
        setGuideTarget('radius-confirm-button');
        setGuideMessage('확인 버튼을 클릭하세요.');
      }
    };

    slider.addEventListener('input', handleChange);
    return () => slider.removeEventListener('input', handleChange);
  }, [showMouseGuide, guideTarget]);

  // 반경 확인 버튼 클릭 감지
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'radius-confirm-button') return;

    const confirmButton = document.getElementById('radius-confirm-button');
    if (!confirmButton) {
      console.log('[Home-v2] 반경 확인 버튼을 찾을 수 없음');
      return;
    }

    console.log('[Home-v2] 반경 확인 버튼 클릭 리스너 등록');

    const handleClick = () => {
      console.log('[Home-v2] 반경 확인 버튼 클릭됨 - 에이전트 입력창 유도');
      
      // 클릭 즉시 가이드 숨김
      setGuideTarget(null);
      setGuideMessage('');

      // 0.3초 후: 에이전트 입력창으로 가이드 이동 (팝오버가 닫히기 전)
      setTimeout(() => {
        console.log('[Home-v2] 에이전트 입력창으로 가이드 설정');
        setGuideTarget('agent-chat-input');
        setGuideMessage('검색된 결과 확인 후 비정형 검색 조건을 자연어로 입력하여 후보를 좁힐 수 있습니다.<br>(예 : 우산 쓴 사람 빼줘, 우산 삭제 등)');
        setGuideType('keyboard');
      }, 300);
    };

    // capture phase에서 이벤트 캡처
    confirmButton.addEventListener('click', handleClick, true);
    return () => {
      console.log('[Home-v2] 반경 확인 버튼 클릭 리스너 제거');
      confirmButton.removeEventListener('click', handleClick, true);
    };
  }, [showMouseGuide, guideTarget]);

  // 에이전트 입력창 감지 (우산 삭제 입력 시 전송 버튼으로 가이드 이동)
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'agent-chat-input') return;

    const checkInput = () => {
      const inputElement = document.getElementById('agent-chat-input') as HTMLTextAreaElement;
      if (inputElement && inputElement.value.includes('우산')) {
        setGuideTarget('agent-chat-send-button');
        setGuideMessage('전송 버튼을 클릭하세요');
        setGuideType('mouse');
      }
    };

    const interval = setInterval(checkInput, 200);
    return () => clearInterval(interval);
  }, [showMouseGuide, guideTarget]);

  // 전송 버튼 클릭 감지 (클릭 시 가이드 숨김)
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'agent-chat-send-button') return;

    const sendButton = document.getElementById('agent-chat-send-button');
    if (!sendButton) return;

    const handleClick = () => {
      setGuideTarget(null);
      setGuideMessage('');
    };

    sendButton.addEventListener('click', handleClick);
    return () => sendButton.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);

  // 재검색 완료 후 59번 리스트로 가이드 이동 (스켈레톤 완료 즉시)
  useEffect(() => {
    if (!showMouseGuide || !reSearchResult || uiState.showReSearchProgress) return;

    // 스켈레톤이 끝나고 카드가 표시되면 즉시 가이드 이동
    setGuideTarget('fast-search-candidate-10');
    setGuideMessage('디테일한 고속 검색 결과를 확인해 보세요.');
  }, [showMouseGuide, reSearchResult, uiState.showReSearchProgress]);

  // 59번 리스트 클릭 감지 및 팝업 열림 시 순차적 가이드
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'fast-search-candidate-10') return;

    const candidateElement = document.getElementById('fast-search-candidate-10');
    if (!candidateElement) return;

    const handleClick = () => {
      console.log('[Home-v2] 59번 후보 클릭 - 순차적 가이드 시작');
      
      // 클릭 즉시 가이드 숨김
      setGuideTarget(null);
      setGuideMessage('');

      // 1단계: 팝업 위에 메시지 표시 (0.5초)
      setTimeout(() => {
        console.log('[Home-v2] 1단계: 팝업 메시지');
        setGuideMessage('검색 된 대상의 디테일한 정보를 확인할 수 있어요.');
      }, 500);

      // 2단계: 후보 메타정보 탭 버튼으로 가이드 이동 (2.5초)
      setTimeout(() => {
        console.log('[Home-v2] 2단계: 메타정보 탭');
        setGuideTarget('detail-tab-button');
        setGuideMessage('후보 메타정보 탭을 클릭하세요.');
      }, 2500);
    };

    candidateElement.addEventListener('click', handleClick);
    return () => candidateElement.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);

  // 후보 메타정보 탭 클릭 감지
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'detail-tab-button') return;

    const tabButton = document.getElementById('detail-tab-button');
    if (!tabButton) return;

    const handleClick = () => {
      console.log('[Home-v2] 탭 클릭 - 유사도로 이동');
      
      // 클릭 즉시 가이드 숨김
      setGuideTarget(null);
      setGuideMessage('');

      // 0.5초 후: 유사도 드롭박스로 가이드 이동
      setTimeout(() => {
        console.log('[Home-v2] 유사도 드롭박스');
        setGuideTarget('similarity-dropdown');
        setGuideMessage('유사도 상세 정보를 확인하세요.');
      }, 500);
    };

    tabButton.addEventListener('click', handleClick);
    return () => tabButton.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);

  // 유사도 드롭박스 클릭 감지
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'similarity-dropdown') return;

    const similarityElement = document.getElementById('similarity-dropdown');
    if (!similarityElement) return;

    const handleClick = () => {
      console.log('[Home-v2] 유사도 클릭 - 대상 포착으로 이동');
      
      // 클릭 즉시 가이드 숨김
      setGuideTarget(null);
      setGuideMessage('');

      // 2초 후: 대상 포착 버튼으로 가이드 이동
      setTimeout(() => {
        console.log('[Home-v2] 대상 포착 버튼');
        setGuideTarget('capture-target-button');
        setGuideMessage('대상을 포착 시 대상 포착 버튼을 눌러주세요.');
      }, 2000);
    };

    similarityElement.addEventListener('click', handleClick);
    return () => similarityElement.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);

  // 대상 포착 버튼 클릭 감지
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'capture-target-button') return;

    const captureButton = document.getElementById('capture-target-button');
    if (!captureButton) return;

    const handleClick = () => {
      console.log('[Home-v2] 대상 포착 클릭 - 포착 목록 메뉴 유도');
      
      // 클릭 즉시 가이드 숨김
      setGuideTarget(null);
      setGuideMessage('');

      // 1초 후: 포착 목록 메뉴로 가이드 이동 (시선 유도)
      setTimeout(() => {
        console.log('[Home-v2] 포착 목록 메뉴 유도 (시선)');
        setGuideTarget('capture-list-menu');
        setGuideMessage('해당 검색 결과가 전파 근거를 위하여 포착 목록에 이동했습니다.');
        setGuideType('eye');
        
        // 5초 후 자동으로 맞음 시퀀스로 진행 (마우스 유도)
        setTimeout(() => {
          console.log('[Home-v2] 5초 경과 - 59번 맞음 체크 유도');
          setGuideTarget('match-button-10');
          setGuideMessage('고속 검색 후보군 중 확정 후보는 맞음을 선택하여 후보군에 추가하세요.');
          setGuideType('mouse');
        }, 5000);
      }, 1000);
    };

    captureButton.addEventListener('click', handleClick);
    return () => captureButton.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);


  // 59번 맞음 버튼 클릭 감지
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'match-button-10') return;

    const matchButton = document.getElementById('match-button-10');
    if (!matchButton) return;

    const handleClick = () => {
      console.log('[Home-v2] 59번 맞음 체크 - 5번 틀림 체크 유도');
      
      // 클릭 즉시 가이드 숨김
      setGuideTarget(null);
      setGuideMessage('');

      // 1초 후: 1번(05) 틀림 버튼으로 가이드 이동
      setTimeout(() => {
        console.log('[Home-v2] 1번(05) 틀림 체크');
        setGuideTarget('wrong-button-1');
        setGuideMessage('고속 검색 후보군 중 맞지 않는 후보는 틀림으로 체크하세요.');
      }, 1000);
    };

    matchButton.addEventListener('click', handleClick);
    return () => matchButton.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);

  // 05번 틀림 버튼 클릭 감지
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'wrong-button-1') return;

    const wrongButton = document.getElementById('wrong-button-1');
    if (!wrongButton) return;

    const handleClick = () => {
      console.log('[Home-v2] 05번 틀림 체크 - 결과 재검색 버튼 유도');
      
      // 클릭 즉시 가이드 숨김
      setGuideTarget(null);
      setGuideMessage('');

      // 1초 후: 결과 재검색 버튼으로 가이드 이동
      setTimeout(() => {
        console.log('[Home-v2] 결과 재검색 버튼 유도');
        setGuideTarget('re-search-button');
        setGuideMessage('추가한 조건 및 대표 후보를 기반으로 재검색을 시작합니다.');
        setGuideType('mouse');
      }, 1000);
    };

    wrongButton.addEventListener('click', handleClick);
    return () => wrongButton.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);

  // 결과 재검색 버튼 클릭 감지
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 're-search-button') return;

    const reSearchButton = document.getElementById('re-search-button');
    if (!reSearchButton) return;

    const handleClick = () => {
      console.log('[Home-v2] 결과 재검색 버튼 클릭 - 객체 추적 메뉴 유도');
      
      // 클릭 즉시 가이드 숨김
      setGuideTarget(null);
      setGuideMessage('');

      // 1초 후: 객체 추적 메뉴로 가이드 이동
      setTimeout(() => {
        console.log('[Home-v2] 객체 추적 메뉴 유도');
        setGuideTarget('object-tracking-menu');
        setGuideMessage('객체 추적 메뉴를 클릭하세요.');
        setGuideType('mouse');
      }, 1000);
    };

    reSearchButton.addEventListener('click', handleClick);
    return () => reSearchButton.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);

  // 객체 추적 메뉴 클릭 감지
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'object-tracking-menu') return;

    const trackingMenu = document.getElementById('object-tracking-menu');
    if (!trackingMenu) return;

    const handleClick = () => {
      console.log('[Home-v2] 객체 추적 메뉴 클릭 - 다이얼로그 시작 버튼 유도');
      
      // 클릭 즉시 가이드 숨김
      setGuideTarget(null);
      setGuideMessage('');

      // 0.5초 후: 다이얼로그 시작 버튼으로 가이드 이동
      setTimeout(() => {
        console.log('[Home-v2] 다이얼로그 시작 버튼 유도');
        setGuideTarget('object-tracking-confirm-button');
        setGuideMessage('시작 버튼을 클릭하세요.');
        setGuideType('mouse');
      }, 500);
    };

    trackingMenu.addEventListener('click', handleClick);
    return () => trackingMenu.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);

  // 객체 추적 다이얼로그 시작 버튼 클릭 감지
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'object-tracking-confirm-button') return;

    const confirmButton = document.getElementById('object-tracking-confirm-button');
    if (!confirmButton) return;

    const handleClick = () => {
      console.log('[Home-v2] 객체 추적 시작 버튼 클릭 - 애니메이션 완료 대기');
      
      // 클릭 즉시 가이드 숨김
      setGuideTarget(null);
      setGuideMessage('');
    };

    confirmButton.addEventListener('click', handleClick);
    return () => confirmButton.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);

  // 객체 추적 애니메이션 완료 핸들러
  const handleTrackingComplete = useCallback(() => {
    console.log('[Home-v2] 객체 추적 애니메이션 완료 - 예측 CCTV 리스트 표시 및 에이전트 팝업 결과 메시지');
    setShowPredictedCCTVList(true);
    setObjectTrackingCompleted(true);

    // 마우스 가이드: 예측 CCTV 리스트 별빛A-689 유도 (즉시)
    if (showMouseGuide) {
      console.log('[Home-v2] 예측 CCTV 리스트 별빛A-689 유도');
      setGuideTarget('predicted-cctv-7');
      setGuideMessage('객체추적 결과를 통해 지도에서 이동 경로를 확인하고,<br/>마지막 확인 지점 이후 포착 예측 주변 CCTV 리스트를 확인합니다.');
      setGuideType('mouse');
    }
  }, [showMouseGuide]);

  // 예측 CCTV 리스트 별빛A-689 클릭 감지
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'predicted-cctv-7') return;

    const cctvCard = document.getElementById('predicted-cctv-7');
    if (!cctvCard) return;

    const handleClick = () => {
      console.log('[Home-v2] 별빛A-689 클릭 - 경로 예측 드롭박스 유도');
      
      // 클릭 즉시 가이드 숨김
      setGuideTarget(null);
      setGuideMessage('');

      // 0.5초 후: 경로 예측 상세 근거 드롭박스로 가이드 이동
      setTimeout(() => {
        console.log('[Home-v2] 경로 예측 상세 근거 드롭박스 유도');
        setGuideTarget('route-prediction-dropdown');
        setGuideMessage('경로 예측 상세 근거를 확인하세요.');
        setGuideType('mouse');
      }, 500);
    };

    cctvCard.addEventListener('click', handleClick);
    return () => cctvCard.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);

  // 경로 예측 드롭박스 클릭 감지
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'route-prediction-dropdown') return;

    const dropdown = document.getElementById('route-prediction-dropdown');
    if (!dropdown) return;

    const handleClick = () => {
      console.log('[Home-v2] 경로 예측 드롭박스 클릭 - 대상 발견 버튼 유도');
      
      // 클릭 즉시 가이드 숨김
      setGuideTarget(null);
      setGuideMessage('');

      // 2초 후: 대상 발견 버튼으로 가이드 이동
      setTimeout(() => {
        console.log('[Home-v2] 대상 발견 버튼 유도');
        setGuideTarget('predicted-target-found-button');
        setGuideMessage('대상을 포착 시 대상 포착 버튼을 눌러주세요.');
        setGuideType('mouse');
      }, 2000);
    };

    dropdown.addEventListener('click', handleClick);
    return () => dropdown.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);

  // 대상 발견 버튼 클릭 감지
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'predicted-target-found-button') return;

    const targetButton = document.getElementById('predicted-target-found-button');
    if (!targetButton) return;

    const handleClick = () => {
      console.log('[Home-v2] 대상 발견 버튼 클릭 - 팝업 닫기 버튼 유도');
      
      // 클릭 즉시 가이드 숨김
      setGuideTarget(null);
      setGuideMessage('');

      // 1초 후: 팝업 닫기 버튼으로 가이드 이동
      setTimeout(() => {
        console.log('[Home-v2] 팝업 닫기 버튼 유도');
        setGuideTarget('predicted-cctv-close-button');
        setGuideMessage('대상 포착을 완료한 뒤 닫기를 눌러 팝업을 닫아주세요.');
        setGuideType('mouse');
      }, 1000);
    };

    targetButton.addEventListener('click', handleClick);
    return () => targetButton.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);

  // 예측 CCTV 팝업 닫기 버튼 클릭 감지
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'predicted-cctv-close-button') return;

    const closeButton = document.getElementById('predicted-cctv-close-button');
    if (!closeButton) return;

    const handleClick = () => {
      console.log('[Home-v2] 팝업 닫기 - 포착 목록 메뉴 유도');
      
      // 클릭 즉시 가이드 숨김
      setGuideTarget(null);
      setGuideMessage('');

      // 0.5초 후: 포착 목록 메뉴로 가이드 이동
      setTimeout(() => {
        console.log('[Home-v2] 포착 목록 메뉴 유도');
        setGuideTarget('capture-list-menu');
        setGuideMessage('포착한 대상의 정보를 확인하고 AI로 생성된 전파문 초안을 확인, 전파 패키지를 생성 및 전송합니다.');
        setGuideType('mouse');
      }, 500);
    };

    closeButton.addEventListener('click', handleClick);
    return () => closeButton.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);

  // 포착 목록 메뉴 클릭 감지
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'capture-list-menu') return;

    const captureMenu = document.getElementById('capture-list-menu');
    if (!captureMenu) return;

    const handleClick = () => {
      console.log('[Home-v2] 포착 목록 메뉴 클릭 - 원미A-638 리스트 유도');
      
      // 클릭 즉시 가이드 숨김
      setGuideTarget(null);
      setGuideMessage('');

      // 0.5초 후: 별빛A-638 리스트로 가이드 이동
      setTimeout(() => {
        console.log('[Home-v2] 별빛A-638 리스트 유도');
        setGuideTarget('capture-item-0');
        setGuideMessage('객체 추적 시 포착한 대상의 전파 근거 정보를 확인합니다.');
        setGuideType('mouse');
      }, 500);
    };

    captureMenu.addEventListener('click', handleClick);
    return () => captureMenu.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);

  // 별빛A-638 리스트 클릭 감지
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'capture-item-0') return;

    const captureItem = document.getElementById('capture-item-0');
    if (!captureItem) return;

    const handleClick = () => {
      console.log('[Home-v2] 별빛A-638 리스트 클릭 - 팝업 닫기 버튼 유도');
      
      // 클릭 즉시 가이드 숨김
      setGuideTarget(null);
      setGuideMessage('');

      // 0.5초 후: 팝업 닫기 버튼으로 가이드 이동
      setTimeout(() => {
        console.log('[Home-v2] 포착 디테일 팝업 닫기 버튼 유도');
        setGuideTarget('capture-detail-close-button');
        setGuideMessage('전파 근거 내용을 확인 후 팝업을 닫아주세요.');
        setGuideType('mouse');
      }, 500);
    };

    captureItem.addEventListener('click', handleClick);
    return () => captureItem.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);

  // 포착 디테일 팝업 닫기 버튼 클릭 감지 (통합)
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'capture-detail-close-button') return;

    const closeButton = document.getElementById('capture-detail-close-button');
    if (!closeButton) return;

    const handleClick = () => {
      if (captureDetailCloseCount === 0) {
        // 첫 번째 닫기: 별빛A-604 리스트로 유도
        console.log('[Home-v2] 포착 디테일 팝업 닫기 (1차) - 별빛A-604 리스트 유도');
        
        setCaptureDetailCloseCount(1);
        
        // 클릭 즉시 가이드 숨김
        setGuideTarget(null);
        setGuideMessage('');

        // 0.5초 후: 별빛A-604 리스트로 가이드 이동
        setTimeout(() => {
          console.log('[Home-v2] 별빛A-604 리스트 유도');
          setGuideTarget('capture-item-1');
          setGuideMessage('고속 검색 시 포착한 대상의 전파 근거 정보를 확인합니다.');
          setGuideType('mouse');
        }, 500);
      } else {
        // 두 번째 닫기: 별빛A-638 체크박스로 유도
        console.log('[Home-v2] 포착 디테일 팝업 닫기 (2차) - 별빛A-638 체크박스 유도');
        
        setCaptureDetailCloseCount(0); // 리셋
        
        // 클릭 즉시 가이드 숨김
        setGuideTarget(null);
        setGuideMessage('');

        // 0.5초 후: 별빛A-638 체크박스로 가이드 이동
        setTimeout(() => {
          console.log('[Home-v2] 별빛A-638 체크박스 유도');
          setGuideTarget('capture-checkbox-0');
          setGuideMessage('별빛A-638을 선택하세요.');
          setGuideType('mouse');
        }, 500);
      }
    };

    closeButton.addEventListener('click', handleClick);
    return () => closeButton.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget, captureDetailCloseCount]);

  // 별빛A-604 리스트 클릭 감지
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'capture-item-1') return;

    const captureItem = document.getElementById('capture-item-1');
    if (!captureItem) return;

    const handleClick = () => {
      console.log('[Home-v2] 별빛A-604 리스트 클릭 - 팝업 닫기 버튼 유도');
      
      // 클릭 즉시 가이드 숨김
      setGuideTarget(null);
      setGuideMessage('');

      // 0.5초 후: 팝업 닫기 버튼으로 가이드 이동
      setTimeout(() => {
        console.log('[Home-v2] 포착 디테일 팝업 닫기 버튼 유도 (2차)');
        setGuideTarget('capture-detail-close-button');
        setGuideMessage('전파 근거 내용을 확인 후 팝업을 닫아주세요.');
        setGuideType('mouse');
      }, 500);
    };

    captureItem.addEventListener('click', handleClick);
    return () => captureItem.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);

  // 별빛A-638 체크박스 클릭 감지
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'capture-checkbox-0') return;

    const checkbox = document.getElementById('capture-checkbox-0');
    if (!checkbox) return;

    const handleClick = () => {
      console.log('[Home-v2] 별빛A-638 체크박스 클릭 - 별빛A-604 체크박스 유도');
      
      // 클릭 즉시 가이드 숨김
      setGuideTarget(null);
      setGuideMessage('');

      // 1초 후: 별빛A-604 체크박스로 가이드 이동
      setTimeout(() => {
        console.log('[Home-v2] 별빛A-604 체크박스 유도');
        setGuideTarget('capture-checkbox-1');
        setGuideMessage('별빛A-604를 선택하세요.');
        setGuideType('mouse');
      }, 1000);
    };

    checkbox.addEventListener('click', handleClick);
    return () => checkbox.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);

  // 별빛A-604 체크박스 클릭 감지
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'capture-checkbox-1') return;

    const checkbox = document.getElementById('capture-checkbox-1');
    if (!checkbox) return;

    const handleClick = () => {
      console.log('[Home-v2] 별빛A-604 체크박스 클릭 - 전파 패키지 생성 버튼 유도');
      
      // 클릭 즉시 가이드 숨김
      setGuideTarget(null);
      setGuideMessage('');

      // 1초 후: 전파 패키지 생성 버튼으로 가이드 이동
      setTimeout(() => {
        console.log('[Home-v2] 전파 패키지 생성 버튼 유도');
        setGuideTarget('create-propagation-package-button');
        setGuideMessage('포착한 정보를 토대로 전파의 초안을 AI가 생성합니다.');
        setGuideType('mouse');
      }, 1000);
    };

    checkbox.addEventListener('click', handleClick);
    return () => checkbox.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);

  // 전파 패키지 생성 버튼 클릭 감지
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'create-propagation-package-button') return;

    const createButton = document.getElementById('create-propagation-package-button');
    if (!createButton) return;

    const handleClick = () => {
      console.log('[Home-v2] 전파 패키지 생성 버튼 클릭 - 상세보기 탭 유도');
      
      // 클릭 즉시 가이드 숨김
      setGuideTarget(null);
      setGuideMessage('');

      // 1초 후: 상세보기 탭으로 가이드 이동 (팝업 열리는 시간 고려)
      setTimeout(() => {
        console.log('[Home-v2] 상세보기 탭 유도');
        setGuideTarget('propagation-detail-tab');
        setGuideMessage('상세 보기 탭을 클릭하세요.');
        setGuideType('mouse');
      }, 1000);
    };

    createButton.addEventListener('click', handleClick);
    return () => createButton.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);

  // 상세보기 탭 클릭 감지
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'propagation-detail-tab') return;

    const detailTab = document.getElementById('propagation-detail-tab');
    if (!detailTab) return;

    const handleClick = () => {
      console.log('[Home-v2] 상세보기 탭 클릭 - 3초 후 전파패키지 전송 버튼 유도');
      
      // 클릭 즉시 가이드 숨김
      setGuideTarget(null);
      setGuideMessage('');

      // 3초 후: 전파패키지 전송 버튼으로 가이드 이동
      setTimeout(() => {
        console.log('[Home-v2] 전파패키지 전송 버튼 유도');
        setGuideTarget('send-propagation-package-button');
        setGuideMessage('전파 패키지를 전송하세요.');
        setGuideType('mouse');
      }, 3000);
    };

    detailTab.addEventListener('click', handleClick);
    return () => detailTab.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);

  // 전파패키지 전송 버튼 클릭 감지 (클릭 시 가이드 종료)
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'send-propagation-package-button') return;

    const sendButton = document.getElementById('send-propagation-package-button');
    if (!sendButton) return;

    const handleClick = () => {
      console.log('[Home-v2] 전파패키지 전송 버튼 클릭 - 가이드 종료');
      setGuideTarget(null);
      setGuideMessage('');
    };

    sendButton.addEventListener('click', handleClick);
    return () => sendButton.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);

  // 예측 CCTV 리스트 별빛A-689 클릭 감지
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'predicted-cctv-7') return;

    const cctvCard = document.getElementById('predicted-cctv-7');
    if (!cctvCard) return;

    const handleClick = () => {
      console.log('[Home-v2] 별빛A-689 클릭 - 경로 예측 드롭박스 유도');
      
      // 클릭 즉시 가이드 숨김
      setGuideTarget(null);
      setGuideMessage('');

      // 0.5초 후: 경로 예측 상세 근거 드롭박스로 가이드 이동
      setTimeout(() => {
        console.log('[Home-v2] 경로 예측 상세 근거 드롭박스 유도');
        setGuideTarget('route-prediction-dropdown');
        setGuideMessage('경로 예측 상세 근거를 확인하세요.');
      }, 500);
    };

    cctvCard.addEventListener('click', handleClick);
    return () => cctvCard.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);

  // 경로 예측 드롭박스 클릭 감지
  useEffect(() => {
    if (!showMouseGuide || guideTarget !== 'route-prediction-dropdown') return;

    const dropdown = document.getElementById('route-prediction-dropdown');
    if (!dropdown) return;

    const handleClick = () => {
      console.log('[Home-v2] 경로 예측 드롭박스 클릭 - 대상 발견 버튼 유도');
      
      // 클릭 즉시 가이드 숨김
      setGuideTarget(null);
      setGuideMessage('');

      // 2초 후: 대상 발견 버튼으로 가이드 이동
      setTimeout(() => {
        console.log('[Home-v2] 대상 발견 버튼 유도');
        setGuideTarget('predicted-target-found-button');
        setGuideMessage('대상을 포착 시 대상 포착 버튼을 눌러주세요.');
      }, 2000);
    };

    dropdown.addEventListener('click', handleClick);
    return () => dropdown.removeEventListener('click', handleClick);
  }, [showMouseGuide, guideTarget]);

  // 객체 추적 시퀀스 시작 핸들러
  const handleStartTrackingSequence = useCallback(() => {
    console.log('[Home-v2] 객체 추적 시퀀스 시작');
    
    // 기존 이벤트 핀 숨기기 (하지만 selectedEventId는 유지하여 신고 팝업 표시)
    setVisibleEventIds(new Set());
    
    // 기존 추적 핀 초기화
    setVisibleTrackingPins(0);
    
    // 예측 CCTV 리스트 숨기기
    setShowPredictedCCTVList(false);
    
    // 객체 추적 완료 플래그 리셋
    setObjectTrackingCompleted(false);
    
    // 추적 경로 좌표
    const trackingSequence = [
      [126.783853180335, 37.5049838114765], // 1번: 초기 목격 지점
      [126.7843434, 37.5042779],            // 2번: 목격 지점 (은하동 126-18)
      [126.7828196, 37.50501939999999],     // 3번: 목격 지점 (은하동 125-46)
      [126.7828168, 37.504067],             // 4번: 목격 지점 (은하동 125-32)
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
  }, []);

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
      setFlyToLocation([126.783853180335, 37.5049838114765]);
      
      // 마우스 가이드가 켜져있으면 고속검색 시작 버튼으로 이동
      if (showMouseGuide) {
        setTimeout(() => {
          setGuideTarget('fast-search-start-button');
          setGuideMessage('고속검색 시작 버튼을 클릭하세요');
        }, 500); // 팝업이 나타난 후 0.5초 뒤에 가이드 이동
      }
    }
  }, [allConvertedEvents, showMouseGuide]);

  // 키보드 단축키 핸들러 (시나리오 프로토타입용)
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    const missingEvent = allConvertedEvents.find(event => 
      event.eventId === 'A-20260107-004' || event.id === 'A-20260107-004'
    );
    
    if (e.key === '0') {
      setShowMouseGuide(prev => !prev);
      setShowStartMessage(prev => !prev);
    } else if (e.key === '1' && missingEvent) {
      setShowStartMessage(false);
      dispatch({ type: 'SET_SELECTED_EVENT', payload: missingEvent.id });
      dispatch({ type: 'SET_HIGHLIGHTED_EVENT', payload: missingEvent.id });
      setVisibleEventIds(prev => new Set([...prev, missingEvent.id]));
      setFlyToLocation([126.783853180335, 37.5049838114765]);
      
      // 마우스 가이드가 켜져있으면 고속검색 시작 버튼으로 이동
      if (showMouseGuide) {
        setTimeout(() => {
          setGuideTarget('fast-search-start-button');
          setGuideMessage('고속검색 시작 버튼을 클릭하세요');
        }, 500); // 팝업이 나타난 후 0.5초 뒤에 가이드 이동
      }
    } else if (e.key === '2') {
      setShowPredictedCCTVList(true);
      setObjectTrackingCompleted(true);
    } else if (e.key === '3') {
      console.log('[Home-v2] 3번 키 - 객체 추적 시작');
      handleStartTrackingSequence();
    } else if (e.key === '4') {
      dispatch({ type: 'SHOW_FAST_SEARCH_LIST' });
      setPinOffset({ x: 0, y: 0 });
      setOpenCandidateId('43');
    }
  }, [allConvertedEvents, handleStartTrackingSequence, showMouseGuide]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // 마우스 위치 추적 (가이드 타겟이 있으면 타겟 위치로, 없으면 실제 마우스 위치)
  useEffect(() => {
    if (!showMouseGuide) return;

    // 가이드 타겟이 있으면 타겟 요소의 중심으로 위치 설정
    if (guideTarget) {
      const updateTargetPosition = () => {
        const targetElement = document.getElementById(guideTarget);
        if (targetElement) {
          const rect = targetElement.getBoundingClientRect();
          // 버튼의 정확한 중심 계산
          const centerX = rect.left + (rect.width / 2);
          const centerY = rect.top + (rect.height / 2);
          
          console.log('[MouseGuide] 타겟 위치:', {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            centerX,
            centerY
          });
          
          setMousePosition({
            x: centerX,
            y: centerY,
          });
        } else {
          console.log('[MouseGuide] 타겟 요소를 찾을 수 없음:', guideTarget);
        }
      };

      // 초기 위치 설정 (약간의 딜레이 추가)
      setTimeout(updateTargetPosition, 100);

      // 윈도우 리사이즈 시 위치 업데이트
      window.addEventListener('resize', updateTargetPosition);
      
      // 주기적으로 위치 업데이트 (팝업 애니메이션 등에 대응)
      const interval = setInterval(updateTargetPosition, 100);

      return () => {
        window.removeEventListener('resize', updateTargetPosition);
        clearInterval(interval);
      };
    } else {
      // 가이드 타겟이 없으면 실제 마우스 위치 추적
      const handleMouseMove = (e: MouseEvent) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [showMouseGuide, guideTarget]);

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
            console.log('[Home-v2] 고속검색 시작 - 프로그래스 표시');
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
        showReSearchDim={false}
        onReSearchComplete={() => {
          dispatch({ type: 'COMPLETE_RE_SEARCH' });
          isReSearchingRef.current = true;
        }}
        onReSearchClick={() => {
          console.log('[Home-v2] 결과 재검색 버튼 클릭 - 05, 11, 15번 제외');
          
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
      />

      {/* CaptureListPanel - 포착 목록 */}
      <CaptureListPanel
        isVisible={uiState.showCaptureList}
        captureItems={captureItems}
        onCreatePropagationPackage={() => {
          console.log('[Home-v2] 전파 패키지 생성 요청 - 전파 패널 열기');
          dispatch({ type: 'SHOW_PROPAGATION_LIST' });
        }}
      />

      {/* PropagationListPanel - 전파 */}
      <PropagationListPanel
        isVisible={uiState.showPropagationList}
        onClose={() => dispatch({ type: 'HIDE_PROPAGATION_LIST' })}
        onBackToInitial={() => dispatch({ type: 'CLEAR_ALL' })}
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
            maxHeight={agentPopupMaxHeight}
            reSearchResult={reSearchResult}
            isObjectTracking={uiState.showObjectTracking}
            captureNotificationMessage={showCaptureNotification ? captureNotificationMessage : ''}
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
              console.log('[Home-v2] 고속검색 프로그래스 완료');
              dispatch({ type: 'COMPLETE_FAST_SEARCH_PROGRESS' });
              setPinOffset({ x: 0, y: 0 });
              
              // 마우스 가이드가 켜져있으면 반경 칩으로 즉시 이동
              if (showMouseGuide) {
                setGuideTarget('radius-chip-button');
                setGuideMessage('검색된 결과 확인 후 정형 검색 조건을 추가 입력하여 후보를 좁히거나 늘려보세요.');
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
      {showStartMessage && (
        <div 
          className="absolute top-8 left-1/2 transform -translate-x-1/2 z-[9999]"
        >
          <div 
            className="bg-black/80 border border-gray-700 rounded-2xl p-8 text-center"
            style={{
              minWidth: '400px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
          >
            <p className="text-white text-lg mb-6" style={{ lineHeight: '1.8' }}>
              실종 시뮬레이션을 해보시려면<br />
              <span className="font-bold text-blue-400">1</span> 또는 <span className="font-bold">시작 버튼</span>을 눌러주세요.
            </p>
            <button
              onClick={handleStartSimulation}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              시작
            </button>
          </div>
        </div>
      )}

      {/* 마우스 유도 애니메이션 - 프로그래스 진행 중에는 숨김, guideTarget이 있을 때만 표시 */}
      {showMouseGuide && !uiState.showFastSearchProgress && guideTarget && (
        <div
          className="fixed pointer-events-none z-[10010]"
          style={{
            left: `${mousePosition.x}px`,
            top: `${mousePosition.y}px`,
          }}
        >
          {/* 중심 원 - 크기 증가 및 펄스 효과 (시선 유도 타입일 때는 숨김) */}
          {guideType !== 'eye' && (
            <div
              className="absolute"
              style={{
                left: '0',
                top: '0',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className="w-5 h-5 rounded-full bg-orange-600/70 border-2 border-orange-400"
                style={{
                  boxShadow: '0 0 15px rgba(234, 88, 12, 0.9), 0 0 30px rgba(234, 88, 12, 0.6)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            </div>
          )}

          {/* 마우스 가이드 바로 위에 메시지 표시 */}
          {guideMessage && (
            <div
              key={guideMessage}
              className="absolute animate-fade-in"
              style={{
                left: guideMessage === '전송 버튼을 클릭하세요' ? '0' : guideMessage === '객체 추적 메뉴를 클릭하세요.' || guideMessage === '포착한 대상의 정보를 확인하고 AI로 생성된 전파문 초안을 확인, 전파 패키지를 생성 및 전송합니다.' || guideMessage === '해당 검색 결과가 전파 근거를 위하여 포착 목록에 이동했습니다.' ? '0' : guideMessage === '검색된 결과 확인 후 정형 검색 조건을 추가 입력하여 후보를 좁히거나 늘려보세요.' ? '0' : '0',
                bottom: guideMessage === '검색된 결과 확인 후 정형 검색 조건을 추가 입력하여 후보를 좁히거나 늘려보세요.' ? undefined : '20px',
                top: guideMessage === '검색된 결과 확인 후 정형 검색 조건을 추가 입력하여 후보를 좁히거나 늘려보세요.' ? '20px' : undefined,
                transform: guideMessage === '전송 버튼을 클릭하세요' ? 'translateX(-100%)' : guideMessage === '객체 추적 메뉴를 클릭하세요.' || guideMessage === '포착한 대상의 정보를 확인하고 AI로 생성된 전파문 초안을 확인, 전파 패키지를 생성 및 전송합니다.' || guideMessage === '검색된 결과 확인 후 정형 검색 조건을 추가 입력하여 후보를 좁히거나 늘려보세요.' || guideMessage === '해당 검색 결과가 전파 근거를 위하여 포착 목록에 이동했습니다.' ? 'translateX(0)' : 'translateX(-50%)',
              }}
            >
              <div 
                className="bg-gradient-to-r from-blue-600/95 to-purple-600/95 border-2 border-blue-400 rounded-xl px-4 py-2"
                style={{
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3)',
                }}
              >
                <div className="text-white text-sm font-bold flex items-center gap-2 whitespace-nowrap">
                  <span className="text-xl flex-shrink-0">
                    {guideType === 'mouse' ? '👆' : guideType === 'eye' ? '👀' : '⌨️'}
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: guideMessage }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
