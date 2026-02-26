import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import type { CaptureItem } from './CaptureListPanel';

interface PropagationPackagePopupProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: CaptureItem[];
  onSendPropagation?: () => void;
}

const PropagationPackagePopup: React.FC<PropagationPackagePopupProps> = ({
  isOpen,
  onClose,
  selectedItems,
  onSendPropagation,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'preview'>('preview');
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  // 초기 컨텐츠 설정
  const initialContent = `**[112 긴급 전파] 납치(의심) 차량 이동 정황 — 번호판 후보 확보(관제 확인)**

1. **대상 정보**
- 사건 유형: **납치(의심)** (성인 남성이 성인 여성과 동행 후 차량 이동 정황)
- 관련 차량: **번호판 후보 12 324*** *(가시성: 높음)* / 차종·색상·외형 특징 일치(추정)

2. **관제 확인 범위**
- 확인 시간대: **14:00~현재**
- 확인 구역: **은하로363번길 48 일대** (반경 약 2km)
- 관제 방식: **차량 중심 객체추적(실시간) 진행 중**

3. **포착 현황**
- 별빛A-444 | 14:02:18: 성인 남성-성인 여성 동행, 여성 움직임 비자발적 정황 관찰(추정)
- 별빛A-655 | 14:05:08: 차량 **재포착**, 번호판 후보 **12 324*** 확보(가시성: 높음)
- 이동 방향: **동 방향 진행**(추정)

4. **추적 판단 요약**
- 차량이 **이동 중**으로 판단되어, **차량 중심 추적**을 유지하며 후속 포착을 갱신 중입니다.
- 현재 확보 단서 기준으로 **현장 확인/출동 검토**가 필요합니다.

5. **상호 협조(요청)**
- 번호판 후보 **12 324*** 및 동일/유사 차량에 대한 **즉시 확인 및 출동 검토** 요청드립니다.
- 관제에서 **추가 포착 발생 시 즉시 업데이트** 드리겠습니다.

6. **첨부(전달)**
- **캡처 3장**(번호판 후보 포함)
- **클립 2개**(전후 60초 구간)
- **지도 스냅샷 1장**(포착 지점 및 추정 이동 경로)

※ **AI 분석 기반 추정 결과이며 최종 확인은 현장 판단 기준입니다.**

관제 담당: **김쿠도 / 032-266-3454**`;

  const [editableContent, setEditableContent] = useState(initialContent);

  // 팝업이 열릴 때마다 초기 컨텐츠 및 비디오 인덱스 리셋
  useEffect(() => {
    if (isOpen) {
      setEditableContent(initialContent);
      setCurrentVideoIndex(0);
    }
  }, [isOpen, initialContent]);

  // 팝업이 열릴 때 0.5초 후 스크롤 영역을 맨 아래로
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      const el = scrollContentRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, 500);
    return () => clearTimeout(timer);
  }, [isOpen]);

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

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300); // 애니메이션 시간과 동일
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
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
    content += `별빛구 일대 동일 인물 추정 객체 (총 ${selectedItems.length}건 포착)\n\n`;
    
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
      className={`fixed inset-0 bg-black/70 flex items-center justify-center px-6 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ zIndex: 10003 }}
      role="dialog"
      aria-modal="true"
      aria-label="전파 패키지"
      onClick={handleOverlayClick}
    >
      <div
        className={`gradient-border-right-bottom w-full flex flex-col rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
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
            onClick={handleClose}
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
                key={currentItem.id}
                ref={videoRef}
                src={currentItem.videoUrl}
                poster={currentItem.thumbnailUrl}
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
                  <video
                    src={item.videoUrl}
                    poster={item.thumbnailUrl}
                    className="w-full h-full object-cover pointer-events-none"
                    muted
                    playsInline
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
                    left: activeTab === 'preview' ? '4px' : '50%',
                    right: activeTab === 'preview' ? '50%' : '4px',
                  }}
                />
                
                {/* 탭 버튼들 */}
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
                <button
                  id="propagation-detail-tab"
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  className={`relative flex-1 px-4 py-2.5 text-sm font-semibold rounded-full transition-colors duration-300 z-10 ${
                    activeTab === 'summary'
                      ? 'text-blue-400'
                      : 'text-gray-500 hover:text-gray-400'
                  }`}
                >
                  상세 보기
                </button>
              </div>
            </div>

            {/* 탭 컨텐츠 */}
            <div
              ref={scrollContentRef}
              className="flex-1 overflow-y-auto min-h-0 p-4"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#31353a #0f0f0f',
              }}
            >
              {activeTab === 'preview' ? (
                // 전파 내용 미리보기 - 수정 가능한 텍스트 영역
                <div className="h-full flex flex-col gap-3">
                  {/* 안내 문구 */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-2">
                    <Icon icon="mdi:information" className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-blue-300 text-xs leading-relaxed">
                      AI 로 생성된 전파문 초안입니다. 상세내용을 확인하신 후 필요 사항 수정·보완 후 전파해 주세요.
                    </p>
                  </div>
                  
                  {/* 수정 가능한 텍스트 영역 */}
                  <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-4 flex-1 min-h-0" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                    <textarea
                      value={editableContent}
                      onChange={(e) => setEditableContent(e.target.value)}
                      className="w-full h-full bg-transparent text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-sans border-none focus:outline-none resize-none"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#31353a #0f0f0f',
                      }}
                      placeholder="전파 내용을 입력하세요..."
                    />
                  </div>
                </div>
              ) : (
                // 상세 보기 - 카드 스타일 (납치 의심 차량 전파)
                <div className="space-y-3">
                  {/* 1. 대상 정보 */}
                  <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon icon="mdi:car-alert" className="w-5 h-5 text-red-400" />
                      <h3 className="text-white font-semibold text-sm">1. 대상 정보</h3>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div>
                        <span className="text-gray-400">사건 유형: </span>
                        <span className="text-red-300 font-medium">납치(의심)</span>
                        <span className="text-gray-300"> (성인 남성이 성인 여성과 동행 후 차량 이동 정황)</span>
                      </div>
                      <div>
                        <span className="text-gray-400">관련 차량: </span>
                        <span className="text-blue-300 font-semibold">번호판 후보 12 324*</span>
                        <span className="text-gray-400"> (가시성: 높음) / </span>
                        <span className="text-gray-300">차종·색상·외형 특징 일치(추정)</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. 관제 확인 범위 */}
                  <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon icon="mdi:radar" className="w-5 h-5 text-blue-400" />
                      <h3 className="text-white font-semibold text-sm">2. 관제 확인 범위</h3>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div>
                        <span className="text-gray-400">확인 시간대: </span>
                        <span className="text-gray-300 font-medium">14:00~현재</span>
                      </div>
                      <div>
                        <span className="text-gray-400">확인 구역: </span>
                        <span className="text-gray-300">은하로363번길 48 일대 (반경 약 2km)</span>
                      </div>
                      <div>
                        <span className="text-gray-400">관제 방식: </span>
                        <span className="text-blue-300 font-medium">차량 중심 객체추적(실시간) 진행 중</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. 포착 현황 */}
                  <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon icon="mdi:cctv" className="w-5 h-5 text-blue-400" />
                      <h3 className="text-white font-semibold text-sm">3. 포착 현황</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 mt-0.5">•</span>
                        <span className="text-gray-300">별빛A-444 | 14:02:18: 성인 남성-성인 여성 동행, 여성 움직임 비자발적 정황 관찰(추정)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 mt-0.5">•</span>
                        <span className="text-gray-300">별빛A-655 | 14:05:08: 차량 <span className="text-blue-300 font-medium">재포착</span>, 번호판 후보 <span className="text-blue-300 font-semibold">12 324*</span> 확보(가시성: 높음)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 mt-0.5">•</span>
                        <span className="text-gray-300">이동 방향: <span className="text-gray-100 font-medium">동 방향 진행</span>(추정)</span>
                      </div>
                    </div>
                  </div>

                  {/* 4. 추적 판단 요약 */}
                  <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon icon="mdi:navigation" className="w-5 h-5 text-blue-400" />
                      <h3 className="text-white font-semibold text-sm">4. 추적 판단 요약</h3>
                    </div>
                    <ul className="space-y-1.5 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="text-gray-500 mt-0.5">•</span>
                        <span>차량이 <span className="text-white font-medium">이동 중</span>으로 판단되어, <span className="text-blue-300 font-medium">차량 중심 추적</span>을 유지하며 후속 포착을 갱신 중입니다.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gray-500 mt-0.5">•</span>
                        <span>현재 확보 단서 기준으로 <span className="text-amber-300 font-medium">현장 확인/출동 검토</span>가 필요합니다.</span>
                      </li>
                    </ul>
                  </div>

                  {/* 5. 상호 협조(요청) */}
                  <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon icon="mdi:handshake" className="w-5 h-5 text-blue-400" />
                      <h3 className="text-white font-semibold text-sm">5. 상호 협조(요청)</h3>
                    </div>
                    <div className="space-y-2 text-sm text-gray-300">
                      <p>• 번호판 후보 <span className="text-blue-300 font-semibold">12 324*</span> 및 동일/유사 차량에 대한 <span className="text-amber-300 font-medium">즉시 확인 및 출동 검토</span> 요청드립니다.</p>
                      <p>• 관제에서 <span className="text-gray-100">추가 포착 발생 시 즉시 업데이트</span> 드리겠습니다.</p>
                    </div>
                  </div>

                  {/* 6. 첨부(전달) */}
                  <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon icon="mdi:paperclip" className="w-5 h-5 text-blue-400" />
                      <h3 className="text-white font-semibold text-sm">6. 첨부(전달)</h3>
                    </div>
                    <ul className="space-y-1.5 text-sm">
                      <li className="flex items-start gap-2 text-gray-300">
                        <span className="text-gray-500 mt-0.5">•</span>
                        <span><span className="text-gray-100 font-medium">캡처 3장</span>(번호판 후보 포함)</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-300">
                        <span className="text-gray-500 mt-0.5">•</span>
                        <span><span className="text-gray-100 font-medium">클립 2개</span>(전후 60초 구간)</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-300">
                        <span className="text-gray-500 mt-0.5">•</span>
                        <span><span className="text-gray-100 font-medium">지도 스냅샷 1장</span>(포착 지점 및 추정 이동 경로)</span>
                      </li>
                    </ul>
                  </div>

                  {/* 주의사항 */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Icon icon="mdi:information" className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="text-gray-300 leading-relaxed mb-2">
                          ※ AI 분석 기반 추정 결과이며 최종 확인은 현장 판단 기준입니다.
                        </p>
                        <p className="text-gray-400 text-xs">
                          관제 담당: 김쿠도 / 032-266-3454
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 flex-shrink-0 border-t border-[#31353a]">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-gray-300 bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors"
          >
            취소
          </button>
          <button
            id="send-propagation-package-button"
            type="button"
            onClick={() => {
              setIsClosing(true);
              setTimeout(() => {
                setIsClosing(false);
                onClose();
                
                // 전파 패널 열기
                if (onSendPropagation) {
                  onSendPropagation();
                }
              }, 300);
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
