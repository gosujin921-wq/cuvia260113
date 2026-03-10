import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { Event } from '@/types';

const REPORT_POPUP_IMAGE_SRC = '/hijacking2/people01.png';

interface ReportPopupProps {
  event: Event | null;
  onClose: () => void;
  onFastSearchStart?: () => void;
  showFastSearchStartButton?: boolean;
  onLayout?: (height: number) => void;
  position?: { top?: number | string; left?: number | string; right?: number | string; bottom?: number | string };
  width?: number;
  eventDetectedTime?: string;
}

const ReportPopup: React.FC<ReportPopupProps> = ({
  event,
  onClose,
  onFastSearchStart,
  showFastSearchStartButton = true,
  onLayout,
  position,
  width = 420,
  eventDetectedTime = '',
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [event?.id]);

  useEffect(() => {
    if (!event?.id || imageError) return;
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setImageLoaded(true);
    }
  }, [event?.id, imageError]);

  useEffect(() => {
    if (!onLayout || !rootRef.current) return;
    const el = rootRef.current;
    const ro = new ResizeObserver(() => {
      const h = el.getBoundingClientRect().height;
      onLayout(h);
    });
    ro.observe(el);
    onLayout(el.getBoundingClientRect().height);
    return () => ro.disconnect();
  }, [onLayout]);

  if (!event) return null;

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

  const recentTime = (() => {
    if (!eventDetectedTime) return '';
    const t = eventDetectedTime.split(':').map(Number);
    const d = new Date();
    d.setHours(t[0], t[1] - 2, t[2]);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  })();

  return (
    <div ref={rootRef} style={positionStyle}>
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
        <div className="flex items-center justify-end px-4 py-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors focus:outline-none"
            aria-label="닫기"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 pb-4">
          <div className="flex gap-3 mb-3">
            <div className="flex-shrink-0">
              <div
                className="w-40 h-48 rounded-lg bg-[#0f0f0f] border border-[#31353a] flex items-center justify-center overflow-hidden"
                style={{ borderWidth: '1px' }}
              >
                {imageError ? (
                  <Icon icon="mdi:image-outline" className="w-10 h-10 text-gray-600" aria-hidden />
                ) : (
                  <img
                    ref={imgRef}
                    src={REPORT_POPUP_IMAGE_SRC}
                    alt="신고 대상 인물"
                    className={`w-full h-full object-cover object-center transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    fetchPriority="high"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                  />
                )}
              </div>
            </div>

            <div className="flex-1 text-gray-200 min-w-0 space-y-3">
              <div>
                <div className="text-xs text-gray-400 mb-1">대상</div>
                <div className="text-base font-semibold text-white">성인 남성 1명 + 성인 여성 1명</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">의심 정황</div>
                <div className="text-sm text-gray-200 leading-relaxed">여성이 비자발적으로 끌려가듯 이동, 주변 경계 동작 반복</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">최초 포착 / 최근 포착</div>
                <div className="text-sm text-gray-200">별빛A-444 {eventDetectedTime} · 별빛A-230 {recentTime}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">현재 이동 방향</div>
                <div className="text-sm text-gray-200">은하초교 방향 골목 진입</div>
              </div>
            </div>
          </div>

          <div className="mb-3 rounded-lg p-3 bg-red-500/20 border border-red-500/60">
            <div className="text-sm font-semibold text-red-400">
              추천 대응 : 112 전파 권고
            </div>
          </div>

          {showFastSearchStartButton && (
            <button
              id="fast-search-start-button"
              onClick={() => onFastSearchStart?.()}
              className="w-full px-4 py-3 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 focus:outline-none flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #0066FF 0%, #8A2BE2 50%, #ff8566 100%)',
              }}
            >
              <Icon icon="mdi:magnify" className="w-4 h-4" />
              <span>고속검색 시작</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportPopup;
