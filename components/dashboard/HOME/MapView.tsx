import { Event } from '@/types';
import { Icon } from '@iconify/react';
import { useMemo, useState, useRef, useEffect } from 'react';
import { getCCTVIconClassName, getCCTVLabelClassName } from '@/components/shared/styles';
import CCTVIcon from '@/components/common/CCTVIcon';
import { CCTV_TITLES } from '../cctv-titles';
import CCTVMeshTracking from '../CCTVMeshTracking';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  getCCTVViewAngle as getCCTVViewAngleUtil, 
  generateViewAnglePath,
  getCCTVConfigMap
} from '@/lib/cctv-view-angle-utils';
import { getRandomCCTVVideo } from '@/lib/cctv-video-utils';
import BottomPanel from '../BottomPanel';

interface MapViewProps {
  events: Event[];
  highlightedEventId?: string | null;
  onEventClick?: (eventId: string) => void;
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

const MapView = ({ events, highlightedEventId, onEventClick, selectedEventId, aiDetectionEventId, cctvIndex, onMapClick, externalZoomLevel, onZoomLevelChange, onAiDetectionClose, hideControls = false, leftPanelWidth = 480, isAutoMode = true }: MapViewProps) => {
  const [zoomLevel, setZoomLevel] = useState(0);
  const [cctvViewAngles, setCctvViewAngles] = useState<Record<string, number>>({});
  const [showCCTV, setShowCCTV] = useState(true);
  const [showCCTVViewAngle, setShowCCTVViewAngle] = useState(true);
  const [showCCTVName, setShowCCTVName] = useState(true);
  const [is3DMode, setIs3DMode] = useState(true);
  const [mapBearing, setMapBearing] = useState(-17.6);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);
  const [isProgressComplete, setIsProgressComplete] = useState(false);
  const [viewAngleAnimationProgress, setViewAngleAnimationProgress] = useState(0);
  const [showEventCard, setShowEventCard] = useState(false);
  const [hoveredCCTVIndex, setHoveredCCTVIndex] = useState<number | null>(null);
  const [openedCCTVPopups, setOpenedCCTVPopups] = useState<Set<number>>(new Set());
  const cctvScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUserScrollingRef = useRef(false);
  const userScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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


  const getCCTVViewAngle = (cctvId: string, defaultViewAngle: number): number => {
    if (cctvViewAngles[cctvId] !== undefined) {
      return cctvViewAngles[cctvId];
    }
    return getCCTVViewAngleUtil(cctvId, defaultViewAngle);
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

  useEffect(() => {
    const isEvent1Selected = selectedEventId && events.find(e => e.id === selectedEventId && (e.eventId === 'A-20260107-004' || e.id === 'A-20260107-004'));
    
    if (isEvent1Selected && zoomLevel === 1) {
      setIsProgressComplete(false);
      setViewAngleAnimationProgress(0);
      setShowEventCard(true);
      
      // 3초 후 카드 페이드 아웃 및 프로그래스 완료, 화각 애니메이션 시작
      const timer = setTimeout(() => {
        setShowEventCard(false);
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
    } else if (!isEvent1Selected || zoomLevel === 0) {
      setIsProgressComplete(false);
      setViewAngleAnimationProgress(0);
      setShowEventCard(false);
    }
  }, [selectedEventId, zoomLevel, events]);

  useEffect(() => {
    if (!isAutoMode) {
      setViewAngleAnimationProgress(0);
    }
  }, [isAutoMode]);

  // 투망감시 모드 시작 시 모든 블루 CCTV 팝업 및 CCTV-V-11 팝업 열기
  useEffect(() => {
    const isEvent1Selected = selectedEventId && events.find(e => e.id === selectedEventId && (e.eventId === 'A-20260107-004' || e.id === 'A-20260107-004'));
    
    if (isEvent1Selected && isProgressComplete && viewAngleAnimationProgress > 0) {
      // 블루 CCTV 인덱스: [0, 8, 1, 7, 6, 9, 5, 4] -> CCTV 인덱스: [1, 9, 2, 8, 7, 10, 6, 5]
      // CCTV-V-11도 포함
      const blueCCTVIndices = [1, 9, 2, 8, 7, 10, 6, 5, 11];
      setOpenedCCTVPopups(new Set(blueCCTVIndices));
    } else if (!isEvent1Selected || zoomLevel === 0) {
      setOpenedCCTVPopups(new Set());
    }
  }, [isProgressComplete, viewAngleAnimationProgress, selectedEventId, zoomLevel, events]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const prevZoomLevelRef = useRef(zoomLevel);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const isEvent1Selected = selectedEventId && events.find(e => e.id === selectedEventId && (e.eventId === 'A-20260107-004' || e.id === 'A-20260107-004'));
    
    if (zoomLevel > 0 && prevZoomLevelRef.current === 0 && showCCTV && showCCTVViewAngle && !isEvent1Selected) {
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
        const easedProgress = 1 - Math.pow(1 - progress, 3);

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
    } else if (zoomLevel === 0) {
      prevZoomLevelRef.current = zoomLevel;
    } else {
      prevZoomLevelRef.current = zoomLevel;
    }
  }, [zoomLevel, showCCTV, showCCTVViewAngle, selectedEventId, events]);
  
  const mapScale = zoomLevel === 0 ? 1 : 1.3;
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

    map.on('load', () => {
      const style = map.getStyle();
      if (!style || !style.layers) return;

      const layers = style.layers;

      layers.forEach((layer: any) => {
        const layerId = layer.id.toLowerCase();
        const isBuildingLayer = 
          layerId.includes('building') || 
          layerId.includes('건물') ||
          layerId.includes('extrusion') ||
          (layer.type === 'fill-extrusion');
        
        if (isBuildingLayer) {
          try {
            if (layer.type === 'fill-extrusion') {
              if (map.getLayer(layer.id)) {
                map.setPaintProperty(layer.id, 'fill-extrusion-height', [
                  'case',
                  ['has', 'height'],
                  ['*', ['to-number', ['get', 'height']], 1],
                  ['has', 'render_height'],
                  ['*', ['to-number', ['get', 'render_height']], 1],
                  ['has', 'building:levels'],
                  ['*', ['to-number', ['get', 'building:levels']], 3],
                  15
                ]);
                map.setPaintProperty(layer.id, 'fill-extrusion-base', [
                  'case',
                  ['has', 'min_height'],
                  ['to-number', ['get', 'min_height']],
                  0
                ]);
              }
            } else if (layer.type === 'fill' && layer.source) {
              const sourceId = layer.source;
              const sourceLayer = layer['source-layer'];
              
              if (map.getSource(sourceId)) {
                if (map.getLayer(layer.id)) {
                  map.removeLayer(layer.id);
                }
                
                map.addLayer({
                  id: `${layer.id}-3d`,
                  type: 'fill-extrusion',
                  source: sourceId,
                  'source-layer': sourceLayer,
                  paint: {
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
        duration: 300
      });
    }
  }, [mapBearing]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCCTV = localStorage.getItem('cctv-show-cctv');
      if (savedCCTV === 'true') {
        setShowCCTV(true);
      } else if (savedCCTV === null || savedCCTV === 'false') {
        setShowCCTV(true);
        setShowCCTVViewAngle(true);
        setShowCCTVName(true);
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
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);


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

  const [cachedPositions, setCachedPositions] = useState<Record<string, { left: number; top: number }>>({});

  useEffect(() => {
    if (!events || events.length === 0) {
      return;
    }

    const newEvents = events.filter(event => !cachedPositions[event.id]);
    
    if (newEvents.length === 0) {
      return;
    }

    const existingEventIds = Object.keys(cachedPositions);
    const existingEvents = events.filter(e => existingEventIds.includes(e.id));
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
      const existingPriorityEvents = eventsByPriority[priority].filter(e => cachedPositions[e.id]);
      const newPriorityEvents = eventsByPriority[priority].filter(e => !cachedPositions[e.id]);
      
      newPriorityEvents.sort(() => {
        return seededRandom(`${priority}-shuffle`) - 0.5;
      });
      
      eventsByPriority[priority] = [...existingPriorityEvents, ...newPriorityEvents];
    });

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

    rings.forEach((ringEvents, ringIndex) => {
      if (!ringEvents || ringEvents.length === 0) {
        return;
      }

      const existingRingEvents = ringEvents.filter(e => cachedPositions[e.id]);
      const newRingEvents = ringEvents.filter(e => !cachedPositions[e.id]);

      if (newRingEvents.length === 0) {
        return;
      }

      const radius = baseRadius + (ringIndex * ringGap);
      const angleStep = (Math.PI * 2) / ringEvents.length;
      
      let ringAngleOffset: number;
      if (existingRingEvents.length > 0) {
        const firstExistingEvent = existingRingEvents[0];
        const firstPos = cachedPositions[firstExistingEvent.id];
        const firstIndex = ringEvents.findIndex(e => e.id === firstExistingEvent.id);
        const dx = firstPos.left - centerX;
        const dy = firstPos.top - centerY;
        const firstAngle = Math.atan2(dy, dx);
        const firstAngleJitter = (seededRandom(`${firstExistingEvent.id}-angle`) - 0.5) * angleStep * 0.4;
        ringAngleOffset = firstAngle - (firstIndex * angleStep) - firstAngleJitter;
      } else {
        ringAngleOffset = seededRandom(`ring-${ringIndex}`) * angleStep;
      }

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

    const newEventIds = newEvents.map(e => e.id);
    if (newEventIds.includes('event-3') && newEventIds.includes('event-7') && newPositions['event-3'] && newPositions['event-7']) {
      const tempPosition = newPositions['event-3'];
      newPositions['event-3'] = newPositions['event-7'];
      newPositions['event-7'] = tempPosition;
    }

    setCachedPositions(prev => ({ ...prev, ...newPositions }));
  }, [events.map(e => e.id).join(',')]);

  const positionsById = useMemo(() => {
    const result: Record<string, { left: number; top: number }> = {};
    events.forEach(event => {
      if (cachedPositions[event.id]) {
        result[event.id] = cachedPositions[event.id];
      }
    });
    return result;
  }, [events, cachedPositions]);

  const getRandomCCTVDirection = (index: number, subIndex?: number): number => {
    const n = subIndex !== undefined ? index * 13 + subIndex * 7 : index * 13;
    return (n * 97) % 360;
  };

  const getZoomedCCTVDirection = (index: number): number => {
    if (index === 0) return 150;
    if (index === 4) return -70;
    if (index === 5) return -30;
    if (index === 6) return 60;
    if (index === 7) return 120;
    if (index === 8) return 150;
    if (index === 9) return -120;
    return getRandomCCTVDirection(index);
  };

  const mapTranslate = useMemo(() => {
    if (zoomLevel === 0 || !selectedEventId) {
      return { x: 0, y: 0, offsetX: 0 };
    }
    
    const selectedEvent = events.find(e => e.id === selectedEventId);
    if (!selectedEvent) {
      return { x: 0, y: 0, offsetX: 0 };
    }
    
    const eventPosition = positionsById[selectedEvent.id] || { left: centerX, top: centerY };
    const translateX = (50 - eventPosition.left) * mapScale - 5;
    const translateY = (50 - eventPosition.top) * mapScale;
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : windowWidth;
    const offsetXPx = 100;
    const offsetXPercent = (offsetXPx / screenWidth) * 100;
    
    return { x: translateX, y: translateY, offsetX: offsetXPercent };
  }, [zoomLevel, selectedEventId, events, mapScale, positionsById, windowWidth]);

  const getEventPosition = (event: Event) => {
    return positionsById[event.id] || { left: centerX, top: centerY };
  };





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
        const target = e.target as HTMLElement;
        if (target.closest('[data-tooltip]') || target.closest('[data-event-pin]')) {
          e.stopPropagation();
        }
      }}
    >
       <div 
         className="absolute top-4 flex flex-col gap-2 transition-all duration-500 ease-in-out" 
         style={{ 
           left: `${leftPanelWidth + 24}px`,
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
         className="absolute top-1/2 flex flex-col gap-2 transition-all duration-500 ease-in-out" 
         style={{ 
           left: `${leftPanelWidth + 24}px`,
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
                : 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]'
            }`}
             style={{ borderWidth: '1px', borderColor: 'rgba(59, 130, 246, 0.3)' }}
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
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.6),0_0_40px_rgba(59,130,246,0.3)] ring-2 ring-[rgba(59,130,246,0.3)]' 
              : 'bg-gradient-to-br from-[#2a2a2a] via-[#1a1a1a] to-[#0f0f0f] hover:from-[#3a3a3a] hover:via-[#2a2a2a] hover:to-[#1a1a1a] text-gray-300 border-2 hover:shadow-[0_0_20px_rgba(59,130,246,0.5),0_0_40px_rgba(59,130,246,0.2)]'
          }`}
           style={{ 
             borderWidth: showCCTV ? '0px' : '2px', 
             borderColor: 'rgba(59, 130, 246, 0.3)'
           }}
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
                : 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]'
            }`}
             style={{ borderWidth: '1px', borderColor: 'rgba(59, 130, 246, 0.3)' }}
             aria-label="시야각 켜기"
           >
             <Icon icon="mdi:angle-acute" className="w-5 h-5" />
           </button>
         )}
       </div>

      <div
        className="relative border border-[#31353a] transition-transform duration-700 ease-out"
        style={{
          borderWidth: '1px',
          height: '100%',
          width: zoomLevel > 0 ? 'calc(100% + 100px)' : '100%',
          left: zoomLevel > 0 ? '-100px' : '0',
          transform: `scale(${mapScale}) translate(calc(${mapTranslate.x}% + ${mapTranslate.offsetX}%), ${mapTranslate.y}%) translateZ(0)`,
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
          className="absolute inset-0 bg-black/5" 
          style={{ zIndex: 2 }}
        ></div>
        
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
        {showCCTV && [
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
        ].map((item, index) => {
          const cctvName = `CCTV-V-${index + 1}`;
          if (zoomLevel === 0) {
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
                  const homeViewAngle = 90;
                  
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
                      
                      const direction = getRandomCCTVDirection(index, i);
                      const pathData = generateViewAnglePath(homeViewAngle, 50, 60, 60);
                      
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
                  const direction = isAutoMode ? getZoomedCCTVDirection(index) : getRandomCCTVDirection(index);
                  const pathData = generateViewAnglePath(homeViewAngle, 50, 60, 60);
                  
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
            return Array.from({ length: item.count }, (_, i) => {
              const baseCctvId = `cctv-${index}`;
              
              if (item.count === 1) {
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
                      cursor: (() => {
                        const blueCCTVIndices = [0, 8, 1, 7, 6, 9, 5, 4];
                        const shouldChangeToBlue = blueCCTVIndices.includes(index) && isAutoMode && isProgressComplete && viewAngleAnimationProgress > 0;
                        return shouldChangeToBlue ? 'pointer' : 'default';
                      })(),
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const blueCCTVIndices = [0, 8, 1, 7, 6, 9, 5, 4];
                      const shouldChangeToBlue = blueCCTVIndices.includes(index) && isAutoMode && isProgressComplete && viewAngleAnimationProgress > 0;
                      if (shouldChangeToBlue) {
                        const cctvIndexForPopup = index + 1;
                        setOpenedCCTVPopups(prev => {
                          const newSet = new Set(prev);
                          newSet.add(cctvIndexForPopup);
                          return newSet;
                        });
                      }
                    }}
                  >
                    {(() => {
                      const blueCCTVIndices = [0, 8, 1, 7, 6, 9, 5, 4];
                      const shouldChangeToBlue = blueCCTVIndices.includes(index) && isAutoMode && isProgressComplete && viewAngleAnimationProgress > 0;
                      const cctvIndexForPopup = index + 1;
                      const isHovered = hoveredCCTVIndex === cctvIndexForPopup;
                      return (
                        <div 
                          className={getCCTVIconClassName(shouldChangeToBlue ? 'active' : 'light')} 
                          style={{ 
                            ...getCCTVIconBoxStyle(1, mapScale, false, 60), 
                            cursor: shouldChangeToBlue ? 'pointer' : 'default',
                            ...(isHovered ? {
                              background: 'linear-gradient(135deg, #e5e5e5 0%, #d4d4d4 50%, #c4c4c4 100%)',
                            } : {})
                          }}
                          {...(shouldChangeToBlue ? {
                            onMouseEnter: () => {
                              setHoveredCCTVIndex(cctvIndexForPopup);
                            },
                            onMouseLeave: () => {
                              setHoveredCCTVIndex(null);
                            }
                          } : {})}
                        >
                          <CCTVIcon 
                            className={shouldChangeToBlue ? "text-blue-400" : "!text-gray-300"}
                            style={shouldChangeToBlue ? { color: '#60a5fa' } : { color: '#d1d5db' }}
                            width="16px"
                            height="16px"
                          />
                        </div>
                      );
                    })()}
                    {showCCTVName && (
                      <div className={`${getCCTVLabelClassName('default')} absolute top-full left-1/2 -translate-x-1/2 mt-1`}>
                        CCTV-V-{index + 1}
                      </div>
                    )}
                    {showCCTVViewAngle && (() => {
                      const cctvId = `cctv-${index}-${i}`;
                      const isEvent1Selected = selectedEventId && events.find(e => e.id === selectedEventId && (e.eventId === 'A-20260107-004' || e.id === 'A-20260107-004'));
                      let direction: number;
                      
                      if (isEvent1Selected) {
                        const cctvPositions = [
                          { viewAngle: 45 },
                          { viewAngle: 90 },
                          { viewAngle: 135 },
                          { viewAngle: 180 },
                          { viewAngle: 225 },
                          { viewAngle: 270 },
                          { viewAngle: 315 },
                          { viewAngle: 0 },
                          { viewAngle: 60 },
                          { viewAngle: 120 },
                        ];
                        const defaultDirection = cctvPositions[index]?.viewAngle ?? getRandomCCTVDirection(index);
                        const targetDirection = getZoomedCCTVDirection(index);
                        
                        if (isAutoMode && isProgressComplete && viewAngleAnimationProgress > 0) {
                          direction = defaultDirection + (targetDirection - defaultDirection) * viewAngleAnimationProgress;
                        } else {
                          direction = defaultDirection;
                        }
                      } else {
                        if (isAutoMode) {
                          direction = getZoomedCCTVDirection(index);
                        } else {
                          direction = getRandomCCTVDirection(index);
                        }
                      }
                      
                      if (zoomLevel === 0) {
                        return null;
                      }
                      
                      const homeViewAngle = 90;
                      const pathData = generateViewAnglePath(homeViewAngle, 50, 60, 60);
                      
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
                            transition: isEvent1Selected && isAutoMode && isProgressComplete && viewAngleAnimationProgress > 0 ? 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.7s ease-out' : 'opacity 0.7s ease-out',
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
              const actualCctvLeft = item.left + offsetLeft;
              const actualCctvTop = item.top + offsetTop;
              
              return (
                <div
                  key={`virtual-cctv-${index}-${i}`}
                  className="absolute cursor-pointer"
                  style={{ 
                    left: `${actualCctvLeft}%`, 
                    top: `${actualCctvTop}%`, 
                    transform: 'translate(-50%, -50%)', 
                    zIndex: 50,
                    transition: 'left 0.7s ease-out, top 0.7s ease-out, opacity 0.7s ease-out',
                    opacity: zoomLevel > 0 ? 1 : 0,
                    cursor: (() => {
                      const blueCCTVIndices = [0, 8, 1, 7, 6, 9, 5, 4];
                      const shouldChangeToBlue = blueCCTVIndices.includes(index) && isAutoMode && isProgressComplete && viewAngleAnimationProgress > 0;
                      return shouldChangeToBlue ? 'pointer' : 'default';
                    })(),
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const blueCCTVIndices = [0, 8, 1, 7, 6, 9, 5, 4];
                    const shouldChangeToBlue = blueCCTVIndices.includes(index) && isAutoMode && isProgressComplete && viewAngleAnimationProgress > 0;
                    if (shouldChangeToBlue) {
                      const cctvIndexForPopup = index + 1;
                      setOpenedCCTVPopups(prev => {
                        const newSet = new Set(prev);
                        newSet.add(cctvIndexForPopup);
                        return newSet;
                      });
                    }
                  }}
                >
                  {(() => {
                    const blueCCTVIndices = [0, 8, 1, 7, 6, 9, 5, 4];
                    const shouldChangeToBlue = blueCCTVIndices.includes(index) && isAutoMode && isProgressComplete && viewAngleAnimationProgress > 0;
                    const cctvIndexForPopup = index + 1;
                    const isHovered = hoveredCCTVIndex === cctvIndexForPopup;
                    return (
                      <div 
                        className={getCCTVIconClassName(shouldChangeToBlue ? 'active' : 'light')} 
                        style={{ 
                          ...getCCTVIconBoxStyle(1, mapScale, false, 60), 
                          cursor: shouldChangeToBlue ? 'pointer' : 'default',
                          ...(isHovered ? {
                            background: 'linear-gradient(135deg, #e5e5e5 0%, #d4d4d4 50%, #c4c4c4 100%)',
                          } : {})
                        }}
                        {...(shouldChangeToBlue ? {
                          onMouseEnter: () => {
                            setHoveredCCTVIndex(cctvIndexForPopup);
                          },
                          onMouseLeave: () => {
                            setHoveredCCTVIndex(null);
                          }
                        } : {})}
                      >
                        <CCTVIcon 
                          className={shouldChangeToBlue ? "text-blue-400" : "!text-gray-300"}
                          style={shouldChangeToBlue ? { color: '#60a5fa' } : { color: '#d1d5db' }}
                          width="16px"
                          height="16px"
                        />
                      </div>
                    );
                  })()}
                  {showCCTVName && (
                    <div className={`${getCCTVLabelClassName('default')} absolute top-full left-1/2 -translate-x-1/2 mt-1`}>
                      CCTV-V-{index + 1}
                    </div>
                  )}
                  {showCCTVViewAngle && (() => {
                    const cctvId = `cctv-${index}-${i}`;
                    const direction = isAutoMode ? getZoomedCCTVDirection(index) : getRandomCCTVDirection(index, i);
                    
                    if (zoomLevel === 0) {
                      return null;
                    }
                    
                    const homeViewAngle = 90;
                    const pathData = generateViewAnglePath(homeViewAngle, 50, 60, 60);
                    
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

        <div className="absolute inset-0" style={{ zIndex: 100, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {(events || []).map((event) => {
            const position = getEventPosition(event);
            const isHighlighted = highlightedEventId === event.id;
            const isSelected = selectedEventId === event.id;
            const isEvent1 = event.eventId === 'A-20260107-004' || event.id === 'A-20260107-004';

            return (
              <div
                key={event.id}
                data-event-pin
                className="absolute flex items-center justify-center"
                style={{
                  left: `${position.left}%`,
                  top: `${position.top}%`,
                  transform: isEvent1 ? 'translate(-50%, calc(-50% - 30px))' : 'translate(-50%, -50%)',
                  zIndex: isSelected ? 150 : isHighlighted ? 140 : 100,
                  pointerEvents: 'auto',
                  opacity: isEvent1 ? 1 : 1,
                }}
              >
                {isSelected && !event.title.includes('상가 절도 의심') && !event.title.includes('현금 절취 포착') && isEvent1 && (
                  <>
                    <div 
                      className="absolute animate-circle-pulse" 
                      style={{ 
                        width: '120px', 
                        height: '120px', 
                        zIndex: 1, 
                        animationDelay: '0s',
                        transform: 'translateZ(0) scale(0.8)',
                        willChange: 'transform, opacity',
                        opacity: 1,
                        pointerEvents: 'none'
                      }}
                    >
                      <div className="w-full h-full rounded-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.5)' }}></div>
                    </div>
                    <div 
                      className="absolute animate-circle-pulse" 
                      style={{ 
                        width: '120px', 
                        height: '120px', 
                        zIndex: 1, 
                        animationDelay: '0.2s',
                        transform: 'translateZ(0) scale(0.8)',
                        willChange: 'transform, opacity',
                        opacity: 1,
                        pointerEvents: 'none'
                      }}
                    >
                      <div className="w-full h-full rounded-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.4)' }}></div>
                    </div>
                    <div 
                      className="absolute animate-circle-pulse" 
                      style={{ 
                        width: '120px', 
                        height: '120px', 
                        zIndex: 1, 
                        animationDelay: '0.4s',
                        transform: 'translateZ(0) scale(0.8)',
                        willChange: 'transform, opacity',
                        opacity: 1,
                        pointerEvents: 'none'
                      }}
                    >
                      <div className="w-full h-full rounded-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.3)' }}></div>
                    </div>
                  </>
                )}
                
                <div 
                  className="absolute cursor-pointer" 
                  style={{ zIndex: 130 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event.id);
                  }}
                >
                  {(() => {
                    const samePositionEvents = events.filter(e => {
                      const otherPosition = getEventPosition(e);
                      const distance = Math.sqrt(
                        Math.pow(position.left - otherPosition.left, 2) + 
                        Math.pow(position.top - otherPosition.top, 2)
                      );
                      return distance < 1;
                    });
                    const clusterCount = samePositionEvents.length;
                    const hasMultiple = clusterCount > 1 && zoomLevel === 0;
                    
                    const cctvLabel = isEvent1 
                      ? 'CCTV-V-11'
                      : (cctvIndex !== undefined && cctvIndex !== null && cctvIndex >= 1 && cctvIndex <= 10)
                        ? CCTV_TITLES[cctvIndex - 1] 
                        : null;
                    
                    const isHovered = isEvent1 && hoveredCCTVIndex === 11;
                    return (
                      <>
                        <div 
                          className={`${isEvent1 ? getCCTVIconClassName('light') : getCCTVIconClassName('tracking')} flex items-center justify-center ${hasMultiple ? 'w-auto min-w-[28px]' : ''} relative`}
                          style={{ 
                            ...getCCTVIconBoxStyle(clusterCount, mapScale, hasMultiple),
                            transformOrigin: 'center center',
                            opacity: isEvent1 ? 1 : (zoomLevel > 0 ? 1 : 0),
                            ...(isEvent1 && isSelected && {
                              borderColor: 'rgb(239, 68, 68)',
                            }),
                            ...(isHovered ? {
                              background: 'linear-gradient(135deg, #e5e5e5 0%, #d4d4d4 50%, #c4c4c4 100%)',
                            } : {}),
                            cursor: isEvent1 && isSelected ? 'pointer' : 'default',
                          }}
                          onMouseEnter={() => {
                            if (isEvent1 && isSelected) {
                              setHoveredCCTVIndex(11);
                            }
                          }}
                          onMouseLeave={() => {
                            if (isEvent1 && isSelected) {
                              setHoveredCCTVIndex(null);
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isEvent1 && isSelected) {
                              setOpenedCCTVPopups(prev => {
                                const newSet = new Set(prev);
                                newSet.add(11);
                                return newSet;
                              });
                            }
                          }}
                        >
                          {isEvent1 ? (
                            <CCTVIcon 
                              className={isSelected ? "text-red-400 drop-shadow-lg" : "!text-gray-300"} 
                              style={isSelected ? {} : { color: '#d1d5db' }} 
                              width="16px" 
                              height="16px" 
                            />
                          ) : (
                            <Icon 
                              icon="mdi:map-marker"
                              className="text-red-400"
                              width="16px"
                              height="16px"
                            />
                          )}
                          {hasMultiple && !isEvent1 && (
                            <span className="text-xs font-semibold text-red-400 ml-1" style={{ whiteSpace: 'nowrap' }}>
                              {formatCCTVCount(clusterCount)}
                            </span>
                          )}
                        </div>
                        {cctvLabel && (
                          <div 
                            className={`${isEvent1 ? getCCTVLabelClassName(isSelected ? 'tracking' : 'default') : getCCTVLabelClassName('tracking')} absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap`}
                            style={{ opacity: isEvent1 ? 1 : (zoomLevel > 0 ? 1 : 0) }}
                          >
                            {cctvLabel}
                          </div>
                        )}
                        {isEvent1 && isSelected && (
                          <div
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 whitespace-nowrap transition-opacity duration-500"
                            style={{
                              opacity: showEventCard ? 1 : 0,
                              pointerEvents: showEventCard ? 'auto' : 'none',
                              zIndex: 200,
                            }}
                          >
                            <div
                              className="px-4 py-3 rounded-lg"
                              style={{
                                background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(23,23,23,0.8) 100%)',
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                                border: '2px solid rgba(239, 68, 68, 0.9)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                              }}
                            >
                              <div className="text-white font-semibold text-sm mb-1">CCTV-V-11에서 폭력(싸움) 이벤트가 감지되었습니다.</div>
                              <div className="text-gray-300 text-xs">투망감시를 시작합니다.</div>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {aiDetectionEventId && cctvIndex !== null && cctvIndex !== undefined && (() => {
        const cctvV11Position = { left: 34, top: 40 };
        
        const requestedCCTVs = [
          { name: 'CCTV-V-1', index: 0, position: { left: 34, top: 40 } },
          { name: 'CCTV-V-2', index: 1, position: { left: 40, top: 38 } },
          { name: 'CCTV-V-5', index: 4, position: { left: 50, top: 56 } },
          { name: 'CCTV-V-6', index: 5, position: { left: 42, top: 58 } },
          { name: 'CCTV-V-7', index: 6, position: { left: 34, top: 56 } },
          { name: 'CCTV-V-8', index: 7, position: { left: 32, top: 48 } },
          { name: 'CCTV-V-9', index: 8, position: { left: 38, top: 42 } },
          { name: 'CCTV-V-10', index: 9, position: { left: 48, top: 50 } },
        ];
        
        const sortedCCTVs = requestedCCTVs
          .map(cctv => {
            const distance = Math.sqrt(
              Math.pow(cctv.position.left - cctvV11Position.left, 2) +
              Math.pow(cctv.position.top - cctvV11Position.top, 2)
            );
            return { ...cctv, distance };
          })
          .sort((a, b) => a.distance - b.distance);
        
        const mainPopupWidth = 420;
        const gridPopupWidth = 320;
        const padding = 20;
        const screenWidth = typeof window !== 'undefined' ? window.innerWidth : windowWidth;
        const remainingWidth = screenWidth - mainPopupWidth - (padding * 3);
        
        return (
          <>
            <CCTVMeshTracking
              event={events.find(e => e.id === aiDetectionEventId) || null}
              onClose={() => onAiDetectionClose?.()}
              cctvIndex={11}
              position={{ 
                top: `${padding}px`, 
                right: `${padding}px`,
                left: undefined,
                bottom: undefined
              }}
              hideControls={hideControls}
              isAutoMode={isAutoMode}
              isProgressComplete={isProgressComplete}
              viewAngleAnimationProgress={viewAngleAnimationProgress}
              highlighted={hoveredCCTVIndex === 11}
              onHover={setHoveredCCTVIndex}
            />
            
            <div
              style={{
                position: 'absolute',
                left: `${padding}px`,
                top: `${padding + (hideControls ? 56 : 0)}px`,
                display: 'grid',
                gridTemplateColumns: `repeat(2, ${gridPopupWidth}px)`,
                gridAutoRows: 'auto',
                gap: `${padding}px`,
                pointerEvents: 'none',
                zIndex: 1000,
              }}
            >
              {sortedCCTVs.map((cctv, idx) => {
                const cctvIndexForTitle = cctv.index + 1;
                
                if (!openedCCTVPopups.has(cctvIndexForTitle)) {
                  return null;
                }
                
                return (
                  <div
                    key={`${cctv.name}-${idx}`}
                    style={{
                      width: `${gridPopupWidth}px`,
                      height: 'fit-content',
                      pointerEvents: 'auto',
                    }}
                  >
                    <CCTVMeshTracking
                      event={events.find(e => e.id === aiDetectionEventId) || null}
                      onClose={() => {
                        setOpenedCCTVPopups(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(cctvIndexForTitle);
                          return newSet;
                        });
                      }}
                      cctvIndex={cctvIndexForTitle}
                      position={undefined}
                      width={gridPopupWidth}
                      hideControls={hideControls}
                      isAutoMode={isAutoMode}
                      isProgressComplete={isProgressComplete}
                      viewAngleAnimationProgress={viewAngleAnimationProgress}
                      highlighted={hoveredCCTVIndex === cctvIndexForTitle}
                      onHover={setHoveredCCTVIndex}
                    />
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}

      <BottomPanel
        showCCTV={showCCTV}
        hideControls={hideControls}
        leftPanelWidth={leftPanelWidth}
        windowWidth={windowWidth}
        cctvScrollContainerRef={cctvScrollContainerRef}
        isUserScrollingRef={isUserScrollingRef}
        userScrollTimeoutRef={userScrollTimeoutRef}
        autoScrollIntervalRef={autoScrollIntervalRef}
      />

      {(() => {
        const rightPanelWidth = 370;
        const panelGap = 16;
        const verticalPadding = 16;
        const availableWidth = windowWidth - leftPanelWidth - rightPanelWidth - (panelGap * 2);
        const gap = 12;
        const paddingHorizontal = 16;
        const totalGapWidth = gap * 3;
        const totalPaddingWidth = paddingHorizontal * 2;
        const itemWidth = Math.floor((availableWidth - totalGapWidth - totalPaddingWidth) / 4);
        const itemHeight = Math.floor((itemWidth * 3) / 4);
        const cctvPanelRight = rightPanelWidth + panelGap;
        const cctvPanelHeight = itemHeight + (verticalPadding * 2);
        const floatingButtonRight = hideControls ? 24 : cctvPanelRight + 20;
        const floatingButtonBottom = hideControls ? 24 : cctvPanelHeight + 16 + 20;
        
        return (
          <div
            className="absolute group"
            style={{
              bottom: `${floatingButtonBottom}px`,
              right: `${floatingButtonRight}px`,
              zIndex: 200,
              transition: 'bottom 0.3s ease-in-out, right 0.3s ease-in-out',
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
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-[#1a1a1a] text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-[#31353a]">
              CUVIA LINK로 이동
              <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-[#1a1a1a]"></div>
            </div>
          </div>
        );
      })()}


    </div>
  );
};

export default MapView;
