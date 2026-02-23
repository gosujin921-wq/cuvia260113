import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { Event } from '@/types';

const REPORT_POPUP_IMAGE_SRC = '/people.jpg';

interface ReportPopupProps {
  event: Event | null;
  onClose: () => void;
  onFastSearchStart?: () => void;
  /** 초기 화면일 때만 true. 고속검색 화면에서는 false → 고속검색 시작 버튼 숨김 */
  showFastSearchStartButton?: boolean;
  /** 팝업 높이 변경 시 호출 (에이전트 팝업 위치 계산용) */
  onLayout?: (height: number) => void;
  position?: { top?: number | string; left?: number | string; right?: number | string; bottom?: number | string };
  width?: number;
}

const ReportPopup: React.FC<ReportPopupProps> = ({
  event,
  onClose,
  onFastSearchStart,
  showFastSearchStartButton = true,
  onLayout,
  position,
  width = 420,
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [event?.id]);

  // 선로드된 이미지(캐시)가 있으면 즉시 표시
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
          {/* 상단: 사진과 정보 영역 */}
          <div className="flex gap-3 mb-3">
            {/* 좌측: 사진 영역 */}
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

            {/* 우측: 정보 영역 (레이블-값 구조) */}
            <div className="flex-1 text-gray-200 min-w-0 space-y-3">
              <div>
                <div className="text-xs text-gray-400 mb-1">이름/나이</div>
                <div className="text-base font-semibold text-white">김도연 / 22세 (남)</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">인상착의</div>
                <div className="text-sm text-gray-200 leading-relaxed">회색 후드, 청바지, 흑색 짧은 머리, 176cm, 65kg.</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">실종 장소/시간</div>
                <div className="text-sm text-gray-200">은하동 125-46 일원, 09:30경</div>
              </div>
            </div>
          </div>

          {/* 레드 박스: 장애 있음, 긴급 수색 요망 */}
          <div className="mb-3 rounded-lg p-3 bg-red-500/20 border border-red-500/60">
            <div className="text-sm font-semibold text-red-400">
              장애 있음. 긴급 수색 요망.
            </div>
          </div>

          {/* 고속검색 시작 버튼: 초기 화면에서만 표시, 고속검색 화면에서는 숨김 */}
          {showFastSearchStartButton && (
            <button
              id="fast-search-start-button"
              onClick={() => {
                if (onFastSearchStart) {
                  onFastSearchStart();
                }
              }}
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
