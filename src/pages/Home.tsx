import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import EventList from "@/components/dashboard/HOME/EventList";
import MapView from "@/components/dashboard/HOME/MapView";
import UnityMapView from "@/components/dashboard/HOME/unity/UnityMapView";
import LeftPanel from "@/components/dashboard/HOME/LeftPanel";
import HeatmapPanel from "@/components/dashboard/HeatmapPanel";
import CCTVStatusPanel from "@/components/dashboard/HOME/CCTVStatusPanel";
import AIAgentPopup from "@/components/dashboard/HOME/AIAgentPopup";
import TopControlPanel from "@/components/dashboard/HOME/TopControlPanel";
import { Event, EventSummary as EventSummaryType } from "@/types";
import { allEvents, convertToDashboardEvent } from "@/lib/events-data";
import { sendToUnity } from "@/lib/unity/unityBridge";
import { EventToUnity } from "@/lib/unity/types";
import { useEventSocket } from "@/src/apis/event/hooks";
import { BridgeSlot } from "@/components/dashboard/HOME/unity/ConfigurePopup";

export default function Home() {
    const navigate = useNavigate();
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
    const [mapZoomLevel, setMapZoomLevel] = useState<number>(0);
    const [aiDetectionEventId, setAiDetectionEventId] = useState<string | null>(null);
    const [cctvIndex, setCctvIndex] = useState<number | null>(null);
    const [visibleEventIds, setVisibleEventIds] = useState<Set<string>>(new Set());
    const [hideControls, setHideControls] = useState<boolean>(false);
    const [leftPanelCollapsed, setLeftPanelCollapsed] = useState<boolean>(false);
    const [panelsSlidOut, setPanelsSlidOut] = useState<boolean>(false);
    const [showAIAgentPopup, setShowAIAgentPopup] = useState<boolean>(false);
    const [isAutoMode, setIsAutoMode] = useState<boolean>(true);
    const [key1PressTime, setKey1PressTime] = useState<Date | undefined>(undefined);
    const [isUnityMode, setIsUnityMode] = useState<boolean>(true);
    /** 에이전트 팝업 최대 높이: 플로팅 버튼(Agent Hub)을 넘지 않도록 */
    const [agentPopupMaxHeight, setAgentPopupMaxHeight] = useState<number>(500);
    const [missingEventId, setMissingEventId] = useState<string | null>(null);
    const [openedCCTVCount, setOpenedCCTVCount] = useState<number>(8);

    // 웹소켓 이벤트 관련 상태
    const { status: socketStatus, lastEvent } = useEventSocket({
        autoConnect: true,
        maxEvents: 100,
        autoReconnect: true,
    });

    // 현재 활성화된 이벤트 ID (첫 번째 stat=1 이벤트를 잠금)
    const [activeEventId, setActiveEventId] = useState<number | null>(null);
    const activeEventIdRef = useRef<number | null>(null);
    // 활성 이벤트의 카메라 정보 저장
    const [activeEventCameraInfo, setActiveEventCameraInfo] = useState<{ rtsp_url: string } | null>(null);
    // bridgeSlots 상태 (UnityMapView에서 전달받음)
    const [bridgeSlots, setBridgeSlots] = useState<BridgeSlot[]>([]);

    // activeEventId 동기화 (ref로 최신 값 유지)
    useEffect(() => {
        activeEventIdRef.current = activeEventId;
    }, [activeEventId]);

    // 스트리밍 상태: 활성 이벤트가 있는 경우
    const isEventStreaming = useMemo(() => {
        return activeEventId !== null && activeEventCameraInfo !== null;
    }, [activeEventId, activeEventCameraInfo]);

    // 이벤트 상태 전체 초기화 함수
    const resetEventState = useCallback(() => {
        setActiveEventId(null);
        setActiveEventCameraInfo(null);
    }, []);

    useEffect(() => {
        console.log("[EventSocket] 연결 상태:", socketStatus);
    }, [socketStatus]);

    /** 에이전트 팝업 maxHeight: (dashboard AIAgentPopup 기본 top) ~ 플로팅 버튼 위까지 */
    useEffect(() => {
        const updateMaxHeight = () => {
            const padding = 20;
            const mainPopupHeight = 420 * (9 / 16) + 40 + 12;
            const gap = 10;
            const popupTop = padding + mainPopupHeight + gap + (hideControls ? 56 : 0);
            const reserveBottom = 24 + 56 + 8;
            setAgentPopupMaxHeight(Math.max(200, window.innerHeight - popupTop - reserveBottom));
        };
        updateMaxHeight();
        window.addEventListener("resize", updateMaxHeight);
        return () => window.removeEventListener("resize", updateMaxHeight);
    }, [hideControls]);

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
        return allEvents.map((event, index) => convertToDashboardEvent(event, index)).filter((event) => event.processingStage !== "종결");
    }, []);

    // 가상 이벤트 데이터 (레이아웃 확인용)
    const mockEvents: Event[] = useMemo(() => {
        const now = new Date();
        const formatDate = () => {
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const day = String(now.getDate()).padStart(2, "0");
            return `${year}.${month}.${day}`;
        };
        const formatTime = (hours: number, minutes: number) => {
            return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
        };

        return [
            // 일반 5개
            {
                id: "mock-1",
                type: "112-치안",
                title: "주차장 소음 민원 신고",
                priority: "일반",
                status: "NEW",
                timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 15)),
                location: { name: "부천시 원미구 중동 지하주차장", coordinates: [126.98, 37.42] },
                processingStage: "생성",
                resolution: { category: "112", code: "001", description: "" },
            },
            {
                id: "mock-2",
                type: "약자",
                title: "노인 낙상 부상 신고",
                priority: "일반",
                status: "NEW",
                timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 25)),
                location: { name: "부천시 원미구 중앙공원 산책로", coordinates: [126.99, 37.43] },
                processingStage: "선별",
                resolution: { category: "약자", code: "002", description: "" },
            },
            {
                id: "mock-3",
                type: "112-치안",
                title: "횡단보도 신호 위반",
                priority: "일반",
                status: "MONITORING",
                timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 35)),
                location: { name: "부천시 원미구 중동 사거리", coordinates: [126.97, 37.41] },
                processingStage: "착수",
                resolution: { category: "112", code: "003", description: "" },
            },
            {
                id: "mock-4",
                type: "AI-배회",
                title: "이상 행동 AI 탐지",
                priority: "일반",
                status: "NEW",
                timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 45)),
                location: { name: "부천시 원미구 부천역 앞 광장", coordinates: [126.96, 37.4] },
                processingStage: "생성",
                resolution: { category: "AI", code: "004", description: "" },
            },
            {
                id: "mock-5",
                type: "112-치안",
                title: "차량 사고 교통 정체",
                priority: "일반",
                status: "MONITORING",
                timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 55)),
                location: { name: "부천시 원미구 송내대로", coordinates: [126.95, 37.39] },
                processingStage: "선별",
                resolution: { category: "112", code: "005", description: "" },
            },
            // 주의 3개
            {
                id: "mock-6",
                type: "112-미아",
                title: "미아 발생 긴급 수색",
                priority: "주의",
                status: "MONITORING",
                timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 10)),
                location: { name: "부천시 원미구 중동초등학교 정문 앞", coordinates: [126.98, 37.42] },
                processingStage: "착수",
                resolution: { category: "112", code: "006", description: "" },
            },
            {
                id: "mock-7",
                type: "119-구조",
                title: "차량 충돌 사고 발생",
                priority: "주의",
                status: "NEW",
                timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 20)),
                location: { name: "부천시 원미구 부천시청 앞 교차로", coordinates: [126.99, 37.43] },
                processingStage: "생성",
                resolution: { category: "119", code: "007", description: "" },
            },
            {
                id: "mock-8",
                type: "112-치안",
                title: "말다툼 주먹다짐 발생",
                priority: "주의",
                status: "MONITORING",
                timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 30)),
                location: { name: "부천시 원미구 송내역 인근 상가 앞", coordinates: [126.97, 37.41] },
                processingStage: "착수",
                resolution: { category: "112", code: "008", description: "" },
            },
            // 경계 2개
            {
                id: "mock-9",
                type: "119-화재",
                title: "쓰레기 수거함 화재 발생",
                priority: "경계",
                status: "MONITORING",
                timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 5)),
                location: { name: "부천시 원미구 중동 아파트 단지 내 쓰레기 수거함", coordinates: [126.96, 37.4] },
                processingStage: "착수",
                resolution: { category: "119", code: "009", description: "" },
            },
            {
                id: "mock-10",
                type: "112-치안",
                title: "절도 시도 의심 행동",
                priority: "경계",
                status: "NEW",
                timestamp: formatTime(now.getHours(), Math.max(0, now.getMinutes() - 12)),
                location: { name: "부천시 원미구 중동 상가 앞", coordinates: [126.95, 37.39] },
                processingStage: "선별",
                resolution: { category: "112", code: "010", description: "" },
            },
        ];
    }, []);

    // 표시할 이벤트만 필터링 (숫자 키를 눌렀을 때만 표시, 단 1번 이벤트는 항상 표시)
    const events: Event[] = useMemo(() => {
        const event1 = allConvertedEvents.find((event) => event.eventId === "A-20260107-004" || event.id === "A-20260107-004");

        if (visibleEventIds.size === 0) {
            return event1 ? [event1] : [];
        }

        const filteredEvents = allConvertedEvents.filter((event) => visibleEventIds.has(event.id));
        if (event1 && !filteredEvents.find((e) => e.id === event1.id)) {
            filteredEvents.push(event1);
        }
        return filteredEvents;
    }, [allConvertedEvents, visibleEventIds]);

    // 이벤트 리스트용 이벤트 (가상 이벤트 포함)
    const eventsForList: Event[] = useMemo(() => {
        // 가상 이벤트는 항상 표시
        const visibleRealEvents = visibleEventIds.size > 0 ? allConvertedEvents.filter((event) => visibleEventIds.has(event.id)) : [];

        return [...mockEvents, ...visibleRealEvents];
    }, [allConvertedEvents, visibleEventIds, mockEvents]);

    // 이벤트 요약 계산 (처리결과 기준) - 모든 이벤트 포함 (종결 포함)
    const eventSummary: EventSummaryType = useMemo(() => {
        const allEventsForSummary = allEvents.map((event, index) => convertToDashboardEvent(event, index));

        // 대기: 생성, 선별
        const pendingStages: Array<"생성" | "선별"> = ["생성", "선별"];
        const pending = allEventsForSummary.filter((event) => pendingStages.includes(event.processingStage as any)).length;

        // 진행중: 착수, 사실 검증, 추적 · 지원, 전파
        const inProgressStages: Array<"착수" | "사실 검증" | "추적 · 지원" | "전파"> = ["착수", "사실 검증", "추적 · 지원", "전파"];
        const inProgress = allEventsForSummary.filter((event) => inProgressStages.includes(event.processingStage as any)).length;

        const closed = allEventsForSummary.filter((event) => event.processingStage === "종결").length;

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
    // 순서: 1. 이벤트 표시 및 하이라이트 (즉시) → 2. 줌인 시작 (300ms 후) → 3. 팝업 표시 (줌인 완료 후 800ms)
    const animateToEvent = useCallback((event: Event, callback?: () => void) => {
        const eventId = event.id;
        // 1단계: 이벤트 표시 및 하이라이트 (즉시)
        setVisibleEventIds((prev) => new Set([...prev, eventId]));
        setHighlightedEventId(eventId);

        // 2단계: 줌인 시작 (300ms 후)
        setTimeout(() => {
            setMapZoomLevel(2);

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
    const clearSelection = useCallback(() => {
        setSelectedEventId(null);
        setHighlightedEventId(null);
        setAiDetectionEventId(null);
        setCctvIndex(null);
        setMapZoomLevel(isUnityMode ? 1 : 0);
        setHideControls(false);
        setPanelsSlidOut(false);
        setShowAIAgentPopup(false);
        setKey1PressTime(undefined);
        // 웹소켓 이벤트 상태도 초기화
        resetEventState();
        const eventToUnity: EventToUnity = {
            methodName: "endEvent",
            payload: {
                value: {
                    id: missingEventId,
                    eventId: missingEventId,
                },
            },
        };
        console.log(eventToUnity);
        sendToUnity(JSON.stringify(eventToUnity));
    }, [isUnityMode, missingEventId, resetEventState]);

    // 이벤트 트리거 함수 (키보드 1 또는 웹소켓 이벤트에서 호출)
    const triggerEventMode = useCallback(
        (overrideEventId?: string, mainCctvId?: string, cctvIdList?: string[], eventMessage?: string) => {
            const missingEvent = allConvertedEvents.find((event) => event.eventId === "A-20260107-004" || event.id === "A-20260107-004");
            // 웹소켓 이벤트용 더미 이벤트 생성 (missingEvent가 없을 때)
            const targetEvent = missingEvent || (overrideEventId ? { id: `ws-event-${overrideEventId}`, eventId: `EVT-${overrideEventId}` } : null);

            if (targetEvent) {
                setKey1PressTime(new Date());
                setCctvIndex(1);
                setVisibleEventIds((prev) => new Set([...prev, targetEvent.id]));
                setHighlightedEventId(targetEvent.id);

                setTimeout(() => {
                    setMapZoomLevel(isUnityMode ? 2 : 1);

                    setTimeout(() => {
                        setSelectedEventId(targetEvent.id);

                        setTimeout(() => {
                            setHideControls(true);
                            setPanelsSlidOut(true);
                            setShowAIAgentPopup(true);
                            setAiDetectionEventId(targetEvent.id);
                        }, 3000);
                    }, 500);
                }, 300);

                const eventToUnity: EventToUnity = {
                    methodName: "event",
                    payload: {
                        value: {
                            id: targetEvent.id,
                            eventId: targetEvent.eventId,
                            mainCctvId: mainCctvId || "Bullet-2",
                            cctvIdList: cctvIdList || ["PTZ-1", "PTZ-2", "PTZ-3"],
                            eventMessage: eventMessage || "이벤트가 감지되었습니다.",
                        },
                    },
                };
                console.log(eventToUnity);
                sendToUnity(JSON.stringify(eventToUnity));
            }
        },
        [allConvertedEvents, isUnityMode]
    );

    // 웹소켓 이벤트 처리: stat=1 첫 이벤트 잠금, stat=4로 해제
    useEffect(() => {
        if (!lastEvent?.evt || !lastEvent.camera_info) {
            return;
        }

        const stat = Number(lastEvent.evt.stat);
        const eventId = lastEvent.evt.id;

        if (stat === 1) {
            // 현재 활성 이벤트가 없을 때만 새 이벤트를 받음
            if (activeEventIdRef.current === null) {
                setActiveEventId(eventId);
                setActiveEventCameraInfo({ rtsp_url: lastEvent.camera_info.rtsp_url });

                // bridgeSlots에서 메인 카메라 ID와 그룹핑된 카메라 ID 리스트 가져오기
                const mainCctvBridgeId = bridgeSlots.find((slot) => slot.isMain)?.bridgeId || "";
                const groupedCctvBridgeIds = bridgeSlots.filter((slot) => slot.isGrouped).map((slot) => slot.bridgeId);

                console.log("[Home] 웹소켓 이벤트 수신:", { eventId, mainCctvBridgeId, groupedCctvBridgeIds });

                // 이벤트 트리거 (딜레이 적용)
                triggerEventMode(String(eventId), mainCctvBridgeId, groupedCctvBridgeIds, `${mainCctvBridgeId}에서 이벤트가 감지되었습니다.`);
            }
        } else if (stat === 4) {
            // 활성 이벤트와 동일한 ID의 종료 이벤트인 경우에만 해제
        }
    }, [lastEvent, bridgeSlots, triggerEventMode, resetEventState]);

    // 키보드 단축키 핸들러
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Escape와 0 키는 입력 필드에서도 동작하도록 허용
            const isEscapeOrZero = e.key === "Escape" || e.key === "0";
            if (!isEscapeOrZero && (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
                return;
            }

            if (e.key === "1") {
                triggerEventMode();
            } else if (e.key === "u" || e.key === "U") {
                console.log("unity mode toggle !");
                // 모드 전환 시 완전 초기화
                setSelectedEventId(null);
                setHighlightedEventId(null);
                setAiDetectionEventId(null);
                setCctvIndex(null);
                setHideControls(false);
                setPanelsSlidOut(false);
                setShowAIAgentPopup(false);
                setKey1PressTime(undefined);
                setVisibleEventIds(new Set());
                // 모드 전환 및 줌 레벨 초기화
                setIsUnityMode((prev) => {
                    const newMode = !prev;
                    setMapZoomLevel(newMode ? 1 : 0);
                    return newMode;
                });
            } else if (e.key === "Escape" || e.key === "0") {
                clearSelection();
                setHideControls(false);
            } else if (e.key === "4") {
                const eventToUnity: EventToUnity = {
                    methodName: "showRoad",
                    payload: {
                        value: {},
                    },
                };
                console.log(eventToUnity);
                sendToUnity(JSON.stringify(eventToUnity));
            } else if (e.key === "5") {
                const eventToUnity: EventToUnity = {
                    methodName: "hideRoad",
                    payload: {
                        value: {},
                    },
                };
                console.log(eventToUnity);
                sendToUnity(JSON.stringify(eventToUnity));
            }
        };

        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [allConvertedEvents, animateToEvent, missingEventId, isUnityMode]);

    return (
        <div className="relative bg-[#0a0e14] overflow-hidden" style={{ width: "100vw", height: "100vh" }}>
            {/* 상단 제어 패널 - hideControls가 true일 때 표시 */}
            <TopControlPanel isVisible={hideControls} onStop={clearSelection} cctvCount={openedCCTVCount} />

            {/* 맵 - 전체 화면 */}
            <div className="absolute inset-0" style={{ width: "100%", height: "100%" }}>
                {isUnityMode ? (
                    <UnityMapView
                        events={events}
                        selectedEventId={selectedEventId}
                        aiDetectionEventId={aiDetectionEventId}
                        cctvIndex={cctvIndex}
                        onAiDetectionClose={clearSelection}
                        onMapClick={() => {}}
                        externalZoomLevel={mapZoomLevel}
                        onZoomLevelChange={setMapZoomLevel}
                        hideControls={hideControls}
                        leftPanelWidth={leftPanelCollapsed ? 80 : 416}
                        isAutoMode={isAutoMode}
                        isEventStreaming={isEventStreaming}
                        activeEventCameraInfo={activeEventCameraInfo}
                        onBridgeSlotsChange={setBridgeSlots}
                    />
                ) : (
                    <MapView
                        events={events}
                        highlightedEventId={highlightedEventId}
                        selectedEventId={selectedEventId}
                        aiDetectionEventId={aiDetectionEventId}
                        cctvIndex={cctvIndex}
                        onEventClick={handleEventAction}
                        onAiDetectionClose={clearSelection}
                        onMapClick={() => {}}
                        externalZoomLevel={mapZoomLevel}
                        onZoomLevelChange={setMapZoomLevel}
                        hideControls={hideControls}
                        leftPanelWidth={leftPanelCollapsed ? 80 : 416}
                        isAutoMode={isAutoMode}
                    />
                )}
            </div>

            {/* 좌측: LeftPanel (운영 패널) - 플로팅. 1키: 좌측으로 이동·페이드아웃 */}
            <div className={`absolute left-0 top-0 bottom-0 transition-all duration-300 ease-out ${panelsSlidOut ? "-translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100"}`} style={{ zIndex: 100 }}>
                <LeftPanel onCollapsedChange={setLeftPanelCollapsed} />
            </div>

            {/* 우측: 이벤트 리스트 패널 - 플로팅. 1키: 우측으로 이동·페이드아웃 */}
            <div className={`absolute right-0 top-0 bottom-0 flex flex-col pl-4 pr-5 gap-4 transition-all duration-300 ease-out ${panelsSlidOut ? "translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100"}`} style={{ width: "370px", zIndex: 100, paddingTop: "16px", paddingBottom: "16px" }}>
                <CCTVStatusPanel />
                <HeatmapPanel areaLabelPrefix="Hall" minVisibleCount={3} className="flex-shrink-0" />
                <div className="rounded-lg p-4 flex-1 overflow-hidden gradient-border-right-bottom" style={{ minHeight: 0, background: "linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
                    <EventList events={eventsForList} selectedEventId={selectedEventId || undefined} onEventSelect={handleEventAction} onEventHover={handleEventHover} key1PressTime={key1PressTime} />
                </div>
            </div>

            {showAIAgentPopup && <AIAgentPopup isOpen={showAIAgentPopup} onClose={() => setShowAIAgentPopup(false)} hideControls={hideControls} eventTime={key1PressTime as Date} />}
        </div>
    );
}
