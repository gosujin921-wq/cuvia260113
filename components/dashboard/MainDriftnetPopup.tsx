import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Event } from '@/types';
import { getRandomCCTVVideo } from '@/lib/cctv-video-utils';

interface MainDriftnetPopupProps {
  event: Event | null;
  onClose: () => void;
}

interface PopupPosition {
  left?: string;
  right?: string;
  top: string;
  transform?: string;
}

/**
 * 메인투망 팝업 컴포넌트
 * 대시보드 맵뷰에서 메인 투망 이벤트를 표시하는 팝업입니다.
 * 좌측 3개, 우측 3개 총 6개가 0.5초 간격으로 자동으로 열립니다.
 */
const MainDriftnetPopup: React.FC<MainDriftnetPopupProps> = ({ event, onClose }) => {
  const [visiblePopups, setVisiblePopups] = useState<boolean[]>([false, false, false, false, false, false, false]);

  useEffect(() => {
    if (!event) return;

    // 0.5초 간격으로 하나씩 표시
    const timeouts: NodeJS.Timeout[] = [];
    for (let i = 0; i < 7; i++) {
      const timeout = setTimeout(() => {
        setVisiblePopups(prev => {
          const newState = [...prev];
          newState[i] = true;
          return newState;
        });
      }, i * 500);
      timeouts.push(timeout);
    }

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [event]);

  if (!event) return null;

  // "상가 절도 의심" 이벤트는 팝업 전체 제외
  const isTheftEvent = event.title.includes('상가 절도 의심') || event.title.includes('현금 절취 포착');
  if (isTheftEvent) return null;

  // 팝업 위치 정의: 중앙 1개, 좌측 20px에서 3개, 우측 20px에서 3개
  const popupPositions: PopupPosition[] = [
    { left: 'calc(50% - 60px)', top: '50%', transform: 'translate(-50%, calc(-100% - 40px))' }, // 중앙 (기존 위치, absolute)
    { left: '20px', top: '10%' },      // 좌측 상단 (브라우저 기준)
    { left: '20px', top: '35%' },      // 좌측 중간 (브라우저 기준)
    { left: '20px', top: '60%' },      // 좌측 하단 (브라우저 기준)
    { right: '20px', top: '10%' },     // 우측 상단 (브라우저 기준)
    { right: '20px', top: '35%' },     // 우측 중간 (브라우저 기준)
    { right: '20px', top: '60%' },     // 우측 하단 (브라우저 기준)
  ];

  const renderPopup = (index: number, position: PopupPosition) => {
    if (!visiblePopups[index]) return null;

    // 중앙 팝업(index 0)은 absolute, 나머지는 fixed (브라우저 기준)
    const positionType = index === 0 ? 'absolute' : 'fixed';

    return (
      <div 
        key={index}
        className="z-[1000]"
        style={{
          position: positionType,
          left: position.left,
          right: position.right,
          top: position.top,
          transform: position.transform || 'none',
          opacity: visiblePopups[index] ? 1 : 0,
          transition: 'opacity 0.3s ease-in',
        }}
      >
        <div
          className="bg-[#101013] border border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.3),0_0_60px_rgba(59,130,246,0.15)] w-[420px] max-h-[600px] overflow-y-auto flex flex-col rounded-2xl"
          style={{ borderWidth: '1px' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 - X 버튼만 */}
          <div
            className="flex items-center justify-end p-4 border-b border-[#31353a]"
            style={{ borderBottomWidth: '1px' }}
          >
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors focus:outline-none"
              aria-label="닫기"
            >
              <Icon icon="mdi:close" className="w-5 h-5" />
            </button>
          </div>

          {/* 컨텐츠 */}
          <div className="flex-1 overflow-y-auto">
            {/* 감지된 CCTV 영상 */}
            <div className="p-4">
            <div className="w-full bg-[#0f0f0f] border border-blue-500/30 rounded-xl overflow-hidden relative shadow-[0_0_20px_rgba(59,130,246,0.2)]" style={{ borderWidth: '1px', aspectRatio: '16/9' }}>
            <video 
              src={event.id ? getRandomCCTVVideo(event.id) : getRandomCCTVVideo()}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Live 상태 오버레이 (CLIP 라벨 제거) */}
            <div className="absolute top-2 left-2 flex gap-2" style={{ zIndex: 10 }}>
              <span className="px-2 py-0.5 bg-red-500/90 text-white text-xs font-semibold rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                LIVE
              </span>
            </div>
            
            {/* 플레이 타임라인과 인디케이터 */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3" style={{ zIndex: 10 }}>
              {/* 타임라인 */}
              <div className="relative w-full h-1 bg-gray-600/50 rounded-full mb-2 cursor-pointer flex items-center">
                {/* 재생 진행 바 */}
                <div 
                  className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
                  style={{ width: '35%' }}
                ></div>
                {/* 재생 인디케이터 */}
                <div 
                  className="absolute w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg"
                  style={{ left: '35%', top: '50%', transform: 'translate(-50%, -50%)' }}
                ></div>
              </div>
              {/* 시간 표시 */}
              <div className="flex items-center justify-between text-white text-xs">
                <span>00:12</span>
                <span className="text-gray-400">00:35</span>
              </div>
            </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {popupPositions.map((position, index) => renderPopup(index, position))}
    </>
  );
};

export default MainDriftnetPopup;
