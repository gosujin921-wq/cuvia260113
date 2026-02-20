import React from 'react';

interface SharedVideoPlayerProps {
  src: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** CCTV/후보 변경 시 새 엘리먼트 마운트용 (PredictedCCTV 등) */
  videoKey?: string;
  /** 영상 종료 시 콜백 (고속검색 루프 등) */
  onEnded?: () => void;
  ariaLabel?: string;
  className?: string;
}

/**
 * 고속검색/객체추적 팝업 공통 비디오 플레이어.
 * src를 렌더 시점에 바로 전달하여 로딩 지연 없이 바로 재생.
 */
const SharedVideoPlayer: React.FC<SharedVideoPlayerProps> = ({
  src,
  videoRef,
  videoKey,
  onEnded,
  ariaLabel = 'CCTV 영상',
  className = 'w-full h-full object-contain',
}) => {
  if (!src || src === '') {
    return (
      <div className={`${className} bg-black flex items-center justify-center`} aria-label={ariaLabel}>
        <span className="text-gray-500 text-sm">영상 로드 중</span>
      </div>
    );
  }
  return (
    <video
      key={videoKey}
      ref={videoRef}
      src={src}
      className={className}
      muted
      playsInline
      autoPlay
      preload="auto"
      aria-label={ariaLabel}
      onEnded={onEnded}
    />
  );
};

export default SharedVideoPlayer;
