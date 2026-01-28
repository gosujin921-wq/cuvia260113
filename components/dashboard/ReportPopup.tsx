import React from 'react';
import { Icon } from '@iconify/react';
import { Event } from '@/types';

interface ReportPopupProps {
  event: Event | null;
  onClose: () => void;
  onFastSearchStart?: () => void;
  position?: { top?: number | string; left?: number | string; right?: number | string; bottom?: number | string };
  width?: number;
}

const ReportPopup: React.FC<ReportPopupProps> = ({
  event,
  onClose,
  onFastSearchStart,
  position,
  width = 320,
}) => {
  if (!event) {
    return null;
  }

  const defaultPosition: { top: string; right: string } = { top: '1.25rem', right: '1.25rem' };
  const finalPosition: { top?: number | string; left?: number | string; right?: number | string; bottom?: number | string } = position || defaultPosition;

  const positionStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 1000,
    ...(finalPosition.top !== undefined && { top: typeof finalPosition.top === 'number' ? `${finalPosition.top}px` : finalPosition.top }),
    ...(finalPosition.left !== undefined && { left: typeof finalPosition.left === 'number' ? `${finalPosition.left}px` : finalPosition.left }),
    ...(finalPosition.right !== undefined && { right: typeof finalPosition.right === 'number' ? `${finalPosition.right}px` : finalPosition.right }),
    ...(finalPosition.bottom !== undefined && { bottom: typeof finalPosition.bottom === 'number' ? `${finalPosition.bottom}px` : finalPosition.bottom }),
  };

  return (
    <div style={positionStyle}>
      <div
        className="flex flex-col rounded-lg"
        style={{
          width: `${width}px`,
          background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          border: '3px solid #0066FF',
          boxShadow: '0 0 20px rgba(0, 102, 255, 0.6), 0 0 40px rgba(0, 102, 255, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end px-3 py-1.5 flex-shrink-0">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors focus:outline-none"
            aria-label="닫기"
          >
            <Icon icon="mdi:close" className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 pb-3">
          {/* 상단: 사진과 정보 영역 */}
          <div className="flex gap-3 mb-3">
            {/* 좌측: 사진 영역 */}
            <div className="flex-shrink-0">
              <div 
                className="w-20 h-24 rounded-lg bg-[#0f0f0f] border border-[#31353a] flex items-center justify-center overflow-hidden"
                style={{ borderWidth: '1px' }}
              >
                <Icon icon="mdi:image-outline" className="w-6 h-6 text-gray-600" />
              </div>
            </div>

            {/* 우측: 정보 영역 (레이블-값 구조) */}
            <div className="flex-1 text-gray-200 min-w-0 space-y-2">
              <div>
                <div className="text-[10px] text-gray-400 mb-0.5">이름/나이</div>
                <div className="text-sm font-semibold text-white">김도연 / 22세 (남)</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 mb-0.5">인상착의</div>
                <div className="text-xs text-gray-200 leading-relaxed">회색 후드, 청바지, 흑색 짧은 머리, 176cm, 65kg.</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 mb-0.5">실종 장소/시간</div>
                <div className="text-xs text-gray-200">부천로 245번길 일원, 09:30경</div>
              </div>
            </div>
          </div>

          {/* 레드 박스: 장애 있음, 긴급 수색 요망 */}
          <div className="mb-3 rounded-lg p-2.5 bg-red-500/20 border border-red-500/60">
            <div className="text-xs font-semibold text-red-400">
              장애 있음. 긴급 수색 요망.
            </div>
          </div>

          {/* 버튼 */}
          <button
            onClick={() => {
              if (onFastSearchStart) {
                onFastSearchStart();
              }
            }}
            className="w-full px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 focus:outline-none flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #0066FF 0%, #8A2BE2 50%, #ff8566 100%)',
            }}
          >
            <Icon icon="mdi:magnify" className="w-4 h-4" />
            <span>고속검색 시작</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportPopup;
