import React, { useMemo, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Icon } from '@iconify/react';
import FastSearchCandidateDetailPopup from '@/components/dashboard/HOME-v3/FastSearchCandidateDetailPopup';
import { shouldHideCaptureItem, getPathForCaptureItem, getConfidenceForCaptureItem, getCctvNameForCaptureItem, getLocationForCaptureItem } from '@/lib/fast-search-image-attributes';

interface FastSearchListPanelProps {
  isVisible: boolean;
  width?: number;
  /** 리스트 카드 개수 변경 시 부모에 전달 (에이전트 첫 대화 문구용) */
  onListCardCountChange?: (count: number) => void;
  /** 반경(m) 변경 시 부모에 전달 (지도 대시 원 연동 - 실시간 미리보기) */
  onRadiusChange?: (radius: number) => void;
  /** 반경(m) 확정 시 부모에 전달 (CCTV 필터링용) */
  onAppliedRadiusChange?: (radius: number) => void;
  /** 결과 재검색 버튼 클릭 시 호출 */
  onReSearchClick?: () => void;
  /** 에이전트 "속성 삭제"로 제외할 속성 목록. 해당 속성 이미지 카드는 리스트에서 숨김 */
  excludedAttributes?: string[];
  /** 결과 재검색으로 직접 제외할 이미지 ID 목록 (예: ['1', '2', '3']) */
  excludedImageIds?: string[];
  /** 외부에서 열 후보 ID (예: '42' = qs_img_57_y) */
  openCandidateId?: string | null;
  /** 후보가 열렸을 때 호출 */
  onCandidateOpened?: () => void;
  /** 스켈레톤 로딩 표시 여부 */
  showSkeleton?: boolean;
  /** 대상 포착 시 호출 */
  onAddCapture?: (cctvName: string, location: string, confidence: number, thumbnailUrl: string, analysisResult?: string, videoUrl?: string) => void;
  /** 이 값이 'wrong-button-1'일 때 리스트를 맨 아래로 스크롤 (틀림 시퀀스 유도용) */
  scrollToBottomTrigger?: string | null;
  /** 후보 카드 선택(상세 팝업 오픈) 시 호출 */
  onCandidateSelect?: () => void;
  /** 외부에서 팝업 닫기 신호 (값 변경 시 팝업 닫힘) */
  closePopupSignal?: number;
  /** 팝업 열릴 때 자동 포착 실행 여부 */
  autoCapture?: boolean;
  /** 팝업 닫힐 때 호출 */
  onPopupClose?: () => void;
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
  '은하로363번길 48': 0,
  '별빛구 하늘로 245번길 41': 30,
  '길주로363번길 48': 150,
  '길주로391번길 29': 280,
  '길주로395번길 12': 310,
  '달빛로301번길 28': 420,
  '달빛로301번길 54': 450,
};

const getDistanceFromReportLocation = (location: string): number => {
  return LOCATION_DISTANCE_MAP[location] ?? 999;
};

/** 정렬 옵션 타입 */
type SortOption = 'confidence-desc' | 'confidence-asc' | 'distance-asc' | 'distance-desc';

/** v3 전용 썸네일 경로 (hijacking2/hjk_01~09) */
const getV3ThumbnailPath = (itemId: string): string => {
  const idx = parseInt(itemId, 10);
  if (idx >= 1 && idx <= 9) {
    return `/hijacking2/hjk_${String(idx).padStart(2, '0')}.png`;
  }
  return getPathForCaptureItem({ id: itemId });
};

/** v3 전용 CCTV명 오버라이드 (ID 9: 별빛A-583 → 별빛A-604) */
const getV3CctvName = (itemId: string): string => {
  if (itemId === '9') return '별빛A-604';
  return getCctvNameForCaptureItem({ id: itemId });
};

/** v3 전용 유사도 오버라이드 */
const V3_CONFIDENCE_OVERRIDE: Record<string, number> = {
  '1': 95,
  '2': 93,
  '4': 92,
  '5': 83,
  '6': 91,
  '8': 43,
  '9': 37,
};
const getV3Confidence = (itemId: string): number => {
  return V3_CONFIDENCE_OVERRIDE[itemId] ?? getConfidenceForCaptureItem({ id: itemId });
};

/** 9개 카드용 베이스 데이터 생성 */
const buildBaseItems = (): Omit<CaptureItem, 'id'>[] => {
  const timestamps = [
    '10:30:10', // ID 1
    '10:31:05', // ID 2
    '10:32:01', // ID 3
    '10:33:05', // ID 4
    '10:33:40', // ID 5
    '10:34:20', // ID 6
    '10:35:10', // ID 7
    '10:35:10', // ID 8
    '10:36:20', // ID 9
  ];
  
  return Array.from({ length: 9 }, (_, i) => {
    const id = String(i + 1);
    const cctvName = getV3CctvName(id);
    const location = getLocationForCaptureItem({ id });
    const confidence = getV3Confidence(id);
    return {
      cctvId: cctvName,
      cctvName,
      timestamp: timestamps[i],
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
  onAppliedRadiusChange,
  onReSearchClick,
  excludedAttributes = [],
  excludedImageIds = [],
  openCandidateId,
  onCandidateOpened,
  showSkeleton = false,
  onAddCapture,
  scrollToBottomTrigger = null,
  onCandidateSelect,
  closePopupSignal,
  autoCapture = false,
  onPopupClose,
}) => {
  const [radius, setRadius] = useState<number>(400); // 반경 (m) - 실제 적용된 값
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 60]); // 시간 범위 (분 단위: 최소 1시간 간격, 00:00=0, 01:00=60) - 실제 적용된 값
  const [selectedZones, setSelectedZones] = useState<string[]>([]); // 다중 선택 구역 (기본값: 전체)
  const [showRadiusSkeleton, setShowRadiusSkeleton] = useState<boolean>(false); // 반경 변경 시 짧은 스켈레톤
  
  // 임시 값 (팝오버에서 선택 중인 값) - 실시간 미리보기를 위해 이 값을 바로 전달
  const [tempRadius, setTempRadius] = useState<number>(400);
  const [tempTimeRange, setTempTimeRange] = useState<[number, number]>([0, 60]);
  
  // 하늘시 행정구역 데이터 (2depth)
  const zoneData = {
    '별빛구': [
      '바람1동', '바람2동', '바람3동', '별빛1동', '별빛2동', '무지개동', 
      '성운1동', '성운2동', '은하동', '구름동', '하늘동', '달빛동', 
      '달빛1동', '달빛2동', '달빛3동', '달빛4동', '해빛동', '해빛1동', '해빛2동', '해빛3동'
    ],
    '무지개구': [
      '구름1동', '구름2동', '바람본1동', '바람본동', '무지개본동', '무지개본1동', 
      '노을동', '성운3동', '이슬동', '물결동'
    ],
    '햇살구': [
      '햇살동', '새벽동', '여명1동', '여명2동', '빛나1동', '빛나본동', '반짝동'
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
  const listScrollRef = useRef<HTMLDivElement>(null);
  
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
  const autoWrongSequenceRef = useRef(false);
  
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
  
  // 시간 범위 업데이트 (최소 1시간 간격 유지) - 임시 값 업데이트
  const updateTempTimeRange = (newStart: number, newEnd: number, preserveStart: boolean = false, preserveEnd: boolean = false) => {
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
        if (newStart < tempTimeRange[0]) {
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
    
    setTempTimeRange([newStart, newEnd]);
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
    dragStartRangeRef.current = [tempTimeRange[0], tempTimeRange[1]];
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !sliderTrackRef.current) return;
      
      const newTime = getTimeFromPosition(moveEvent.clientX);
      
      if (isDraggingRef.current === 'start') {
        updateTempTimeRange(newTime, tempTimeRange[1], false, true); // 종료점 유지
      } else if (isDraggingRef.current === 'end') {
        updateTempTimeRange(tempTimeRange[0], newTime, true, false); // 시작점 유지
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
    dragStartRangeRef.current = [tempTimeRange[0], tempTimeRange[1]];
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !sliderTrackRef.current) return;
      
      const deltaX = moveEvent.clientX - dragStartXRef.current;
      const deltaTime = getTimeFromPosition(moveEvent.clientX) - getTimeFromPosition(dragStartXRef.current);
      
      const newStart = dragStartRangeRef.current[0] + deltaTime;
      const newEnd = dragStartRangeRef.current[1] + deltaTime;
      
      if (newStart >= 0 && newEnd <= 1439) {
        updateTempTimeRange(newStart, newEnd);
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
    return Array.from({ length: 9 }, (_, i) => {
      const base = BASE_ITEMS[i];
      return { id: String(i + 1), ...base };
    });
  }, []);

  const visibleCaptureList = useMemo(() => {
    let list = excludedAttributes.length
      ? captureList.filter((item) => !shouldHideCaptureItem(item, excludedAttributes))
      : captureList;

    if (excludedImageIds.length > 0) {
      list = list.filter((item) => !excludedImageIds.includes(item.id));
    }

    // ID 매핑: 1-3(별빛A-230), 4-5(별빛A-444), 6(별빛A-481), 7(별빛A-498), 8-9(별빛A-583)
    list = list.filter((item) => {

      const cctvName = getV3CctvName(item.id);
      
      if (radius <= 200) {
        return ['별빛A-498', '별빛A-583'].includes(cctvName);
      } else if (radius < 400) {
        return ['별빛A-498', '별빛A-583', '별빛A-444', '별빛A-481'].includes(cctvName);
      } else {
        return true;
      }
    });
    
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
  }, [captureList, excludedAttributes, excludedImageIds, sortOption, radius]);

  useLayoutEffect(() => {
    if (!isVisible || !onListCardCountChange) return;
    onListCardCountChange(visibleCaptureList.length);
  }, [isVisible, onListCardCountChange, visibleCaptureList.length]);

  useLayoutEffect(() => {
    if (!onAppliedRadiusChange) return;
    onAppliedRadiusChange(radius);
  }, [onAppliedRadiusChange, radius]);
  
  // 임시 반경 변경 시 부모에 전달 (실시간 미리보기)
  useLayoutEffect(() => {
    if (!onRadiusChange) return;
    onRadiusChange(tempRadius);
  }, [onRadiusChange, tempRadius]);

  useEffect(() => {
    if (closePopupSignal && closePopupSignal > 0) {
      setSelectedCandidate(null);
    }
  }, [closePopupSignal]);

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

  // 틀림 시퀀스 시 리스트 맨 아래로 스크롤
  useEffect(() => {
    if (scrollToBottomTrigger !== 'wrong-button-1' || !listScrollRef.current) return;
    const el = listScrollRef.current;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
  }, [scrollToBottomTrigger]);

  return (
    <>
      <div
        className={`absolute top-0 bottom-0 flex flex-col transition-all duration-500 ease-out ${
          isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
        }`}
        style={{
          left: '80px',
          width: `${width}px`,
          zIndex: 150,
          paddingTop: '16px',
          paddingBottom: '16px',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        <div className="flex flex-col gap-3 h-full" style={{ paddingTop: isVisible ? '0.5rem' : '16px', minHeight: 0 }}>
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
                id="radius-chip-button"
                onClick={() => {
                  if (openPopover === 'radius') {
                    setOpenPopover(null);
                  } else {
                    setTempRadius(radius);
                    setOpenPopover('radius');
                  }
                }}
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
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-white text-sm font-semibold">검색 반경 설정</div>
                    <button
                      id="radius-confirm-button"
                      type="button"
                      onClick={() => {
                        setRadius(tempRadius);
                        setOpenPopover(null);
                        
                        // 짧은 스켈레톤 애니메이션 (0.5초)
                        setShowRadiusSkeleton(true);
                        setTimeout(() => {
                          setShowRadiusSkeleton(false);
                        }, 500);
                      }}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-full transition-colors"
                    >
                      확인
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        id="radius-slider"
                        type="range"
                        min="100"
                        max="3000"
                        step="100"
                        value={tempRadius}
                        onChange={(e) => setTempRadius(Number(e.target.value))}
                        className="w-full h-2 bg-[#0f0f0f] rounded-full appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((tempRadius - 100) / 2900) * 100}%, #0f0f0f ${((tempRadius - 100) / 2900) * 100}%, #0f0f0f 100%)`
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>100m</span>
                      <span className="text-white font-semibold">{tempRadius}m</span>
                      <span>3000m</span>
                    </div>
                    <div className="text-[10px] text-gray-400">
                      반경을 넓히면 더 많은 CCTV를 탐색하지만 분석 시간이 길어질 수 있습니다.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 시간 칩 */}
            <div className="relative">
              <button
                onClick={() => {
                  if (openPopover === 'time') {
                    setOpenPopover(null);
                  } else {
                    setTempTimeRange([timeRange[0], timeRange[1]]);
                    setOpenPopover('time');
                  }
                }}
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
                  className="absolute top-full left-0 mt-2 bg-[#1a1a1a] rounded-lg p-5 shadow-xl border border-[#31353a] z-[250] min-w-[380px]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-white text-sm font-semibold">시간 범위 선택</div>
                    <button
                      type="button"
                      onClick={() => {
                        setTimeRange([tempTimeRange[0], tempTimeRange[1]]);
                        setOpenPopover(null);

                        setShowRadiusSkeleton(true);
                        setTimeout(() => {
                          setShowRadiusSkeleton(false);
                        }, 500);
                      }}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-full transition-colors"
                    >
                      확인
                    </button>
                  </div>
                  <div className="space-y-2">
                    {/* 듀얼 핸들 슬라이더 */}
                    <div className="relative" style={{ height: '40px', display: 'flex', alignItems: 'center', paddingTop: '12px', paddingBottom: '12px' }}>
                      {/* 배경 트랙 */}
                      <div 
                        ref={sliderTrackRef}
                        className="absolute w-full h-3 rounded-full bg-[#0f0f0f] cursor-pointer"
                        style={{
                          zIndex: 1,
                        }}
                      />
                      
                      {/* 선택된 범위 */}
                      <div
                        className="absolute h-2 rounded-full bg-[#3b82f6] cursor-move"
                        onMouseDown={handleRangeMouseDown}
                        style={{
                          left: `${(tempTimeRange[0] / 1439) * 100}%`,
                          width: `${((tempTimeRange[1] - tempTimeRange[0]) / 1439) * 100}%`,
                          zIndex: 2,
                        }}
                      />
                      
                      {/* 시작 핸들 - 클릭 영역 확장 */}
                      <div
                        className="absolute cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => handleHandleMouseDown('start', e)}
                        style={{
                          left: `max(0px, calc(${(tempTimeRange[0] / 1439) * 100}% - 16px))`,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: 3,
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div className="w-5 h-5 rounded-full bg-[#3b82f6] border-3 border-white shadow-lg hover:scale-110 transition-transform" />
                      </div>
                      
                      {/* 종료 핸들 - 클릭 영역 확장 */}
                      <div
                        className="absolute cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => handleHandleMouseDown('end', e)}
                        style={{
                          left: `min(calc(100% - 32px), calc(${(tempTimeRange[1] / 1439) * 100}% - 16px))`,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: 3,
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div className="w-5 h-5 rounded-full bg-[#3b82f6] border-3 border-white shadow-lg hover:scale-110 transition-transform" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>00:00</span>
                      <span className="text-white font-semibold">{formatTime(tempTimeRange[0])} ~ {formatTime(tempTimeRange[1])}</span>
                      <span>23:59</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      시간 범위를 조정하여 검색할 시간대를 선택할 수 있습니다.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 정렬 칩 */}
            <div className="relative" ref={sortPopoverRef}>
              <button
                type="button"
                onClick={() => setOpenPopover(openPopover === 'sort' ? null : 'sort')}
                className="px-4 py-2 rounded-full text-xs font-medium transition-colors bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a] flex items-center gap-2 border border-[#31353a]"
                aria-label="정렬 옵션"
                aria-expanded={openPopover === 'sort'}
                aria-haspopup="listbox"
              >
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>정렬: {
                  sortOption === 'confidence-desc' ? '유사도순' :
                  sortOption === 'confidence-asc' ? '유사도 낮은순' :
                  sortOption === 'distance-asc' ? '거리순' : '거리 먼순'
                }</span>
                <Icon icon="mdi:chevron-down" className={`w-4 h-4 transition-transform ${openPopover === 'sort' ? 'rotate-180' : ''}`} />
              </button>
              
              {/* 정렬 옵션 팝오버 */}
              {openPopover === 'sort' && (
                <div
                  className="absolute top-full left-0 mt-2 bg-[#1a1a1a] rounded-lg p-3 shadow-xl border border-[#31353a] z-[250] min-w-[200px]"
                  role="listbox"
                  aria-label="정렬 기준 선택"
                >
                  <div className="text-white text-sm font-semibold mb-2">정렬 기준</div>
                  <div className="space-y-1">
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
                        className={`w-full px-3 py-2 rounded text-xs transition-colors text-left ${
                          sortOption === opt.value
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'text-gray-400 hover:bg-[#2a2a2a]'
                        }`}
                      >
                        {opt.label}
                      </button>
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
          {/* 리스트 상단 고정: 결과 재검색 */}
          <div
            className="flex items-center justify-end gap-2 flex-shrink-0 px-4 py-3 border-b border-[#31353a]"
            style={{ background: 'rgba(0,0,0,0.2)' }}
          >
            {/* 결과 재검색 */}
            <button
              id="re-search-button"
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
            ref={listScrollRef}
            className="flex-1 overflow-y-auto"
            style={{
              padding: '16px',
              minHeight: 0,
            }}
          >
            <div className="grid grid-cols-3 gap-3" style={{ minHeight: 'min-content' }}>
            {(showSkeleton || showRadiusSkeleton) ? (
              // 스켈레톤 로딩 (9개 카드)
              Array.from({ length: 9 }).map((_, idx) => (
                <div
                  key={`skeleton-${idx}`}
                  className="bg-[#393a42] rounded-lg overflow-hidden flex flex-col"
                >
                  {/* 썸네일 스켈레톤 */}
                  <div className="relative w-full bg-[#2a2b32]" style={{ height: '160px' }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon icon="mdi:image-outline" className="w-12 h-12 text-gray-600" />
                    </div>
                  </div>
                  
                  {/* 정보 스켈레톤 */}
                  <div className="flex-1 min-w-0 p-3 space-y-2">
                    <div 
                      className="h-3 bg-[#2a2b32] rounded"
                      style={{
                        animation: `skeleton-width-${idx % 3} 1.5s ease-in-out infinite`,
                        animationDelay: `${idx * 0.1}s`
                      }}
                    ></div>
                    <div 
                      className="h-3 bg-[#2a2b32] rounded"
                      style={{
                        animation: `skeleton-width-${(idx + 1) % 3} 1.5s ease-in-out infinite`,
                        animationDelay: `${idx * 0.1 + 0.2}s`
                      }}
                    ></div>
                    <div 
                      className="h-3 bg-[#2a2b32] rounded"
                      style={{
                        animation: `skeleton-width-${(idx + 2) % 3} 1.5s ease-in-out infinite`,
                        animationDelay: `${idx * 0.1 + 0.4}s`
                      }}
                    ></div>
                    <div 
                      className="h-3 bg-[#2a2b32] rounded mt-2"
                      style={{
                        animation: `skeleton-width-${idx % 3} 1.5s ease-in-out infinite`,
                        animationDelay: `${idx * 0.1 + 0.6}s`
                      }}
                    ></div>
                  </div>
                  
                  {/* 버튼 스켈레톤 */}
                  <div className="px-3 pb-2 flex gap-1.5">
                    <div className="flex-1 h-8 bg-[#2a2b32] rounded"></div>
                    <div className="flex-1 h-8 bg-[#2a2b32] rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              visibleCaptureList.map((item) => {
              const isMatched = matchedIds.has(item.id);
              const isWrong = wrongIds.has(item.id);
              return (
              <div
                key={item.id}
                id={`fast-search-candidate-${item.id}`}
                onClick={() => {
                  setSelectedCandidate(item);
                  onCandidateSelect?.();
                }}
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
                    src={getV3ThumbnailPath(item.id)}
                    alt={item.cctvName}
                    className={`w-full h-full object-cover transition-all duration-300 ${isWrong ? 'opacity-30 grayscale' : ''}`}
                    onError={(e) => {
                      // 이미지 로드 실패 시 플레이스홀더
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%231a1a1a"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23666" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>

                {/* 카드 정보 */}
                <div className="flex-1 min-w-0 px-3 pt-2 space-y-1">
                  <div className="text-xs text-white font-semibold truncate">{item.cctvName}</div>
                  <div className="text-[11px] text-gray-400 truncate">{item.location}</div>
                  <div className="text-[11px] text-gray-500">{item.timestamp}</div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-gray-500">유사도</span>
                    <span className="text-[11px] text-gray-600">|</span>
                    <span className="text-xs text-white font-semibold">{item.confidence}%</span>
                  </div>
                </div>

                {/* 틀림/맞음 버튼 */}
                <div className="px-3 pb-3 pt-2 flex gap-1.5">
                  <button
                    id={item.id === '1' ? 'wrong-button-1' : undefined}
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
                    id={item.id === '9' ? 'match-button-9' : undefined}
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
            })
            )}
            </div>
          </div>
        </div>
        </div>
      </div>

      <FastSearchCandidateDetailPopup
        isOpen={!!selectedCandidate}
        onClose={() => {
          const shouldRunAutoWrong = autoWrongSequenceRef.current;
          autoWrongSequenceRef.current = false;
          setSelectedCandidate(null);
          onPopupClose?.();

          if (shouldRunAutoWrong && listScrollRef.current) {
            const el = listScrollRef.current;
            requestAnimationFrame(() => {
              el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
            });

            const autoClickWrong = (itemId: string) => {
              setWrongIds((prev) => new Set(prev).add(itemId));
              setMatchedIds((prev) => { const next = new Set(prev); next.delete(itemId); return next; });
              const card = document.getElementById(`fast-search-candidate-${itemId}`);
              if (card) {
                card.style.transition = 'outline 0.3s ease, outline-offset 0.3s ease';
                card.style.outline = '2px solid rgba(239, 68, 68, 0.6)';
                card.style.outlineOffset = '2px';
                setTimeout(() => {
                  card.style.outline = 'none';
                  card.style.outlineOffset = '0px';
                }, 800);
              }
            };

            setTimeout(() => autoClickWrong('8'), 800);
            setTimeout(() => autoClickWrong('9'), 1400);

            setTimeout(() => {
              const el2 = listScrollRef.current;
              if (el2) {
                el2.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }, 2000);

            setTimeout(() => {
              const btn = document.getElementById('re-search-button');
              if (btn) {
                btn.style.transition = 'box-shadow 0.3s ease, background-color 0.3s ease';
                btn.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.6)';
                btn.style.backgroundColor = '#3b82f6';
              }
            }, 2600);

            setTimeout(() => {
              const btn = document.getElementById('re-search-button');
              if (btn) {
                btn.click();
                btn.style.boxShadow = '';
                btn.style.backgroundColor = '';
              }
            }, 3400);

            setTimeout(() => {
              const menuBtn = document.getElementById('object-tracking-menu');
              if (menuBtn) {
                menuBtn.style.transition = 'box-shadow 0.3s ease';
                menuBtn.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.6)';
                menuBtn.click();
                setTimeout(() => { menuBtn.style.boxShadow = ''; }, 600);
              }
            }, 8400);

            setTimeout(() => {
              const confirmBtn = document.getElementById('object-tracking-confirm-button');
              if (confirmBtn) {
                confirmBtn.click();
              }
            }, 9200);
          }
        }}
        candidate={selectedCandidate}
        onAddCapture={onAddCapture}
        autoCapture={autoCapture}
        matchState={
          selectedCandidate
            ? matchedIds.has(selectedCandidate.id)
              ? 'matched'
              : wrongIds.has(selectedCandidate.id)
                ? 'wrong'
                : 'none'
            : 'none'
        }
        onMatchStateChange={(state) => {
          if (!selectedCandidate) return;
          const id = selectedCandidate.id;
          if (state === 'matched') {
            setMatchedIds((prev) => new Set(prev).add(id));
            setWrongIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
          } else if (state === 'wrong') {
            setWrongIds((prev) => new Set(prev).add(id));
            setMatchedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
          } else {
            setMatchedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
            setWrongIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
          }
          if (id === '1') {
            autoWrongSequenceRef.current = true;
          }
        }}
      />
    </>
  );
};

export default FastSearchListPanel;
