'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { cctvInfo, cctvThumbnailMap, cctvFovMap, cctvCoordinatesMap, detectedCCTVThumbnails, movementTimeline, cctvLocationGroups } from './constants';
import { getSecondaryButtonClassName, getPrimaryButtonClassName } from '@/components/shared/styles';
import { PlaybackControls } from './PlaybackControls';

interface DetectedCCTVClipPopupProps {
  isOpen: boolean;
  selectedDetectedCCTV: string | null;
  isClipPlaying: boolean;
  clipCurrentTime: number;
  clipDuration: number;
  onClose: () => void;
  setIsClipPlaying: (playing: boolean) => void;
  setClipCurrentTime: (time: number) => void;
  onTrackingReselectComplete?: () => void;
  onTrackingReselectStart?: () => void;
}


export const DetectedCCTVClipPopup = ({
  isOpen,
  selectedDetectedCCTV,
  isClipPlaying,
  clipCurrentTime,
  clipDuration,
  onClose,
  setIsClipPlaying,
  setClipCurrentTime,
  onTrackingReselectComplete,
  onTrackingReselectStart,
}: DetectedCCTVClipPopupProps) => {
  const [isTrackingBoxDraggable, setIsTrackingBoxDraggable] = useState(false);
  const [trackingBoxPosition, setTrackingBoxPosition] = useState({ top: 30, left: 40 }); // 퍼센트 기준
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isClipPlaying, setIsClipPlaying, clipCurrentTime, clipDuration, setClipCurrentTime]);

  if (!isOpen || !selectedDetectedCCTV) return null;

  const detected = detectedCCTVThumbnails.find(d => d.cctvId === selectedDetectedCCTV);
  if (!detected) return null;

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

  const cctvKey = Object.keys(cctvInfo).find(key => cctvInfo[key].id === detected.cctvId);
  const cctv = cctvKey ? cctvInfo[cctvKey] : null;
  const fov = cctvFovMap[detected.cctvId] || '95°';

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
            <Icon icon="mdi:video-stabilization" className="w-5 h-5 text-purple-400" />
            포착된 CCTV 클립
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white focus:outline-none transition-colors"
            aria-label="모달 닫기"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        {/* 메인 콘텐츠 영역 */}
        {/* 영상 영역 - 2컬럼 */}
        <div className="flex p-4 pb-3">
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
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:sparkles" className="w-4 h-4 text-[#50A1FF]" />
                      <span className="text-[#50A1FF] font-semibold text-sm">AI 해석</span>
                    </div>
                    <span className="text-purple-400 text-xs font-semibold">정확도 {detected.confidence}%</span>
                  </div>
                  <p className="text-white text-sm leading-relaxed">{detected.aiAnalysis}</p>
                </div>
              )}

              {/* 용의자 의심 이유 */}
              {detected.suspectReason && (
                <div className="bg-[#1a1a1a] border border-[#31353a] p-4 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:alert-circle" className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 font-semibold text-sm">용의자 의심 이유</span>
                    </div>
                    <span className="text-purple-400 text-xs font-semibold">정확도 {detected.confidence}%</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{detected.suspectReason}</p>
                </div>
              )}

              {/* 상황 설명 */}
              {detected.situation && (
                <div className="bg-[#1a1a1a] border border-[#31353a] p-4 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:information" className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400 font-semibold text-sm">상황 설명</span>
                    </div>
                    <span className="text-purple-400 text-xs font-semibold">정확도 {detected.confidence}%</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{detected.situation}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단 영역: CCTV 정보 (2컬럼) + 제어 버튼 */}
        <div className="flex border-t border-[#31353a] p-4">
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
          <div className="w-[400px] bg-[#0f0f0f] pl-4 flex flex-col gap-4">
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
                  // 추적대상 재추적 시작
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
          </div>
        </div>
      </div>
    </div>
  );
};

