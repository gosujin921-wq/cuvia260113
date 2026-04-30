import React, { useRef, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { getRandomCCTVVideo } from '@/lib/cctv-video-utils';
import {
  getCandidateDetailData,
  addMinutesToTime,
  generateMarkdownAnalysis,
  getSimilarityTableForImageId,
  type TimelineEntry,
} from '@/lib/fast-search-candidate-detail';
import { getImageIdFromCaptureItem, getPathForCaptureItem, getVideoPathForImageId } from '@/lib/fast-search-image-attributes';
import SharedVideoPlayer from './SharedVideoPlayer';

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
  onAddCapture?: (cctvName: string, location: string, confidence: number, thumbnailUrl: string, analysisResult?: string, videoUrl?: string, options?: { hideOverlayWithPopup?: boolean }) => void;
  autoCapture?: boolean;
}

const FastSearchCandidateDetailPopup: React.FC<FastSearchCandidateDetailPopupProps> = ({
  isOpen,
  onClose,
  candidate,
  onAddCapture,
  autoCapture = false,
}) => {
  const { t, i18n } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'detail'>('timeline');
  const playCountRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // ========== 초록색 박스 관련 (프레임 추적용) - 1920x1080 기준 좌표 ==========
  const ORIGINAL_VIDEO_WIDTH = 1920;
  const ORIGINAL_VIDEO_HEIGHT = 1080;
  
  const [greenBoxPosition, setGreenBoxPosition] = useState({ x: 100, y: 100 });
  const [greenBoxSize, setGreenBoxSize] = useState({ width: 80, height: 80 });
  const [showGreenBox, setShowGreenBox] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [isSimilarityOpen, setIsSimilarityOpen] = useState(false);
  const detailScrollRef = useRef<HTMLDivElement>(null);
  const autoAnimDoneRef = useRef(false);
  const [isCaptureAnimating, setIsCaptureAnimating] = useState(false);
  const [flyingThumbnail, setFlyingThumbnail] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    imageData: string;
  } | null>(null);
  
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
    if (!isOpen || !candidate) return;
    autoAnimDoneRef.current = false;
    setActiveTab('timeline');
    setIsSimilarityOpen(false);

    const timer = setTimeout(() => {
      if (!autoAnimDoneRef.current) {
        setActiveTab('detail');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isOpen, candidate?.id]);

  useEffect(() => {
    if (activeTab !== 'detail' || autoAnimDoneRef.current) return;

    const timer = setTimeout(() => {
      autoAnimDoneRef.current = true;
      setIsSimilarityOpen(true);
      requestAnimationFrame(() => {
        detailScrollRef.current?.scrollTo({
          top: detailScrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [activeTab]);

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
      setGreenBoxPosition({ x: 436, y: 461 });
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

    // 59번 시간별 위치 데이터 (1920x1080 기준 좌표, 사용자 조정 반영: x+100, w+10, y+70)
    const timeBasedData = [
      { time: 0, x: 1190, y: 1097.5, width: 210, height: 350 },
      { time: 0.4, x: 1215, y: 872.5, width: 210, height: 350 },
      { time: 0.5, x: 1210, y: 852.5, width: 210, height: 350 },
      { time: 0.57, x: 1140, y: 922.5, width: 210, height: 350 },
      { time: 0.6, x: 1215, y: 872.5, width: 210, height: 350 },
      { time: 0.99, x: 1215, y: 872.5, width: 210, height: 350 },
      { time: 1, x: 1315, y: 697.5, width: 210, height: 350 },
      { time: 1.05, x: 1285, y: 757.5, width: 210, height: 350 },
      { time: 1.12, x: 1242.5, y: 825, width: 210, height: 350 },
      { time: 1.5, x: 1335, y: 710, width: 210, height: 350 },
      { time: 2, x: 1327.5, y: 662.5, width: 202.5, height: 335 },
      { time: 3, x: 1387.5, y: 572.5, width: 185, height: 300 },
      { time: 4, x: 1390, y: 497.5, width: 185, height: 300 },
      { time: 6, x: 1340, y: 372.5, width: 135, height: 225 },
      { time: 8, x: 1265, y: 272.5, width: 135, height: 225 },
      { time: 10, x: 1242.5, y: 255, width: 135, height: 225 },
      { time: 11, x: 1257.5, y: 290, width: 135, height: 225 },
      { time: 12, x: 1287.5, y: 295, width: 135, height: 225 },
      { time: 12.41, x: 1275, y: 282.5, width: 135, height: 225 },
      { time: 13, x: 1315, y: 322.5, width: 135, height: 225 },
      { time: 13.36, x: 1307.5, y: 332.5, width: 135, height: 225 },
      { time: 13.57, x: 1300, y: 335, width: 135, height: 225 },
      { time: 14.22, x: 1317.5, y: 355, width: 135, height: 225 },
      { time: 15.36, x: 1357.5, y: 430, width: 135, height: 250 },
      { time: 15.71, x: 1375, y: 440, width: 135, height: 225 },
      { time: 16, x: 1440, y: 497.5, width: 160, height: 250 },
      { time: 18, x: 1640, y: 597.5, width: 160, height: 250 },
      { time: 19, x: 1690, y: 522.5, width: 160, height: 250 },
      { time: 20, x: 1690, y: 522.5, width: 135, height: 225 },
      { time: 22, x: 1640, y: 497.5, width: 135, height: 200 },
      // 22초~48.99초: 박스 사라짐
      { time: 49, x: 1640, y: 547.5, width: 160, height: 225 },
      { time: 50, x: 1565, y: 522.5, width: 160, height: 250 },
      { time: 60, x: 1515, y: 522.5, width: 160, height: 250 },
      { time: 70, x: 1515, y: 522.5, width: 160, height: 250 },
      { time: 79, x: 1530, y: 540, width: 160, height: 250 },
      { time: 80, x: 1565, y: 557.5, width: 160, height: 250 },
      { time: 81, x: 1615, y: 582.5, width: 160, height: 250 },
      { time: 83, x: 1790, y: 682.5, width: 160, height: 250 },
      { time: 86, x: 1757.5, y: 657.5, width: 160, height: 250 },
      { time: 87, x: 1707.5, y: 632.5, width: 160, height: 250 },
      { time: 90, x: 1740, y: 872.5, width: 160, height: 250 },
      { time: 91, x: 1732.5, y: 632.5, width: 160, height: 250 },
      { time: 93, x: 1732.5, y: 657.5, width: 185, height: 250 },
      { time: 94, x: 1782.5, y: 682.5, width: 185, height: 250 },
      { time: 95, x: 1832.5, y: 682.5, width: 185, height: 250 },
      { time: 97, x: 1882.5, y: 732.5, width: 185, height: 250 },
      { time: 98, x: 1932.5, y: 732.5, width: 185, height: 250 },
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

  const handleCaptureTarget = () => {
    if (!candidate || !videoRef.current || !containerRef.current) return;
    
    const video = videoRef.current;
    const rect = containerRef.current.getBoundingClientRect();
    
    let imageData: string;
    try {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          imageData = canvas.toDataURL('image/jpeg', 0.8);
        } else {
          imageData = getPathForCaptureItem(candidate);
        }
      } else {
        imageData = getPathForCaptureItem(candidate);
      }
    } catch {
      imageData = getPathForCaptureItem(candidate);
    }
    
    setIsCaptureAnimating(true);
    
    // 포착목록 메뉴 버튼은 LeftMenuPanel에서 id="capture-list-menu" 로 마킹됨.
    // aria-label은 다국어로 바뀔 수 있으므로 id를 우선 사용한다.
    const captureMenuButton = document.getElementById('capture-list-menu');
    let endX = 40;
    let endY = 250;
    if (captureMenuButton) {
      const menuRect = captureMenuButton.getBoundingClientRect();
      endX = menuRect.left + menuRect.width / 2;
      endY = menuRect.top + menuRect.height / 2;
    }
    
    const flyingData = {
      startX: rect.left + rect.width / 2,
      startY: rect.top + rect.height / 2,
      endX,
      endY,
      imageData,
    };
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlyingThumbnail(flyingData);
      });
    });
    
    const imageId = getImageIdFromCaptureItem(candidate);
    const videoUrl = getVideoPathForImageId(imageId);
    const analysisResult = generateMarkdownAnalysis(
      imageId,
      candidate.cctvName,
      candidate.location,
      candidate.timestamp,
      candidate.confidence
    );
    
    setTimeout(() => {
      if (onAddCapture) {
        onAddCapture(candidate.cctvName, candidate.location, candidate.confidence, imageData, analysisResult, videoUrl, { hideOverlayWithPopup: true });
      }
    }, 300);
    
    setTimeout(() => setFlyingThumbnail(null), 600);
    setTimeout(() => {
      setIsCaptureAnimating(false);
      onClose();
    }, 700);
  };

  const handleCaptureTargetRef = useRef(handleCaptureTarget);
  handleCaptureTargetRef.current = handleCaptureTarget;

  const autoCaptureTriggeredRef = useRef(false);
  useEffect(() => {
    if (!autoCapture || !isOpen || !candidate) {
      autoCaptureTriggeredRef.current = false;
      return;
    }
    if (autoCaptureTriggeredRef.current) return;
    autoCaptureTriggeredRef.current = true;

    const timer = setTimeout(() => {
      handleCaptureTargetRef.current();
    }, 300);
    return () => clearTimeout(timer);
  }, [autoCapture, isOpen, candidate]);

  if (!isOpen || !candidate) return null;

  // i18n.language를 클로저에 캡쳐해 언어 전환 시 detail이 재계산되도록 함
  void i18n.language;
  const imageId = getImageIdFromCaptureItem(candidate);
  const detail = getCandidateDetailData(imageId, {
    cameraId: candidate.cctvId,
    score: candidate.confidence,
  });
  const timeEnd = addMinutesToTime(candidate.timestamp, 6);
  const timeRange = `${candidate.timestamp} ~ ${timeEnd}`;
  
  const videoPath = getVideoPathForImageId(imageId);
  const videoSrc = videoPath || getRandomCCTVVideo(candidate.cctvId);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    onClose();
  };

  return (
    <>
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] px-6"
      role="dialog"
      aria-modal="true"
      aria-label={t('candidateDetail.dialogAriaLabel')}
      onClick={handleOverlayClick}
    >
      <div
        className="gradient-border-right-bottom w-full flex flex-col rounded-lg shadow-lg overflow-hidden"
        style={{
          maxWidth: '1100px',
          maxHeight: '75vh',
          height: '75vh',
          background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          borderWidth: '1px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 - 고정 */}
        <div className="flex flex-wrap items-start justify-between gap-3 p-4 flex-shrink-0 border-b border-[#31353a]">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-white font-semibold text-sm">{candidate.cctvId}</span>
              <span className="text-gray-400 text-sm">·</span>
              <span className="text-gray-300 text-sm truncate">{candidate.location}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="text-gray-400">{t('candidateDetail.timeRange')}</span>
              <span className="text-gray-300">{timeRange}</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400">{t('candidateDetail.similarity')}</span>
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
            aria-label={t('common.close')}
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        {/* 2컬럼 레이아웃: 좌측 영상, 우측 정보 */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* 좌측: 영상 + 관찰요약 영역 */}
          <div className="flex-shrink-0 p-4 border-r border-[#31353a]/50 flex flex-col gap-3" style={{ width: '65%' }}>
            <div 
              ref={containerRef}
              className="bg-[#0f0f0f] border border-[#31353a] rounded-md overflow-hidden relative" 
              style={{ aspectRatio: '16/9', width: '100%', maxHeight: '100%' }}
            >
              <SharedVideoPlayer
                src={videoSrc}
                videoRef={videoRef}
                ariaLabel={t('candidateDetail.clipAriaLabel')}
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
              
              {/* 캡처 애니메이션 오버레이 */}
              {isCaptureAnimating && (
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
                  <div className="absolute inset-0 bg-white animate-capture-flash" />
                  <div className="absolute inset-0 border-4 border-blue-500 animate-capture-frame" />
                  <div className="absolute inset-0 flex items-center justify-center animate-capture-check">
                    <div className="bg-blue-500 rounded-full p-4">
                      <Icon icon="mdi:check" className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </div>
              )}
              
              {/* 초록색 박스 오버레이 */}
              {showGreenBox && (() => {
                const video = videoRef.current;
                if (!video) return null;

                const currentWidth = video.clientWidth;
                const currentHeight = video.clientHeight;

                if (!currentWidth || !currentHeight) return null;

                // 스케일 비율 계산 (1920x1080 기준 -> 현재 크기)
                const scaleX = currentWidth / ORIGINAL_VIDEO_WIDTH;
                const scaleY = currentHeight / ORIGINAL_VIDEO_HEIGHT;

                // 좌표 변환
                const scaledX = greenBoxPosition.x * scaleX;
                const scaledY = greenBoxPosition.y * scaleY;
                const scaledWidth = greenBoxSize.width * scaleX;
                const scaledHeight = greenBoxSize.height * scaleY;

                return (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: `${scaledX}px`,
                      top: `${scaledY}px`,
                      width: `${scaledWidth}px`,
                      height: `${scaledHeight}px`,
                      backgroundColor: 'transparent',
                      border: '3px solid #22c55e',
                      borderRadius: '4px',
                      zIndex: 5,
                      transition: 'all 0.1s ease-out',
                    }}
                    aria-hidden="true"
                  >
                    <div
                      className="absolute px-3 py-1 text-xs font-semibold text-white"
                      style={{
                        backgroundColor: 'rgba(34, 197, 94, 0.7)',
                        borderRadius: '999px',
                        top: '-28px',
                        left: '0px',
                      }}
                    >
                      {scaledWidth < 100 ? '95%' : t('candidateDetail.similarityLabel', { percent: 95 })}
                    </div>
                  </div>
                );
              })()}
              
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
                        aria-label={isPlaying ? t('candidateDetail.video.pause') : t('candidateDetail.video.play')}
                      >
                        <Icon icon={isPlaying ? 'mdi:pause' : 'mdi:play'} className="w-6 h-6" />
                      </button>
                      
                      {/* 10초 뒤로 */}
                      <button
                        type="button"
                        onClick={skipBackward}
                        className="hover:text-blue-400 transition-colors"
                        aria-label={t('candidateDetail.video.rewind10')}
                      >
                        <Icon icon="mdi:rewind-10" className="w-5 h-5" />
                      </button>
                      
                      {/* 10초 앞으로 */}
                      <button
                        type="button"
                        onClick={skipForward}
                        className="hover:text-blue-400 transition-colors"
                        aria-label={t('candidateDetail.video.forward10')}
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
                        aria-label={isFullscreen ? t('candidateDetail.video.fullscreenExit') : t('candidateDetail.video.fullscreen')}
                      >
                        <Icon icon={isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'} className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 관찰 요약 - 영상 아래 */}
            <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-3" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="mdi:eye-outline" className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('candidateDetail.observationSummary')}</h3>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{detail.observationSummary}</p>
            </div>
          </div>

          {/* 우측: 정보 영역 - 탭 + 스크롤 가능 */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* 탭 헤더 - 캡슐 안에 캡슐 스타일 */}
            <div className="p-3 bg-[#0a0a0a]/50 flex-shrink-0">
              <div className="relative bg-[#1a1a1a] rounded-full p-1 flex">
                {/* 슬라이딩 배경 - 어두운 그레이 */}
                <div
                  className="absolute top-1 bottom-1 bg-[#2a2a2a] rounded-full transition-all duration-300 ease-out"
                  style={{
                    left: activeTab === 'timeline' ? '4px' : '50%',
                    right: activeTab === 'timeline' ? '50%' : '4px',
                  }}
                />
                
                {/* 탭 버튼들 */}
                <button
                  type="button"
                  onClick={() => setActiveTab('timeline')}
                  className={`relative flex-1 px-4 py-2.5 text-sm font-semibold rounded-full transition-colors duration-300 z-10 ${
                    activeTab === 'timeline'
                      ? 'text-blue-400'
                      : 'text-gray-500 hover:text-gray-400'
                  }`}
                >
                  {t('candidateDetail.tab.timeline')}
                </button>
                <button
                  id="detail-tab-button"
                  type="button"
                  onClick={() => setActiveTab('detail')}
                  className={`relative flex-1 px-4 py-2.5 text-sm font-semibold rounded-full transition-colors duration-300 z-10 ${
                    activeTab === 'detail'
                      ? 'text-blue-400'
                      : 'text-gray-500 hover:text-gray-400'
                  }`}
                >
                  {t('candidateDetail.tab.meta')}
                </button>
              </div>
            </div>

            {/* 탭 컨텐츠 */}
            <div ref={detailScrollRef} className="flex-1 overflow-y-auto min-h-0 p-4" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#31353a #0f0f0f',
            }}>
              {activeTab === 'timeline' && (
                <div>
                  {/* 타임라인 - 박스 없이 */}
                  <ul className="relative">
                {/* 전체 세로 연결선 - 첫 원 중심부터 마지막에서 두번째 원 중심까지만 */}
                <div 
                  className="absolute w-[1px] bg-gray-600"
                  style={{ 
                    left: '6px',
                    top: '14px',
                    height: `calc(100% - 14px - 32px)`
                  }}
                />
                
                {detail.timeline.map((entry, idx) => {
                  // 현재 재생 중인 구간인지 확인
                  const isActive = currentTime >= entry.seconds && 
                    (idx === detail.timeline.length - 1 || currentTime < detail.timeline[idx + 1].seconds);
                  
                  return (
                    <li key={idx} className="relative">
                      <button
                        type="button"
                        onClick={() => handleTimelineClick(entry)}
                        className="w-full text-left flex items-start gap-3 hover:bg-[#1a1a1a]/50 rounded-lg py-2 transition-all focus:outline-none group"
                      >
                        {/* 둥근 사각형 인디케이터 */}
                        <div className="relative flex items-center justify-center flex-shrink-0 mt-[3px]" style={{ width: '13px' }}>
                          <div 
                            className={`transition-all z-10 ${
                              isActive 
                                ? 'bg-blue-400' 
                                : 'bg-[#1a1a1a] border-2 border-gray-600'
                            }`}
                            style={{ width: '13px', height: '13px', borderRadius: '5px' }}
                          />
                        </div>
                        
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <span className={`font-mono text-sm font-semibold transition-colors leading-tight ${
                            isActive ? 'text-blue-400' : 'text-gray-500'
                          }`}>
                            {entry.time}
                          </span>
                          <span className="text-sm text-gray-300 group-hover:text-white">
                            {entry.label}
                          </span>
                        </div>
                      </button>
                    </li>
                );
              })}
                  </ul>
                </div>
              )}

              {activeTab === 'detail' && (
                <div className="space-y-2.5">
                  {/* 후보 메타정보 - 카드 형태 */}
                  {[
                    { icon: 'mdi:cctv', label: t('candidateDetail.meta.cameraId'), value: detail.meta.cameraId },
                    { icon: 'mdi:account-outline', label: t('candidateDetail.meta.detectedObject'), value: detail.meta.detectedObject },
                    { icon: 'mdi:palette-outline', label: t('candidateDetail.meta.mainAttributes'), value: detail.meta.mainAttributes },
                    { icon: 'mdi:walk', label: t('candidateDetail.meta.behavior'), value: detail.meta.behavior },
                    { icon: 'mdi:arrow-right-bold', label: t('candidateDetail.meta.exitDirection'), value: detail.meta.exitDirection },
                  ].map((item, idx) => (
                    <div key={idx} id={idx === 0 ? 'candidate-meta-info' : undefined} className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-3 hover:bg-[#323232] transition-colors">
                      <div className="flex items-start gap-3">
                        <Icon icon={item.icon} className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-400 mb-1">{item.label}</div>
                          <div className="text-sm text-white">{item.value}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* 유사도 카드 - 토글 가능 */}
                  <div id="similarity-dropdown" className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg overflow-hidden hover:bg-[#323232] transition-colors">
                    <button
                      type="button"
                      onClick={() => setIsSimilarityOpen(!isSimilarityOpen)}
                      className="w-full p-3 flex items-start gap-3 text-left"
                    >
                      <Icon icon="mdi:star-outline" className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-400 mb-1">{t('candidateDetail.similarity')}</div>
                        <div className="text-sm text-white">{t('predictedCCTV.score', { score: detail.meta.score })}</div>
                      </div>
                      <Icon 
                        icon={isSimilarityOpen ? "mdi:chevron-up" : "mdi:chevron-down"} 
                        className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0 transition-transform" 
                      />
                    </button>
                    
                    {isSimilarityOpen && (
                      <>
                        {/* 디바이더 */}
                        <div className="border-t border-[#3a3a3a]"></div>
                        
                        {/* 후보 근거 - 테이블 형식 */}
                        <div className="p-3">
                          <div className="bg-[#1a1a1a]/50 rounded overflow-hidden">
                            {/* 테이블 헤더 */}
                            <div className="grid grid-cols-4 gap-2 bg-[#0f0f0f] p-3 border-b border-[#3a3a3a]">
                              <div className="text-xs text-gray-400 font-medium">{t('candidateDetail.similarityTable.category')}</div>
                              <div className="text-xs text-gray-400 font-medium">{t('candidateDetail.similarityTable.missing')}</div>
                              <div className="text-xs text-gray-400 font-medium">{t('candidateDetail.similarityTable.captured')}</div>
                              <div className="text-xs text-gray-400 font-medium text-center">{t('candidateDetail.similarityTable.match')}</div>
                            </div>
                            
                            {/* 테이블 바디 */}
                            {getSimilarityTableForImageId(imageId).map((item, idx, arr) => (
                              <div 
                                key={idx} 
                                className={`grid grid-cols-4 gap-2 p-3 ${
                                  idx !== arr.length - 1 ? 'border-b border-[#3a3a3a]' : ''
                                }`}
                              >
                                <div className="text-sm text-gray-300 font-medium">{item.category}</div>
                                <div className="text-sm text-gray-400">{item.missing}</div>
                                <div className="text-sm text-gray-400">{item.captured}</div>
                                <div className="flex items-center justify-center">
                                  {item.match === 'special' ? (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                      {t('candidateDetail.similarityTable.special')}
                                    </span>
                                  ) : item.match ? (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                                      {t('candidateDetail.similarityTable.matched')}
                                    </span>
                                  ) : (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                                      {t('candidateDetail.similarityTable.unmatched')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* 최종 유사도 */}
                          <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 flex items-center justify-between mt-3">
                            <span className="text-sm text-blue-300 font-semibold">{t('candidateDetail.finalSimilarity')}</span>
                            <span className="text-base text-blue-400 font-bold">{t('predictedCCTV.score', { score: detail.meta.score })}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 푸터 - 고정 */}
        <div className="flex items-center justify-end px-4 py-3 flex-shrink-0 border-t border-[#31353a]" style={{ background: 'transparent' }}>
          <button
            id="capture-target-button"
            type="button"
            onClick={handleCaptureTarget}
            className="px-4 py-2 rounded-lg text-xs font-medium text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-400/50 flex items-center gap-1.5"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            }}
            aria-label={t('candidateDetail.captureTarget')}
          >
            <Icon icon="mdi:account-check" className="w-3.5 h-3.5" />
            {t('candidateDetail.captureTarget')}
          </button>
        </div>
      </div>
    </div>
    
    {/* 날아가는 썸네일 애니메이션 */}
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
            alt={t('candidateDetail.captureThumbnailAlt')}
            className="w-32 h-20 object-cover rounded-lg shadow-2xl"
            style={{
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)',
              animation: 'fly-to-menu-dynamic 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
              ['--end-x']: `${flyingThumbnail.endX - flyingThumbnail.startX}px`,
              ['--end-y']: `${flyingThumbnail.endY - flyingThumbnail.startY}px`,
            } as React.CSSProperties}
          />
        </div>,
        document.body
      )}
    </>
  );
};

export default FastSearchCandidateDetailPopup;
