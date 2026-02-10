import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import type { CaptureItem } from './CaptureListPanel';

interface PropagationPackagePopupProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: CaptureItem[];
}

const PropagationPackagePopup: React.FC<PropagationPackagePopupProps> = ({
  isOpen,
  onClose,
  selectedItems,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'summary' | 'preview'>('summary');
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

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

  // 비디오 이벤트 핸들러
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isOpen) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsPlaying(!video.paused);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

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
  }, [isOpen, currentVideoIndex]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
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

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 전파 내용 생성 (텍스트 형식)
  const generatePropagationContent = (): string => {
    // 고속검색 후보와 객체 추적 연계 후보 찾기
    const fastSearchItem = selectedItems.find(item => 
      typeof item.analysisResult === 'string' && item.analysisResult.includes('## 후보 #48')
    );
    const trackingItem = selectedItems.find(item => 
      typeof item.analysisResult === 'string' && item.analysisResult.includes('객체 추적')
    );

    let content = '📡 전파 요약 (객체 추적 연계)\n\n';
    content += '▪ 전파 대상\n\n';
    content += `원미구 일대 동일 인물 추정 객체 (총 ${selectedItems.length}건 포착)\n\n`;
    
    content += '▪ 주요 포착 내용 요약\n\n';
    
    // 1차 포착 (고속검색 기준)
    if (fastSearchItem) {
      content += '1차 포착(고속검색 기준)\n\n';
      content += `카메라: ${fastSearchItem.cctvName}\n\n`;
      content += `위치: ${fastSearchItem.location}\n\n`;
      content += `포착 시각: ${fastSearchItem.timestamp}\n\n`;
      content += '유사도: 95%\n\n';
      content += '행동 요약:\n';
      content += '편의점 앞 체류 → 입·퇴장 반복 → 전화 행동 후 화면 상단 중앙 방향 이탈\n\n';
    }
    
    // 2차 포착 (객체 추적 연계)
    if (trackingItem) {
      content += '2차 포착(객체 추적 연계)\n\n';
      content += `카메라: ${trackingItem.cctvName}\n\n`;
      content += `위치: ${trackingItem.location}\n\n`;
      content += `포착 시각: ${trackingItem.timestamp}\n\n`;
      content += '연계 판단: 고속검색 후보와 외형·행동 패턴 일치\n\n';
    }
    
    content += '▪ 객체 추적 분석 결과\n\n';
    content += '예상 이동 거리: 약 22m (이전 위치 기준)\n\n';
    content += '이동 추세: 남서 방향 이동 지속 (최근 3프레임 평균)\n\n';
    content += '예상 도달 시각: 09:36:00 (현재 시각 기준 +30초)\n\n';
    content += '경로 적합도: 83점\n\n';
    
    content += '▪ 추적 근거 요약\n\n';
    content += '평균 보행 속도로 방향 유지 이동 중\n\n';
    content += '하천 산책로 및 보행자 동선과 직접 연결된 구간\n\n';
    content += '인접 CCTV 3대 커버리지 중첩 구간으로 연속 추적 가능\n\n';
    content += '체류 후 동일 방향 이탈 패턴 반복 관측\n\n';
    content += '유사 시간대 사례 분석 결과, 하천 방향 이동 비중 높음\n\n';
    
    content += '▪ 종합 판단\n\n';
    content += '고속검색으로 확보된 후보 객체가 인접 CCTV에서 연속 포착됨.\n';
    content += '동일 외형·행동 패턴 기반 연계 추적 신뢰도 높음으로 판단됨.';
    
    return content;
  };

  if (!isOpen) return null;

  const currentItem = selectedItems[currentVideoIndex];
  if (!currentItem) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] px-6"
      role="dialog"
      aria-modal="true"
      aria-label="전파 패키지"
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
              <span className="text-white font-semibold text-sm">전파 패키지</span>
              <span className="text-gray-400 text-sm">·</span>
              <span className="text-gray-300 text-sm">{selectedItems.length}건 선택됨</span>
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
          {/* 좌측: 영상 영역 */}
          <div className="flex-shrink-0 p-4 border-r border-[#31353a]/50 flex flex-col gap-3" style={{ width: '65%' }}>
            {/* 비디오 플레이어 */}
            <div 
              ref={containerRef}
              className="bg-[#0f0f0f] border border-[#31353a] rounded-md overflow-hidden relative" 
              style={{ aspectRatio: '16/9', width: '100%', maxHeight: '100%' }}
            >
              <video
                ref={videoRef}
                src={currentItem.videoUrl || currentItem.thumbnailUrl}
                className="w-full h-full object-contain"
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
                  >
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                  
                  {/* 컨트롤 버튼들 */}
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={togglePlayPause}
                        className="hover:text-blue-400 transition-colors"
                        aria-label={isPlaying ? '일시정지' : '재생'}
                      >
                        <Icon icon={isPlaying ? 'mdi:pause' : 'mdi:play'} className="w-6 h-6" />
                      </button>
                      
                      <span className="text-sm">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
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

            {/* 썸네일 리스트 */}
            <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#31353a #0f0f0f' }}>
              {selectedItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentVideoIndex(index)}
                  className={`flex-shrink-0 w-24 h-16 rounded border-2 overflow-hidden transition-all ${
                    currentVideoIndex === index ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-[#31353a] hover:border-blue-400'
                  }`}
                >
                  <img
                    src={item.thumbnailUrl}
                    alt={item.cctvName}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* 우측: 정보 영역 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 탭 헤더 - 캡슐 안에 캡슐 스타일 */}
            <div className="p-3 bg-[#0a0a0a]/50 flex-shrink-0">
              <div className="relative bg-[#1a1a1a] rounded-full p-1 flex">
                {/* 슬라이딩 배경 - 어두운 그레이 */}
                <div
                  className="absolute top-1 bottom-1 bg-[#2a2a2a] rounded-full transition-all duration-300 ease-out"
                  style={{
                    left: activeTab === 'summary' ? '4px' : '50%',
                    right: activeTab === 'summary' ? '50%' : '4px',
                  }}
                />
                
                {/* 탭 버튼들 */}
                <button
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  className={`relative flex-1 px-4 py-2.5 text-sm font-semibold rounded-full transition-colors duration-300 z-10 ${
                    activeTab === 'summary'
                      ? 'text-blue-400'
                      : 'text-gray-500 hover:text-gray-400'
                  }`}
                >
                  전파 내용 확인하기
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`relative flex-1 px-4 py-2.5 text-sm font-semibold rounded-full transition-colors duration-300 z-10 ${
                    activeTab === 'preview'
                      ? 'text-blue-400'
                      : 'text-gray-500 hover:text-gray-400'
                  }`}
                >
                  전파 내용 미리보기
                </button>
              </div>
            </div>

            {/* 탭 컨텐츠 */}
            <div className="flex-1 overflow-y-auto min-h-0 p-4" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#31353a #0f0f0f',
            }}>
              {activeTab === 'summary' ? (
                // 전파 내용 확인하기 - 카드 스타일
                <div className="space-y-3">
                  {/* 전파 대상 */}
                  <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon icon="mdi:account-alert" className="w-5 h-5 text-blue-400" />
                      <h3 className="text-white font-semibold text-sm">전파 대상</h3>
                    </div>
                    <p className="text-gray-300 text-sm">원미구 일대 동일 인물 추정 객체 (총 {selectedItems.length}건 포착)</p>
                  </div>

                  {/* 주요 포착 내용 */}
                  <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon icon="mdi:cctv" className="w-5 h-5 text-blue-400" />
                      <h3 className="text-white font-semibold text-sm">주요 포착 내용 요약</h3>
                    </div>
                    <div className="space-y-4">
                      {selectedItems.map((item, index) => (
                        <div key={item.id}>
                          <div className="text-blue-400 font-semibold text-xs mb-2">
                            {index === 0 ? '1차 포착(고속검색 기준)' : '2차 포착(객체 추적 연계)'}
                          </div>
                          <div className="space-y-1.5 text-sm ml-3">
                            <div className="flex gap-2">
                              <span className="text-gray-400 w-20 flex-shrink-0">카메라:</span>
                              <span className="text-gray-300">{item.cctvName}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-gray-400 w-20 flex-shrink-0">위치:</span>
                              <span className="text-gray-300">{item.location}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-gray-400 w-20 flex-shrink-0">포착 시각:</span>
                              <span className="text-gray-300">{item.timestamp}</span>
                            </div>
                            {index === 0 ? (
                              <>
                                <div className="flex gap-2">
                                  <span className="text-gray-400 w-20 flex-shrink-0">유사도:</span>
                                  <span className="text-gray-300">95%</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-gray-400 w-20 flex-shrink-0">행동 요약:</span>
                                  <span className="text-gray-300">편의점 앞 체류 → 입·퇴장 반복 → 전화 행동 후 화면 상단 중앙 방향 이탈</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex gap-2">
                                <span className="text-gray-400 w-20 flex-shrink-0">연계 판단:</span>
                                <span className="text-gray-300">고속검색 후보와 외형·행동 패턴 일치</span>
                              </div>
                            )}
                          </div>
                          {index < selectedItems.length - 1 && <div className="border-t border-[#31353a] mt-3"></div>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 객체 추적 분석 결과 */}
                  <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon icon="mdi:map-marker-path" className="w-5 h-5 text-blue-400" />
                      <h3 className="text-white font-semibold text-sm">객체 추적 분석 결과</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Icon icon="mdi:map-marker-distance" className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-gray-400">예상 이동 거리: </span>
                          <span className="text-gray-300">약 22m (이전 위치 기준)</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Icon icon="mdi:navigation" className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-gray-400">이동 추세: </span>
                          <span className="text-gray-300">남서 방향 이동 지속 (최근 3프레임 평균)</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Icon icon="mdi:clock-outline" className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-gray-400">예상 도달 시각: </span>
                          <span className="text-gray-300">09:36:00 (현재 시각 기준 +30초)</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Icon icon="mdi:chart-timeline-variant" className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-gray-400">경로 적합도: </span>
                          <span className="text-blue-400 font-semibold">83점</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 추적 근거 요약 */}
                  <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon icon="mdi:clipboard-check" className="w-5 h-5 text-blue-400" />
                      <h3 className="text-white font-semibold text-sm">추적 근거 요약</h3>
                    </div>
                    <ul className="space-y-1.5 text-sm">
                      <li className="flex items-start gap-2 text-gray-300">
                        <span className="text-gray-500 mt-1">•</span>
                        <span>평균 보행 속도로 방향 유지 이동 중</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-300">
                        <span className="text-gray-500 mt-1">•</span>
                        <span>하천 산책로 및 보행자 동선과 직접 연결된 구간</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-300">
                        <span className="text-gray-500 mt-1">•</span>
                        <span>인접 CCTV 3대 커버리지 중첩 구간으로 연속 추적 가능</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-300">
                        <span className="text-gray-500 mt-1">•</span>
                        <span>체류 후 동일 방향 이탈 패턴 반복 관측</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-300">
                        <span className="text-gray-500 mt-1">•</span>
                        <span>유사 시간대 사례 분석 결과, 하천 방향 이동 비중 높음</span>
                      </li>
                    </ul>
                  </div>

                  {/* 종합 판단 */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon icon="mdi:check-circle" className="w-5 h-5 text-blue-400" />
                      <h3 className="text-blue-400 font-semibold text-sm">종합 판단</h3>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      고속검색으로 확보된 후보 객체가 인접 CCTV에서 연속 포착됨.<br />
                      동일 외형·행동 패턴 기반 연계 추적 신뢰도 높음으로 판단됨.
                    </p>
                  </div>
                </div>
              ) : (
                // 전파 내용 미리보기 - 텍스트 스타일
                <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                  <pre className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {generatePropagationContent()}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 flex-shrink-0 border-t border-[#31353a]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-gray-300 bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              const propagationContent = generatePropagationContent();
              const title = selectedItems.length > 0 
                ? `원미구 일대 동일 인물 추정 객체 (${selectedItems.length}건 포착)`
                : '새 전파';
              
              console.log('전파 패키지 전송 클릭');
              console.log('생성된 내용:', propagationContent);
              console.log('제목:', title);
              console.log('선택된 아이템:', selectedItems);
              
              onClose();
              
              // 새 탭으로 전파 페이지 열기 (state 전달은 새 탭에서 불가능하므로 기본 더미 데이터 사용)
              window.open('/propagation', '_blank');
            }}
            className="px-4 py-2 rounded-lg text-xs font-medium text-white transition-all"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            }}
          >
            <div className="flex items-center gap-1.5">
              <Icon icon="mdi:send" className="w-4 h-4" />
              <span>전파 패키지 전송</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropagationPackagePopup;
