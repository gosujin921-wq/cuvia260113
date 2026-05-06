import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { getPredictedCCTVDetail } from '@/lib/predicted-cctv-details';

export interface PredictedCCTVItem {
  id: string;
  cctvName: string;
  location: string;
  distance: number;
  predictedTime: string;
  confidence: number;
  direction: string;
  thumbnailUrl: string;
}

interface PredictedCCTVDetailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  cctv: PredictedCCTVItem | null;
  onAddCapture?: (cctvName: string, location: string, confidence: number, capturedImage?: string, analysisResult?: string, videoUrl?: string) => void;
  autoCapture?: boolean;
}

const PredictedCCTVDetailPopup: React.FC<PredictedCCTVDetailPopupProps> = ({
  isOpen,
  onClose,
  cctv,
  onAddCapture,
  autoCapture = false,
}) => {
  const { t, i18n } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentLiveTime, setCurrentLiveTime] = useState(new Date());
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isRouteScoreOpen, setIsRouteScoreOpen] = useState(false);
  const [isCaptureAnimating, setIsCaptureAnimating] = useState(false);
  const [flyingThumbnail, setFlyingThumbnail] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    imageData: string;
  } | null>(null);

  // 현재 시간 업데이트 (라이브)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLiveTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ESC 키로 닫기
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

  // CCTV 변경 시 비디오 초기화 및 비디오 소스 설정
  useEffect(() => {
    if (!cctv) return;
    setVideoSrc(cctv.thumbnailUrl); // 리스트에서 할당된 비디오 사용
    setCurrentTime(0);
    setDuration(0);
  }, [cctv?.id, cctv?.thumbnailUrl]);

  // 팝업 열릴 때 비디오 자동 재생
  useEffect(() => {
    if (!isOpen || !cctv) return;
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isOpen, cctv?.id]);

  // 비디오 이벤트 핸들러
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

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [isOpen, isDragging]);

  // 재생/일시정지 토글
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 진행바 클릭
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    video.currentTime = percentage * video.duration;
  };

  // 전체화면 토글
  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (!document.fullscreenElement) {
      video.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // CaptureListPanel은 이 분석 결과를 본문으로 렌더링하지 않고, 'object-tracking' 마커만 인식해
  // i18n 기반 정적 카드로 대체 렌더링한다. 본문은 마커 외에는 사용되지 않으므로 로깅용 데이터만 채운다.
  const OBJECT_TRACKING_MARKER = 'object-tracking';
  const generateAnalysisMarkdown = (cctvItem: PredictedCCTVItem): string => {
    return [
      `[${OBJECT_TRACKING_MARKER}]`,
      `cctv=${cctvItem.cctvName}`,
      `distance=${cctvItem.distance}`,
      `direction=${cctvItem.direction}`,
      `predictedTime=${cctvItem.predictedTime}`,
      `confidence=${cctvItem.confidence}`,
    ].join('\n');
  };

  const handleCaptureTarget = () => {
    if (!cctv || !videoRef.current || !videoContainerRef.current) return;

    let imageData: string;
    const video = videoRef.current;
    const rect = videoContainerRef.current.getBoundingClientRect();

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
          imageData = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180"%3E%3Crect fill="%231a1a1a" width="320" height="180"/%3E%3C/svg%3E';
        }
      } else {
        imageData = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180"%3E%3Crect fill="%231a1a1a" width="320" height="180"/%3E%3C/svg%3E';
      }
    } catch {
      imageData = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180"%3E%3Crect fill="%231a1a1a" width="320" height="180"/%3E%3C/svg%3E';
    }

    setIsCaptureAnimating(true);

    // 메뉴 버튼은 LeftMenuPanel에서 id="capture-list-menu"로 마킹됨. aria-label은 다국어로 바뀜.
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

    const analysisResult = (cctv.cctvName === 'GATE-WEST-08' || cctv.cctvName === 'GATE-WEST-08-B') ? generateAnalysisMarkdown(cctv) : undefined;

    setTimeout(() => {
      if (onAddCapture) {
        onAddCapture(cctv.cctvName, cctv.location, cctv.confidence, imageData, analysisResult, cctv.thumbnailUrl);
      }
    }, 300);

    setTimeout(() => setFlyingThumbnail(null), 600);
    setTimeout(() => {
      setIsCaptureAnimating(false);
      onClose();
    }, 1000);
  };

  const handleCaptureTargetRef = useRef(handleCaptureTarget);
  handleCaptureTargetRef.current = handleCaptureTarget;

  const autoCaptureTriggeredRef = useRef(false);
  useEffect(() => {
    if (!autoCapture || !isOpen || !cctv) {
      autoCaptureTriggeredRef.current = false;
      return;
    }
    if (autoCaptureTriggeredRef.current) return;
    autoCaptureTriggeredRef.current = true;

    const timer = setTimeout(() => {
      handleCaptureTargetRef.current();
    }, 300);
    return () => clearTimeout(timer);
  }, [autoCapture, isOpen, cctv]);

  if (!isOpen || !cctv) return null;

  // 영문 모드는 24h 포맷, 한국어 모드는 "오전/오후" 포함
  const isENTime = (i18n.resolvedLanguage || i18n.language || 'ko').startsWith('en');
  const liveTimeString = currentLiveTime.toLocaleTimeString(isENTime ? 'en-US' : 'ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: !isENTime,
  });

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
        aria-label={t('predictedCCTVDetail.dialogAriaLabel')}
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
              <div className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-xs text-red-300 font-medium">LIVE</span>
              </div>
              <span className="text-white font-semibold text-sm">{cctv.cctvName}</span>
              <span className="text-gray-400 text-sm">·</span>
              <span className="text-gray-300 text-sm truncate">{cctv.location}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="text-gray-400">{t('predictedCCTVDetail.channel')}</span>
              <span className="text-gray-300">CH-{cctv.id.padStart(3, '0')}</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400">{t('predictedCCTVDetail.routeFit')}</span>
              <span className="text-white font-semibold">{t('predictedCCTV.score', { score: cctv.confidence })}</span>
              <div
                className="h-2 rounded-full bg-[#0f0f0f] overflow-hidden border border-[#31353a]"
                style={{ width: '80px' }}
              >
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${cctv.confidence}%` }}
                />
              </div>
            </div>
          </div>
          <button
            id="predicted-cctv-close-button"
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
          {/* 좌측: 영상 영역 */}
          <div className="flex-shrink-0 p-4 border-r border-[#31353a]/50 flex flex-col gap-3" style={{ width: '65%' }}>
            <div 
              ref={videoContainerRef}
              className="bg-[#0f0f0f] border border-[#31353a] rounded-md overflow-hidden relative" 
              style={{ aspectRatio: '16/9', width: '100%', maxHeight: '100%' }}
            >
              <video
                ref={videoRef}
                src={videoSrc}
                className="w-full h-full object-contain"
                muted
                playsInline
                autoPlay
                aria-label={t('video.cctvAriaLabel')}
              />
              
              {/* 캡처 애니메이션 오버레이 */}
              {isCaptureAnimating && (
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
                  {/* 플래시 효과 */}
                  <div className="absolute inset-0 bg-white animate-capture-flash" />
                  
                  {/* 프레임 효과 */}
                  <div className="absolute inset-0 border-4 border-blue-500 animate-capture-frame" />
                  
                  {/* 체크 아이콘 */}
                  <div className="absolute inset-0 flex items-center justify-center animate-capture-check">
                    <div className="bg-blue-500 rounded-full p-4">
                      <Icon icon="mdi:check" className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </div>
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
                      
                      {/* 시간 표시 */}
                      <span className="text-sm">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* 전체화면 */}
                      <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="hover:text-blue-400 transition-colors"
                        aria-label={t('candidateDetail.video.fullscreen')}
                      >
                        <Icon icon={isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'} className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 우측: 정보 영역 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 스크롤 가능한 정보 영역 */}
            <div className="flex-1 overflow-y-auto min-h-0 p-4" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#31353a #0f0f0f',
            }}>
              <div className="space-y-2.5">
                {/* 라이브 시간 - 작은 카드 */}
                <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-3 hover:bg-[#323232] transition-colors">
                  <div className="flex items-start gap-3">
                    <Icon icon="mdi:clock-outline" className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-400 mb-1">{t('predictedCCTVDetail.currentTime')}</div>
                      <div className="text-lg text-white font-semibold font-mono">{liveTimeString}</div>
                    </div>
                  </div>
                </div>
                
                {/* 예측 정보 카드들 */}
                {(() => {
                  // i18n.language를 클로저에 캡쳐해 언어 변경 시 재렌더로 반영됨
                  void i18n.language;
                  const detail = getPredictedCCTVDetail(cctv.thumbnailUrl, i18n.language);
                  return [
                    { icon: 'mdi:account-details', label: t('predictedCCTVDetail.fields.objectAttributes'), value: detail?.objectAttributes || t('predictedCCTVDetail.noInfo') },
                    { icon: 'mdi:map-marker-distance', label: t('predictedCCTVDetail.fields.expectedDistance'), value: detail?.expectedDistance || t('predictedCCTVDetail.distanceFallback', { distance: cctv.distance }) },
                    { icon: 'mdi:navigation', label: t('predictedCCTVDetail.fields.movementTrend'), value: detail?.movementTrend || t('predictedCCTVDetail.trendFallback', { direction: cctv.direction }) },
                    { icon: 'mdi:clock-outline', label: t('predictedCCTVDetail.fields.expectedArrivalTime'), value: detail?.expectedArrivalTime || t('predictedCCTVDetail.etaFallback', { time: cctv.predictedTime }) },
                    { icon: 'mdi:chart-timeline-variant', label: t('predictedCCTVDetail.fields.routeFitScore'), value: t('predictedCCTV.score', { score: detail?.routeFitScore || cctv.confidence }) },
                  ];
                })().map((item, idx) => (
                  <div key={idx} className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-3 hover:bg-[#323232] transition-colors">
                    <div className="flex items-start gap-3">
                      <Icon icon={item.icon} className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-400 mb-1">{item.label}</div>
                        <div className="text-sm text-white">{item.value}</div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* 경로 예측 상세 근거 - 토글 가능 */}
                <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg overflow-hidden hover:bg-[#323232] transition-colors">
                  <button
                    id="route-prediction-dropdown"
                    type="button"
                    onClick={() => setIsRouteScoreOpen(!isRouteScoreOpen)}
                    className="w-full p-3 flex items-start gap-3 text-left"
                  >
                    <Icon icon="mdi:map-marker-path" className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-400 mb-1">{t('predictedCCTVDetail.routeRationale.title')}</div>
                      <div className="text-sm text-white">{t('predictedCCTVDetail.routeRationale.summary')}</div>
                    </div>
                    <Icon 
                      icon={isRouteScoreOpen ? "mdi:chevron-up" : "mdi:chevron-down"} 
                      className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0 transition-transform" 
                    />
                  </button>
                  
                  {isRouteScoreOpen && (
                    <>
                      {/* 디바이더 */}
                      <div className="border-t border-[#3a3a3a]"></div>
                      
                      {/* 각 분석 항목 */}
                      <div className="p-3 space-y-2">
                        {(() => {
                          void i18n.language;
                          const detail = getPredictedCCTVDetail(cctv.thumbnailUrl, i18n.language);
                          if (!detail?.detailedAnalysis) {
                            return [
                              { category: t('predictedCCTVDetail.routeRationale.categories.movementDirection'), analysis: t('predictedCCTVDetail.routeRationale.defaults.movementDirection') },
                              { category: t('predictedCCTVDetail.routeRationale.categories.movementSpeed'), analysis: t('predictedCCTVDetail.routeRationale.defaults.movementSpeed') },
                              { category: t('predictedCCTVDetail.routeRationale.categories.pathStructure'), analysis: t('predictedCCTVDetail.routeRationale.defaults.pathStructure') },
                              { category: t('predictedCCTVDetail.routeRationale.categories.cctvLinkage'), analysis: t('predictedCCTVDetail.routeRationale.defaults.cctvLinkage') },
                              { category: t('predictedCCTVDetail.routeRationale.categories.similarCases'), analysis: t('predictedCCTVDetail.routeRationale.defaults.similarCases') },
                            ];
                          }
                          return [
                            { category: t('predictedCCTVDetail.routeRationale.categories.movementDirection'), analysis: detail.detailedAnalysis.movementDirection },
                            { category: t('predictedCCTVDetail.routeRationale.categories.movementSpeed'), analysis: detail.detailedAnalysis.movementSpeed },
                            { category: t('predictedCCTVDetail.routeRationale.categories.pathStructure'), analysis: detail.detailedAnalysis.pathStructure },
                            { category: t('predictedCCTVDetail.routeRationale.categories.cctvLinkage'), analysis: detail.detailedAnalysis.cctvLinkage },
                            { category: t('predictedCCTVDetail.routeRationale.categories.similarCases'), analysis: detail.detailedAnalysis.similarCases },
                          ];
                        })().map((item, idx) => (
                          <div key={idx} className="bg-[#1a1a1a]/50 rounded p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-300 font-medium">{item.category}</span>
                            </div>
                            <div className="text-sm text-gray-400 leading-relaxed">
                              {item.analysis}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 푸터 - 고정 */}
        <div className="flex items-center justify-end px-4 py-3 flex-shrink-0 border-t border-[#31353a]" style={{ background: 'transparent' }}>
          <button
            id="predicted-target-found-button"
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

    {/* 날아가는 썸네일 애니메이션 (body에 포탈하여 정확한 위치/스택 보장) */}
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
              '--end-x': `${flyingThumbnail.endX - flyingThumbnail.startX}px`,
              '--end-y': `${flyingThumbnail.endY - flyingThumbnail.startY}px`,
            } as React.CSSProperties}
          />
        </div>,
        document.body
      )}
  </>
  );
};

export default PredictedCCTVDetailPopup;
