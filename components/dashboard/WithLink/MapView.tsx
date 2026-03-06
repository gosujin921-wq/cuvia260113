import { Event } from "@/types";
import { Icon } from "@iconify/react";
import { useMemo, useState, useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getCCTVViewAngle as getCCTVViewAngleUtil, getCCTVConfigMap } from "@/lib/cctv-view-angle-utils";
import type { MapStreamData, MapStreamWmsLayer } from "@/types/streamJson.types";
import { mapDataToFeatureCollection } from "@/src/hooks/useMapStreamParser";
import { useGetIncidentList } from "@/src/apis/agent/hooks";
import proj4 from "proj4";
import { KOREA_BOUNDS } from "@/src/const/const";

// EPSG:5181 (한국 중부원점 TM) 좌표계 정의
proj4.defs(
    "EPSG:5181",
    "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
);

const PIXEL_RATIO = 2;
const MARKER_SIZE = 28 * PIXEL_RATIO;

const escapeHtml = (text: string): string => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
};

const createStreamMarkerImage = (): { width: number; height: number; data: Uint8ClampedArray } => {
    const canvas = document.createElement("canvas");
    canvas.width = MARKER_SIZE;
    canvas.height = MARKER_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { width: MARKER_SIZE, height: MARKER_SIZE, data: new Uint8ClampedArray(MARKER_SIZE * MARKER_SIZE * 4) };

    const r = 12 * PIXEL_RATIO;
    const pad = 2 * PIXEL_RATIO;
    const ringR = 14 * PIXEL_RATIO;

    ctx.clearRect(0, 0, MARKER_SIZE, MARKER_SIZE);

    ctx.shadowColor = "rgba(239, 68, 68, 0.5)";
    ctx.shadowBlur = 20 * PIXEL_RATIO;
    ctx.beginPath();
    ctx.roundRect(pad, pad, MARKER_SIZE - pad * 2, MARKER_SIZE - pad * 2, r);
    const gradient = ctx.createLinearGradient(0, 0, MARKER_SIZE, MARKER_SIZE);
    gradient.addColorStop(0, "rgba(220, 38, 38, 0.2)");
    gradient.addColorStop(0.5, "rgb(26, 26, 26)");
    gradient.addColorStop(1, "rgb(15, 15, 15)");
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = pad;
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(0, 0, MARKER_SIZE, MARKER_SIZE, ringR);
    ctx.strokeStyle = "rgba(239, 68, 68, 0.3)";
    ctx.stroke();

    const pinPath = new Path2D("M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z");
    const pinSize = 16 * PIXEL_RATIO;
    const pinScale = pinSize / 24;
    const pinX = (MARKER_SIZE - pinSize) / 2;
    const pinY = (MARKER_SIZE - pinSize) / 2;
    ctx.save();
    ctx.translate(pinX, pinY);
    ctx.scale(pinScale, pinScale);
    ctx.fillStyle = "#f87171";
    ctx.fill(pinPath);
    ctx.restore();

    const imageData = ctx.getImageData(0, 0, MARKER_SIZE, MARKER_SIZE);
    return { width: MARKER_SIZE, height: MARKER_SIZE, data: imageData.data };
};

/** Material Design 비디오/CCTV 카메라 아이콘 path (viewBox 24x24) - DOM 24px 버튼과 동일 */
const CCTV_ICON_PATH = "M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z";

/** 지도 위 24px CCTV 버튼과 동일한 스타일: 원형 + 검은 영역 유지, 테두리·아이콘·글로우만 푸른색 */
const createCCTVStreamMarkerImage = (): { width: number; height: number; data: Uint8ClampedArray } => {
    const canvas = document.createElement("canvas");
    canvas.width = MARKER_SIZE;
    canvas.height = MARKER_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { width: MARKER_SIZE, height: MARKER_SIZE, data: new Uint8ClampedArray(MARKER_SIZE * MARKER_SIZE * 4) };

    const cx = MARKER_SIZE / 2;
    const cy = MARKER_SIZE / 2;
    const radius = MARKER_SIZE / 2 - 2 * PIXEL_RATIO;
    const borderWidth = 2 * PIXEL_RATIO;

    ctx.clearRect(0, 0, MARKER_SIZE, MARKER_SIZE);

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    const gradient = ctx.createLinearGradient(0, 0, MARKER_SIZE, MARKER_SIZE);
    gradient.addColorStop(0, "rgba(74, 74, 74, 1)");
    gradient.addColorStop(0.5, "rgba(58, 58, 58, 1)");
    gradient.addColorStop(1, "rgba(42, 42, 42, 1)");
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowColor = "rgba(59, 130, 246, 0.5)";
    ctx.shadowBlur = 12 * PIXEL_RATIO;
    ctx.strokeStyle = "rgba(59, 130, 246, 0.9)";
    ctx.lineWidth = borderWidth;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const iconSize = 16 * PIXEL_RATIO;
    const iconScale = iconSize / 24;
    const iconX = cx - iconSize / 2;
    const iconY = cy - iconSize / 2;
    ctx.save();
    ctx.translate(iconX, iconY);
    ctx.scale(iconScale, iconScale);
    const cameraPath = new Path2D(CCTV_ICON_PATH);
    ctx.fillStyle = "#93c5fd";
    ctx.fill(cameraPath);
    ctx.restore();

    const imageData = ctx.getImageData(0, 0, MARKER_SIZE, MARKER_SIZE);
    return { width: MARKER_SIZE, height: MARKER_SIZE, data: imageData.data };
};

interface MapViewProps {
    events: Event[];
    highlightedEventId?: string | null;
    onEventClick?: (eventId: string) => void;
    selectedEventId?: string | null;
    aiDetectionEventId?: string | null;
    onMapClick?: () => void;
    onEventHover?: (eventId: string | null) => void;
    onToggleGeneralEvents?: () => void;
    externalZoomLevel?: number;
    onZoomLevelChange?: (level: number) => void;
    onAiDetectionClose?: () => void;
    hideControls?: boolean;
    /** 프로그래스바 표시 중 (고속검색 시작 직후). 이때부터 버튼 우측 하단으로 이동 */
    showFastSearch?: boolean;
    /** 고속검색 리스트 화면 여부 */
    showFastSearchList?: boolean;
    /** 고속검색 반경(m). 500m → 100px 기준으로 대시 원 크기 연동 */
    fastSearchRadius?: number;
    /** 고속검색 반경 (실제 적용된 값, CCTV 필터링용) */
    appliedSearchRadius?: number;
    leftPanelWidth?: number;
    pinOffset?: { x: number; y: number };
    focusTargetXPercent?: number; // 줌 시 포커스(화면) 위치 (기본: 50)
    flyToLocation?: [number, number] | null; // 지도를 특정 위치로 이동시키는 좌표
    externalShowCCTV?: boolean; // 외부에서 CCTV 표시 제어
    onMapStateChange?: (state: { center: [number, number]; zoom: number; pitch: number; bearing: number }) => void; // 지도 상태 변경 콜백
    streamMapData?: MapStreamData | null; // 스트림에서 받은 맵 데이터
    keepControlPosition?: boolean;
}

const MapView = ({
    events,
    highlightedEventId,
    onEventClick,
    selectedEventId,
    aiDetectionEventId,
    onMapClick,
    onEventHover,
    onToggleGeneralEvents,
    externalZoomLevel,
    onZoomLevelChange,
    onAiDetectionClose,
    hideControls = false,
    showFastSearch = false,
    showFastSearchList = false,
    fastSearchRadius = 300,
    appliedSearchRadius = 200,
    leftPanelWidth = 480,
    pinOffset = { x: 0, y: 0 },
    focusTargetXPercent = 50,
    flyToLocation = null,
    externalShowCCTV,
    onMapStateChange,
    streamMapData,
    keepControlPosition = false,
}: MapViewProps) => {
    const [zoomLevel, setZoomLevel] = useState(0);
    const [cctvViewAngles, setCctvViewAngles] = useState<Record<string, number>>({});
    const [animatingViewAngles, setAnimatingViewAngles] = useState<Record<string, number>>({});
    const [showCCTV, setShowCCTV] = useState(true);

    // 외부에서 CCTV 표시 제어
    useEffect(() => {
        if (externalShowCCTV !== undefined) {
            setShowCCTV(externalShowCCTV);
        }
    }, [externalShowCCTV]);

    const [currentCCTVIndex, setCurrentCCTVIndex] = useState(0);
    const [showCCTVViewAngle, setShowCCTVViewAngle] = useState(true);
    const [showCCTVName, setShowCCTVName] = useState(true);
    const [is3DMode, setIs3DMode] = useState(true);
    const [mapBearing, setMapBearing] = useState(-17.6);
    const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1920);
    const [streamMarkerViewType, setStreamMarkerViewType] = useState<"individual" | "cluster" | "heatmap">("individual");
    const [showTrafficLayer, setShowTrafficLayer] = useState(false);
    const [isTrafficLayerLoading, setIsTrafficLayerLoading] = useState(false);
    const showTrafficLayerRef = useRef(false);

    // 도로 돌발 상황 API 조회 (토글 ON 시에만 20초마다 갱신)
    const { data: incidentData, isFetching: isIncidentFetching } = useGetIncidentList(showTrafficLayer);
    const trafficToggleCooldownRef = useRef(0);
    const TRAFFIC_TOGGLE_COOLDOWN_MS = 300;

    useEffect(() => {
        if (typeof window !== "undefined") {
            const configMap = getCCTVConfigMap();
            const defaultAngles: Record<string, number> = {};
            Object.keys(configMap).forEach((cctvId) => {
                defaultAngles[cctvId] = configMap[cctvId].viewAngle;
            });

            const saved = localStorage.getItem("cctv-view-angles");
            if (saved) {
                try {
                    const savedAngles = JSON.parse(saved);
                    setCctvViewAngles({ ...defaultAngles, ...savedAngles });
                } catch (e) {
                    console.warn("Failed to load CCTV view angles:", e);
                    setCctvViewAngles(defaultAngles);
                }
            } else {
                setCctvViewAngles(defaultAngles);
            }

            const handleViewAngleChange = (e: CustomEvent) => {
                const { cctvId, viewAngle, cctvIds, all } = e.detail;
                if (all) {
                    const newAngles: Record<string, number> = {};
                    Object.keys(configMap).forEach((id) => {
                        newAngles[id] = viewAngle;
                    });
                    setCctvViewAngles(newAngles);
                } else if (cctvIds) {
                    setCctvViewAngles((prev) => {
                        const updated = { ...prev };
                        cctvIds.forEach((id: string) => {
                            updated[id] = viewAngle;
                        });
                        return updated;
                    });
                } else if (cctvId) {
                    setCctvViewAngles((prev) => ({
                        ...prev,
                        [cctvId]: viewAngle,
                    }));
                }
            };

            window.addEventListener("cctv-view-angle-changed", handleViewAngleChange as EventListener);
            return () => {
                window.removeEventListener("cctv-view-angle-changed", handleViewAngleChange as EventListener);
            };
        }
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined" && Object.keys(cctvViewAngles).length > 0) {
            localStorage.setItem("cctv-view-angles", JSON.stringify(cctvViewAngles));
        }
    }, [cctvViewAngles]);

    useEffect(() => {
        if (externalZoomLevel !== undefined) {
            setZoomLevel(externalZoomLevel);
        }
    }, [externalZoomLevel]);

    useEffect(() => {
        onZoomLevelChange?.(zoomLevel);
    }, [zoomLevel, onZoomLevelChange]);

    // 윈도우 리사이즈 감지
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // CCTV 자동 롤링 제거 (무한 스크롤로 변경)

    const prevZoomLevelRef = useRef(zoomLevel);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        if (zoomLevel > 0 && prevZoomLevelRef.current === 0 && showCCTV && showCCTVViewAngle) {
            const cctvPositions = [
                { left: 10, top: 20, count: 1, viewAngle: 45 },
                { left: 25, top: 15, count: 3, viewAngle: 90 },
                { left: 35, top: 30, count: 1, viewAngle: 135 },
                { left: 55, top: 25, count: 2, viewAngle: 180 },
                { left: 70, top: 20, count: 1, viewAngle: 225 },
                { left: 85, top: 30, count: 4, viewAngle: 270 },
                { left: 20, top: 50, count: 2, viewAngle: 45 },
                { left: 40, top: 55, count: 1, viewAngle: 90 },
                { left: 60, top: 50, count: 3, viewAngle: 135 },
                { left: 80, top: 55, count: 1, viewAngle: 180 },
                { left: 15, top: 75, count: 2, viewAngle: 225 },
                { left: 30, top: 70, count: 1, viewAngle: 270 },
                { left: 50, top: 75, count: 5, viewAngle: 45 },
                { left: 70, top: 70, count: 2, viewAngle: 90 },
                { left: 90, top: 75, count: 1, viewAngle: 135 },
                { left: 10, top: 90, count: 1, viewAngle: 180 },
                { left: 25, top: 95, count: 3, viewAngle: 225 },
                { left: 45, top: 90, count: 2, viewAngle: 270 },
                { left: 65, top: 95, count: 1, viewAngle: 45 },
                { left: 85, top: 90, count: 4, viewAngle: 90 },
            ];

            const startAngles: Record<string, number> = {};
            const targetAngles: Record<string, number> = {};

            cctvPositions.forEach((item, index) => {
                const cctvId = `cctv-${index}`;
                const baseViewAngle = cctvViewAngles[cctvId] ?? getCCTVViewAngleUtil(cctvId, 90);
                const minViewAngle = 90;
                const maxViewAngle = 120;
                const normalizedZoom = Math.min(1, Math.max(0, zoomLevel));
                const dynamicViewAngle = minViewAngle + (maxViewAngle - minViewAngle) * normalizedZoom;
                const finalViewAngle = Math.min(120, Math.max(90, dynamicViewAngle));

                startAngles[cctvId] = finalViewAngle;
                targetAngles[cctvId] = Math.min(120, finalViewAngle + 10);
            });

            setAnimatingViewAngles(startAngles);

            const duration = 600;
            const startTime = performance.now();

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(1, elapsed / duration);
                const easedProgress = 1 - Math.pow(1 - progress, 3);

                const newAngles: Record<string, number> = {};
                Object.keys(targetAngles).forEach((cctvId) => {
                    const start = startAngles[cctvId];
                    const target = targetAngles[cctvId];
                    newAngles[cctvId] = start + (target - start) * easedProgress;
                });

                setAnimatingViewAngles(newAngles);

                if (progress < 1) {
                    animationFrameRef.current = requestAnimationFrame(animate);
                } else {
                    setAnimatingViewAngles(targetAngles);
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
        } else if (zoomLevel === 0) {
            setAnimatingViewAngles({});
            prevZoomLevelRef.current = zoomLevel;
        } else {
            prevZoomLevelRef.current = zoomLevel;
        }
    }, [zoomLevel, showCCTV, showCCTVViewAngle, cctvViewAngles]);

    const mapScale = zoomLevel === 0 ? 1 : 1.3;
    const mapTransformOrigin = "center center";
    const focusDeltaPercent = Math.abs((focusTargetXPercent ?? 50) - 50);
    // 좌/우 포커스 이동 시 배경이 비는 현상 방지용 오버스캔(여유 영역)
    // - focusDeltaPercent가 커질수록 더 넓게 잡아줌
    // - 과도한 확장은 제한
    const overscanPx = Math.min(700, Math.max(120, Math.round((windowWidth * focusDeltaPercent) / 100) + 120));

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;
        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: "https://api.maptiler.com/maps/019c21f9-8624-7dcb-bcdb-d31ef1c059af/style.json?key=ny4gKYAFAR9pfkXMVnmh",
            center: [126.8136, 37.4865], // 성운동 좌표
            zoom: 15,
            minZoom: 9,
            maxZoom: 22,
            maxBounds: KOREA_BOUNDS, // 한국 범위로 이동 제한
            pitch: 45,
            bearing: 0,
            attributionControl: false,
            interactive: true,
        });

        // 누락된 맵 스프라이트 이미지 처리 (road_ 등)
        map.on("styleimagemissing", (e: { id: string }) => {
            if (map.hasImage(e.id)) return;
            map.addImage(e.id, { width: 1, height: 1, data: new Uint8ClampedArray([0, 0, 0, 0]) });
        });

        // 맵 로드 후 3D 건물 활성화 및 라벨 숨기기
        map.on("load", () => {
            const style = map.getStyle();
            if (!style || !style.layers) return;

            const REGION_LABEL_IDS = new Set(["Country labels", "Disputed country labels", "State labels", "City labels", "Capital city labels", "Town labels", "Village labels", "Place labels", "Island labels", "Archipelago labels", "Continent labels"]);

            // 모든 레이어 확인
            const layers = style.layers;
            // 레이어 처리
            layers.forEach((layer: any) => {
                const layerId = layer.id.toLowerCase();

                // 도로명, POI 등만 숨기고 지역 레이어는 유지
                if (layer.type === "symbol") {
                    if (REGION_LABEL_IDS.has(layer.id)) return; // 지역 레이어는 스킵
                    try {
                        if (map.getLayer(layer.id)) {
                            map.setLayoutProperty(layer.id, "visibility", "none");
                        }
                    } catch (e) {
                        console.warn("라벨 레이어 숨기기 실패:", layer.id, e);
                    }
                }

                const isBuildingLayer = layerId.includes("building") || layerId.includes("건물") || layerId.includes("extrusion") || layer.type === "fill-extrusion";

                if (isBuildingLayer) {
                    try {
                        if (layer.type === "fill-extrusion") {
                            // 이미 fill-extrusion이면 높이 설정
                            if (map.getLayer(layer.id)) {
                                map.setPaintProperty(layer.id, "fill-extrusion-height", [
                                    "case",
                                    ["has", "height"],
                                    ["*", ["to-number", ["get", "height"]], 1],
                                    ["has", "render_height"],
                                    ["*", ["to-number", ["get", "render_height"]], 1],
                                    ["has", "building:levels"],
                                    ["*", ["to-number", ["get", "building:levels"]], 3],
                                    15, // 기본 높이 (미터)
                                ]);
                                map.setPaintProperty(layer.id, "fill-extrusion-base", ["case", ["has", "min_height"], ["to-number", ["get", "min_height"]], 0]);
                            }
                        } else if (layer.type === "fill" && layer.source) {
                            // fill 타입을 fill-extrusion으로 변환
                            const sourceId = layer.source;
                            const sourceLayer = layer["source-layer"];

                            if (map.getSource(sourceId)) {
                                // 기존 레이어 제거
                                if (map.getLayer(layer.id)) {
                                    map.removeLayer(layer.id);
                                }

                                // fill-extrusion 레이어 추가
                                map.addLayer({
                                    id: `${layer.id}-3d`,
                                    type: "fill-extrusion",
                                    source: sourceId,
                                    "source-layer": sourceLayer,
                                    paint: {
                                        "fill-extrusion-color": "#c8c8c8",
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

            // 지역 라벨을 건물 위로 올려서 글씨가 보이도록
            REGION_LABEL_IDS.forEach((id) => {
                if (map.getLayer(id)) {
                    map.moveLayer(id);
                }
            });

            // ========== 교통정보 WMS 커스텀 프로토콜 등록 (레이어는 토글 시 동적 생성) ==========
            // 프로토콜은 한 번만 등록
            if (!(maplibregl as any)._gitsmapWmsProtocolRegistered) {
                maplibregl.addProtocol("gitsmap-wms", (params, abortController) => {
                    const urlParts = params.url.replace("gitsmap-wms://", "").split("/");
                    const z = parseInt(urlParts[0], 10);
                    const x = parseInt(urlParts[1], 10);
                    const y = parseInt(urlParts[2], 10);

                    const tileCount = Math.pow(2, z);
                    const worldSize = 20037508.342789244 * 2;
                    const tileSize = worldSize / tileCount;

                    const minX3857 = x * tileSize - 20037508.342789244;
                    const maxX3857 = (x + 1) * tileSize - 20037508.342789244;
                    const maxY3857 = 20037508.342789244 - y * tileSize;
                    const minY3857 = 20037508.342789244 - (y + 1) * tileSize;

                    const toWgs84 = proj4("EPSG:3857", "EPSG:4326");
                    const minWgs84 = toWgs84.forward([minX3857, minY3857]);
                    const maxWgs84 = toWgs84.forward([maxX3857, maxY3857]);
                    const bboxWgs84 = `${minWgs84[0]},${minWgs84[1]},${maxWgs84[0]},${maxWgs84[1]}`;

                    const wmsUrl =
                        "/gitsmap-proxy/cgi-bin/mapserv.exe?" +
                        "map=/ms4w/mapserver/mapfile/LV10.map" +
                        "&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap" +
                        "&LAYERS=LV10&STYLES=&FORMAT=PNG&TRANSPARENT=true" +
                        "&SRS=EPSG:5181&WIDTH=256&HEIGHT=256&ISBASELAYER=false" +
                        "&apikey=4825cf7feed5cc3fc4a9e3f57fd19c3e516f5a8" +
                        `&BBOX=${bboxWgs84}`;

                    return fetch(wmsUrl, { signal: abortController.signal })
                        .then((response) => {
                            if (!response.ok) throw new Error(`WMS request failed: ${response.status}`);
                            return response.arrayBuffer();
                        })
                        .then((data) => ({ data }));
                });
                (maplibregl as any)._gitsmapWmsProtocolRegistered = true;
            }
            // ========== 교통정보 WMS 프로토콜 등록 끝 ==========
        });

        mapRef.current = map;

        // 지도 이동 시 상태 업데이트
        const updateMapState = () => {
            if (onMapStateChange) {
                const center = map.getCenter();
                const zoom = map.getZoom();
                const pitch = map.getPitch();
                const bearing = map.getBearing();
                onMapStateChange({
                    center: [center.lng, center.lat],
                    zoom,
                    pitch,
                    bearing,
                });
            }
        };

        map.on("moveend", updateMapState);

        return () => {
            map.off("moveend", updateMapState);
            map.remove();
            mapRef.current = null;
        };
    }, [onMapStateChange]);

    // 토글 ON 시 로딩 상태 시작
    useEffect(() => {
        if (showTrafficLayer && !incidentData) {
            setIsTrafficLayerLoading(true);
        }
    }, [showTrafficLayer, incidentData]);

    // 실시간 교통정보 WMS 레이어 + 교통/돌발 마커 토글
    // OFF 시 레이어/소스 완전 제거로 진행 중인 타일 요청 중단
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        showTrafficLayerRef.current = showTrafficLayer;

        const trafficWmsSourceId = "gitsmap-traffic-source";
        const trafficWmsLayerId = "gitsmap-traffic-layer";
        const MARKER_KEY = "_trafficIncidentMarkers";
        const POPUP_STYLE_ID = "incident-popup-style";

        // 팝업 스타일 추가
        if (!document.getElementById(POPUP_STYLE_ID)) {
            const style = document.createElement("style");
            style.id = POPUP_STYLE_ID;
            style.textContent = `
                .incident-popup {
                    z-index: 100;
                }
                .incident-popup .maplibregl-popup-content {
                    padding: 10px;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    border: none;
                }
                .incident-popup .maplibregl-popup-close-button {
                    font-size: 18px;
                    padding: 4px 8px;
                    color: white;
                    right: 4px;
                    top: 4px;
                }
                .incident-popup .maplibregl-popup-close-button:hover {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                }
                .incident-popup .maplibregl-popup-tip {
                    border-top-color: white;
                }
            `;
            document.head.appendChild(style);
        }

        // 레이어/소스 제거 함수
        const removeWmsLayer = () => {
            try {
                if (map.getLayer && map.getLayer(trafficWmsLayerId)) {
                    map.removeLayer(trafficWmsLayerId);
                }
                if (map.getSource && map.getSource(trafficWmsSourceId)) {
                    map.removeSource(trafficWmsSourceId);
                }
            } catch {
                // map이 이미 제거된 경우 무시
            }
        };

        // 레이어/소스 추가 함수
        const addWmsLayer = () => {
            if (map.getSource(trafficWmsSourceId)) return;

            map.addSource(trafficWmsSourceId, {
                type: "raster",
                tiles: ["gitsmap-wms://{z}/{x}/{y}"],
                tileSize: 256,
            });

            map.addLayer({
                id: trafficWmsLayerId,
                type: "raster",
                source: trafficWmsSourceId,
                paint: { "raster-opacity": 0.7 },
            });
        };

        // 마커 제거 함수
        const removeMarkers = () => {
            try {
                const existing = (map as any)[MARKER_KEY] as maplibregl.Marker[] | undefined;
                if (existing) {
                    existing.forEach((m) => m.remove());
                    (map as any)[MARKER_KEY] = null;
                }
            } catch {
                // map이 이미 제거된 경우 무시
            }
        };

        // 돌발 유형에 따른 아이콘 매핑
        const getIncidentIcon = (restrictType: string): string => {
            if (restrictType.includes("사고") || restrictType.includes("차량")) return "mdi:car";
            if (restrictType.includes("공사") || restrictType.includes("철거")) return "mdi:shovel";
            if (restrictType.includes("침하") || restrictType.includes("함몰")) return "mdi:minus-circle";
            if (restrictType.includes("통제") || restrictType.includes("전차로")) return "mdi:road-variant";
            if (restrictType.includes("갓길")) return "mdi:road";
            return "mdi:alert-circle";
        };

        // 날짜 포맷 함수
        const formatDate = (dateStr: string | null): string => {
            if (!dateStr) return "-";
            // 이미 "YYYY-MM-DD HH:mm:ss" 형식인 경우 초 부분만 제거
            if (dateStr.includes("-") && dateStr.includes(":")) {
                return dateStr.slice(0, 16); // "YYYY-MM-DD HH:mm" 까지만 반환
            }
            // 연속된 숫자 형식 (예: "202507162016")인 경우
            if (dateStr.length >= 12) {
                const year = dateStr.slice(0, 4);
                const month = dateStr.slice(4, 6);
                const day = dateStr.slice(6, 8);
                const hour = dateStr.slice(8, 10);
                const min = dateStr.slice(10, 12);
                return `${year}-${month}-${day} ${hour}:${min}`;
            }
            return dateStr;
        };

        // 팝업 HTML 생성 함수
        const createPopupContent = (item: typeof incidentData extends { items: (infer T)[] } | undefined ? T : never): string => {
            const iconName = getIncidentIcon(item.restrict_type);
            const iconUrl = `https://api.iconify.design/${iconName.replace(":", "/")}.svg?color=%23e85c2a`;
            
            return `
                <div style="
                    font-family: 'Pretendard', sans-serif;
                    min-width: 280px;
                    max-width: 320px;
                    padding: 0;
                ">
                    <div style="
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 12px 14px;
                        background: linear-gradient(135deg, #e85c2a 0%, #d14d1e 100%);
                        border-radius: 8px 8px 0 0;
                        margin: -10px -10px 0 -10px;
                    ">
                        <img src="${iconUrl}" alt="" style="width: 20px; height: 20px; filter: brightness(0) invert(1);" />
                        <span style="color: white; font-weight: 600; font-size: 14px;">도로 돌발 상황</span>
                    </div>
                    
                    <div style="padding: 14px 4px 4px 4px;">
                        <div style="
                            background: #f8f9fa;
                            border-radius: 6px;
                            padding: 10px 12px;
                            margin-bottom: 10px;
                        ">
                            <div style="font-size: 13px; font-weight: 600; color: #1a1a1a; line-height: 1.4;">
                                ${escapeHtml(item.inci_desc || "정보 없음")}
                            </div>
                        </div>
                        
                        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #555;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #888;">위치</span>
                                <span style="font-weight: 500; color: #333; text-align: right; max-width: 180px;">
                                    ${escapeHtml(item.inci_place1 || "")}${item.inci_place2 ? " " + escapeHtml(item.inci_place2) : ""}
                                </span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #888;">통제 유형</span>
                                <span style="font-weight: 500; color: #e85c2a;">${escapeHtml(item.restrict_type || "-")}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #888;">발생 시간</span>
                                <span style="font-weight: 500; color: #333;">${formatDate(item.start_date)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #888;">예상 종료</span>
                                <span style="font-weight: 500; color: #333;">${formatDate(item.est_end_date)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        };

        // 마커 추가 함수
        const addMarkers = () => {
            if (!showTrafficLayerRef.current) return;
            if (!map.loaded()) {
                setTimeout(addMarkers, 100);
                return;
            }

            const incidentItems = incidentData?.items ?? [];
            
            // 기존 마커가 있고 새 데이터와 개수가 다르면 제거 후 재생성
            const existingMarkers = (map as any)[MARKER_KEY] as maplibregl.Marker[] | undefined;
            if (existingMarkers && existingMarkers.length > 0) {
                if (existingMarkers.length === incidentItems.length) {
                    return; // 동일한 데이터면 재생성 불필요
                }
                removeMarkers();
            }
            if (incidentItems.length === 0) return;

            const markers: maplibregl.Marker[] = [];
            incidentItems.forEach((item) => {
                const lng = parseFloat(item.coord_x);
                const lat = parseFloat(item.coord_y);

                if (isNaN(lng) || isNaN(lat)) return;

                const icon = getIncidentIcon(item.restrict_type);

                const container = document.createElement("div");
                container.style.cssText = "display: flex; align-items: center; justify-content: center; pointer-events: auto; cursor: pointer;";

                const iconWrapper = document.createElement("div");
                iconWrapper.style.cssText = `
                    width: 28px; height: 28px;
                    background: #e85c2a; border-radius: 6px;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3); z-index: 44;
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                `;

                const img = document.createElement("img");
                img.src = `https://api.iconify.design/${icon.replace(":", "/")}.svg?color=white`;
                img.alt = item.restrict_type;
                img.style.cssText = "width: 18px; height: 18px;";

                iconWrapper.appendChild(img);
                container.appendChild(iconWrapper);

                // 팝업 생성
                const popup = new maplibregl.Popup({
                    offset: 20,
                    closeButton: true,
                    closeOnClick: true,
                    maxWidth: "340px",
                    className: "incident-popup",
                }).setHTML(createPopupContent(item));

                const marker = new maplibregl.Marker({ element: container, anchor: "center" })
                    .setLngLat([lng, lat])
                    .setPopup(popup)
                    .addTo(map);

                // 호버 효과
                container.addEventListener("mouseenter", () => {
                    iconWrapper.style.transform = "scale(1.1)";
                    iconWrapper.style.boxShadow = "0 2px 8px rgba(232, 92, 42, 0.5)";
                });
                container.addEventListener("mouseleave", () => {
                    iconWrapper.style.transform = "scale(1)";
                    iconWrapper.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";
                });

                const el = marker.getElement();
                if (el) (el as HTMLElement).style.zIndex = "44";

                markers.push(marker);
            });

            (map as any)[MARKER_KEY] = markers;
        };

        const execute = () => {
            if (showTrafficLayer) {
                // ON: API 응답 완료 후 마커 먼저, 그 다음 WMS 레이어
                if (incidentData?.items && incidentData.items.length > 0) {
                    addMarkers();
                    // 마커 생성 후 WMS 레이어 추가, 완료 후 로딩 해제
                    setTimeout(() => {
                        addWmsLayer();
                        // WMS 레이어 렌더링 완료 대기 후 로딩 해제
                        setTimeout(() => {
                            setIsTrafficLayerLoading(false);
                        }, 300);
                    }, 150);
                }
            } else {
                // OFF: 즉시 제거 (레이어 제거 시 진행 중인 타일 요청도 중단됨)
                removeMarkers();
                removeWmsLayer();
                setIsTrafficLayerLoading(false);
            }
        };

        // 토글 OFF 시에는 스타일 로드 여부와 관계없이 즉시 제거
        if (!showTrafficLayer) {
            execute();
            return;
        }

        // 토글 ON 시에는 스타일 로드 후 실행
        if (map.isStyleLoaded()) {
            execute();
        } else {
            map.once("load", execute);
        }
    }, [showTrafficLayer, incidentData]);

    // streamMapData가 변경되면 마커와 WMS 레이어 업데이트
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const streamSourceId = "stream-marker";
        const streamLayerId = "stream-marker-layer";
        const streamClusterLayerId = "stream-marker-cluster";
        const streamClusterCountLayerId = "stream-marker-cluster-count";
        const streamHeatmapLayerId = "stream-marker-heatmap";
        const streamMarkerIconId = "stream-marker-icon";
        const streamCctvMarkerIconId = "stream-cctv-marker-icon";

        const clearStreamLayers = () => {
            // WMS 레이어 제거 (최대 10개까지)
            for (let i = 0; i < 10; i++) {
                const layerId = `wms-layer-${i}`;
                const sourceId = `wms-source-${i}`;
                if (map.getLayer(layerId)) {
                    map.removeLayer(layerId);
                }
                if (map.getSource(sourceId)) {
                    map.removeSource(sourceId);
                }
            }
            // 스트림 마커 관련 레이어 모두 제거
            if (map.getLayer(streamClusterCountLayerId)) {
                map.removeLayer(streamClusterCountLayerId);
            }
            if (map.getLayer(streamClusterLayerId)) {
                map.removeLayer(streamClusterLayerId);
            }
            if (map.getLayer(streamHeatmapLayerId)) {
                map.removeLayer(streamHeatmapLayerId);
            }
            if (map.getLayer(streamLayerId)) {
                map.removeLayer(streamLayerId);
            }
            if (map.getSource(streamSourceId)) {
                map.removeSource(streamSourceId);
            }
        };

        const addStreamMarkers = (data: MapStreamData, viewType: "individual" | "cluster" | "heatmap") => {
            const featureCollection = mapDataToFeatureCollection(data);

            // 소스 옵션: cluster 모드일 때만 클러스터링 활성화
            const sourceOptions: maplibregl.GeoJSONSourceSpecification = {
                type: "geojson",
                data: featureCollection,
                cluster: viewType === "cluster",
                clusterMaxZoom: 18,
                clusterRadius: 50,
            };

            // 기존 소스가 있으면 제거 후 다시 추가 (클러스터 옵션 변경을 위해)
            if (map.getSource(streamSourceId)) {
                // 레이어들 먼저 제거
                if (map.getLayer(streamClusterCountLayerId)) map.removeLayer(streamClusterCountLayerId);
                if (map.getLayer(streamClusterLayerId)) map.removeLayer(streamClusterLayerId);
                if (map.getLayer(streamHeatmapLayerId)) map.removeLayer(streamHeatmapLayerId);
                if (map.getLayer(streamLayerId)) map.removeLayer(streamLayerId);
                map.removeSource(streamSourceId);
            }

            // 새 소스 추가
            map.addSource(streamSourceId, sourceOptions);

            // 마커 아이콘 이미지 추가 (일반 + CCTV)
            if (!map.hasImage(streamMarkerIconId)) {
                const img = createStreamMarkerImage();
                map.addImage(streamMarkerIconId, img, { pixelRatio: PIXEL_RATIO });
            }
            if (!map.hasImage(streamCctvMarkerIconId)) {
                const cctvImg = createCCTVStreamMarkerImage();
                map.addImage(streamCctvMarkerIconId, cctvImg, { pixelRatio: PIXEL_RATIO });
            }

            // markerType에 따라 아이콘 선택: 'cctv'면 CCTV 마커, 그 외는 기본 마커
            const iconImageExpression = ["match", ["get", "markerType"], "cctv", streamCctvMarkerIconId, streamMarkerIconId] as ["match", ["get", string], string, string, string];

            // 뷰 타입별 레이어 추가
            if (viewType === "individual") {
                map.addLayer({
                    id: streamLayerId,
                    type: "symbol",
                    source: streamSourceId,
                    layout: {
                        "icon-image": iconImageExpression,
                        "icon-size": 1,
                        "icon-allow-overlap": true,
                        "icon-ignore-placement": true,
                        "icon-anchor": "center",
                    },
                });
            } else if (viewType === "cluster") {
                // 클러스터 원 레이어
                map.addLayer({
                    id: streamClusterLayerId,
                    type: "circle",
                    source: streamSourceId,
                    filter: ["has", "point_count"],
                    paint: {
                        "circle-color": ["step", ["get", "point_count"], "#ef4444", 10, "#dc2626", 50, "#b91c1c", 100, "#991b1b"],
                        "circle-radius": ["step", ["get", "point_count"], 20, 10, 25, 50, 30, 100, 40],
                        "circle-stroke-width": 2,
                        "circle-stroke-color": "rgba(255, 255, 255, 0.5)",
                    },
                });

                // 클러스터 카운트 텍스트 레이어
                map.addLayer({
                    id: streamClusterCountLayerId,
                    type: "symbol",
                    source: streamSourceId,
                    filter: ["has", "point_count"],
                    layout: {
                        "text-field": "{point_count_abbreviated}",
                        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                        "text-size": 14,
                    },
                    paint: {
                        "text-color": "#ffffff",
                    },
                });

                // 클러스터 해제된 개별 마커 레이어
                map.addLayer({
                    id: streamLayerId,
                    type: "symbol",
                    source: streamSourceId,
                    filter: ["!", ["has", "point_count"]],
                    layout: {
                        "icon-image": iconImageExpression,
                        "icon-size": 1,
                        "icon-allow-overlap": true,
                        "icon-ignore-placement": true,
                        "icon-anchor": "center",
                    },
                });
            } else if (viewType === "heatmap") {
                map.addLayer({
                    id: streamHeatmapLayerId,
                    type: "heatmap",
                    source: streamSourceId,
                    paint: {
                        "heatmap-weight": 1,
                        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 18, 3],
                        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 18, 30],
                        "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(0, 0, 255, 0)", 0.1, "rgba(65, 105, 225, 0.5)", 0.3, "rgba(0, 255, 255, 0.6)", 0.5, "rgba(0, 255, 0, 0.7)", 0.7, "rgba(255, 255, 0, 0.8)", 0.9, "rgba(255, 165, 0, 0.9)", 1, "rgba(255, 0, 0, 1)"],
                        "heatmap-opacity": 0.8,
                    },
                });
            }
        };

        /** EPSG:3857 (미터) bbox를 EPSG:4326 (경위도)로 변환 */
        const bbox3857To4326 = (minx: number, miny: number, maxx: number, maxy: number): { minLng: number; minLat: number; maxLng: number; maxLat: number } => {
            const toLon = (x: number) => (x / 20037508.34) * 180;
            const toLat = (y: number) => Math.atan(Math.exp((y / 20037508.34) * Math.PI)) * (360 / Math.PI) - 90;
            return {
                minLng: toLon(minx),
                minLat: toLat(miny),
                maxLng: toLon(maxx),
                maxLat: toLat(maxy),
            };
        };

        const addWmsLayers = (wmsLayers: MapStreamWmsLayer[]) => {
            wmsLayers.forEach((wmsLayer, idx) => {
                const sourceId = `wms-source-${idx}`;
                const layerId = `wms-layer-${idx}`;

                if (map.getSource(sourceId)) return;

                const urlObj = new URL(wmsLayer.url);
                const bboxParam = urlObj.searchParams.get("bbox");

                if (bboxParam) {
                    const parts = bboxParam.split(",").map(Number);
                    if (parts.length >= 4) {
                        const srs = urlObj.searchParams.get("srs")?.toUpperCase() ?? urlObj.searchParams.get("crs")?.toUpperCase() ?? "EPSG:3857";
                        const version = (urlObj.searchParams.get("version") ?? urlObj.searchParams.get("VERSION") ?? "1.1.1").toUpperCase();
                        let minLng: number, minLat: number, maxLng: number, maxLat: number;
                        if (srs.includes("3857")) {
                            const b = bbox3857To4326(parts[0], parts[1], parts[2], parts[3]);
                            minLng = b.minLng;
                            minLat = b.minLat;
                            maxLng = b.maxLng;
                            maxLat = b.maxLat;
                        } else if (srs.includes("4326")) {
                            const isLikelyLatLonOrder = version.startsWith("1.3") || (parts[0] >= -90 && parts[0] <= 90 && Math.abs(parts[1]) <= 180 && parts[0] !== parts[1]);
                            if (isLikelyLatLonOrder) {
                                // WMS 1.3.0 또는 위도·경도 범위로 추정: bbox = minLat, minLon, maxLat, maxLon
                                minLat = parts[0];
                                minLng = parts[1];
                                maxLat = parts[2];
                                maxLng = parts[3];
                            } else {
                                // WMS 1.1.x: bbox = minLon, minLat, maxLon, maxLat
                                minLng = parts[0];
                                minLat = parts[1];
                                maxLng = parts[2];
                                maxLat = parts[3];
                            }
                        } else {
                            minLng = parts[0];
                            minLat = parts[1];
                            maxLng = parts[2];
                            maxLat = parts[3];
                        }
                        // y축(상하) 뒤집기: 위·아래 위도 교환 [하좌, 하우, 상우, 상좌]
                        const coordinates: [[number, number], [number, number], [number, number], [number, number]] = [
                            [minLng, maxLat],
                            [maxLng, maxLat],
                            [maxLng, minLat],
                            [minLng, minLat],
                        ];
                        map.addSource(sourceId, {
                            type: "image",
                            url: urlObj.toString(),
                            coordinates,
                        });
                        if (!map.getLayer(layerId)) {
                            map.addLayer({
                                id: layerId,
                                type: "raster",
                                source: sourceId,
                                paint: {
                                    "raster-opacity": wmsLayer.opacity ?? 0.5,
                                },
                            });
                        }
                        return;
                    }
                }

                urlObj.searchParams.set("srs", "EPSG:3857");
                urlObj.searchParams.delete("bbox");
                const baseUrl = urlObj.toString() + "&bbox={bbox-epsg-3857}";

                map.addSource(sourceId, {
                    type: "raster",
                    tiles: [baseUrl],
                    tileSize: 256,
                });

                if (!map.getLayer(layerId)) {
                    map.addLayer({
                        id: layerId,
                        type: "raster",
                        source: sourceId,
                        paint: {
                            "raster-opacity": wmsLayer.opacity ?? 0.5,
                        },
                    });
                }
            });
        };

        const updateStreamData = () => {
            if (!streamMapData) {
                clearStreamLayers();
                return;
            }

            // 기존 레이어 제거
            clearStreamLayers();

            // WMS 레이어를 먼저 추가 (아래에 깔림)
            if (streamMapData.wms_layers?.length) {
                addWmsLayers(streamMapData.wms_layers);
            }

            // 마커를 나중에 추가 (위에 표시)
            if (streamMapData.markers?.length) {
                addStreamMarkers(streamMapData, streamMarkerViewType);
            }

            // 지도 뷰 이동: 마커가 있으면 bbox에 맞춰 fitBounds, 없으면 center+zoom으로 flyTo
            const markers = streamMapData.markers ?? [];
            if (markers.length >= 2) {
                const bounds = new maplibregl.LngLatBounds();
                markers.forEach((m) => {
                    if (typeof m.lng === "number" && typeof m.lat === "number" && !isNaN(m.lng) && !isNaN(m.lat)) {
                        bounds.extend([m.lng, m.lat]);
                    }
                });
                if (!bounds.isEmpty()) {
                    map.fitBounds(bounds, {
                        padding: { top: 80, bottom: 80, left: 80, right: 80 },
                        maxZoom: 18,
                        duration: 1500,
                        essential: true,
                    });
                }
            } else if (markers.length === 1) {
                const m = markers[0];
                if (typeof m.lng === "number" && typeof m.lat === "number" && !isNaN(m.lng) && !isNaN(m.lat)) {
                    map.flyTo({
                        center: [m.lng, m.lat],
                        zoom: 17,
                        duration: 1500,
                        essential: true,
                    });
                }
            } else if (streamMapData.center && streamMapData.zoom) {
                map.flyTo({
                    center: [streamMapData.center.lng, streamMapData.center.lat],
                    zoom: streamMapData.zoom,
                    duration: 1500,
                    essential: true,
                });
            }
        };

        // 클러스터 클릭 핸들러 (클러스터 모드일 때만)
        const handleClusterClick = async (e: maplibregl.MapMouseEvent) => {
            const features = map.queryRenderedFeatures(e.point, {
                layers: [streamClusterLayerId],
            });
            if (!features.length) return;

            const clusterId = features[0].properties?.cluster_id;
            if (clusterId === undefined) return;

            const source = map.getSource(streamSourceId) as maplibregl.GeoJSONSource;
            try {
                const zoom = await source.getClusterExpansionZoom(clusterId);
                const geometry = features[0].geometry;
                if (geometry.type === "Point") {
                    map.flyTo({
                        center: geometry.coordinates as [number, number],
                        zoom: zoom ?? 14,
                        duration: 500,
                    });
                }
            } catch {
                // 클러스터 확장 줌 가져오기 실패 시 무시
            }
        };

        // 개별 스트림 마커 클릭 핸들러 (individual / cluster 뷰에서만)
        const handleStreamMarkerClick = (e: maplibregl.MapMouseEvent) => {
            const features = map.queryRenderedFeatures(e.point, {
                layers: [streamLayerId],
            });
            if (!features.length) return;

            const feature = features[0];
            const geometry = feature.geometry;
            if (geometry.type !== "Point") return;

            const coords = geometry.coordinates as [number, number];
            const props = feature.properties as Record<string, string | null> | undefined;
            const title = props?.title ?? "";
            const description = props?.description ?? "";

            // 기존 팝업 제거
            const existingPopup = (map as any)._streamMarkerPopup as maplibregl.Popup | undefined;
            if (existingPopup) {
                existingPopup.remove();
            }

            const popupContent = ['<div class="stream-marker-popup__inner">', title ? `<div class=\"stream-marker-popup__title\">${escapeHtml(title)}</div>` : "", description ? `<div class=\"stream-marker-popup__desc\">${escapeHtml(description)}</div>` : "", "</div>"].filter(Boolean).join("");

            if (!title && !description) return;

            const popup = new maplibregl.Popup({
                closeButton: true,
                closeOnClick: true,
                className: "stream-marker-popup",
            })
                .setLngLat(coords)
                .setHTML(popupContent)
                .addTo(map);

            (map as any)._streamMarkerPopup = popup;
        };

        // 스트림 마커 레이어 호버 시 커서 포인터
        const handleStreamMarkerMouseEnter = () => {
            map.getCanvas().style.cursor = "pointer";
        };
        const handleStreamMarkerMouseLeave = () => {
            map.getCanvas().style.cursor = "";
        };

        // 맵이 로드된 후 실행
        const registerStreamMarkerListeners = () => {
            if (streamMarkerViewType === "cluster") {
                map.on("click", streamClusterLayerId, handleClusterClick);
            }
            if (streamMarkerViewType !== "heatmap" && map.getLayer(streamLayerId)) {
                map.on("click", streamLayerId, handleStreamMarkerClick);
                map.on("mouseenter", streamLayerId, handleStreamMarkerMouseEnter);
                map.on("mouseleave", streamLayerId, handleStreamMarkerMouseLeave);
            }
        };

        if (map.loaded()) {
            updateStreamData();
            registerStreamMarkerListeners();
        } else {
            map.once("load", () => {
                updateStreamData();
                registerStreamMarkerListeners();
            });
        }

        return () => {
            map.off("click", streamClusterLayerId, handleClusterClick);
            map.off("click", streamLayerId, handleStreamMarkerClick);
            map.off("mouseenter", streamLayerId, handleStreamMarkerMouseEnter);
            map.off("mouseleave", streamLayerId, handleStreamMarkerMouseLeave);
            const popup = (map as any)._streamMarkerPopup as maplibregl.Popup | undefined;
            if (popup) {
                popup.remove();
                (map as any)._streamMarkerPopup = undefined;
            }
        };
    }, [streamMapData, streamMarkerViewType]);

    // flyToLocation이 변경되면 지도 이동 및 마커 표시/숨김
    useEffect(() => {
        if (!mapRef.current) return;

        const map = mapRef.current;
        const oldEventMarker = (map as any)._eventMarker;

        if (flyToLocation) {
            // 기존 이벤트 마커 제거
            if (oldEventMarker) {
                oldEventMarker.remove();
            }

            // 지도 이동
            if (map.loaded()) {
                map.flyTo({
                    center: flyToLocation as [number, number],
                    zoom: 17,
                    pitch: 60,
                    bearing: -17.6 + 165, // 11번 회전 (15도 × 11 = 165도)
                    duration: 1500,
                    essential: true,
                });
            }

            // 새 이벤트 마커 생성 (일반 모드만)
            const markerContainer = document.createElement("div");
            markerContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
      `;

            const centerWrapper = document.createElement("div");
            centerWrapper.style.cssText = `
        position: relative;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

            // 펄스 효과 3개 (고속검색 모드가 아닐 때만)
            if (!showFastSearchList) {
                for (let i = 0; i < 3; i++) {
                    const pulse = document.createElement("div");
                    pulse.style.cssText = `
            position: absolute;
            width: 120px;
            height: 120px;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) translateZ(0) scale(0.8);
            animation: circle-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            animation-delay: ${i * 0.2}s;
            will-change: transform, opacity;
            pointer-events: none;
            z-index: 1;
          `;
                    const pulseInner = document.createElement("div");
                    pulseInner.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background-color: rgba(239, 68, 68, ${0.5 - i * 0.1});
          `;
                    pulse.appendChild(pulseInner);
                    centerWrapper.appendChild(pulse);
                }
            }

            // 펄스 애니메이션 keyframes 추가
            if (!document.getElementById("circle-pulse-style")) {
                const styleEl = document.createElement("style");
                styleEl.id = "circle-pulse-style";
                styleEl.textContent = `
          @keyframes circle-pulse {
            0% {
              transform: translate(-50%, -50%) translateZ(0) scale(0.8);
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -50%) translateZ(0) scale(2);
              opacity: 0;
            }
          }
        `;
                document.head.appendChild(styleEl);
            }

            // 마커 아이콘
            const markerEl = document.createElement("div");
            markerEl.style.cssText = `
        width: 28px;
        height: 28px;
        background: linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(26, 26, 26, 1) 50%, rgba(15, 15, 15, 1) 100%);
        border: 2px solid #ef4444;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3);
        cursor: pointer;
        backdrop-filter: blur(4px);
        position: relative;
        z-index: 130;
      `;

            const ringEl = document.createElement("div");
            ringEl.style.cssText = `
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        border: 2px solid rgba(239, 68, 68, 0.3);
        border-radius: 14px;
        pointer-events: none;
      `;
            markerEl.appendChild(ringEl);

            const iconEl = document.createElement("div");
            iconEl.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: #f87171;">
          <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z" />
        </svg>
      `;
            markerEl.appendChild(iconEl);

            centerWrapper.appendChild(markerEl);
            markerContainer.appendChild(centerWrapper);

            // 주소 라벨
            const labelEl = document.createElement("div");
            labelEl.style.cssText = `
        margin-top: 8px;
        padding: 6px 8px;
        border-radius: 8px;
        background: rgba(15, 15, 15, 0.95);
        border: 1px solid #31353a;
        white-space: nowrap;
        z-index: 140;
      `;
            labelEl.innerHTML = `
        <div style="font-size: 10px; color: #9ca3af; margin-bottom: 2px;">사건 발생 지점</div>
        <div style="font-size: 12px; font-weight: 600; color: white;">은하로363번길 48</div>
      `;
            markerContainer.appendChild(labelEl);

            // 새 마커 생성 및 추가
            const newMarker = new maplibregl.Marker({
                element: markerContainer,
                anchor: "center",
            })
                .setLngLat(flyToLocation as [number, number])
                .addTo(map);

            // 이벤트 마커 z-index 설정 (반경 원보다 위)
            const eventMarkerElement = newMarker.getElement();
            if (eventMarkerElement) {
                eventMarkerElement.style.zIndex = "100";
            }

            // 저장
            (map as any)._eventMarker = newMarker;
        } else {
            // 마커 제거
            if (oldEventMarker) {
                oldEventMarker.remove();
            }

            // 초기 위치로 복귀
            if (map.loaded()) {
                map.flyTo({
                    center: [126.8136, 37.4865], // 성운동 좌표
                    zoom: 15,
                    pitch: 45,
                    bearing: 0,
                    duration: 1500,
                    essential: true,
                });
            }
        }
    }, [flyToLocation, showFastSearchList]);

    // 고속검색 리스트 표시 시 지도 이동 (우측으로 130px) - 프로그래스바 닫힌 후
    useEffect(() => {
        if (!mapRef.current) return;

        const map = mapRef.current;

        if (!showFastSearchList) return;

        // 지도 이동 함수
        const moveMap = () => {
            if (!map.loaded()) {
                setTimeout(moveMap, 300);
                return;
            }

            // 현재 중심점 가져오기
            const currentCenter = map.getCenter();
            const currentZoom = map.getZoom();

            // 130px을 경도로 변환 (줌 레벨에 따라 다름)
            const pixelOffset = 130;
            const metersPerPixel = (156543.03392 * Math.cos((currentCenter.lat * Math.PI) / 180)) / Math.pow(2, currentZoom);
            const lngOffset = (pixelOffset * metersPerPixel) / 111320; // 경도 1도 = 약 111.32km

            // 우측으로 이동 (경도 증가)
            map.easeTo({
                center: [currentCenter.lng + lngOffset, currentCenter.lat],
                duration: 800,
                essential: true,
            });
        };

        moveMap();
    }, [showFastSearchList]);

    // CCTV 생성 및 표시 - 고속검색 리스트 표시 시에만
    useEffect(() => {
        if (!mapRef.current || !showFastSearchList) {
            return;
        }

        const map = mapRef.current;

        // 기존 CCTV 제거
        const oldCCTVMarkers = (map as any)._cctvMarkers;
        if (oldCCTVMarkers) {
            oldCCTVMarkers.forEach((m: any) => m.remove());
            (map as any)._cctvMarkers = null;
        }

        // CCTV 생성 함수
        const createCCTV = () => {
            // 오프셋 계산 함수
            const getScatteredOffsets = (count: number) => {
                const offsets = [];
                const radius = 0.0001; // 약 10m 반경

                if (count === 1) {
                    offsets.push({ lngOffset: 0, latOffset: 0 });
                } else if (count === 2) {
                    offsets.push({ lngOffset: -radius, latOffset: 0 });
                    offsets.push({ lngOffset: radius, latOffset: 0 });
                } else if (count === 3) {
                    offsets.push({ lngOffset: 0, latOffset: radius });
                    offsets.push({ lngOffset: -radius * 0.866, latOffset: -radius * 0.5 });
                    offsets.push({ lngOffset: radius * 0.866, latOffset: -radius * 0.5 });
                } else if (count === 4) {
                    offsets.push({ lngOffset: -radius, latOffset: radius });
                    offsets.push({ lngOffset: radius, latOffset: radius });
                    offsets.push({ lngOffset: radius, latOffset: -radius });
                    offsets.push({ lngOffset: -radius, latOffset: -radius });
                } else {
                    for (let i = 0; i < count; i++) {
                        const angle = (i / count) * Math.PI * 2;
                        offsets.push({
                            lngOffset: Math.cos(angle) * radius,
                            latOffset: Math.sin(angle) * radius,
                        });
                    }
                }
                return offsets;
            };

            // CCTV 그룹 정의
            const cctvGroups = [
                {
                    id: "A-230",
                    name: "별빛A-230",
                    location: [126.784245, 37.5056784],
                    cameras: ["고정1", "고정2", "고정3", "고정4"],
                    directions: [0, 90, 180, 270],
                },
                {
                    id: "A-444",
                    name: "별빛A-444",
                    location: [126.7828196, 37.50501939999999],
                    cameras: ["검지1", "검지2", "검지3"],
                    directions: [45, 135, 225],
                },
                {
                    id: "A-481",
                    name: "별빛A-481",
                    location: [126.7828168, 37.504067],
                    cameras: ["검지1", "검지2", "검지3", "검지4"],
                    directions: [0, 90, 180, 270],
                },
                {
                    id: "A-498",
                    name: "별빛A-498",
                    location: [126.7843434, 37.5042779],
                    cameras: ["검지1", "검지2", "검지3", "검지4"],
                    directions: [45, 135, 225, 315],
                },
                {
                    id: "A-583",
                    name: "별빛A-583",
                    location: [126.7839366, 37.5057328],
                    cameras: ["검지1 별빛", "검지2 별빛", "검지3 별빛"],
                    directions: [60, 150, 240],
                },
                {
                    id: "A-604",
                    name: "별빛A-604",
                    location: [126.7858121, 37.5047548],
                    cameras: ["검지1", "검지2"],
                    directions: [90, 270],
                },
            ];

            // 반경에 따라 CCTV 필터링
            // 200m: 별빛A-498, 별빛A-583만 보임
            // 200m 초과~400m 미만: 별빛A-498, 별빛A-583, 별빛A-444, 별빛A-481 보임
            // 400m 이상: 모든 CCTV 보임 (별빛A-604 추가)
            const filteredCctvGroups = cctvGroups.filter((group) => {
                if (appliedSearchRadius <= 200) {
                    // 200m 이하: 별빛A-498, 별빛A-583만
                    return ["A-498", "A-583"].includes(group.id);
                } else if (appliedSearchRadius < 400) {
                    // 200m 초과~399m: 별빛A-498, 별빛A-583, 별빛A-444, 별빛A-481
                    return ["A-498", "A-583", "A-444", "A-481"].includes(group.id);
                } else {
                    // 400m 이상: 모든 CCTV
                    return true;
                }
            });

            // 모든 CCTV 위치 계산
            const cctvPositions: Array<{ lng: number; lat: number; name: string; groupId: string; direction: number }> = [];

            filteredCctvGroups.forEach((group) => {
                const offsets = getScatteredOffsets(group.cameras.length);
                group.cameras.forEach((camera, index) => {
                    cctvPositions.push({
                        lng: group.location[0] + offsets[index].lngOffset,
                        lat: group.location[1] + offsets[index].latOffset,
                        name: `${group.name} ${camera}`,
                        groupId: group.id,
                        direction: group.directions[index] || 0,
                    });
                });
            });

            // 간단한 CCTV 아이콘 생성
            const createSimpleCCTV = (name: string, direction: number = 0) => {
                const el = document.createElement("div");
                el.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
      `;

                // 시야각 컨테이너 (아이콘 뒤)
                const iconContainer = document.createElement("div");
                iconContainer.style.cssText = `
        position: relative;
        width: 24px;
        height: 24px;
      `;

                // 시야각 (아이콘 뒤에 배치)
                if (showCCTVViewAngle) {
                    const viewAngleSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    viewAngleSvg.style.cssText = `
          position: absolute;
          width: 80px;
          height: 80px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(${direction - 90}deg);
          pointer-events: none;
          z-index: 0;
        `;

                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    path.setAttribute("d", "M 40 40 L 20 10 A 35 35 0 0 1 60 10 Z");
                    path.setAttribute("fill", "rgba(59, 130, 246, 0.15)");
                    path.setAttribute("stroke", "rgba(59, 130, 246, 0.4)");
                    path.setAttribute("stroke-width", "1.5");

                    viewAngleSvg.appendChild(path);
                    iconContainer.appendChild(viewAngleSvg);
                }

                const icon = document.createElement("div");
                icon.style.cssText = `
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, rgba(74, 74, 74, 1) 0%, rgba(58, 58, 58, 1) 50%, rgba(42, 42, 42, 1) 100%);
        border: 2px solid rgba(209, 213, 219, 0.8);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
        position: relative;
        z-index: 1;
      `;

                icon.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="color: #d1d5db;">
          <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z" />
        </svg>
      `;

                iconContainer.appendChild(icon);
                el.appendChild(iconContainer);

                // 라벨
                if (showCCTVName) {
                    const label = document.createElement("div");
                    label.style.cssText = `
          margin-top: 4px;
          padding: 2px 6px;
          background: rgba(26, 26, 26, 0.95);
          border: 1px solid rgb(107, 114, 128);
          border-radius: 4px;
          color: white;
          font-size: 10px;
          white-space: nowrap;
        `;
                    label.textContent = name;
                    el.appendChild(label);
                }

                return el;
            };

            // 클러스터 생성
            const createCluster = (group: any, count: number) => {
                const el = document.createElement("div");
                el.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
      `;

                const icon = document.createElement("div");
                icon.style.cssText = `
        min-width: 32px;
        height: 32px;
        padding: 0 8px;
        background: linear-gradient(135deg, rgba(74, 74, 74, 1) 0%, rgba(58, 58, 58, 1) 50%, rgba(42, 42, 42, 1) 100%);
        border: 2px solid rgba(209, 213, 219, 0.8);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
      `;

                icon.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="color: #d1d5db;">
          <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z" />
        </svg>
        <span style="font-size: 12px; font-weight: 600; color: #9ca3af;">${count}</span>
      `;

                el.appendChild(icon);

                const label = document.createElement("div");
                label.style.cssText = `
        margin-top: 4px;
        padding: 2px 6px;
        background: rgba(26, 26, 26, 0.95);
        border: 1px solid rgb(107, 114, 128);
        border-radius: 4px;
        color: white;
        font-size: 10px;
        white-space: nowrap;
      `;
                label.textContent = group.name;
                el.appendChild(label);

                return el;
            };

            // 클러스터 마커 생성 (필터링된 그룹만 사용)
            const newClusterMarkers = filteredCctvGroups.map((group) => {
                const groupCCTVs = cctvPositions.filter((pos) => pos.groupId === group.id);
                const clusterCenter = [groupCCTVs.reduce((sum, pos) => sum + pos.lng, 0) / groupCCTVs.length, groupCCTVs.reduce((sum, pos) => sum + pos.lat, 0) / groupCCTVs.length];

                const marker = new maplibregl.Marker({
                    element: createCluster(group, group.cameras.length),
                    anchor: "center",
                }).setLngLat(clusterCenter as [number, number]);

                // CCTV 클러스터 마커 z-index 설정 (반경 원보다 위)
                const markerEl = marker.getElement();
                if (markerEl) {
                    markerEl.style.zIndex = "50";
                }

                return marker;
            });

            // 개별 CCTV 마커 생성
            const newIndividualMarkers = cctvPositions.map((pos) => {
                const marker = new maplibregl.Marker({
                    element: createSimpleCCTV(pos.name, pos.direction),
                    anchor: "center",
                }).setLngLat([pos.lng, pos.lat] as [number, number]);

                // 개별 CCTV 마커 z-index 설정 (반경 원보다 위)
                const markerEl = marker.getElement();
                if (markerEl) {
                    markerEl.style.zIndex = "50";
                }

                return marker;
            });

            // 줌 레벨에 따라 클러스터/개별 전환
            const updateDisplay = () => {
                const zoom = map.getZoom();
                if (zoom >= 16.5) {
                    newClusterMarkers.forEach((m) => m.remove());
                    newIndividualMarkers.forEach((m) => m.addTo(map));
                } else {
                    newIndividualMarkers.forEach((m) => m.remove());
                    newClusterMarkers.forEach((m) => m.addTo(map));
                }
            };

            // 초기 표시
            updateDisplay();

            // 줌 이벤트 리스너
            const zoomHandler = () => updateDisplay();
            map.on("zoom", zoomHandler);

            // 저장
            (map as any)._cctvMarkers = [...newClusterMarkers, ...newIndividualMarkers];
            (map as any)._cctvZoomHandler = zoomHandler;

            // 경찰서 위치 핀 추가
            const oldPoliceMarkers = (map as any)._policeStationMarkers;
            if (oldPoliceMarkers) {
                oldPoliceMarkers.forEach((m: maplibregl.Marker) => m.remove());
            }

            const policeStationLocations = [
                { location: [126.7852, 37.5062] as [number, number], name: "별빛파출소" },
                { location: [126.7815, 37.504] as [number, number], name: "은하지구대" },
                { location: [126.786, 37.5043] as [number, number], name: "별빛경찰서" },
            ];

            const policeMarkerList: maplibregl.Marker[] = [];

            policeStationLocations.forEach((station) => {
                const container = document.createElement("div");
                container.style.cssText = "display: flex; flex-direction: column; align-items: center; pointer-events: auto;";

                const iconWrapper = document.createElement("div");
                iconWrapper.style.cssText = `
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, rgba(22, 163, 74, 0.15) 0%, rgba(26, 26, 26, 1) 50%, rgba(15, 15, 15, 1) 100%);
        border: 2px solid #16a34a;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 12px rgba(22, 163, 74, 0.4), 0 0 24px rgba(22, 163, 74, 0.15);
        backdrop-filter: blur(4px);
        z-index: 40;
      `;

                const img = document.createElement("img");
                img.src = "/police.svg";
                img.alt = station.name;
                img.style.cssText = "width: 18px; height: 18px; filter: brightness(0) saturate(100%) invert(67%) sepia(61%) saturate(459%) hue-rotate(93deg) brightness(95%) contrast(92%);";
                iconWrapper.appendChild(img);

                const label = document.createElement("div");
                label.style.cssText = `
        margin-top: 6px;
        padding: 3px 8px;
        border-radius: 6px;
        background: rgba(15, 15, 15, 0.9);
        border: 1px solid rgba(22, 163, 74, 0.4);
        white-space: nowrap;
        font-size: 11px;
        font-weight: 600;
        color: #4ade80;
      `;
                label.textContent = station.name;

                container.appendChild(iconWrapper);
                container.appendChild(label);

                const policeMarker = new maplibregl.Marker({ element: container, anchor: "center" }).setLngLat(station.location).addTo(map);

                const markerEl = policeMarker.getElement();
                if (markerEl) {
                    markerEl.style.zIndex = "40";
                }

                policeMarkerList.push(policeMarker);
            });

            (map as any)._policeStationMarkers = policeMarkerList;

            // cleanup
            return () => {
                map.off("zoom", zoomHandler);
                newClusterMarkers.forEach((m) => m.remove());
                newIndividualMarkers.forEach((m) => m.remove());
                const pMarkers = (map as any)._policeStationMarkers;
                if (pMarkers) {
                    pMarkers.forEach((m: maplibregl.Marker) => m.remove());
                    (map as any)._policeStationMarkers = null;
                }
            };
        };

        // 지도 로드 확인 및 CCTV 생성
        if (map.loaded()) {
            return createCCTV();
        } else {
            // 여러 번 재시도
            let retryCount = 0;
            const maxRetries = 10;

            const checkAndCreate = () => {
                retryCount++;
                if (map.loaded()) {
                    createCCTV();
                } else if (retryCount < maxRetries) {
                    setTimeout(checkAndCreate, 500);
                } else {
                    console.error("지도 로드 타임아웃 - CCTV 생성 실패");
                }
            };

            setTimeout(checkAndCreate, 100);

            return () => {};
        }
    }, [showFastSearchList, showCCTVName, showCCTVViewAngle, appliedSearchRadius]);

    // 고속검색 반경 원 마커 생성 - 실제 지도 좌표에 고정, 바닥에 눕힘
    useEffect(() => {
        if (!mapRef.current) return;

        const map = mapRef.current;
        const radiusCenter: [number, number] = [126.783853180335, 37.5049838114765];

        // showFastSearchList가 false면 기존 마커 제거
        if (!showFastSearchList) {
            const oldRadiusMarker = (map as any)._radiusMarker;
            if (oldRadiusMarker) {
                oldRadiusMarker.remove();
                (map as any)._radiusMarker = null;
            }
            return;
        }

        if (!fastSearchRadius || fastSearchRadius <= 0) return;

        // 기존 반경 마커 제거
        const oldRadiusMarker = (map as any)._radiusMarker;
        if (oldRadiusMarker) {
            oldRadiusMarker.remove();
        }

        // 지도 로드 확인 및 마커 생성
        const createRadiusMarker = () => {
            if (!map.loaded()) {
                setTimeout(createRadiusMarker, 500);
                return;
            }

            // 미터를 픽셀로 변환
            const zoom = map.getZoom();
            const lat = radiusCenter[1];
            const metersPerPixel = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
            const radiusInPixels = fastSearchRadius / metersPerPixel;
            const diameter = radiusInPixels * 2;

            // 반경 원 컨테이너
            const radiusContainer = document.createElement("div");
            radiusContainer.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        z-index: 1;
      `;

            const radiusWrapper = document.createElement("div");
            const currentPitch = map.getPitch();
            radiusWrapper.style.cssText = `
        position: relative;
        width: ${diameter}px;
        height: ${diameter}px;
      `;

            // radius-pulse 애니메이션 keyframes 추가
            if (!document.getElementById("radius-pulse-style")) {
                const styleEl = document.createElement("style");
                styleEl.id = "radius-pulse-style";
                styleEl.textContent = `
          @keyframes radius-pulse {
            0% {
              transform: translate(-50%, -50%) translateZ(0) scale(0.5);
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -50%) translateZ(0) scale(1);
              opacity: 0;
            }
          }
        `;
                document.head.appendChild(styleEl);
            }

            // 하늘색 펄스 3개
            for (let i = 0; i < 3; i++) {
                const pulse = document.createElement("div");
                pulse.style.cssText = `
          position: absolute;
          width: ${diameter - 4}px;
          height: ${diameter - 4}px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) translateZ(0) scale(0.5);
          animation: radius-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          animation-delay: ${i * 0.4}s;
          will-change: transform, opacity;
          pointer-events: none;
          z-index: 1;
        `;
                const pulseInner = document.createElement("div");
                pulseInner.style.cssText = `
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: rgba(59, 130, 246, ${0.4 - i * 0.08});
        `;
                pulse.appendChild(pulseInner);
                radiusWrapper.appendChild(pulse);
            }

            // 반경 원 SVG (대시 라인)
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("width", `${diameter}px`);
            svg.setAttribute("height", `${diameter}px`);
            svg.style.cssText = `
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 2;
      `;

            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", "50%");
            circle.setAttribute("cy", "50%");
            circle.setAttribute("r", `${radiusInPixels - 2}px`);
            circle.setAttribute("fill", "none");
            circle.setAttribute("stroke", "rgba(59, 130, 246, 0.8)");
            circle.setAttribute("stroke-width", "4");
            circle.setAttribute("stroke-dasharray", "8 4");

            svg.appendChild(circle);
            radiusWrapper.appendChild(svg);
            radiusContainer.appendChild(radiusWrapper);

            // 마커 생성 - pitchAlignment: 'map'으로 바닥에 눕힘
            const radiusMarker = new maplibregl.Marker({
                element: radiusContainer,
                anchor: "center",
                pitchAlignment: "map",
                rotationAlignment: "map",
            })
                .setLngLat(radiusCenter)
                .addTo(map);

            // z-index 설정 (이벤트 핀, CCTV보다 아래)
            const markerElement = radiusMarker.getElement();
            if (markerElement) {
                markerElement.style.zIndex = "1";
            }

            // 저장
            (map as any)._radiusMarker = radiusMarker;

            // zoom 변경 시 크기 업데이트
            const zoomHandler = () => {
                const newZoom = map.getZoom();
                const newMetersPerPixel = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, newZoom);
                const newRadiusInPixels = fastSearchRadius / newMetersPerPixel;
                const newDiameter = newRadiusInPixels * 2;

                radiusWrapper.style.width = `${newDiameter}px`;
                radiusWrapper.style.height = `${newDiameter}px`;

                const pulses = radiusWrapper.querySelectorAll('div[style*="animation"]');
                pulses.forEach((pulse: any) => {
                    pulse.style.width = `${newDiameter - 4}px`;
                    pulse.style.height = `${newDiameter - 4}px`;
                });

                svg.setAttribute("width", `${newDiameter}px`);
                svg.setAttribute("height", `${newDiameter}px`);
                circle.setAttribute("r", `${newRadiusInPixels - 2}px`);
            };

            map.on("zoom", zoomHandler);

            (map as any)._radiusCleanup = () => {
                map.off("zoom", zoomHandler);
                radiusMarker.remove();
            };
        };

        createRadiusMarker();

        return () => {
            const cleanup = (map as any)._radiusCleanup;
            if (cleanup) cleanup();
        };
    }, [showFastSearchList, fastSearchRadius]);

    // is3DMode와 mapBearing 변경은 이제 버튼 클릭 핸들러에서 직접 처리됨

    // localStorage에서 초기값 읽기 (클라이언트에서만)
    // 대시보드에서는 localStorage에 값이 없으면 기본값으로 true 설정
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedCCTV = localStorage.getItem("cctv-show-cctv");
            if (savedCCTV === "true") {
                setShowCCTV(true);
            } else if (savedCCTV === null || savedCCTV === "false") {
                // localStorage에 값이 없거나 false면 대시보드에서는 기본값으로 true
                setShowCCTV(true);
                setShowCCTVViewAngle(true);
                setShowCCTVName(true);
                // localStorage에도 저장
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

    // localStorage 저장은 이제 버튼 클릭 핸들러에서 직접 처리됨

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

    // showCCTV 변경 시 CCTV 마커 표시/숨김 (예측된 CCTV 제외)
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const cctvMarkers = (map as any)._cctvMarkers;
        if (cctvMarkers) {
            cctvMarkers.forEach((marker: any) => {
                const element = marker.getElement();
                if (element && !element.classList.contains("predicted-cctv-marker")) {
                    element.style.display = showCCTV ? "block" : "none";
                }
            });
        }
    }, [showCCTV]);

    // CCTV 마커 표시/숨김 제어
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const cctvMarkers = (map as any)._cctvMarkers;
        if (cctvMarkers) {
            cctvMarkers.forEach((marker: maplibregl.Marker) => {
                const element = marker.getElement();
                if (element && !element.classList.contains("predicted-cctv-marker")) {
                    element.style.display = showCCTV ? "block" : "none";
                }
            });
        }
    }, [showCCTV]);

    // 일반 이벤트 ID 목록 (event-26부터 event-33)
    const generalEventIds = new Set(["event-26", "event-27", "event-28", "event-29", "event-30", "event-31", "event-32", "event-33"]);

    const getEventIcon = (type: string) => {
        switch (type) {
            case "119-화재":
                return "mdi:fire";
            case "119-구조":
                return "mdi:ambulance";
            case "112-미아":
                return "mdi:account-child";
            case "112-치안":
                return "mdi:shield-alert";
            case "약자":
                return "mdi:account-alert";
            case "AI-배회":
                return "mdi:walk";
            case "NDMS":
                return "mdi:alert";
            case "소방서":
                return "mdi:fire-truck";
            default:
                return "mdi:map-marker";
        }
    };

    // 이벤트 ID를 기반으로 일관된 랜덤 값 생성
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

    // 기존 위치를 유지하면서 새 이벤트만 추가하기 위한 상태
    const [cachedPositions, setCachedPositions] = useState<Record<string, { left: number; top: number }>>({});

    // 새 이벤트의 위치를 계산하고 캐시에 추가
    useEffect(() => {
        if (!events || events.length === 0) {
            return;
        }

        // 새로 추가된 이벤트만 필터링 (아직 위치가 없는 이벤트)
        const newEvents = events.filter((event) => !cachedPositions[event.id]);

        if (newEvents.length === 0) {
            return;
        }

        // 기존 이벤트 + 새 이벤트 모두 포함하여 위치 계산
        const existingEventIds = Object.keys(cachedPositions);
        const existingEvents = events.filter((e) => existingEventIds.includes(e.id));
        const allEvents = [...existingEvents, ...newEvents];

        // 우선순위별로 그룹화
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

        // 각 우선순위 그룹 내부 정렬 (기존 이벤트는 순서 유지, 새 이벤트는 추가)
        Object.keys(eventsByPriority).forEach((priority) => {
            const existingPriorityEvents = eventsByPriority[priority].filter((e) => cachedPositions[e.id]);
            const newPriorityEvents = eventsByPriority[priority].filter((e) => !cachedPositions[e.id]);

            // 새 이벤트만 섞기
            newPriorityEvents.sort(() => {
                return seededRandom(`${priority}-shuffle`) - 0.5;
            });

            eventsByPriority[priority] = [...existingPriorityEvents, ...newPriorityEvents];
        });

        // 각 우선순위 그룹을 인터리빙하여 골고루 섞기
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

        // 새 이벤트의 위치만 계산 (기존 이벤트는 스킵)
        rings.forEach((ringEvents, ringIndex) => {
            if (!ringEvents || ringEvents.length === 0) {
                return;
            }

            // 기존 이벤트와 새 이벤트를 분리
            const existingRingEvents = ringEvents.filter((e) => cachedPositions[e.id]);
            const newRingEvents = ringEvents.filter((e) => !cachedPositions[e.id]);

            // 기존 이벤트는 위치를 변경하지 않으므로 새 이벤트만 계산
            if (newRingEvents.length === 0) {
                return;
            }

            // 링의 전체 이벤트 개수를 기반으로 각도 계산
            const radius = baseRadius + ringIndex * ringGap;
            const angleStep = (Math.PI * 2) / ringEvents.length;

            // 기존 이벤트의 위치를 기반으로 ringAngleOffset 역계산
            let ringAngleOffset: number;
            if (existingRingEvents.length > 0) {
                // 기존 이벤트 중 첫 번째 이벤트의 위치를 기반으로 각도 계산
                const firstExistingEvent = existingRingEvents[0];
                const firstPos = cachedPositions[firstExistingEvent.id];
                const firstIndex = ringEvents.findIndex((e) => e.id === firstExistingEvent.id);
                const dx = firstPos.left - centerX;
                const dy = firstPos.top - centerY;
                const firstAngle = Math.atan2(dy, dx);
                // 첫 번째 이벤트의 각도에서 인덱스 * angleStep을 빼서 오프셋 계산
                const firstAngleJitter = (seededRandom(`${firstExistingEvent.id}-angle`) - 0.5) * angleStep * 0.4;
                ringAngleOffset = firstAngle - firstIndex * angleStep - firstAngleJitter;
            } else {
                // 새 링인 경우 랜덤 오프셋 사용
                ringAngleOffset = seededRandom(`ring-${ringIndex}`) * angleStep;
            }

            // 새 이벤트의 위치 계산
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

        // 특정 이벤트 핀 위치 교환: event-3(오토바이 도주)와 event-7(주택 2층 연기 발생)
        const newEventIds = newEvents.map((e) => e.id);
        if (newEventIds.includes("event-3") && newEventIds.includes("event-7") && newPositions["event-3"] && newPositions["event-7"]) {
            const tempPosition = newPositions["event-3"];
            newPositions["event-3"] = newPositions["event-7"];
            newPositions["event-7"] = tempPosition;
        }

        // 새 위치를 캐시에 추가
        setCachedPositions((prev) => ({ ...prev, ...newPositions }));
    }, [events.map((e) => e.id).join(",")]); // 이벤트 ID 목록이 변경될 때만 실행

    const positionsById = useMemo(() => {
        // 현재 events에 해당하는 위치만 반환 (캐시에서 가져오기)
        const result: Record<string, { left: number; top: number }> = {};
        events.forEach((event) => {
            if (cachedPositions[event.id]) {
                result[event.id] = cachedPositions[event.id];
            }
        });
        return result;
    }, [events, cachedPositions]);

    // 선택된 이벤트를 지도 컨테이너 기준 지정된 X 위치(기본 중앙 50%)와 Y=50%로 이동시키기 위한 translate 계산
    const mapTranslate = useMemo(() => {
        // 이벤트 핀이 없으므로 자동 이동 비활성화
        return { x: 0, y: 0, offsetX: 0 };
    }, []);

    // 핀 위치 계산 - 단순히 퍼센트 위치 유지
    const getEventPosition = (event: Event) => {
        return positionsById[event.id] || { left: centerX, top: centerY };
    };

    // 소방서 고정 위치 (3개) - 더 분산
    const fireStations = useMemo(
        () => [
            { id: "fire-1", name: "안양소방서", left: 20, top: 30 },
            { id: "fire-2", name: "평촌소방서", left: 75, top: 25 },
            { id: "fire-3", name: "만안소방서", left: 30, top: 80 },
        ],
        []
    );

    // 경찰서 고정 위치 (5개) - 더 분산
    const policeStations = useMemo(
        () => [
            { id: "police-1", name: "안양경찰서", left: 15, top: 50 },
            { id: "police-2", name: "평촌경찰서", left: 80, top: 40 },
            { id: "police-3", name: "만안경찰서", left: 25, top: 75 },
            { id: "police-4", name: "비산파출소", left: 60, top: 60 },
            { id: "police-5", name: "석수파출소", left: 10, top: 20 },
        ],
        []
    );

    // 두 점 사이의 거리 계산 (퍼센트 기반)
    const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    };

    // 선택된 이벤트와 가까운 소방서/경찰서 찾기
    const nearbyStations = useMemo(() => {
        if (!selectedEventId) return { fireStations: [], policeStations: [] };

        const selectedEvent = events.find((e) => e.id === selectedEventId);
        if (!selectedEvent) return { fireStations: [], policeStations: [] };

        // event-3(오토바이 도주) 선택 시 event-14(80대 여성 쓰러짐)의 위치를 기준으로 경찰서 찾기
        let eventPosition = getEventPosition(selectedEvent);
        if (selectedEventId === "event-3") {
            const event14 = events.find((e) => e.id === "event-14");
            if (event14) {
                eventPosition = getEventPosition(event14);
            }
        }

        // 이벤트 타입에 따라 소방서 또는 경찰서 결정
        const needsFireStation = selectedEvent.type === "119-화재" || selectedEvent.type === "119-구조";
        const needsPoliceStation = selectedEvent.type === "112-미아" || selectedEvent.type === "112-치안";

        // 둘 다 필요한 경우도 있음 (기본적으로 둘 다 표시)
        const showBoth = !needsFireStation && !needsPoliceStation;

        let nearbyFire: typeof fireStations = [];
        let nearbyPolice: typeof policeStations = [];

        if (needsFireStation || showBoth) {
            // 소방서 거리 계산 및 정렬 (가까운 순)
            const fireWithDistance = fireStations.map((station) => ({
                ...station,
                distance: calculateDistance(eventPosition.left, eventPosition.top, station.left, station.top),
            }));
            nearbyFire = fireWithDistance.sort((a, b) => a.distance - b.distance).slice(0, 1); // 가까운 1개
        }

        if (needsPoliceStation || showBoth || selectedEventId === "event-3") {
            // 경찰서 거리 계산 및 정렬 (가까운 순)
            const policeWithDistance = policeStations.map((station) => ({
                ...station,
                distance: calculateDistance(eventPosition.left, eventPosition.top, station.left, station.top),
            }));
            nearbyPolice = policeWithDistance.sort((a, b) => a.distance - b.distance).slice(0, 1); // 가까운 1개
        }

        return { fireStations: nearbyFire, policeStations: nearbyPolice };
    }, [selectedEventId, events, fireStations, policeStations, positionsById]);

    return (
        <>
            <style>{`
                .stream-marker-popup .maplibregl-popup-content {
                    padding: 0;
                    border-radius: 12px;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2), 0 0 1px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e5e7eb;
                    background: #fff;
                    min-width: 140px;
                    max-width: 280px;
                }
                .stream-marker-popup .stream-marker-popup__inner {
                    padding: 12px 36px 12px 14px;
                }
                .stream-marker-popup .stream-marker-popup__title {
                    font-size: 14px;
                    font-weight: 600;
                    color: #111827;
                    line-height: 1.35;
                }
                .stream-marker-popup .stream-marker-popup__desc {
                    font-size: 13px;
                    color: #4b5563;
                    line-height: 1.45;
                    margin-top: 6px;
                }
                .stream-marker-popup .maplibregl-popup-close-button {
                    font-size: 20px;
                    padding: 6px 10px;
                    color: #6b7280;
                    right: 2px;
                    top: 2px;
                    border-radius: 8px;
                    background: transparent;
                    transition: background-color 0.15s, color 0.15s;
                }
                .stream-marker-popup .maplibregl-popup-close-button:hover {
                    background: #f3f4f6;
                    color: #111827;
                }
            `}</style>
            <div
                ref={containerRef}
                className="relative bg-[#0f0f0f] overflow-hidden"
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                }}
                onClick={(e) => {
                    // 핀이나 툴팁, 버튼이 아닌 곳을 클릭했을 때만 지도 클릭 처리
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
                    // 팝업이나 핀을 클릭한 경우 지도 클릭 이벤트 방지
                    const target = e.target as HTMLElement;
                    if (target.closest("[data-tooltip]") || target.closest("[data-event-pin]")) {
                        e.stopPropagation();
                    }
                }}>
                {/* 맵 컨트롤 버튼 - 초기 화면 + 고속검색 리스트 표시 시 */}
                {(!hideControls || showFastSearchList) && (
                    <div
                        className="absolute top-4 flex flex-col gap-2"
                        style={{
                            left: keepControlPosition ? `${leftPanelWidth + 24}px` : isAgentActive ? "104px" : showFastSearchList ? "800px" : `${leftPanelWidth + 24}px`,
                            zIndex: 250,
                        }}
                        onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (mapRef.current) {
                                    mapRef.current.zoomIn({ duration: 300 });
                                }
                                setZoomLevel((prev) => Math.min(prev + 1, 1));
                            }}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"
                            aria-label="확대">
                            <Icon icon="mdi:plus" className="w-5 h-5" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (mapRef.current) {
                                    mapRef.current.zoomOut({ duration: 300 });
                                }
                                setZoomLevel((prev) => Math.max(prev - 1, 0));
                            }}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"
                            aria-label="축소">
                            <Icon icon="mdi:minus" className="w-5 h-5" />
                        </button>
                        <div className="w-full h-px bg-gray-300 my-1" />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIs3DMode(false);
                                if (mapRef.current) {
                                    mapRef.current.easeTo({
                                        pitch: 0,
                                        duration: 500,
                                    });
                                }
                            }}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${!is3DMode ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm" : "bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"}`}
                            aria-label="2D">
                            <Icon icon="mdi:view-dashboard" className="w-5 h-5" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIs3DMode(true);
                                if (mapRef.current) {
                                    mapRef.current.easeTo({
                                        pitch: 60,
                                        duration: 500,
                                    });
                                }
                            }}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${is3DMode ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm" : "bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"}`}
                            aria-label="3D">
                            <Icon icon="mdi:cube" className="w-5 h-5" />
                        </button>
                        <div className="w-full h-px bg-gray-300 my-1" />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const newBearing = mapBearing - 15;
                                setMapBearing(newBearing);
                                if (mapRef.current) {
                                    mapRef.current.easeTo({
                                        bearing: newBearing,
                                        duration: 300,
                                    });
                                }
                            }}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"
                            aria-label="회전 왼쪽">
                            <Icon icon="mdi:rotate-left" className="w-5 h-5" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const newBearing = mapBearing + 15;
                                setMapBearing(newBearing);
                                if (mapRef.current) {
                                    mapRef.current.easeTo({
                                        bearing: newBearing,
                                        duration: 300,
                                    });
                                }
                            }}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"
                            aria-label="회전 오른쪽">
                            <Icon icon="mdi:rotate-right" className="w-5 h-5" />
                        </button>
                        <div className="w-full h-px bg-gray-300 my-1" />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isTrafficLayerLoading) return;
                                const now = Date.now();
                                if (now - trafficToggleCooldownRef.current < TRAFFIC_TOGGLE_COOLDOWN_MS) return;
                                trafficToggleCooldownRef.current = now;
                                setShowTrafficLayer((prev) => !prev);
                            }}
                            disabled={isTrafficLayerLoading}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                isTrafficLayerLoading
                                    ? "bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed"
                                    : showTrafficLayer
                                        ? "bg-[#e85c2a] hover:bg-[#d94a1a] text-white border border-[#d94a1a]/50 shadow-sm"
                                        : "bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"
                            }`}
                            aria-label="실시간 교통정보"
                            aria-pressed={showTrafficLayer}
                            aria-busy={isTrafficLayerLoading}
                            tabIndex={0}>
                            {isTrafficLayerLoading ? (
                                <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
                            ) : (
                                <Icon icon="mdi:highway" className="w-5 h-5" />
                            )}
                        </button>
                        {/* 스트림 마커 뷰 타입 전환 버튼 - 스트림 마커가 있을 때만 표시 */}
                        {streamMapData?.markers && streamMapData.markers.length > 0 && (
                            <>
                                <div className="w-full h-px bg-gray-300 my-1" />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setStreamMarkerViewType("individual");
                                    }}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${streamMarkerViewType === "individual" ? "bg-red-600 hover:bg-red-700 text-white shadow-sm" : "bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"}`}
                                    aria-label="개별 마커"
                                    aria-pressed={streamMarkerViewType === "individual"}
                                    tabIndex={0}>
                                    <Icon icon="mdi:map-marker-multiple" className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setStreamMarkerViewType("cluster");
                                    }}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${streamMarkerViewType === "cluster" ? "bg-red-600 hover:bg-red-700 text-white shadow-sm" : "bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"}`}
                                    aria-label="클러스터"
                                    aria-pressed={streamMarkerViewType === "cluster"}
                                    tabIndex={0}>
                                    <Icon icon="mdi:circle-multiple" className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setStreamMarkerViewType("heatmap");
                                    }}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${streamMarkerViewType === "heatmap" ? "bg-red-600 hover:bg-red-700 text-white shadow-sm" : "bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"}`}
                                    aria-label="히트맵"
                                    aria-pressed={streamMarkerViewType === "heatmap"}
                                    tabIndex={0}>
                                    <Icon icon="mdi:fire-circle" className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* 지도 - 박스 밖으로 */}
                <div
                    className="relative border border-[#31353a] transition-transform duration-700 ease-out"
                    style={{
                        borderWidth: "1px",
                        height: "100%",
                        width: (zoomLevel > 0 || focusDeltaPercent > 0) && !flyToLocation ? `calc(100% + ${overscanPx * 2}px)` : "100%",
                        left: (zoomLevel > 0 || focusDeltaPercent > 0) && !flyToLocation ? `-${overscanPx}px` : "0",
                        transform: flyToLocation ? "none" : `scale(${mapScale}) translate(calc(${mapTranslate.x}% + ${mapTranslate.offsetX}%), ${mapTranslate.y}%) translateZ(0)`,
                        transformOrigin: mapTransformOrigin,
                        willChange: "transform",
                        transition: "transform 0.5s ease-out, width 0.5s ease-out, left 0.5s ease-out",
                    }}>
                    <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }} />
                    <div className="absolute inset-0 bg-black/5 pointer-events-none" style={{ zIndex: 2 }}></div>

                    {/* 화각 펼쳐지는 애니메이션 스타일 */}
                    <style>{`
          @keyframes viewAngleExpand {
            0% {
              opacity: 0;
              transform: translate(-50%, -50%) rotate(var(--direction, 0deg)) scale(0.3);
            }
            100% {
              opacity: 1;
              transform: translate(-50%, -50%) rotate(var(--direction, 0deg)) scale(1);
            }
          }
          
          .view-angle-expand {
            animation: viewAngleExpand 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
            animation-delay: var(--animation-delay, 0ms);
          }
        `}</style>
                </div>

                {/* Agent Hub 버튼 - 초기: CCTV 위 30px / 1번: 아래로만 / 고속검색: 우측 하단 */}
            </div>
        </>
    );
};

export default MapView;
