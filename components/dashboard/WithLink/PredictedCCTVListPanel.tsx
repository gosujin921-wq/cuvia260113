import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import PredictedCCTVDetailPopup from './PredictedCCTVDetailPopup';

interface PredictedCCTVListPanelProps {
  isVisible: boolean;
  width?: number;
  onAddCapture?: (cctvName: string, location: string, confidence: number, capturedImage?: string, analysisResult?: string, videoUrl?: string) => void;
  hoveredCCTVId?: string | null;
  onCCTVHover?: (cctvId: string | null) => void;
  /** 반경(m) 변경 시 부모에 전달 (지도 대시 원 연동) */
  onRadiusChange?: (radius: number) => void;
}

export interface PredictedCCTVItem {
  id: string;
  cctvName: string;
  location: string;
  distance: number; // 미터
  predictedTime: string; // HH:MM:SS
  confidence: number; // 0-100
  direction: string; // 예: "북동쪽", "남쪽"
  thumbnailUrl: string;
  posterUrl?: string;
}

// Mock 데이터 - 4번 핀(달빛로301번길 28) 근처 CCTV 10개
const PREDICTED_CCTV_DATA: PredictedCCTVItem[] = [
  {
    id: '1',
    cctvName: '별빛A-583',
    location: '달빛로301번길 28',
    distance: 15,
    predictedTime: '09:35:15',
    confidence: 92,
    direction: '북동쪽',
    thumbnailUrl: '/fastsearch_img/qs_img_05_n.mp4',
    posterUrl: '/fastsearch_img/qs_img_05_n.png',
  },
  {
    id: '2',
    cctvName: '별빛A-604',
    location: '달빛로301번길 28',
    distance: 20,
    predictedTime: '09:35:30',
    confidence: 88,
    direction: '북서쪽',
    thumbnailUrl: '/fastsearch_img/qs_img_11_n.mp4',
    posterUrl: '/fastsearch_img/qs_img_11_n.png',
  },
  {
    id: '3',
    cctvName: '별빛A-621',
    location: '달빛로301번길 28',
    distance: 18,
    predictedTime: '09:35:45',
    confidence: 85,
    direction: '동쪽',
    thumbnailUrl: '/fastsearch_img/qs_img_15_n.mp4',
    posterUrl: '/fastsearch_img/qs_img_15_n.png',
  },
  {
    id: '4',
    cctvName: '별빛A-638',
    location: '달빛로301번길 28',
    distance: 22,
    predictedTime: '09:36:00',
    confidence: 83,
    direction: '남서쪽',
    thumbnailUrl: '/fastsearch_img/qs_img_21_y.mp4',
    posterUrl: '/fastsearch_img/qs_img_21_y.png',
  },
  {
    id: '5',
    cctvName: '별빛A-655',
    location: '달빛로301번길 28',
    distance: 25,
    predictedTime: '09:36:15',
    confidence: 80,
    direction: '남동쪽',
    thumbnailUrl: '/fastsearch_img/qs_img_25_y.mp4',
    posterUrl: '/fastsearch_img/qs_img_25_y.png',
  },
  {
    id: '6',
    cctvName: '별빛A-672',
    location: '달빛로301번길 28',
    distance: 25,
    predictedTime: '09:36:30',
    confidence: 78,
    direction: '서쪽',
    thumbnailUrl: '/fastsearch_img/qs_img_30_y.mp4',
    posterUrl: '/fastsearch_img/qs_img_30_y.png',
  },
  {
    id: '7',
    cctvName: '별빛A-689',
    location: '달빛로301번길 28',
    distance: 28,
    predictedTime: '09:36:45',
    confidence: 75,
    direction: '동쪽',
    thumbnailUrl: '/fastsearch_img/qs_img_40_y.mp4',
    posterUrl: '/fastsearch_img/qs_img_40_y.png',
  },
  {
    id: '8',
    cctvName: '별빛A-706',
    location: '달빛로301번길 28',
    distance: 30,
    predictedTime: '09:37:00',
    confidence: 73,
    direction: '북쪽',
    thumbnailUrl: '/fastsearch_img/qs_img_47_y.mp4',
    posterUrl: '/fastsearch_img/qs_img_47_y.png',
  },
  {
    id: '9',
    cctvName: '별빛A-723',
    location: '달빛로301번길 28',
    distance: 32,
    predictedTime: '09:37:15',
    confidence: 70,
    direction: '남서쪽',
    thumbnailUrl: '/fastsearch_img/qs_img_51_y.mp4',
    posterUrl: '/fastsearch_img/qs_img_51_y.png',
  },
  {
    id: '10',
    cctvName: '별빛A-740',
    location: '달빛로301번길 28',
    distance: 30,
    predictedTime: '09:37:30',
    confidence: 68,
    direction: '남동쪽',
    thumbnailUrl: '/fastsearch_img/qs_img_59_y.mp4',
    posterUrl: '/fastsearch_img/qs_img_59_y.png',
  },
];

/** 팝업 열리면 비디오 일시정지, poster로 대역폭 절약 */
const ListVideo: React.FC<{ src: string; posterUrl?: string; isPaused: boolean }> = ({ src, posterUrl, isPaused }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPaused) v.pause();
    else v.play().catch(() => {});
  }, [isPaused]);
  if (!src?.trim()) return <div className="absolute inset-0 bg-black" aria-hidden />;
  return (
    <video
      ref={videoRef}
      src={src}
      poster={posterUrl}
      loop
      muted
      playsInline
      preload="none"
      className="absolute top-0 left-0 w-full h-full object-cover"
    />
  );
};

const PredictedCCTVListPanel: React.FC<PredictedCCTVListPanelProps> = ({
  isVisible,
  width = 700,
  onAddCapture,
  hoveredCCTVId: externalHoveredCCTVId,
  onCCTVHover,
  onRadiusChange,
}) => {
  const [selectedCCTV, setSelectedCCTV] = useState<PredictedCCTVItem | null>(null);
  const [sortOption, setSortOption] = useState<'confidence' | 'distance' | 'time'>('confidence');
  const [openPopover, setOpenPopover] = useState<'sort' | 'radius' | null>(null);
  const sortPopoverRef = React.useRef<HTMLDivElement>(null);
  const radiusPopoverRef = React.useRef<HTMLDivElement>(null);
  const cctvMarkersRef = React.useRef<Map<string, HTMLElement>>(new Map());
  // 반경 필터 상태
  const [radius, setRadius] = React.useState<number>(100); // 반경 (m) - 실제 적용된 값
  
  // 임시 값 (팝오버에서 선택 중인 값) - 실시간 미리보기를 위해 이 값을 바로 전달
  const [tempRadius, setTempRadius] = React.useState<number>(100);
  
  // 외부에서 받은 hoveredCCTVId 사용
  const hoveredCCTVId = externalHoveredCCTVId;
  
  // 팝오버 외부 클릭 감지
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openPopover === 'sort' && sortPopoverRef.current && !sortPopoverRef.current.contains(event.target as Node)) {
        setOpenPopover(null);
      }
      if (openPopover === 'radius' && radiusPopoverRef.current && !radiusPopoverRef.current.contains(event.target as Node)) {
        setOpenPopover(null);
      }
    };
    
    if (openPopover) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openPopover]);
  
  // 반경 변경 시 부모에 전달 (확정된 값)
  React.useEffect(() => {
    if (!onRadiusChange) return;
    onRadiusChange(radius);
  }, [onRadiusChange, radius]);
  
  // 임시 반경 변경 시 부모에 전달 (실시간 미리보기)
  React.useEffect(() => {
    if (!onRadiusChange) return;
    onRadiusChange(tempRadius);
  }, [onRadiusChange, tempRadius]);

  const isPopupOpen = selectedCCTV !== null;

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
                        type="button"
                        onClick={() => {
                          setRadius(tempRadius);
                          setOpenPopover(null);
                        }}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-full transition-colors"
                      >
                        확인
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div className="relative">
                        <input
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

              {/* 정렬 칩 */}
              <div className="relative">
                <button
                  onClick={() => setOpenPopover(openPopover === 'sort' ? null : 'sort')}
                  className="px-4 py-2 rounded-full text-xs font-medium transition-colors bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a] flex items-center gap-2 border border-[#31353a]"
                >
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>정렬: {sortOption === 'confidence' ? '신뢰도순' : sortOption === 'distance' ? '거리순' : '시간순'}</span>
                  <Icon icon="mdi:chevron-down" className={`w-4 h-4 transition-transform ${openPopover === 'sort' ? 'rotate-180' : ''}`} />
                </button>
                
                {/* 정렬 팝오버 */}
                {openPopover === 'sort' && (
                  <div
                    ref={sortPopoverRef}
                    className="absolute top-full left-0 mt-2 bg-[#1a1a1a] rounded-lg p-3 shadow-xl border border-[#31353a] z-[250] min-w-[180px]"
                  >
                    <div className="text-white text-sm font-semibold mb-2">정렬 기준</div>
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setSortOption('confidence');
                          setOpenPopover(null);
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${
                          sortOption === 'confidence' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-400 hover:bg-[#2a2a2a]'
                        }`}
                      >
                        신뢰도 높은 순
                      </button>
                      <button
                        onClick={() => {
                          setSortOption('distance');
                          setOpenPopover(null);
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${
                          sortOption === 'distance' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-400 hover:bg-[#2a2a2a]'
                        }`}
                      >
                        거리 가까운 순
                      </button>
                      <button
                        onClick={() => {
                          setSortOption('time');
                          setOpenPopover(null);
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${
                          sortOption === 'time' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-400 hover:bg-[#2a2a2a]'
                        }`}
                      >
                        예측 시간순
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 리스트 영역 */}
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
            <div
              className="flex-1 overflow-y-auto"
              style={{
                padding: '16px',
                minHeight: 0,
              }}
            >
              <div className="grid grid-cols-3 gap-3" style={{ minHeight: 'min-content' }}>
                {PREDICTED_CCTV_DATA.map((item) => (
                  <div
                    key={item.id}
                    id={item.id === '4' ? 'predicted-cctv-7' : undefined}
                    onClick={() => setSelectedCCTV(item)}
                    onMouseEnter={() => onCCTVHover?.(item.id)}
                    onMouseLeave={() => onCCTVHover?.(null)}
                    className={`relative bg-[#393a42] rounded-lg overflow-hidden cursor-pointer transition-all group ${
                      hoveredCCTVId === item.id ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0a0e14] scale-105' : ''
                    }`}
                  >
                    {/* 썸네일 */}
                    <div className="relative w-full bg-black overflow-hidden" style={{ paddingTop: '56.25%' }}>
                      <ListVideo src={item.thumbnailUrl} posterUrl={item.posterUrl} isPaused={isPopupOpen} />
                      
                      {/* 호버 시 주소 아래→위 슬라이드 */}
                      <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out bg-black/70 px-2 py-1">
                        <div className="text-[10px] text-gray-200 truncate" title={item.location}>
                          {item.location}
                        </div>
                      </div>
                    </div>
                    
                    {/* CCTV명 + 경로 적합도 */}
                    <div className="px-3 py-2 flex items-center justify-between gap-2">
                      <div className="text-xs text-gray-300 font-semibold truncate" title={item.cctvName}>
                        {item.cctvName}
                      </div>
                      <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-blue-500/20 text-[10px] text-blue-400 font-semibold leading-none">
                        {item.confidence}점
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CCTV 상세 팝업 */}
      <PredictedCCTVDetailPopup
        isOpen={selectedCCTV !== null}
        onClose={() => setSelectedCCTV(null)}
        cctv={selectedCCTV}
        onAddCapture={onAddCapture}
      />
    </>
  );
};

export default PredictedCCTVListPanel;
