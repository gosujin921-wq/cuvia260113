import React from 'react';
import { Icon } from '@iconify/react';
import { Event } from '@/types';
import { getRandomCCTVVideo } from '@/lib/cctv-video-utils';
import CCTVIcon from '@/components/common/CCTVIcon';
import { CCTV_TITLES } from './cctv-titles';

interface CCTVMeshTrackingProps {
  event: Event | null;
  onClose: () => void;
  cctvIndex?: number;
  position?: { top?: number | string; left?: number | string; right?: number | string; bottom?: number | string };
  width?: number;
}

export { CCTV_TITLES };

const CCTVMeshTracking: React.FC<CCTVMeshTrackingProps> = ({ event, onClose, cctvIndex, position, width = 420 }) => {
  if (!event) return null;

  const isTheftEvent = event.title.includes('상가 절도 의심') || event.title.includes('현금 절취 포착');
  if (isTheftEvent) return null;

  const cctvTitle = cctvIndex !== undefined && cctvIndex >= 1 && cctvIndex <= 20 
    ? CCTV_TITLES[cctvIndex - 1] 
    : 'CCTV 투망';

  const defaultPosition: { top: string; right: string } = { top: '1.25rem', right: '1.25rem' };
  const finalPosition = position || defaultPosition;

  const positionStyle: React.CSSProperties = position === undefined 
    ? {}
    : {
        position: 'absolute',
        zIndex: 1000,
        ...(finalPosition.top !== undefined && { top: typeof finalPosition.top === 'number' ? `${finalPosition.top}px` : finalPosition.top }),
        ...('left' in finalPosition && finalPosition.left !== undefined && { left: typeof finalPosition.left === 'number' ? `${finalPosition.left}px` : finalPosition.left }),
        ...(finalPosition.right !== undefined && { right: typeof finalPosition.right === 'number' ? `${finalPosition.right}px` : finalPosition.right }),
        ...('bottom' in finalPosition && finalPosition.bottom !== undefined && { bottom: typeof finalPosition.bottom === 'number' ? `${finalPosition.bottom}px` : finalPosition.bottom }),
      };

  const isMainPopup = cctvIndex === 11;

  return (
    <div style={positionStyle}>
      <div
        className="gradient-border-left-top flex flex-col rounded-lg"
        style={{ 
          width: `${width}px`,
          background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          ...(isMainPopup ? {
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3)',
          } : {}),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-3 py-1.5 flex-shrink-0"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <CCTVIcon className="w-4 h-4 text-blue-400" />
            <h3>{cctvTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors focus:outline-none"
            aria-label="닫기"
          >
            <Icon icon="mdi:close" className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-shrink-0">
          <div className="px-3 pb-3">
          <div className="w-full bg-[#0f0f0f] border border-[#31353a] rounded-md overflow-hidden relative" style={{ borderWidth: '1px', aspectRatio: '16/9' }}>
          <video 
            src={event.id ? getRandomCCTVVideo(event.id) : getRandomCCTVVideo()}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2" style={{ zIndex: 10 }}>
            <span className="px-2 py-0.5 bg-red-500/90 text-white text-xs font-semibold rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              LIVE
            </span>
          </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CCTVMeshTracking;
