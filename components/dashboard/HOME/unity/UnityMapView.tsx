import { Event } from "@/types";
import { Icon } from "@iconify/react";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
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
import { startEvent, endEvent } from "@/src/apis/dummy/service";

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
    const iceServers = useMemo(() => iceServerList?.ice_servers ?? [], [iceServerList?.ice_servers]);

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
    const [demoMeshTrackingActive, setDemoMeshTrackingActive] = useState(false);
    const [toggleCctvSetting, setToggleCctvSetting] = useState(false);
    const cctvScrollContainerRef = useRef<HTMLDivElement | null>(null);
    const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isUserScrollingRef = useRef(false);
    const userScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    /** CCTV 팝업 한꺼번에 열/닫을 때 렌더 부하 방지용 스태거 타이머 */
    const cctvStaggerTimeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    const STAGGER_OPEN_MS = 100;

    // 투망감시 모드: 그룹 CCTV 팝업 열기/닫기 (한꺼번에 마운트/언마운트되지 않도록 단계적 처리)
    useEffect(() => {
        const isEvent1Selected = selectedEventId && events.find((e) => e.id === selectedEventId && (e.eventId === "A-20260107-004" || e.id === "A-20260107-004"));
        const shouldOpen = !!(isEvent1Selected || aiDetectionEventId || demoMeshTrackingActive);
        const blueCCTVIndices = cctvList.filter((cctv) => cctv.isGrouped).map((cctv) => cctv.bridgeId);

        cctvStaggerTimeoutRef.current.forEach((id) => clearTimeout(id));
        cctvStaggerTimeoutRef.current = [];

        if (!shouldOpen) {
            requestAnimationFrame(() => setOpenedCCTVPopups(new Set()));
            return;
        }

        if (blueCCTVIndices.length === 0) {
            setOpenedCCTVPopups(new Set());
            return;
        }
        setOpenedCCTVPopups(new Set([blueCCTVIndices[0]]));
        for (let i = 1; i < blueCCTVIndices.length; i += 1) {
            const id = setTimeout(() => {
                setOpenedCCTVPopups((prev) => new Set([...prev, blueCCTVIndices[i]]));
            }, i * STAGGER_OPEN_MS);
            cctvStaggerTimeoutRef.current.push(id);
        }
        return () => {
            cctvStaggerTimeoutRef.current.forEach((id) => clearTimeout(id));
            cctvStaggerTimeoutRef.current = [];
        };
    }, [selectedEventId, events, cctvList, aiDetectionEventId, demoMeshTrackingActive]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // 키보드 "2" → 3초 후 이벤트 시작 + 투망감시 시작, 7초 후 이벤트 종료
    useEffect(() => {
        let startTimer: ReturnType<typeof setTimeout> | null = null;
        let endTimer: ReturnType<typeof setTimeout> | null = null;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "2") return;

            // 3초 후 이벤트 시작 API + 투망감시 시작
            startTimer = setTimeout(() => {
                startEvent()
                    .then(() => {
                        console.log("[Demo] 이벤트 시작 API 호출 완료");
                    })
                    .catch((err) => {
                        console.error("[Demo] 이벤트 시작 API 실패:", err);
                    });
                setDemoMeshTrackingActive(true);

                // 투망감시 시작으로부터 7초 후 이벤트 종료
                endTimer = setTimeout(() => {
                    endEvent()
                        .then(() => {
                            console.log("[Demo] 이벤트 종료 API 호출 완료");
                        })
                        .catch((err) => {
                            console.error("[Demo] 이벤트 종료 API 실패:", err);
                        });
                    setDemoMeshTrackingActive(false);
                }, 10000);
            }, 3000);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            if (startTimer) clearTimeout(startTimer);
            if (endTimer) clearTimeout(endTimer);
        };
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

    const handleHoverCctv = useCallback((cctvId: string | null) => {
        if (!cctvId) {
            setHoveredCCTVId(null);
            return;
        }
        setHoveredCCTVId(cctvId);
    }, []);

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
                {/* 상하좌우 회전 컨트롤 - 1열: 상 → 하 → 좌 → 우 */}
                <div className="grid grid-cols-1 gap-1">
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
                        <Icon icon="mdi:rotate-left" className="w-5 h-5" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleMapBearingChange(30);
                        }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"
                        aria-label="회전 오른쪽"
                        tabIndex={0}>
                        <Icon icon="mdi:rotate-right" className="w-5 h-5" />
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
                    const gridPopupWidth = 420;
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
                              type: "AI 탐지",
                              status: "NEW",
                              location: { name: "", coordinates: [0, 0] },
                              processingStage: "생성",
                              resolution: { category: "AI", code: "", description: "" },
                          }
                        : null;

                    // aiDetectionEventId가 있으면 해당 이벤트 사용, 없으면 웹소켓 이벤트 사용
                    const currentEvent = events.find((e) => e.id === aiDetectionEventId) || websocketEvent;

                    if (!currentEvent) return null;

                    // 메인 + 열린 서브 CCTV를 하나의 그리드로 렌더 (메인 카메라 사이즈로 통일)
                    const gridItems: Array<{ cctv: CCTVInfo; isMain: boolean }> = [];
                    if (mainCctv) {
                        gridItems.push({ cctv: mainCctv, isMain: true });
                    }
                    cctvList.forEach((cctv) => {
                        if (!cctv.isMain && openedCCTVPopups.has(cctv.bridgeId)) {
                            gridItems.push({ cctv, isMain: false });
                        }
                    });

                    return (
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
                            {gridItems.map(({ cctv, isMain }, idx) => {
                                const cctvCameraInfo = isMain ? (activeEventCameraInfo ?? { rtsp_url: cctv.rtsp_url }) : { rtsp_url: cctv.rtsp_url };
                                return (
                                    <div
                                        key={`${cctv.bridgeId}-${idx}`}
                                        style={{
                                            width: `${gridPopupWidth}px`,
                                            height: "fit-content",
                                            pointerEvents: "auto",
                                        }}>
                                        <UnityCCTVMeshTracking
                                            iceServerList={iceServers}
                                            mediaAgentUrl={mediaAgentUrl}
                                            event={currentEvent}
                                            onClose={isMain ? () => onAiDetectionClose?.() : () => {}}
                                            cctvId={cctv.bridgeId}
                                            cctvName={isMain ? cctv.bridgeId || "메인 카메라" : cctv.bridgeId}
                                            position={undefined}
                                            width={gridPopupWidth}
                                            hideControls={hideControls}
                                            highlighted={hoveredCCTVId === cctv.bridgeId}
                                            isMain={isMain}
                                            onHover={handleHoverCctv}
                                            cameraInfo={cctvCameraInfo}
                                        />
                                    </div>
                                );
                            })}
                        </div>
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
                        iceServerList={iceServers}
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
                        width={650}
                        hideControls={hideControls}
                        highlighted={false}
                        onHover={handleHoverCctv}
                        cameraInfo={robotRtspUrl ? { rtsp_url: robotRtspUrl } : undefined}
                    />
                );
            })()}

            <UnityBottomPanel
                iceServerList={iceServers}
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

            {/* CUVIA Link 버튼 - 숨김 처리 */}

            {toggleCctvSetting && <CameraListPopup onClose={() => setToggleCctvSetting(false)} availableCCTVs={availableCCTVs} bridgeSlots={bridgeSlots} />}
        </div>
    );
};

export default UnityMapView;
