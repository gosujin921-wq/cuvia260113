import { Event } from "@/types";
import { Icon } from "@iconify/react";
import { useMemo, useState, useRef, useEffect } from "react";
import CCTVIcon from "@/components/common/CCTVIcon";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getCCTVConfigMap } from "@/lib/cctv-view-angle-utils";
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
    { bridgeId: "CCTV-V-1", assignedCctvId: "카메라01", isGrouped: true, isMain: false },
    { bridgeId: "CCTV-V-2", assignedCctvId: "카메라02", isGrouped: false, isMain: false },
    { bridgeId: "CCTV-V-3", assignedCctvId: "카메라03", isGrouped: false, isMain: false },
    { bridgeId: "CCTV-V-4", assignedCctvId: "카메라04", isGrouped: false, isMain: false },
    { bridgeId: "CCTV-V-5", assignedCctvId: "카메라05", isGrouped: false, isMain: false },
    { bridgeId: "CCTV-V-6", assignedCctvId: "카메라06", isGrouped: true, isMain: false },
    { bridgeId: "CCTV-V-7", assignedCctvId: "카메라07", isGrouped: false, isMain: false },
    { bridgeId: "CCTV-V-8", assignedCctvId: "카메라08", isGrouped: true, isMain: false },
    { bridgeId: "CCTV-V-9", assignedCctvId: "카메라09", isGrouped: true, isMain: false },
    { bridgeId: "CCTV-V-10", assignedCctvId: "카메라10", isGrouped: false, isMain: false },
    { bridgeId: "CCTV-V-11", assignedCctvId: "카메라11", isGrouped: true, isMain: true },
];

const UnityMapView = ({ events, selectedEventId, aiDetectionEventId, cctvIndex, onMapClick, externalZoomLevel, onZoomLevelChange, onAiDetectionClose, hideControls = false, leftPanelWidth = 480, isAutoMode = true }: UnityMapViewProps) => {
    const [zoomLevel, setZoomLevel] = useState(1);
    const [showCCTV, setShowCCTV] = useState(true);
    const [showCCTVViewAngle, setShowCCTVViewAngle] = useState(true);
    const [showCCTVName, setShowCCTVName] = useState(true);
    const [is3DMode, setIs3DMode] = useState(true);
    const [mapBearing, setMapBearing] = useState(-17.6);
    const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1920);
    const [isProgressComplete, setIsProgressComplete] = useState(false);
    const [viewAngleAnimationProgress, setViewAngleAnimationProgress] = useState(0);
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

    useEffect(() => {
        if (externalZoomLevel !== undefined) {
            setZoomLevel(externalZoomLevel);
        }
    }, [externalZoomLevel]);

    useEffect(() => {
        onZoomLevelChange?.(zoomLevel);
    }, [zoomLevel, onZoomLevelChange]);

    useEffect(() => {
        const isEvent1Selected = selectedEventId && events.find((e) => e.id === selectedEventId && (e.eventId === "A-20260107-004" || e.id === "A-20260107-004"));

        if (isEvent1Selected && zoomLevel > 1) {
            setIsProgressComplete(false);
            setViewAngleAnimationProgress(0);

            // 3초 후 카드 페이드 아웃 및 프로그래스 완료, 화각 애니메이션 시작
            const timer = setTimeout(() => {
                setIsProgressComplete(true);

                const angleDuration = 600;
                const angleStartTime = Date.now();
                setViewAngleAnimationProgress(0);

                const angleAnimate = () => {
                    const angleElapsed = Date.now() - angleStartTime;
                    const angleProgress = Math.min(angleElapsed / angleDuration, 1);
                    const easedProgress = 1 - Math.pow(1 - angleProgress, 3);
                    setViewAngleAnimationProgress(easedProgress);

                    if (angleProgress < 1) {
                        requestAnimationFrame(angleAnimate);
                    } else {
                        setViewAngleAnimationProgress(1);
                    }
                };

                requestAnimationFrame(angleAnimate);
            }, 3000);

            return () => clearTimeout(timer);
        } else if (!isEvent1Selected || zoomLevel <= 1) {
            setIsProgressComplete(false);
            setViewAngleAnimationProgress(0);
        }
    }, [selectedEventId, zoomLevel, events]);

    useEffect(() => {
        if (!isAutoMode) {
            setViewAngleAnimationProgress(0);
        }
    }, [isAutoMode]);

    // 투망감시 모드 시작 시 모든 블루 CCTV 팝업 및 CCTV-V-11 팝업 열기
    useEffect(() => {
        const isEvent1Selected = selectedEventId && events.find((e) => e.id === selectedEventId && (e.eventId === "A-20260107-004" || e.id === "A-20260107-004"));
        if (isEvent1Selected && isProgressComplete && viewAngleAnimationProgress > 0) {
            // 블루 CCTV 인덱스: [0, 8, 1, 7, 6, 9, 5, 4] -> CCTV 인덱스: [1, 9, 2, 8, 7, 10, 6, 5]
            // CCTV-V-11도 포함
            const blueCCTVIndices = cctvList.filter((cctv) => cctv.isGrouped).map((cctv) => cctv.bridgeId);
            console.log(new Set(blueCCTVIndices));
            setOpenedCCTVPopups(new Set(blueCCTVIndices));
        } else if (!isEvent1Selected || zoomLevel <= 1) {
            setOpenedCCTVPopups(new Set());
        }
    }, [isProgressComplete, viewAngleAnimationProgress, selectedEventId, zoomLevel, events, cctvList]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const prevZoomLevelRef = useRef(zoomLevel);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        const isEvent1Selected = selectedEventId && events.find((e) => e.id === selectedEventId && (e.eventId === "A-20260107-004" || e.id === "A-20260107-004"));

        if (zoomLevel > 1 && prevZoomLevelRef.current === 1 && showCCTV && showCCTVViewAngle && !isEvent1Selected) {
            const cctvPositions = [
                { left: 34, top: 40, count: 1, viewAngle: 45 },
                { left: 40, top: 38, count: 1, viewAngle: 90 },
                { left: 48, top: 40, count: 1, viewAngle: 135 },
                { left: 52, top: 46, count: 1, viewAngle: 180 },
                { left: 50, top: 56, count: 1, viewAngle: 225 },
                { left: 42, top: 58, count: 1, viewAngle: 270 },
                { left: 34, top: 56, count: 1, viewAngle: 315 },
                { left: 32, top: 48, count: 1, viewAngle: 0 },
                { left: 38, top: 42, count: 1, viewAngle: 60 },
                { left: 48, top: 50, count: 1, viewAngle: 120 },
            ];

            const startAngles: Record<string, number> = {};
            const targetAngles: Record<string, number> = {};

            const homeViewAngle = 90;
            cctvPositions.forEach((item, index) => {
                const cctvId = `cctv-${index}`;
                startAngles[cctvId] = homeViewAngle;
                targetAngles[cctvId] = homeViewAngle + 10;
            });

            const duration = 600;
            const startTime = performance.now();

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(1, elapsed / duration);

                if (progress < 1) {
                    animationFrameRef.current = requestAnimationFrame(animate);
                } else {
                    animationFrameRef.current = null;
                }
            };

            animationFrameRef.current = requestAnimationFrame(animate);
            prevZoomLevelRef.current = zoomLevel;

            return () => {
                if (animationFrameRef.current !== null) {
                    cancelAnimationFrame(animationFrameRef.current);
                    animationFrameRef.current = null;
                }
            };
        } else if (zoomLevel === 1) {
            prevZoomLevelRef.current = zoomLevel;
        } else {
            prevZoomLevelRef.current = zoomLevel;
        }
    }, [zoomLevel, showCCTV, showCCTVViewAngle, selectedEventId, events]);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: "https://api.maptiler.com/maps/019bdf7d-b868-75ba-b003-3005177ff4fa/style.json?key=WPWmpNf4y5nzKDA7mQXe",
            center: [126.783, 37.5044],
            zoom: 15,
            pitch: 60,
            bearing: -17.6,
            attributionControl: false,
            interactive: false,
        });

        map.on("load", () => {
            const style = map.getStyle();
            if (!style || !style.layers) return;

            const layers = style.layers;

            layers.forEach((layer: any) => {
                const layerId = layer.id.toLowerCase();
                const isBuildingLayer = layerId.includes("building") || layerId.includes("건물") || layerId.includes("extrusion") || layer.type === "fill-extrusion";

                if (isBuildingLayer) {
                    try {
                        if (layer.type === "fill-extrusion") {
                            if (map.getLayer(layer.id)) {
                                map.setPaintProperty(layer.id, "fill-extrusion-height", ["case", ["has", "height"], ["*", ["to-number", ["get", "height"]], 1], ["has", "render_height"], ["*", ["to-number", ["get", "render_height"]], 1], ["has", "building:levels"], ["*", ["to-number", ["get", "building:levels"]], 3], 15]);
                                map.setPaintProperty(layer.id, "fill-extrusion-base", ["case", ["has", "min_height"], ["to-number", ["get", "min_height"]], 0]);
                            }
                        } else if (layer.type === "fill" && layer.source) {
                            const sourceId = layer.source;
                            const sourceLayer = layer["source-layer"];

                            if (map.getSource(sourceId)) {
                                if (map.getLayer(layer.id)) {
                                    map.removeLayer(layer.id);
                                }

                                map.addLayer({
                                    id: `${layer.id}-3d`,
                                    type: "fill-extrusion",
                                    source: sourceId,
                                    "source-layer": sourceLayer,
                                    paint: {
                                        "fill-extrusion-height": ["case", ["has", "height"], ["*", ["to-number", ["get", "height"]], 1], ["has", "building:levels"], ["*", ["to-number", ["get", "building:levels"]], 3], 15],
                                        "fill-extrusion-base": ["case", ["has", "min_height"], ["to-number", ["get", "min_height"]], 0],
                                    },
                                    filter: layer.filter || ["has", "height"],
                                });
                            }
                        }
                    } catch (e) {
                        console.warn("건물 레이어 설정 실패:", layer.id, e);
                    }
                }
            });
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.easeTo({
                pitch: is3DMode ? 60 : 0,
                duration: 500,
            });
        }
    }, [is3DMode]);

    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.easeTo({
                bearing: mapBearing,
                duration: 300,
            });
        }
    }, [mapBearing]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedCCTV = localStorage.getItem("cctv-show-cctv");
            if (savedCCTV === "true") {
                setShowCCTV(true);
            } else if (savedCCTV === null || savedCCTV === "false") {
                setShowCCTV(true);
                setShowCCTVViewAngle(true);
                setShowCCTVName(true);
                localStorage.setItem("cctv-show-cctv", "true");
                localStorage.setItem("cctv-show-view-angle", "true");
                localStorage.setItem("cctv-show-name", "true");
            }
            const savedViewAngle = localStorage.getItem("cctv-show-view-angle");
            if (savedViewAngle === "true") {
                setShowCCTVViewAngle(true);
            } else if (savedViewAngle === null || savedViewAngle === "false") {
                setShowCCTVViewAngle(true);
                localStorage.setItem("cctv-show-view-angle", "true");
            }
            const savedName = localStorage.getItem("cctv-show-name");
            if (savedName === "true") {
                setShowCCTVName(true);
            } else if (savedName === null || savedName === "false") {
                setShowCCTVName(true);
                localStorage.setItem("cctv-show-name", "true");
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("cctv-show-cctv", showCCTV.toString());
        }
    }, [showCCTV]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("cctv-show-view-angle", showCCTVViewAngle.toString());
        }
    }, [showCCTVViewAngle]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("cctv-show-name", showCCTVName.toString());
        }
    }, [showCCTVName]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "cctv-show-cctv") {
                setShowCCTV(e.newValue === "true");
            } else if (e.key === "cctv-show-view-angle") {
                setShowCCTVViewAngle(e.newValue === "true");
            } else if (e.key === "cctv-show-name") {
                setShowCCTVName(e.newValue === "true");
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);
    const containerRef = useRef<HTMLDivElement>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);

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

    const positionsById = useMemo(() => {
        const result: Record<string, { left: number; top: number }> = {};
        events.forEach((event) => {
            if (cachedPositions[event.id]) {
                result[event.id] = cachedPositions[event.id];
            }
        });
        return result;
    }, [events, cachedPositions]);

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

    const handle3DModeChange = (mode: boolean) => {
        setIs3DMode(mode);
        const eventToUnity: EventToUnity = {
            methodName: "3DMode",
            payload: {
                viewMode: mode ? "3d" : "2d",
            },
        };
        sendToUnity(JSON.stringify(eventToUnity));
        console.log("eventToUnity", eventToUnity);
    };

    const handleMapBearingChange = (bearing: number) => {
        setMapBearing(bearing);
        const eventToUnity: EventToUnity = {
            methodName: "mapBearing",
            payload: {
                value: bearing,
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
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handle3DModeChange(false);
                    }}
                    disabled
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${!is3DMode ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm" : "bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"}`}
                    aria-label="2D">
                    <Icon icon="mdi:view-dashboard" className="w-5 h-5" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handle3DModeChange(true);
                    }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${is3DMode ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm" : "bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"}`}
                    aria-label="3D">
                    <Icon icon="mdi:cube" className="w-5 h-5" />
                </button>
                {is3DMode && (
                    <>
                        <div className="w-full h-px bg-gray-300 my-1" />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleMapBearingChange(-30);
                            }}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"
                            aria-label="회전 왼쪽">
                            <Icon icon="mdi:rotate-left" className="w-5 h-5" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleMapBearingChange(30);
                            }}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"
                            aria-label="회전 오른쪽">
                            <Icon icon="mdi:rotate-right" className="w-5 h-5" />
                        </button>
                    </>
                )}
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
                                isAutoMode={isAutoMode}
                                isProgressComplete={isProgressComplete}
                                cctvName={mainCctv.cctvName}
                                viewAngleAnimationProgress={viewAngleAnimationProgress}
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
                                            <UnityCCTVMeshTracking
                                                event={events.find((e) => e.id === aiDetectionEventId) || null}
                                                onClose={() => {}}
                                                isMain={false}
                                                cctvId={cctv.bridgeId}
                                                cctvName={cctv.cctvName}
                                                cctvRtspURL={cctv.rtspURL}
                                                position={undefined}
                                                width={gridPopupWidth}
                                                hideControls={hideControls}
                                                isAutoMode={isAutoMode}
                                                isProgressComplete={isProgressComplete}
                                                viewAngleAnimationProgress={viewAngleAnimationProgress}
                                                highlighted={hoveredCCTVId === cctv.bridgeId}
                                                onHover={handleHoverCctv}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    );
                })()}

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
