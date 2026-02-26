import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
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

export interface ThumbnailItem {
  id: string;
  thumbnailUrl: string;
  videoUrl?: string;
}

interface TargetCapturePopupProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateCard | null;
  onAddCapture?: (cctvName: string, location: string, confidence: number, thumbnailUrl: string, analysisResult?: string, videoUrl?: string, options?: { hideOverlayWithPopup?: boolean }) => void;
  /** 관찰요약 아래 썸네일 리스트용 아이템 (미지정 시 후보 이미지로 기본 목록 생성) */
  thumbnailItems?: ThumbnailItem[];
  /** 영상 경로 오버라이드 (사건 영상 바로 보기 등) */
  videoUrlOverride?: string;
  /** 관찰 요약 오버라이드 (사건 영상 바로 보기용) */
  observationSummaryOverride?: string;
  /** 시간 기반 관찰 기록 오버라이드 (사건 영상 바로 보기용) */
  timelineOverride?: Array<{ time: string; label: string; remarks?: string; seconds: number; endSeconds?: number }>;
  /** 후보 메타 정보 오버라이드 - 인물/차량별 상세 (사건 영상 바로 보기용) */
  metaDetailOverride?: Array<{
    title: string;
    detectedObject: string;
    mainAttributes: string;
    behavior: string;
    exitDirection: string;
    icon?: string;
  }>;
}

const TargetCapturePopup: React.FC<TargetCapturePopupProps> = ({
  isOpen,
  onClose,
  candidate,
  onAddCapture,
  thumbnailItems: thumbnailItemsProp,
  videoUrlOverride,
  observationSummaryOverride,
  timelineOverride,
  metaDetailOverride,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [metaOpen, setMetaOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'detail'>('timeline');
  const playCountRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentThumbnailIndex, setCurrentThumbnailIndex] = useState(0);

  // ========== 초록색 박스 관련 (프레임 추적용) - 1920x1080 기준 좌표 ==========
  const ORIGINAL_VIDEO_WIDTH = 1920;
  const ORIGINAL_VIDEO_HEIGHT = 1080;

  const [greenBoxPosition, setGreenBoxPosition] = useState({ x: 100, y: 100 });
  const [greenBoxSize, setGreenBoxSize] = useState({ width: 80, height: 80 });
  const [showGreenBox, setShowGreenBox] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [isSimilarityOpen, setIsSimilarityOpen] = useState(false);
  const [isCaptureAnimating, setIsCaptureAnimating] = useState(false);
  const [flyingThumbnail, setFlyingThumbnail] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    imageData: string;
  } | null>(null);

  // 썸네일 리스트: 전달된 값 또는 후보 기준 기본 목록
  const thumbnailList = useMemo<ThumbnailItem[]>(() => {
    if (thumbnailItemsProp && thumbnailItemsProp.length > 0) {
      return thumbnailItemsProp;
    }
    if (!candidate) return [];
    const thumb = getPathForCaptureItem(candidate);
    const vid = getVideoPathForImageId(getImageIdFromCaptureItem(candidate));
    return Array.from({ length: 5 }, (_, i) => ({
      id: `${candidate.id}-thumb-${i}`,
      thumbnailUrl: thumb,
      videoUrl: vid,
    }));
  }, [candidate, thumbnailItemsProp]);

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
    setCurrentThumbnailIndex(0);

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

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadedData = () => setIsPlaying(!video.paused);
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !candidate) return;

    const imageId = getImageIdFromCaptureItem(candidate);
    if (imageId !== '59') return;

    const timeBasedData = [
      { time: 0, x: 1190, y: 1097.5, width: 210, height: 350 },
      { time: 1, x: 1315, y: 697.5, width: 210, height: 350 },
      { time: 6, x: 1340, y: 372.5, width: 135, height: 225 },
      { time: 22, x: 1640, y: 497.5, width: 135, height: 200 },
      { time: 49, x: 1640, y: 547.5, width: 160, height: 225 },
      { time: 98, x: 1932.5, y: 732.5, width: 185, height: 250 },
    ];

    const handleVideoTimeUpdate = () => {
      if (!isAutoMode) return;
      const t = video.currentTime;
      if (t > 22 && t < 49) {
        setShowGreenBox(false);
        return;
      }
      let prevData = timeBasedData[0];
      let nextData = timeBasedData[timeBasedData.length - 1];
      for (let i = 0; i < timeBasedData.length - 1; i++) {
        if (t >= timeBasedData[i].time && t <= timeBasedData[i + 1].time) {
          prevData = timeBasedData[i];
          nextData = timeBasedData[i + 1];
          break;
        }
      }
      if (t >= timeBasedData[0].time) {
        setShowGreenBox(true);
        if (t >= timeBasedData[timeBasedData.length - 1].time) {
          const last = timeBasedData[timeBasedData.length - 1];
          setGreenBoxPosition({ x: last.x, y: last.y });
          setGreenBoxSize({ width: last.width, height: last.height });
        } else {
          const diff = nextData.time - prevData.time;
          const progress = diff > 0 ? (t - prevData.time) / diff : 0;
          setGreenBoxPosition({
            x: Math.round(prevData.x + (nextData.x - prevData.x) * progress),
            y: Math.round(prevData.y + (nextData.y - prevData.y) * progress),
          });
          setGreenBoxSize({
            width: Math.round(prevData.width + (nextData.width - prevData.width) * progress),
            height: Math.round(prevData.height + (nextData.height - prevData.height) * progress),
          });
        }
      } else {
        setShowGreenBox(false);
      }
    };

    if (isAutoMode) handleVideoTimeUpdate();
    video.addEventListener('timeupdate', handleVideoTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleVideoTimeUpdate);
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
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    video.currentTime = Math.max(0, Math.min(1, x / rect.width)) * duration;
  }, [duration]);

  const handleProgressMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsDragging(true);
    const video = videoRef.current;
    if (!video || !duration) return;
    const updateTime = (clientX: number) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      video.currentTime = pct * duration;
      setCurrentTime(video.currentTime);
    };
    updateTime(e.clientX);
    const onMove = (ev: MouseEvent) => updateTime(ev.clientX);
    const onUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [duration]);

  const skipBackward = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const video = videoRef.current;
    if (video) video.currentTime = Math.max(0, video.currentTime - 10);
  }, []);

  const skipForward = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const video = videoRef.current;
    if (video) video.currentTime = Math.min(video.duration, video.currentTime + 10);
  }, []);

  const changePlaybackRate = useCallback((rate: number, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const video = videoRef.current;
    if (video) {
      video.playbackRate = rate;
      setPlaybackRate(rate);
    }
  }, []);

  const toggleFullscreen = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) container.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
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
    const captureMenuButton = document.querySelector('[aria-label="포착목록"]');
    let endX = 40;
    let endY = 250;
    if (captureMenuButton) {
      const menuRect = captureMenuButton.getBoundingClientRect();
      endX = menuRect.left + menuRect.width / 2;
      endY = menuRect.top + menuRect.height / 2;
    }

    setFlyingThumbnail({
      startX: rect.left + rect.width / 2,
      startY: rect.top + rect.height / 2,
      endX,
      endY,
      imageData,
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

  if (!isOpen || !candidate) return null;

  const imageId = getImageIdFromCaptureItem(candidate);
  const detail = getCandidateDetailData(imageId, {
    cameraId: candidate.cctvId,
    score: candidate.confidence,
  });
  const displayTimeline = videoUrlOverride && timelineOverride ? timelineOverride : detail.timeline;
  const timeEnd = addMinutesToTime(candidate.timestamp, 6);
  const timeRange = `${candidate.timestamp} ~ ${timeEnd}`;

  const videoPath = getVideoPathForImageId(imageId);
  const currentThumb = thumbnailList[currentThumbnailIndex];
  const videoSrc =
    videoUrlOverride ??
    (currentThumb?.videoUrl ?? videoPath ?? getRandomCCTVVideo(candidate.cctvId));

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
        aria-label="대상포착팝업"
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
          {/* 헤더 */}
          <div className="flex flex-wrap items-start justify-between gap-3 p-4 flex-shrink-0 border-b border-[#31353a]">
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-white font-semibold text-sm">대상포착팝업</span>
                <span className="text-gray-400 text-sm">·</span>
                <span className="text-gray-300 text-sm truncate">{candidate.cctvId} · {candidate.location}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className="text-gray-400">시간 범위</span>
                <span className="text-gray-300">{timeRange}</span>
                <span className="text-gray-500">|</span>
                <span className="text-gray-400">유사도</span>
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

          {/* 2컬럼 레이아웃 */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* 좌측: 영상 + 관찰요약 + 썸네일 리스트 */}
            <div className="flex-shrink-0 p-4 border-r border-[#31353a]/50 flex flex-col gap-3" style={{ width: '65%' }}>
              <div
                ref={containerRef}
                className="bg-[#0f0f0f] border border-[#31353a] rounded-md overflow-hidden relative"
                style={{ aspectRatio: '16/9', width: '100%', maxHeight: '100%' }}
              >
                <SharedVideoPlayer
                  src={videoSrc}
                  videoRef={videoRef}
                  ariaLabel="캡처 구간 클립"
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

                {showGreenBox && (() => {
                  const video = videoRef.current;
                  if (!video) return null;
                  const cw = video.clientWidth;
                  const ch = video.clientHeight;
                  if (!cw || !ch) return null;
                  const scaleX = cw / ORIGINAL_VIDEO_WIDTH;
                  const scaleY = ch / ORIGINAL_VIDEO_HEIGHT;
                  return (
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: greenBoxPosition.x * scaleX,
                        top: greenBoxPosition.y * scaleY,
                        width: greenBoxSize.width * scaleX,
                        height: greenBoxSize.height * scaleY,
                        border: '3px solid #22c55e',
                        borderRadius: '4px',
                        zIndex: 5,
                      }}
                      aria-hidden="true"
                    >
                      <div
                        className="absolute px-3 py-1 text-xs font-semibold text-white bg-green-500/70 rounded-full"
                        style={{ top: -28, left: 0 }}
                      >
                        {greenBoxSize.width * scaleX < 100 ? '95%' : '유사도 95%'}
                      </div>
                    </div>
                  );
                })()}

                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      className="w-full h-1 bg-gray-600 rounded-full cursor-pointer mb-3"
                      onClick={handleProgressClick}
                      onMouseDown={handleProgressMouseDown}
                    >
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={togglePlayPause} className="hover:text-blue-400" aria-label={isPlaying ? '일시정지' : '재생'}>
                          <Icon icon={isPlaying ? 'mdi:pause' : 'mdi:play'} className="w-6 h-6" />
                        </button>
                        <button type="button" onClick={skipBackward} className="hover:text-blue-400" aria-label="10초 뒤로">
                          <Icon icon="mdi:rewind-10" className="w-5 h-5" />
                        </button>
                        <button type="button" onClick={skipForward} className="hover:text-blue-400" aria-label="10초 앞으로">
                          <Icon icon="mdi:fast-forward-10" className="w-5 h-5" />
                        </button>
                        <span className="text-sm">{formatTime(currentTime)} / {formatTime(duration)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {[0.5, 1, 1.5, 2].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={(e) => changePlaybackRate(rate, e)}
                            className={`text-xs px-2 py-1 rounded ${playbackRate === rate ? 'bg-blue-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                          >
                            {rate}x
                          </button>
                        ))}
                        <button type="button" onClick={toggleFullscreen} className="hover:text-blue-400" aria-label={isFullscreen ? '전체화면 해제' : '전체화면'}>
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
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">관찰 요약</h3>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {videoUrlOverride && observationSummaryOverride
                    ? observationSummaryOverride
                    : detail.observationSummary}
                </p>
              </div>

              {/* 썸네일 리스트 - 관찰 요약 아래 (전파패키지 스타일) */}
              <div
                className="flex gap-2 overflow-x-auto flex-shrink-0"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#31353a #0f0f0f' }}
              >
                {thumbnailList.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrentThumbnailIndex(index)}
                    className={`flex-shrink-0 w-24 h-16 rounded border-2 overflow-hidden transition-all ${
                      currentThumbnailIndex === index
                        ? 'border-blue-500 ring-2 ring-blue-500/50'
                        : 'border-[#31353a] hover:border-blue-400'
                    }`}
                  >
                    {item.videoUrl ? (
                      <video
                        src={item.videoUrl}
                        poster={item.thumbnailUrl}
                        className="w-full h-full object-cover pointer-events-none"
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={item.thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 우측: 정보 영역 */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-3 bg-[#0a0a0a]/50 flex-shrink-0">
                <div className="relative bg-[#1a1a1a] rounded-full p-1 flex">
                  <div
                    className="absolute top-1 bottom-1 bg-[#2a2a2a] rounded-full transition-all duration-300 ease-out"
                    style={{
                      left: activeTab === 'timeline' ? '4px' : '50%',
                      right: activeTab === 'timeline' ? '50%' : '4px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setActiveTab('timeline')}
                    className={`relative flex-1 px-4 py-2.5 text-sm font-semibold rounded-full transition-colors duration-300 z-10 ${
                      activeTab === 'timeline' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-400'
                    }`}
                  >
                    시간 기반 관찰 기록
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('detail')}
                    className={`relative flex-1 px-4 py-2.5 text-sm font-semibold rounded-full transition-colors duration-300 z-10 ${
                      activeTab === 'detail' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-400'
                    }`}
                  >
                    후보 메타 정보
                  </button>
                </div>
              </div>

              <div
                className="flex-1 overflow-y-auto min-h-0 p-4"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#31353a #0f0f0f' }}
              >
                {activeTab === 'timeline' && (
                  <ul className="relative">
                    <div className="absolute w-[1px] bg-gray-600" style={{ left: '6px', top: '14px', height: 'calc(100% - 14px - 32px)' }} />
                    {displayTimeline.map((entry, idx) => {
                      const endSec = 'endSeconds' in entry ? (entry as { endSeconds?: number }).endSeconds : undefined;
                      const isActive =
                        currentTime >= entry.seconds &&
                        (endSec != null ? currentTime < endSec : idx === displayTimeline.length - 1 || currentTime < displayTimeline[idx + 1].seconds);
                      return (
                        <li key={idx} className="relative">
                          <button
                            type="button"
                            onClick={() => handleTimelineClick(entry)}
                            className="w-full text-left flex items-start gap-3 hover:bg-[#1a1a1a]/50 rounded-lg py-2 transition-all focus:outline-none group"
                          >
                            <div className="relative flex items-center justify-center flex-shrink-0 mt-[3px]" style={{ width: '13px' }}>
                              <div
                                className={`transition-all z-10 ${isActive ? 'bg-blue-400' : 'bg-[#1a1a1a] border-2 border-gray-600'}`}
                                style={{ width: 13, height: 13, borderRadius: 5 }}
                              />
                            </div>
                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                              <span className={`font-mono text-sm font-semibold ${isActive ? 'text-blue-400' : 'text-gray-500'}`}>{entry.time}</span>
                              <span className="text-sm text-gray-300 group-hover:text-white">{entry.label}</span>
                              {'remarks' in entry && entry.remarks && (
                                <span className="text-xs text-purple-400/90">{entry.remarks}</span>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {activeTab === 'detail' && (
                  <div className="space-y-2.5">
                    {videoUrlOverride && metaDetailOverride && metaDetailOverride.length > 0 ? (
                      metaDetailOverride.map((entity, entityIdx) => (
                        <div key={entityIdx} className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg overflow-hidden hover:bg-[#323232]">
                          <div className="px-3 pt-3 pb-2">
                            <h4 className="text-sm font-semibold text-blue-400">{entity.title}</h4>
                          </div>
                          <div className="px-3 pb-3 space-y-2">
                            <div className="flex items-start gap-3">
                              <Icon icon={entity.icon ?? 'mdi:account-outline'} className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-500 mb-0.5">감지 객체</div>
                                <div className="text-sm text-gray-300">{entity.detectedObject}</div>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Icon icon="mdi:palette-outline" className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-500 mb-0.5">주요 속성</div>
                                <div className="text-sm text-gray-300">{entity.mainAttributes}</div>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Icon icon="mdi:walk" className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-500 mb-0.5">행동 특징</div>
                                <div className="text-sm text-gray-300 leading-relaxed">{entity.behavior}</div>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Icon icon="mdi:arrow-right-bold" className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-500 mb-0.5">이탈 방향</div>
                                <div className="text-sm text-gray-300">{entity.exitDirection}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      [
                        { icon: 'mdi:cctv', label: '카메라 ID', value: detail.meta.cameraId },
                        { icon: 'mdi:account-outline', label: '감지 객체', value: detail.meta.detectedObject },
                        { icon: 'mdi:palette-outline', label: '주요 속성', value: detail.meta.mainAttributes },
                        { icon: 'mdi:walk', label: '행동 특징', value: detail.meta.behavior },
                        { icon: 'mdi:arrow-right-bold', label: '이탈 방향', value: detail.meta.exitDirection },
                      ].map((item, idx) => (
                        <div key={idx} className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-3 hover:bg-[#323232]">
                          <div className="flex items-start gap-3">
                            <Icon icon={item.icon} className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-gray-400 mb-1">{item.label}</div>
                              <div className="text-sm text-white">{item.value}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}

                    {!(videoUrlOverride && metaDetailOverride?.length) && (
                      <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg overflow-hidden hover:bg-[#323232]">
                        <button
                          type="button"
                          onClick={() => setIsSimilarityOpen(!isSimilarityOpen)}
                          className="w-full p-3 flex items-start gap-3 text-left"
                        >
                          <Icon icon="mdi:star-outline" className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-gray-400 mb-1">유사도</div>
                            <div className="text-sm text-white">{detail.meta.score}점</div>
                          </div>
                          <Icon icon={isSimilarityOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'} className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        </button>
                        {isSimilarityOpen && (
                          <>
                            <div className="border-t border-[#3a3a3a]" />
                            <div className="p-3">
                              <div className="bg-[#1a1a1a]/50 rounded overflow-hidden">
                                <div className="grid grid-cols-4 gap-2 bg-[#0f0f0f] p-3 border-b border-[#3a3a3a]">
                                  <div className="text-xs text-gray-400 font-medium">항목</div>
                                  <div className="text-xs text-gray-400 font-medium">실종자 정보</div>
                                  <div className="text-xs text-gray-400 font-medium">포착 인물 정보</div>
                                  <div className="text-xs text-gray-400 font-medium text-center">일치 여부</div>
                                </div>
                                {getSimilarityTableForImageId(imageId).map((item, idx, arr) => (
                                  <div
                                    key={idx}
                                    className={`grid grid-cols-4 gap-2 p-3 ${idx !== arr.length - 1 ? 'border-b border-[#3a3a3a]' : ''}`}
                                  >
                                    <div className="text-sm text-gray-300 font-medium">{item.category}</div>
                                    <div className="text-sm text-gray-400">{item.missing}</div>
                                    <div className="text-sm text-gray-400">{item.captured}</div>
                                    <div className="flex items-center justify-center">
                                      {item.match === 'special' ? (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">특이점</span>
                                      ) : item.match ? (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">일치</span>
                                      ) : (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">불일치</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 flex items-center justify-between mt-3">
                                <span className="text-sm text-blue-300 font-semibold">최종 유사도</span>
                                <span className="text-base text-blue-400 font-bold">{detail.meta.score}점</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end px-4 py-3 flex-shrink-0 border-t border-[#31353a]">
            <button
              type="button"
              onClick={handleCaptureTarget}
              className="px-4 py-2 rounded-lg text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 flex items-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}
              aria-label="대상 포착"
            >
              <Icon icon="mdi:account-check" className="w-3.5 h-3.5" />
              대상 포착
            </button>
          </div>
        </div>
      </div>

      {flyingThumbnail &&
        createPortal(
          <div
            className="fixed pointer-events-none z-[10001]"
            style={{
              left: flyingThumbnail.startX,
              top: flyingThumbnail.startY,
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

export default TargetCapturePopup;
