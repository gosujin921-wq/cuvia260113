'use client';

import { Event } from '@/types';
import { Icon } from '@iconify/react';
import { useMemo, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getEventById, generateAIInsight, getAIInsightKeywords } from '@/lib/events-data';
import { getCCTVIconClassName, getCCTVLabelClassName } from '@/components/shared/styles';

interface MapViewProps {
  events: Event[];
  highlightedEventId?: string | null;
  onEventClick?: (eventId: string) => void;
  selectedEventId?: string | null;
  onMapClick?: () => void;
  onEventHover?: (eventId: string | null) => void;
  onToggleGeneralEvents?: () => void;
  externalZoomLevel?: number;
  onZoomLevelChange?: (level: number) => void;
}

const MapView = ({ events, highlightedEventId, onEventClick, selectedEventId, onMapClick, onEventHover, onToggleGeneralEvents, externalZoomLevel, onZoomLevelChange }: MapViewProps) => {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [selectedRouteType, setSelectedRouteType] = useState<'ai' | 'nearby' | null>(null);
  const [zoomLevel, setZoomLevel] = useState(0); // 0: 축소(클러스터), 1: 확대(개별)

  // CCTV 카메라 개수 포맷팅 헬퍼 함수
  const formatCCTVCount = (count: number): string => {
    return count > 999 ? '999+' : count.toString();
  };

  // CCTV 아이콘 박스 스타일 생성 헬퍼 함수
  const getCCTVIconBoxStyle = (count: number, scale: number, hasMultiple: boolean, zIndex: number = 110) => {
    return {
      zIndex,
      position: 'relative' as const,
      transform: `scale(${scale})`,
      paddingLeft: hasMultiple ? '4px' : undefined,
      paddingRight: hasMultiple ? '4px' : undefined
    };
  };
  
  // 외부에서 줌 레벨 제어
  useEffect(() => {
    if (externalZoomLevel !== undefined) {
      setZoomLevel(externalZoomLevel);
    }
  }, [externalZoomLevel]);
  
  // 줌 레벨 변경 시 부모에게 알림
  useEffect(() => {
    onZoomLevelChange?.(zoomLevel);
  }, [zoomLevel, onZoomLevelChange]);
  
  // 줌 레벨에 따른 지도 스케일 계산
  const mapScale = zoomLevel === 0 ? 1 : 1.5; // 확대 시 1.5배
  const mapTransformOrigin = 'center center'; // 확대 기준점
  // CCTV 토글 상태 (localStorage로 공유)
  // Hydration 오류 방지를 위해 초기값은 항상 false로 설정하고, useEffect에서 localStorage 읽기
  // 대시보드에서는 초기 진입시 CCTV 토글이 켜진 상태가 디폴트
  const [showCCTV, setShowCCTV] = useState(false);
  const [showCCTVViewAngle, setShowCCTVViewAngle] = useState(false);
  const [showCCTVName, setShowCCTVName] = useState(false);

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

  // localStorage 동기화
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

  // localStorage 변경 감지 (다른 탭/페이지에서 변경 시)
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
  const tooltipRef = useRef<HTMLDivElement>(null);

  // 일반 이벤트 ID 목록 (event-26부터 event-33)
  const generalEventIds = new Set([
    'event-26', 'event-27', 'event-28', 'event-29',
    'event-30', 'event-31', 'event-32', 'event-33',
  ]);

  const shouldOpenFireStatistics = (query: string) => {
    const normalized = query
      .normalize('NFC')
      .toLowerCase()
      .replace(/[\s\?\!\.]/g, '');

    const triggers = ['요즘화재가늘었어', '요즘화재늘었어'];
    return triggers.some((trigger) => normalized.includes(trigger));
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (searchInput.trim()) {
        const query = searchInput.trim();
        if (shouldOpenFireStatistics(query)) {
          router.push('/statistics?focus=fire-trend');
          return;
        }
        router.push(`/statistics?query=${encodeURIComponent(query)}`);
      } else {
        router.push('/statistics');
      }
    }
  };
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


  const positionsById = useMemo(() => {
    if (!events || events.length === 0) {
      return {};
    }

    // 우선순위별로 그룹화
    const eventsByPriority: Record<string, Event[]> = {
      긴급: [],
      경계: [],
      주의: [],
    };

    events.forEach((event) => {
      if (eventsByPriority[event.priority]) {
        eventsByPriority[event.priority].push(event);
      }
    });

    // 각 우선순위 그룹 내부를 섞기
    Object.keys(eventsByPriority).forEach((priority) => {
      eventsByPriority[priority] = eventsByPriority[priority].sort(() => {
        return seededRandom(`${priority}-shuffle`) - 0.5;
      });
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

    const computedPositions: Record<string, { left: number; top: number }> = {};

    rings.forEach((ringEvents, ringIndex) => {
      if (!ringEvents || ringEvents.length === 0) {
        return;
      }

      const radius = baseRadius + (ringIndex * ringGap);
      const angleStep = (Math.PI * 2) / ringEvents.length;
      const ringAngleOffset = seededRandom(`ring-${ringIndex}`) * angleStep;

      ringEvents.forEach((event, idx) => {
        const angleJitter = (seededRandom(`${event.id}-angle`) - 0.5) * angleStep * 0.4;
        const angle = ringAngleOffset + (idx * angleStep) + angleJitter;
        const left = centerX + (radius * Math.cos(angle));
        const top = centerY + (radius * Math.sin(angle));

        computedPositions[event.id] = {
          left: clampPercentage(left),
          top: clampPercentage(top),
        };
      });
    });

    // 특정 이벤트 핀 위치 교환: event-3(오토바이 도주)와 event-7(주택 2층 연기 발생)
    if (computedPositions['event-3'] && computedPositions['event-7']) {
      const tempPosition = computedPositions['event-3'];
      computedPositions['event-3'] = computedPositions['event-7'];
      computedPositions['event-7'] = tempPosition;
    }

    return computedPositions;
  }, [events]);

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


  // 선택된 이벤트가 변경되면 경로 타입 초기화
  useEffect(() => {
    if (!selectedEventId) {
      setSelectedRouteType(null);
    }
  }, [selectedEventId]);


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
       {/* 줌 컨트롤 버튼 - 지도 확대와 무관하게 고정 위치 */}
       <div 
         className="absolute top-4 left-4 flex flex-col gap-2" 
         style={{ zIndex: 250 }}
         onClick={(e) => e.stopPropagation()}
       >
         <button
           onClick={(e) => {
             e.stopPropagation();
             setZoomLevel(prev => Math.min(prev + 1, 1));
           }}
           disabled={zoomLevel >= 1}
           className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border border-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed"
           style={{ borderWidth: '1px' }}
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
           className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border border-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed"
           style={{ borderWidth: '1px' }}
           aria-label="축소"
         >
           <Icon icon="mdi:minus" className="w-5 h-5" />
         </button>
       </div>

       {/* CCTV 토글 버튼 - +/- 버튼 아래에 그룹핑 */}
       <div 
         className="absolute top-4 left-4 flex flex-col gap-2" 
         style={{ zIndex: 250, marginTop: '100px' }}
         onClick={(e) => e.stopPropagation()}
       >
         <button
           onClick={(e) => {
             e.stopPropagation();
             const newValue = !showCCTV;
             setShowCCTV(newValue);
             // CCTV를 켜면 화각과 라벨도 자동으로 켜기
             if (newValue) {
               setShowCCTVViewAngle(true);
               setShowCCTVName(true);
             } else {
               // CCTV를 끄면 화각과 라벨도 함께 끄기
               setShowCCTVViewAngle(false);
               setShowCCTVName(false);
             }
           }}
           className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
             showCCTV 
               ? 'bg-blue-600 hover:bg-blue-700 text-white' 
               : 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border border-[#2a2a2a]'
           }`}
           style={{ borderWidth: '1px' }}
           aria-label="CCTV"
         >
           <Icon icon="mdi:cctv" className="w-5 h-5" />
         </button>
         
         {/* CCTV 서브 토글 버튼들 - CCTV가 켜져있을 때만 표시 */}
         {showCCTV && (
           <>
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 setShowCCTVViewAngle(prev => !prev);
               }}
               className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                 showCCTVViewAngle 
                   ? 'bg-green-600 hover:bg-green-700 text-white' 
                   : 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border border-[#2a2a2a]'
               }`}
               style={{ borderWidth: '1px' }}
               aria-label="시야각 켜기"
             >
               <Icon icon="mdi:angle-acute" className="w-5 h-5" />
             </button>
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 setShowCCTVName(prev => !prev);
               }}
               className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                 showCCTVName 
                   ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                   : 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border border-[#2a2a2a]'
               }`}
               style={{ borderWidth: '1px' }}
               aria-label="CCTV 명 켜기"
             >
               <Icon icon="mdi:label" className="w-5 h-5" />
             </button>
           </>
         )}
       </div>

      {/* 지도 - 박스 밖으로 */}
      <div
        className="relative border border-[#31353a] bg-cover bg-center bg-no-repeat transition-transform duration-300"
        style={{
          borderWidth: '1px',
          backgroundImage: 'url(/map_anyang.png)',
          backgroundSize: 'cover',
          height: '100%',
          width: '100%',
          transform: `scale(${mapScale})`,
          transformOrigin: mapTransformOrigin,
        }}
      >
        {/* 미세한 딤 오버레이 */}
        <div 
          className="absolute inset-0 bg-black/5" 
          style={{ zIndex: 2 }}
        ></div>
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
                  zIndex: 50 
                }}
                onClick={() => {
                  // 나중에 모달 띄울 예정
                }}
              >
                <div 
                  className={`${getCCTVIconClassName('default')} flex items-center justify-center ${item.count > 1 && zoomLevel === 0 ? 'w-auto min-w-[28px]' : ''}`} 
                  style={getCCTVIconBoxStyle(item.count, mapScale, item.count > 1 && zoomLevel === 0, 60)}
                >
                  <Icon 
                    icon="mdi:cctv" 
                    className="text-gray-400"
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
                {/* CCTV 이름 라벨 */}
                {showCCTVName && (
                  <div className={`${getCCTVLabelClassName('default')} absolute top-full left-1/2 -translate-x-1/2 mt-1`}>
                    {cctvName}
                  </div>
                )}
                {/* 시야각 표시 */}
                {showCCTVViewAngle && (
                  <div 
                    className="absolute"
                    style={{
                      width: '120px',
                      height: '120px',
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, -50%) rotate(${item.viewAngle}deg)`,
                      transformOrigin: 'center center',
                      pointerEvents: 'none',
                      zIndex: 30,
                    }}
                  >
                    <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', top: 0, left: 0 }}>
                      <path
                        d="M 60 60 L 60 10 A 50 50 0 0 1 110 60 Z"
                        fill="rgba(156, 163, 175, 0.2)"
                        stroke="rgba(156, 163, 175, 0.6)"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                )}
              </div>
            );
          } else {
            // 확대 모드: 개별 CCTV 아이콘 표시
            return Array.from({ length: item.count }, (_, i) => {
              const angle = (i / item.count) * 2 * Math.PI;
              const radius = 2;
              const offsetLeft = Math.cos(angle) * radius;
              const offsetTop = Math.sin(angle) * radius;
              
              return (
                <div
                  key={`virtual-cctv-${index}-${i}`}
                  className="absolute cursor-pointer"
                  style={{ 
                    left: `${item.left + offsetLeft}%`, 
                    top: `${item.top + offsetTop}%`, 
                    transform: 'translate(-50%, -50%)', 
                    zIndex: 50 
                  }}
                  onClick={() => {
                    // 나중에 모달 띄울 예정
                  }}
                >
                  <div className={getCCTVIconClassName('default')} style={{ ...getCCTVIconBoxStyle(1, mapScale, false, 60) }}>
                    <Icon 
                      icon="mdi:cctv" 
                      className="text-gray-400"
                      width="16px" 
                      height="16px"
                    />
                  </div>
                  {/* CCTV 이름 라벨 */}
                  {showCCTVName && (
                    <div className={`${getCCTVLabelClassName('default')} absolute top-full left-1/2 -translate-x-1/2 mt-1`}>
                      CCTV-V-{index + 1}-{i + 1}
                    </div>
                  )}
                  {/* 시야각 표시 */}
                  {showCCTVViewAngle && (
                    <div 
                      className="absolute"
                      style={{
                        width: '120px',
                        height: '120px',
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) rotate(${item.viewAngle}deg)`,
                        transformOrigin: 'center center',
                        pointerEvents: 'none',
                        zIndex: 30,
                      }}
                    >
                      <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', top: 0, left: 0 }}>
                        <path
                          d="M 60 60 L 60 10 A 50 50 0 0 1 110 60 Z"
                          fill="rgba(156, 163, 175, 0.2)"
                          stroke="rgba(156, 163, 175, 0.6)"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              );
            });
          }
        })}


        {/* SVG 오버레이 - map1.svg, map2.svg */}
        {selectedRouteType && (() => {
          const displayEvent = selectedEventId 
            ? events.find(e => e.id === selectedEventId)
            : events[0];
          if (!displayEvent) return null;
          return (
            <div className="absolute inset-0" style={{ zIndex: 3 }}>
              <img 
                src={selectedRouteType === 'ai' ? '/map2.svg' : '/map1.svg'} 
                alt="Map Overlay" 
                className="w-full h-full object-cover"
              />
            </div>
          );
        })()}

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
                    <div className="absolute animate-circle-pulse" style={{ width: '120px', height: '120px', zIndex: 80, animationDelay: '0s' }}>
                      <div className="w-full h-full rounded-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.5)' }}></div>
                    </div>
                    <div className="absolute animate-circle-pulse" style={{ width: '120px', height: '120px', zIndex: 79, animationDelay: '0.3s' }}>
                      <div className="w-full h-full rounded-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.4)' }}></div>
                    </div>
                    <div className="absolute animate-circle-pulse" style={{ width: '120px', height: '120px', zIndex: 78, animationDelay: '0.6s' }}>
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
                          icon="mdi:cctv" 
                          className="text-red-400" 
                          width="16px" 
                          height="16px"
                        />
                        {/* CCTV 카메라 개수 - 축소 모드에서만 표시 */}
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

      {/* 이벤트 팝업 - 항상 중앙 패널(맵 영역) 우측 상단에 고정 표시 */}
      {(() => {
        // selectedEventId가 있으면 해당 이벤트, 없으면 첫 번째 이벤트 사용
        const displayEvent = selectedEventId 
          ? events.find(e => e.id === selectedEventId)
          : events[0];
        
        if (!displayEvent) return null;
        
        // "상가 절도 의심" 이벤트는 팝업 전체 제외
        const isTheftEvent = displayEvent.title.includes('상가 절도 의심') || displayEvent.title.includes('현금 절취 포착');
        if (isTheftEvent) return null;
        
        return (
          <div
            ref={tooltipRef}
            data-tooltip
            className="absolute rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white text-xs shadow-xl"
            style={{ 
              width: '420px',
              maxHeight: '600px',
              overflowY: 'auto',
              zIndex: 1000,
              top: '20px',
              right: '20px',
              transform: 'none'
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {/* 헤더: 닫기 버튼만 */}
            <div 
              className="px-3 py-1.5 border-b border-[#2a2a2a] flex items-center justify-end"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMapClick?.();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                className="p-1 hover:bg-[#36383B] rounded transition-colors"
                aria-label="닫기"
              >
                <Icon icon="mdi:close" className="w-4 h-4 text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* 감지된 CCTV 영상 */}
            <div className="m-3">
              <div className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg overflow-hidden relative" style={{ borderWidth: '1px', aspectRatio: '16/9' }}>
                <img 
                  src="/cctv_img/001.jpg" 
                  alt="감지된 CCTV 영상" 
                  className="w-full h-full object-cover"
                />
                {/* Live/Clip 상태 오버레이 */}
                <div className="absolute top-2 left-2 flex gap-2" style={{ zIndex: 10 }}>
                  <span className="px-2 py-0.5 bg-red-500/90 text-white text-xs font-semibold rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                    LIVE
                  </span>
                  <span className="px-2 py-0.5 bg-blue-500/90 text-white text-xs font-semibold rounded">
                    CLIP
                  </span>
                </div>
                
                {/* 플레이 타임라인과 인디케이터 */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3" style={{ zIndex: 10 }}>
                  {/* 타임라인 */}
                  <div className="relative w-full h-1 bg-gray-600/50 rounded-full mb-2 cursor-pointer flex items-center">
                    {/* 재생 진행 바 */}
                    <div 
                      className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
                      style={{ width: '35%' }}
                    ></div>
                    {/* 재생 인디케이터 */}
                    <div 
                      className="absolute w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg"
                      style={{ left: '35%', top: '50%', transform: 'translate(-50%, -50%)' }}
                    ></div>
                  </div>
                  {/* 시간 표시 */}
                  <div className="flex items-center justify-between text-white text-xs">
                    <span>00:12</span>
                    <span className="text-gray-400">00:35</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 이벤트 명 */}
            <div className="px-3 mb-2">
              <div className="text-white font-semibold text-sm mb-1">{displayEvent.title}</div>
              <div className="text-gray-400 text-xs">{displayEvent.location.name}</div>
            </div>

            {/* AI 분석 - AI 인사이트 요약 + 핵심 키워드 */}
            {(() => {
              const baseEvent = displayEvent.eventId ? getEventById(displayEvent.eventId) : null;
              const keywords = baseEvent ? getAIInsightKeywords(baseEvent) : [];
              const aiInsightText = baseEvent ? generateAIInsight(baseEvent) : null;
              
              if (keywords.length === 0 && !aiInsightText) return null;
              
              return (
                <div className="m-3 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4" style={{ borderWidth: '1px' }}>
                  <div className="flex items-start gap-2 mb-3">
                    <Icon icon="mdi:robot" className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <h3 className="text-white font-semibold text-sm">AI 분석</h3>
                  </div>
                  
                  {/* AI 인사이트 내용 요약 */}
                  {aiInsightText && (
                    <div className="mb-3 text-xs text-white leading-relaxed">
                      {aiInsightText.split('. ').filter(s => s.trim()).slice(0, 2).map((sentence, idx) => (
                        <div key={idx} className="text-white mb-1">
                          {sentence.trim()}{sentence.trim().endsWith('.') ? '' : '.'}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* 핵심 키워드 */}
                  {keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {keywords.slice(0, 5).map((keyword, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-500/30"
                          style={{ borderWidth: '1px' }}
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 버튼 영역 - 모니터링화면으로 가기 | 바로 전파 */}
            <div className="p-2 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (displayEvent.eventId) {
                    router.push(`/event/${displayEvent.eventId}`);
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded transition-colors"
              >
                모니터링화면으로 가기
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const generateAIInsight = () => {
                    if (displayEvent.type.includes('화재')) {
                      return '화재 이벤트 발생. 강풍 영향으로 확산 위험이 높으며, 접근 가능한 도로가 제한적입니다. 즉시 소방대 출동이 필요합니다.';
                    } else if (displayEvent.type.includes('미아') || displayEvent.type.includes('배회')) {
                      return '실종/배회 이벤트 발생. 마지막 목격 좌표 기준 반경 300m 내에서 배회 행동이 감지되었습니다. 즉시 수색대 출동이 필요합니다.';
                    } else if (displayEvent.type.includes('약자')) {
                      return '약자 쓰러짐 이벤트 발생. 강풍·조도·지형 영향으로 긴급도 High입니다. 즉시 구조대 출동이 필요합니다.';
                    } else if (displayEvent.type.includes('치안') || displayEvent.type.includes('폭행') || displayEvent.type.includes('절도')) {
                      return '치안 사건 발생. CCTV AI 감지 및 112 신고가 동시에 접수되어 고신뢰도 사건으로 분류되었습니다. 즉시 경찰 출동이 필요합니다.';
                    }
                    return `${displayEvent.title} 이벤트 발생. 현재 상황을 분석 중이며, 필요시 즉시 대응이 필요합니다.`;
                  };
                  
                  const aiInsight = generateAIInsight();
                  const message = `[${displayEvent.location.name}]\n\n${aiInsight}`;
                  
                  alert(message);
                }}
                className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
              >
                바로 전파
              </button>
            </div>
          </div>
        );
      })()}

      {/* 플로팅 검색창 */}
      <div 
        className="absolute"
        style={{
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 200,
          width: '500px',
        }}
      >
        <div
          className="flex items-center gap-3 bg-white border rounded-full shadow-lg"
          style={{
            padding: '12px 16px',
            borderColor: '#d1d5db',
            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div className="w-10 h-10 rounded-full border border-gray-200 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-400 flex items-center justify-center animate-[pulse_4s_ease_infinite] shadow-md">
            <Icon icon="mdi:sparkles" className="w-5 h-5 text-white drop-shadow-md" />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="통계를 조회하세요... (예: 요즘 화재가 늘었어?)"
            className="flex-1 bg-transparent text-[#161719] placeholder-gray-500 focus:outline-none"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="p-2 hover:bg-[#f3f4f6] rounded-full transition-colors"
            >
              <Icon icon="mdi:close" className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Agent Hub 버튼 - 우측 하단 플로팅 버튼 */}
      <div
        className="absolute group"
        style={{
          bottom: '24px',
          right: '24px',
          zIndex: 200,
        }}
      >
        <Link
          href="/agent-hub"
          className="w-14 h-14 rounded-full bg-gradient-to-br from-[#7C62F0] to-[#5A3FEA] hover:from-[#8B72F5] hover:to-[#6A4FFA] flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300"
          aria-label="Agent Hub"
        >
          <Icon icon="mdi:sparkles" className="w-6 h-6 text-white" />
        </Link>
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
