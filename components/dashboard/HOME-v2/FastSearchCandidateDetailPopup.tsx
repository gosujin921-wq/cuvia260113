import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getRandomCCTVVideo } from '@/lib/cctv-video-utils';
import {
  getCandidateDetailData,
  addMinutesToTime,
  type TimelineEntry,
} from '@/lib/fast-search-candidate-detail';
import { getImageIdFromCaptureItem } from '@/lib/fast-search-image-attributes';

export interface CandidateCard {
  id: string;
  cctvId: string;
  cctvName: string;
  timestamp: string;
  confidence: number;
  location: string;
}

interface FastSearchCandidateDetailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateCard | null;
  onAnalyze?: (candidate: CandidateCard) => void;
  onShowOnMap?: (candidate: CandidateCard) => void;
}

const FastSearchCandidateDetailPopup: React.FC<FastSearchCandidateDetailPopupProps> = ({
  isOpen,
  onClose,
  candidate,
  onAnalyze,
  onShowOnMap,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [metaOpen, setMetaOpen] = useState(false);
  const playCountRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // ========== 초록색 박스 관련 (프레임 추적용) - px 단위 사용 ==========
  const [greenBoxPosition, setGreenBoxPosition] = useState({ x: 100, y: 100 });
  const [greenBoxSize, setGreenBoxSize] = useState({ width: 80, height: 80 });
  const [showGreenBox, setShowGreenBox] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(true);
  
  const moveGreenBox = (direction: 'up' | 'down' | 'left' | 'right') => {
    setIsAutoMode(false);
    const step = 10;
    setGreenBoxPosition(prev => {
      switch (direction) {
        case 'up': return { ...prev, y: prev.y - step };
        case 'down': return { ...prev, y: prev.y + step };
        case 'left': return { ...prev, x: prev.x - step };
        case 'right': return { ...prev, x: prev.x + step };
        default: return prev;
      }
    });
  };
  
  const resizeGreenBox = (type: 'width' | 'height', delta: number) => {
    setIsAutoMode(false);
    setGreenBoxSize(prev => {
      const newSize = { ...prev };
      if (type === 'width') {
        newSize.width = Math.max(10, prev.width + delta);
      } else {
        newSize.height = Math.max(10, prev.height + delta);
      }
      return newSize;
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!candidate) return;
    playCountRef.current = 0;
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);
    setPlaybackRate(1);
    
    // 59번 이미지일 때만 초록색 박스 활성화
    const imageId = getImageIdFromCaptureItem(candidate);
    if (imageId === '59') {
      setGreenBoxPosition({ x: 436, y: 411 });
      setGreenBoxSize({ width: 80, height: 140 });
      setShowGreenBox(true);
      setIsAutoMode(true);
    } else {
      setShowGreenBox(false);
      setIsAutoMode(false);
    }
    
    setTimeout(() => {
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        const event = new Event('timeupdate');
        video.dispatchEvent(event);
      }
    }, 100);
  }, [candidate?.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isOpen) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsPlaying(!video.paused);
    };

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(video.currentTime);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };
    
    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleLoadedData = () => {
      setIsPlaying(!video.paused);
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isOpen, candidate?.id, isDragging]);

  // 초록색 박스 자동 애니메이션 (59번 전용)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // 59번 이미지가 아니면 실행하지 않음
    const imageId = candidate ? getImageIdFromCaptureItem(candidate) : '';
    if (imageId !== '59') return;

    // 59번 시간별 위치 데이터 (px 단위)
    const timeBasedData = [
      { time: 0, x: 436, y: 411, width: 80, height: 140 },
      { time: 0.4, x: 446, y: 321, width: 80, height: 140 },
      { time: 0.5, x: 444, y: 313, width: 80, height: 140 },
      { time: 0.57, x: 416, y: 341, width: 80, height: 140 },
      { time: 0.6, x: 446, y: 321, width: 80, height: 140 },
      { time: 0.99, x: 446, y: 321, width: 80, height: 140 },
      { time: 1, x: 486, y: 251, width: 80, height: 140 },
      { time: 1.05, x: 474, y: 275, width: 80, height: 140 },
      { time: 1.12, x: 457, y: 302, width: 80, height: 140 },
      { time: 1.5, x: 494, y: 256, width: 80, height: 140 },
      { time: 2, x: 491, y: 237, width: 77, height: 134 },
      { time: 3, x: 515, y: 201, width: 70, height: 120 },
      { time: 4, x: 516, y: 171, width: 70, height: 120 },
      { time: 6, x: 496, y: 141, width: 50, height: 90 },
      { time: 8, x: 466, y: 101, width: 50, height: 90 },
      { time: 10, x: 457, y: 94, width: 50, height: 90 },
      { time: 11, x: 463, y: 108, width: 50, height: 90 },
      { time: 12, x: 475, y: 110, width: 50, height: 90 },
      { time: 12.41, x: 470, y: 105, width: 50, height: 90 },
      { time: 13, x: 486, y: 121, width: 50, height: 90 },
      { time: 13.36, x: 483, y: 125, width: 50, height: 90 },
      { time: 13.57, x: 480, y: 126, width: 50, height: 90 },
      { time: 14.22, x: 487, y: 134, width: 50, height: 90 },
      { time: 15.36, x: 503, y: 164, width: 50, height: 100 },
      { time: 15.71, x: 510, y: 168, width: 50, height: 90 },
      { time: 16, x: 536, y: 191, width: 60, height: 100 },
      { time: 18, x: 616, y: 211, width: 60, height: 100 },
      { time: 19, x: 636, y: 181, width: 60, height: 100 },
      { time: 20, x: 636, y: 181, width: 50, height: 90 },
      { time: 22, x: 616, y: 171, width: 50, height: 80 },
      // 22초~48.99초: 박스 사라짐
      { time: 49, x: 616, y: 191, width: 60, height: 90 },
      { time: 50, x: 586, y: 181, width: 60, height: 100 },
      { time: 60, x: 566, y: 181, width: 60, height: 100 },
      { time: 70, x: 566, y: 181, width: 60, height: 100 },
      { time: 79, x: 572, y: 188, width: 60, height: 100 },
      { time: 80, x: 586, y: 195, width: 60, height: 100 },
      { time: 81, x: 606, y: 205, width: 60, height: 100 },
      { time: 83, x: 676, y: 245, width: 60, height: 100 },
      { time: 86, x: 663, y: 235, width: 60, height: 100 },
      { time: 87, x: 643, y: 225, width: 60, height: 100 },
      { time: 90, x: 656, y: 321, width: 60, height: 100 },
      { time: 91, x: 653, y: 225, width: 60, height: 100 },
      { time: 93, x: 653, y: 235, width: 70, height: 100 },
      { time: 94, x: 673, y: 245, width: 70, height: 100 },
      { time: 95, x: 693, y: 245, width: 70, height: 100 },
      { time: 97, x: 713, y: 265, width: 70, height: 100 },
      { time: 98, x: 733, y: 265, width: 70, height: 100 },
    ];

    const handleVideoTimeUpdate = () => {
      if (!isAutoMode) return;
      
      const currentTime = video.currentTime;
      
      // 22~49초 사이는 박스 숨김
      if (currentTime > 22 && currentTime < 49) {
        setShowGreenBox(false);
        return;
      }
      
      let prevData = timeBasedData[0];
      let nextData = timeBasedData[timeBasedData.length - 1];
      
      for (let i = 0; i < timeBasedData.length - 1; i++) {
        if (currentTime >= timeBasedData[i].time && currentTime <= timeBasedData[i + 1].time) {
          prevData = timeBasedData[i];
          nextData = timeBasedData[i + 1];
          break;
        }
      }
      
      if (currentTime >= timeBasedData[0].time) {
        setShowGreenBox(true);
        
        // 마지막 키프레임 이후에는 마지막 위치 유지
        if (currentTime >= timeBasedData[timeBasedData.length - 1].time) {
          const lastData = timeBasedData[timeBasedData.length - 1];
          setGreenBoxPosition({ x: lastData.x, y: lastData.y });
          setGreenBoxSize({ width: lastData.width, height: lastData.height });
        } else {
          // 현재 시간 사이의 두 키프레임 찾기
          let prevData = timeBasedData[0];
          let nextData = timeBasedData[1];
          
          for (let i = 0; i < timeBasedData.length - 1; i++) {
            if (currentTime >= timeBasedData[i].time && currentTime < timeBasedData[i + 1].time) {
              prevData = timeBasedData[i];
              nextData = timeBasedData[i + 1];
              break;
            }
          }
          
          // 두 키프레임 사이 보간
          const timeDiff = nextData.time - prevData.time;
          const progress = timeDiff > 0 ? (currentTime - prevData.time) / timeDiff : 0;
          
          const interpolatedX = prevData.x + (nextData.x - prevData.x) * progress;
          const interpolatedY = prevData.y + (nextData.y - prevData.y) * progress;
          const interpolatedWidth = prevData.width + (nextData.width - prevData.width) * progress;
          const interpolatedHeight = prevData.height + (nextData.height - prevData.height) * progress;
          
          setGreenBoxPosition({ 
            x: Math.round(interpolatedX), 
            y: Math.round(interpolatedY) 
          });
          setGreenBoxSize({ 
            width: Math.round(interpolatedWidth), 
            height: Math.round(interpolatedHeight) 
          });
        }
      } else {
        setShowGreenBox(false);
      }
    };

    if (isAutoMode) {
      handleVideoTimeUpdate();
    }
    
    video.addEventListener('timeupdate', handleVideoTimeUpdate);
    
    return () => {
      video.removeEventListener('timeupdate', handleVideoTimeUpdate);
    };
  }, [isAutoMode, candidate?.id]);

  const handleTimelineClick = useCallback((entry: TimelineEntry) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = entry.seconds;
    v.play().catch(() => {});
  }, []);

  const togglePlayPause = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    const video = videoRef.current;
    if (!video || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    video.currentTime = percentage * duration;
  }, [duration]);

  const handleProgressMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsDragging(true);
    
    const video = videoRef.current;
    if (!video || !duration) return;
    
    const updateTime = (clientX: number) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      video.currentTime = percentage * duration;
      setCurrentTime(video.currentTime);
    };
    
    updateTime(e.clientX);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      updateTime(moveEvent.clientX);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [duration]);

  const skipBackward = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime - 10);
  }, []);

  const skipForward = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(video.duration, video.currentTime + 10);
  }, []);

  const changePlaybackRate = useCallback((rate: number, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
  }, []);

  const toggleFullscreen = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen || !candidate) return null;

  const imageId = getImageIdFromCaptureItem(candidate);
  const detail = getCandidateDetailData(imageId, {
    cameraId: candidate.cctvId,
    score: candidate.confidence,
  });
  const timeEnd = addMinutesToTime(candidate.timestamp, 6);
  const timeRange = `${candidate.timestamp} ~ ${timeEnd}`;
  
  let videoSrc = getRandomCCTVVideo(candidate.cctvId);
  if (imageId === '48') {
    videoSrc = '/fastsearch_img/qs_img_48_n.mov';
  } else if (imageId === '57') {
    videoSrc = '/fastsearch_img/qs_img_57_y.mov';
  } else if (imageId === '59') {
    videoSrc = '/fastsearch_img/qs_img_59_y.mp4';
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] px-6"
      role="dialog"
      aria-modal="true"
      aria-label="고속검색 후보 상세"
      onClick={handleOverlayClick}
    >
      <div
        className="gradient-border-right-bottom w-full max-w-3xl flex flex-col rounded-lg shadow-lg overflow-hidden"
        style={{
          maxHeight: '90vh',
          height: '90vh',
          background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(23,23,23,0.95) 100%)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderWidth: '1px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 - 고정 */}
        <div className="flex items-center justify-between gap-3 p-5 flex-shrink-0 border-b border-[#31353a]/50">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              }}
            >
              <Icon icon="mdi:cctv" className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-base">{candidate.cctvId}</span>
                <span 
                  className="px-2 py-0.5 rounded text-xs font-semibold text-white"
                  style={{
                    background: candidate.confidence >= 80 
                      ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                      : candidate.confidence >= 60
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  }}
                >
                  {candidate.confidence}%
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Icon icon="mdi:map-marker" className="w-3 h-3" />
                <span className="truncate">{candidate.location}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors focus:outline-none flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#31353a]/50"
            aria-label="닫기"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        {/* 영상 영역 - 고정 (스크롤 안 됨) */}
        <div className="flex-shrink-0 p-5 border-b border-[#31353a]/50">
            <div 
              ref={containerRef}
              className="w-full bg-[#0f0f0f] border border-[#31353a] rounded-md overflow-hidden relative" 
              style={{ aspectRatio: '16/9' }}
            >
              <video
                ref={videoRef}
                src={videoSrc}
                className="w-full h-full object-contain"
                muted
                playsInline
                autoPlay
                aria-label="캡처 구간 클립"
                onEnded={() => {
                  const v = videoRef.current;
                  if (!v) return;
                  playCountRef.current += 1;
                  if (playCountRef.current < 2) {
                    v.currentTime = 0;
                    v.play().catch(() => {});
                  }
                }}
              />
              
              {/* 초록색 박스 오버레이 */}
              {showGreenBox && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${greenBoxPosition.x}px`,
                    top: `${greenBoxPosition.y}px`,
                    width: `${greenBoxSize.width}px`,
                    height: `${greenBoxSize.height}px`,
                    backgroundColor: 'transparent',
                    border: '3px solid #22c55e',
                    borderRadius: '4px',
                    zIndex: 5,
                    transition: 'all 0.1s ease-out',
                  }}
                  aria-hidden="true"
                />
              )}
              
              {/* 비디오 컨트롤 오버레이 */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 10 }}
              >
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* 프로그레스 바 */}
                  <div 
                    className="w-full h-1 bg-gray-600 rounded-full cursor-pointer mb-3 relative"
                    onClick={handleProgressClick}
                    onMouseDown={handleProgressMouseDown}
                  >
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                  
                  {/* 컨트롤 버튼들 */}
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      {/* 재생/일시정지 */}
                      <button
                        type="button"
                        onClick={togglePlayPause}
                        className="hover:text-blue-400 transition-colors"
                        aria-label={isPlaying ? '일시정지' : '재생'}
                      >
                        <Icon icon={isPlaying ? 'mdi:pause' : 'mdi:play'} className="w-6 h-6" />
                      </button>
                      
                      {/* 10초 뒤로 */}
                      <button
                        type="button"
                        onClick={skipBackward}
                        className="hover:text-blue-400 transition-colors"
                        aria-label="10초 뒤로"
                      >
                        <Icon icon="mdi:rewind-10" className="w-5 h-5" />
                      </button>
                      
                      {/* 10초 앞으로 */}
                      <button
                        type="button"
                        onClick={skipForward}
                        className="hover:text-blue-400 transition-colors"
                        aria-label="10초 앞으로"
                      >
                        <Icon icon="mdi:fast-forward-10" className="w-5 h-5" />
                      </button>
                      
                      {/* 시간 표시 */}
                      <span className="text-sm">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* 재생 속도 */}
                      <div className="flex items-center gap-1">
                        {[0.5, 1, 1.5, 2].map(rate => (
                          <button
                            key={rate}
                            type="button"
                            onClick={(e) => changePlaybackRate(rate, e)}
                            className={`text-xs px-2 py-1 rounded transition-colors ${
                              playbackRate === rate 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                      
                      {/* 전체화면 */}
                      <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="hover:text-blue-400 transition-colors"
                        aria-label={isFullscreen ? '전체화면 해제' : '전체화면'}
                      >
                        <Icon icon={isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'} className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>

        {/* 정보 영역 - 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto min-h-0 px-5 pb-5" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#31353a #0f0f0f',
        }}>
          <div className="space-y-4 pt-4">
            {/* 시간 범위 카드 */}
            <div className="bg-[#0f0f0f]/50 border border-[#31353a]/50 rounded-xl p-4 backdrop-blur">
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="mdi:clock-outline" className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">시간 범위</h3>
              </div>
              <p className="text-sm text-white font-medium">{timeRange}</p>
            </div>

            {/* 관찰 요약 */}
            <div className="bg-[#0f0f0f]/50 border border-[#31353a]/50 rounded-xl p-4 backdrop-blur">
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="mdi:eye-outline" className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">관찰 요약</h3>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{detail.observationSummary}</p>
            </div>

            {/* 타임라인 */}
            <div className="bg-[#0f0f0f]/50 border border-[#31353a]/50 rounded-xl p-4 backdrop-blur">
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="mdi:timeline-text-outline" className="w-4 h-4 text-green-400" />
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">시간 기반 관찰 기록</h3>
              </div>
              <ul className="space-y-1.5">
                {detail.timeline.map((entry, idx) => (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => handleTimelineClick(entry)}
                      className="w-full text-left flex items-center gap-3 text-sm text-gray-300 hover:text-white hover:bg-[#1a1a1a]/50 rounded-lg px-3 py-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 group"
                    >
                      <span className="text-blue-400 font-mono text-xs shrink-0 bg-[#1a1a1a] px-2 py-1 rounded group-hover:bg-blue-500/20 transition-colors">
                        {entry.time}
                      </span>
                      <span className="flex-1">{entry.label}</span>
                      <Icon icon="mdi:play-circle-outline" className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* 후보 메타정보 (접힘) */}
            <div className="bg-[#0f0f0f]/50 border border-[#31353a]/50 rounded-xl overflow-hidden backdrop-blur">
              <button
                type="button"
                onClick={() => setMetaOpen((o) => !o)}
                className="w-full flex items-center justify-between text-left p-4 text-gray-300 hover:bg-[#1a1a1a]/50 transition-colors focus:outline-none"
                aria-expanded={metaOpen}
                aria-controls="candidate-meta"
              >
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:information-outline" className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">후보 메타정보</span>
                </div>
                <Icon 
                  icon={metaOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'} 
                  className="w-5 h-5 text-gray-500 transition-transform" 
                  aria-hidden 
                />
              </button>
              <div id="candidate-meta" className="overflow-hidden" hidden={!metaOpen}>
                {metaOpen && (
                  <div className="px-4 pb-4 space-y-3 text-sm">
                    {[
                      { icon: 'mdi:cctv', label: '카메라 ID', value: detail.meta.cameraId },
                      { icon: 'mdi:account-outline', label: '감지 객체', value: detail.meta.detectedObject },
                      { icon: 'mdi:palette-outline', label: '주요 속성', value: detail.meta.mainAttributes },
                      { icon: 'mdi:walk', label: '행동 특징', value: detail.meta.behavior },
                      { icon: 'mdi:arrow-right-bold', label: '이탈 방향', value: detail.meta.exitDirection },
                      { icon: 'mdi:star-outline', label: '후보 점수', value: `${detail.meta.score}/100` },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#1a1a1a]/30 transition-colors">
                        <Icon icon={item.icon} className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 mb-0.5">{item.label}</div>
                          <div className="text-gray-300">{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 - 고정 */}
        <div className="flex flex-wrap items-center justify-end gap-2 p-5 flex-shrink-0 border-t border-[#31353a]/50 bg-[#0a0a0a]/50 backdrop-blur">
          <button
            type="button"
            onClick={() => {
              onAnalyze?.(candidate);
              onClose();
            }}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-400/50 flex items-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            }}
            aria-label="이 후보 분석하기"
          >
            <Icon icon="mdi:chart-line" className="w-4 h-4" />
            이 후보 분석하기
          </button>
          <button
            type="button"
            onClick={() => {
              onShowOnMap?.(candidate);
              onClose();
            }}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#31353a] hover:border-[#3d4046] transition-all focus:outline-none focus:ring-2 focus:ring-gray-400/50 flex items-center gap-2"
            aria-label="지도에서 위치 보기"
          >
            <Icon icon="mdi:map-marker" className="w-4 h-4" />
            지도에서 위치 보기
          </button>
        </div>
      </div>
    </div>
  );
};

export default FastSearchCandidateDetailPopup;
