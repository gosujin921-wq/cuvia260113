import { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface ObjectTrackingMapViewProps {
  visibleTrackingPins: number; // 0~4: 보이는 핀 개수
  flyToLocation: [number, number] | null; // 지도 이동 좌표
  initialMapState: { center: [number, number]; zoom: number; pitch: number; bearing: number }; // 초기 지도 상태
  onTrackingComplete?: () => void; // 추적 애니메이션 완료 시 콜백
  onCCTVHover?: (cctvId: string | null, showLabel?: boolean) => void; // CCTV 마커 호버 시 콜백
  hoveredCCTVId?: string | null; // 외부에서 전달받은 호버 CCTV ID
  showCCTVLabel?: boolean; // CCTV 정보 라벨 표시 여부
  pulseRadius?: number; // 펄스 반경 (m)
}

const ObjectTrackingMapView = ({ 
  visibleTrackingPins, 
  flyToLocation,
  initialMapState,
  onTrackingComplete,
  onCCTVHover,
  hoveredCCTVId,
  showCCTVLabel = false,
  pulseRadius = 100
}: ObjectTrackingMapViewProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const zoomOutTriggeredRef = useRef<boolean>(false);
  const initialMapStateRef = useRef(initialMapState);
  const cctvMarkersRef = useRef<Map<string, { container: HTMLElement; el: HTMLElement; iconEl: HTMLElement; infoLabel: HTMLElement }>>(new Map());

  // 지도 초기화 (한 번만)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://api.maptiler.com/maps/019c21f9-8624-7dcb-bcdb-d31ef1c059af/style.json?key=ny4gKYAFAR9pfkXMVnmh',
      center: initialMapStateRef.current.center,
      zoom: initialMapStateRef.current.zoom,
      pitch: initialMapStateRef.current.pitch,
      bearing: initialMapStateRef.current.bearing,
      attributionControl: false,
      interactive: true
    });

    mapRef.current = map;

    map.on('styleimagemissing', (e: { id: string }) => {
      if (map.hasImage(e.id)) return;
      map.addImage(e.id, { width: 1, height: 1, data: new Uint8ClampedArray([0, 0, 0, 0]) });
    });

    map.on('load', () => {
      const layers = map.getStyle().layers;
      if (layers) {
        layers.forEach((layer) => {
          if (layer.type === 'symbol') {
            map.setLayoutProperty(layer.id, 'visibility', 'none');
          }
        });
      }
    });

    return () => {
      map.remove();
    };
  }, []);

  // flyToLocation 변경 시 지도 이동
  useEffect(() => {
    if (!mapRef.current || !flyToLocation) return;
    
    const map = mapRef.current;
    
    if (map.loaded()) {
      const currentZoom = map.getZoom();
      
      if (currentZoom >= 18) {
        // 이미 줌인 상태면 줌 유지하며 이동
        map.easeTo({
          center: flyToLocation as [number, number],
          duration: 1000,
          essential: true
        });
      } else {
        // 첫 줌인 (줌 레벨 18로 증가)
        map.flyTo({
          center: flyToLocation as [number, number],
          zoom: 18,
          pitch: 60,
          bearing: -17.6 + 165,
          duration: 1000,
          essential: true
        });
      }
    }
  }, [flyToLocation]);

  // 객체 추적 핀 생성 및 visibility 제어
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    
    // visibleTrackingPins가 0이면 기존 마커 제거
    if (visibleTrackingPins === 0) {
      const existingMarkers = (map as any)._trackingPinsMarkers;
      if (existingMarkers) {
        existingMarkers.forEach((marker: maplibregl.Marker) => marker.remove());
        (map as any)._trackingPinsMarkers = null;
      }
      
      // 펄스 마커 제거
      const pulseMarker = (map as any)._pin4PulseMarker;
      if (pulseMarker) {
        pulseMarker.remove();
        (map as any)._pin4PulseMarker = null;
        (map as any)._pin4PulseWrapper = null;
        (map as any)._pin4PulseSvg = null;
        (map as any)._pin4PulseCircle = null;
        
        // zoom 핸들러 제거
        const zoomHandler = (map as any)._pin4PulseZoomHandler;
        if (zoomHandler) {
          map.off('zoom', zoomHandler);
          (map as any)._pin4PulseZoomHandler = null;
        }
      }
      
      // 경찰서 마커 제거
      const policeMarkers = (map as any)._policeStationMarkers;
      if (policeMarkers) {
        policeMarkers.forEach((marker: maplibregl.Marker) => marker.remove());
        (map as any)._policeStationMarkers = null;
      }
      
      zoomOutTriggeredRef.current = false; // 리셋
      return;
    }
    
    // 모든 추적 핀 정의
    const allTrackingPins = [
      { location: [126.783853180335, 37.5049838114765] as [number, number], address: '은하로363번길 48', name: '별빛A-230', color: 'gray' },
      { location: [126.7843434, 37.5042779] as [number, number], address: '은하로363번길 48', name: '별빛A-444', color: 'gray' },
      { location: [126.7828196, 37.50501939999999] as [number, number], address: '은하로363번길 48', name: '별빛A-481', color: 'gray' },
      { location: [126.7828168, 37.504067] as [number, number], address: '달빛로301번길 28', name: '별빛A-498', color: 'blue' },
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
          const labelType = index === 0 ? '초기 목격 지점' : '목격 지점';
          
          labelEl.innerHTML = `<div style="font-size: 11px; color: #9ca3af; margin-bottom: 2px;">${labelType} · ${timeString}</div><div style="font-size: 13px; font-weight: 600; color: white;">${pin.address}</div>`;
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
      }
      
      // visibility 업데이트
      markers.forEach((marker: maplibregl.Marker, index: number) => {
        const markerElement = marker.getElement();
        if (!markerElement) return;
        
        if (index < visibleTrackingPins) {
          markerElement.style.opacity = '1';
          markerElement.style.visibility = 'visible';
        }
      });
      
      // 선 애니메이션
      if (visibleTrackingPins >= 2) {
        const fromIndex = visibleTrackingPins - 2;
        const toIndex = visibleTrackingPins - 1;
        const fromLocation = allTrackingPins[fromIndex].location;
        const toLocation = allTrackingPins[toIndex].location;
        
        // 선 애니메이션 (0.5초 동안)
        const animationDuration = 500;
        const startTime = Date.now();
        
        const animateLine = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / animationDuration, 1);
          
          // 현재까지의 모든 좌표 + 애니메이션 중인 선
          const allCoordinates = allTrackingPins.slice(0, visibleTrackingPins - 1).map(p => p.location);
          
          // 현재 애니메이션 중인 선의 끝점 계산
          const currentLng = fromLocation[0] + (toLocation[0] - fromLocation[0]) * progress;
          const currentLat = fromLocation[1] + (toLocation[1] - fromLocation[1]) * progress;
          allCoordinates.push([currentLng, currentLat]);
          
          const lineSource = map.getSource('tracking-line') as maplibregl.GeoJSONSource;
          
          if (lineSource) {
            lineSource.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: allCoordinates } });
          } else {
            map.addSource('tracking-line', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: allCoordinates } } });
            map.addLayer({ id: 'tracking-line-layer', type: 'line', source: 'tracking-line', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#3b82f6', 'line-width': 4, 'line-dasharray': [2, 4], 'line-opacity': 0.8 } });
          }
          
          if (progress < 1) {
            requestAnimationFrame(animateLine);
          } else {
            // 애니메이션 완료 후 최종 좌표로 업데이트
            const finalCoordinates = allTrackingPins.slice(0, visibleTrackingPins).map(p => p.location);
            lineSource.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: finalCoordinates } });
            
            // 연결점 추가
            const pointsSource = map.getSource('tracking-points') as maplibregl.GeoJSONSource;
            if (pointsSource) {
              pointsSource.setData({ type: 'FeatureCollection', features: finalCoordinates.map(coord => ({ type: 'Feature' as const, properties: {}, geometry: { type: 'Point' as const, coordinates: coord } })) });
            } else {
              map.addSource('tracking-points', { type: 'geojson', data: { type: 'FeatureCollection', features: finalCoordinates.map(coord => ({ type: 'Feature' as const, properties: {}, geometry: { type: 'Point' as const, coordinates: coord } })) } });
              map.addLayer({ id: 'tracking-points-layer', type: 'circle', source: 'tracking-points', paint: { 'circle-radius': 6, 'circle-color': '#3b82f6', 'circle-stroke-width': 2, 'circle-stroke-color': '#1e40af', 'circle-opacity': 0.9 } });
            }
          }
        };
        
        animateLine();
      }
    };
    
    initPins();
  }, [visibleTrackingPins]);


  // 4번 핀까지 모두 표시되면 범위 펄스 추가 + 줌 아웃 + 평면으로 전환
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    if (visibleTrackingPins !== 4) {
      return;
    }
    if (zoomOutTriggeredRef.current) {
      return;
    }
    
    zoomOutTriggeredRef.current = true;
    
    const pin4Location: [number, number] = [126.7828168, 37.504067]; // 4번 핀 위치
    
    // 지도 로드 대기 후 펄스 추가
    const waitForMapAndAddPulse = () => {
      if (!map.loaded()) {
        setTimeout(waitForMapAndAddPulse, 100);
        return;
      }
      
      // 펄스 마커 추가 (고속검색과 동일한 스타일)
      if (!(map as any)._pin4PulseMarker) {
        // 현재 줌 레벨에서 반경을 픽셀로 변환
        const zoom = map.getZoom();
        const lat = pin4Location[1];
        const metersPerPixel = 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);
        const radiusInPixels = pulseRadius / metersPerPixel;
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
        radiusWrapper.style.cssText = `
          position: relative;
          width: ${diameter}px;
          height: ${diameter}px;
        `;
        
        // radius-pulse 애니메이션 keyframes 추가 (아직 없으면)
        if (!document.getElementById('radius-pulse-style-tracking')) {
          const styleEl = document.createElement('style');
          styleEl.id = 'radius-pulse-style-tracking';
          styleEl.textContent = `
            @keyframes radius-pulse-tracking {
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
        
        // 블루 펄스 3개
        for (let i = 0; i < 3; i++) {
          const pulse = document.createElement('div');
          pulse.style.cssText = `
            position: absolute;
            width: ${diameter - 4}px;
            height: ${diameter - 4}px;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) translateZ(0) scale(0.5);
            animation: radius-pulse-tracking 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
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
          .setLngLat(pin4Location)
          .addTo(map);
        
        // z-index 설정
        const markerElement = radiusMarker.getElement();
        if (markerElement) {
          markerElement.style.zIndex = '1';
        }
        
        // 저장
        (map as any)._pin4PulseMarker = radiusMarker;
        (map as any)._pin4PulseWrapper = radiusWrapper;
        (map as any)._pin4PulseSvg = svg;
        (map as any)._pin4PulseCircle = circle;
        
        // zoom 변경 시 크기 업데이트
        const zoomHandler = () => {
          const newZoom = map.getZoom();
          const newMetersPerPixel = 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, newZoom);
          const newRadiusInPixels = pulseRadius / newMetersPerPixel;
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
        (map as any)._pin4PulseZoomHandler = zoomHandler;
        
      }
      
      // 4번 핀 표시 후 이동 애니메이션 완료를 기다린 후 줌 아웃 + 2D 전환
      setTimeout(() => {
        const currentBearing = map.getBearing();
        // 1~4번 핀 좌표
        const allPinLocations = [
          [126.783853180335, 37.5049838114765], // 1번
          [126.7843434, 37.5042779],            // 2번
          [126.7828196, 37.50501939999999],     // 3번
          [126.7828168, 37.504067],             // 4번
        ];
        
        // 모든 핀을 포함하는 bounds 계산
        const bounds = new maplibregl.LngLatBounds();
        allPinLocations.forEach(location => {
          bounds.extend(location as [number, number]);
        });
        
        // 2D 전환하면서 모든 핀이 보이도록 (우측 패널 고려하여 좌측으로 250px 이동)
        map.fitBounds(bounds, {
          padding: { top: 100, bottom: 100, left: 150, right: 500 },
          pitch: 0,
          bearing: currentBearing,
          duration: 1200,
          essential: true,
          offset: [-50, 0] // 좌측으로 50px 추가 이동
        });
        
        // 2D 전환 완료 후 CCTV 핀 추가
        map.once('moveend', () => {
          const newPitch = map.getPitch();
          // 이미 추가되었는지 확인
          if ((map as any)._nearbyCCTVMarkers) {
            return;
          }
          
          // 1번 핀(은하로363번길 48) 근처 CCTV 좌표 - 초기 목격 지점
          const nearbyCCTV1 = [
            [126.7840, 37.5050], // 동쪽 약 15m
            [126.7837, 37.5049], // 서쪽 약 15m
            [126.7839, 37.5048], // 남동쪽 약 20m
          ];
          
          // 2번 핀(은하로363번길 48) 근처 CCTV 좌표 - 목격 지점
          const nearbyCCTV2 = [
            [126.7845, 37.5043], // 동쪽 약 15m
            [126.7842, 37.5042], // 서쪽 약 15m
            [126.7844, 37.5041], // 남동쪽 약 20m
          ];
          
          // 3번 핀(은하로363번길 48) 근처 CCTV 좌표 - 목격 지점
          const nearbyCCTV3 = [
            [126.7830, 37.5051], // 북동쪽 약 20m
            [126.7826, 37.5050], // 서쪽 약 15m
            [126.7829, 37.5049], // 남동쪽 약 15m
          ];
          
          // 4번 핀(달빛로301번길 28) 근처 CCTV 좌표 - 목격 지점 (붉은 원 60m 반경 안)
          const predictedCCTV4 = [
            [126.7829, 37.5042],   // 북동쪽 약 15m
            [126.7826, 37.5041],   // 북서쪽 약 20m
            [126.7830, 37.5040],   // 동쪽 약 18m
            [126.7827, 37.5039],   // 남서쪽 약 22m
            [126.7829, 37.5038],   // 남동쪽 약 25m
            [126.7825, 37.5040],   // 서쪽 약 25m
            [126.7831, 37.5041],   // 동쪽 약 28m
            [126.7828, 37.5043],   // 북쪽 약 30m
            [126.7826, 37.5038],   // 남서쪽 약 32m
            [126.7830, 37.5039],   // 남동쪽 약 30m
          ];
          
          // 1,2,3번은 그레이, 4번은 블루로 구분
          const grayCCTV = [...nearbyCCTV1, ...nearbyCCTV2, ...nearbyCCTV3];
          const blueCCTV = [...predictedCCTV4];
          const markers: maplibregl.Marker[] = [];
          
          // 그레이 CCTV 마커 추가
          grayCCTV.forEach((location) => {
            const markerContainer = document.createElement('div');
            markerContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center;';
            
            const el = document.createElement('div');
            el.style.cssText = `
              width: 24px;
              height: 24px;
              background: linear-gradient(135deg, rgba(100, 100, 100, 0.2) 0%, rgba(26, 26, 26, 1) 50%, rgba(15, 15, 15, 1) 100%);
              border: 2px solid #6b7280;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 0 15px rgba(107, 114, 128, 0.4), 0 0 30px rgba(107, 114, 128, 0.2);
              backdrop-filter: blur(4px);
              position: relative;
              z-index: 50;
            `;
            
            const iconEl = document.createElement('div');
            iconEl.innerHTML = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="color: #9ca3af;">
                <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z" />
              </svg>
            `;
            el.appendChild(iconEl);
            
            markerContainer.appendChild(el);
            
            const marker = new maplibregl.Marker({ element: markerContainer, anchor: 'center' })
              .setLngLat(location as [number, number])
              .addTo(map);
            
            const markerElement = marker.getElement();
            if (markerElement) {
              markerElement.style.zIndex = '50';
            }
            
            markers.push(marker);
          });
          
          // 블루 CCTV 마커 추가 (4번 핀 근처)
          // CCTV 정보 배열 (예측 CCTV 리스트와 동일)
          const cctvInfoList = [
            { cctvName: '별빛A-583', location: '달빛로301번길 28', confidence: 92 },
            { cctvName: '별빛A-604', location: '달빛로301번길 28', confidence: 88 },
            { cctvName: '별빛A-621', location: '달빛로301번길 28', confidence: 85 },
            { cctvName: '별빛A-638', location: '달빛로301번길 28', confidence: 83 },
            { cctvName: '별빛A-655', location: '달빛로301번길 28', confidence: 80 },
            { cctvName: '별빛A-672', location: '달빛로301번길 28', confidence: 78 },
            { cctvName: '별빛A-689', location: '달빛로301번길 28', confidence: 75 },
            { cctvName: '별빛A-706', location: '달빛로301번길 28', confidence: 73 },
            { cctvName: '별빛A-723', location: '달빛로301번길 28', confidence: 70 },
            { cctvName: '별빛A-740', location: '달빛로301번길 28', confidence: 68 },
          ];
          
          blueCCTV.forEach((location, index) => {
            const cctvId = String(index + 1); // 1~10
            const cctvInfo = cctvInfoList[index];
            
            const markerContainer = document.createElement('div');
            markerContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center;';
            
            const el = document.createElement('div');
            el.style.cssText = `
              width: 24px;
              height: 24px;
              background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(26, 26, 26, 1) 50%, rgba(15, 15, 15, 1) 100%);
              border: 2px solid #3b82f6;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 0 15px rgba(59, 130, 246, 0.4), 0 0 30px rgba(59, 130, 246, 0.2);
              backdrop-filter: blur(4px);
              position: relative;
              z-index: 50;
              cursor: pointer;
              transition: all 0.2s ease;
            `;
            
            const iconEl = document.createElement('div');
            iconEl.innerHTML = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="color: #60a5fa; transition: all 0.2s ease;">
                <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z" />
              </svg>
            `;
            el.appendChild(iconEl);
            
            // 정보 라벨 생성 (처음에는 숨김)
            const infoLabel = document.createElement('div');
            infoLabel.style.cssText = `
              margin-top: 8px;
              padding: 8px 12px;
              border-radius: 8px;
              background: rgba(15, 15, 15, 0.95);
              border: 1px solid #31353a;
              white-space: nowrap;
              z-index: 9999;
              opacity: 0;
              pointer-events: none;
              transition: opacity 0.2s ease;
            `;
            infoLabel.innerHTML = `
              <div style="font-size: 13px; font-weight: 600; color: white; margin-bottom: 4px;">${cctvInfo.cctvName}</div>
              <div style="font-size: 11px; color: #9ca3af; margin-bottom: 4px;">${cctvInfo.location}</div>
              <div style="font-size: 11px; color: #60a5fa;">경로 적합도: ${cctvInfo.confidence}점</div>
            `;
            markerContainer.appendChild(infoLabel);
            
            // 호버 이벤트 추가
            markerContainer.addEventListener('mouseenter', () => {
              el.style.transform = 'scale(1.5)';
              el.style.zIndex = '9999';
              el.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)';
              iconEl.querySelector('svg')!.style.filter = 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))';
              iconEl.querySelector('svg')!.style.color = '#3b82f6';
              infoLabel.style.opacity = '1';
              if (onCCTVHover) {
                onCCTVHover(cctvId, true); // showLabel = true
              }
            });
            
            markerContainer.addEventListener('mouseleave', () => {
              el.style.transform = 'scale(1)';
              el.style.zIndex = '50';
              el.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(26, 26, 26, 1) 50%, rgba(15, 15, 15, 1) 100%)';
              iconEl.querySelector('svg')!.style.filter = 'none';
              iconEl.querySelector('svg')!.style.color = '#60a5fa';
              infoLabel.style.opacity = '0';
              if (onCCTVHover) {
                onCCTVHover(null, false);
              }
            });
            
            markerContainer.appendChild(el);
            
            const marker = new maplibregl.Marker({ element: markerContainer, anchor: 'center' })
              .setLngLat(location as [number, number])
              .addTo(map);
            
            const markerElement = marker.getElement();
            if (markerElement) {
              markerElement.style.zIndex = '50';
            }
            
            // 마커 참조 저장 (외부 호버용)
            cctvMarkersRef.current.set(cctvId, { container: markerContainer, el, iconEl, infoLabel });
            
            markers.push(marker);
          });
          
          (map as any)._nearbyCCTVMarkers = markers;
          // 경찰서 위치 핀 추가
          const policeStations = [
            { location: [126.7833, 37.5044] as [number, number], name: '별빛파출소' },
            { location: [126.7810, 37.5035] as [number, number], name: '은하지구대' },
            { location: [126.7865, 37.5038] as [number, number], name: '별빛경찰서' },
          ];
          
          const policeMarkers: maplibregl.Marker[] = [];
          
          policeStations.forEach((station) => {
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
            
            policeMarkers.push(policeMarker);
          });
          
          (map as any)._policeStationMarkers = policeMarkers;
          // 추적 애니메이션 완료 콜백 호출
          if (onTrackingComplete) {
            onTrackingComplete();
          }
        });
      }, 2000);
    };
    
    waitForMapAndAddPulse();
  }, [visibleTrackingPins, onTrackingComplete]);

  // 외부 호버 상태에 따라 CCTV 마커 하이라이트
  useEffect(() => {
    // 모든 마커 초기화
    cctvMarkersRef.current.forEach((marker, id) => {
      if (id !== hoveredCCTVId) {
        marker.el.style.transform = 'scale(1)';
        marker.el.style.zIndex = '50';
        marker.el.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(26, 26, 26, 1) 50%, rgba(15, 15, 15, 1) 100%)';
        marker.infoLabel.style.opacity = '0';
        const svg = marker.iconEl.querySelector('svg');
        if (svg) {
          (svg as unknown as HTMLElement).style.filter = 'none';
          (svg as unknown as HTMLElement).style.color = '#60a5fa';
        }
      }
    });

    // 호버된 마커 하이라이트
    if (hoveredCCTVId) {
      const marker = cctvMarkersRef.current.get(hoveredCCTVId);
      if (marker) {
        marker.el.style.transform = 'scale(1.5)';
        marker.el.style.zIndex = '9999';
        marker.el.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)';
        // showCCTVLabel이 true일 때만 라벨 표시
        marker.infoLabel.style.opacity = showCCTVLabel ? '1' : '0';
        const svg = marker.iconEl.querySelector('svg');
        if (svg) {
          (svg as unknown as HTMLElement).style.filter = 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))';
          (svg as unknown as HTMLElement).style.color = '#3b82f6';
        }
      }
    }
  }, [hoveredCCTVId, showCCTVLabel]);

  // pulseRadius 변경 시 반경 업데이트
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded() || visibleTrackingPins !== 4) return;
    
    const pin4Location: [number, number] = [126.7828168, 37.504067];
    const radiusWrapper = (map as any)._pin4PulseWrapper;
    const svg = (map as any)._pin4PulseSvg;
    const circle = (map as any)._pin4PulseCircle;
    
    if (radiusWrapper && svg && circle) {
      const zoom = map.getZoom();
      const lat = pin4Location[1];
      const metersPerPixel = 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);
      const radiusInPixels = pulseRadius / metersPerPixel;
      const diameter = radiusInPixels * 2;
      
      radiusWrapper.style.width = `${diameter}px`;
      radiusWrapper.style.height = `${diameter}px`;
      
      const pulses = radiusWrapper.querySelectorAll('div[style*="animation"]');
      pulses.forEach((pulse: any) => {
        pulse.style.width = `${diameter - 4}px`;
        pulse.style.height = `${diameter - 4}px`;
      });
      
      svg.setAttribute('width', `${diameter}px`);
      svg.setAttribute('height', `${diameter}px`);
      circle.setAttribute('r', `${radiusInPixels - 2}px`);
    }
  }, [pulseRadius, visibleTrackingPins]);

  return (
    <div 
      className="relative bg-[#0f0f0f] overflow-hidden" 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative',
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
      />
    </div>
  );
};

export default ObjectTrackingMapView;
