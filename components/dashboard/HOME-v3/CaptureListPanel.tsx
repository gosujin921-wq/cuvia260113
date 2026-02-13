import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import PropagationPackagePopup from './PropagationPackagePopup';

interface CaptureListPanelProps {
  isVisible: boolean;
  width?: number;
  captureItems?: CaptureItem[];
  onCreatePropagationPackage?: () => void;
}

export interface CaptureItem {
  id: string;
  cctvName: string;
  location: string;
  timestamp: string; // HH:MM:SS
  thumbnailUrl: string;
  videoUrl?: string;
  memo?: string;
  trackingPinNumber?: number; // 몇 번 핀에서 포착되었는지 (1~4)
  analysisResult?: string | {
    conclusion: string;
    summary: {
      time: string;
      location: string;
      personnel: string;
      features?: string;
      status: string;
      riskLevel: string;
    };
    evidence: string[];
    recommendations: string[];
  };
}

const CaptureListPanel: React.FC<CaptureListPanelProps> = ({
  isVisible,
  width = 700,
  captureItems = [],
  onCreatePropagationPackage,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedCapture, setSelectedCapture] = useState<CaptureItem | null>(null);
  const [showPropagationPopup, setShowPropagationPopup] = useState(false);
  
  // 비디오 플레이어 상태
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === captureItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(captureItems.map((item) => item.id)));
    }
  };

  // 비디오 플레이어 핸들러
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const skipBackward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime - 10);
  };

  const skipForward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(video.duration, video.currentTime + 10);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    
    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    video.currentTime = percentage * video.duration;
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = moveEvent.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      video.currentTime = percentage * video.duration;
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 비디오 이벤트 핸들러
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [selectedCapture]);

  // 팝업이 닫힐 때 비디오 초기화
  useEffect(() => {
    if (!selectedCapture) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [selectedCapture]);

  // 선택된 아이템들 가져오기 (선택이 없으면 모든 아이템)
  const selectedItems = selectedIds.size > 0 
    ? captureItems.filter(item => selectedIds.has(item.id))
    : captureItems;

  return (
    <>
      {/* 전파 패키지 팝업 */}
      {showPropagationPopup && (
        <PropagationPackagePopup
          isOpen={showPropagationPopup}
          onClose={() => setShowPropagationPopup(false)}
          selectedItems={selectedItems}
          onSendPropagation={onCreatePropagationPackage}
        />
      )}

      {/* 포착 상세 팝업 */}
      {selectedCapture && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000] px-6"
          role="dialog"
          aria-modal="true"
          aria-label="포착 상세"
          onClick={() => setSelectedCapture(null)}
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
                  <span className="text-white font-semibold text-sm">{selectedCapture.cctvName}</span>
                  <span className="text-gray-400 text-sm">·</span>
                  <span className="text-gray-300 text-sm truncate">{selectedCapture.location}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="text-gray-400">포착 시각</span>
                  <span className="text-gray-300">{selectedCapture.timestamp}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCapture(null)}
                className="text-gray-400 hover:text-white transition-colors focus:outline-none flex-shrink-0"
                aria-label="닫기"
              >
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            </div>

            {/* 2컬럼 레이아웃: 좌측 영상, 우측 정보 */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* 좌측: 영상 영역 */}
              <div className="flex-shrink-0 p-4 border-r border-[#31353a]/50" style={{ width: '50%' }}>
                <div 
                  ref={containerRef}
                  className="bg-[#0f0f0f] border border-[#31353a] rounded-md overflow-hidden relative" 
                  style={{ aspectRatio: '16/9', width: '100%' }}
                >
                  {selectedCapture.videoUrl ? (
                    <>
                      <video
                        ref={videoRef}
                        src={selectedCapture.videoUrl}
                        className="w-full h-full object-contain"
                        poster={selectedCapture.thumbnailUrl}
                        muted
                        playsInline
                        autoPlay
                        aria-label="포착 영상"
                      />
                      
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
                              <span className="text-xs text-gray-300 ml-2">
                                {formatTime(currentTime)} / {formatTime(duration)}
                              </span>
                            </div>
                            
                            {/* 전체화면 */}
                            <button
                              type="button"
                              onClick={toggleFullscreen}
                              className="hover:text-blue-400 transition-colors"
                              aria-label={isFullscreen ? '전체화면 종료' : '전체화면'}
                            >
                              <Icon icon={isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'} className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <img
                      src={selectedCapture.thumbnailUrl}
                      alt={selectedCapture.cctvName}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>

              {/* 우측: 분석 결과 영역 - 스크롤 가능 */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto min-h-0 p-4" style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#31353a #0f0f0f',
                }}>
                  <div className="space-y-4">
                    {selectedCapture.analysisResult ? (
                      typeof selectedCapture.analysisResult === 'string' ? (
                        // 마크다운 형식의 분석결과 - 전파 패키지 팝업 스타일
                        selectedCapture.analysisResult.includes('객체 추적') ? (
                          // 객체 추적 분석 결과
                          <div className="space-y-3">
                            {/* 예측 정보 */}
                            <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                              <div className="flex items-center gap-2 mb-3">
                                <Icon icon="mdi:information" className="w-5 h-5 text-blue-400" />
                                <h3 className="text-white font-semibold text-sm">예측 정보</h3>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                  <Icon icon="mdi:navigation" className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-gray-400">이동 추세: </span>
                                    <span className="text-gray-300">남서쪽 (최근 3프레임 평균)</span>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Icon icon="mdi:clock-outline" className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-gray-400">예상 도달 시각: </span>
                                    <span className="text-gray-300">09:36:00 (현재 시각 +30초)</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 경로 예측 상세 근거 */}
                            <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                              <div className="flex items-center gap-2 mb-3">
                                <Icon icon="mdi:map-marker-path" className="w-5 h-5 text-blue-400" />
                                <h3 className="text-white font-semibold text-sm">경로 예측 상세 근거</h3>
                              </div>
                              <ul className="space-y-1.5 text-sm">
                                <li className="flex items-start gap-2 text-gray-300">
                                  <span className="text-gray-500 mt-1">•</span>
                                  <span>마지막 프레임 기준 북동 방향을 유지하며 이동 중임.</span>
                                </li>
                                <li className="flex items-start gap-2 text-gray-300">
                                  <span className="text-gray-500 mt-1">•</span>
                                  <span>정지나 급가속 없이 평균 보행 속도 범위를 안정적으로 유지함.</span>
                                </li>
                                <li className="flex items-start gap-2 text-gray-300">
                                  <span className="text-gray-500 mt-1">•</span>
                                  <span>하천 산책로 및 보행자 전용 동선과 직접 연결되는 구간임.</span>
                                </li>
                                <li className="flex items-start gap-2 text-gray-300">
                                  <span className="text-gray-500 mt-1">•</span>
                                  <span>인접 CCTV 3대의 커버리지가 중첩되는 구간으로 연속 추적이 용이함.</span>
                                </li>
                                <li className="flex items-start gap-2 text-gray-300">
                                  <span className="text-gray-500 mt-1">•</span>
                                  <span>특정 지점에서 체류한 후, 기존 이동 방향을 유지하여 이탈하는 패턴을 반복함.</span>
                                </li>
                                <li className="flex items-start gap-2 text-gray-300">
                                  <span className="text-gray-500 mt-1">•</span>
                                  <span>해당 시간대 유사 사례 분석 시, 하천 방향으로 이동하는 비중이 통계적으로 높음.</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        ) : (
                          // 일반 마크다운 (48번 후보 등)
                          <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                            <pre className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                              {selectedCapture.analysisResult}
                            </pre>
                          </div>
                        )
                      ) : (
                        <>
                          {/* 한 줄 결론 */}
                          <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <Icon icon="mdi:lightbulb-on" className="w-4 h-4 text-blue-400" />
                              <h4 className="text-white font-semibold text-sm">1. 한 줄 결론</h4>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedCapture.analysisResult.conclusion.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </div>

                          {/* 사건 요약 */}
                          <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <Icon icon="mdi:file-document-outline" className="w-4 h-4 text-blue-400" />
                              <h4 className="text-white font-semibold text-sm">2. 사건 요약</h4>
                            </div>
                            <div className="space-y-1.5 text-sm">
                              <div className="text-gray-300">
                                <span className="text-gray-400">- 관측 시간대:</span> {selectedCapture.analysisResult.summary.time}
                              </div>
                              <div className="text-gray-300">
                                <span className="text-gray-400">- 위치/카메라:</span> {selectedCapture.analysisResult.summary.location}
                              </div>
                              <div className="text-gray-300">
                                <span className="text-gray-400">- 대상 인물(추정):</span> {selectedCapture.analysisResult.summary.personnel}
                              </div>
                              {selectedCapture.analysisResult.summary.features && (
                                <div className="text-gray-300">
                                  <span className="text-gray-400">- 주요 특징:</span> {selectedCapture.analysisResult.summary.features}
                                </div>
                              )}
                              <div className="text-gray-300">
                                <span className="text-gray-400">- 행동 상태:</span> {selectedCapture.analysisResult.summary.status}
                              </div>
                              <div className="text-gray-300">
                                <span className="text-gray-400">- 위험도:</span> <span dangerouslySetInnerHTML={{ __html: selectedCapture.analysisResult.summary.riskLevel.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                              </div>
                            </div>
                          </div>

                          {/* 관측 근거 (요약) */}
                          <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <Icon icon="mdi:clipboard-text" className="w-4 h-4 text-blue-400" />
                              <h4 className="text-white font-semibold text-sm">3. 관측 근거 (요약)</h4>
                            </div>
                            <ul className="space-y-1.5">
                              {selectedCapture.analysisResult.evidence.map((item, idx) => (
                                <li key={idx} className="text-gray-300 text-sm leading-relaxed flex items-start">
                                  <span className="text-gray-400 mr-2">-</span>
                                  <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )
                    ) : (
                      <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-6 flex flex-col items-center justify-center text-gray-400" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                        <Icon icon="mdi:information-outline" className="w-12 h-12 mb-3 opacity-50" />
                        <p className="text-sm">분석 결과가 없습니다.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
            {/* 정보 칩들 */}
            <div className="flex items-center gap-2 flex-wrap relative">
              {/* 총 포착 개수 칩 */}
              <div className="px-4 py-2 rounded-full text-xs font-medium bg-[#0f0f0f]/50 text-gray-300 flex items-center gap-2 border border-[#31353a]" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span>총 포착: {captureItems.length}건</span>
              </div>
              
              {/* 선택된 개수 칩 */}
              {selectedIds.size > 0 && (
                <div className="px-4 py-2 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 flex items-center gap-2 border border-blue-500/50" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                  <span>선택됨: {selectedIds.size}건</span>
                </div>
              )}
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
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#31353a] flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white bg-[#0f0f0f]/50 hover:bg-[#0f0f0f]/80 border border-[#31353a] hover:border-blue-500/30 transition-all"
                  style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
                  aria-label={selectedIds.size === captureItems.length ? '전체 해제' : '전체 선택'}
                >
                  {selectedIds.size === captureItems.length ? '전체 해제' : '전체 선택'}
                </button>
              </div>
              
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('[CaptureListPanel] 전파 패키지 생성 버튼 클릭');
                  setShowPropagationPopup(true);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all text-white bg-blue-500 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/20 border border-blue-400/50"
                aria-label="전파 패키지 생성"
              >
                <div className="flex items-center gap-1.5">
                  <Icon icon="mdi:package-variant-closed" className="w-3.5 h-3.5" />
                  <span>전파 패키지 생성</span>
                </div>
              </button>
            </div>
            
            <div
              className="flex-1 overflow-y-auto"
              style={{
                padding: '16px',
                minHeight: 0,
                scrollbarWidth: 'thin',
                scrollbarColor: '#31353a #0f0f0f',
              }}
            >
              {captureItems.length === 0 ? (
                // 빈 상태
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <div className="w-20 h-20 rounded-full bg-[#0f0f0f]/50 border border-[#31353a] flex items-center justify-center mb-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                    <Icon icon="mdi:camera-off" className="w-10 h-10 opacity-50" />
                  </div>
                  <p className="text-sm font-medium text-gray-300">포착된 대상이 없습니다.</p>
                  <p className="text-xs mt-2 text-gray-500 text-center max-w-xs">
                    객체 추적 중 CCTV 라이브에서 "대상 포착" 버튼을 눌러 포착하세요.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3" style={{ minHeight: 'min-content' }}>
                  {captureItems.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedCapture(item)}
                        className={`relative bg-[#0f0f0f]/70 border rounded-lg overflow-hidden cursor-pointer transition-all group hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 ${
                          isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-[#31353a]'
                        }`}
                        style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
                      >
                        {/* 선택 체크박스 */}
                        <div
                          className="absolute top-2 left-2 z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelect(item.id);
                          }}
                        >
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-500 border-2 border-blue-500'
                                : 'bg-black/50 border-2 border-gray-400 hover:border-blue-400'
                            }`}
                          >
                            {isSelected && <Icon icon="mdi:check" className="w-4 h-4 text-white" />}
                          </div>
                        </div>

                        {/* 추적 핀 번호 뱃지 */}
                        {item.trackingPinNumber && (
                          <div className="absolute top-2 right-2 z-10 px-2 py-1 rounded text-[10px] font-bold bg-red-500/90 text-white">
                            {item.trackingPinNumber}번 핀
                          </div>
                        )}

                        {/* 썸네일 */}
                        <div className="relative w-full bg-black" style={{ height: '160px' }}>
                          <img
                            src={item.thumbnailUrl}
                            alt={item.cctvName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%231a1a1a"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23666" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          
                          {/* 재생 아이콘 오버레이 */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <Icon icon="mdi:play" className="w-8 h-8 text-white" />
                            </div>
                          </div>
                        </div>

                        {/* 기본정보 */}
                        <div className="flex-1 min-w-0 p-3 space-y-1.5">
                          {/* CCTV명 */}
                          <div className="text-xs text-gray-300 font-semibold truncate" title={item.cctvName}>
                            {item.cctvName}
                          </div>
                          
                          {/* 장소 */}
                          <div className="text-xs text-gray-200 truncate" title={item.location}>
                            {item.location}
                          </div>

                          {/* 시간 */}
                          <div className="text-xs text-gray-200">
                            {item.timestamp}
                          </div>

                          {/* 메모 */}
                          {item.memo && (
                            <div className="text-xs text-gray-400 italic truncate" title={item.memo}>
                              "{item.memo}"
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CaptureListPanel;
