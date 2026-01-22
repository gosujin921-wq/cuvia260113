

import { Event } from '@/types';
import { Icon } from '@iconify/react';
import { useMemo, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { getCCTVIconClassName, getCCTVLabelClassName } from '@/components/shared/styles';
import CCTVIcon from '@/components/common/CCTVIcon';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  getCCTVViewAngle as getCCTVViewAngleUtil, 
  getCCTVDirection,
  generateViewAnglePath,
  getCCTVConfigMap
} from '@/lib/cctv-view-angle-utils';

export interface MapViewState {
  zoomLevel: number;
  showCCTV: boolean;
  showCCTVViewAngle: boolean;
  showCCTVName: boolean;
  is3DMode: boolean;
  mapBearing: number;
}

export interface MapViewHandlers {
  setZoomLevel: (updater: (prev: number) => number) => void;
  setIs3DMode: (mode: boolean) => void;
  setMapBearing: (updater: (prev: number) => number) => void;
  setShowCCTV: (value: boolean) => void;
  setShowCCTVViewAngle: (updater: (prev: boolean) => boolean) => void;
  setShowCCTVName: (updater: (prev: boolean) => boolean) => void;
}

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
  onStateChange?: (state: MapViewState, handlers: MapViewHandlers) => void;
}

const MapView = ({ events, highlightedEventId, onEventClick, selectedEventId, aiDetectionEventId, onMapClick, onEventHover, onToggleGeneralEvents, externalZoomLevel, onZoomLevelChange, onAiDetectionClose, hideControls = false, onStateChange }: MapViewProps) => {
  const [zoomLevel, setZoomLevel] = useState(0);
  const [cctvViewAngles, setCctvViewAngles] = useState<Record<string, number>>({});
  const [animatingViewAngles, setAnimatingViewAngles] = useState<Record<string, number>>({});
  const [showCCTV, setShowCCTV] = useState(true);
  const [showCCTVViewAngle, setShowCCTVViewAngle] = useState(true);
  const [showCCTVName, setShowCCTVName] = useState(true);
  const [is3DMode, setIs3DMode] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapBearing, setMapBearing] = useState(-17.6);

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

  // MapView 상태를 부모 컴포넌트에 노출
  const hasInitialized = useRef(false);
  useLayoutEffect(() => {
    if (!onStateChange) return;
    
    const state: MapViewState = {
      zoomLevel,
      showCCTV,
      showCCTVViewAngle,
      showCCTVName,
      is3DMode,
      mapBearing: mapRef.current?.getBearing() || 0,
    };
    
    const handlers: MapViewHandlers = {
      setZoomLevel,
      setIs3DMode,
      setMapBearing: (updater) => {
        setMapBearing((prev) => updater(prev));
      },
      setShowCCTV,
      setShowCCTVViewAngle,
      setShowCCTVName,
    };
    
    onStateChange(state, handlers);
    hasInitialized.current = true;
  }, []);

  useEffect(() => {
    if (!onStateChange || !hasInitialized.current) return;
    
    const state: MapViewState = {
      zoomLevel,
      showCCTV,
      showCCTVViewAngle,
      showCCTVName,
      is3DMode,
      mapBearing: mapRef.current?.getBearing() || 0,
    };
    
    const handlers: MapViewHandlers = {
      setZoomLevel,
      setIs3DMode,
      setMapBearing: (updater) => {
        setMapBearing((prev) => updater(prev));
      },
      setShowCCTV,
      setShowCCTVViewAngle,
      setShowCCTVName,
    };
    
    onStateChange(state, handlers);
  }, [zoomLevel, showCCTV, showCCTVViewAngle, showCCTVName, is3DMode, onStateChange]);

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
        const maxViewAngle = baseViewAngle >= 120 ? baseViewAngle : 120;
        const normalizedZoom = Math.min(1, Math.max(0, zoomLevel));
        const dynamicViewAngle = minViewAngle + (maxViewAngle - minViewAngle) * normalizedZoom;
        const finalViewAngle = baseViewAngle >= 120 ? baseViewAngle : dynamicViewAngle;
        
        startAngles[cctvId] = finalViewAngle;
        targetAngles[cctvId] = finalViewAngle + 10;
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
  
  const mapScale = zoomLevel === 0 ? 1 : 1.5;
  const mapTransformOrigin = 'center center';

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://api.maptiler.com/maps/019bdf7d-b868-75ba-b003-3005177ff4fa/style.json?key=WPWmpNf4y5nzKDA7mQXe',
      center: [126.7830, 37.5044],
      zoom: 15,
      pitch: 60,
      bearing: -17.6,
      attributionControl: false,
      interactive: false,
    });

    // 맵 로드 후 3D 건물 활성화
    map.on('load', () => {
      const style = map.getStyle();
      if (!style || !style.layers) return;

      // 모든 레이어 확인
      const layers = style.layers;
      console.log('Map layers:', layers.map((l: any) => ({ id: l.id, type: l.type, source: l.source })));

      // 건물 레이어 찾기 (더 넓은 범위로 검색)
      layers.forEach((layer: any) => {
        const layerId = layer.id.toLowerCase();
        const isBuildingLayer = 
          layerId.includes('building') || 
          layerId.includes('건물') ||
          layerId.includes('extrusion') ||
          (layer.type === 'fill-extrusion');
        
        if (isBuildingLayer) {
          console.log('Processing building layer:', layer.id, layer.type);
          
          try {
            if (layer.type === 'fill-extrusion') {
              // 이미 fill-extrusion이면 높이 속성만 설정 (컬러는 API 원본 유지)
              if (map.getLayer(layer.id)) {
                map.setPaintProperty(layer.id, 'fill-extrusion-height', [
                  'case',
                  ['has', 'height'],
                  ['*', ['to-number', ['get', 'height']], 1],
                  ['has', 'render_height'],
                  ['*', ['to-number', ['get', 'render_height']], 1],
                  ['has', 'building:levels'],
                  ['*', ['to-number', ['get', 'building:levels']], 3],
                  15 // 기본 높이 (미터)
                ]);
                map.setPaintProperty(layer.id, 'fill-extrusion-base', [
                  'case',
                  ['has', 'min_height'],
                  ['to-number', ['get', 'min_height']],
                  0
                ]);
                // 컬러는 API 원본 그대로 유지 (설정하지 않음)
              }
            } else if (layer.type === 'fill' && layer.source) {
              // fill 타입을 fill-extrusion으로 변환
              const sourceId = layer.source;
              const sourceLayer = layer['source-layer'];
              
              if (map.getSource(sourceId)) {
                // 기존 레이어 제거
                if (map.getLayer(layer.id)) {
                  map.removeLayer(layer.id);
                }
                
                // fill-extrusion 레이어 추가 (컬러는 API 원본 유지)
                map.addLayer({
                  id: `${layer.id}-3d`,
                  type: 'fill-extrusion',
                  source: sourceId,
                  'source-layer': sourceLayer,
                  paint: {
                    // fill-extrusion-color는 설정하지 않아 API 원본 컬러 사용
                    'fill-extrusion-height': [
                      'case',
                      ['has', 'height'],
                      ['*', ['to-number', ['get', 'height']], 1],
                      ['has', 'building:levels'],
                      ['*', ['to-number', ['get', 'building:levels']], 3],
                      15
                    ],
                    'fill-extrusion-base': [
                      'case',
                      ['has', 'min_height'],
                      ['to-number', ['get', 'min_height']],
                      0
                    ],
                    // opacity도 원본 유지 (설정하지 않음)
                  },
                  filter: layer.filter || ['has', 'height'],
                });
              }
            }
          } catch (e) {
            console.warn('건물 레이어 설정 실패:', layer.id, e);
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
        duration: 500
      });
    }
  }, [is3DMode]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.easeTo({
        bearing: mapBearing,
        duration: 500,
        easing: (t) => t * (2 - t) // ease-out 함수로 더 부드러운 애니메이션
      });
    }
  }, [mapBearing]);
  
  // localStorage에서 초기값 읽기 (클라이언트에서만)
  // 대시보드에서는 localStorage에 값이 없으면 기본값으로 true 설정
  useEffect(() => {
    if (typeof window !== 'undefined') {
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
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cctv-show-cctv', showCCTV.toString());
    }
  }, [showCCTV]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cctv-show-view-angle', showCCTVViewAngle.toString());
    }
  }, [showCCTVViewAngle]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cctv-show-name', showCCTVName.toString());
    }
  }, [showCCTVName]);

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

  // 일반 이벤트 ID 목록 (event-26부터 event-33)
  const generalEventIds = new Set([
    'event-26', 'event-27', 'event-28', 'event-29',
    'event-30', 'event-31', 'event-32', 'event-33',
  ]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case '119-화재':
        return 'mdi:fire';
      case '119-구조':
        return 'mdi:ambulance';
      case '112-미아':
        return 'mdi:account-child';
      case '112-치안':
        return 'mdi:shield-alert';
      case '약자':
        return 'mdi:account-alert';
      case 'AI-배회':
        return 'mdi:walk';
      case 'NDMS':
        return 'mdi:alert';
      case '소방서':
        return 'mdi:fire-truck';
      default:
        return 'mdi:map-marker';
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

  // 선택된 이벤트를 중앙으로 이동시키기 위한 translate 계산
  const mapTranslate = useMemo(() => {
    if (zoomLevel === 0 || !selectedEventId) {
      return { x: 0, y: 0 };
    }
    
    const selectedEvent = events.find(e => e.id === selectedEventId);
    if (!selectedEvent) {
      return { x: 0, y: 0 };
    }
    
    const eventPosition = positionsById[selectedEvent.id] || { left: centerX, top: centerY };
    // CSS transform에서 transform-origin이 center center일 때:
    // scale(s)를 적용하면 중심점(50%, 50%)을 기준으로 확대됩니다.
    // 이벤트가 (x, y)에 있을 때, 중심점에서 이벤트까지의 벡터는 (x - 50, y - 50)
    // scale 후 벡터: (x - 50) * s, (y - 50) * s
    // scale 후 위치: (50 + (x - 50) * s, 50 + (y - 50) * s)
    // 중앙(50, 50)으로 이동하려면: (50 - (50 + (x - 50) * s), 50 - (50 + (y - 50) * s))
    // = (-(x - 50) * s, -(y - 50) * s)
    // = ((50 - x) * s, (50 - y) * s)
    const translateX = (50 - eventPosition.left) * mapScale;
    const translateY = (50 - eventPosition.top) * mapScale;
    
    return { x: translateX, y: translateY };
  }, [zoomLevel, selectedEventId, events, mapScale, positionsById]);

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
    const needsFireStation = selectedEvent.type === '119-화재' || selectedEvent.type === '119-구조';
    const needsPoliceStation = selectedEvent.type === '112-미아' || selectedEvent.type === '112-치안';
    
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
       <div 
         className="absolute top-4 left-4 flex flex-col gap-2 transition-all duration-500 ease-in-out" 
         style={{ 
           zIndex: 250,
           transform: hideControls ? 'translateX(-200px)' : 'translateX(0)',
           opacity: hideControls ? 0 : 1,
         }}
         onClick={(e) => e.stopPropagation()}
       >
         <button
           onClick={(e) => {
             e.stopPropagation();
             setZoomLevel(prev => Math.min(prev + 1, 1));
           }}
           disabled={zoomLevel >= 1}
           className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
           aria-label="확대"
         >
           <Icon icon="mdi:plus" className="w-5 h-5" />
         </button>
         <button
           onClick={(e) => {
             e.stopPropagation();
             setZoomLevel(prev => Math.max(prev - 1, 0));
           }}
           disabled={zoomLevel <= 0}
           className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
           aria-label="축소"
         >
           <Icon icon="mdi:minus" className="w-5 h-5" />
         </button>
         <div className="w-full h-px bg-gray-300 my-1" />
         <button
           onClick={(e) => {
             e.stopPropagation();
             setIs3DMode(false);
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
         <button
           onClick={(e) => {
             e.stopPropagation();
             setIs3DMode(true);
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
         {is3DMode && (
           <>
             <div className="w-full h-px bg-gray-300 my-1" />
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 setMapBearing(prev => prev - 15);
               }}
               className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"
               aria-label="회전 왼쪽"
             >
               <Icon icon="mdi:rotate-left" className="w-5 h-5" />
             </button>
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 setMapBearing(prev => prev + 15);
               }}
               className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"
               aria-label="회전 오른쪽"
             >
               <Icon icon="mdi:rotate-right" className="w-5 h-5" />
             </button>
           </>
         )}
       </div>


       <div 
         className="absolute left-4 top-1/2 flex flex-col gap-2 transition-all duration-500 ease-in-out" 
         style={{ 
           zIndex: 250,
           transform: hideControls ? 'translateX(-200px) translateY(-50%)' : 'translateX(0) translateY(-50%)',
           opacity: hideControls ? 0 : 1,
         }}
         onClick={(e) => e.stopPropagation()}
       >
         {showCCTV && (
           <button
             onClick={(e) => {
               e.stopPropagation();
               setShowCCTVName(prev => !prev);
             }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              showCCTVName 
                ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-[0_0_15px_rgba(251,146,60,0.5)]' 
                : 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border border-blue-500/30 hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]'
            }`}
             style={{ borderWidth: '1px' }}
             aria-label="CCTV 명 켜기"
           >
             <Icon icon="mdi:label" className="w-5 h-5" />
           </button>
         )}
         
         <button
           onClick={(e) => {
             e.stopPropagation();
             const newValue = !showCCTV;
             setShowCCTV(newValue);
             if (newValue) {
               setShowCCTVViewAngle(true);
               setShowCCTVName(true);
             } else {
               setShowCCTVViewAngle(false);
               setShowCCTVName(false);
             }
           }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
            showCCTV 
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.6),0_0_40px_rgba(59,130,246,0.3)] ring-2 ring-blue-500/30' 
              : 'bg-gradient-to-br from-[#2a2a2a] via-[#1a1a1a] to-[#0f0f0f] hover:from-[#3a3a3a] hover:via-[#2a2a2a] hover:to-[#1a1a1a] text-gray-300 border-2 border-blue-500/40 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.5),0_0_40px_rgba(59,130,246,0.2)]'
          }`}
           style={{ borderWidth: '1px' }}
           aria-label="CCTV"
         >
           <CCTVIcon className={`w-5 h-5 text-white ${showCCTV ? 'drop-shadow-lg' : ''}`} />
         </button>
         
         {showCCTV && (
           <button
             onClick={(e) => {
               e.stopPropagation();
               setShowCCTVViewAngle(prev => !prev);
             }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              showCCTVViewAngle 
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]' 
                : 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border border-blue-500/30 hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]'
            }`}
             style={{ borderWidth: '1px' }}
             aria-label="시야각 켜기"
           >
             <Icon icon="mdi:angle-acute" className="w-5 h-5" />
           </button>
         )}
       </div>

      {/* 지도 - 박스 밖으로 */}
      <div
        className="relative border border-[#31353a] transition-transform duration-700 ease-out"
        style={{
          borderWidth: '1px',
          height: '100%',
          width: '100%',
          transform: `scale(${mapScale}) translate(${mapTranslate.x}%, ${mapTranslate.y}%) translateZ(0)`,
          transformOrigin: mapTransformOrigin,
          willChange: 'transform',
          transition: 'transform 0.5s ease-out',
        }}
      >
        <div
          ref={mapContainerRef}
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: 1 }}
        />
        <div 
          className="absolute inset-0 bg-black/5" 
          style={{ zIndex: 2 }}
        ></div>
        
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
        {/* 가상 CCTV 아이콘들 - 그레이 컬러 */}
        {showCCTV && [
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
        ].map((item, index) => {
          const cctvName = `CCTV-V-${index + 1}`;
          if (zoomLevel === 0) {
            // 축소 모드: 클러스터 뱃지만 표시
            return (
              <div
                key={`virtual-cctv-${index}`}
                className="absolute cursor-pointer"
                style={{ 
                  left: `${item.left}%`, 
                  top: `${item.top}%`, 
                  transform: 'translate(-50%, -50%)', 
                  zIndex: 50,
                  transition: 'left 0.5s ease-out, top 0.5s ease-out',
                }}
                  onClick={() => {}}
              >
                <div 
                  className={`${getCCTVIconClassName('light')} flex items-center justify-center ${item.count > 1 && zoomLevel === 0 ? 'w-auto min-w-[28px]' : ''}`} 
                  style={getCCTVIconBoxStyle(item.count, mapScale, item.count > 1 && zoomLevel === 0, 60)}
                >
                  <CCTVIcon 
                    className="!text-gray-300 drop-shadow-lg filter"
                    style={{ color: '#d1d5db' }}
                    width="16px"
                    height="16px"
                  />
                  {/* CCTV 카메라 개수 - 축소 모드에서만 표시 */}
                  {item.count > 1 && zoomLevel === 0 && (
                    <span className="text-xs font-semibold text-gray-400 ml-1" style={{ whiteSpace: 'nowrap' }}>
                      {formatCCTVCount(item.count)}
                    </span>
                  )}
                </div>
                {showCCTVName && (
                  <div className={`${getCCTVLabelClassName('default')} absolute top-full left-1/2 -translate-x-1/2 mt-1`}>
                    {cctvName}
                  </div>
                )}
                {showCCTVViewAngle && (() => {
                  const baseCctvId = `cctv-${index}`;
                  const baseViewAngle = getCCTVViewAngle(baseCctvId, 90);
                  const minViewAngle = 90;
                  const maxViewAngle = baseViewAngle >= 120 ? baseViewAngle : 120;
                  const normalizedZoom = Math.min(1, Math.max(0, zoomLevel));
                  const dynamicViewAngle = minViewAngle + (maxViewAngle - minViewAngle) * normalizedZoom;
                  const targetViewAngle = baseViewAngle >= 120 ? baseViewAngle : dynamicViewAngle;
                  
                  if (zoomLevel === 0) {
                    const patternSeed = index % 4;
                    return Array.from({ length: item.count }, (_, i) => {
                      let viewAngle: number;
                      
                      switch (patternSeed) {
                        case 0:
                          viewAngle = (item.viewAngle + i * 30) % 360;
                          break;
                        case 1:
                          const side = Math.floor(i / 4);
                          const pos = i % 4;
                          viewAngle = (item.viewAngle + pos * 45 + side * 15) % 360;
                          break;
                        case 2:
                          viewAngle = (item.viewAngle + i * 40 + (i % 2) * 60) % 360;
                          break;
                        case 3:
                          if (i < 2) {
                            viewAngle = (item.viewAngle + i * 90) % 360;
                          } else {
                            viewAngle = (item.viewAngle + (i - 2) * 50) % 360;
                          }
                          break;
                        default:
                          viewAngle = item.viewAngle;
                      }
                      
                      const direction = getCCTVDirection(baseCctvId, viewAngle);
                      const pathData = generateViewAnglePath(targetViewAngle, 50, 60, 60);
                      
                      return (
                        <div 
                          key={`cluster-view-angle-${i}`}
                          className="absolute"
                          style={{
                            width: '120px',
                            height: '120px',
                            left: '50%',
                            top: '50%',
                            transform: `translate(-50%, -50%) rotate(${direction}deg)`,
                            transformOrigin: 'center center',
                            pointerEvents: 'none',
                            zIndex: 30 - i,
                            opacity: 0.7,
                          }}
                        >
                          <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                            <path
                              d={pathData}
                              fill="rgba(156, 163, 175, 0.15)"
                              stroke="rgba(156, 163, 175, 0.5)"
                              strokeWidth="1.5"
                            />
                          </svg>
                        </div>
                      );
                    });
                  }
                  
                  const cctvId = baseCctvId;
                  const direction = getCCTVDirection(cctvId, item.viewAngle);
                  const currentViewAngle = animatingViewAngles[cctvId] ?? targetViewAngle;
                  const pathData = generateViewAnglePath(currentViewAngle, 50, 60, 60);
                  
                  return (
                    <div 
                      className="absolute"
                      style={{
                        width: '120px',
                        height: '120px',
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) rotate(${direction}deg)`,
                        transformOrigin: 'center center',
                        pointerEvents: 'none',
                        zIndex: 30,
                      }}
                    >
                      <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                        <path
                          d={pathData}
                          fill="rgba(156, 163, 175, 0.2)"
                          stroke="rgba(156, 163, 175, 0.6)"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  );
                })()}
              </div>
            );
          } else {
            // 확대 모드: 개별 CCTV 아이콘 표시 - 다양한 각도와 위치로 배치
            return Array.from({ length: item.count }, (_, i) => {
              // 확대 모드에서도 방향과 화각 분리
              const baseCctvId = `cctv-${index}`;
              const baseDirection = getCCTVDirection(baseCctvId, item.viewAngle);
              const baseViewAngle = getCCTVViewAngle(baseCctvId, 90);
              
              // count가 1개인 경우는 원래 위치 유지
              if (item.count === 1) {
                const finalDirection = baseDirection;
                
                return (
                  <div
                    key={`virtual-cctv-${index}-${i}`}
                    className="absolute cursor-pointer"
                    style={{ 
                      left: `${item.left}%`, 
                      top: `${item.top}%`, 
                      transform: 'translate(-50%, -50%)', 
                      zIndex: 50,
                      transition: 'opacity 0.7s ease-out',
                      opacity: zoomLevel > 0 ? 1 : 0,
                    }}
                    onClick={() => {}}
                  >
                    <div className={getCCTVIconClassName('light')} style={{ ...getCCTVIconBoxStyle(1, mapScale, false, 60) }}>
                      <CCTVIcon 
                        className="!text-gray-300"
                        style={{ color: '#d1d5db' }}
                        width="16px"
                        height="16px"
                      />
                    </div>
                    {showCCTVName && (
                      <div className={`${getCCTVLabelClassName('default')} absolute top-full left-1/2 -translate-x-1/2 mt-1`}>
                        CCTV-V-{index + 1}-{i + 1}
                      </div>
                    )}
                    {showCCTVViewAngle && (() => {
                      const cctvId = `cctv-${index}-${i}`;
                      const direction = finalDirection;
                      
                      if (zoomLevel === 0) {
                        return null;
                      }
                      
                      const baseViewAngle = getCCTVViewAngle(baseCctvId, 90);
                      const minViewAngle = 90;
                      const maxViewAngle = baseViewAngle >= 120 ? baseViewAngle : 120;
                      const normalizedZoom = Math.min(1, Math.max(0, zoomLevel));
                      const dynamicViewAngle = minViewAngle + (maxViewAngle - minViewAngle) * normalizedZoom;
                      const targetViewAngle = baseViewAngle >= 120 ? baseViewAngle : dynamicViewAngle;
                      const currentViewAngle = animatingViewAngles[baseCctvId] ?? targetViewAngle;
                      const pathData = generateViewAnglePath(currentViewAngle, 50, 60, 60);
                      
                      return (
                        <div 
                          className="absolute"
                          style={{
                            width: '120px',
                            height: '120px',
                            left: '50%',
                            top: '50%',
                            transform: `translate(-50%, -50%) rotate(${direction}deg)`,
                            transformOrigin: 'center center',
                            pointerEvents: 'none',
                            zIndex: 30,
                            transition: 'opacity 0.7s ease-out',
                            opacity: zoomLevel > 0 ? 1 : 0,
                          }}
                        >
                          <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                            <path
                              d={pathData}
                              fill="rgba(156, 163, 175, 0.2)"
                              stroke="rgba(156, 163, 175, 0.6)"
                              strokeWidth="2"
                              style={{
                                transition: 'd 0.016s ease-out',
                              }}
                            />
                          </svg>
                        </div>
                      );
                    })()}
                  </div>
                );
              }
              
              // count가 1개보다 많은 경우 - 기존 패턴 사용
              const patternSeed = index % 4;
              let angle: number;
              let radius: number;
              let viewAngle: number;
              
              switch (patternSeed) {
                case 0:
                  angle = (i / item.count) * 2 * Math.PI;
                  radius = 2 + (i % 2) * 0.5;
                  viewAngle = (item.viewAngle + i * 30) % 360;
                  break;
                case 1:
                  const side = Math.floor(i / 4);
                  const pos = i % 4;
                  const squareRadius = 1.5 + side * 0.8;
                  angle = (pos * Math.PI / 2) + (Math.PI / 4);
                  radius = squareRadius;
                  viewAngle = (item.viewAngle + pos * 45 + side * 15) % 360;
                  break;
                case 2:
                  angle = (i / item.count) * 2 * Math.PI + (i % 3) * 0.3;
                  radius = 1.5 + (i % 3) * 0.7 + Math.sin(i) * 0.5;
                  viewAngle = (item.viewAngle + i * 40 + (i % 2) * 60) % 360;
                  break;
                case 3:
                  if (i < 2) {
                    angle = (i - 0.5) * Math.PI / 3;
                    radius = 2.5;
                    viewAngle = (item.viewAngle + i * 90) % 360;
                  } else {
                    angle = ((i - 2) / (item.count - 2)) * 2 * Math.PI;
                    radius = 1.8 + (i % 2) * 0.6;
                    viewAngle = (item.viewAngle + (i - 2) * 50) % 360;
                  }
                  break;
                default:
                  angle = (i / item.count) * 2 * Math.PI;
                  radius = 2;
                  viewAngle = item.viewAngle;
              }
              
              const offsetLeft = Math.cos(angle) * radius;
              const offsetTop = Math.sin(angle) * radius;
              const finalDirection = (baseDirection + (viewAngle - item.viewAngle)) % 360;
              
              return (
                <div
                  key={`virtual-cctv-${index}-${i}`}
                  className="absolute cursor-pointer"
                  style={{ 
                    left: `${item.left + offsetLeft}%`, 
                    top: `${item.top + offsetTop}%`, 
                    transform: 'translate(-50%, -50%)', 
                    zIndex: 50,
                    transition: 'left 0.7s ease-out, top 0.7s ease-out, opacity 0.7s ease-out',
                    opacity: zoomLevel > 0 ? 1 : 0,
                  }}
                  onClick={() => {}}
                >
                  <div className={getCCTVIconClassName('light')} style={{ ...getCCTVIconBoxStyle(1, mapScale, false, 60) }}>
                    <CCTVIcon 
                      className="!text-gray-300"
                      style={{ color: '#d1d5db' }}
                      width="16px"
                      height="16px"
                    />
                  </div>
                  {showCCTVName && (
                    <div className={`${getCCTVLabelClassName('default')} absolute top-full left-1/2 -translate-x-1/2 mt-1`}>
                      CCTV-V-{index + 1}-{i + 1}
                    </div>
                  )}
                  {showCCTVViewAngle && (() => {
                    const cctvId = `cctv-${index}-${i}`;
                    const direction = finalDirection;
                    
                    if (zoomLevel === 0) {
                      return null;
                    }
                    
                    const baseViewAngle = getCCTVViewAngle(baseCctvId, 90);
                    const minViewAngle = 90;
                    const maxViewAngle = baseViewAngle >= 120 ? baseViewAngle : 120;
                    const normalizedZoom = Math.min(1, Math.max(0, zoomLevel));
                    const dynamicViewAngle = minViewAngle + (maxViewAngle - minViewAngle) * normalizedZoom;
                    const targetViewAngle = baseViewAngle >= 120 ? baseViewAngle : dynamicViewAngle;
                    const currentViewAngle = animatingViewAngles[baseCctvId] ?? targetViewAngle;
                    const pathData = generateViewAnglePath(currentViewAngle, 50, 60, 60);
                    
                    return (
                      <div 
                        className="absolute"
                        style={{
                          width: '120px',
                          height: '120px',
                          left: '50%',
                          top: '50%',
                          transform: `translate(-50%, -50%) rotate(${direction}deg)`,
                          transformOrigin: 'center center',
                          pointerEvents: 'none',
                          zIndex: 30,
                          transition: 'opacity 0.7s ease-out',
                          opacity: zoomLevel > 0 ? 1 : 0,
                        }}
                      >
                        <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                          <path
                            d={pathData}
                            fill="rgba(156, 163, 175, 0.2)"
                            stroke="rgba(156, 163, 175, 0.6)"
                            strokeWidth="2"
                            style={{
                              transition: 'd 0.016s ease-out',
                            }}
                          />
                        </svg>
                      </div>
                    );
                  })()}
                </div>
              );
            });
          }
        })}



        {/* 이벤트 핀들 - 추적 CCTV 아이콘으로 표시 */}
        <div className="absolute inset-0" style={{ zIndex: 100, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {(events || []).map((event) => {
            const position = getEventPosition(event);
            const isHighlighted = highlightedEventId === event.id;
            const isSelected = selectedEventId === event.id;

            return (
              <div
                key={event.id}
                data-event-pin
                className="absolute flex items-center justify-center"
                style={{
                  left: `${position.left}%`,
                  top: `${position.top}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: isSelected ? 150 : isHighlighted ? 140 : 100,
                  pointerEvents: 'auto',
                }}
              >
                {/* 펄스 애니메이션 (여러 레이어) - 선택된 이벤트에만 표시, "상가 절도 의심, 현금 절취 포착" 제외 */}
                {isSelected && !event.title.includes('상가 절도 의심') && !event.title.includes('현금 절취 포착') && (
                  <>
                    <div 
                      className="absolute animate-circle-pulse" 
                      style={{ 
                        width: '120px', 
                        height: '120px', 
                        zIndex: 80, 
                        animationDelay: '0s',
                        transform: 'translateZ(0) scale(0.8)',
                        willChange: 'transform, opacity',
                        opacity: 1
                      }}
                    >
                      <div className="w-full h-full rounded-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.5)' }}></div>
                    </div>
                    <div 
                      className="absolute animate-circle-pulse" 
                      style={{ 
                        width: '120px', 
                        height: '120px', 
                        zIndex: 79, 
                        animationDelay: '0.2s',
                        transform: 'translateZ(0) scale(0.8)',
                        willChange: 'transform, opacity',
                        opacity: 1
                      }}
                    >
                      <div className="w-full h-full rounded-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.4)' }}></div>
                    </div>
                    <div 
                      className="absolute animate-circle-pulse" 
                      style={{ 
                        width: '120px', 
                        height: '120px', 
                        zIndex: 78, 
                        animationDelay: '0.4s',
                        transform: 'translateZ(0) scale(0.8)',
                        willChange: 'transform, opacity',
                        opacity: 1
                      }}
                    >
                      <div className="w-full h-full rounded-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.3)' }}></div>
                    </div>
                  </>
                )}
                
                {/* 추적 CCTV 아이콘 */}
                <div 
                  className="absolute cursor-pointer" 
                  style={{ zIndex: 130 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event.id);
                  }}
                >
                  {(() => {
                    // 같은 위치에 있는 이벤트 개수 계산 (위치가 1% 이내로 가까운 경우)
                    const samePositionEvents = events.filter(e => {
                      const otherPosition = getEventPosition(e);
                      const distance = Math.sqrt(
                        Math.pow(position.left - otherPosition.left, 2) + 
                        Math.pow(position.top - otherPosition.top, 2)
                      );
                      return distance < 1; // 1% 이내 거리
                    });
                    const clusterCount = samePositionEvents.length;
                    const hasMultiple = clusterCount > 1 && zoomLevel === 0;
                    
                    return (
                      <div 
                        className={`${getCCTVIconClassName('tracking')} flex items-center justify-center ${hasMultiple ? 'w-auto min-w-[28px]' : ''}`}
                        style={{ 
                          ...getCCTVIconBoxStyle(clusterCount, mapScale, hasMultiple),
                          transformOrigin: 'center center'
                        }}
                      >
                        <Icon 
                          icon="mdi:map-marker"
                          className="text-red-400"
                          width="16px"
                          height="16px"
                        />
                        {/* 이벤트 개수 - 축소 모드에서만 표시 */}
                        {hasMultiple && (
                          <span className="text-xs font-semibold text-red-400 ml-1" style={{ whiteSpace: 'nowrap' }}>
                            {formatCCTVCount(clusterCount)}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>

      </div>



      {/* Agent Hub 버튼 - 우측 하단 플로팅 버튼 */}
      <div
        className="absolute group"
        style={{
          bottom: (showCCTV && !hideControls) ? '152px' : '24px',
          right: '24px',
          zIndex: 200,
          transition: 'bottom 0.3s ease-in-out',
        }}
      >
        <a
          href="/agent-hub"
          target="_blank"
          rel="noopener noreferrer"
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
        >
          <img 
            src="/simbol.svg" 
            alt="AI" 
            className="w-6 h-6"
            style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }}
          />
        </a>
        {/* 툴팁 */}
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-[#1a1a1a] text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-[#31353a]">
          Agent Hub 이동
          <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-[#1a1a1a]"></div>
        </div>
      </div>


    </div>
  );
};

export default MapView;
