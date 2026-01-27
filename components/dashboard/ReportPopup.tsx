import React from 'react';
import { Icon } from '@iconify/react';
import { Event } from '@/types';

interface ReportPopupProps {
  event: Event | null;
  onClose: () => void;
  position?: { top?: number | string; left?: number | string; right?: number | string; bottom?: number | string };
  width?: number;
}

const ReportPopup: React.FC<ReportPopupProps> = ({
  event,
  onClose,
  position,
  width = 300,
}) => {
  if (!event) {
    return null;
  }

  const defaultPosition: { top: string; right: string } = { top: '1.25rem', right: '1.25rem' };
  const finalPosition = position || defaultPosition;

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

        <div className="px-3 pb-3 text-gray-200">
          <div 
            className="text-sm text-gray-100 leading-relaxed mb-3 whitespace-pre-line rounded-lg p-3 bg-[#393a42] border border-[#31353a]"
            style={{ borderWidth: '1px' }}
          >
            김도연(남, 22세, 장애 있음).
2026-01-07 오전 9시 30분경 원미구 부천로 245번길 일원에서 행방불명.
176cm/65kg, 마름, 계란형, 흑색 짧은 머리, 회색 상의에 청바지.
          </div>
          <button
            onClick={() => {
              // 고속 검색 시작 로직
            }}
            className="w-full px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 focus:outline-none"
            style={{
              background: 'linear-gradient(135deg, #0066FF 0%, #8A2BE2 50%, #ff8566 100%)',
            }}
          >
            고속 검색 시작
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportPopup;
