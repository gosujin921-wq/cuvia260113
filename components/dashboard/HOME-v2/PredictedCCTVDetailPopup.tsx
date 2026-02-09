import React, { useRef, useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getRandomCCTVVideo } from '@/lib/cctv-video-utils';

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
  onAddCapture?: (cctvName: string, location: string, confidence: number) => void;
}

const PredictedCCTVDetailPopup: React.FC<PredictedCCTVDetailPopupProps> = ({
  isOpen,
  onClose,
  cctv,
  onAddCapture,
}) => {
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
    setVideoSrc(getRandomCCTVVideo()); // CCTV 변경 시에만 새 비디오 선택
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);
  }, [cctv?.id]);

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

  if (!isOpen || !cctv) return null;

  const liveTimeString = currentLiveTime.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    onClose();
  };

  const handleCaptureTarget = () => {
    if (!cctv) return;
    
    setIsCaptureAnimating(true);
    
    // 포착 목록에 추가
    if (onAddCapture) {
      onAddCapture(cctv.cctvName, cctv.location, cctv.confidence);
    }
    
    setTimeout(() => {
      setIsCaptureAnimating(false);
    }, 1000);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] px-6"
      role="dialog"
      aria-modal="true"
      aria-label="예측 CCTV 상세"
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
              <span className="text-gray-400">채널</span>
              <span className="text-gray-300">CH-{cctv.id.padStart(3, '0')}</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400">경로 적합도</span>
              <span className="text-white font-semibold">{cctv.confidence}점</span>
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
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors focus:outline-none flex-shrink-0"
            aria-label="닫기"
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
                aria-label="CCTV 영상"
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
                        aria-label={isPlaying ? '일시정지' : '재생'}
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
                        aria-label="전체화면"
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
                      <div className="text-xs text-gray-400 mb-1">현재 시간</div>
                      <div className="text-lg text-white font-semibold font-mono">{liveTimeString}</div>
                    </div>
                  </div>
                </div>
                
                {/* 예측 정보 카드들 */}
                {[
                  { icon: 'mdi:map-marker-distance', label: '예상 이동 거리', value: `약 ${cctv.distance}m (이전 위치 기준)` },
                  { icon: 'mdi:navigation', label: '이동 추세', value: `${cctv.direction} (최근 3프레임 평균)` },
                  { icon: 'mdi:clock-outline', label: '예상 도달 시각', value: `${cctv.predictedTime} (현재 시각 +30초)` },
                ].map((item, idx) => (
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
                
                {/* 경로 적합도 - 토글 가능 */}
                <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg overflow-hidden hover:bg-[#323232] transition-colors">
                  <button
                    type="button"
                    onClick={() => setIsRouteScoreOpen(!isRouteScoreOpen)}
                    className="w-full p-3 flex items-start gap-3 text-left"
                  >
                    <Icon icon="mdi:chart-timeline-variant" className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-400 mb-1">경로 적합도</div>
                      <div className="text-sm text-white">{cctv.confidence}점</div>
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
                        {[
                          { category: '이동 방향', analysis: '마지막 프레임 기준 북동 방향 유지' },
                          { category: '이동 속도', analysis: '평균 보행 속도 범위 유지 (정지·급가속 없음)' },
                          { category: '보행로 구조', analysis: '하천 산책로·보행자 전용 동선과 직접 연결' },
                          { category: 'CCTV 연계', analysis: '인접 CCTV 3대 커버리지 중첩 구간 존재' },
                          { category: '이전 경로', analysis: '체류 후 동일 방향 이탈 패턴 반복' },
                          { category: '유사 사례', analysis: '동일 시간대 유사 사례의 하천 방향 이동 비율 높음' },
                        ].map((item, idx) => (
                          <div key={idx} className="bg-[#1a1a1a]/50 rounded p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-300 font-medium">{item.category}</span>
                            </div>
                            <div className="text-sm text-gray-400">
                              → {item.analysis}
                            </div>
                          </div>
                        ))}
                        
                        {/* 경로 적합도 점수 */}
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 flex items-center justify-between mt-3">
                          <span className="text-sm text-blue-300 font-semibold">경로 적합도</span>
                          <span className="text-base text-blue-400 font-bold">{cctv.confidence}점</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 푸터 - 고정 */}
        <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3 flex-shrink-0 border-t border-[#31353a]" style={{ background: 'transparent' }}>
          <button
            type="button"
            onClick={handleCaptureTarget}
            className="px-4 py-2 rounded-lg text-xs font-medium text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-400/50 flex items-center gap-1.5"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            }}
            aria-label="대상 발견"
          >
            <Icon icon="mdi:account-check" className="w-3.5 h-3.5" />
            대상 발견
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#31353a] hover:border-[#3d4046] transition-all focus:outline-none focus:ring-2 focus:ring-gray-400/50 flex items-center gap-1.5"
            aria-label="지도에서 위치 보기"
          >
            <Icon icon="mdi:map-marker" className="w-3.5 h-3.5" />
            지도에서 위치 보기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PredictedCCTVDetailPopup;
