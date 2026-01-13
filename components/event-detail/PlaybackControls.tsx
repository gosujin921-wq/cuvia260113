'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { getPTZButtonClassName } from '@/components/shared/styles';

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onRewind: () => void;
  onPlayPause: () => void;
  onFastForward: () => void;
  onTimeChange: (time: number) => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  onRewind,
  onPlayPause,
  onFastForward,
  onTimeChange,
}) => {
  return (
    <>
      {/* 재생 컨트롤 버튼 */}
      <div className="bg-[#1a1a1a] border border-[#31353a] rounded-lg p-4">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onRewind}
            className={`${getPTZButtonClassName(false)} rounded`}
            aria-label="10초 뒤로"
          >
            <Icon icon="mdi:rewind-10" className="w-5 h-5" />
          </button>
          <button
            onClick={onPlayPause}
            className={`${getPTZButtonClassName(false)} rounded p-3`}
            aria-label={isPlaying ? "일시정지" : "재생"}
          >
            <Icon icon={isPlaying ? "mdi:pause" : "mdi:play"} className="w-6 h-6" />
          </button>
          <button
            onClick={onFastForward}
            className={`${getPTZButtonClassName(false)} rounded`}
            aria-label="10초 앞으로"
          >
            <Icon icon="mdi:fast-forward-10" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 재생 타임라인 */}
      <div className="bg-[#1a1a1a] border border-[#31353a] rounded-lg p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={(e) => onTimeChange(Number(e.target.value))}
              className="w-full h-2 bg-[#0f0f0f] rounded-full appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / (duration || 1)) * 100}%, #0f0f0f ${(currentTime / (duration || 1)) * 100}%, #0f0f0f 100%)`
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

