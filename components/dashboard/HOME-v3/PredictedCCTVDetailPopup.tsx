import React, { useRef, useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getRandomCCTVVideo } from '@/lib/cctv-video-utils';
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
  onAddCapture?: (cctvName: string, location: string, confidence: number, capturedImage?: string, analysisResult?: string) => void;
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
    setIsPlaying(true);
  }, [cctv?.id, cctv?.thumbnailUrl]);

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

  // 마크다운 분석결과 생성 함수
  const generateAnalysisMarkdown = (cctvItem: PredictedCCTVItem): string => {
    return `# 객체 추적 분석 결과

## 1. 예측 정보

**예상 이동 거리**: 약 ${cctvItem.distance}m (이전 위치 기준)

**이동 추세**: ${cctvItem.direction} (최근 3프레임 평균)

**예상 도달 시각**: ${cctvItem.predictedTime} (현재 시각 +30초)

**경로 적합도**: ${cctvItem.confidence}점

---

## 2. 경로 예측 상세 근거

### 이동 방향
마지막 프레임 기준 북동 방향을 유지하며 이동 중임.

### 이동 속도
정지나 급가속 없이 평균 보행 속도 범위를 안정적으로 유지함.

### 보행로 구조
하천 산책로 및 보행자 전용 동선과 직접 연결되는 구간임.

### CCTV 연계
인접 CCTV 3대의 커버리지가 중첩되는 구간으로 연속 추적이 용이함.

### 이전 경로
특정 지점에서 체류한 후, 기존 이동 방향을 유지하여 이탈하는 패턴을 반복함.

### 유사 사례
해당 시간대 유사 사례 분석 시, 하천 방향으로 이동하는 비중이 통계적으로 높음.`;
  };

  const handleCaptureTarget = () => {
    if (!cctv || !videoRef.current || !videoContainerRef.current) return;
    
    setIsCaptureAnimating(true);
    
    // 비디오에서 썸네일 캡처
    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // 비디오 컨테이너의 위치 가져오기
      const rect = videoContainerRef.current.getBoundingClientRect();
      
      // 포착 목록 메뉴 위치 찾기 (원래 메뉴 또는 오버레이에서)
      const captureMenuButton = document.querySelector('[aria-label="포착목록"]');
      let endX = 40;
      let endY = 250;
      
      if (captureMenuButton) {
        const menuRect = captureMenuButton.getBoundingClientRect();
        endX = menuRect.left + menuRect.width / 2;
        endY = menuRect.top + menuRect.height / 2;
      }
      
      // 날아가는 썸네일 시작
      setFlyingThumbnail({
        startX: rect.left + rect.width / 2,
        startY: rect.top + rect.height / 2,
        endX,
        endY,
        imageData,
      });
      
      // 원미A-638인 경우 마크다운 분석결과 생성
      const analysisResult = cctv.cctvName === '원미A-638' ? generateAnalysisMarkdown(cctv) : undefined;
      
      // 포착 목록에 추가 (썸네일 애니메이션 시작 후)
      setTimeout(() => {
        if (onAddCapture) {
          // imageData(썸네일), analysisResult(분석결과) 전달
          if (analysisResult) {
            // 원미A-638: 썸네일 + 분석결과
            onAddCapture(cctv.cctvName, cctv.location, cctv.confidence, imageData, analysisResult);
          } else {
            // 다른 CCTV: 썸네일만
            onAddCapture(cctv.cctvName, cctv.location, cctv.confidence, imageData);
          }
        }
      }, 300);
      
      // 썸네일 애니메이션 종료
      setTimeout(() => {
        setFlyingThumbnail(null);
      }, 600);
    }
    
    setTimeout(() => {
      setIsCaptureAnimating(false);
    }, 1000);
  };

  return (
    <>
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
                {(() => {
                  const detail = getPredictedCCTVDetail(cctv.thumbnailUrl);
                  return [
                    { icon: 'mdi:account-details', label: '객체 속성', value: detail?.objectAttributes || '정보 없음' },
                    { icon: 'mdi:map-marker-distance', label: '예상 이동 거리', value: detail?.expectedDistance || `약 ${cctv.distance}m (이전 위치 기준)` },
                    { icon: 'mdi:navigation', label: '이동 추세', value: detail?.movementTrend || `${cctv.direction} (최근 3프레임 평균)` },
                    { icon: 'mdi:clock-outline', label: '예상 도달 시각', value: detail?.expectedArrivalTime || `${cctv.predictedTime} (현재 시각 +30초)` },
                    { icon: 'mdi:chart-timeline-variant', label: '경로 적합도(유사도)', value: `${detail?.routeFitScore || cctv.confidence}점` },
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
                    type="button"
                    onClick={() => setIsRouteScoreOpen(!isRouteScoreOpen)}
                    className="w-full p-3 flex items-start gap-3 text-left"
                  >
                    <Icon icon="mdi:map-marker-path" className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-400 mb-1">경로 예측 상세 근거</div>
                      <div className="text-sm text-white">6개 항목 분석 완료</div>
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
                          const detail = getPredictedCCTVDetail(cctv.thumbnailUrl);
                          if (!detail?.detailedAnalysis) {
                            return [
                              { category: '이동 방향', analysis: '마지막 프레임 기준 북동 방향을 유지하며 이동 중임.' },
                              { category: '이동 속도', analysis: '정지나 급가속 없이 평균 보행 속도 범위를 안정적으로 유지함.' },
                              { category: '보행로 구조', analysis: '하천 산책로 및 보행자 전용 동선과 직접 연결되는 구간임.' },
                              { category: 'CCTV 연계', analysis: '인접 CCTV 3대의 커버리지가 중첩되는 구간으로 연속 추적이 용이함.' },
                              { category: '이전 경로', analysis: '특정 지점에서 체류한 후, 기존 이동 방향을 유지하여 이탈하는 패턴을 반복함.' },
                              { category: '유사 사례', analysis: '해당 시간대 유사 사례 분석 시, 하천 방향으로 이동하는 비중이 통계적으로 높음.' },
                            ];
                          }
                          return [
                            { category: '이동 방향', analysis: detail.detailedAnalysis.movementDirection },
                            { category: '이동 속도', analysis: detail.detailedAnalysis.movementSpeed },
                            { category: '보행로 구조', analysis: detail.detailedAnalysis.pathStructure },
                            { category: 'CCTV 연계', analysis: detail.detailedAnalysis.cctvLinkage },
                            { category: '이전 경로', analysis: detail.detailedAnalysis.previousPath },
                            { category: '유사 사례', analysis: detail.detailedAnalysis.similarCases },
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
        </div>
      </div>
    </div>

    {/* 날아가는 썸네일 애니메이션 */}
    {flyingThumbnail && (
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
            animation: `fly-to-menu-dynamic 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            '--end-x': `${flyingThumbnail.endX - flyingThumbnail.startX}px`,
            '--end-y': `${flyingThumbnail.endY - flyingThumbnail.startY}px`,
          } as React.CSSProperties}
        />
      </div>
    )}
  </>
  );
};

export default PredictedCCTVDetailPopup;
