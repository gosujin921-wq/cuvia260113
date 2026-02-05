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
      { time: 50, x: 636, y: 181, width: 60, height: 100 },
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
        className="gradient-border-right-bottom w-full max-w-3xl flex flex-col rounded-lg shadow-lg"
        style={{
          maxHeight: '90vh',
          height: 'auto',
          background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          borderWidth: '1px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 (AIDetectionPopup / SituationSummary와 동일: p-4 border-b, 면 배경 없음) */}
        <div className="flex flex-wrap items-start justify-between gap-3 p-4 flex-shrink-0 border-b border-[#31353a]">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-white font-semibold text-sm">{candidate.cctvId}</span>
              <span className="text-gray-400 text-sm">·</span>
              <span className="text-gray-300 text-sm truncate">{candidate.location}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="text-gray-400">시간 범위</span>
              <span className="text-gray-300">{timeRange}</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400">후보 점수</span>
              <span className="text-white font-semibold">{candidate.confidence}%</span>
              <div
                className="h-2 rounded-full bg-[#0f0f0f] overflow-hidden border border-[#31353a]"
                style={{ width: 100 }}
                role="progressbar"
                aria-valuenow={candidate.confidence}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${candidate.confidence}%` }}
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors focus:outline-none flex-shrink-0"
            aria-label="닫기"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        {/* 컨텐츠 (SituationSummary 동일: overflow-y-auto p-4 space-y-4, 면 배경 없음) */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
          {/* 클립 영상 (AIDetectionPopup / CCTVMesh 동일: p-4 > bg-[#0f0f0f] 면) */}
          <div>
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

          {/* 관찰 요약 (SituationSummary 블록 스타일: bg-[#0f0f0f] 면) */}
          <section className="bg-[#0f0f0f] border border-[#31353a] rounded-xl p-4" style={{ borderWidth: '1px' }}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">관찰 요약</h3>
            <p className="text-sm text-gray-300 leading-relaxed">{detail.observationSummary}</p>
          </section>

          {/* 타임라인 (동일 면 처리) */}
          <section className="bg-[#0f0f0f] border border-[#31353a] rounded-xl p-4" style={{ borderWidth: '1px' }}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">시간 기반 관찰 기록</h3>
            <ul className="space-y-1">
              {detail.timeline.map((entry, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => handleTimelineClick(entry)}
                    className="w-full text-left flex items-baseline gap-2 text-sm text-gray-300 hover:text-white hover:bg-[#1a1a1a] rounded px-2 py-1.5 -mx-2 transition-colors focus:outline-none focus:ring-1 focus:ring-[#31353a] focus:ring-inset"
                  >
                    <span className="text-gray-500 font-mono shrink-0">{entry.time}</span>
                    <span>{entry.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* 접힘: 후보 메타정보 (패널 칩 스타일) */}
          <section>
            <button
              type="button"
              onClick={() => setMetaOpen((o) => !o)}
              className="w-full flex items-center justify-between text-left py-2 px-4 rounded-lg bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a] border border-[#31353a] hover:border-[#3d4046] transition-colors focus:outline-none focus:ring-1 focus:ring-[#31353a] focus:ring-inset"
              aria-expanded={metaOpen}
              aria-controls="candidate-meta"
            >
              <span className="text-sm font-medium">후보 메타정보</span>
              <Icon icon={metaOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'} className="w-5 h-5 text-gray-500" aria-hidden />
            </button>
            <div id="candidate-meta" className="overflow-hidden" hidden={!metaOpen}>
              {metaOpen && (
                <div className="mt-2 p-4 rounded-lg bg-[#1a1a1a] border border-[#31353a] space-y-2 text-sm">
                  <div className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1">
                    <span className="text-gray-500">카메라 ID</span>
                    <span className="text-gray-300">{detail.meta.cameraId}</span>
                    <span className="text-gray-500">감지 객체</span>
                    <span className="text-gray-300">{detail.meta.detectedObject}</span>
                    <span className="text-gray-500">주요 속성</span>
                    <span className="text-gray-300">{detail.meta.mainAttributes}</span>
                    <span className="text-gray-500">행동 특징</span>
                    <span className="text-gray-300">{detail.meta.behavior}</span>
                    <span className="text-gray-500">이탈 방향</span>
                    <span className="text-gray-300">{detail.meta.exitDirection}</span>
                    <span className="text-gray-500">후보 점수</span>
                    <span className="text-gray-300">{detail.meta.score}/100</span>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* 푸터 (AIDetectionPopup 동일: p-4 border-t, 면 배경 없음) */}
        <div className="flex flex-wrap items-center justify-end gap-2 p-4 flex-shrink-0 border-t border-[#31353a]">
          <button
            type="button"
            onClick={() => {
              onAnalyze?.(candidate);
              onClose();
            }}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#0a0e14]"
            aria-label="이 후보 분석하기"
          >
            이 후보 분석하기
          </button>
          <button
            type="button"
            onClick={() => {
              onShowOnMap?.(candidate);
              onClose();
            }}
            className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-[#31353a] hover:bg-[#3d4046] border border-[#31353a] transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-[#0a0e14] flex items-center gap-2"
            aria-label="지도에서 위치 보기"
          >
            <Icon icon="mdi:map-marker" className="w-4 h-4" aria-hidden />
            지도에서 위치 보기
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-[#31353a] hover:bg-[#3d4046] border border-[#31353a] transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-[#0a0e14]"
            aria-label="닫기"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default FastSearchCandidateDetailPopup;
