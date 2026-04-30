import { Event } from '@/types';
import { Icon } from '@iconify/react';
import { useMemo, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import i18n from '@/src/i18n';
import { getCCTVIconClassName, getCCTVLabelClassName, getPrimaryButtonClassName } from '@/components/shared/styles';
import CCTVIcon from '@/components/common/CCTVIcon';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  getCCTVViewAngle as getCCTVViewAngleUtil,
  getCCTVDirection,
  generateViewAnglePath,
  getCCTVConfigMap
} from '@/lib/cctv-view-angle-utils';
import { getCCTVPanelLayout } from '@/lib/dashboard-cctv-layout';

import { useGetIncidentList } from '@/src/apis/agent/hooks';
import proj4 from 'proj4';

// EPSG:5181 (한국 중부원점 TM) 좌표계 정의
proj4.defs(
  'EPSG:5181',
  '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
);

/** gitsmap-wms 타일 요청 간 최소 간격(ms). 호출을 천천히 하기 위해 큐로 직렬화한다. */
const GITSMAP_WMS_TILE_DELAY_MS = 100;

/** gitsmap-wms 프로토콜 요청 큐 꼬리 (한 번에 하나씩, 간격 두고 실행) */
let gitsmapWmsQueueTail: Promise<void> = Promise.resolve();

import { getInitialCCTVClusters, clusterInitialCCTVs, getRoadIncidentMarkers, type InitialCCTVItem } from '@/lib/initial-cctv-clusters';
import { KOREA_BOUNDS } from '@/src/const/const';

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
  hideAgentButton?: boolean;
  /** 1키 누르기 전 초기 화면: 과천역 주변 CCTV 클러스터 표시 */
  showInitialCCTVClusters?: boolean;
  onAgentHubClick?: () => void;
  /** 교통정보 레이어 방식: "wmts" (국가교통정보센터) | "wms" (GitsMap/UTIC) */
  trafficLayerMode?: "wmts" | "wms";
}

const MapView = ({ events, highlightedEventId, onEventClick, selectedEventId, aiDetectionEventId, onMapClick, onEventHover, onToggleGeneralEvents, externalZoomLevel, onZoomLevelChange, onAiDetectionClose, hideControls = false, showFastSearch = false, showFastSearchList = false, fastSearchRadius = 300, appliedSearchRadius = 200, leftPanelWidth = 480, pinOffset = { x: 0, y: 0 }, focusTargetXPercent = 50, flyToLocation = null, externalShowCCTV, onMapStateChange, hideAgentButton = false, showInitialCCTVClusters = false, onAgentHubClick, trafficLayerMode = "wmts" }: MapViewProps) => {
  const [zoomLevel, setZoomLevel] = useState(0);
  const [cctvViewAngles, setCctvViewAngles] = useState<Record<string, number>>({});
  const [animatingViewAngles, setAnimatingViewAngles] = useState<Record<string, number>>({});
  const [showCCTV, setShowCCTV] = useState(externalShowCCTV !== undefined ? externalShowCCTV : true);
  const [showRoad, setShowRoad] = useState(false);
  const [isRoadLayerLoading, setIsRoadLayerLoading] = useState(false);

  // 도로 돌발 상황 API 조회 (토글 ON 시에만 20초마다 갱신)
  const { data: incidentData } = useGetIncidentList(showRoad);
  
  // (삭제) 전파 닫고 초기 복귀 시 showCCTV 강제 OFF 하던 effect - CCTV 컨트롤 버튼 반응 방해로 제거

  const [currentCCTVIndex, setCurrentCCTVIndex] = useState(0);
  const [showCCTVViewAngle, setShowCCTVViewAngle] = useState(true);
  const [showCCTVName, setShowCCTVName] = useState(true);
  const [is3DMode, setIs3DMode] = useState(true);

  // [DEBUG] v2 MapView 렌더 - showCCTV 등 상태 포함
  console.log('[v2 MapView] render', { showCCTV, showCCTVName, showCCTVViewAngle, hideControls, showFastSearchList, showInitialCCTVClusters, externalShowCCTV, controlsVisible: !hideControls || showFastSearchList });
  const [mapBearing, setMapBearing] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const configMap = getCCTVConfigMap();
      const defaultAngles: Record<string, number> = {};
      Object.keys(configMap).forEach(cctvId => {
        defaultAngles[cctvId] = configMap[cctvId].viewAngle;
      });
      
      const saved = localStorage.getItem('cctv-view-angles');
      if (saved) {
        try {
          const savedAngles = JSON.parse(saved);
          setCctvViewAngles({ ...defaultAngles, ...savedAngles });
        } catch (e) {
          console.warn('Failed to load CCTV view angles:', e);
          setCctvViewAngles(defaultAngles);
        }
      } else {
        setCctvViewAngles(defaultAngles);
      }

      const handleViewAngleChange = (e: CustomEvent) => {
        const { cctvId, viewAngle, cctvIds, all } = e.detail;
        if (all) {
          const newAngles: Record<string, number> = {};
          Object.keys(configMap).forEach(id => {
            newAngles[id] = viewAngle;
          });
          setCctvViewAngles(newAngles);
        } else if (cctvIds) {
          setCctvViewAngles(prev => {
            const updated = { ...prev };
            cctvIds.forEach((id: string) => {
              updated[id] = viewAngle;
            });
            return updated;
          });
        } else if (cctvId) {
          setCctvViewAngles(prev => ({
            ...prev,
            [cctvId]: viewAngle
          }));
        }
      };

      window.addEventListener('cctv-view-angle-changed', handleViewAngleChange as EventListener);
      return () => {
        window.removeEventListener('cctv-view-angle-changed', handleViewAngleChange as EventListener);
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(cctvViewAngles).length > 0) {
      localStorage.setItem('cctv-view-angles', JSON.stringify(cctvViewAngles));
    }
  }, [cctvViewAngles]);

  const getCCTVDirection = (cctvId: string, defaultDirection: number): number => {
    return defaultDirection;
  };

  const getCCTVViewAngle = (cctvId: string, defaultViewAngle: number): number => {
    if (cctvViewAngles[cctvId] !== undefined) {
      return cctvViewAngles[cctvId];
    }
    return getCCTVViewAngleUtil(cctvId, defaultViewAngle);
  };

  const setCCTVViewAngle = (cctvId: string, viewAngle: number) => {
    setCctvViewAngles(prev => ({
      ...prev,
      [cctvId]: Math.max(0, Math.min(180, viewAngle))
    }));
  };

  const formatCCTVCount = (count: number): string => {
    return count > 999 ? '999+' : count.toString();
  };

  const getCCTVIconBoxStyle = (count: number, scale: number, hasMultiple: boolean, zIndex: number = 110) => {
    return {
      zIndex,
      position: 'relative' as const,
      transform: `scale(${scale})`,
      paddingLeft: hasMultiple ? '4px' : undefined,
      paddingRight: hasMultiple ? '4px' : undefined
    };
  };
  
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
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  // CCTV 자동 롤링 제거 (무한 스크롤로 변경)

  const prevZoomLevelRef = useRef(zoomLevel);
  const animationFrameRef = useRef<number | null>(null);
  const hasFliedForInitialCCTVRef = useRef(false);
  const [isMapAnimating, setIsMapAnimating] = useState(false);

  const animatedFlyTo = (map: maplibregl.Map, options: maplibregl.FlyToOptions) => {
    setIsMapAnimating(true);
    map.once('moveend', () => setIsMapAnimating(false));
    map.flyTo(options);
  };

  const animatedEaseTo = (map: maplibregl.Map, options: maplibregl.EaseToOptions) => {
    setIsMapAnimating(true);
    map.once('moveend', () => setIsMapAnimating(false));
    map.easeTo(options);
  };
  const initialCctvClustersRef = useRef<InitialCCTVItem[] | null>(null);
  const showRoadLayerRef = useRef(false);
  const roadToggleCooldownRef = useRef(0);
  const ROAD_TOGGLE_COOLDOWN_MS = 300;

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
        Object.keys(targetAngles).forEach(cctvId => {
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
  const mapTransformOrigin = 'center center';
  const focusDeltaPercent = Math.abs((focusTargetXPercent ?? 50) - 50);
  // 좌/우 포커스 이동 시 배경이 비는 현상 방지용 오버스캔(여유 영역)
  // - focusDeltaPercent가 커질수록 더 넓게 잡아줌
  // - 과도한 확장은 제한
  const overscanPx = Math.min(
    700,
    Math.max(120, Math.round((windowWidth * focusDeltaPercent) / 100) + 120)
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://api.maptiler.com/maps/019cd585-7992-7faa-9a87-243ab5ce8247/style.json?key=WPWmpNf4y5nzKDA7mQXe',
      center: showInitialCCTVClusters ? [126.98946, 37.42822] : [126.9913292, 37.4262026],
      zoom: 15,
      minZoom: 9,
      maxZoom: 18,
      maxBounds: KOREA_BOUNDS, // 한국 범위로 이동 제한
      pitch: 45,
      bearing: 0,
      attributionControl: false,
      interactive: true,
    });

    // 누락된 맵 스프라이트 이미지 처리 (road_ 등)
    map.on('styleimagemissing', (e: { id: string }) => {
      if (map.hasImage(e.id)) return;
      map.addImage(e.id, { width: 1, height: 1, data: new Uint8ClampedArray([0, 0, 0, 0]) });
    });

    // 맵 로드 후 3D 건물 활성화 및 라벨 숨기기
    map.on('load', () => {
      // terrain 비활성화 (활성 시 먼 거리 3D 건물 렌더링 안 됨)
      map.setTerrain(null);

      const style = map.getStyle();
      if (!style || !style.layers) return;

      const layers = style.layers;
      layers.forEach((layer: any) => {
        // 도로명, 건물명 등 텍스트 라벨 숨기기
        if (layer.type === 'symbol') {
          try {
            if (map.getLayer(layer.id)) {
              map.setLayoutProperty(layer.id, 'visibility', 'none');
            }
          } catch (e) {
            console.warn('라벨 레이어 숨기기 실패:', layer.id, e);
          }
        }
      });

      // Construction 레이어 색상 변경
      if (map.getLayer('Construction')) {
        map.setPaintProperty('Construction', 'fill-color', '#514C3E');
        map.setPaintProperty('Construction', 'fill-opacity', 1);
      }

      // Residential(Built-up) 레이어 색상 변경
      if (map.getLayer('Residential')) {
        map.setPaintProperty('Residential', 'fill-color', '#514C3E');
      }

      // Heliport 레이어 색상 변경
      if (map.getLayer('Heliport')) {
        map.setPaintProperty('Heliport', 'fill-color', '#4C4E56');
      }

      // Building 3D 렌더링 안정화: minzoom을 낮춰 타일 로드 시 깜빡임 방지
      if (map.getLayer('Building 3D')) {
        map.setLayerZoomRange('Building 3D', 12, 24);
      }
      if (map.getLayer('Building')) {
        map.setLayerZoomRange('Building', 12, 24);
      }

      // Background 컬러 오버라이드
      if (map.getLayer('Background')) {
        map.setPaintProperty('Background', 'background-color', '#3F3E47');
      }

      // 산/숲/공원 컬러 오버라이드
      ['Wood', 'Forest'].forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setPaintProperty(layerId, 'fill-color', '#3C4142');
          map.setPaintProperty(layerId, 'fill-opacity', 1);
        }
      });
      ['Farmland', 'Grass'].forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setPaintProperty(layerId, 'fill-color', '#444F4A');
        }
      });

      // Residential / Construction / Industrial 컬러 오버라이드
      ['Residential', 'Construction', 'Industrial'].forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setPaintProperty(layerId, 'fill-color', '#3F3E47');
          map.setPaintProperty(layerId, 'fill-opacity', 1);
        }
      });

      // Minor road 컬러 오버라이드
      ['Minor road', 'Minor road outline', 'Minor road bridge', 'Service road', 'Service road outline', 'Pathway outline'].forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setPaintProperty(layerId, 'line-color', '#585861');
        }
      });

      // ========== 교통정보 레이어 프로토콜 설정 ==========
      // 교통정보 레이어 방식: "wmts" | "wms"
      // - "wmts": 국가교통정보센터 WMTS 타일 방식 (its.go.kr)
      // - "wms": UTIC WMS 방식 (utic-wms-proxy)
      (maplibregl as any)._trafficLayerMode = trafficLayerMode;

      // ========== 방식 1: 국가교통정보센터 WMTS 타일 (XYZ 방식) ==========
      // CORS 우회: 동일 오리진 프록시(/its-proxy) 경유로 타일 로드
      if (!(maplibregl as any)._itsWmtsProtocolRegistered) {
        // ===== WMTS 표시 범위: 서울 + 경기도 전역 =====
        // (경도, 위도) WGS84. 경기 북부(연천)·남부(안성)·서부(강화)·동부(가평) 포함
        const ITS_WMTS_BOUNDS = {
          minLon: 126.35,
          minLat: 36.9,
          maxLon: 127.85,
          maxLat: 38.25,
        };

        const isTileInSeoulGyeonggiBounds = (z: number, x: number, y: number): boolean => {
          const n = Math.pow(2, z);
          const worldSize = 20037508.342789244 * 2;
          const tileSize = worldSize / n;
          const minX3857 = x * tileSize - 20037508.342789244;
          const maxX3857 = (x + 1) * tileSize - 20037508.342789244;
          const minY3857 = 20037508.342789244 - (y + 1) * tileSize;
          const maxY3857 = 20037508.342789244 - y * tileSize;
          const toLon = (x3857: number) => (x3857 * 180) / 20037508.342789244;
          const toLat = (y3857: number) =>
            (Math.atan(Math.exp((y3857 * Math.PI) / 20037508.342789244)) * 360) / Math.PI - 90;
          const tileMinLon = toLon(minX3857);
          const tileMaxLon = toLon(maxX3857);
          const tileMinLat = toLat(minY3857);
          const tileMaxLat = toLat(maxY3857);
          const intersects =
            tileMinLon < ITS_WMTS_BOUNDS.maxLon &&
            tileMaxLon > ITS_WMTS_BOUNDS.minLon &&
            tileMinLat < ITS_WMTS_BOUNDS.maxLat &&
            tileMaxLat > ITS_WMTS_BOUNDS.minLat;
          return intersects;
        };

        // 1x1 완전 투명 PNG RGBA (범위 밖 타일용, 팔레트 초록색 방지)
        const EMPTY_PNG_BASE64 =
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';

        // ===== 요청 큐잉 시스템 (5순위 최적화) =====
        const ITS_MAX_CONCURRENT_REQUESTS = 4;
        const itsRequestQueue: Array<{
          url: string;
          resolve: (value: { data: ArrayBuffer }) => void;
          reject: (reason: Error) => void;
          abortController: AbortController;
        }> = [];
        let itsActiveRequests = 0;

        const processItsQueue = () => {
          while (itsActiveRequests < ITS_MAX_CONCURRENT_REQUESTS && itsRequestQueue.length > 0) {
            const request = itsRequestQueue.shift();
            if (!request) break;

            itsActiveRequests++;
            fetch(request.url, { signal: request.abortController.signal })
              .then((res) => {
                if (!res.ok) throw new Error(`ITS tile failed: ${res.status} ${request.url}`);
                return res.arrayBuffer();
              })
              .then((data) => {
                request.resolve({ data });
              })
              .catch((err) => {
                request.reject(err);
              })
              .finally(() => {
                itsActiveRequests--;
                processItsQueue();
              });
          }
        };

        maplibregl.addProtocol('its-wmts', (_params: { url: string }, abortController: AbortController) => {
          const directUrl = _params.url.replace('its-wmts://', 'https://');
          const tileUrl = directUrl.replace('https://its.go.kr:9443', '/its-proxy');

          const match = _params.url.match(/EPSG:3857:(\d+)\/(\d+)\/(\d+)/);
          if (match) {
            const z = parseInt(match[1], 10);
            const y = parseInt(match[2], 10);
            const x = parseInt(match[3], 10);
            if (!isTileInSeoulGyeonggiBounds(z, x, y)) {
              const binary = atob(EMPTY_PNG_BASE64);
              const arr = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
              return Promise.resolve({ data: arr.buffer });
            }
          }

          return new Promise((resolve, reject) => {
            itsRequestQueue.push({
              url: tileUrl,
              resolve,
              reject,
              abortController,
            });
            processItsQueue();
          });
        });
        (maplibregl as any)._itsWmtsProtocolRegistered = true;
      }

      // ========== 방식 2: UTIC WMS (gis.utic.go.kr GeoServer) ==========
      // 포맷: .../wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&tiled=true&LAYERS=UTIS:vi_2022_p_lvX_d&WIDTH=256&HEIGHT=256&SRS=EPSG:5181&BBOX=minx,miny,maxx,maxy
      // BBOX는 EPSG:5181(한국중부원점) 미터 단위. 타일(z,x,y)→3857→5181 변환 후 프록시 경유(CORS 대응).
      // 최적화: 지도 줌(9~18) → WMS 레벨(lv9~lv4) 매핑, BBOX 축소. TIME 파라미터로 캐시/버전 지정.
      if (!(maplibregl as any)._gitsmapWmsProtocolRegistered) {
        // 지도 줌 → WMS 레벨 매핑 (지도 줌 9~18 → lv9~lv4)
        // 줌인할수록 lv 숫자가 작아지는 구조
        const zoomToLevelMap: { minZoom: number; maxZoom: number; level: number }[] = [
          { minZoom: 9, maxZoom: 10.5, level: 9 },
          { minZoom: 10.5, maxZoom: 12, level: 8 },
          { minZoom: 12, maxZoom: 13.5, level: 7 },
          { minZoom: 13.5, maxZoom: 15, level: 6 },
          { minZoom: 15, maxZoom: 16.5, level: 5 },
          { minZoom: 16.5, maxZoom: 19, level: 4 },
        ];

        const getLevelFromZoom = (zoom: number): number => {
          for (const rule of zoomToLevelMap) {
            if (zoom >= rule.minZoom && zoom < rule.maxZoom) {
              return rule.level;
            }
          }
          return zoom < 9 ? 9 : 4;
        };

        // BBOX 축소 비율 (0.8 = 원래 크기의 80%)
        const BBOX_SCALE = 1;

        maplibregl.addProtocol('gitsmap-wms', (params: { url: string }, abortController: AbortController) => {
          const urlParts = params.url.replace('gitsmap-wms://', '').split('/');
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

          const to5181 = proj4('EPSG:3857', 'EPSG:5181');
          const min5181 = to5181.forward([minX3857, minY3857]);
          const max5181 = to5181.forward([maxX3857, maxY3857]);

          // BBOX 축소 적용 (중심 기준으로 축소)
          const centerX = (min5181[0] + max5181[0]) / 2;
          const centerY = (min5181[1] + max5181[1]) / 2;
          const halfWidth = ((max5181[0] - min5181[0]) / 2) * BBOX_SCALE;
          const halfHeight = ((max5181[1] - min5181[1]) / 2) * BBOX_SCALE;

          const scaledMinX = centerX - halfWidth;
          const scaledMaxX = centerX + halfWidth;
          const scaledMinY = centerY - halfHeight;
          const scaledMaxY = centerY + halfHeight;

          const bbox5181 = `${scaledMinX},${scaledMinY},${scaledMaxX},${scaledMaxY}`;

          // 지도 줌 기반 레벨 선택
          const level = getLevelFromZoom(z);
          const layerName = `UTIS:vi_2022_p_lv${level}_d`;

          const wmsParams = new URLSearchParams({
            SERVICE: 'WMS',
            VERSION: '1.1.1',
            REQUEST: 'GetMap',
            FORMAT: 'image/png',
            TRANSPARENT: 'true',
            tiled: 'true',
            LAYERS: layerName,
            WIDTH: '256',
            HEIGHT: '256',
            SRS: 'EPSG:5181',
            BBOX: bbox5181,
            TIME: '1773282392253',
          });
          const wmsUrl = `/utic-wms-proxy/geoserver/UTIS/wms?${wmsParams.toString()}`;

          // 큐: 이전 요청 후 최소 간격을 두고 한 번에 하나씩 실행 (호출 천천히)
          const delayWithAbort = new Promise<void>((resolve, reject) => {
            const t = setTimeout(resolve, GITSMAP_WMS_TILE_DELAY_MS);
            abortController.signal.addEventListener(
              'abort',
              () => {
                clearTimeout(t);
                reject(new DOMException('Aborted', 'AbortError'));
              },
              { once: true }
            );
          });

          const thisRequest = gitsmapWmsQueueTail
            .then(() => delayWithAbort)
            .then(() => {
              if (abortController.signal.aborted) throw new DOMException('Aborted', 'AbortError');
              return fetch(wmsUrl, {
                signal: abortController.signal,
                headers: { Accept: 'image/png' },
              });
            })
            .then((response) => {
              if (!response.ok) throw new Error(`WMS request failed: ${response.status}`);
              return response.blob();
            })
            .then((blob) => blob.arrayBuffer())
            .then((data) => ({ data }));

          gitsmapWmsQueueTail = gitsmapWmsQueueTail
            .then(() => delayWithAbort)
            .then(() => {})
            .catch(() => {});

          return thisRequest;
        });
        (maplibregl as any)._gitsmapWmsProtocolRegistered = true;
      }
      // ========== 교통정보 레이어 프로토콜 설정 끝 ==========
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
          bearing
        });
      }
    };

    map.on('moveend', updateMapState);

    const syncBearing = () => setMapBearing(map.getBearing());
    map.on('moveend', syncBearing);
    const syncPitchTo3DMode = () => setIs3DMode(map.getPitch() > 0);
    map.on('moveend', syncPitchTo3DMode);

    return () => {
      map.off('moveend', updateMapState);
      map.off('moveend', syncBearing);
      map.off('moveend', syncPitchTo3DMode);
      map.remove();
      mapRef.current = null;
    };
  }, [onMapStateChange, trafficLayerMode]);

  // 토글 ON 시 로딩 상태 시작
  useEffect(() => {
    if (showRoad && !incidentData) {
      setIsRoadLayerLoading(true);
    }
  }, [showRoad, incidentData]);

  // 도로 버튼(showRoad) → 실시간 교통정보 WMS 레이어 + 교통/돌발 마커 토글
  // OFF 시 레이어/소스 완전 제거로 진행 중인 타일 요청 중단
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    showRoadLayerRef.current = showRoad;

    const trafficWmsSourceId = 'gitsmap-traffic-source';
    const trafficWmsLayerId = 'gitsmap-traffic-layer';
    const MARKER_KEY = '_trafficIncidentMarkers';
    const POPUP_STYLE_ID = 'incident-popup-style';

    // HTML 이스케이프 함수
    const escapeHtml = (text: string): string => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    // 팝업 스타일 추가
    if (!document.getElementById(POPUP_STYLE_ID)) {
      const style = document.createElement('style');
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

    // WMTS 전용: 줌 완료 후에만 타일 로드 (이동/드래그 시에는 레이어 유지)
    const addTrafficLayerOnly = () => {
      if (map.getSource(trafficWmsSourceId) && !map.getLayer(trafficWmsLayerId)) {
        map.addLayer({
          id: trafficWmsLayerId,
          type: 'raster',
          source: trafficWmsSourceId,
          paint: { 'raster-opacity': 0.7 },
        });
      }
    };
    const removeTrafficLayerOnly = () => {
      if (map.getLayer(trafficWmsLayerId)) map.removeLayer(trafficWmsLayerId);
    };
    let wmtsIdleOff: (() => void) | null = null;

    const removeWmsLayer = () => {
      try {
        if (wmtsIdleOff) {
          wmtsIdleOff();
          wmtsIdleOff = null;
        }
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

    const addWmsLayer = () => {
      if (map.getSource(trafficWmsSourceId)) return;

      const currentTrafficLayerMode = (maplibregl as any)._trafficLayerMode || 'wmts';

      if (currentTrafficLayerMode === 'wmts') {
        // 방식 1: 국가교통정보센터 WMTS 타일 - ITS 직접 호출 (its-wmts:// 프로토콜)
        // 3순위 최적화: minzoom 10으로 설정하여 저줌에서 불필요한 타일 요청 방지
        map.addSource(trafficWmsSourceId, {
          type: 'raster',
          tiles: [
            'its-wmts://its.go.kr:9443/geoserver/gwc/service/wmts/rest/ntic:N_LEVEL_{z}/ntic:REALTIME/EPSG:3857/EPSG:3857:{z}/{y}/{x}?format=image/png8',
          ],
          tileSize: 256,
          minzoom: 10,
          maxzoom: 15,
        });
        let consecutiveErrors = 0;
        const MAX_CONSECUTIVE_ERRORS = 5;
        const ERROR_RESET_TIMEOUT = 30000;
        map.on('error', (e: maplibregl.ErrorEvent) => {
          if (e.error?.message?.includes('ITS tile') || e.error?.message?.includes('its.go.kr')) {
            consecutiveErrors++;
            console.warn(`[ITS WMTS] 타일 로드 에러 (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`, e.error?.message);
            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              console.error('[ITS WMTS] 연속 에러 발생 - 레이어 일시 비활성화');
              if (map.getLayer(trafficWmsLayerId)) {
                map.setPaintProperty(trafficWmsLayerId, 'raster-opacity', 0.3);
              }
            }
            setTimeout(() => {
              if (consecutiveErrors > 0) {
                consecutiveErrors = Math.max(0, consecutiveErrors - 1);
                if (consecutiveErrors < MAX_CONSECUTIVE_ERRORS && map.getLayer(trafficWmsLayerId)) {
                  map.setPaintProperty(trafficWmsLayerId, 'raster-opacity', 0.7);
                }
              }
            }, ERROR_RESET_TIMEOUT);
          }
        });
      } else {
        // 방식 2: GitsMap WMS 커스텀 프로토콜 (UTIC WMS)
        map.addSource(trafficWmsSourceId, {
          type: 'raster',
          tiles: ['gitsmap-wms://{z}/{x}/{y}'],
          tileSize: 256,
        });
      }

      map.addLayer({
        id: trafficWmsLayerId,
        type: 'raster',
        source: trafficWmsSourceId,
        paint: { 'raster-opacity': 0.7 },
      });

      // WMTS 전용: 줌 중에만 레이어 제거 → 줌 완료 후 레이어 재추가 (이동/드래그 시에는 레이어 유지)
      if (currentTrafficLayerMode === 'wmts') {
        map.on('zoomstart', removeTrafficLayerOnly);
        map.on('zoomend', addTrafficLayerOnly);
        wmtsIdleOff = () => {
          map.off('zoomstart', removeTrafficLayerOnly);
          map.off('zoomend', addTrafficLayerOnly);
        };
      }
    };

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
      if (restrictType.includes('사고') || restrictType.includes('차량')) return 'mdi:car';
      if (restrictType.includes('공사') || restrictType.includes('철거')) return 'mdi:shovel';
      if (restrictType.includes('침하') || restrictType.includes('함몰')) return 'mdi:minus-circle';
      if (restrictType.includes('통제') || restrictType.includes('전차로')) return 'mdi:road-variant';
      if (restrictType.includes('갓길')) return 'mdi:road';
      return 'mdi:alert-circle';
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
      const iconUrl = `https://api.iconify.design/${iconName.replace(':', '/')}.svg?color=%23e85c2a`;
      
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
                ${escapeHtml(item.inci_desc || '정보 없음')}
              </div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #555;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">위치</span>
                <span style="font-weight: 500; color: #333; text-align: right; max-width: 180px;">
                  ${escapeHtml(item.inci_place1 || '')}${item.inci_place2 ? ' ' + escapeHtml(item.inci_place2) : ''}
                </span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">통제 유형</span>
                <span style="font-weight: 500; color: #e85c2a;">${escapeHtml(item.restrict_type || '-')}</span>
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

    const addMarkers = () => {
      if (!showRoadLayerRef.current) return;
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

        const container = document.createElement('div');
        container.style.cssText = 'display: flex; align-items: center; justify-content: center; pointer-events: auto; cursor: pointer;';

        const iconWrapper = document.createElement('div');
        iconWrapper.style.cssText = `
          width: 28px; height: 28px;
          background: #e85c2a; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3); z-index: 44;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        `;

        const img = document.createElement('img');
        img.src = `https://api.iconify.design/${icon.replace(':', '/')}.svg?color=white`;
        img.alt = item.restrict_type;
        img.style.cssText = 'width: 18px; height: 18px;';

        iconWrapper.appendChild(img);
        container.appendChild(iconWrapper);

        // 팝업 생성
        const popup = new maplibregl.Popup({
          offset: 20,
          closeButton: true,
          closeOnClick: true,
          maxWidth: '340px',
          className: 'incident-popup',
        }).setHTML(createPopupContent(item));

        const marker = new maplibregl.Marker({ element: container, anchor: 'center' })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map);

        // 호버 효과
        container.addEventListener('mouseenter', () => {
          iconWrapper.style.transform = 'scale(1.1)';
          iconWrapper.style.boxShadow = '0 2px 8px rgba(232, 92, 42, 0.5)';
        });
        container.addEventListener('mouseleave', () => {
          iconWrapper.style.transform = 'scale(1)';
          iconWrapper.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
        });

        const el = marker.getElement();
        if (el) (el as HTMLElement).style.zIndex = '44';

        markers.push(marker);
      });

      (map as any)[MARKER_KEY] = markers;
    };

    const execute = () => {
      if (showRoad) {
        // ON: API 응답 완료 후 마커 먼저, 그 다음 WMS 레이어
        if (incidentData?.items && incidentData.items.length > 0) {
          addMarkers();
          // 마커 생성 후 WMS 레이어 추가, 완료 후 로딩 해제
          setTimeout(() => {
            addWmsLayer();
            // WMS 레이어 렌더링 완료 대기 후 로딩 해제
            setTimeout(() => {
              setIsRoadLayerLoading(false);
            }, 300);
          }, 150);
        }
      } else {
        // OFF: 즉시 제거 (레이어 제거 시 진행 중인 타일 요청도 중단됨)
        removeMarkers();
        removeWmsLayer();
        setIsRoadLayerLoading(false);
      }
    };

    // 토글 OFF 시에는 스타일 로드 여부와 관계없이 즉시 제거
    if (!showRoad) {
      execute();
      return;
    }

    // 토글 ON 시에는 스타일 로드 후 실행
    if (map.isStyleLoaded()) {
      execute();
    } else {
      map.once('load', execute);
    }
  }, [showRoad, incidentData]);

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
      
      if (map.loaded()) {
        animatedFlyTo(map, {
          center: flyToLocation as [number, number],
          zoom: 17,
          pitch: 60,
          bearing: -17.6 + 165,
          duration: 1500,
          essential: true
        });
      }
      
      // 새 이벤트 마커 생성 (일반 모드만)
      const markerContainer = document.createElement('div');
      markerContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
      `;
      
      const centerWrapper = document.createElement('div');
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
          const pulse = document.createElement('div');
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
          const pulseInner = document.createElement('div');
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
      if (!document.getElementById('circle-pulse-style')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'circle-pulse-style';
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
      const markerEl = document.createElement('div');
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
      
      const ringEl = document.createElement('div');
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
      
      const iconEl = document.createElement('div');
      iconEl.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: #f87171;">
          <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z" />
        </svg>
      `;
      markerEl.appendChild(iconEl);
      
      centerWrapper.appendChild(markerEl);
      markerContainer.appendChild(centerWrapper);
      
      // 주소 라벨: 1번키 이벤트는 영문 모드에서 짧은 영문, 그 외는 이벤트 주소
      const isEvent1 = selectedEventId === 'A-20260107-004';
      const selectedEvent = events.find(e => e.id === selectedEventId || e.eventId === selectedEventId);
      const isEN = (i18n.resolvedLanguage || i18n.language || 'ko').startsWith('en');
      const fallbackLabel = isEN ? 'Incident location' : '사건 발생 지점';
      const labelAddress = isEvent1
        ? (isEN ? '48 Galaxy St' : '은하로363번길 48')
        : (selectedEvent?.location?.name ?? fallbackLabel);
      const labelEl = document.createElement('div');
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
        <div style="font-size: 10px; color: #9ca3af; margin-bottom: 2px;">${isEN ? 'Incident location' : '사건 발생 지점'}</div>
        <div style="font-size: 12px; font-weight: 600; color: white;">${labelAddress}</div>
      `;
      markerContainer.appendChild(labelEl);
      
      // 새 마커 생성 및 추가
      const newMarker = new maplibregl.Marker({
        element: markerContainer,
        anchor: 'center'
      })
        .setLngLat(flyToLocation as [number, number])
        .addTo(map);
      
      // 이벤트 마커 z-index 설정 (반경 원보다 위)
      const eventMarkerElement = newMarker.getElement();
      if (eventMarkerElement) {
        eventMarkerElement.style.zIndex = '100';
      }
      
      // 저장
      (map as any)._eventMarker = newMarker;
      
    } else {
      // 마커 제거
      if (oldEventMarker) {
        oldEventMarker.remove();
      }
      
      if (!showInitialCCTVClusters && map.loaded()) {
        animatedFlyTo(map, {
          center: [126.9913292, 37.4262026],
          zoom: 15,
          pitch: 45,
          bearing: 0,
          duration: 1500,
          essential: true
        });
      }
    }
  }, [flyToLocation, showFastSearchList, selectedEventId, events]);

  // 초기 화면용 CCTV 클러스터 (1키 누르기 전, 과천역 주변 5개 동)
  useEffect(() => {
    console.log('[v2 MapView] 초기CCTV effect 진입', { showInitialCCTVClusters, showCCTVName, showCCTVViewAngle, showCCTV });
    if (!showInitialCCTVClusters) {
      hasFliedForInitialCCTVRef.current = false;
      initialCctvClustersRef.current = null;
      if (mapRef.current) {
        const map = mapRef.current;
        ['_initialCctvMarkers', '_initialRoadIncidentMarkers'].forEach((key) => {
          const markers = (map as any)[key];
          if (markers) {
            markers.forEach((m: maplibregl.Marker) => m.remove());
            (map as any)[key] = null;
          }
        });
      }
      return;
    }
    if (!mapRef.current) return;

    const map = mapRef.current!;
    ['_initialCctvMarkers', '_initialRoadIncidentMarkers'].forEach((key) => {
      const old = (map as any)[key];
      if (old) {
        old.forEach((m: maplibregl.Marker) => m.remove());
        (map as any)[key] = null;
      }
    });

    const createSimpleCCTV = (name: string, direction: number, showName: boolean, showViewAngle: boolean) => {
      const el = document.createElement('div');
      el.className = 'initial-cctv-marker';
      el.style.cssText = 'display: flex; flex-direction: column; align-items: center;';

      const iconContainer = document.createElement('div');
      iconContainer.style.cssText = 'position: relative; width: 24px; height: 24px;';

      // 시야각: 항상 DOM에 추가, data-cctv-viewangle으로 나중에 토글
      const viewAngleSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      viewAngleSvg.setAttribute('data-cctv-viewangle', '1');
      viewAngleSvg.style.cssText = `
        position: absolute; width: 120px; height: 120px; top: 50%; left: 50%;
        transform: translate(-50%, -50%) rotate(${direction - 90}deg);
        pointer-events: none; z-index: 0;
        display: ${showViewAngle ? 'block' : 'none'};
      `;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M 60 60 L 30 15 A 52 52 0 0 1 90 15 Z');
      path.setAttribute('fill', 'rgba(147, 51, 234, 0.28)');
      path.setAttribute('stroke', 'rgba(147, 51, 234, 0.65)');
      path.setAttribute('stroke-width', '2');
      viewAngleSvg.appendChild(path);
      iconContainer.appendChild(viewAngleSvg);

      const icon = document.createElement('div');
      icon.style.cssText = `
        width: 24px; height: 24px;
        background: linear-gradient(135deg, rgba(74,74,74,1) 0%, rgba(58,58,58,1) 50%, rgba(42,42,42,1) 100%);
        border: 2px solid rgba(209,213,219,0.8); border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 0 20px rgba(0,0,0,0.5); position: relative; z-index: 1;
      `;
      icon.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="color:#d1d5db">
          <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z" />
        </svg>
      `;
      iconContainer.appendChild(icon);
      el.appendChild(iconContainer);

      // 라벨: 항상 DOM에 추가, data-cctv-label로 나중에 토글
      const label = document.createElement('div');
      label.setAttribute('data-cctv-label', '1');
      label.style.cssText = `
        margin-top: 4px; padding: 2px 6px; background: rgba(26,26,26,0.95);
        border: 1px solid rgb(107,114,128); border-radius: 4px;
        color: white; font-size: 10px; white-space: nowrap;
        display: ${showName ? 'block' : 'none'};
      `;
      label.textContent = name;
      el.appendChild(label);

      return el;
    };

    const createClusterMarker = (groupName: string, count: number) => {
      const el = document.createElement('div');
      el.className = 'initial-cctv-marker initial-cctv-cluster';
      el.style.cssText = 'display: flex; flex-direction: column; align-items: center; cursor: default;';

      const icon = document.createElement('div');
      icon.style.cssText = `
        min-width: 32px; height: 32px; padding: 0 8px;
        background: linear-gradient(135deg, rgba(74,74,74,1) 0%, rgba(58,58,58,1) 50%, rgba(42,42,42,1) 100%);
        border: 2px solid rgba(209,213,219,0.8); border-radius: 16px;
        display: flex; align-items: center; justify-content: center; gap: 4px;
        box-shadow: 0 0 20px rgba(0,0,0,0.5);
      `;
      icon.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="color:#d1d5db">
          <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z" />
        </svg>
        <span style="font-size: 12px; font-weight: 600; color: #9ca3af;">${count}</span>
      `;
      el.appendChild(icon);

      const label = document.createElement('div');
      label.setAttribute('data-cctv-label', '1');
      label.style.cssText = `
        margin-top: 4px; padding: 2px 6px; background: rgba(26,26,26,0.95);
        border: 1px solid rgb(107,114,128); border-radius: 4px;
        color: white; font-size: 10px; white-space: nowrap;
        display: ${showCCTVName ? 'block' : 'none'};
      `;
      label.textContent = groupName;
      el.appendChild(label);
      return el;
    };

    // 랜덤 좌표는 최초 진입 시 1회만 생성, 컨트롤 토글 시에는 캐시 사용
    if (!initialCctvClustersRef.current) {
      initialCctvClustersRef.current = getInitialCCTVClusters();
    }
    const items = initialCctvClustersRef.current;
    const clusters = clusterInitialCCTVs(items);

    const addMarkers = () => {
      if (!map.loaded()) {
        setTimeout(addMarkers, 100);
        return;
      }
      if (!hasFliedForInitialCCTVRef.current) {
        hasFliedForInitialCCTVRef.current = true;
      }
      const visible = externalShowCCTV === false ? false : showCCTV;

      const clusterMarkers = clusters.map((group) => {
        const el = createClusterMarker(group.name, group.items.length);
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([group.centerLng, group.centerLat]);
        const markerEl = marker.getElement();
        if (markerEl) {
          markerEl.style.zIndex = '45';
          (markerEl as HTMLElement).style.display = visible ? 'flex' : 'none';
        }
        return marker;
      });

      const clusteredItemIds = new Set(clusters.flatMap((c) => c.items.map((i) => i.id)));
      const individualMarkerEntries = items.map((item) => {
        const el = createSimpleCCTV(item.name, item.direction, showCCTVName, showCCTVViewAngle);
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([item.lng, item.lat]);
        const markerEl = marker.getElement();
        if (markerEl) {
          markerEl.style.zIndex = '45';
          (markerEl as HTMLElement).style.display = visible ? 'flex' : 'none';
        }
        return { item, marker };
      });
      const individualMarkers = individualMarkerEntries.map((e) => e.marker);

      const updateDisplay = () => {
        const zoom = map.getZoom();
        if (zoom >= 16.5) {
          clusterMarkers.forEach((m) => m.remove());
          individualMarkers.forEach((m) => m.addTo(map));
        } else {
          individualMarkerEntries.forEach(({ item, marker }) => {
            marker.remove();
            if (!clusteredItemIds.has(item.id)) marker.addTo(map);
          });
          clusterMarkers.forEach((m) => m.addTo(map));
        }
      };

      updateDisplay();

      const zoomHandler = () => updateDisplay();
      map.on('zoom', zoomHandler);
      (map as any)._initialCctvZoomHandler = zoomHandler;

      (map as any)._initialCctvMarkers = [...clusterMarkers, ...individualMarkers];
    };

    addMarkers();

    return () => {
      const zoomHandler = (map as any)._initialCctvZoomHandler;
      if (zoomHandler) {
        map.off('zoom', zoomHandler);
        (map as any)._initialCctvZoomHandler = null;
      }
      ['_initialCctvMarkers'].forEach((key) => {
        const current = (map as any)[key];
        if (current) {
          current.forEach((m: maplibregl.Marker) => m.remove());
          (map as any)[key] = null;
        }
      });
    };
  }, [showInitialCCTVClusters, showCCTV]);

  // 초기 CCTV 마커 visibility 업데이트 (showCCTV 토글 시 - CCTV 컨트롤 버튼으로 제어)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !showInitialCCTVClusters) return;
    const markers = (map as any)._initialCctvMarkers;
    if (markers) {
      markers.forEach((marker: maplibregl.Marker) => {
        const el = marker.getElement();
        if (el) {
          (el as HTMLElement).style.display = showCCTV ? 'flex' : 'none';
        }
      });
    }
  }, [showInitialCCTVClusters, showCCTV]);

  // 초기 CCTV 마커 라벨·시야각 업데이트 (라벨/시야각 버튼 토글 시 - 마커 재생성 없이 DOM만 갱신)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !showInitialCCTVClusters) return;
    const markers = (map as any)._initialCctvMarkers;
    if (!markers) return;
    markers.forEach((marker: maplibregl.Marker) => {
      const el = marker.getElement() as HTMLElement | null;
      if (!el) return;
      const labelEl = el.querySelector<HTMLElement>('[data-cctv-label]');
      const viewAngleEl = el.querySelector<HTMLElement>('[data-cctv-viewangle]');
      if (labelEl) labelEl.style.display = showCCTVName ? 'block' : 'none';
      if (viewAngleEl) viewAngleEl.style.display = showCCTVViewAngle ? 'block' : 'none';
    });
  }, [showInitialCCTVClusters, showCCTVName, showCCTVViewAngle]);

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
      const metersPerPixel = 156543.03392 * Math.cos(currentCenter.lat * Math.PI / 180) / Math.pow(2, currentZoom);
      const lngOffset = (pixelOffset * metersPerPixel) / 111320; // 경도 1도 = 약 111.32km
      
      animatedEaseTo(map, {
        center: [currentCenter.lng + lngOffset, currentCenter.lat],
        duration: 800,
        essential: true
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
            latOffset: Math.sin(angle) * radius
          });
        }
      }
      return offsets;
    };
    
    // CCTV 그룹 정의 — 영문 모드에서는 짧은 영문 prefix와 cam 라벨 사용
    const isENMap = (i18n.resolvedLanguage || i18n.language || 'ko').startsWith('en');
    const cctvName = (suffix: string) => isENMap ? `STAR-${suffix}` : `별빛${suffix}`;
    const detLabel = (n: number) => isENMap ? `Det.${n}` : `검지${n}`;
    const fixedLabel = (n: number) => isENMap ? `Cam${n}` : `고정${n}`;
    const detStarLabel = (n: number) => isENMap ? `Det.${n}` : `검지${n} 별빛`;
    const cctvGroups = [
      {
        id: 'A-230',
        name: cctvName('A-230'),
        location: [126.996951819665, 37.435964588524],
        cameras: [fixedLabel(1), fixedLabel(2), fixedLabel(3), fixedLabel(4)],
        directions: [0, 90, 180, 270]
      },
      {
        id: 'A-444',
        name: cctvName('A-444'),
        location: [126.995526419665, 37.435305588524],
        cameras: [detLabel(1), detLabel(2), detLabel(3)],
        directions: [45, 135, 225]
      },
      {
        id: 'A-481',
        name: cctvName('A-481'),
        location: [126.995523619665, 37.434353188524],
        cameras: [detLabel(1), detLabel(2), detLabel(3), detLabel(4)],
        directions: [0, 90, 180, 270]
      },
      {
        id: 'A-498',
        name: cctvName('A-498'),
        location: [126.997050219665, 37.434564088524],
        cameras: [detLabel(1), detLabel(2), detLabel(3), detLabel(4)],
        directions: [45, 135, 225, 315]
      },
      {
        id: 'A-583',
        name: cctvName('A-583'),
        location: [126.996643419665, 37.436018988524],
        cameras: [detStarLabel(1), detStarLabel(2), detStarLabel(3)],
        directions: [60, 150, 240]
      },
      {
        id: 'A-604',
        name: cctvName('A-604'),
        location: [126.998518919665, 37.435040988524],
        cameras: [detLabel(1), detLabel(2)],
        directions: [90, 270]
      }
    ];
    
    // 반경에 따라 CCTV 필터링
    // 200m: 별빛A-498, 별빛A-583만 보임
    // 200m 초과~400m 미만: 별빛A-498, 별빛A-583, 별빛A-444, 별빛A-481 보임
    // 400m 이상: 모든 CCTV 보임 (별빛A-604 추가)
    const filteredCctvGroups = cctvGroups.filter(group => {
      if (appliedSearchRadius <= 200) {
        // 200m 이하: 별빛A-498, 별빛A-583만
        return ['A-498', 'A-583'].includes(group.id);
      } else if (appliedSearchRadius < 400) {
        // 200m 초과~399m: 별빛A-498, 별빛A-583, 별빛A-444, 별빛A-481
        return ['A-498', 'A-583', 'A-444', 'A-481'].includes(group.id);
      } else {
        // 400m 이상: 모든 CCTV
        return true;
      }
    });
    
    // 모든 CCTV 위치 계산
    const cctvPositions: Array<{ lng: number; lat: number; name: string; groupId: string; direction: number }> = [];
    
    filteredCctvGroups.forEach(group => {
      const offsets = getScatteredOffsets(group.cameras.length);
      group.cameras.forEach((camera, index) => {
        cctvPositions.push({
          lng: group.location[0] + offsets[index].lngOffset,
          lat: group.location[1] + offsets[index].latOffset,
          name: `${group.name} ${camera}`,
          groupId: group.id,
          direction: group.directions[index] || 0
        });
      });
    });
    
    // 간단한 CCTV 아이콘 생성
    const createSimpleCCTV = (name: string, direction: number = 0) => {
      const el = document.createElement('div');
      el.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
      `;
      
      // 시야각 컨테이너 (아이콘 뒤)
      const iconContainer = document.createElement('div');
      iconContainer.style.cssText = `
        position: relative;
        width: 24px;
        height: 24px;
      `;
      
      // 시야각 (아이콘 뒤에 배치)
      if (showCCTVViewAngle) {
        const viewAngleSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        viewAngleSvg.style.cssText = `
          position: absolute;
          width: 120px;
          height: 120px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(${direction - 90}deg);
          pointer-events: none;
          z-index: 0;
        `;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M 60 60 L 30 15 A 52 52 0 0 1 90 15 Z');
        path.setAttribute('fill', 'rgba(147, 51, 234, 0.28)');
        path.setAttribute('stroke', 'rgba(147, 51, 234, 0.65)');
        path.setAttribute('stroke-width', '2');
        
        viewAngleSvg.appendChild(path);
        iconContainer.appendChild(viewAngleSvg);
      }
      
      const icon = document.createElement('div');
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
        const label = document.createElement('div');
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
      const el = document.createElement('div');
      el.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
      `;
      
      const icon = document.createElement('div');
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
      
      const label = document.createElement('div');
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
    const newClusterMarkers = filteredCctvGroups.map(group => {
      const groupCCTVs = cctvPositions.filter(pos => pos.groupId === group.id);
      const clusterCenter = [
        groupCCTVs.reduce((sum, pos) => sum + pos.lng, 0) / groupCCTVs.length,
        groupCCTVs.reduce((sum, pos) => sum + pos.lat, 0) / groupCCTVs.length,
      ];
      
      const marker = new maplibregl.Marker({
        element: createCluster(group, group.cameras.length),
        anchor: 'center'
      })
        .setLngLat(clusterCenter as [number, number]);
      
      // CCTV 클러스터 마커 z-index 설정 (반경 원보다 위)
      const markerEl = marker.getElement();
      if (markerEl) {
        markerEl.style.zIndex = '50';
      }
      
      return marker;
    });
    
    // 개별 CCTV 마커 생성
    const newIndividualMarkers = cctvPositions.map((pos) => {
      const marker = new maplibregl.Marker({
        element: createSimpleCCTV(pos.name, pos.direction),
        anchor: 'center'
      })
        .setLngLat([pos.lng, pos.lat] as [number, number]);
      
      // 개별 CCTV 마커 z-index 설정 (반경 원보다 위)
      const markerEl = marker.getElement();
      if (markerEl) {
        markerEl.style.zIndex = '50';
      }
      
      return marker;
    });
    
    // 줌 레벨에 따라 클러스터/개별 전환
    const updateDisplay = () => {
      const zoom = map.getZoom();
      if (zoom >= 16.5) {
        newClusterMarkers.forEach(m => m.remove());
        newIndividualMarkers.forEach(m => m.addTo(map));
      } else {
        newIndividualMarkers.forEach(m => m.remove());
        newClusterMarkers.forEach(m => m.addTo(map));
      }
    };
    
    // 초기 표시
    updateDisplay();
    
    // 줌 이벤트 리스너
    const zoomHandler = () => updateDisplay();
    map.on('zoom', zoomHandler);
    
    // 저장
    (map as any)._cctvMarkers = [...newClusterMarkers, ...newIndividualMarkers];
    (map as any)._cctvZoomHandler = zoomHandler;
    
    // 경찰서 위치 핀 추가
    const oldPoliceMarkers = (map as any)._policeStationMarkers;
    if (oldPoliceMarkers) {
      oldPoliceMarkers.forEach((m: maplibregl.Marker) => m.remove());
    }
    
    const policeStationLocations = isENMap
      ? [
          { location: [126.997906819665, 37.436486188524] as [number, number], name: 'Star Police Box' },
          { location: [126.994206819665, 37.434286188524] as [number, number], name: 'Galaxy Substation' },
          { location: [126.998706819665, 37.434586188524] as [number, number], name: 'Star Police HQ' },
        ]
      : [
          { location: [126.997906819665, 37.436486188524] as [number, number], name: '별빛파출소' },
          { location: [126.994206819665, 37.434286188524] as [number, number], name: '은하지구대' },
          { location: [126.998706819665, 37.434586188524] as [number, number], name: '별빛경찰서' },
        ];
    
    const policeMarkerList: maplibregl.Marker[] = [];
    
    policeStationLocations.forEach((station) => {
      const container = document.createElement('div');
      container.style.cssText = 'display: flex; flex-direction: column; align-items: center; pointer-events: auto;';
      
      const iconWrapper = document.createElement('div');
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
      
      const img = document.createElement('img');
      img.src = '/police.svg';
      img.alt = station.name;
      img.style.cssText = 'width: 18px; height: 18px; filter: brightness(0) saturate(100%) invert(67%) sepia(61%) saturate(459%) hue-rotate(93deg) brightness(95%) contrast(92%);';
      iconWrapper.appendChild(img);
      
      const label = document.createElement('div');
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
      
      const policeMarker = new maplibregl.Marker({ element: container, anchor: 'center' })
        .setLngLat(station.location)
        .addTo(map);
      
      const markerEl = policeMarker.getElement();
      if (markerEl) {
        markerEl.style.zIndex = '40';
      }
      
      policeMarkerList.push(policeMarker);
    });
    
    (map as any)._policeStationMarkers = policeMarkerList;

    // 소방서 (2개)
    const oldFireMarkers = (map as any)._fireStationMarkers;
    if (oldFireMarkers) {
      oldFireMarkers.forEach((m: maplibregl.Marker) => m.remove());
    }
    const fireStationLocations = isENMap
      ? [
          { location: [126.9935, 37.4375] as [number, number], name: 'Star Fire Station' },
          { location: [126.9995, 37.4325] as [number, number], name: 'Galaxy Fire Station' },
        ]
      : [
          { location: [126.9935, 37.4375] as [number, number], name: '별빛소방서' },
          { location: [126.9995, 37.4325] as [number, number], name: '은하소방서' },
        ];
    const fireMarkerList: maplibregl.Marker[] = [];
    fireStationLocations.forEach((station) => {
      const container = document.createElement('div');
      container.style.cssText = 'display: flex; flex-direction: column; align-items: center; pointer-events: auto;';
      const iconWrapper = document.createElement('div');
      iconWrapper.style.cssText = `
        width: 32px; height: 32px;
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(26, 26, 26, 1) 50%, rgba(15, 15, 15, 1) 100%);
        border: 2px solid #ef4444; border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 0 12px rgba(239, 68, 68, 0.4), 0 0 24px rgba(239, 68, 68, 0.15);
        backdrop-filter: blur(4px); z-index: 40;
      `;
      const img = document.createElement('img');
      img.src = '/119.svg';
      img.alt = station.name;
      img.style.cssText = 'width: 18px; height: 18px; filter: brightness(0) saturate(100%) invert(27%) sepia(95%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%);';
      iconWrapper.appendChild(img);
      const label = document.createElement('div');
      label.style.cssText = `
        margin-top: 6px; padding: 3px 8px; border-radius: 6px;
        background: rgba(15, 15, 15, 0.9); border: 1px solid rgba(239, 68, 68, 0.4);
        white-space: nowrap; font-size: 11px; font-weight: 600; color: #f87171;
      `;
      label.textContent = station.name;
      container.appendChild(iconWrapper);
      container.appendChild(label);
      const fireMarker = new maplibregl.Marker({ element: container, anchor: 'center' })
        .setLngLat(station.location)
        .addTo(map);
      if (fireMarker.getElement()) (fireMarker.getElement() as HTMLElement).style.zIndex = '40';
      fireMarkerList.push(fireMarker);
    });
    (map as any)._fireStationMarkers = fireMarkerList;

    // cleanup
      return () => {
        map.off('zoom', zoomHandler);
        newClusterMarkers.forEach(m => m.remove());
        newIndividualMarkers.forEach(m => m.remove());
        const pMarkers = (map as any)._policeStationMarkers;
        if (pMarkers) {
          pMarkers.forEach((m: maplibregl.Marker) => m.remove());
          (map as any)._policeStationMarkers = null;
        }
        const fMarkers = (map as any)._fireStationMarkers;
        if (fMarkers) {
          fMarkers.forEach((m: maplibregl.Marker) => m.remove());
          (map as any)._fireStationMarkers = null;
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
          console.error('지도 로드 타임아웃 - CCTV 생성 실패');
        }
      };
      
      setTimeout(checkAndCreate, 100);
      
      return () => {
      };
    }
    
  }, [showFastSearchList, showCCTVName, showCCTVViewAngle, appliedSearchRadius]);

  // 고속검색 반경 원 마커 생성 - 실제 지도 좌표에 고정, 바닥에 눕힘
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    const radiusCenter: [number, number] = [126.99656, 37.43527];
    
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
      const metersPerPixel = 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);
      const radiusInPixels = fastSearchRadius / metersPerPixel;
      const diameter = radiusInPixels * 2;
      
      // 반경 원 컨테이너
      const radiusContainer = document.createElement('div');
      radiusContainer.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        z-index: 1;
      `;
      
      const radiusWrapper = document.createElement('div');
      const currentPitch = map.getPitch();
      radiusWrapper.style.cssText = `
        position: relative;
        width: ${diameter}px;
        height: ${diameter}px;
      `;
      
      // radius-pulse 애니메이션 keyframes 추가
      if (!document.getElementById('radius-pulse-style')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'radius-pulse-style';
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
        const pulse = document.createElement('div');
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
        const pulseInner = document.createElement('div');
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
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', `${diameter}px`);
      svg.setAttribute('height', `${diameter}px`);
      svg.style.cssText = `
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 2;
      `;
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '50%');
      circle.setAttribute('cy', '50%');
      circle.setAttribute('r', `${radiusInPixels - 2}px`);
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', 'rgba(59, 130, 246, 0.8)');
      circle.setAttribute('stroke-width', '4');
      circle.setAttribute('stroke-dasharray', '8 4');
      
      svg.appendChild(circle);
      radiusWrapper.appendChild(svg);
      radiusContainer.appendChild(radiusWrapper);
      
      // 마커 생성 - pitchAlignment: 'map'으로 바닥에 눕힘
      const radiusMarker = new maplibregl.Marker({
        element: radiusContainer,
        anchor: 'center',
        pitchAlignment: 'map',
        rotationAlignment: 'map'
      })
        .setLngLat(radiusCenter)
        .addTo(map);
      
      // z-index 설정 (이벤트 핀, CCTV보다 아래)
      const markerElement = radiusMarker.getElement();
      if (markerElement) {
        markerElement.style.zIndex = '1';
      }
      
      // 저장
      (map as any)._radiusMarker = radiusMarker;
      
      // zoom 변경 시 크기 업데이트
      const zoomHandler = () => {
        const newZoom = map.getZoom();
        const newMetersPerPixel = 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, newZoom);
        const newRadiusInPixels = fastSearchRadius / newMetersPerPixel;
        const newDiameter = newRadiusInPixels * 2;
        
        radiusWrapper.style.width = `${newDiameter}px`;
        radiusWrapper.style.height = `${newDiameter}px`;
        
        const pulses = radiusWrapper.querySelectorAll('div[style*="animation"]');
        pulses.forEach((pulse: any) => {
          pulse.style.width = `${newDiameter - 4}px`;
          pulse.style.height = `${newDiameter - 4}px`;
        });
        
        svg.setAttribute('width', `${newDiameter}px`);
        svg.setAttribute('height', `${newDiameter}px`);
        circle.setAttribute('r', `${newRadiusInPixels - 2}px`);
      };
      
      map.on('zoom', zoomHandler);
      
      (map as any)._radiusCleanup = () => {
        map.off('zoom', zoomHandler);
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
  // 초기화면(showInitialCCTVClusters)에서는 건너뜀 - CCTV 기본 OFF
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (showInitialCCTVClusters) return; // 초기화면: externalShowCCTV=false 유지, localStorage 무시

    const savedCCTV = localStorage.getItem('cctv-show-cctv');
    if (savedCCTV === 'true') {
      setShowCCTV(true);
    } else if (savedCCTV === null || savedCCTV === 'false') {
      // localStorage에 값이 없거나 false면 대시보드에서는 기본값으로 true
      setShowCCTV(true);
      setShowCCTVViewAngle(true);
      setShowCCTVName(true);
      // localStorage에도 저장
      localStorage.setItem('cctv-show-cctv', 'true');
      localStorage.setItem('cctv-show-view-angle', 'true');
      localStorage.setItem('cctv-show-name', 'true');
    }
      const savedViewAngle = localStorage.getItem('cctv-show-view-angle');
      if (savedViewAngle === 'true') {
        setShowCCTVViewAngle(true);
      } else if (savedViewAngle === null || savedViewAngle === 'false') {
        setShowCCTVViewAngle(true);
        localStorage.setItem('cctv-show-view-angle', 'true');
      }
      const savedName = localStorage.getItem('cctv-show-name');
      if (savedName === 'true') {
        setShowCCTVName(true);
      } else if (savedName === null || savedName === 'false') {
        setShowCCTVName(true);
        localStorage.setItem('cctv-show-name', 'true');
      }
  }, [showInitialCCTVClusters]);

  // localStorage 저장은 이제 버튼 클릭 핸들러에서 직접 처리됨

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cctv-show-cctv') {
        setShowCCTV(e.newValue === 'true');
      } else if (e.key === 'cctv-show-view-angle') {
        setShowCCTVViewAngle(e.newValue === 'true');
      } else if (e.key === 'cctv-show-name') {
        setShowCCTVName(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
        if (element && !element.classList.contains('predicted-cctv-marker')) {
          element.style.display = showCCTV ? 'block' : 'none';
        }
      });
    }
  }, [showCCTV]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case '119 화재':
        return 'mdi:fire';
      case '119 구조':
        return 'mdi:ambulance';
      case '112 실종':
        return 'mdi:account-child';
      case '112 치안':
        return 'mdi:shield-alert';
      case 'AI 탐지':
        return 'mdi:walk';
      case 'NDMS':
        return 'mdi:alert';
      default:
        return 'mdi:alert-circle';
    }
  };

  // 이벤트 ID를 기반으로 일관된 랜덤 값 생성
  const seededRandom = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
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
    const newEvents = events.filter(event => !cachedPositions[event.id]);
    
    if (newEvents.length === 0) {
      return;
    }

    // 기존 이벤트 + 새 이벤트 모두 포함하여 위치 계산
    const existingEventIds = Object.keys(cachedPositions);
    const existingEvents = events.filter(e => existingEventIds.includes(e.id));
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
      const existingPriorityEvents = eventsByPriority[priority].filter(e => cachedPositions[e.id]);
      const newPriorityEvents = eventsByPriority[priority].filter(e => !cachedPositions[e.id]);
      
      // 새 이벤트만 섞기
      newPriorityEvents.sort(() => {
        return seededRandom(`${priority}-shuffle`) - 0.5;
      });
      
      eventsByPriority[priority] = [...existingPriorityEvents, ...newPriorityEvents];
    });

    // 각 우선순위 그룹을 인터리빙하여 골고루 섞기
    const interleavedEvents: Event[] = [];
    const maxLength = Math.max(
      eventsByPriority.긴급.length,
      eventsByPriority.경계.length,
      eventsByPriority.주의.length
    );

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
      const existingRingEvents = ringEvents.filter(e => cachedPositions[e.id]);
      const newRingEvents = ringEvents.filter(e => !cachedPositions[e.id]);

      // 기존 이벤트는 위치를 변경하지 않으므로 새 이벤트만 계산
      if (newRingEvents.length === 0) {
        return;
      }

      // 링의 전체 이벤트 개수를 기반으로 각도 계산
      const radius = baseRadius + (ringIndex * ringGap);
      const angleStep = (Math.PI * 2) / ringEvents.length;
      
      // 기존 이벤트의 위치를 기반으로 ringAngleOffset 역계산
      let ringAngleOffset: number;
      if (existingRingEvents.length > 0) {
        // 기존 이벤트 중 첫 번째 이벤트의 위치를 기반으로 각도 계산
        const firstExistingEvent = existingRingEvents[0];
        const firstPos = cachedPositions[firstExistingEvent.id];
        const firstIndex = ringEvents.findIndex(e => e.id === firstExistingEvent.id);
        const dx = firstPos.left - centerX;
        const dy = firstPos.top - centerY;
        const firstAngle = Math.atan2(dy, dx);
        // 첫 번째 이벤트의 각도에서 인덱스 * angleStep을 빼서 오프셋 계산
        const firstAngleJitter = (seededRandom(`${firstExistingEvent.id}-angle`) - 0.5) * angleStep * 0.4;
        ringAngleOffset = firstAngle - (firstIndex * angleStep) - firstAngleJitter;
      } else {
        // 새 링인 경우 랜덤 오프셋 사용
        ringAngleOffset = seededRandom(`ring-${ringIndex}`) * angleStep;
      }

      // 새 이벤트의 위치 계산
      newRingEvents.forEach((event) => {
        const eventIndex = ringEvents.findIndex(e => e.id === event.id);
        const angleJitter = (seededRandom(`${event.id}-angle`) - 0.5) * angleStep * 0.4;
        const angle = ringAngleOffset + (eventIndex * angleStep) + angleJitter;
        const left = centerX + (radius * Math.cos(angle));
        const top = centerY + (radius * Math.sin(angle));

        newPositions[event.id] = {
          left: clampPercentage(left),
          top: clampPercentage(top),
        };
      });
    });

    // 특정 이벤트 핀 위치 교환: event-3(오토바이 도주)와 event-7(주택 2층 연기 발생)
    const newEventIds = newEvents.map(e => e.id);
    if (newEventIds.includes('event-3') && newEventIds.includes('event-7') && newPositions['event-3'] && newPositions['event-7']) {
      const tempPosition = newPositions['event-3'];
      newPositions['event-3'] = newPositions['event-7'];
      newPositions['event-7'] = tempPosition;
    }

    // 새 위치를 캐시에 추가
    setCachedPositions(prev => ({ ...prev, ...newPositions }));
  }, [events.map(e => e.id).join(',')]); // 이벤트 ID 목록이 변경될 때만 실행

  const positionsById = useMemo(() => {
    // 현재 events에 해당하는 위치만 반환 (캐시에서 가져오기)
    const result: Record<string, { left: number; top: number }> = {};
    events.forEach(event => {
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
  const fireStations = useMemo(() => [
    { id: 'fire-1', name: '안양소방서', left: 20, top: 30 },
    { id: 'fire-2', name: '평촌소방서', left: 75, top: 25 },
    { id: 'fire-3', name: '만안소방서', left: 30, top: 80 },
  ], []);

  // 경찰서 고정 위치 (5개) - 더 분산
  const policeStations = useMemo(() => [
    { id: 'police-1', name: '안양경찰서', left: 15, top: 50 },
    { id: 'police-2', name: '평촌경찰서', left: 80, top: 40 },
    { id: 'police-3', name: '만안경찰서', left: 25, top: 75 },
    { id: 'police-4', name: '비산파출소', left: 60, top: 60 },
    { id: 'police-5', name: '석수파출소', left: 10, top: 20 },
  ], []);

  // 두 점 사이의 거리 계산 (퍼센트 기반)
  const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  // 선택된 이벤트와 가까운 소방서/경찰서 찾기
  const nearbyStations = useMemo(() => {
    if (!selectedEventId) return { fireStations: [], policeStations: [] };
    
    const selectedEvent = events.find(e => e.id === selectedEventId);
    if (!selectedEvent) return { fireStations: [], policeStations: [] };

    // event-3(오토바이 도주) 선택 시 event-14(80대 여성 쓰러짐)의 위치를 기준으로 경찰서 찾기
    let eventPosition = getEventPosition(selectedEvent);
    if (selectedEventId === 'event-3') {
      const event14 = events.find(e => e.id === 'event-14');
      if (event14) {
        eventPosition = getEventPosition(event14);
      }
    }
    
    // 이벤트 타입에 따라 소방서 또는 경찰서 결정
    const needsFireStation = selectedEvent.type === '119 화재' || selectedEvent.type === '119 구조';
    const needsPoliceStation = selectedEvent.type === '112 실종' || selectedEvent.type === '112 치안';
    
    // 둘 다 필요한 경우도 있음 (기본적으로 둘 다 표시)
    const showBoth = !needsFireStation && !needsPoliceStation;

    let nearbyFire: typeof fireStations = [];
    let nearbyPolice: typeof policeStations = [];

    if (needsFireStation || showBoth) {
      // 소방서 거리 계산 및 정렬 (가까운 순)
      const fireWithDistance = fireStations.map(station => ({
        ...station,
        distance: calculateDistance(eventPosition.left, eventPosition.top, station.left, station.top),
      }));
      nearbyFire = fireWithDistance
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 1); // 가까운 1개
    }

    if (needsPoliceStation || showBoth || selectedEventId === 'event-3') {
      // 경찰서 거리 계산 및 정렬 (가까운 순)
      const policeWithDistance = policeStations.map(station => ({
        ...station,
        distance: calculateDistance(eventPosition.left, eventPosition.top, station.left, station.top),
      }));
      nearbyPolice = policeWithDistance
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 1); // 가까운 1개
    }

    return { fireStations: nearbyFire, policeStations: nearbyPolice };
  }, [selectedEventId, events, fireStations, policeStations, positionsById]);




  return (
    <div 
      ref={containerRef}
      className="relative bg-[#0f0f0f] overflow-hidden" 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative',
      }}
      onClick={(e) => {
        // 핀이나 툴팁, 버튼이 아닌 곳을 클릭했을 때만 지도 클릭 처리
        const target = e.target as HTMLElement;
        const isPin = target.closest('[data-event-pin]');
        const isTooltip = target.closest('[data-tooltip]');
        const isButton = target.closest('button') || target.tagName === 'BUTTON';
        const isClickable = target.closest('[data-no-drag]') || target.closest('[data-drag-handle]');
        
        if (!isPin && !isTooltip && !isButton && !isClickable) {
          onMapClick?.();
        }
      }}
      onMouseDown={(e) => {
        // 팝업이나 핀을 클릭한 경우 지도 클릭 이벤트 방지
        const target = e.target as HTMLElement;
        if (target.closest('[data-tooltip]') || target.closest('[data-event-pin]')) {
          e.stopPropagation();
        }
      }}
    >
       {/* 맵 컨트롤 + CCTV 컨트롤 - 초기 화면 + 고속검색 리스트 표시 시 */}
       {(!hideControls || showFastSearchList) ? (
       <div 
         className="absolute top-4 flex flex-col transition-all duration-500 ease-in-out" 
         style={{ 
           left: showFastSearchList ? '800px' : `${leftPanelWidth + 24}px`,
           zIndex: 250,
         }}
         onClick={(e) => e.stopPropagation()}
       >
         {/* 맵 컨트롤 */}
         <div className="flex flex-col gap-2">
         <div className="relative group">
           <button
             onClick={(e) => {
               e.stopPropagation();
               if (mapRef.current) {
                 const map = mapRef.current;
                 const nextZoom = Math.min(map.getMaxZoom(), map.getZoom() + 1);
                 map.easeTo({ zoom: nextZoom, duration: 300, essential: true });
               }
             }}
             className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"
             aria-label="확대"
           >
             <Icon icon="mdi:plus" className="w-5 h-5" />
           </button>
           <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50" role="tooltip">
             <div className="px-2.5 py-1.5 rounded-md text-xs font-medium text-white" style={{ background: 'rgba(15, 15, 15, 0.95)', border: '1px solid #31353a' }}>
               확대
             </div>
           </div>
         </div>
         <div className="relative group">
           <button
             onClick={(e) => {
               e.stopPropagation();
               if (mapRef.current) {
                 const map = mapRef.current;
                 const nextZoom = Math.max(map.getMinZoom(), map.getZoom() - 1);
                 map.easeTo({ zoom: nextZoom, duration: 300, essential: true });
               }
             }}
             className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"
             aria-label="축소"
           >
             <Icon icon="mdi:minus" className="w-5 h-5" />
           </button>
           <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50" role="tooltip">
             <div className="px-2.5 py-1.5 rounded-md text-xs font-medium text-white" style={{ background: 'rgba(15, 15, 15, 0.95)', border: '1px solid #31353a' }}>
               축소
             </div>
           </div>
         </div>
         <div className="w-full h-px bg-gray-300 my-1" />
         <div className="relative group">
           <button
             onClick={(e) => {
               e.stopPropagation();
               setIs3DMode(false);
               if (mapRef.current) {
                 mapRef.current.easeTo({
                   pitch: 0,
                   duration: 500
                 });
               }
             }}
             className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
               !is3DMode
                 ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                 : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm'
             }`}
             aria-label="2D"
           >
             <Icon icon="mdi:view-dashboard" className="w-5 h-5" />
           </button>
           <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50" role="tooltip">
             <div className="px-2.5 py-1.5 rounded-md text-xs font-medium text-white" style={{ background: 'rgba(15, 15, 15, 0.95)', border: '1px solid #31353a' }}>
               2D 보기
             </div>
           </div>
         </div>
         <div className="relative group">
           <button
             onClick={(e) => {
               e.stopPropagation();
               setIs3DMode(true);
               if (mapRef.current) {
                 mapRef.current.easeTo({
                   pitch: 60,
                   duration: 500
                 });
               }
             }}
             className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
               is3DMode
                 ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                 : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm'
             }`}
             aria-label="3D"
           >
             <Icon icon="mdi:cube" className="w-5 h-5" />
           </button>
           <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50" role="tooltip">
             <div className="px-2.5 py-1.5 rounded-md text-xs font-medium text-white" style={{ background: 'rgba(15, 15, 15, 0.95)', border: '1px solid #31353a' }}>
               3D 보기
             </div>
           </div>
         </div>
         <div className="w-full h-px bg-gray-300 my-1" />
         <div className="relative group">
           <button
             onClick={(e) => {
               e.stopPropagation();
               if (mapRef.current) {
                 const map = mapRef.current;
                 const newBearing = map.getBearing() - 15;
                 setMapBearing(newBearing);
                 map.easeTo({
                   bearing: newBearing,
                   duration: 500,
                   easing: (t) => 1 - Math.pow(1 - t, 3),
                   essential: true,
                 });
               }
             }}
             className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"
            aria-label="반시계방향 회전"
          >
            <Icon icon="mdi:rotate-left" className="w-5 h-5" />
          </button>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50" role="tooltip">
            <div className="px-2.5 py-1.5 rounded-md text-xs font-medium text-white" style={{ background: 'rgba(15, 15, 15, 0.95)', border: '1px solid #31353a' }}>
              반시계방향
             </div>
           </div>
         </div>
         <div className="relative group">
           <button
             onClick={(e) => {
               e.stopPropagation();
               if (mapRef.current) {
                 const map = mapRef.current;
                 const newBearing = map.getBearing() + 15;
                 setMapBearing(newBearing);
                 map.easeTo({
                   bearing: newBearing,
                   duration: 500,
                   easing: (t) => 1 - Math.pow(1 - t, 3),
                   essential: true,
                 });
               }
             }}
             className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"
            aria-label="시계방향 회전"
          >
            <Icon icon="mdi:rotate-right" className="w-5 h-5" />
          </button>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50" role="tooltip">
            <div className="px-2.5 py-1.5 rounded-md text-xs font-medium text-white" style={{ background: 'rgba(15, 15, 15, 0.95)', border: '1px solid #31353a' }}>
              시계방향
             </div>
           </div>
         </div>
         </div>
        {/* 맵-CCTV 간격 30px */}
        {!showFastSearchList && !aiDetectionEventId && <div style={{ height: 30 }} />}
        {/* CCTV 컨트롤 */}
        <div className="flex flex-col gap-2" style={{ display: (showFastSearchList || aiDetectionEventId) ? 'none' : 'flex' }}>
        {/* 도로 버튼 - 초기 화면에서만 표시 (고속검색 시 숨김) */}
        <div className="relative group">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isRoadLayerLoading) return;
              const now = Date.now();
              if (now - roadToggleCooldownRef.current < ROAD_TOGGLE_COOLDOWN_MS) return;
              roadToggleCooldownRef.current = now;
              setShowRoad((prev) => !prev);
            }}
            disabled={isRoadLayerLoading}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              isRoadLayerLoading
                ? 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed'
                : showRoad
                  ? 'bg-[#e85c2a] hover:bg-[#d94a1a] text-white border border-[#d94a1a]/50 shadow-sm'
                  : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm'
            }`}
            style={{
              visibility: showFastSearchList ? 'hidden' : 'visible',
              pointerEvents: showFastSearchList ? 'none' : 'auto',
            }}
            aria-label="도로"
            aria-busy={isRoadLayerLoading}
          >
            {isRoadLayerLoading ? (
              <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
            ) : (
              <Icon icon="mdi:highway" className="w-5 h-5" />
            )}
          </button>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50" role="tooltip">
            <div className="px-2.5 py-1.5 rounded-md text-xs font-medium text-white" style={{ background: 'rgba(15, 15, 15, 0.95)', border: '1px solid #31353a' }}>
              도로 돌발 상황
            </div>
          </div>
        </div>
        {/* CCTV 아이콘 토글 */}
        <div className="relative group">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const newValue = !showCCTV;
              console.log('[v2 MapView] CCTV 버튼 클릭', { prev: showCCTV, next: newValue });
              setShowCCTV(newValue);
              if (newValue) {
                setShowCCTVViewAngle(true);
                setShowCCTVName(true);
              } else {
                setShowCCTVViewAngle(false);
                setShowCCTVName(false);
              }
              if (typeof window !== 'undefined') {
                localStorage.setItem('cctv-show-cctv', newValue.toString());
                localStorage.setItem('cctv-show-view-angle', newValue.toString());
                localStorage.setItem('cctv-show-name', newValue.toString());
              }
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              showCCTV 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm'
            }`}
            aria-label="CCTV"
          >
            <CCTVIcon className="w-5 h-5" />
          </button>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50" role="tooltip">
            <div className="px-2.5 py-1.5 rounded-md text-xs font-medium text-white" style={{ background: 'rgba(15, 15, 15, 0.95)', border: '1px solid #31353a' }}>
              CCTV 표시
            </div>
          </div>
        </div>
        
        {/* CCTV 라벨 토글 */}
        <div className="relative group">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const newValue = !showCCTVName;
              console.log('[v2 MapView] 라벨 버튼 클릭', { prev: showCCTVName, next: newValue });
              setShowCCTVName(newValue);
              if (typeof window !== 'undefined') {
                localStorage.setItem('cctv-show-name', newValue.toString());
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                const newValue = !showCCTVName;
                setShowCCTVName(newValue);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('cctv-show-name', newValue.toString());
                }
              }
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              showCCTVName 
                ? 'bg-white hover:bg-gray-100 shadow-sm border-2 border-blue-600' 
                : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm'
            }`}
            style={{
              visibility: showCCTV ? 'visible' : 'hidden',
              pointerEvents: showCCTV ? 'auto' : 'none',
            }}
            aria-label="CCTV 라벨"
            tabIndex={showCCTV ? 0 : -1}
          >
            <Icon icon="mdi:label" className={`w-5 h-5 ${showCCTVName ? 'text-blue-600' : 'text-gray-800'}`} />
          </button>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50" role="tooltip">
            <div className="px-2.5 py-1.5 rounded-md text-xs font-medium text-white" style={{ background: 'rgba(15, 15, 15, 0.95)', border: '1px solid #31353a' }}>
              CCTV 라벨
            </div>
          </div>
        </div>
        
        {/* 시야각 토글 */}
        <div className="relative group">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const newValue = !showCCTVViewAngle;
              console.log('[v2 MapView] 시야각 버튼 클릭', { prev: showCCTVViewAngle, next: newValue });
              setShowCCTVViewAngle(newValue);
              if (typeof window !== 'undefined') {
                localStorage.setItem('cctv-show-view-angle', newValue.toString());
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                const newValue = !showCCTVViewAngle;
                setShowCCTVViewAngle(newValue);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('cctv-show-view-angle', newValue.toString());
                }
              }
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              showCCTVViewAngle 
                ? 'bg-white hover:bg-gray-100 shadow-sm border-2 border-blue-600' 
                : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm'
            }`}
            style={{
              visibility: showCCTV ? 'visible' : 'hidden',
              pointerEvents: showCCTV ? 'auto' : 'none',
            }}
            aria-label="CCTV 시야각"
            tabIndex={showCCTV ? 0 : -1}
          >
            <Icon icon="mdi:triangle-outline" className={`w-5 h-5 ${showCCTVViewAngle ? 'text-blue-600' : 'text-gray-800'}`} />
          </button>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50" role="tooltip">
            <div className="px-2.5 py-1.5 rounded-md text-xs font-medium text-white" style={{ background: 'rgba(15, 15, 15, 0.95)', border: '1px solid #31353a' }}>
              CCTV 시야각
            </div>
          </div>
        </div>
         </div>
       </div>
       ) : (console.log('[v2 MapView] 컨트롤 패널 숨김', { hideControls, showFastSearchList }), null)}

      {/* 지도 - 박스 밖으로 */}
      <div
        className="relative border border-[#31353a] transition-transform duration-700 ease-out"
        style={{
          borderWidth: '1px',
          height: '100%',
          width:
            (zoomLevel > 0 || focusDeltaPercent > 0) && !flyToLocation
              ? `calc(100% + ${overscanPx * 2}px)`
              : '100%',
          left:
            (zoomLevel > 0 || focusDeltaPercent > 0) && !flyToLocation
              ? `-${overscanPx}px`
              : '0',
          transform: flyToLocation ? 'none' : `scale(${mapScale}) translate(calc(${mapTranslate.x}% + ${mapTranslate.offsetX}%), ${mapTranslate.y}%) translateZ(0)`,
          transformOrigin: mapTransformOrigin,
          willChange: 'transform',
          transition: 'transform 0.5s ease-out, width 0.5s ease-out, left 0.5s ease-out',
        }}
      >
        <div
          ref={mapContainerRef}
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: 1 }}
        />
        <div 
          className="absolute inset-0 bg-black/5 pointer-events-none" 
          style={{ zIndex: 2 }}
        ></div>
        {isMapAnimating && (
          <div
            className="absolute inset-0"
            style={{ zIndex: 9999 }}
            aria-hidden="true"
          />
        )}
        
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
      {!hideAgentButton && (() => {
        const rightPanelWidth = 370;
        const panelGap = 16;
        const { buttonBottom } = getCCTVPanelLayout();
        const cctvPanelRight = rightPanelWidth + panelGap;
        const isInitial = !hideControls;
        const isFastSearch = showFastSearch || showFastSearchList;
        const bottom = isInitial ? buttonBottom : 24;
        const right = isInitial ? cctvPanelRight : isFastSearch ? 24 : cctvPanelRight;
        return (
          <div
            className="absolute group"
            style={{
              bottom: `${bottom}px`,
              right: `${right}px`,
              zIndex: 200,
              transition: 'bottom 0.3s ease-in-out, right 0.3s ease-in-out',
            }}
          >
            <button
              onClick={onAgentHubClick}
              className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #0066FF 0%, #8A2BE2 50%, #ff8566 100%)',
                boxShadow: '0 4px 12px rgba(0, 102, 255, 0.3), 0 2px 4px rgba(138, 43, 226, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 102, 255, 0.4), 0 4px 8px rgba(138, 43, 226, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 102, 255, 0.3), 0 2px 4px rgba(138, 43, 226, 0.2)';
              }}
              aria-label="Agent Hub"
              tabIndex={0}
            >
              <img 
                src="/simbol.svg" 
                alt="AI" 
                className="w-6 h-6"
                style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }}
              />
            </button>
            {/* 툴팁 */}
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-[#1a1a1a] text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-[#31353a]">
              CUVIA Link로 이동
              <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-[#1a1a1a]"></div>
            </div>
          </div>
        );
      })()}


    </div>
  );
};

export default MapView;
