'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { cctvInfo, cctvThumbnailMap, cctvFovMap, cctvCoordinatesMap, detectedCCTVThumbnails, movementTimeline, cctvLocationGroups } from './constants';
import { getTabButtonClassName, getSecondaryButtonClassName, getPrimaryButtonClassName, getPTZButtonClassName, getPTZPresetButtonClassName } from '@/components/shared/styles';
import { PlaybackControls } from './PlaybackControls';

interface CombinedCCTVPopupProps {
  isOpen: boolean;
  selectedCCTV: string | null;
  currentCctvIndex: number;
  isClipPlaying: boolean;
  clipCurrentTime: number;
  clipDuration: number;
  popupTitle?: string; // 팝업 헤더 타이틀
  clipTabTitle?: string; // 포착된 클립 탭 타이틀
  liveTabTitle?: string; // 실시간 모니터링 탭 타이틀
  onClose: () => void;
  setSelectedCCTV: (cctvId: string) => void;
  setCurrentCctvIndex: (index: number) => void;
  setIsClipPlaying: (playing: boolean) => void;
  setClipCurrentTime: (time: number) => void;
  handlePTZUp: () => void;
  handlePTZDown: () => void;
  handlePTZLeft: () => void;
  handlePTZRight: () => void;
  handlePTZCenter: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handlePreset: (preset: number) => void;
  handlePrevCCTV: () => void;
  handleNextCCTV: () => void;
  onTrackingReselectComplete?: () => void;
  onTrackingReselectStart?: () => void;
  prototypeDetectedClipConfidence?: Record<string, number>;
}


export const CombinedCCTVPopup = ({
  isOpen,
  selectedCCTV,
  currentCctvIndex,
  isClipPlaying,
  clipCurrentTime,
  clipDuration,
  popupTitle = 'CCTV 팝업',
  clipTabTitle = '포착된 클립',
  liveTabTitle = '실시간 모니터링',
  onClose,
  setSelectedCCTV,
  setCurrentCctvIndex,
  setIsClipPlaying,
  setClipCurrentTime,
  handlePTZUp,
  handlePTZDown,
  handlePTZLeft,
  handlePTZRight,
  handlePTZCenter,
  handleZoomIn,
  handleZoomOut,
  handlePreset,
  handlePrevCCTV,
  handleNextCCTV,
  onTrackingReselectComplete,
  onTrackingReselectStart,
  prototypeDetectedClipConfidence = {},
}: CombinedCCTVPopupProps) => {
  const [activeTab, setActiveTab] = useState<'clip' | 'live'>('clip');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isTrackingBoxDraggable, setIsTrackingBoxDraggable] = useState(false);
  const [trackingBoxPosition, setTrackingBoxPosition] = useState({ top: 50, left: 50 }); // 퍼센트 기준 (이미지 중앙)
  const [isDragging, setIsDragging] = useState(false);

  // 키보드 이벤트 핸들러
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC 키로 팝업 닫기
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // 입력 필드에 포커스가 있으면 무시
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // 탭 전환: 1 (포착된 클립), 2 (실시간 모니터링)
      if (e.key === '1' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveTab('clip');
        setActiveKey(null);
        return;
      }
      if (e.key === '2' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveTab('live');
        setActiveKey(null);
        return;
      }

      // 클립 탭에서 재생 컨트롤 키보드 이벤트
      if (activeTab === 'clip') {
        // 스페이스바로 재생/일시정지
        if (e.key === ' ') {
          e.preventDefault();
          setIsClipPlaying(!isClipPlaying);
          return;
        }
        // 화살표 왼쪽: 10초 뒤로
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const newTime = Math.max(0, clipCurrentTime - 10);
          setClipCurrentTime(newTime);
          return;
        }
        // 화살표 오른쪽: 10초 앞으로
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const newTime = Math.min(clipDuration, clipCurrentTime + 10);
          setClipCurrentTime(newTime);
          return;
        }
        // 클립 탭에서는 PTZ 키보드 이벤트 무시
        return;
      }

      // LIVE 탭이 아니면 PTZ 키보드 이벤트 무시
      if (activeTab !== 'live') return;

      let key: string | null = null;

      // 프리셋: Ctrl/Cmd + 숫자
      if ((e.ctrlKey || e.metaKey) && ['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        e.preventDefault();
        key = `preset-${e.key}`;
        handlePreset(parseInt(e.key));
        setActiveKey(key);
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          key = 'up';
          handlePTZUp();
          setActiveKey(key);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          key = 'down';
          handlePTZDown();
          setActiveKey(key);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          key = 'left';
          handlePTZLeft();
          setActiveKey(key);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          key = 'right';
          handlePTZRight();
          setActiveKey(key);
          break;
        case 'Home':
        case '0':
          e.preventDefault();
          key = 'center';
          handlePTZCenter();
          setActiveKey(key);
          break;
        case '+':
        case '=':
        case 'PageUp':
          e.preventDefault();
          key = 'zoomIn';
          handleZoomIn();
          setActiveKey(key);
          break;
        case '-':
        case '_':
        case 'PageDown':
          e.preventDefault();
          key = 'zoomOut';
          handleZoomOut();
          setActiveKey(key);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      setActiveKey(null);
    };
  }, [isOpen, activeTab, handlePTZUp, handlePTZDown, handlePTZLeft, handlePTZRight, handlePTZCenter, handleZoomIn, handleZoomOut, handlePreset, onClose, isClipPlaying, setIsClipPlaying, clipCurrentTime, clipDuration, setClipCurrentTime]);

  if (!isOpen || !selectedCCTV) return null;

  const detectedBase = detectedCCTVThumbnails.find(d => d.cctvId === selectedCCTV);
  const detected = detectedBase ? {
    ...detectedBase,
    confidence: prototypeDetectedClipConfidence[selectedCCTV] || detectedBase.confidence
  } : null;
  const cctvKey = Object.keys(cctvInfo).find(key => cctvInfo[key].id === selectedCCTV);
  const cctv = cctvKey ? cctvInfo[cctvKey] : null;
  const fov = cctvFovMap[selectedCCTV] || '95°';

  // 방향 계산 (지역명으로 표시)
  const getDirection = (location: string, name?: string) => {
    const locationText = location || name || '';
    if (locationText.includes('평촌')) return '평촌 방향';
    if (locationText.includes('인덕원') || locationText.includes('인덕')) return '인덕원 방향';
    if (locationText.includes('비산')) return '비산 방향';
    if (locationText.includes('관양')) return '관양 방향';
    if (locationText.includes('호계')) return '호계 방향';
    if (locationText.includes('범계')) return '범계 방향';
    if (locationText.includes('동안')) return '동안 방향';
    if (locationText.includes('안양')) return '안양 방향';
    if (locationText.includes('금정')) return '금정 방향';
    // 기본값: 위치 정보가 없으면 인덕원 방향으로 설정
    return '인덕원 방향';
  };

  // 군집 정보
  const getCluster = (cctvId: string) => {
    for (const [locationId, group] of Object.entries(cctvLocationGroups)) {
      if (group.cctvs.includes(cctvId)) {
        const clusterMap: Record<string, string> = {
          'location-1': 'G-01 (남측 데크 라인)',
          'location-2': 'G-02 (중앙 데크 라인)',
          'location-3': 'G-03 (북측 데크 라인)',
          'location-4': 'G-04 (동측 데크 라인)',
          'location-5': 'G-03 (북측 데크 라인)',
        };
        return clusterMap[locationId] || 'G-00';
      }
    }
    return 'G-00';
  };

  // 최근 포착 정보
  const getRecentCaptures = (cctvId: string) => {
    const captures = movementTimeline
      .filter(item => item.cctvId === cctvId)
      .map(item => {
        const time = item.time.split(':').slice(1).join(':');
        return `${time} ${item.title}`;
      });
    return captures.length > 0 ? captures.join(' / ') : '없음';
  };

  // 클러스터 정보 확인
  let currentCluster: string[] = [];
  let hasMultiple = false;
  for (const [locationId, group] of Object.entries(cctvLocationGroups)) {
    if (group.cctvs.includes(selectedCCTV)) {
      currentCluster = group.cctvs;
      hasMultiple = currentCluster.length > 1;
      break;
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] px-6"
      onClick={onClose}
    >
      <div
        className="bg-[#101013] border border-[#31353a] w-full max-w-6xl flex flex-col shadow-lg"
        style={{ maxHeight: '120vh', height: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-[#31353a] flex-shrink-0">
          <div className="flex items-center gap-2 text-base font-semibold text-white">
            <Icon icon="mdi:cctv" className="w-5 h-5 text-[#50A1FF]" />
            {popupTitle}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white focus:outline-none transition-colors"
            aria-label="팝업 닫기"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex flex-col min-h-0 flex-1">
          {/* 탭 버튼 */}
          <div className="flex gap-2 p-4 pb-3 flex-shrink-0">
            <button
              onClick={() => setActiveTab('clip')}
              className={`${getTabButtonClassName(activeTab === 'clip')} rounded`}
            >
              {clipTabTitle}
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`${getTabButtonClassName(activeTab === 'live')} rounded`}
            >
              {liveTabTitle}
            </button>
          </div>
          {activeTab === 'clip' && detected ? (
            // 포착된 CCTV 클립 탭
            <>
            {/* 영상 영역 - 2컬럼 */}
            <div className="flex p-4 flex-1 min-h-0">
              {/* 왼쪽: 영상 */}
              <div className="flex-1 pr-4">
                <div className="w-full aspect-video relative overflow-hidden rounded bg-black">
                  <img
                    src={detected.thumbnail}
                    alt={detected.cctvName}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = cctvThumbnailMap[detected.cctvId] || '/cctv_img/001.jpg';
                    }}
                  />
                  {/* 추적 영역 표시 */}
                  <div 
                    className="absolute inset-0"
                    style={{ pointerEvents: isTrackingBoxDraggable ? 'auto' : 'none' }}
                    onMouseMove={(e) => {
                      if (isDragging && isTrackingBoxDraggable) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        const percentX = (x / rect.width) * 100;
                        const percentY = (y / rect.height) * 100;
                        setTrackingBoxPosition({
                          top: Math.max(0, Math.min(100, percentY)),
                          left: Math.max(0, Math.min(100, percentX)),
                        });
                      }
                    }}
                    onMouseUp={() => {
                      setIsDragging(false);
                    }}
                    onMouseLeave={() => {
                      setIsDragging(false);
                    }}
                  >
                    <div
                      className={`absolute border-2 border-red-500 bg-red-500/20 rounded ${isTrackingBoxDraggable ? 'cursor-move' : ''}`}
                      style={{
                        width: '200px',
                        height: '150px',
                        top: `${trackingBoxPosition.top}%`,
                        left: `${trackingBoxPosition.left}%`,
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: isTrackingBoxDraggable ? 'auto' : 'none',
                      }}
                      onMouseDown={(e) => {
                        if (isTrackingBoxDraggable) {
                          e.stopPropagation();
                          setIsDragging(true);
                        }
                      }}
                    >
                      <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        추적 대상
                      </div>
                    </div>
                  </div>
                  {/* Clip 상태 표시 - LIVE처럼 */}
                  <div className="absolute top-3 left-3 px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold flex items-center gap-1.5 rounded-full z-10">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    <Icon icon="mdi:circle" className="w-2 h-2" />
                    Clip
                  </div>
                  <div className="absolute top-3 right-3 px-3 py-1.5 bg-black/70 rounded text-white text-xs font-semibold">
                    {detected.timestamp}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px bg-[#31353a]"></div>

              {/* 오른쪽: AI요약 (스크롤) */}
              <div className="w-[400px] pl-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh * 0.8 * 0.8 - 200px)' }}>
                <div className="space-y-4">
                  {/* AI 해석 */}
                  {detected.aiAnalysis && (
                    <div className="bg-[#0f1723] border border-[#155DFC] p-4 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon icon="mdi:sparkles" className="w-4 h-4 text-[#50A1FF]" />
                        <span className="text-[#50A1FF] font-semibold text-sm">AI 해석</span>
                      </div>
                      <p className="text-white text-sm leading-relaxed">{detected.aiAnalysis}</p>
                    </div>
                  )}

                  {/* 용의자 의심 이유 */}
                  {detected.suspectReason && (
                    <div className="bg-[#1a1a1a] border border-[#31353a] p-4 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon icon="mdi:alert-circle" className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 font-semibold text-sm">용의자 의심 이유</span>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{detected.suspectReason}</p>
                    </div>
                  )}

                  {/* 상황 설명 */}
                  {detected.situation && (
                    <div className="bg-[#1a1a1a] border border-[#31353a] p-4 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon icon="mdi:information" className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 font-semibold text-sm">상황 설명</span>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{detected.situation}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 하단 영역: CCTV 정보 (2컬럼) + 제어 버튼 */}
            <div className="flex border-t border-[#31353a] p-4 flex-shrink-0">
              {/* 왼쪽: CCTV 정보 (2컬럼) */}
              <div className="flex-1 pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-400 text-xs mb-1">CCTV 명칭</div>
                    <div className="text-white font-semibold text-sm">
                      {detected.cctvId}  (화각 {fov})
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">위치</div>
                    <div className="text-gray-300 text-sm">
                      {cctv?.name || detected.cctvName}{cctv?.location ? `(${cctv.location})` : detected.location ? `(${detected.location})` : ''}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">폴대 위/경도</div>
                    <div className="text-gray-300 text-sm">
                      {(() => {
                        const coords = cctvCoordinatesMap[detected.cctvId];
                        return coords ? `${coords.latitude}, ${coords.longitude}` : '알 수 없음';
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">방향</div>
                    <div className="text-gray-300 text-sm">
                      {cctv?.location ? getDirection(cctv.location, cctv.name) : detected.location ? getDirection(detected.location, detected.cctvName) : getDirection('', detected.cctvName)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">AI분석</div>
                    <div className="text-gray-300 text-sm">
                      객체·행동 감지 활성
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">최근포착</div>
                    <div className="text-gray-300 text-sm">
                      {getRecentCaptures(detected.cctvId)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px bg-[#31353a]"></div>

              {/* 오른쪽: 클립 제어 (원래 CCTV 정보가 있던 공간) */}
              <div className="w-[400px] bg-[#0f0f0f] pl-4 flex flex-col gap-4 flex-shrink-0">
                <PlaybackControls
                  isPlaying={isClipPlaying}
                  currentTime={clipCurrentTime}
                  duration={clipDuration}
                  onRewind={() => {
                    const newTime = Math.max(0, clipCurrentTime - 10);
                    setClipCurrentTime(newTime);
                  }}
                  onPlayPause={() => setIsClipPlaying(!isClipPlaying)}
                  onFastForward={() => {
                    const newTime = Math.min(clipDuration, clipCurrentTime + 10);
                    setClipCurrentTime(newTime);
                  }}
                  onTimeChange={setClipCurrentTime}
                />
              </div>
            </div>

            </>
          ) : (
            // 실시간 모니터링 탭
            <>
            {/* 영상 영역 - 2컬럼 */}
            <div className="flex p-4 flex-1 min-h-0">
              {/* 왼쪽: 영상 */}
              <div className="flex-1 pr-4">
                <div className="w-full aspect-video relative overflow-hidden rounded bg-black">
                  <img
                    src={cctvThumbnailMap[selectedCCTV] || '/cctv_img/001.jpg'}
                    alt={`${selectedCCTV} 라이브`}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/cctv_img/001.jpg';
                    }}
                  />
                  {/* LIVE 오버레이 */}
                  <div className="absolute top-3 left-3 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold flex items-center gap-1.5 rounded-full z-10">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    <Icon icon="mdi:circle" className="w-2 h-2" />
                    LIVE
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px bg-[#31353a]"></div>

              {/* 오른쪽: 클러스터 CCTV (영상 높이에 맞춤, 2컬럼) */}
              <div className="w-[400px] pl-4 overflow-hidden">
                {hasMultiple && currentCluster.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-white font-semibold text-sm">주변 CCTV</div>
                      <div className="text-xs text-gray-400">총 {currentCluster.length}대</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                    {currentCluster.map((cctvId: string, index: number) => {
                      const isActive = cctvId === selectedCCTV;
                      return (
                        <button
                          key={cctvId}
                          onClick={() => {
                            setSelectedCCTV(cctvId);
                            setCurrentCctvIndex(index);
                          }}
                          className={`relative aspect-video rounded overflow-hidden border-2 transition-all ${
                            isActive 
                              ? 'border-blue-500 ring-2 ring-blue-500/30' 
                              : 'border-[#31353a] hover:border-blue-500/50'
                          }`}
                        >
                          <img
                            src={cctvThumbnailMap[cctvId] || '/cctv_img/001.jpg'}
                            alt={cctvId}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/cctv_img/001.jpg';
                            }}
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1">
                            <div className="text-white text-xs font-semibold truncate" title={cctvId}>
                              {cctvId}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                    클러스터 CCTV 없음
                  </div>
                )}
              </div>
            </div>

            {/* 하단 영역: CCTV 정보 (2컬럼) + PTZ 제어 */}
            <div className="flex border-t border-[#31353a] p-4 flex-shrink-0">
              {/* 왼쪽: CCTV 정보 (2컬럼) */}
              <div className="flex-1 pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-400 text-xs mb-1">CCTV 명칭</div>
                    <div className="text-white font-semibold text-sm">
                      {selectedCCTV}  (화각 {fov})
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">위치</div>
                    <div className="text-gray-300 text-sm">
                      {cctv?.name || selectedCCTV}{cctv?.location ? `(${cctv.location})` : ''}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">폴대 위/경도</div>
                    <div className="text-gray-300 text-sm">
                      {(() => {
                        const coords = cctvCoordinatesMap[selectedCCTV];
                        return coords ? `${coords.latitude}, ${coords.longitude}` : '알 수 없음';
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">방향</div>
                    <div className="text-gray-300 text-sm">
                      {cctv?.location ? getDirection(cctv.location, cctv.name) : getDirection('', selectedCCTV)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">AI분석</div>
                    <div className="text-gray-300 text-sm">
                      객체·행동 감지 활성
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">최근포착</div>
                    <div className="text-gray-300 text-sm">
                      {getRecentCaptures(selectedCCTV)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px bg-[#31353a]"></div>

              {/* 오른쪽: PTZ 제어 (원래 CCTV 정보가 있던 공간) */}
              <div className="w-[400px] bg-[#0f0f0f] pl-4 flex flex-col gap-4 flex-shrink-0">
                <div className="flex gap-4">
                  {/* Pan/Tilt + Zoom 세로 배치 */}
                  <div className="flex flex-col gap-4 flex-shrink-0">
                    {/* Pan/Tilt 조이스틱 영역 */}
                    <div className="bg-[#1a1a1a] border border-[#31353a] rounded-lg p-4">
                      <div className="grid grid-cols-3 gap-2">
                        <div></div>
                        <button
                          onClick={handlePTZUp}
                          className={`${getPTZButtonClassName(activeKey === 'up')} rounded`}
                          aria-label="위로 이동"
                        >
                          <Icon icon="mdi:chevron-up" className="w-5 h-5 mx-auto" />
                        </button>
                        <div></div>
                        <button
                          onClick={handlePTZLeft}
                          className={`${getPTZButtonClassName(activeKey === 'left')} rounded`}
                          aria-label="왼쪽으로 이동"
                        >
                          <Icon icon="mdi:chevron-left" className="w-5 h-5 mx-auto" />
                        </button>
                        <button
                          onClick={handlePTZCenter}
                          className={`${getPTZButtonClassName(activeKey === 'center')} rounded`}
                          aria-label="중앙"
                        >
                          <Icon icon="mdi:target" className="w-5 h-5 mx-auto" />
                        </button>
                        <button
                          onClick={handlePTZRight}
                          className={`${getPTZButtonClassName(activeKey === 'right')} rounded`}
                          aria-label="오른쪽으로 이동"
                        >
                          <Icon icon="mdi:chevron-right" className="w-5 h-5 mx-auto" />
                        </button>
                        <div></div>
                        <button
                          onClick={handlePTZDown}
                          className={`${getPTZButtonClassName(activeKey === 'down')} rounded`}
                          aria-label="아래로 이동"
                        >
                          <Icon icon="mdi:chevron-down" className="w-5 h-5 mx-auto" />
                        </button>
                        <div></div>
                      </div>
                    </div>

                    {/* Zoom 제어 */}
                    <div className="bg-[#1a1a1a] border border-[#31353a] rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleZoomOut}
                          className={`${getPTZButtonClassName(activeKey === 'zoomOut')} rounded`}
                          aria-label="줌 아웃"
                        >
                          <Icon icon="mdi:minus" className="w-5 h-5" />
                        </button>
                        <div className="flex-1 h-2 bg-[#0f0f0f] rounded-full relative">
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-400 rounded-full"></div>
                        </div>
                        <button
                          onClick={handleZoomIn}
                          className={`${getPTZButtonClassName(activeKey === 'zoomIn')} rounded`}
                          aria-label="줌 인"
                        >
                          <Icon icon="mdi:plus" className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 프리셋 */}
                  <div className="bg-[#1a1a1a] border border-[#31353a] rounded-lg p-4 flex-1">
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3, 4, 5, 6].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => handlePreset(preset)}
                          className={getPTZPresetButtonClassName(activeKey === `preset-${preset}`)}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            </>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-between items-center gap-2 p-4 border-t border-[#31353a] flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className={getSecondaryButtonClassName()}
          >
            닫기
          </button>
          <div className="flex gap-2">
            {activeTab === 'clip' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (isTrackingBoxDraggable) {
                      // 추적대상 재선택 완료
                      if (onTrackingReselectComplete) {
                        onTrackingReselectComplete();
                      }
                      setIsTrackingBoxDraggable(false);
                      onClose();
                    } else {
                      setIsTrackingBoxDraggable(true);
                      if (onTrackingReselectStart) {
                        onTrackingReselectStart();
                      }
                    }
                  }}
                  className={isTrackingBoxDraggable ? getPrimaryButtonClassName() : getSecondaryButtonClassName()}
                >
                  {isTrackingBoxDraggable ? '추적대상 재선택 완료' : '추적대상 재추적'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // TODO: 전파하기 기능 구현
                    console.log('전파하기');
                  }}
                  className={getSecondaryButtonClassName()}
                >
                  전파하기
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  // TODO: CCTV 모니터링 추가 기능 구현
                  console.log('CCTV 모니터링 추가');
                }}
                className={getSecondaryButtonClassName()}
              >
                CCTV 모니터링 추가
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

