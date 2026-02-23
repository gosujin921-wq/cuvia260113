import { Event } from "@/types";
import { Icon } from "@iconify/react";
import { useMemo, useState, useRef, useEffect } from "react";
import CCTVIcon from "@/components/common/CCTVIcon";
import "maplibre-gl/dist/maplibre-gl.css";
import { getCCTVPanelLayout } from "@/lib/dashboard-cctv-layout";
import { sendToUnity, subscribeUnityToReact } from "@/lib/unity/unityBridge";
import { EventToUnity } from "@/lib/unity/types";
import UnityCanvas from "../../UnityCanvas";
import CameraListPopup, { BridgeSlot, CCTVInfo } from "./ConfigurePopup";
import { CameraListPageData } from "@/src/apis/camera/types";
import UnityCCTVMeshTracking from "./UnityCCTVMeshTracking";
import { useGetCamera, useGetCameraAssignCameraInfo, useGetIceServerList } from "@/src/apis/camera/hooks";
import { useGetAgentList } from "@/src/apis/agent/hooks";
import UnityBottomPanel from "./UnityBottomPanel";

interface UnityMapViewProps {
    events: Event[];
    selectedEventId?: string | null;
    aiDetectionEventId?: string | null;
    externalZoomLevel?: number;
    onZoomLevelChange?: (level: number) => void;
    onAiDetectionClose?: () => void;
    hideControls?: boolean;
    leftPanelWidth?: number;
    isAutoMode?: boolean;
    // 소켓 관련 props (Home.tsx에서 전달)
    isEventStreaming?: boolean;
    activeEventCameraInfo?: { rtsp_url: string } | null;
    onBridgeSlotsChange?: (slots: BridgeSlot[]) => void;
}

// Unity Bridge 슬롯 초기값 (PTZ, Bullet 카메라)
const initialBridgeSlots: BridgeSlot[] = [
    { bridgeId: "PTZ-1", assignedCctvId: undefined, isGrouped: false, isMain: false, isRobot: false },
    { bridgeId: "PTZ-2", assignedCctvId: undefined, isGrouped: false, isMain: false, isRobot: false },
    { bridgeId: "PTZ-3", assignedCctvId: undefined, isGrouped: false, isMain: false, isRobot: false },
    { bridgeId: "PTZ-4", assignedCctvId: undefined, isGrouped: false, isMain: false, isRobot: false },
    { bridgeId: "PTZ-5", assignedCctvId: undefined, isGrouped: false, isMain: false, isRobot: false },
    { bridgeId: "Bullet-1", assignedCctvId: undefined, isGrouped: false, isMain: false, isRobot: false },
    { bridgeId: "Bullet-2", assignedCctvId: undefined, isGrouped: false, isMain: false, isRobot: false },
    { bridgeId: "Bullet-3", assignedCctvId: undefined, isGrouped: false, isMain: false, isRobot: false },
    { bridgeId: "Bullet-4", assignedCctvId: undefined, isGrouped: false, isMain: false, isRobot: false },
    { bridgeId: "Bullet-5", assignedCctvId: undefined, isGrouped: false, isMain: false, isRobot: false },
    { bridgeId: "Bullet-6", assignedCctvId: undefined, isGrouped: false, isMain: false, isRobot: false },
    { bridgeId: "Bullet-7", assignedCctvId: undefined, isGrouped: false, isMain: false, isRobot: false },
    { bridgeId: "Bullet-8", assignedCctvId: undefined, isGrouped: false, isMain: false, isRobot: false },
    { bridgeId: "Robot-1", assignedCctvId: undefined, isGrouped: false, isMain: false, isRobot: false },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const UnityMapView = ({ events, selectedEventId, aiDetectionEventId, onAiDetectionClose, hideControls = false, leftPanelWidth = 480, isEventStreaming = false, activeEventCameraInfo, onBridgeSlotsChange }: UnityMapViewProps) => {
    const [zoomLevel, setZoomLevel] = useState(1);
    const [showCCTV, setShowCCTV] = useState(true);
    const [showCCTVViewAngle, setShowCCTVViewAngle] = useState(true);
    const [showCCTVName, setShowCCTVName] = useState(true);
    const [verticalLevel, setVerticalLevel] = useState(1);
    const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1920);
    const [hoveredCCTVId, setHoveredCCTVId] = useState<string | null>(null);

    // CCTV 관련 상태
    const { data: cameraList } = useGetCamera(-1, 100, "", "");
    const availableCCTVs = useMemo<CameraListPageData[]>(() => cameraList?.page_data ?? [], [cameraList?.page_data]);
    const [bridgeSlots, setBridgeSlots] = useState<BridgeSlot[]>(initialBridgeSlots);

    const { data: mediaAgentList } = useGetAgentList(-1, 100, "agent_type:1", "");
    const mediaAgent = mediaAgentList?.page_data?.[0];
    const mediaAgentUrl = mediaAgent ? `ws://${mediaAgent.agent_ip}:${mediaAgent.agent_port}/v1/media-agent/camera/stream` : undefined;

    const { data: iceServerList } = useGetIceServerList();

    const { data: cameraAssignCameraInfo } = useGetCameraAssignCameraInfo();

    // cameraAssignCameraInfo 데이터로 bridgeSlots 업데이트
    useEffect(() => {
        if (!cameraAssignCameraInfo?.camera_info || cameraAssignCameraInfo.camera_info.length === 0) {
            return;
        }

        setBridgeSlots((prevSlots) => {
            return prevSlots.map((slot) => {
                const assignInfo = cameraAssignCameraInfo.camera_info.find((info) => info.bridge_id === slot.bridgeId);
                if (assignInfo) {
                    return {
                        ...slot,
                        assignedCctvId: assignInfo.camera_id || undefined,
                        isGrouped: assignInfo.is_grouped === "Y",
                        isMain: assignInfo.is_main === "Y",
                        isRobot: assignInfo.is_robot === "Y",
                    };
                }
                return slot;
            });
        });
    }, [cameraAssignCameraInfo]);

    // bridgeSlots 변경 시 상위 컴포넌트에 알림
    useEffect(() => {
        onBridgeSlotsChange?.(bridgeSlots);
    }, [bridgeSlots, onBridgeSlotsChange]);

    // Bridge 슬롯과 실제 CCTV 정보를 결합한 목록 (렌더링용)
    const cctvList: CCTVInfo[] = useMemo(() => {
        return bridgeSlots.map((slot) => {
            const camera = availableCCTVs.find((cctv) => cctv.camera_id === slot.assignedCctvId);
            return {
                bridgeId: slot.bridgeId,
                camera_id: camera?.camera_id || "",
                camera_name: camera?.camera_name || "",
                rtsp_url: camera?.rtsp_url || "",
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

    // 투망감시 모드 시작 시 그룹핑된 CCTV 팝업 열기 (aiDetectionEventId가 설정되어야 열림)
    useEffect(() => {
        const isEvent1Selected = selectedEventId && events.find((e) => e.id === selectedEventId && (e.eventId === "A-20260107-004" || e.id === "A-20260107-004"));

        // aiDetectionEventId가 있거나 특정 이벤트 선택 시 그룹핑된 카메라 팝업 열기
        // (웹소켓 이벤트는 Home.tsx 딜레이 후 aiDetectionEventId 설정됨)
        if (isEvent1Selected || aiDetectionEventId) {
            const blueCCTVIndices = cctvList.filter((cctv) => cctv.isGrouped).map((cctv) => cctv.bridgeId);
            setOpenedCCTVPopups(new Set(blueCCTVIndices));
        } else {
            setOpenedCCTVPopups(new Set());
        }
    }, [selectedEventId, events, cctvList, aiDetectionEventId]);

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

    const handleZoomLevelChange = (level: number) => {
        setZoomLevel(level);
        const eventToUnity: EventToUnity = {
            methodName: "zoomLevel",
            payload: {
                value: level,
            },
        };
        sendToUnity(JSON.stringify(eventToUnity));
    };

    const handleMapBearingChange = (bearing: number) => {
        const eventToUnity: EventToUnity = {
            methodName: "mapBearing",
            payload: {
                value: bearing,
            },
        };
        sendToUnity(JSON.stringify(eventToUnity));
    };

    const handleVerticalLevelChange = (level: number) => {
        // TODO: 레벨에 따른 동작 구현
        const eventToUnity: EventToUnity = {
            methodName: "pitchLevel",
            payload: {
                value: level,
            },
        };
        sendToUnity(JSON.stringify(eventToUnity));
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
    };

    useEffect(() => {
        // ✅ Unity → React 이벤트 수신 설정
        const unsubscribe = subscribeUnityToReact((eventName, eventData) => {
            if (eventName === "hoverCCTV") {
                try {
                    const data = JSON.parse(eventData);
                    setHoveredCCTVId(data.cctvId);
                } catch (e) {
                    console.error("[MapView] JSON 파싱 에러:", e);
                }
            } else if (eventName === "leaveCCTV") {
                try {
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

            {/* 메인/그룹핑 CCTV 팝업: aiDetectionEventId가 있을 때만 표시 (Home.tsx의 딜레이 로직 적용됨) */}
            {aiDetectionEventId &&
                (() => {
                    const gridPopupWidth = 320;
                    const padding = 20;
                    const mainCctv = cctvList.find((cctv) => cctv.isMain) as CCTVInfo;

                    // 웹소켓 이벤트용 더미 Event 객체 생성 (isEventStreaming일 때 사용)
                    const websocketEvent: Event | null = isEventStreaming
                        ? {
                              id: `ws-event-streaming`,
                              eventId: `EVT-streaming`,
                              title: `이벤트 감지`,
                              description: "",
                              timestamp: new Date().toISOString(),
                              priority: "주의",
                              type: "AI-배회",
                              status: "NEW",
                              location: { name: "", coordinates: [0, 0] },
                              processingStage: "생성",
                              resolution: { category: "AI", code: "", description: "" },
                          }
                        : null;

                    // aiDetectionEventId가 있으면 해당 이벤트 사용, 없으면 웹소켓 이벤트 사용
                    const currentEvent = events.find((e) => e.id === aiDetectionEventId) || websocketEvent;

                    if (!currentEvent) return null;

                    return (
                        <>
                            <UnityCCTVMeshTracking
                                iceServerList={iceServerList?.ice_servers ?? []}
                                mediaAgentUrl={mediaAgentUrl}
                                event={currentEvent}
                                onClose={() => {
                                    onAiDetectionClose?.();
                                }}
                                cctvId={mainCctv?.bridgeId || "main"}
                                position={{
                                    top: `${padding}px`,
                                    right: `${padding}px`,
                                    left: undefined,
                                    bottom: undefined,
                                }}
                                hideControls={hideControls}
                                cctvName={mainCctv?.bridgeId || "메인 카메라"}
                                highlighted={hoveredCCTVId === mainCctv?.bridgeId}
                                isMain={true}
                                onHover={handleHoverCctv}
                                cameraInfo={activeEventCameraInfo ? activeEventCameraInfo : undefined}
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

                                    const cctvCameraInfo = { rtsp_url: cctv.rtsp_url };
                                    return (
                                        <div
                                            key={`${cctv.bridgeId}-${idx}`}
                                            style={{
                                                width: `${gridPopupWidth}px`,
                                                height: "fit-content",
                                                pointerEvents: "auto",
                                            }}>
                                            <UnityCCTVMeshTracking
                                                iceServerList={iceServerList?.ice_servers ?? []}
                                                mediaAgentUrl={mediaAgentUrl}
                                                event={currentEvent}
                                                onClose={() => {}}
                                                isMain={false}
                                                cctvId={cctv.bridgeId}
                                                cctvName={cctv.bridgeId}
                                                position={undefined}
                                                width={gridPopupWidth}
                                                hideControls={hideControls}
                                                highlighted={hoveredCCTVId === cctv.bridgeId}
                                                onHover={handleHoverCctv}
                                                cameraInfo={cctvCameraInfo}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    );
                })()}

            {/* 순찰 로봇 화면의 우측 하단에 고정 */}
            {(() => {
                const robotSlot = bridgeSlots.find((slot) => slot.isRobot);
                if (!robotSlot) return null;

                const robotCamera = availableCCTVs.find((cctv) => cctv.camera_id === robotSlot.assignedCctvId);
                const robotRtspUrl = robotCamera?.rtsp_url || (robotCamera?.rtsp_ip && robotCamera?.rtsp_port ? `rtsp://${robotCamera.rtsp_ip}:${robotCamera.rtsp_port}` : undefined);

                return (
                    <UnityCCTVMeshTracking
                        iceServerList={iceServerList?.ice_servers ?? []}
                        mediaAgentUrl={mediaAgentUrl}
                        event={events.find((e) => e.id === aiDetectionEventId) || null}
                        onClose={() => {}}
                        isMain={false}
                        cctvId={robotSlot.bridgeId}
                        cctvName={robotSlot.bridgeId}
                        position={{
                            top: undefined,
                            right: undefined,
                            left: `${20}px`,
                            bottom: `${20}px`,
                        }}
                        width={420}
                        hideControls={hideControls}
                        highlighted={false}
                        onHover={handleHoverCctv}
                        cameraInfo={robotRtspUrl ? { rtsp_url: robotRtspUrl } : undefined}
                    />
                );
            })()}

            <UnityBottomPanel
                iceServerList={iceServerList?.ice_servers ?? []}
                cctvList={cameraList?.page_data ?? []}
                showCCTV={showCCTV}
                hideControls={hideControls}
                leftPanelWidth={leftPanelWidth}
                windowWidth={windowWidth}
                cctvScrollContainerRef={cctvScrollContainerRef}
                isUserScrollingRef={isUserScrollingRef}
                userScrollTimeoutRef={userScrollTimeoutRef}
                autoScrollIntervalRef={autoScrollIntervalRef}
                mediaAgentUrl={mediaAgentUrl}
            />

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

            {toggleCctvSetting && <CameraListPopup onClose={() => setToggleCctvSetting(false)} availableCCTVs={availableCCTVs} bridgeSlots={bridgeSlots} />}
        </div>
    );
};

export default UnityMapView;
