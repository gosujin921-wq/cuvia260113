import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import PredictedCCTVDetailPopup from './PredictedCCTVDetailPopup';

interface PredictedCCTVListPanelProps {
  isVisible: boolean;
  width?: number;
  onAddCapture?: (cctvName: string, location: string, confidence: number) => void;
  hoveredCCTVId?: string | null;
  onCCTVHover?: (cctvId: string | null) => void;
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
}

// Mock 데이터 - 4번 핀(춘의동 125-32) 근처 CCTV 10개
const PREDICTED_CCTV_DATA: PredictedCCTVItem[] = [
  {
    id: '1',
    cctvName: '원미A-583',
    location: '원미구 춘의동 125-32',
    distance: 15,
    predictedTime: '09:35:15',
    confidence: 92,
    direction: '북동쪽',
    thumbnailUrl: '/images/cctv-placeholder.jpg',
  },
  {
    id: '2',
    cctvName: '원미A-604',
    location: '원미구 춘의동 125-32',
    distance: 20,
    predictedTime: '09:35:30',
    confidence: 88,
    direction: '북서쪽',
    thumbnailUrl: '/images/cctv-placeholder.jpg',
  },
  {
    id: '3',
    cctvName: '원미A-621',
    location: '원미구 춘의동 125-32',
    distance: 18,
    predictedTime: '09:35:45',
    confidence: 85,
    direction: '동쪽',
    thumbnailUrl: '/images/cctv-placeholder.jpg',
  },
  {
    id: '4',
    cctvName: '원미A-638',
    location: '원미구 춘의동 125-32',
    distance: 22,
    predictedTime: '09:36:00',
    confidence: 83,
    direction: '남서쪽',
    thumbnailUrl: '/images/cctv-placeholder.jpg',
  },
  {
    id: '5',
    cctvName: '원미A-655',
    location: '원미구 춘의동 125-32',
    distance: 25,
    predictedTime: '09:36:15',
    confidence: 80,
    direction: '남동쪽',
    thumbnailUrl: '/images/cctv-placeholder.jpg',
  },
  {
    id: '6',
    cctvName: '원미A-672',
    location: '원미구 춘의동 125-32',
    distance: 25,
    predictedTime: '09:36:30',
    confidence: 78,
    direction: '서쪽',
    thumbnailUrl: '/images/cctv-placeholder.jpg',
  },
  {
    id: '7',
    cctvName: '원미A-689',
    location: '원미구 춘의동 125-32',
    distance: 28,
    predictedTime: '09:36:45',
    confidence: 75,
    direction: '동쪽',
    thumbnailUrl: '/images/cctv-placeholder.jpg',
  },
  {
    id: '8',
    cctvName: '원미A-706',
    location: '원미구 춘의동 125-32',
    distance: 30,
    predictedTime: '09:37:00',
    confidence: 73,
    direction: '북쪽',
    thumbnailUrl: '/images/cctv-placeholder.jpg',
  },
  {
    id: '9',
    cctvName: '원미A-723',
    location: '원미구 춘의동 125-32',
    distance: 32,
    predictedTime: '09:37:15',
    confidence: 70,
    direction: '남서쪽',
    thumbnailUrl: '/images/cctv-placeholder.jpg',
  },
  {
    id: '10',
    cctvName: '원미A-740',
    location: '원미구 춘의동 125-32',
    distance: 30,
    predictedTime: '09:37:30',
    confidence: 68,
    direction: '남동쪽',
    thumbnailUrl: '/images/cctv-placeholder.jpg',
  },
];

const PredictedCCTVListPanel: React.FC<PredictedCCTVListPanelProps> = ({
  isVisible,
  width = 700,
  onAddCapture,
  hoveredCCTVId: externalHoveredCCTVId,
  onCCTVHover,
}) => {
  const [selectedCCTV, setSelectedCCTV] = useState<PredictedCCTVItem | null>(null);
  const [sortOption, setSortOption] = useState<'confidence' | 'distance' | 'time'>('confidence');
  const [openPopover, setOpenPopover] = useState<'sort' | null>(null);
  const sortPopoverRef = React.useRef<HTMLDivElement>(null);
  const cctvMarkersRef = React.useRef<Map<string, HTMLElement>>(new Map());
  
  // 외부에서 받은 hoveredCCTVId 사용
  const hoveredCCTVId = externalHoveredCCTVId;
  
  // 팝오버 외부 클릭 감지
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortPopoverRef.current && !sortPopoverRef.current.contains(event.target as Node)) {
        setOpenPopover(null);
      }
    };
    
    if (openPopover) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openPopover]);


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
              {/* 경로 적합도 칩 */}
              <div className="px-4 py-2 rounded-full text-xs font-medium bg-[#1a1a1a] text-gray-300 flex items-center gap-2 border border-[#31353a]">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>경로 적합도: 평균 82점</span>
              </div>
              
              {/* 거리 칩 */}
              <div className="px-4 py-2 rounded-full text-xs font-medium bg-[#1a1a1a] text-gray-300 flex items-center gap-2 border border-[#31353a]">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span>거리: 15~35m</span>
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
            {/* 상단 액션 버튼 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#31353a]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded text-xs font-medium transition-colors text-gray-300 hover:text-white hover:bg-[#2a2a2a] border border-[#31353a]"
                  aria-label="전체 선택"
                >
                  전체 선택
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded text-xs font-medium transition-colors text-gray-300 hover:text-white hover:bg-[#2a2a2a] border border-[#31353a]"
                  aria-label="선택 해제"
                >
                  선택 해제
                </button>
              </div>
              
              <button
                type="button"
                className="px-4 py-1.5 rounded-lg text-xs font-medium transition-colors text-white bg-blue-500 hover:bg-blue-600"
                aria-label="선택한 CCTV 분석"
              >
                <div className="flex items-center gap-1.5">
                  <Icon icon="mdi:play" className="w-3.5 h-3.5" />
                  <span>선택 영상 재생</span>
                </div>
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
                {PREDICTED_CCTV_DATA.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedCCTV(item)}
                    onMouseEnter={() => onCCTVHover?.(item.id)}
                    onMouseLeave={() => onCCTVHover?.(null)}
                    className={`relative bg-[#393a42] rounded-lg overflow-hidden cursor-pointer transition-all group ${
                      hoveredCCTVId === item.id ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0a0e14] scale-105' : ''
                    }`}
                  >
                    {/* 썸네일 - CCTV 영상 */}
                    <div className="relative w-full bg-black" style={{ paddingTop: '56.25%' }}>
                      <video
                        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute top-0 left-0 w-full h-full object-cover"
                      />
                      
                      {/* 호버 시 정보 오버레이 */}
                      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-center p-3 space-y-2">
                        {/* CCTV명 */}
                        <div className="text-xs text-white font-semibold truncate" title={item.cctvName}>
                          {item.cctvName}
                        </div>
                        
                        {/* 주소 */}
                        <div className="text-xs text-gray-300 truncate" title={item.location}>
                          {item.location}
                        </div>

                        {/* 경로 적합도 */}
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] text-gray-400">경로 적합도</span>
                          <span className="text-[10px] text-gray-500">|</span>
                          <span className="text-xs text-blue-400 font-semibold">
                            {item.confidence}점
                          </span>
                        </div>
                      </div>
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
