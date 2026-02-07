import { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface ObjectTrackingMapViewProps {
  visibleTrackingPins: number; // 0~4: 보이는 핀 개수
  flyToLocation: [number, number] | null; // 지도 이동 좌표
  showPredictedCCTV: boolean; // 예측된 CCTV 파란색 핀 표시
  initialMapState: { center: [number, number]; zoom: number; pitch: number; bearing: number }; // 초기 지도 상태
}

const ObjectTrackingMapView = ({ 
  visibleTrackingPins, 
  flyToLocation, 
  showPredictedCCTV,
  initialMapState
}: ObjectTrackingMapViewProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // 지도 초기화
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://api.maptiler.com/maps/019c21f9-8624-7dcb-bcdb-d31ef1c059af/style.json?key=ny4gKYAFAR9pfkXMVnmh',
      center: initialMapState.center,
      zoom: initialMapState.zoom,
      pitch: initialMapState.pitch,
      bearing: initialMapState.bearing,
      attributionControl: false,
      interactive: true
    });

    mapRef.current = map;

    map.on('load', () => {
      console.log('[ObjectTrackingMapView] 지도 로드 완료');
    });

    return () => {
      map.remove();
    };
  }, [initialMapState]);

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
    
    console.log('[ObjectTrackingMapView] 추적 핀 useEffect:', visibleTrackingPins);
    
    // visibleTrackingPins가 0이면 기존 마커 제거
    if (visibleTrackingPins === 0) {
      const existingMarkers = (map as any)._trackingPinsMarkers;
      if (existingMarkers) {
        console.log('[ObjectTrackingMapView] 기존 추적 핀 제거');
        existingMarkers.forEach((marker: maplibregl.Marker) => marker.remove());
        (map as any)._trackingPinsMarkers = null;
      }
      return;
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
        console.log('[ObjectTrackingMapView] 추적 핀 초기 생성');
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
        console.log('[ObjectTrackingMapView] 추적 핀 4개 생성 완료');
      }
      
      // visibility 업데이트
      markers.forEach((marker: maplibregl.Marker, index: number) => {
        const markerElement = marker.getElement();
        if (!markerElement) return;
        
        if (index < visibleTrackingPins) {
          markerElement.style.opacity = '1';
          markerElement.style.visibility = 'visible';
          console.log(`[ObjectTrackingMapView] 핀 ${index + 1} 표시`);
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

  // showPredictedCCTV가 true이면 1단계 줌 아웃 + 평면으로 전환
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !showPredictedCCTV || visibleTrackingPins < 2) return;
    
    console.log('[ObjectTrackingMapView] 줌 아웃 - 1단계 + 평면 전환');
    
    if (map.loaded()) {
      const currentZoom = map.getZoom();
      map.easeTo({
        zoom: currentZoom - 1,
        pitch: 0,
        duration: 1200,
        essential: true
      });
    }
  }, [showPredictedCCTV, visibleTrackingPins]);

  // 예측된 CCTV 파란색 핀 표시
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !showPredictedCCTV) return;
    
    const addPredictedPin = () => {
      if (!map.loaded()) {
        setTimeout(addPredictedPin, 100);
        return;
      }
      
      // 이미 추가되었는지 확인
      if ((map as any)._predictedCCTVMarker) {
        console.log('[ObjectTrackingMapView] 예측 CCTV 핀 이미 존재');
        return;
      }
      
      console.log('[ObjectTrackingMapView] 예측 CCTV 핀 추가');
      
      const markerContainer = document.createElement('div');
      markerContainer.className = 'predicted-cctv-marker';
      markerContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center;';
      
      const centerWrapper = document.createElement('div');
      centerWrapper.style.cssText = 'position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; z-index: 1;';
      
      const el = document.createElement('div');
      el.style.cssText = `
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(26, 26, 26, 1) 50%, rgba(15, 15, 15, 1) 100%);
        border: 2px solid #3b82f6;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 25px rgba(59, 130, 246, 0.6), 0 0 50px rgba(59, 130, 246, 0.4);
        cursor: pointer;
        backdrop-filter: blur(4px);
        position: relative;
        z-index: 10;
      `;
      
      const ringEl = document.createElement('div');
      ringEl.style.cssText = `
        position: absolute;
        top: -3px;
        left: -3px;
        right: -3px;
        bottom: -3px;
        border: 2px solid rgba(59, 130, 246, 0.4);
        border-radius: 18px;
        pointer-events: none;
      `;
      el.appendChild(ringEl);
      
      const iconEl = document.createElement('div');
      iconEl.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color: #60a5fa;">
          <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z" />
        </svg>
      `;
      el.appendChild(iconEl);
      
      centerWrapper.appendChild(el);
      markerContainer.appendChild(centerWrapper);
      
      const labelEl = document.createElement('div');
      labelEl.style.cssText = `
        margin-top: 8px;
        padding: 6px 10px;
        border-radius: 8px;
        background: rgba(15, 15, 15, 0.95);
        border: 1px solid #3b82f6;
        white-space: nowrap;
        z-index: 140;
      `;
      labelEl.innerHTML = `
        <div style="font-size: 10px; color: #60a5fa; margin-bottom: 2px;">예측 CCTV</div>
        <div style="font-size: 12px; font-weight: 600; color: white;">춘의동 125-32</div>
      `;
      markerContainer.appendChild(labelEl);
      
      const marker = new maplibregl.Marker({ element: markerContainer, anchor: 'center' })
        .setLngLat([126.7828168, 37.504067])
        .addTo(map);
      
      const markerElement = marker.getElement();
      if (markerElement) {
        markerElement.style.zIndex = '99998';
      }
      
      (map as any)._predictedCCTVMarker = marker;
      console.log('[ObjectTrackingMapView] 예측 CCTV 핀 추가 완료');
    };
    
    addPredictedPin();
  }, [showPredictedCCTV]);

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
