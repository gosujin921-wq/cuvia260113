import { Event } from '@/types';
import { Icon } from '@iconify/react';
import { useMemo, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  leftPanelWidth?: number;
  pinOffset?: { x: number; y: number };
  focusTargetXPercent?: number; // 줌 시 포커스(화면) 위치 (기본: 50)
  flyToLocation?: [number, number] | null; // 지도를 특정 위치로 이동시키는 좌표
  externalShowCCTV?: boolean; // 외부에서 CCTV 표시 제어
  showPredictedCCTV?: boolean; // 예측된 CCTV 파란색 핀 표시
  visibleTrackingPins?: number; // 보이는 추적 핀 개수 (0~4)
}

const MapView = ({ events, highlightedEventId, onEventClick, selectedEventId, aiDetectionEventId, onMapClick, onEventHover, onToggleGeneralEvents, externalZoomLevel, onZoomLevelChange, onAiDetectionClose, hideControls = false, showFastSearch = false, showFastSearchList = false, fastSearchRadius = 300, leftPanelWidth = 480, pinOffset = { x: 0, y: 0 }, focusTargetXPercent = 50, flyToLocation = null, externalShowCCTV, showPredictedCCTV = false, visibleTrackingPins = 0 }: MapViewProps) => {
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
      style: 'https://api.maptiler.com/maps/019c21f9-8624-7dcb-bcdb-d31ef1c059af/style.json?key=ny4gKYAFAR9pfkXMVnmh',
      center: [126.8136, 37.4865], // 역곡 좌표
      zoom: 15,
      pitch: 60,
      bearing: -17.6,
      attributionControl: false,
      interactive: true,
    });

    // 맵 로드 후 3D 건물 활성화
    map.on('load', () => {
      const style = map.getStyle();
      if (!style || !style.layers) return;

      // 모든 레이어 확인
      const layers = style.layers;
      console.log('Map layers:', layers.map((l: any) => ({ id: l.id, type: l.type, source: l.source })));

      // 레이어 처리
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
              // 이미 fill-extrusion이면 높이 설정
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
                
                // fill-extrusion 레이어 추가
                map.addLayer({
                  id: `${layer.id}-3d`,
                  type: 'fill-extrusion',
                  source: sourceId,
                  'source-layer': sourceLayer,
                  paint: {
                    'fill-extrusion-color': '#c8c8c8',
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

  // flyToLocation이 변경되면 지도 이동 및 마커 표시/숨김
  useEffect(() => {
    console.log('flyToLocation 변경:', flyToLocation, 'mapRef.current:', mapRef.current);
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    const oldEventMarker = (map as any)._eventMarker;
    
    if (flyToLocation) {
      console.log('지도 이동:', flyToLocation, 'visibleTrackingPins:', visibleTrackingPins);
      
      // 객체 추적 중일 때는 마커 생성 스킵, 지도만 이동
      if (visibleTrackingPins > 0) {
        console.log('[MapView] 객체 추적 중 - 지도만 이동');
        
        if (map.loaded()) {
          const currentZoom = map.getZoom();
          
          if (currentZoom >= 17) {
            // 이미 줌인 상태면 줌 유지하며 이동
            map.easeTo({
              center: flyToLocation as [number, number],
              duration: 1500,
              essential: true
            });
          } else {
            // 첫 줌인
            map.flyTo({
              center: flyToLocation as [number, number],
              zoom: 17,
              pitch: 60,
              bearing: -17.6 + 165,
              duration: 1500,
              essential: true
            });
          }
        }
        return; // 마커 생성 로직 실행 안함
      }
      
      // 일반 모드 - 기존 이벤트 마커 제거
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
      
      // 펄스 효과 3개 (고속검색 리스트 표시 시 또는 객체 추적 시에는 펄스 제거)
      if (!showFastSearchList && !showPredictedCCTV && visibleTrackingPins === 0) {
        for (let i = 0; i < 3; i++) {
          const pulse = document.createElement('div');
          pulse.style.cssText = `
            position: absolute;
            width: 120px;
            height: 120px;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50()) translateZ(0) scale(0.8);
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
      
      // 마커 아이콘 (객체 추적 상태일 때 회색으로 변경)
      const markerEl = document.createElement('div');
      const isGray = showPredictedCCTV;
      markerEl.style.cssText = `
        width: 28px;
        height: 28px;
        background: ${isGray 
          ? 'linear-gradient(135deg, rgba(100, 100, 100, 0.2) 0%, rgba(26, 26, 26, 1) 50%, rgba(15, 15, 15, 1) 100%)' 
          : 'linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(26, 26, 26, 1) 50%, rgba(15, 15, 15, 1) 100%)'};
        border: 2px solid ${isGray ? '#6b7280' : '#ef4444'};
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: ${isGray 
          ? '0 0 20px rgba(107, 114, 128, 0.5), 0 0 40px rgba(107, 114, 128, 0.3)' 
          : '0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3)'};
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
        border: 2px solid ${isGray ? 'rgba(107, 114, 128, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
        border-radius: 14px;
        pointer-events: none;
      `;
      markerEl.appendChild(ringEl);
      
      const iconEl = document.createElement('div');
      iconEl.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: ${isGray ? '#9ca3af' : '#f87171'};">
          <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z" />
        </svg>
      `;
      markerEl.appendChild(iconEl);
      
      centerWrapper.appendChild(markerEl);
      markerContainer.appendChild(centerWrapper);
      
      // 주소 라벨
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
        <div style="font-size: 10px; color: #9ca3af; margin-bottom: 2px;">사건 발생 지점</div>
        <div style="font-size: 12px; font-weight: 600; color: white;">춘의동 125-46</div>
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
      
      console.log('새 이벤트 마커 추가 완료');
      
      // 저장
      (map as any)._eventMarker = newMarker;
      
    } else {
      console.log('초기 위치로 복귀 및 마커 숨김');
      
      // 마커 제거
      if (oldEventMarker) {
        oldEventMarker.remove();
      }
      
      // 초기 위치로 복귀
      if (map.loaded()) {
        map.flyTo({
          center: [126.8136, 37.4865], // 역곡 좌표
          zoom: 15,
          pitch: 60,
          bearing: -17.6,
          duration: 1500,
          essential: true
        });
      }
    }
  }, [flyToLocation, showFastSearchList, showPredictedCCTV, visibleTrackingPins]);

  // 고속검색 리스트 표시 시 지도 이동 (우측으로 130px) - 프로그래스바 닫힌 후
  useEffect(() => {
    console.log('🗺️ [지도 이동 useEffect] showFastSearchList:', showFastSearchList, 'mapRef:', !!mapRef.current);
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    
    if (!showFastSearchList) return;
    
    // 지도 이동 함수
    const moveMap = () => {
      if (!map.loaded()) {
        console.log('🗺️ [지도 이동] 지도 로드 대기 중... 재시도');
        setTimeout(moveMap, 300);
        return;
      }
      
      // 현재 중심점 가져오기
      const currentCenter = map.getCenter();
      const currentZoom = map.getZoom();
      
      console.log('🗺️ [지도 이동] 시작 - 현재 중심:', currentCenter, 'zoom:', currentZoom);
      
      // 130px을 경도로 변환 (줌 레벨에 따라 다름)
      const pixelOffset = 130;
      const metersPerPixel = 156543.03392 * Math.cos(currentCenter.lat * Math.PI / 180) / Math.pow(2, currentZoom);
      const lngOffset = (pixelOffset * metersPerPixel) / 111320; // 경도 1도 = 약 111.32km
      
      console.log('🗺️ [지도 이동] 계산 - pixelOffset:', pixelOffset, 'lngOffset:', lngOffset);
      
      // 우측으로 이동 (경도 증가)
      map.easeTo({
        center: [currentCenter.lng + lngOffset, currentCenter.lat],
        duration: 800,
        essential: true
      });
      
      console.log('🗺️ [지도 이동] 완료 - 새 중심:', [currentCenter.lng + lngOffset, currentCenter.lat]);
    };
    
    moveMap();
  }, [showFastSearchList]);

  // CCTV 생성 및 표시 - 고속검색 리스트 표시 시에만
  useEffect(() => {
    console.log('CCTV useEffect 실행:', { showFastSearchList, mapLoaded: mapRef.current?.loaded() });
    if (!mapRef.current || !showFastSearchList) {
      console.log('CCTV 생성 조건 미충족:', { hasMap: !!mapRef.current, showFastSearchList });
      return;
    }
    
    const map = mapRef.current;
    
    // 기존 CCTV 제거
    const oldCCTVMarkers = (map as any)._cctvMarkers;
    if (oldCCTVMarkers) {
      console.log('기존 CCTV 제거:', oldCCTVMarkers.length);
      oldCCTVMarkers.forEach((m: any) => m.remove());
      (map as any)._cctvMarkers = null;
    }
    
    // CCTV 생성 함수
    const createCCTV = () => {
      console.log('CCTV 새로 생성 시작 - 지도 로드 상태:', map.loaded());
    
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
    
    // CCTV 그룹 정의
    const cctvGroups = [
      {
        id: 'A-230',
        name: '원미A-230',
        location: [126.784245, 37.5056784],
        cameras: ['고정1', '고정2', '고정3', '고정4']
      },
      {
        id: 'A-444',
        name: '원미A-444',
        location: [126.7828196, 37.50501939999999],
        cameras: ['검지1', '검지2', '검지3']
      },
      {
        id: 'A-481',
        name: '원미A-481',
        location: [126.7828168, 37.504067],
        cameras: ['검지1', '검지2', '검지3', '검지4']
      },
      {
        id: 'A-498',
        name: '원미A-498',
        location: [126.7843434, 37.5042779],
        cameras: ['검지1', '검지2', '검지3', '검지4']
      },
      {
        id: 'A-583',
        name: '원미A-583',
        location: [126.7839366, 37.5057328],
        cameras: ['검지1 원미', '검지2 원미', '검지3 원미']
      },
      {
        id: 'A-604',
        name: '원미A-604',
        location: [126.7858121, 37.5047548],
        cameras: ['검지1', '검지2']
      }
    ];
    
    // 모든 CCTV 위치 계산
    const cctvPositions: Array<{ lng: number; lat: number; name: string; groupId: string }> = [];
    
    cctvGroups.forEach(group => {
      const offsets = getScatteredOffsets(group.cameras.length);
      group.cameras.forEach((camera, index) => {
        cctvPositions.push({
          lng: group.location[0] + offsets[index].lngOffset,
          lat: group.location[1] + offsets[index].latOffset,
          name: `${group.name} ${camera}`,
          groupId: group.id
        });
      });
    });
    
    // 간단한 CCTV 아이콘 생성
    const createSimpleCCTV = (name: string) => {
      const el = document.createElement('div');
      el.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
      `;
      
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
      `;
      
      icon.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="color: #d1d5db;">
          <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z" />
        </svg>
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
      label.textContent = name;
      el.appendChild(label);
      
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
    
    // 클러스터 마커 생성
    const newClusterMarkers = cctvGroups.map(group => {
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
        element: createSimpleCCTV(pos.name),
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
    
    console.log(`CCTV 클러스터 ${newClusterMarkers.length}개, 개별 ${newIndividualMarkers.length}개 생성 완료`);
    
    // 저장
    (map as any)._cctvMarkers = [...newClusterMarkers, ...newIndividualMarkers];
    (map as any)._cctvZoomHandler = zoomHandler;
    
    // cleanup
      return () => {
        map.off('zoom', zoomHandler);
        newClusterMarkers.forEach(m => m.remove());
        newIndividualMarkers.forEach(m => m.remove());
      };
    };
    
    // 지도 로드 확인 및 CCTV 생성
    if (map.loaded()) {
      console.log('지도 이미 로드됨 - 즉시 CCTV 생성');
      return createCCTV();
    } else {
      console.log('지도 로드 대기 중...');
      // 여러 번 재시도
      let retryCount = 0;
      const maxRetries = 10;
      
      const checkAndCreate = () => {
        retryCount++;
        console.log(`지도 로드 확인 시도 ${retryCount}/${maxRetries}`);
        
        if (map.loaded()) {
          console.log('지도 로드 완료 - CCTV 생성');
          createCCTV();
        } else if (retryCount < maxRetries) {
          setTimeout(checkAndCreate, 500);
        } else {
          console.error('지도 로드 타임아웃 - CCTV 생성 실패');
        }
      };
      
      setTimeout(checkAndCreate, 100);
      
      return () => {
        console.log('CCTV useEffect cleanup');
      };
    }
    
  }, [showFastSearchList]);

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

  // 객체 추적 핀 생성 및 visibility 제어
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    
    console.log('[MapView] 추적 핀 useEffect:', visibleTrackingPins);
    
    // visibleTrackingPins가 0이면 기존 마커 제거
    if (visibleTrackingPins === 0) {
      const existingMarkers = (map as any)._trackingPinsMarkers;
      if (existingMarkers) {
        console.log('[MapView] 기존 추적 핀 제거');
        existingMarkers.forEach((marker: maplibregl.Marker) => marker.remove());
        (map as any)._trackingPinsMarkers = null;
      }
      return;
    }
    
    // 객체 추적 시작 시 기존 이벤트 마커 제거
    if (visibleTrackingPins === 1) {
      const eventMarker = (map as any)._eventMarker;
      if (eventMarker) {
        console.log('[MapView] 기존 이벤트 마커 제거');
        eventMarker.remove();
        (map as any)._eventMarker = null;
      }
    }
    
    // 모든 추적 핀 정의
    const allTrackingPins = [
      { location: [126.783853180335, 37.5049838114765] as [number, number], address: '춘의동 125-46', name: '사건 발생 지점', color: 'gray' },
      { location: [126.7843434, 37.5042779] as [number, number], address: '춘의동 126-18', name: '원미A-498', color: 'blue' },
      { location: [126.7828196, 37.50501939999999] as [number, number], address: '춘의동 125-46', name: '원미A-444', color: 'blue' },
      { location: [126.7828168, 37.504067] as [number, number], address: '춘의동 125-32', name: '원미A-481', color: 'red' },
    ];
    
    const initPins = () => {
      if (!map.loaded()) {
        setTimeout(initPins, 100);
        return;
      }
      
      // 이미 초기화되었는지 확인
      let markers = (map as any)._trackingPinsMarkers;
      
      if (!markers) {
        // 처음 생성
        console.log('[MapView] 추적 핀 초기 생성');
        markers = [];
        
        allTrackingPins.forEach((pin, index) => {
          // 핀 컬러 설정
          let bgGradient, borderColor, shadowColor, ringColor, iconColor;
          
          if (pin.color === 'gray') {
            bgGradient = 'linear-gradient(135deg, rgba(100, 100, 100, 0.2) 0%, rgba(26, 26, 26, 1) 50%, rgba(15, 15, 15, 1) 100%)';
            borderColor = '#6b7280';
            shadowColor = '0 0 20px rgba(107, 114, 128, 0.5), 0 0 40px rgba(107, 114, 128, 0.3)';
            ringColor = 'rgba(107, 114, 128, 0.3)';
            iconColor = '#9ca3af';
          } else if (pin.color === 'red') {
            bgGradient = 'linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(26, 26, 26, 1) 50%, rgba(15, 15, 15, 1) 100%)';
            borderColor = '#ef4444';
            shadowColor = '0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3)';
            ringColor = 'rgba(239, 68, 68, 0.3)';
            iconColor = '#f87171';
          } else {
            bgGradient = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(26, 26, 26, 1) 50%, rgba(15, 15, 15, 1) 100%)';
            borderColor = '#3b82f6';
            shadowColor = '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)';
            ringColor = 'rgba(59, 130, 246, 0.3)';
            iconColor = '#60a5fa';
          }
          
          const markerContainer = document.createElement('div');
          markerContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center;';
          
          const centerWrapper = document.createElement('div');
          centerWrapper.style.cssText = 'position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; z-index: 1;';
          
          const el = document.createElement('div');
          el.style.cssText = `width: 28px; height: 28px; background: ${bgGradient}; border: 2px solid ${borderColor}; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: ${shadowColor}; cursor: pointer; backdrop-filter: blur(4px); position: relative; z-index: 10;`;
          
          const ringEl = document.createElement('div');
          ringEl.style.cssText = `position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px; border: 2px solid ${ringColor}; border-radius: 14px; pointer-events: none;`;
          el.appendChild(ringEl);
          
          const iconEl = document.createElement('div');
          iconEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: ${iconColor};"><path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z" /></svg>`;
          el.appendChild(iconEl);
          
          centerWrapper.appendChild(el);
          markerContainer.appendChild(centerWrapper);
          
          const labelEl = document.createElement('div');
          labelEl.style.cssText = 'margin-top: 8px; padding: 6px 8px; border-radius: 8px; background: rgba(15, 15, 15, 0.95); border: 1px solid #31353a; white-space: nowrap; z-index: 140;';
          
          const currentTime = new Date();
          const hours = String(currentTime.getHours()).padStart(2, '0');
          const minutes = String(currentTime.getMinutes()).padStart(2, '0');
          const timeString = `${hours}:${minutes}`;
          const labelType = index === 0 ? '사건 발생 지점' : '예측 포착 지점';
          
          labelEl.innerHTML = `<div style="font-size: 10px; color: #9ca3af; margin-bottom: 2px;">${labelType} · ${timeString}</div><div style="font-size: 12px; font-weight: 600; color: white;">${pin.address}</div>`;
          markerContainer.appendChild(labelEl);
          
          const marker = new maplibregl.Marker({ element: markerContainer, anchor: 'center' }).setLngLat(pin.location).addTo(map);
          
          const markerElement = marker.getElement();
          if (markerElement) {
            markerElement.style.opacity = '0';
            markerElement.style.visibility = 'hidden';
            markerElement.style.transition = 'opacity 0.5s ease';
            markerElement.style.zIndex = '99999';
          }
          
          markers.push(marker);
        });
        
        (map as any)._trackingPinsMarkers = markers;
        console.log('[MapView] 추적 핀 4개 생성 완료');
      }
      
      // visibility 업데이트
      markers.forEach((marker: maplibregl.Marker, index: number) => {
        const markerElement = marker.getElement();
        if (!markerElement) return;
        
        if (index < visibleTrackingPins) {
          markerElement.style.opacity = '1';
          markerElement.style.visibility = 'visible';
          console.log(`[MapView] 핀 ${index + 1} 표시`);
        }
      });
      
      // 선과 연결점 업데이트
      if (visibleTrackingPins >= 2) {
        const coordinates = allTrackingPins.slice(0, visibleTrackingPins).map(p => p.location);
        
        const lineSource = map.getSource('tracking-line') as maplibregl.GeoJSONSource;
        const pointsSource = map.getSource('tracking-points') as maplibregl.GeoJSONSource;
        
        if (lineSource) {
          lineSource.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } });
        } else {
          map.addSource('tracking-line', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } } });
          map.addLayer({ id: 'tracking-line-layer', type: 'line', source: 'tracking-line', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#3b82f6', 'line-width': 4, 'line-dasharray': [2, 4], 'line-opacity': 0.8 } });
        }
        
        if (pointsSource) {
          pointsSource.setData({ type: 'FeatureCollection', features: coordinates.map(coord => ({ type: 'Feature' as const, properties: {}, geometry: { type: 'Point' as const, coordinates: coord } })) });
        } else {
          map.addSource('tracking-points', { type: 'geojson', data: { type: 'FeatureCollection', features: coordinates.map(coord => ({ type: 'Feature' as const, properties: {}, geometry: { type: 'Point' as const, coordinates: coord } })) } });
          map.addLayer({ id: 'tracking-points-layer', type: 'circle', source: 'tracking-points', paint: { 'circle-radius': 6, 'circle-color': '#3b82f6', 'circle-stroke-width': 2, 'circle-stroke-color': '#1e40af', 'circle-opacity': 0.9 } });
        }
      }
    };
    
    initPins();
  }, [visibleTrackingPins]);

  // showPredictedCCTV가 true이면 모든 핀이 보이도록 줌 아웃
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !showPredictedCCTV || visibleTrackingPins < 2) return;
    
    console.log('[MapView] 줌 아웃 - 모든 핀 표시');
    
    const allTrackingPins = [
      { location: [126.783853180335, 37.5049838114765] as [number, number] },
      { location: [126.7843434, 37.5042779] as [number, number] },
      { location: [126.7828196, 37.50501939999999] as [number, number] },
      { location: [126.7828168, 37.504067] as [number, number] },
    ];
    
    const coordinates = allTrackingPins.slice(0, visibleTrackingPins).map(p => p.location);
    const bounds = coordinates.reduce((bounds, coord) => bounds.extend(coord as [number, number]), new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
    
    if (map.loaded()) {
      map.fitBounds(bounds, { padding: { top: 100, bottom: 100, left: 100, right: 100 }, duration: 2000, essential: true });
    }
  }, [showPredictedCCTV, visibleTrackingPins]);

  // 예측된 CCTV 파란색 핀 표시
  useEffect(() => {
    const map = mapRef.current;
    const container = mapContainerRef.current;
    console.log('[MapView] showPredictedCCTV:', showPredictedCCTV, 'map:', !!map, 'container:', !!container);
    
    if (!map || !container || !showPredictedCCTV) return;
    
    const addPredictedPin = () => {
      if (!map.loaded()) {
        console.log('[MapView] 맵이 아직 로드되지 않음, 대기 중...');
        setTimeout(addPredictedPin, 100);
        return;
      }
      
      // 예측된 CCTV 좌표들
      const predictedLocations: Array<{ name: string; location: [number, number]; address: string }> = [
        { name: '원미A-444', location: [126.7828196, 37.50501939999999], address: '춘의동 125-46' },
        { name: '원미A-481', location: [126.7828168, 37.504067], address: '춘의동 125-32' },
        { name: '원미A-498', location: [126.7843434, 37.5042779], address: '춘의동 126-18' },
      ];
      
      console.log('[MapView] 파란색 핀 생성 시작:', predictedLocations);
      
      // 첫 번째 위치(원미A-444)로 지도 이동
      map.flyTo({
        center: predictedLocations[0].location,
        zoom: 17,
        duration: 2000,
        essential: true
      });
      
      // 지도 이동 완료 후 모든 마커 추가
      map.once('moveend', () => {
        console.log('[MapView] 지도 이동 완료, 마커 추가 시작');
        
        const markers: maplibregl.Marker[] = [];
        
        predictedLocations.forEach((predicted, index) => {
          // 원미A-481(춘의동 125-32)은 빨간색으로 표시
          const isA481 = predicted.name === '원미A-481';
          
          // 마커 컨테이너 생성
          const markerContainer = document.createElement('div');
          markerContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
          `;
          
          // 중앙 래퍼 (핀용)
          const centerWrapper = document.createElement('div');
          centerWrapper.style.cssText = `
            position: relative;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1;
          `;
          
          // 펄스 효과 제거
          
          // 핀 생성 (원미A-481은 빨간색, 나머지는 파란색)
          const el = document.createElement('div');
          el.className = 'predicted-cctv-marker';
          el.style.cssText = `
            width: 28px;
            height: 28px;
            background: ${isA481 
              ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(26, 26, 26, 1) 50%, rgba(15, 15, 15, 1) 100%)' 
              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(26, 26, 26, 1) 50%, rgba(15, 15, 15, 1) 100%)'};
            border: 2px solid ${isA481 ? '#ef4444' : '#3b82f6'};
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: ${isA481 
              ? '0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3)' 
              : '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)'};
            cursor: pointer;
            backdrop-filter: blur(4px);
            position: relative;
            z-index: 10;
          `;
          
          // 외곽 링
          const ringEl = document.createElement('div');
          ringEl.style.cssText = `
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border: 2px solid ${isA481 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'};
            border-radius: 14px;
            pointer-events: none;
          `;
          el.appendChild(ringEl);
          
          // 아이콘
          const iconEl = document.createElement('div');
          iconEl.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: ${isA481 ? '#f87171' : '#60a5fa'};">
              <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z" />
            </svg>
          `;
          el.appendChild(iconEl);
          
          centerWrapper.appendChild(el);
          markerContainer.appendChild(centerWrapper);
          
          // 주소 라벨 (초기에는 숨김)
          const labelEl = document.createElement('div');
          labelEl.style.cssText = `
            margin-top: 8px;
            padding: 6px 8px;
            border-radius: 8px;
            background: rgba(15, 15, 15, 0.95);
            border: 1px solid #31353a;
            white-space: nowrap;
            z-index: 140;
            opacity: 0;
            transform: translateY(-5px);
            transition: opacity 0.2s ease, transform 0.2s ease;
            pointer-events: none;
          `;
          
          // 시간 정보 (예측 시간)
          const currentTime = new Date();
          const hours = String(currentTime.getHours()).padStart(2, '0');
          const minutes = String(currentTime.getMinutes()).padStart(2, '0');
          const timeString = `${hours}:${minutes}`;
          
          labelEl.innerHTML = `
            <div style="font-size: 10px; color: #9ca3af; margin-bottom: 2px;">예측 포착 지점 · ${timeString}</div>
            <div style="font-size: 12px; font-weight: 600; color: white;">${predicted.address}</div>
          `;
          markerContainer.appendChild(labelEl);
          
          // 호버 이벤트
          el.addEventListener('mouseenter', () => {
            labelEl.style.opacity = '1';
            labelEl.style.transform = 'translateY(0)';
          });
          
          el.addEventListener('mouseleave', () => {
            labelEl.style.opacity = '0';
            labelEl.style.transform = 'translateY(-5px)';
          });
          
          const marker = new maplibregl.Marker({ element: markerContainer, anchor: 'center' })
            .setLngLat(predicted.location)
            .addTo(map);
          
          // 마커의 부모 요소에 z-index 설정
          const markerElement = marker.getElement();
          if (markerElement) {
            markerElement.style.zIndex = '99999';
          }
          
          markers.push(marker);
          console.log(`[MapView] ${predicted.name} 파란색 핀 생성 완료`);
        });
        
        // 모든 마커를 맵에 저장
        (map as any)._predictedMarkers = markers;
        
        // 추적 경로 좌표들 (사건발생지점부터 시작)
        const eventLocation: [number, number] = [126.783853180335, 37.5049838114765]; // 사건발생지점
        const A498Location: [number, number] = [126.7843434, 37.5042779]; // 원미A-498 (춘의동 126-18)
        const A444Location: [number, number] = [126.7828196, 37.50501939999999]; // 원미A-444 (춘의동 125-46)
        const A481Location: [number, number] = [126.7828168, 37.504067]; // 원미A-481 (춘의동 125-32)
        
        // GeoJSON 소스가 없으면 추가
        if (!map.getSource('tracking-line')) {
          map.addSource('tracking-line', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [eventLocation, A498Location, A444Location, A481Location]
              }
            }
          });
          
          // 선 레이어 추가 (점선 효과)
          map.addLayer({
            id: 'tracking-line-layer',
            type: 'line',
            source: 'tracking-line',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3b82f6', // 파란색
              'line-width': 4,
              'line-dasharray': [2, 4], // 점선 패턴
              'line-opacity': 0.8
            }
          });
          
          // 연결 지점에 원 추가 (시작점, 중간점, 끝점 모두)
          map.addSource('tracking-points', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'Point',
                    coordinates: eventLocation
                  }
                },
                {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'Point',
                    coordinates: A498Location
                  }
                },
                {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'Point',
                    coordinates: A444Location
                  }
                },
                {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'Point',
                    coordinates: A481Location
                  }
                }
              ]
            }
          });
          
          // 원 레이어 추가
          map.addLayer({
            id: 'tracking-points-layer',
            type: 'circle',
            source: 'tracking-points',
            paint: {
              'circle-radius': 6,
              'circle-color': '#3b82f6',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#1e40af',
              'circle-opacity': 0.9
            }
          });
          
          console.log('[MapView] 추적 경로 선 및 연결점 추가 완료 (사건발생지점 → 원미A-498 → 원미A-444 → 원미A-481)');
        }
      });
    };
    
    addPredictedPin();
    
    // cleanup
    return () => {
      console.log('[MapView] 파란색 핀 제거');
      const markers = (map as any)._predictedMarkers;
      if (markers) {
        markers.forEach((marker: maplibregl.Marker) => marker.remove());
        (map as any)._predictedMarkers = null;
      }
      
      // 추적 경로 선 및 연결점 제거
      if (map.getLayer('tracking-points-layer')) {
        map.removeLayer('tracking-points-layer');
      }
      if (map.getSource('tracking-points')) {
        map.removeSource('tracking-points');
      }
      if (map.getLayer('tracking-line-layer')) {
        map.removeLayer('tracking-line-layer');
      }
      if (map.getSource('tracking-line')) {
        map.removeSource('tracking-line');
      }
    };
  }, [showPredictedCCTV]);

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

  // 선택된 이벤트를 지도 컨테이너 기준 지정된 X 위치(기본 중앙 50%)와 Y=50%로 이동시키기 위한 translate 계산
  const mapTranslate = useMemo(() => {
    if (!selectedEventId) {
      return { x: 0, y: 0, offsetX: 0 };
    }
    
    const selectedEvent = events.find(e => e.id === selectedEventId);
    if (!selectedEvent) {
      return { x: 0, y: 0, offsetX: 0 };
    }
    
    const eventPosition = positionsById[selectedEvent.id] || { left: centerX, top: centerY };
    // focusTargetXPercent 위치(기본 50%)와 Y=50%에 오도록 translate 계산
    const currentMapScale = zoomLevel === 0 ? 1 : mapScale;
    const translateX = (focusTargetXPercent - eventPosition.left) * currentMapScale - 5;
    const translateY = (50 - eventPosition.top) * currentMapScale;
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : windowWidth;
    const offsetXPx = 100;
    const offsetXPercent = (offsetXPx / screenWidth) * 100;
    
    return { x: translateX, y: translateY, offsetX: offsetXPercent };
  }, [zoomLevel, selectedEventId, events, mapScale, positionsById, windowWidth, focusTargetXPercent]);

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
       {/* 맵 컨트롤 버튼 - 초기 화면 + 고속검색 리스트 표시 시 */}
       {(!hideControls || showFastSearchList) && (
       <div 
         className="absolute top-4 flex flex-col gap-2 transition-all duration-500 ease-in-out" 
         style={{ 
           left: showFastSearchList ? '800px' : `${leftPanelWidth + 24}px`,
           zIndex: 250,
         }}
         onClick={(e) => e.stopPropagation()}
       >
         <button
           onClick={(e) => {
             e.stopPropagation();
             if (mapRef.current) {
               mapRef.current.zoomIn({ duration: 300 });
             }
             setZoomLevel(prev => Math.min(prev + 1, 1));
           }}
           className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"
           aria-label="확대"
         >
           <Icon icon="mdi:plus" className="w-5 h-5" />
         </button>
         <button
           onClick={(e) => {
             e.stopPropagation();
             if (mapRef.current) {
               mapRef.current.zoomOut({ duration: 300 });
             }
             setZoomLevel(prev => Math.max(prev - 1, 0));
           }}
           className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"
           aria-label="축소"
         >
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
         <div className="w-full h-px bg-gray-300 my-1" />
         <button
           onClick={(e) => {
             e.stopPropagation();
             const newBearing = mapBearing - 15;
             setMapBearing(newBearing);
             if (mapRef.current) {
               mapRef.current.easeTo({
                 bearing: newBearing,
                 duration: 300
               });
             }
           }}
           className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"
           aria-label="회전 왼쪽"
         >
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
                 duration: 300
               });
             }
           }}
           className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"
           aria-label="회전 오른쪽"
         >
           <Icon icon="mdi:rotate-right" className="w-5 h-5" />
         </button>
       </div>
       )}


       {/* CCTV 컨트롤 버튼 - 초기 화면 + 고속검색 리스트 표시 시 */}
       {(!hideControls || showFastSearchList) && (
       <div 
         className="absolute top-1/2 flex flex-col gap-2 transition-all duration-500 ease-in-out" 
         style={{ 
           left: showFastSearchList ? '800px' : `${leftPanelWidth + 24}px`,
           zIndex: 250,
           transform: 'translateY(-50%)',
         }}
         onClick={(e) => e.stopPropagation()}
       >
         {showCCTV && (
           <button
             onClick={(e) => {
               e.stopPropagation();
               const newValue = !showCCTVName;
               setShowCCTVName(newValue);
               if (typeof window !== 'undefined') {
                 localStorage.setItem('cctv-show-name', newValue.toString());
               }
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
             if (typeof window !== 'undefined') {
               localStorage.setItem('cctv-show-cctv', newValue.toString());
               localStorage.setItem('cctv-show-view-angle', newValue.toString());
               localStorage.setItem('cctv-show-name', newValue.toString());
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
               const newValue = !showCCTVViewAngle;
               setShowCCTVViewAngle(newValue);
               if (typeof window !== 'undefined') {
                 localStorage.setItem('cctv-show-view-angle', newValue.toString());
               }
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
       )}

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
      {(() => {
        const rightPanelWidth = 370;
        const panelGap = 16;
        const { buttonBottom } = getCCTVPanelLayout();
        const cctvPanelRight = rightPanelWidth + panelGap;
        const isInitial = showCCTV && !hideControls;
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
            <a
              href="/cuvia-link"
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
        );
      })()}


    </div>
  );
};

export default MapView;
