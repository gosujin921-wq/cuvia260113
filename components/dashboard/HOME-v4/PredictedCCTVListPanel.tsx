import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import PredictedCCTVDetailPopup from './PredictedCCTVDetailPopup';

interface PredictedCCTVListPanelProps {
  isVisible: boolean;
  width?: number;
  onAddCapture?: (cctvName: string, location: string, confidence: number, capturedImage?: string, analysisResult?: string, videoUrl?: string, options?: { trackingPinNumber?: number }) => void;
  hoveredCCTVId?: string | null;
  onCCTVHover?: (cctvId: string | null) => void;
  /** 반경(m) 변경 시 부모에 전달 (지도 대시 원 연동) */
  onRadiusChange?: (radius: number) => void;
  /** true면 별빛A-655 상단 1x1, 나머지 3열 (2키 눌렀을 때) */
  showFeaturedLayout?: boolean;
  /** '5'일 때 별빛A-655 카드에 캡처 애니메이션 후 포착목록 추가 (전파 초안 요청 시) */
  triggerCaptureForCctvId?: string | null;
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
  /** 2키 눌렀을 때 크게 나오는 영상 (리스트 썸네일과 별도) */
  featuredThumbnailUrl?: string;
  featuredPosterUrl?: string;
}

// Mock 데이터 - 4번 핀(은하동 125-32) 근처 CCTV 10개
const PREDICTED_CCTV_DATA: PredictedCCTVItem[] = [
  {
    id: '1',
    cctvName: '별빛A-583',
    location: '별빛구 은하동 125-32',
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
    location: '별빛구 은하동 125-32',
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
    location: '별빛구 은하동 125-32',
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
    location: '별빛구 은하동 125-32',
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
    location: '별빛구 은하동 125-32',
    distance: 25,
    predictedTime: '09:36:15',
    confidence: 80,
    direction: '남동쪽',
    thumbnailUrl: '/fastsearch_img/qs_img_59_y.mp4',
    posterUrl: '/fastsearch_img/qs_img_59_y.png',
    featuredThumbnailUrl: '/hijacking/cnc_04_1.mp4',
    featuredPosterUrl: '/hijacking/cnc_04.png',
  },
  {
    id: '6',
    cctvName: '별빛A-672',
    location: '별빛구 은하동 125-32',
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
    location: '별빛구 은하동 125-32',
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
    location: '별빛구 은하동 125-32',
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
    location: '별빛구 은하동 125-32',
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
    location: '별빛구 은하동 125-32',
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
    if (isPaused) {
      v.pause();
      return;
    }
    const play = () => v.play().catch(() => {});
    if (v.readyState >= 2) {
      play();
      return;
    }
    v.load();
    const onLoaded = () => play();
    v.addEventListener('loadeddata', onLoaded, { once: true });
    return () => v.removeEventListener('loadeddata', onLoaded);
  }, [isPaused, src]);
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

const FEATURED_CCTV_ID = '5'; // 별빛A-655
const FEATURED_ANALYSIS = '차종/색상/외형 특징 일치(추정). 부분 번호판 후보: 12 324 (가시성: 높음). 동 방향 진행.';

const PredictedCCTVListPanel: React.FC<PredictedCCTVListPanelProps> = ({
  isVisible,
  width = 700,
  onAddCapture,
  hoveredCCTVId: externalHoveredCCTVId,
  onCCTVHover,
  onRadiusChange,
  showFeaturedLayout = false,
  triggerCaptureForCctvId = null,
}) => {
  const [selectedCCTV, setSelectedCCTV] = useState<PredictedCCTVItem | null>(null);
  const [sortOption, setSortOption] = useState<'confidence' | 'distance' | 'time'>('confidence');
  const [isCapturingCctvId, setIsCapturingCctvId] = useState<string | null>(null);
  const [flyingThumbnail, setFlyingThumbnail] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    imageData: string;
  } | null>(null);
  const cardRefMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const [openPopover, setOpenPopover] = useState<'sort' | 'radius' | null>(null);
  const sortPopoverRef = React.useRef<HTMLDivElement>(null);
  const radiusPopoverRef = React.useRef<HTMLDivElement>(null);
  const cctvMarkersRef = React.useRef<Map<string, HTMLElement>>(new Map());
  // 반경 필터 상태
  const [radius, setRadius] = React.useState<number>(100); // 반경 (m) - 실제 적용된 값
  
  // 임시 값 (팝오버에서 선택 중인 값) - 실시간 미리보기를 위해 이 값을 바로 전달
  const [tempRadius, setTempRadius] = React.useState<number>(100);
  
  // 2키(showFeaturedLayout)일 때 별빛A-655 디폴트 호버 상태, 그 외엔 외부 hoveredCCTVId 사용
  const hoveredCCTVId = externalHoveredCCTVId ?? (showFeaturedLayout ? FEATURED_CCTV_ID : null);
  
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
  /** 2키 눌렀을 때 featured 별빛A-655(cnc_04_1.mp4)만 자동 재생 */
  const shouldPlayFeaturedVideo = isVisible && !isPopupOpen && showFeaturedLayout;
  /** 리스트 그리드 영상들: 패널 보일 때 재생 (featured 제외) */
  const shouldPlayListVideo = isVisible && !isPopupOpen;

  // 전파 초안 요청 시 별빛A-655 캡처 애니메이션 실행
  useEffect(() => {
    if (triggerCaptureForCctvId !== FEATURED_CCTV_ID || !onAddCapture) return;

    const featuredItem = PREDICTED_CCTV_DATA.find((item) => item.id === FEATURED_CCTV_ID);
    if (!featuredItem) return;

    const cardEl = cardRefMap.current.get(FEATURED_CCTV_ID);
    if (!cardEl) return;

    const rect = cardEl.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    const captureMenuButton = document.querySelector('[aria-label="포착목록"]');
    let endX = 40;
    let endY = 250;
    if (captureMenuButton) {
      const menuRect = captureMenuButton.getBoundingClientRect();
      endX = menuRect.left + menuRect.width / 2;
      endY = menuRect.top + menuRect.height / 2;
    }

    const imageData = featuredItem.featuredPosterUrl ?? featuredItem.posterUrl ?? featuredItem.featuredThumbnailUrl ?? featuredItem.thumbnailUrl ?? '';

    setIsCapturingCctvId(FEATURED_CCTV_ID);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlyingThumbnail({ startX, startY, endX, endY, imageData });
      });
    });

    setTimeout(() => {
      onAddCapture(
        featuredItem.cctvName,
        featuredItem.location,
        featuredItem.confidence,
        imageData,
        FEATURED_ANALYSIS,
        featuredItem.featuredThumbnailUrl ?? featuredItem.thumbnailUrl,
        { trackingPinNumber: 4 }
      );
    }, 300);

    setTimeout(() => setFlyingThumbnail(null), 600);
    setTimeout(() => setIsCapturingCctvId(null), 1000);
  }, [triggerCaptureForCctvId, onAddCapture]);

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
              {showFeaturedLayout ? (
                <div className="flex flex-col gap-3" style={{ minHeight: 'min-content' }}>
                  {/* 별빛A-655 상단 1x1 (2키 눌렀을 때) */}
                  {(() => {
                    const featuredItem = PREDICTED_CCTV_DATA.find((item) => item.cctvName === '별빛A-655');
                    const restItems = PREDICTED_CCTV_DATA.filter((item) => item.cctvName !== '별빛A-655');
                    return (
                      <>
                        {featuredItem && (
                          <div
                            key={featuredItem.id}
                            ref={(el) => { if (el) cardRefMap.current.set(featuredItem.id, el); }}
                            onClick={() => setSelectedCCTV(featuredItem)}
                            onMouseEnter={() => onCCTVHover?.(featuredItem.id)}
                            onMouseLeave={() => onCCTVHover?.(null)}
                            className={`relative bg-[#393a42] rounded-lg overflow-hidden cursor-pointer transition-all group animate-featured-fade-slide ${
                              hoveredCCTVId === featuredItem.id ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0a0e14] scale-[1.02]' : ''
                            }`}
                          >
                            <div className="relative w-full bg-black overflow-hidden" style={{ paddingTop: '56.25%' }}>
                              <ListVideo src={featuredItem.featuredThumbnailUrl ?? featuredItem.thumbnailUrl} posterUrl={featuredItem.featuredPosterUrl ?? featuredItem.posterUrl} isPaused={!shouldPlayFeaturedVideo} />
                              {isCapturingCctvId === featuredItem.id && (
                                <div className="absolute inset-0 pointer-events-none z-20">
                                  <div className="absolute inset-0 bg-white animate-capture-flash" />
                                  <div className="absolute inset-0 border-4 border-blue-500 animate-capture-frame" />
                                  <div className="absolute inset-0 flex items-center justify-center animate-capture-check">
                                    <div className="bg-blue-500 rounded-full p-2">
                                      <Icon icon="mdi:check" className="w-6 h-6 text-white" />
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out bg-black/70 px-2 py-1">
                                <div className="text-[10px] text-gray-200 truncate" title={featuredItem.location}>
                                  {featuredItem.location}
                                </div>
                              </div>
                            </div>
                            <div className="px-3 py-2 flex items-center justify-between gap-2">
                              <div className="text-xs text-gray-300 font-semibold truncate" title={featuredItem.cctvName}>
                                {featuredItem.cctvName}
                              </div>
                              <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-blue-500/20 text-[10px] text-blue-400 font-semibold leading-none">
                                {featuredItem.confidence}점
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-3 animate-featured-grid-fade">
                          {restItems.map((item) => (
                            <div
                              key={item.id}
                              ref={(el) => { if (el) cardRefMap.current.set(item.id, el); }}
                              id={item.id === '4' ? 'predicted-cctv-7' : undefined}
                              onClick={() => setSelectedCCTV(item)}
                              onMouseEnter={() => onCCTVHover?.(item.id)}
                              onMouseLeave={() => onCCTVHover?.(null)}
                              className={`relative bg-[#393a42] rounded-lg overflow-hidden cursor-pointer transition-all group ${
                                hoveredCCTVId === item.id ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0a0e14] scale-105' : ''
                              }`}
                            >
                              <div className="relative w-full bg-black overflow-hidden" style={{ paddingTop: '56.25%' }}>
                                <ListVideo src={item.thumbnailUrl} posterUrl={item.posterUrl} isPaused={!shouldPlayListVideo} />
                                <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out bg-black/70 px-2 py-1">
                                  <div className="text-[10px] text-gray-200 truncate" title={item.location}>
                                    {item.location}
                                  </div>
                                </div>
                              </div>
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
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 animate-fade-in" style={{ minHeight: 'min-content' }}>
                  {PREDICTED_CCTV_DATA.map((item) => (
                    <div
                      key={item.id}
                      ref={(el) => { if (el) cardRefMap.current.set(item.id, el); }}
                      id={item.id === '4' ? 'predicted-cctv-7' : undefined}
                      onClick={() => setSelectedCCTV(item)}
                      onMouseEnter={() => onCCTVHover?.(item.id)}
                      onMouseLeave={() => onCCTVHover?.(null)}
                      className={`relative bg-[#393a42] rounded-lg overflow-hidden cursor-pointer transition-all group ${
                        hoveredCCTVId === item.id ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0a0e14] scale-105' : ''
                      }`}
                    >
                      <div className="relative w-full bg-black overflow-hidden" style={{ paddingTop: '56.25%' }}>
                        <ListVideo src={item.thumbnailUrl} posterUrl={item.posterUrl} isPaused={!shouldPlayListVideo} />
                        {isCapturingCctvId === item.id && (
                          <div className="absolute inset-0 pointer-events-none z-20">
                            <div className="absolute inset-0 bg-white animate-capture-flash" />
                            <div className="absolute inset-0 border-4 border-blue-500 animate-capture-frame" />
                            <div className="absolute inset-0 flex items-center justify-center animate-capture-check">
                              <div className="bg-blue-500 rounded-full p-2">
                                <Icon icon="mdi:check" className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out bg-black/70 px-2 py-1">
                          <div className="text-[10px] text-gray-200 truncate" title={item.location}>
                            {item.location}
                          </div>
                        </div>
                      </div>
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CCTV 상세 팝업 */}
      <PredictedCCTVDetailPopup
        isOpen={selectedCCTV !== null}
        onClose={() => setSelectedCCTV(null)}
        cctv={selectedCCTV}
        showFeaturedLayout={showFeaturedLayout}
        onAddCapture={onAddCapture}
      />

      {/* 날아가는 썸네일 애니메이션 (전파 초안 요청 시) */}
      {flyingThumbnail &&
        createPortal(
          <div
            className="fixed pointer-events-none z-[10001]"
            style={{
              left: `${flyingThumbnail.startX}px`,
              top: `${flyingThumbnail.startY}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <img
              src={flyingThumbnail.imageData}
              alt="캡처 썸네일"
              className="w-32 h-20 object-cover rounded-lg shadow-2xl"
              style={{
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)',
                animation: 'fly-to-menu-dynamic 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
                ['--end-x' as string]: `${flyingThumbnail.endX - flyingThumbnail.startX}px`,
                ['--end-y' as string]: `${flyingThumbnail.endY - flyingThumbnail.startY}px`,
              }}
            />
          </div>,
          document.body
        )}
    </>
  );
};

export default PredictedCCTVListPanel;
