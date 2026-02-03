import React, { useMemo, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Icon } from '@iconify/react';
import TopControlPanel from '@/components/dashboard/HOME-v2/TopControlPanel';
import FastSearchProgress from '@/components/dashboard/HOME-v2/FastSearchProgress';
import FastSearchCandidateDetailPopup from '@/components/dashboard/HOME-v2/FastSearchCandidateDetailPopup';
import { shouldHideCaptureItem, getPathForCaptureItem, getConfidenceForCaptureItem, getCctvNameForCaptureItem, getLocationForCaptureItem } from '@/lib/fast-search-image-attributes';

interface FastSearchListPanelProps {
  isVisible: boolean;
  width?: number;
  /** 리스트 카드 개수 변경 시 부모에 전달 (에이전트 첫 대화 문구용) */
  onListCardCountChange?: (count: number) => void;
  /** 반경(m) 변경 시 부모에 전달 (지도 대시 원 연동) */
  onRadiusChange?: (radius: number) => void;
  /** 재검색 중일 때 카드 리스트 박스(상단 버튼 포함) 딤 + 프로그래스 표시 */
  showReSearchDim?: boolean;
  /** 재검색 프로그래스 완료 시 호출 */
  onReSearchComplete?: () => void;
  /** 결과 재검색 버튼 클릭 시 호출 (딤+프로그래스 트리거) */
  onReSearchClick?: () => void;
  /** 에이전트 "속성 삭제"로 제외할 속성 목록. 해당 속성 이미지 카드는 리스트에서 숨김 */
  excludedAttributes?: string[];
  /** 후보 상세 > "이 후보 분석하기" 클릭 시 */
  onAnalyzeCandidate?: (candidate: CaptureItem) => void;
  /** 후보 상세 > "지도에서 위치 보기" 클릭 시 */
  onShowOnMap?: (candidate: CaptureItem) => void;
  /** 외부에서 열 후보 ID (예: '42' = qs_img_57_y) */
  openCandidateId?: string | null;
  /** 후보가 열렸을 때 호출 */
  onCandidateOpened?: () => void;
}

interface CaptureItem {
  id: string;
  cctvId: string;
  cctvName: string;
  timestamp: string;
  confidence: number;
  location: string;
}

/** 신고 위치로부터의 거리(m) 계산 (mock) - 위치별 가상 거리 */
const LOCATION_DISTANCE_MAP: Record<string, number> = {
  '원미구 부천로 245번길 15 (참사랑교회)': 0,
  '원미구 부천로 245번길 41': 30,
  '길주로363번길 48': 150,
  '길주로391번길 29': 280,
  '길주로395번길 12': 310,
  '계남로301번길 28': 420,
  '계남로301번길 54': 450,
};

const getDistanceFromReportLocation = (location: string): number => {
  return LOCATION_DISTANCE_MAP[location] ?? 999;
};

/** 정렬 옵션 타입 */
type SortOption = 'confidence-desc' | 'confidence-asc' | 'distance-asc' | 'distance-desc';

/** 43개 카드용 베이스 데이터 생성 (이미지별 CCTV명, 위치, 유사도) */
const buildBaseItems = (): Omit<CaptureItem, 'id'>[] => {
  return Array.from({ length: 43 }, (_, i) => {
    const id = String(i + 1);
    const cctvName = getCctvNameForCaptureItem({ id });
    const location = getLocationForCaptureItem({ id });
    const confidence = getConfidenceForCaptureItem({ id });
    const baseMin = 28 + Math.floor((i * 3) % 60);
    const baseSec = (i * 11) % 60;
    const hour = 9 + Math.floor((i * 5) / 60) % 4;
    const min = baseMin % 60;
    const sec = baseSec;
    const ts = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return {
      cctvId: cctvName,
      cctvName,
      timestamp: ts,
      confidence,
      location,
    };
  });
};

const BASE_ITEMS = buildBaseItems();

const FastSearchListPanel: React.FC<FastSearchListPanelProps> = ({
  isVisible,
  width = 700,
  onListCardCountChange,
  onRadiusChange,
  showReSearchDim = false,
  onReSearchComplete,
  onReSearchClick,
  excludedAttributes = [],
  onAnalyzeCandidate,
  onShowOnMap,
  openCandidateId,
  onCandidateOpened,
}) => {
  const [radius, setRadius] = useState<number>(500); // 반경 (m)
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 60]); // 시간 범위 (분 단위: 최소 1시간 간격, 00:00=0, 01:00=60)
  const [selectedZones, setSelectedZones] = useState<string[]>([]); // 다중 선택 구역 (기본값: 전체)
  
  // 부천시 행정구역 데이터 (2depth)
  const zoneData = {
    '원미구': [
      '심곡1동', '심곡2동', '심곡3동', '원미1동', '원미2동', '소사동', 
      '역곡1동', '역곡2동', '춘의동', '도당동', '약대동', '중동', 
      '중1동', '중2동', '중3동', '중4동', '상동', '상1동', '상2동', '상3동'
    ],
    '소사구': [
      '송내1동', '송내2동', '심곡본1동', '심곡본동', '소사본동', '소사본1동', 
      '괴안동', '역곡3동', '범박동', '옥길동'
    ],
    '오정구': [
      '오정동', '신흥동', '원종1동', '원종2동', '고강1동', '고강본동', '성곡동'
    ]
  };
  
  // 팝오버 상태
  const [openPopover, setOpenPopover] = useState<'radius' | 'time' | 'zone' | 'sort' | null>(null);
  
  // 정렬 옵션 상태
  const [sortOption, setSortOption] = useState<SortOption>('confidence-desc');
  
  // 팝오버 refs
  const radiusPopoverRef = useRef<HTMLDivElement>(null);
  const timePopoverRef = useRef<HTMLDivElement>(null);
  const zonePopoverRef = useRef<HTMLDivElement>(null);
  const sortPopoverRef = useRef<HTMLDivElement>(null);
  
  // 듀얼 슬라이더 드래그 상태
  const sliderTrackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<'start' | 'end' | 'range' | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartRangeRef = useRef<[number, number]>([0, 0]);
  
  // 펼쳐진 구 상태
  const [expandedGu, setExpandedGu] = useState<string | null>(null);
  
  // 구역 호버 상태
  const [isZoneHovered, setIsZoneHovered] = useState<boolean>(false);

  // 맞음 선택된 카드 id 목록 (선택됨 상태 / pressed 표시용)
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  // 틀림 선택된 카드 id 목록 (pressed 표시용)
  const [wrongIds, setWrongIds] = useState<Set<string>>(new Set());
  // 후보 상세 팝업용 선택 카드
  const [selectedCandidate, setSelectedCandidate] = useState<CaptureItem | null>(null);
  
  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openPopover === 'radius' && radiusPopoverRef.current && !radiusPopoverRef.current.contains(event.target as Node)) {
        setOpenPopover(null);
      }
      if (openPopover === 'time' && timePopoverRef.current && !timePopoverRef.current.contains(event.target as Node)) {
        setOpenPopover(null);
      }
      if (openPopover === 'zone' && zonePopoverRef.current && !zonePopoverRef.current.contains(event.target as Node)) {
        setOpenPopover(null);
      }
      if (openPopover === 'sort' && sortPopoverRef.current && !sortPopoverRef.current.contains(event.target as Node)) {
        setOpenPopover(null);
      }
    };
    
    if (openPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openPopover]);
  
  // 시간을 분 단위로 변환 (HH:MM -> 분)
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };
  
  // 선택된 구역을 문자열로 변환
  const getZoneDisplayText = (): string => {
    if (selectedZones.length === 0) return '전체';
    if (selectedZones.length <= 4) {
      return selectedZones.join(', ');
    }
    const remainingCount = selectedZones.length - 4;
    return `${selectedZones.slice(0, 4).join(', ')} +${remainingCount}`;
  };
  
  // 구역 토글
  const toggleZone = (zone: string) => {
    if (zone === '전체') {
      setSelectedZones([]);
    } else {
      setSelectedZones(prev => {
        const filtered = prev.filter(z => z !== '전체');
        return filtered.includes(zone)
          ? filtered.filter(z => z !== zone)
          : [...filtered, zone];
      });
    }
  };
  
  // 전체 선택 여부 확인
  const isAllSelected = selectedZones.length === 0;
  
  // 구 토글 (1depth)
  const toggleGu = (gu: string) => {
    setExpandedGu(prev => prev === gu ? null : gu);
  };
  
  // 시간 범위 업데이트 (최소 1시간 간격 유지)
  const updateTimeRange = (newStart: number, newEnd: number, preserveStart: boolean = false, preserveEnd: boolean = false) => {
    const minDiff = 60; // 최소 1시간 (60분)
    const maxTime = 1439; // 23:59
    
    // 최소 간격 체크
    if (newEnd - newStart < minDiff) {
      if (preserveStart) {
        // 시작점 유지 (종료 핸들 드래그)
        newEnd = Math.min(maxTime, newStart + minDiff);
      } else if (preserveEnd) {
        // 종료점 유지 (시작 핸들 드래그)
        newStart = Math.max(0, newEnd - minDiff);
      } else {
        // 범위 드래그
        if (newStart < timeRange[0]) {
          newEnd = newStart + minDiff;
        } else {
          newStart = newEnd - minDiff;
        }
      }
    }
    
    // 최대값 체크
    if (newStart < 0) {
      newStart = 0;
      if (!preserveEnd) newEnd = Math.min(maxTime, newStart + minDiff);
    }
    if (newEnd > maxTime) {
      newEnd = maxTime;
      if (!preserveStart) newStart = Math.max(0, newEnd - minDiff);
    }
    
    setTimeRange([newStart, newEnd]);
  };
  
  // 슬라이더 값 계산
  const getTimeFromPosition = (clientX: number): number => {
    if (!sliderTrackRef.current) return 0;
    const rect = sliderTrackRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(percent * 1439 / 15) * 15; // 15분 단위로 스냅
  };
  
  // 핸들 드래그 시작
  const handleHandleMouseDown = (type: 'start' | 'end', e: React.MouseEvent) => {
    e.stopPropagation();
    isDraggingRef.current = type;
    dragStartXRef.current = e.clientX;
    dragStartRangeRef.current = [timeRange[0], timeRange[1]];
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !sliderTrackRef.current) return;
      
      const newTime = getTimeFromPosition(moveEvent.clientX);
      
      if (isDraggingRef.current === 'start') {
        updateTimeRange(newTime, timeRange[1], false, true); // 종료점 유지
      } else if (isDraggingRef.current === 'end') {
        updateTimeRange(timeRange[0], newTime, true, false); // 시작점 유지
      }
    };
    
    const handleMouseUp = () => {
      isDraggingRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // 범위 영역 드래그 시작
  const handleRangeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    isDraggingRef.current = 'range';
    dragStartXRef.current = e.clientX;
    dragStartRangeRef.current = [timeRange[0], timeRange[1]];
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !sliderTrackRef.current) return;
      
      const deltaX = moveEvent.clientX - dragStartXRef.current;
      const deltaTime = getTimeFromPosition(moveEvent.clientX) - getTimeFromPosition(dragStartXRef.current);
      
      const newStart = dragStartRangeRef.current[0] + deltaTime;
      const newEnd = dragStartRangeRef.current[1] + deltaTime;
      
      if (newStart >= 0 && newEnd <= 1439) {
        updateTimeRange(newStart, newEnd);
      }
    };
    
    const handleMouseUp = () => {
      isDraggingRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const captureList = useMemo<CaptureItem[]>(() => {
    return Array.from({ length: 43 }, (_, i) => {
      const base = BASE_ITEMS[i];
      return { id: String(i + 1), ...base };
    });
  }, []);

  const visibleCaptureList = useMemo(() => {
    const list = excludedAttributes.length
      ? captureList.filter((item) => !shouldHideCaptureItem(item, excludedAttributes))
      : captureList;
    
    return [...list].sort((a, b) => {
      switch (sortOption) {
        case 'confidence-desc':
          return b.confidence - a.confidence;
        case 'confidence-asc':
          return a.confidence - b.confidence;
        case 'distance-asc':
          return getDistanceFromReportLocation(a.location) - getDistanceFromReportLocation(b.location);
        case 'distance-desc':
          return getDistanceFromReportLocation(b.location) - getDistanceFromReportLocation(a.location);
        default:
          return 0;
      }
    });
  }, [captureList, excludedAttributes, sortOption]);

  useLayoutEffect(() => {
    if (!isVisible || !onListCardCountChange) return;
    onListCardCountChange(captureList.length);
  }, [isVisible, onListCardCountChange, captureList.length]);

  useLayoutEffect(() => {
    if (!onRadiusChange) return;
    onRadiusChange(radius);
  }, [onRadiusChange, radius]);

  // 외부에서 특정 후보 열기
  useEffect(() => {
    if (!openCandidateId || !isVisible) return;
    
    const candidate = captureList.find(item => item.id === openCandidateId);
    if (candidate) {
      setSelectedCandidate(candidate);
      if (onCandidateOpened) {
        onCandidateOpened();
      }
    }
  }, [openCandidateId, isVisible, captureList, onCandidateOpened]);

  return (
    <>
      <TopControlPanel isVisible={isVisible} />
      <div
        className={`absolute left-0 top-0 bottom-0 flex flex-col transition-all duration-500 ease-out ${
          isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
        }`}
        style={{
          width: `${width}px`,
          zIndex: 150,
          paddingTop: '16px',
          paddingBottom: '16px',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        <div className="flex flex-col gap-4 h-full" style={{ paddingTop: isVisible ? '60px' : '16px', minHeight: 0 }}>
        {/* 헤더 */}
        <div
          className="rounded-lg flex-shrink-0"
          style={{
            zIndex: 2,
          }}
        >
          {/* 필터 칩들 */}
          <div className="flex items-center gap-2 flex-wrap relative">
            {/* 반경 칩 */}
            <div className="relative">
              <button
                onClick={() => setOpenPopover(openPopover === 'radius' ? null : 'radius')}
                className="px-4 py-2 rounded-full text-xs font-medium transition-colors bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a] flex items-center gap-2 border border-[#31353a]"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>반경: {radius}m</span>
                <Icon icon="mdi:chevron-down" className={`w-4 h-4 transition-transform ${openPopover === 'radius' ? 'rotate-180' : ''}`} />
              </button>
              
              {/* 반경 팝오버 */}
              {openPopover === 'radius' && (
                <div
                  ref={radiusPopoverRef}
                  className="absolute top-full left-0 mt-2 bg-[#1a1a1a] rounded-lg p-4 shadow-xl border border-[#31353a] z-[250] min-w-[280px]"
                >
                  <div className="text-white text-sm font-semibold mb-3">검색 반경 설정</div>
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="range"
                        min="100"
                        max="3000"
                        step="100"
                        value={radius}
                        onChange={(e) => setRadius(Number(e.target.value))}
                        className="w-full h-2 bg-[#0f0f0f] rounded-full appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((radius - 100) / 2900) * 100}%, #0f0f0f ${((radius - 100) / 2900) * 100}%, #0f0f0f 100%)`
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>100m</span>
                      <span className="text-white font-semibold">{radius}m</span>
                      <span>3000m</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      반경을 넓히면 더 많은 CCTV를 탐색하지만 분석 시간이 길어질 수 있습니다.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 시간 칩 */}
            <div className="relative">
              <button
                onClick={() => setOpenPopover(openPopover === 'time' ? null : 'time')}
                className="px-4 py-2 rounded-full text-xs font-medium transition-colors bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a] flex items-center gap-2 border border-[#31353a]"
              >
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span>시간: {formatTime(timeRange[0])}~{formatTime(timeRange[1])}</span>
                <Icon icon="mdi:chevron-down" className={`w-4 h-4 transition-transform ${openPopover === 'time' ? 'rotate-180' : ''}`} />
              </button>
              
              {/* 시간 범위 팝오버 */}
              {openPopover === 'time' && (
                <div
                  ref={timePopoverRef}
                  className="absolute top-full left-0 mt-2 bg-[#1a1a1a] rounded-lg p-4 shadow-xl border border-[#31353a] z-[250] min-w-[280px]"
                >
                  <div className="text-white text-sm font-semibold mb-3">시간 범위 선택</div>
                  <div className="space-y-2">
                    {/* 듀얼 핸들 슬라이더 */}
                    <div className="relative" style={{ height: '32px', display: 'flex', alignItems: 'center', paddingTop: '8px', paddingBottom: '8px' }}>
                      {/* 배경 트랙 */}
                      <div 
                        ref={sliderTrackRef}
                        className="absolute w-full h-2 rounded-full bg-[#0f0f0f]"
                        style={{
                          zIndex: 1,
                        }}
                      />
                      
                      {/* 선택된 범위 */}
                      <div
                        className="absolute h-2 rounded-full bg-[#3b82f6] cursor-move"
                        onMouseDown={handleRangeMouseDown}
                        style={{
                          left: `${(timeRange[0] / 1439) * 100}%`,
                          width: `${((timeRange[1] - timeRange[0]) / 1439) * 100}%`,
                          zIndex: 2,
                        }}
                      />
                      
                      {/* 시작 핸들 */}
                      <div
                        className="absolute w-4 h-4 rounded-full bg-[#3b82f6] border-2 border-white cursor-grab active:cursor-grabbing shadow-lg"
                        onMouseDown={(e) => handleHandleMouseDown('start', e)}
                        style={{
                          left: `max(0px, calc(${(timeRange[0] / 1439) * 100}% - 8px))`,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: 3,
                        }}
                      />
                      
                      {/* 종료 핸들 */}
                      <div
                        className="absolute w-4 h-4 rounded-full bg-[#3b82f6] border-2 border-white cursor-grab active:cursor-grabbing shadow-lg"
                        onMouseDown={(e) => handleHandleMouseDown('end', e)}
                        style={{
                          left: `min(calc(100% - 16px), calc(${(timeRange[1] / 1439) * 100}% - 8px))`,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: 3,
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>00:00</span>
                      <span className="text-white font-semibold">{formatTime(timeRange[0])} ~ {formatTime(timeRange[1])}</span>
                      <span>23:59</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      시간 범위를 조정하여 검색할 시간대를 선택할 수 있습니다.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 구역 칩 */}
            <div className="relative">
              <button
                onClick={() => setOpenPopover(openPopover === 'zone' ? null : 'zone')}
                onMouseEnter={() => {
                  if (selectedZones.length > 0 && !openPopover) {
                    setIsZoneHovered(true);
                  }
                }}
                onMouseLeave={() => setIsZoneHovered(false)}
                className="px-4 py-2 rounded-full text-xs font-medium transition-colors bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a] flex items-center gap-2 border border-[#31353a]"
              >
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>구역: {getZoneDisplayText()}</span>
                <Icon icon="mdi:chevron-down" className={`w-4 h-4 transition-transform ${openPopover === 'zone' ? 'rotate-180' : ''}`} />
              </button>
              
              {/* 호버 툴팁 */}
              {isZoneHovered && selectedZones.length > 0 && !openPopover && (
                <div 
                  className="absolute px-3 py-2 bg-[#0f0f0f] border border-[#31353a] rounded-lg shadow-xl text-xs text-gray-300"
                  style={{
                    top: 'calc(100% + 8px)',
                    left: '0',
                    zIndex: 10000,
                    pointerEvents: 'none',
                    maxWidth: '400px',
                    whiteSpace: 'normal',
                  }}
                >
                  {selectedZones.join(', ')}
                </div>
              )}
              
              {/* 구역 선택 팝오버 */}
              {openPopover === 'zone' && (
                <div
                  ref={zonePopoverRef}
                  className="absolute top-full left-0 mt-2 bg-[#1a1a1a] rounded-lg p-4 shadow-xl border border-[#31353a] z-[250] min-w-[280px] max-h-[400px] overflow-y-auto"
                >
                  <div className="text-white text-sm font-semibold mb-3">구역 선택</div>
                  <div className="space-y-1">
                    {/* 전체 옵션 */}
                    <button
                      onClick={() => toggleZone('전체')}
                      className={`w-full px-3 py-2 rounded text-xs font-medium transition-colors text-left flex items-center gap-2 ${
                        isAllSelected
                          ? 'bg-blue-500 text-white'
                          : 'bg-[#0f0f0f] text-gray-300 hover:bg-[#2a2a2a]'
                      }`}
                    >
                      {isAllSelected && (
                        <Icon icon="mdi:check" className="w-4 h-4" />
                      )}
                      <span>전체</span>
                    </button>
                    
                    {Object.keys(zoneData).map((gu) => (
                      <div key={gu}>
                        {/* 1depth: 구 */}
                        <button
                          onClick={() => toggleGu(gu)}
                          className="w-full px-3 py-2 rounded text-xs font-medium transition-colors text-left flex items-center justify-between bg-[#0f0f0f] text-gray-300 hover:bg-[#2a2a2a]"
                        >
                          <span>{gu}</span>
                          <Icon 
                            icon={expandedGu === gu ? "mdi:chevron-up" : "mdi:chevron-down"} 
                            className="w-4 h-4" 
                          />
                        </button>
                        
                        {/* 2depth: 동 */}
                        {expandedGu === gu && (
                          <div className="pl-4 pt-1 space-y-1">
                            {zoneData[gu as keyof typeof zoneData].map((dong) => (
                              <button
                                key={dong}
                                onClick={() => toggleZone(dong)}
                                className={`w-full px-3 py-1.5 rounded text-xs font-medium transition-colors text-left flex items-center gap-2 ${
                                  selectedZones.includes(dong)
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-[#0f0f0f] text-gray-300 hover:bg-[#2a2a2a]'
                                }`}
                              >
                                {selectedZones.includes(dong) && (
                                  <Icon icon="mdi:check" className="w-4 h-4" />
                                )}
                                <span>{dong}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 필터 초기화 버튼 */}
            <button
              onClick={() => {
                setRadius(500);
                setTimeRange([0, 60]); // 00:00 ~ 01:00 (최소 1시간)
                setSelectedZones([]); // 전체
                setOpenPopover(null);
              }}
              className="px-4 py-2 rounded-full text-xs font-medium transition-colors bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a] flex items-center gap-1.5 ml-auto border border-[#31353a]"
            >
              <Icon icon="mdi:filter-variant-remove" className="w-4 h-4" />
              <span>필터 초기화</span>
            </button>
          </div>
        </div>

        {/* 리스트 영역 - 스크롤바 포함 전체에 스트로크 (딤 시 상단 버튼 포함 전체) */}
        <div
          className="rounded-lg flex-1 gradient-border-right-bottom border border-[#31353a] relative"
          style={{
            minHeight: 0,
            maxHeight: '100%',
            background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {showReSearchDim && (
            <>
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10"
                style={{ pointerEvents: 'none' }}
                aria-hidden
              />
              <FastSearchProgress
                isVisible
                hideDim
                titleOverride="결과를 재검색합니다."
                inContainer
                onComplete={onReSearchComplete}
              />
            </>
          )}
          {/* 리스트 상단 고정: 정렬 / 결과 재검색 */}
          <div
            className="flex items-center justify-between gap-2 flex-shrink-0 px-4 py-3 border-b border-[#31353a]"
            style={{ background: 'rgba(0,0,0,0.2)' }}
          >
            {/* 정렬 버튼 + 팝오버 (좌측) */}
            <div className="relative" ref={sortPopoverRef}>
              <button
                type="button"
                onClick={() => setOpenPopover(openPopover === 'sort' ? null : 'sort')}
                className="px-3 py-2 rounded-lg text-xs font-medium transition-colors text-white bg-[#31353a] hover:bg-[#3d4046] border border-[#31353a] flex items-center gap-2"
                aria-label="정렬 옵션"
                aria-expanded={openPopover === 'sort'}
                aria-haspopup="listbox"
              >
                <Icon icon="mdi:sort" className="w-4 h-4 flex-shrink-0" />
                <span>정렬</span>
                <span className="text-gray-500">|</span>
                <span className="text-gray-300">
                  {sortOption === 'confidence-desc' && '유사도 높은 순'}
                  {sortOption === 'confidence-asc' && '유사도 낮은 순'}
                  {sortOption === 'distance-asc' && '신고 위치와 가까운 순'}
                  {sortOption === 'distance-desc' && '신고 위치와 먼 순'}
                </span>
                <Icon icon="mdi:chevron-down" className={`w-4 h-4 transition-transform ${openPopover === 'sort' ? 'rotate-180' : ''}`} />
              </button>
              
              {/* 정렬 옵션 팝오버 */}
              {openPopover === 'sort' && (
                <div
                  className="absolute top-full left-0 mt-2 bg-[#1a1a1a] rounded-lg p-2 shadow-xl border border-[#31353a] z-[250] min-w-[200px]"
                  role="listbox"
                  aria-label="정렬 기준 선택"
                >
                  <div className="text-gray-400 text-[10px] font-medium px-3 py-1.5 uppercase tracking-wider">정렬 기준</div>
                  {([
                    { value: 'confidence-desc', label: '유사도 높은 순' },
                    { value: 'confidence-asc', label: '유사도 낮은 순' },
                    { value: 'distance-asc', label: '신고 위치와 가까운 순' },
                    { value: 'distance-desc', label: '신고 위치와 먼 순' },
                  ] as { value: SortOption; label: string }[]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={sortOption === opt.value}
                      onClick={() => {
                        setSortOption(opt.value);
                        setOpenPopover(null);
                      }}
                      className={`w-full px-3 py-2 rounded text-xs font-medium transition-colors text-left flex items-center gap-2 ${
                        sortOption === opt.value
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-300 hover:bg-[#2a2a2a]'
                      }`}
                    >
                      {sortOption === opt.value && (
                        <Icon icon="mdi:check" className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className={sortOption === opt.value ? '' : 'pl-6'}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* 결과 재검색 (우측) */}
            <button
              type="button"
              onClick={() => {
                if (onReSearchClick) onReSearchClick();
              }}
              className="px-4 py-2 rounded-lg text-xs font-medium transition-colors text-white bg-[#31353a] hover:bg-[#3d4046] border border-[#31353a]"
              aria-label="결과 재검색"
            >
              결과 재검색
            </button>
          </div>
          <div
            className="flex-1 overflow-y-auto"
            style={{
              padding: '16px',
              minHeight: 0,
            }}
          >
            <div className="grid grid-cols-3 gap-3" style={{ minHeight: 'min-content' }}>
            {visibleCaptureList.map((item) => {
              const isMatched = matchedIds.has(item.id);
              const isWrong = wrongIds.has(item.id);
              return (
              <div
                key={item.id}
                onClick={() => setSelectedCandidate(item)}
                className="bg-[#393a42] rounded-lg overflow-hidden cursor-pointer transition-colors flex flex-col hover:bg-[#40424a]"
              >
                {/* 썸네일 */}
                <div className="relative w-full bg-black" style={{ height: '160px' }}>
                  {isMatched && (
                    <div
                      className="absolute top-2 left-2 z-10 px-2 py-1 rounded text-[10px] font-medium bg-green-500/90 text-white"
                      aria-label="선택됨"
                    >
                      선택됨
                    </div>
                  )}
                  <img
                    src={getPathForCaptureItem(item)}
                    alt={item.cctvName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // 이미지 로드 실패 시 플레이스홀더
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%231a1a1a"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23666" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>

                {/* 기본정보 - 타이틀 없이 */}
                <div className="flex-1 min-w-0 p-3 space-y-1.5">
                  {/* CCTV명 */}
                  <div className="text-xs text-gray-300 font-semibold truncate" title={item.cctvName}>
                    {item.cctvName}
                  </div>
                  
                  {/* 장소 */}
                  <div className="text-xs text-gray-200 truncate" title={item.location}>
                    {item.location}
                  </div>

                  {/* 시간 */}
                  <div className="text-xs text-gray-200">
                    {item.timestamp}
                  </div>

                  {/* 유사도 (디바이더) */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-gray-400">유사도</span>
                    <span className="text-[10px] text-gray-500">|</span>
                    <span className="text-xs text-gray-200 font-semibold">
                      {String(item.confidence).padStart(2, '0')}%
                    </span>
                  </div>
                </div>

                {/* 틀림/맞음 버튼 */}
                <div className="px-3 pb-2 flex gap-1.5">
                  <button
                    type="button"
                    aria-pressed={isWrong}
                    data-pressed={isWrong}
                    onClick={(e) => {
                      e.stopPropagation();
                      setWrongIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(item.id)) next.delete(item.id);
                        else next.add(item.id);
                        return next;
                      });
                      setMatchedIds((prev) => {
                        const next = new Set(prev);
                        next.delete(item.id);
                        return next;
                      });
                    }}
                    className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors border flex items-center justify-center gap-1 ${
                      isWrong
                        ? 'bg-red-500/30 text-red-300 border-red-500/80'
                        : 'text-red-400 hover:text-red-300 border-red-500/40 hover:border-red-500/60'
                    }`}
                  >
                    {isWrong && <Icon icon="mdi:close-circle" className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />}
                    틀림
                  </button>
                  <button
                    type="button"
                    aria-pressed={isMatched}
                    data-pressed={isMatched}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMatchedIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(item.id)) next.delete(item.id);
                        else next.add(item.id);
                        return next;
                      });
                      setWrongIds((prev) => {
                        const next = new Set(prev);
                        next.delete(item.id);
                        return next;
                      });
                    }}
                    className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors border flex items-center justify-center gap-1 ${
                      isMatched
                        ? 'bg-green-500/30 text-green-300 border-green-500/80'
                        : 'text-green-400 hover:text-green-300 border-green-500/40 hover:border-green-500/60'
                    }`}
                  >
                    {isMatched && <Icon icon="mdi:check-circle" className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />}
                    맞음
                  </button>
                </div>
              </div>
            );
            })}
            </div>
          </div>
        </div>
        </div>
      </div>

      <FastSearchCandidateDetailPopup
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        candidate={selectedCandidate}
        onAnalyze={onAnalyzeCandidate}
        onShowOnMap={onShowOnMap}
      />
    </>
  );
};

export default FastSearchListPanel;
