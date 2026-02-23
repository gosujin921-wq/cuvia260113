import { Event } from "@/types";
import { Icon } from "@iconify/react";
import { useMemo, useState, useRef, useEffect } from "react";
import CCTVIcon from "@/components/common/CCTVIcon";
import "maplibre-gl/dist/maplibre-gl.css";
import { getCCTVPanelLayout } from "@/lib/dashboard-cctv-layout";
import BottomPanel from "../../BottomPanel";
import { sendToUnity, subscribeUnityToReact } from "@/lib/unity/unityBridge";
import { EventToUnity } from "@/lib/unity/types";
import UnityCanvas from "../../UnityCanvas";
import CameraListPopup, { RealCCTV, BridgeSlot, CCTVInfo } from "./ConfigurePopup";
import UnityCCTVMeshTracking from "./UnityCCTVMeshTracking";

interface UnityMapViewProps {
    events: Event[];
    selectedEventId?: string | null;
    aiDetectionEventId?: string | null;
    cctvIndex?: number | null;
    onMapClick?: () => void;
    externalZoomLevel?: number;
    onZoomLevelChange?: (level: number) => void;
    onAiDetectionClose?: () => void;
    hideControls?: boolean;
    leftPanelWidth?: number;
    isAutoMode?: boolean;
}

// 사용 가능한 실제 CCTV 목록
const initialAvailableCCTVs: RealCCTV[] = [
    { cctvId: "카메라01", cctvName: "1번 카메라", rtspURL: "/public/cctv_img/cctv1.mov" },
    { cctvId: "카메라02", cctvName: "2번 카메라", rtspURL: "/public/cctv_img/cctv2.mov" },
    { cctvId: "카메라03", cctvName: "3번 카메라", rtspURL: "/public/cctv_img/cctv3.mov" },
    { cctvId: "카메라04", cctvName: "4번 카메라", rtspURL: "/public/cctv_img/cctv4.mov" },
    { cctvId: "카메라05", cctvName: "5번 카메라", rtspURL: "/public/cctv_img/cctv1.mov" },
    { cctvId: "카메라06", cctvName: "6번 카메라", rtspURL: "/public/cctv_img/cctv2.mov" },
    { cctvId: "카메라07", cctvName: "7번 카메라", rtspURL: "/public/cctv_img/cctv3.mov" },
    { cctvId: "카메라08", cctvName: "8번 카메라", rtspURL: "/public/cctv_img/cctv4.mov" },
    { cctvId: "카메라09", cctvName: "9번 카메라", rtspURL: "/public/cctv_img/cctv1.mov" },
    { cctvId: "카메라10", cctvName: "10번 카메라", rtspURL: "/public/cctv_img/cctv2.mov" },
    { cctvId: "카메라11", cctvName: "11번 카메라", rtspURL: "/public/cctv_img/cctv3.mov" },
];

// Unity Bridge 슬롯 초기값 (CCTV-V-1 ~ CCTV-V-11)
const initialBridgeSlots: BridgeSlot[] = [
    { bridgeId: "PTZ-1", assignedCctvId: "카메라01", isGrouped: true, isMain: false },
    { bridgeId: "PTZ-2", assignedCctvId: "카메라02", isGrouped: true, isMain: false },
    { bridgeId: "PTZ-3", assignedCctvId: "카메라03", isGrouped: true, isMain: false },
    { bridgeId: "PTZ-4", assignedCctvId: "카메라04", isGrouped: false, isMain: false },
    { bridgeId: "PTZ-5", assignedCctvId: "카메라05", isGrouped: false, isMain: false },
    { bridgeId: "Bullet-1", assignedCctvId: "카메라06", isGrouped: false, isMain: false },
    { bridgeId: "Bullet-2", assignedCctvId: "카메라07", isGrouped: false, isMain: true },
    { bridgeId: "Bullet-3", assignedCctvId: "카메라08", isGrouped: false, isMain: false },
    { bridgeId: "Bullet-4", assignedCctvId: "카메라09", isGrouped: false, isMain: false },
    { bridgeId: "Bullet-5", assignedCctvId: "카메라10", isGrouped: false, isMain: false },
    { bridgeId: "Bullet-6", assignedCctvId: "카메라11", isGrouped: false, isMain: false },
    { bridgeId: "Bullet-7", assignedCctvId: "카메라12", isGrouped: false, isMain: false },
    { bridgeId: "Bullet-8", assignedCctvId: "카메라13", isGrouped: false, isMain: false },
];

const UnityMapView = ({ events, selectedEventId, aiDetectionEventId, cctvIndex, onMapClick, onAiDetectionClose, hideControls = false, leftPanelWidth = 480 }: UnityMapViewProps) => {
    const [zoomLevel, setZoomLevel] = useState(1);
    const [showCCTV, setShowCCTV] = useState(true);
    const [showCCTVViewAngle, setShowCCTVViewAngle] = useState(true);
    const [showCCTVName, setShowCCTVName] = useState(true);
    const [verticalLevel, setVerticalLevel] = useState(1);
    const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1920);
    const [hoveredCCTVId, setHoveredCCTVId] = useState<string | null>(null);

    // CCTV 관련 상태
    const [availableCCTVs] = useState<RealCCTV[]>(initialAvailableCCTVs);
    const [bridgeSlots, setBridgeSlots] = useState<BridgeSlot[]>(initialBridgeSlots);

    // Bridge 슬롯과 실제 CCTV 정보를 결합한 목록 (렌더링용)
    const cctvList: CCTVInfo[] = useMemo(() => {
        return bridgeSlots.map((slot) => {
            const realCctv = availableCCTVs.find((cctv) => cctv.cctvId === slot.assignedCctvId);
            return {
                bridgeId: slot.bridgeId,
                cctvId: realCctv?.cctvId || "",
                cctvName: realCctv?.cctvName || "",
                rtspURL: realCctv?.rtspURL || "",
                isGrouped: slot.isGrouped,
                isMain: slot.isMain,
            };
        });
    }, [bridgeSlots, availableCCTVs]);

    const [openedCCTVPopups, setOpenedCCTVPopups] = useState<Set<string>>(new Set());
    const [toggleCctvSetting, setToggleCctvSetting] = useState(false);
    const cctvScrollContainerRef = useRef<HTMLDivElement | null>(null);
    const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isUserScrollingRef = useRef(false);
    const userScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevHideControlsRef = useRef(hideControls);

    // 투망감시 모드 시작 시 모든 블루 CCTV 팝업 및 CCTV-V-11 팝업 열기
    useEffect(() => {
        const isEvent1Selected = selectedEventId && events.find((e) => e.id === selectedEventId && (e.eventId === "A-20260107-004" || e.id === "A-20260107-004"));
        if (isEvent1Selected) {
            // 블루 CCTV 인덱스: [0, 8, 1, 7, 6, 9, 5, 4] -> CCTV 인덱스: [1, 9, 2, 8, 7, 10, 6, 5]
            // CCTV-V-11도 포함
            const blueCCTVIndices = cctvList.filter((cctv) => cctv.isGrouped).map((cctv) => cctv.bridgeId);
            console.log(new Set(blueCCTVIndices));
            setOpenedCCTVPopups(new Set(blueCCTVIndices));
        } else if (!isEvent1Selected) {
            setOpenedCCTVPopups(new Set());
        }
    }, [selectedEventId, events, cctvList]);

    // 투망감시 중지 시 UI 초기화 (줌/수직 레벨 리셋)
    useEffect(() => {
        if (prevHideControlsRef.current === true && hideControls === false) {
            setZoomLevel(1);
            setVerticalLevel(1);
        }
        prevHideControlsRef.current = hideControls;
    }, [hideControls]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const containerRef = useRef<HTMLDivElement>(null);

    const seededRandom = (seed: string) => {
        let hash = 0;
        for (let i = 0; i < seed.length; i += 1) {
            const char = seed.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // 32bit 정수로 변환
        }
        return Math.abs(hash) / 2147483647; // 0~1 사이 값으로 정규화
    };

    const clampPercentage = (value: number) => Math.max(5, Math.min(95, value));
    const centerX = 50;
    const centerY = 50;
    const baseRadius = 12;
    const ringGap = 10;
    const maxPinsPerRing = 6;

    const [cachedPositions, setCachedPositions] = useState<Record<string, { left: number; top: number }>>({});

    useEffect(() => {
        if (!events || events.length === 0) {
            return;
        }

        const newEvents = events.filter((event) => !cachedPositions[event.id]);

        if (newEvents.length === 0) {
            return;
        }

        const existingEventIds = Object.keys(cachedPositions);
        const existingEvents = events.filter((e) => existingEventIds.includes(e.id));
        const allEvents = [...existingEvents, ...newEvents];

        const eventsByPriority: Record<string, Event[]> = {
            긴급: [],
            경계: [],
            주의: [],
        };

        allEvents.forEach((event) => {
            if (eventsByPriority[event.priority]) {
                eventsByPriority[event.priority].push(event);
            }
        });

        Object.keys(eventsByPriority).forEach((priority) => {
            const existingPriorityEvents = eventsByPriority[priority].filter((e) => cachedPositions[e.id]);
            const newPriorityEvents = eventsByPriority[priority].filter((e) => !cachedPositions[e.id]);

            newPriorityEvents.sort(() => {
                return seededRandom(`${priority}-shuffle`) - 0.5;
            });

            eventsByPriority[priority] = [...existingPriorityEvents, ...newPriorityEvents];
        });

        const interleavedEvents: Event[] = [];
        const maxLength = Math.max(eventsByPriority.긴급.length, eventsByPriority.경계.length, eventsByPriority.주의.length);

        for (let i = 0; i < maxLength; i++) {
            if (eventsByPriority.긴급[i]) interleavedEvents.push(eventsByPriority.긴급[i]);
            if (eventsByPriority.경계[i]) interleavedEvents.push(eventsByPriority.경계[i]);
            if (eventsByPriority.주의[i]) interleavedEvents.push(eventsByPriority.주의[i]);
        }

        const rings: Event[][] = [];
        interleavedEvents.forEach((event, index) => {
            const ringIndex = Math.floor(index / maxPinsPerRing);
            if (!rings[ringIndex]) {
                rings[ringIndex] = [];
            }
            rings[ringIndex].push(event);
        });

        const newPositions: Record<string, { left: number; top: number }> = {};

        rings.forEach((ringEvents, ringIndex) => {
            if (!ringEvents || ringEvents.length === 0) {
                return;
            }

            const existingRingEvents = ringEvents.filter((e) => cachedPositions[e.id]);
            const newRingEvents = ringEvents.filter((e) => !cachedPositions[e.id]);

            if (newRingEvents.length === 0) {
                return;
            }

            const radius = baseRadius + ringIndex * ringGap;
            const angleStep = (Math.PI * 2) / ringEvents.length;

            let ringAngleOffset: number;
            if (existingRingEvents.length > 0) {
                const firstExistingEvent = existingRingEvents[0];
                const firstPos = cachedPositions[firstExistingEvent.id];
                const firstIndex = ringEvents.findIndex((e) => e.id === firstExistingEvent.id);
                const dx = firstPos.left - centerX;
                const dy = firstPos.top - centerY;
                const firstAngle = Math.atan2(dy, dx);
                const firstAngleJitter = (seededRandom(`${firstExistingEvent.id}-angle`) - 0.5) * angleStep * 0.4;
                ringAngleOffset = firstAngle - firstIndex * angleStep - firstAngleJitter;
            } else {
                ringAngleOffset = seededRandom(`ring-${ringIndex}`) * angleStep;
            }

            newRingEvents.forEach((event) => {
                const eventIndex = ringEvents.findIndex((e) => e.id === event.id);
                const angleJitter = (seededRandom(`${event.id}-angle`) - 0.5) * angleStep * 0.4;
                const angle = ringAngleOffset + eventIndex * angleStep + angleJitter;
                const left = centerX + radius * Math.cos(angle);
                const top = centerY + radius * Math.sin(angle);

                newPositions[event.id] = {
                    left: clampPercentage(left),
                    top: clampPercentage(top),
                };
            });
        });

        const newEventIds = newEvents.map((e) => e.id);
        if (newEventIds.includes("event-3") && newEventIds.includes("event-7") && newPositions["event-3"] && newPositions["event-7"]) {
            const tempPosition = newPositions["event-3"];
            newPositions["event-3"] = newPositions["event-7"];
            newPositions["event-7"] = tempPosition;
        }

        setCachedPositions((prev) => ({ ...prev, ...newPositions }));
    }, [events.map((e) => e.id).join(",")]);

    // 줌/수직 레벨 초기화. 투망감시 중지 시 hideControls true→false 변경으로 위 useEffect에서 자동 호출됨.
    const initUi = () => {
        setZoomLevel(1);
        setVerticalLevel(1);
    };

    const handleZoomLevelChange = (level: number) => {
        setZoomLevel(level);
        const eventToUnity: EventToUnity = {
            methodName: "zoomLevel",
            payload: {
                value: level,
            },
        };
        sendToUnity(JSON.stringify(eventToUnity));
        console.log("eventToUnity", eventToUnity);
    };

    const handleMapBearingChange = (bearing: number) => {
        const eventToUnity: EventToUnity = {
            methodName: "mapBearing",
            payload: {
                value: bearing,
            },
        };
        sendToUnity(JSON.stringify(eventToUnity));
        console.log("eventToUnity", eventToUnity);
    };

    const handleVerticalLevelChange = (level: number) => {
        // TODO: 레벨에 따른 동작 구현
        console.log("pitchLevel changed:", level);
        const eventToUnity: EventToUnity = {
            methodName: "pitchLevel",
            payload: {
                value: level,
            },
        };
        sendToUnity(JSON.stringify(eventToUnity));
        console.log("eventToUnity", eventToUnity);
    };

    const handleShowCctvName = (show: boolean) => {
        setShowCCTVName(show);
        const eventToUnity: EventToUnity = {
            methodName: "showCctvName",
            payload: {
                value: show ? 1 : 0,
            },
        };
        sendToUnity(JSON.stringify(eventToUnity));
        console.log("eventToUnity", eventToUnity);
    };

    const handleShowCctv = (show: boolean) => {
        setShowCCTV(show);
        const eventToUnity: EventToUnity = {
            methodName: "showCctv",
            payload: {
                value: show ? 1 : 0,
            },
        };
        sendToUnity(JSON.stringify(eventToUnity));
        console.log("eventToUnity", eventToUnity);
    };

    const handleShowCctvViewAngle = (show: boolean) => {
        setShowCCTVViewAngle(show);
        const eventToUnity: EventToUnity = {
            methodName: "showCctvViewAngle",
            payload: {
                value: show ? 1 : 0,
            },
        };
        sendToUnity(JSON.stringify(eventToUnity));
        console.log("eventToUnity", eventToUnity);
    };

    const handleCCTVToggle = () => {
        const newValue = !showCCTV;
        handleShowCctv(newValue);
        if (newValue) {
            handleShowCctvViewAngle(true);
            handleShowCctvName(true);
        } else {
            handleShowCctvViewAngle(false);
            handleShowCctvName(false);
        }
    };

    const handleHoverCctv = (cctvId: string | null) => {
        if (!cctvId) {
            if (hoveredCCTVId) {
                const eventToUnity: EventToUnity = {
                    methodName: "exitHover",
                    payload: {
                        value: hoveredCCTVId,
                    },
                };
                sendToUnity(JSON.stringify(eventToUnity));
                console.log("eventToUnity", eventToUnity);
            }
            setHoveredCCTVId(null);
            return;
        }

        // hover 시작 시
        setHoveredCCTVId(cctvId);

        const eventToUnity: EventToUnity = {
            methodName: "enterHover",
            payload: {
                value: cctvId,
            },
        };
        sendToUnity(JSON.stringify(eventToUnity));
        console.log("eventToUnity", eventToUnity);
    };

    useEffect(() => {
        // ✅ Unity → React 이벤트 수신 설정
        const unsubscribe = subscribeUnityToReact((eventName, eventData) => {
            if (eventName === "hoverCCTV") {
                try {
                    const data = JSON.parse(eventData);
                    console.log("[MapView] Unity에서 hover 이벤트 수신:", data);
                    setHoveredCCTVId(data.cctvId);
                } catch (e) {
                    console.error("[MapView] JSON 파싱 에러:", e);
                }
            } else if (eventName === "leaveCCTV") {
                try {
                    const data = JSON.parse(eventData);
                    console.log("[MapView] Unity에서 leave 이벤트 수신:", data);
                    setHoveredCCTVId(null);
                } catch (e) {
                    console.error("[MapView] JSON 파싱 에러:", e);
                }
            }
        });

        // cleanup: 컴포넌트 언마운트 시 구독 해제
        return () => {
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // 입력 필드에서는 동작하지 않도록 처리
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (e.key === "c" || e.key === "C") {
                setToggleCctvSetting((prev) => !prev);
                return;
            }
        };

        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative bg-[#0f0f0f] overflow-hidden"
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
            }}
            onClick={(e) => {
                const target = e.target as HTMLElement;
                const isPin = target.closest("[data-event-pin]");
                const isTooltip = target.closest("[data-tooltip]");
                const isButton = target.closest("button") || target.tagName === "BUTTON";
                const isClickable = target.closest("[data-no-drag]") || target.closest("[data-drag-handle]");

                if (!isPin && !isTooltip && !isButton && !isClickable) {
                    onMapClick?.();
                }
            }}
            onMouseDown={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest("[data-tooltip]") || target.closest("[data-event-pin]")) {
                    e.stopPropagation();
                }
            }}>
            <div
                className="absolute top-4 flex flex-col gap-2 transition-all duration-500 ease-in-out"
                style={{
                    left: `${leftPanelWidth + 24}px`,
                    zIndex: 250,
                    transform: hideControls ? "translateX(-200px)" : "translateX(0)",
                    opacity: hideControls ? 0 : 1,
                }}
                onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleZoomLevelChange(Math.min(zoomLevel + 1, 5));
                    }}
                    disabled={zoomLevel >= 5}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    aria-label="확대">
                    <Icon icon="mdi:plus" className="w-5 h-5" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleZoomLevelChange(Math.max(zoomLevel - 1, 1));
                    }}
                    disabled={zoomLevel <= 1}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    aria-label="축소">
                    <Icon icon="mdi:minus" className="w-5 h-5" />
                </button>
                <div className="w-full h-px bg-gray-300 my-1" />
                {/* 상하좌우 회전 컨트롤 */}
                <div className="grid grid-cols-2 gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (verticalLevel > 0) {
                                const newLevel = verticalLevel - 1;
                                setVerticalLevel(newLevel);
                                handleVerticalLevelChange(newLevel);
                            }
                        }}
                        disabled={verticalLevel <= 0}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        aria-label="회전 상"
                        tabIndex={0}>
                        <Icon icon="mdi:chevron-up" className="w-5 h-5" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (verticalLevel < 2) {
                                const newLevel = verticalLevel + 1;
                                setVerticalLevel(newLevel);
                                handleVerticalLevelChange(newLevel);
                            }
                        }}
                        disabled={verticalLevel >= 2}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        aria-label="회전 하"
                        tabIndex={0}>
                        <Icon icon="mdi:chevron-down" className="w-5 h-5" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleMapBearingChange(-30);
                        }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"
                        aria-label="회전 왼쪽"
                        tabIndex={0}>
                        <Icon icon="mdi:chevron-left" className="w-5 h-5" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleMapBearingChange(30);
                        }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"
                        aria-label="회전 오른쪽"
                        tabIndex={0}>
                        <Icon icon="mdi:chevron-right" className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div
                className="absolute top-1/2 flex flex-col gap-2 transition-all duration-500 ease-in-out"
                style={{
                    left: `${leftPanelWidth + 24}px`,
                    zIndex: 250,
                    transform: hideControls ? "translateX(-200px) translateY(-50%)" : "translateX(0) translateY(-50%)",
                    opacity: hideControls ? 0 : 1,
                }}
                onClick={(e) => e.stopPropagation()}>
                {showCCTV && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleShowCctvName(!showCCTVName);
                        }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${showCCTVName ? "bg-orange-600 hover:bg-orange-700 text-white shadow-[0_0_15px_rgba(251,146,60,0.5)]" : "bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]"}`}
                        style={{ borderWidth: "1px", borderColor: "rgba(59, 130, 246, 0.3)" }}
                        aria-label="CCTV 명 켜기">
                        <Icon icon="mdi:label" className="w-5 h-5" />
                    </button>
                )}

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleCCTVToggle();
                    }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        showCCTV
                            ? "bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.6),0_0_40px_rgba(59,130,246,0.3)] ring-2 ring-[rgba(59,130,246,0.3)]"
                            : "bg-gradient-to-br from-[#2a2a2a] via-[#1a1a1a] to-[#0f0f0f] hover:from-[#3a3a3a] hover:via-[#2a2a2a] hover:to-[#1a1a1a] text-gray-300 border-2 hover:shadow-[0_0_20px_rgba(59,130,246,0.5),0_0_40px_rgba(59,130,246,0.2)]"
                    }`}
                    style={{
                        borderWidth: showCCTV ? "0px" : "2px",
                        borderColor: "rgba(59, 130, 246, 0.3)",
                    }}
                    aria-label="CCTV">
                    <CCTVIcon className={`w-5 h-5 text-white ${showCCTV ? "drop-shadow-lg" : ""}`} />
                </button>

                {showCCTV && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleShowCctvViewAngle(!showCCTVViewAngle);
                        }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${showCCTVViewAngle ? "bg-green-600 hover:bg-green-700 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]" : "bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]"}`}
                        style={{ borderWidth: "1px", borderColor: "rgba(59, 130, 246, 0.3)" }}
                        aria-label="시야각 켜기">
                        <Icon icon="mdi:angle-acute" className="w-5 h-5" />
                    </button>
                )}
            </div>

            <UnityCanvas />

            {aiDetectionEventId &&
                cctvIndex !== null &&
                cctvIndex !== undefined &&
                (() => {
                    const gridPopupWidth = 320;
                    const padding = 20;
                    const mainCctv = cctvList.find((cctv) => cctv.isMain) as CCTVInfo;
                    return (
                        <>
                            <UnityCCTVMeshTracking
                                event={events.find((e) => e.id === aiDetectionEventId) || null}
                                onClose={() => onAiDetectionClose?.()}
                                cctvId={mainCctv.bridgeId}
                                cctvRtspURL={mainCctv.rtspURL}
                                position={{
                                    top: `${padding}px`,
                                    right: `${padding}px`,
                                    left: undefined,
                                    bottom: undefined,
                                }}
                                hideControls={hideControls}
                                cctvName={mainCctv.cctvName}
                                highlighted={hoveredCCTVId === mainCctv.bridgeId}
                                isMain={true}
                                onHover={handleHoverCctv}
                            />

                            <div
                                style={{
                                    position: "absolute",
                                    left: `${padding}px`,
                                    top: `${padding + (hideControls ? 56 : 0)}px`,
                                    display: "grid",
                                    gridTemplateColumns: `repeat(2, ${gridPopupWidth}px)`,
                                    gridAutoRows: "auto",
                                    gap: `${padding}px`,
                                    pointerEvents: "none",
                                    zIndex: 1000,
                                }}>
                                {cctvList.map((cctv, idx) => {
                                    if (!openedCCTVPopups.has(cctv.bridgeId) || cctv.isMain) {
                                        return null;
                                    }

                                    return (
                                        <div
                                            key={`${cctv.bridgeId}-${idx}`}
                                            style={{
                                                width: `${gridPopupWidth}px`,
                                                height: "fit-content",
                                                pointerEvents: "auto",
                                            }}>
                                            <UnityCCTVMeshTracking event={events.find((e) => e.id === aiDetectionEventId) || null} onClose={() => {}} isMain={false} cctvId={cctv.bridgeId} cctvName={cctv.cctvName} cctvRtspURL={cctv.rtspURL} position={undefined} width={gridPopupWidth} hideControls={hideControls} highlighted={hoveredCCTVId === cctv.bridgeId} onHover={handleHoverCctv} />
                                        </div>
                                    );
                                })}


                            </div>
                        </>
                    );
                })()}
    
            {/* 순찰 로봇 화면의 우측 하단에 고정 */}
            <UnityCCTVMeshTracking event={events.find((e) => e.id === aiDetectionEventId) || null} onClose={() => {}} isMain={false} cctvId={'patrol-robot'} cctvName={'순찰 로봇'} cctvRtspURL={'순찰로봇 rtsp'} position={{
                top: undefined,
                right: undefined,
                left: `${20}px`,
                bottom: `${20}px`,
            }} width={420} hideControls={hideControls} highlighted={false} onHover={handleHoverCctv} />

            <BottomPanel showCCTV={showCCTV} hideControls={hideControls} leftPanelWidth={leftPanelWidth} windowWidth={windowWidth} cctvScrollContainerRef={cctvScrollContainerRef} isUserScrollingRef={isUserScrollingRef} userScrollTimeoutRef={userScrollTimeoutRef} autoScrollIntervalRef={autoScrollIntervalRef} />

            {/* CUVIA Link 버튼 - 초기: CCTV 패널 위 30px / 그 외: 우측 하단 */}
            {(() => {
                const rightPanelWidth = 370;
                const panelGap = 16;
                const { buttonBottom } = getCCTVPanelLayout();
                const cctvPanelRight = rightPanelWidth + panelGap;
                const isInitial = !hideControls;
                return (
                    <div
                        className="absolute group"
                        style={{
                            bottom: isInitial ? `${buttonBottom}px` : "24px",
                            right: isInitial ? `${cctvPanelRight + 20}px` : "24px",
                            zIndex: 200,
                            transition: "bottom 0.3s ease-in-out, right 0.3s ease-in-out",
                        }}>
                        <a
                            href="http://192.168.102.101:7000"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-105"
                            style={{
                                background: "linear-gradient(135deg, #0066FF 0%, #8A2BE2 50%, #ff8566 100%)",
                                boxShadow: "0 4px 12px rgba(0, 102, 255, 0.3), 0 2px 4px rgba(138, 43, 226, 0.2)",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 102, 255, 0.4), 0 4px 8px rgba(138, 43, 226, 0.3)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 102, 255, 0.3), 0 2px 4px rgba(138, 43, 226, 0.2)";
                            }}
                            aria-label="CUVIA Link">
                            <img src="/simbol.svg" alt="AI" className="w-6 h-6" style={{ filter: "brightness(0) saturate(100%) invert(100%)" }} />
                        </a>
                        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-[#1a1a1a] text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-[#31353a]">
                            CUVIA LINK로 이동
                            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-[#1a1a1a]"></div>
                        </div>
                    </div>
                );
            })()}

            {toggleCctvSetting && <CameraListPopup onClose={() => setToggleCctvSetting(false)} availableCCTVs={availableCCTVs} bridgeSlots={bridgeSlots} onBridgeSlotsChange={setBridgeSlots} />}
        </div>
    );
};

export default UnityMapView;
