import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import TopControlPanel from './TopControlPanel';

interface FastSearchListPanelProps {
  isVisible: boolean;
  width?: number;
}

interface CaptureItem {
  id: string;
  cctvId: string;
  cctvName: string;
  timestamp: string;
  confidence: number;
  location: string;
}

const FastSearchListPanel: React.FC<FastSearchListPanelProps> = ({
  isVisible,
  width = 900,
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
  const [openPopover, setOpenPopover] = useState<'radius' | 'time' | 'zone' | null>(null);
  
  // 팝오버 refs
  const radiusPopoverRef = useRef<HTMLDivElement>(null);
  const timePopoverRef = useRef<HTMLDivElement>(null);
  const zonePopoverRef = useRef<HTMLDivElement>(null);
  
  // 듀얼 슬라이더 드래그 상태
  const sliderTrackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<'start' | 'end' | 'range' | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartRangeRef = useRef<[number, number]>([0, 0]);
  
  // 펼쳐진 구 상태
  const [expandedGu, setExpandedGu] = useState<string | null>(null);
  
  // 구역 호버 상태
  const [isZoneHovered, setIsZoneHovered] = useState<boolean>(false);
  
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

  // Mock 데이터 - 실제로는 API에서 받아올 데이터
  const captureList: CaptureItem[] = [
    { id: '1', cctvId: 'CCTV-V-1', cctvName: 'CCTV-V-1', timestamp: '09:32:15', confidence: 92, location: '부천로 245번길' },
    { id: '2', cctvId: 'CCTV-V-2', cctvName: 'CCTV-V-2', timestamp: '09:33:42', confidence: 88, location: '부천로 245번길' },
    { id: '3', cctvId: 'CCTV-V-3', cctvName: 'CCTV-V-3', timestamp: '09:35:18', confidence: 85, location: '부천로 245번길' },
    { id: '4', cctvId: 'CCTV-V-4', cctvName: 'CCTV-V-4', timestamp: '09:36:55', confidence: 90, location: '부천로 245번길' },
    { id: '5', cctvId: 'CCTV-V-1', cctvName: 'CCTV-V-1', timestamp: '09:38:12', confidence: 87, location: '부천로 245번길' },
    { id: '6', cctvId: 'CCTV-V-2', cctvName: 'CCTV-V-2', timestamp: '09:39:30', confidence: 91, location: '부천로 245번길' },
  ];

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
        <div className="flex flex-col gap-4 h-full" style={{ paddingTop: isVisible ? '60px' : '16px' }}>
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
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
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
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
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

        {/* 리스트 영역 */}
        <div
          className="rounded-lg p-4 flex-1 overflow-y-auto gradient-border-right-bottom"
          style={{
            minHeight: 0,
            background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
          }}
        >
          <div className="grid grid-cols-5 gap-3">
            {captureList.map((item) => (
              <div
                key={item.id}
                className="bg-[#393a42] rounded-lg overflow-hidden cursor-pointer transition-colors flex flex-col"
              >
                {/* 썸네일 */}
                <div className="relative w-full bg-black" style={{ height: '160px' }}>
                  <img
                    src={`/cctv_img/00${(parseInt(item.id) % 5) + 1}.jpg`}
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
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default FastSearchListPanel;
