import React from 'react';
import { Icon } from '@iconify/react';

interface TrackingBoxControllerProps {
  currentTime: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isAutoMode: boolean;
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onResize: (type: 'width' | 'height', delta: number) => void;
}

const TrackingBoxController: React.FC<TrackingBoxControllerProps> = ({
  currentTime,
  position,
  size,
  isAutoMode,
  onMove,
  onResize,
}) => {
  const formatTime = () => {
    const mins = Math.floor(currentTime / 60);
    const secs = Math.floor(currentTime % 60);
    const frames = Math.floor((currentTime % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  };

  return (
    <div className="mt-4 bg-[#0f0f0f] border border-[#31353a] rounded-lg p-3" style={{ borderWidth: '1px' }}>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">추적 박스 컨트롤</h3>
      
      <div className="space-y-2">
        {/* 현재 시간 표시 */}
        <div className="text-sm font-mono text-blue-400 text-center">
          {formatTime()}
        </div>
        
        <div className="flex items-center gap-3">
          {/* 위치 이동 컨트롤 */}
          <div className="flex-1">
            <div className="text-xs text-gray-400 mb-1">위치</div>
            <div className="flex flex-col items-center gap-0.5">
              <button
                type="button"
                onClick={() => onMove('up')}
                className="w-7 h-7 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                aria-label="위로"
              >
                <Icon icon="mdi:arrow-up" className="w-4 h-4 text-white" />
              </button>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => onMove('left')}
                  className="w-7 h-7 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  aria-label="왼쪽"
                >
                  <Icon icon="mdi:arrow-left" className="w-4 h-4 text-white" />
                </button>
                <div className="w-7 h-7 flex items-center justify-center bg-gray-800 rounded">
                  <Icon icon="mdi:cursor-move" className="w-4 h-4 text-gray-400" />
                </div>
                <button
                  type="button"
                  onClick={() => onMove('right')}
                  className="w-7 h-7 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  aria-label="오른쪽"
                >
                  <Icon icon="mdi:arrow-right" className="w-4 h-4 text-white" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => onMove('down')}
                className="w-7 h-7 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                aria-label="아래로"
              >
                <Icon icon="mdi:arrow-down" className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
          
          {/* 크기 조절 컨트롤 */}
          <div className="flex-1">
            <div className="text-xs text-gray-400 mb-1">크기</div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500 w-8">너비</span>
                <button
                  type="button"
                  onClick={() => onResize('width', -10)}
                  className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-white text-xs"
                  aria-label="너비 축소"
                >
                  <Icon icon="mdi:minus" className="w-3 h-3 mx-auto" />
                </button>
                <button
                  type="button"
                  onClick={() => onResize('width', 10)}
                  className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-white text-xs"
                  aria-label="너비 확대"
                >
                  <Icon icon="mdi:plus" className="w-3 h-3 mx-auto" />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500 w-8">높이</span>
                <button
                  type="button"
                  onClick={() => onResize('height', -10)}
                  className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-white text-xs"
                  aria-label="높이 축소"
                >
                  <Icon icon="mdi:minus" className="w-3 h-3 mx-auto" />
                </button>
                <button
                  type="button"
                  onClick={() => onResize('height', 10)}
                  className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-white text-xs"
                  aria-label="높이 확대"
                >
                  <Icon icon="mdi:plus" className="w-3 h-3 mx-auto" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* 현재 값 표시 */}
        <div className="pt-2 border-t border-gray-700 text-xs text-gray-500 space-y-0.5">
          <div>위치: X: {position.x}px, Y: {position.y}px</div>
          <div>크기: {size.width}px × {size.height}px</div>
          <div>모드: {isAutoMode ? '자동' : '수동'}</div>
        </div>
      </div>
    </div>
  );
};

export default TrackingBoxController;
