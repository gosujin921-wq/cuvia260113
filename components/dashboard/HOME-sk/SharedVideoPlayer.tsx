import React from 'react';
import { useTranslation } from 'react-i18next';

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
  ariaLabel,
  className = 'w-full h-full object-contain',
}) => {
  const { t } = useTranslation();
  const resolvedAriaLabel = ariaLabel ?? t('video.cctvAriaLabel');
  if (!src || src === '') {
    return (
      <div className={`${className} bg-black flex items-center justify-center`} aria-label={resolvedAriaLabel}>
        <span className="text-gray-500 text-sm">{t('video.loading')}</span>
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
      preload="metadata"
      aria-label={resolvedAriaLabel}
      onEnded={onEnded}
    />
  );
};

export default SharedVideoPlayer;
