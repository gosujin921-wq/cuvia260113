import { useRef, useEffect } from 'react';
import { getRandomCCTVVideo } from '@/lib/cctv-video-utils';

interface BottomPanelProps {
  showCCTV: boolean;
  hideControls: boolean;
  leftPanelWidth: number;
  windowWidth: number;
  cctvScrollContainerRef: React.RefObject<HTMLDivElement | null>;
  isUserScrollingRef: React.MutableRefObject<boolean>;
  userScrollTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  autoScrollIntervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
}

const BottomPanel = ({
  showCCTV,
  hideControls,
  leftPanelWidth,
  windowWidth,
  cctvScrollContainerRef,
  isUserScrollingRef,
  userScrollTimeoutRef,
  autoScrollIntervalRef,
}: BottomPanelProps) => {
  const rightPanelWidth = 370;
  const panelGap = 16;
  const verticalPadding = 16;
  const cctvList = ['CCTV-V-1', 'CCTV-V-2', 'CCTV-V-3', 'CCTV-V-4'];
  const gap = 12;
  const paddingHorizontal = 16;
  const totalPaddingWidth = paddingHorizontal * 2;
  
  // CCTV 패널 좌우 여백 동일하게
  const leftPanelGap = 20; // 좌측 패널과의 여백
  const rightPanelGap = 20; // 우측 패널과의 여백
  const availableWidth = windowWidth - leftPanelWidth - rightPanelWidth - leftPanelGap - rightPanelGap;
  
  // 패널 높이 고정 (기존 4개 기준 높이 유지)
  const fixedItemHeight = 150; // 고정 높이
  const minItemWidth = 200; // 최소 아이템 너비
  
  // 표시할 아이템 개수 계산
  const calculateVisibleCount = () => {
    const minWidthForN = (n: number) => (minItemWidth * n) + (gap * (n - 1)) + totalPaddingWidth;
    let maxCount = 1;
    for (let i = 1; i <= 10; i++) {
      if (minWidthForN(i) <= availableWidth) {
        maxCount = i;
      } else {
        break;
      }
    }
    return Math.max(1, maxCount);
  };
  
  const visibleCount = calculateVisibleCount();
  const totalGapWidth = gap * (visibleCount - 1);
  const itemWidth = Math.floor((availableWidth - totalGapWidth - totalPaddingWidth) / visibleCount);
  const itemHeight = fixedItemHeight; // 고정 높이 사용

  // 자동 스크롤 로직
  useEffect(() => {
    if (!showCCTV || hideControls) {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      return;
    }

    const startAutoScroll = () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }

      autoScrollIntervalRef.current = setInterval(() => {
        if (cctvScrollContainerRef.current && !isUserScrollingRef.current) {
          const container = cctvScrollContainerRef.current;
          const totalItemWidth = itemWidth + gap;
          const oneSetWidth = cctvList.length * totalItemWidth;
          const currentScroll = container.scrollLeft;
          const nextScroll = currentScroll + totalItemWidth;
          
          if (nextScroll >= oneSetWidth * 2 - 10) {
            container.scrollLeft = oneSetWidth + (nextScroll - oneSetWidth * 2);
          } else {
            container.scrollLeft = nextScroll;
          }
        }
      }, 3000);
    };

    const container = cctvScrollContainerRef.current;
    if (container) {
      const totalItemWidth = itemWidth + gap;
      const oneSetWidth = cctvList.length * totalItemWidth;
      setTimeout(() => {
        if (container) {
          container.scrollLeft = oneSetWidth;
        }
      }, 100);
      startAutoScroll();
    }

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
        userScrollTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCCTV, hideControls, windowWidth, leftPanelWidth]);

  if (!showCCTV) {
    return null;
  }

  return (
    <div
      className="absolute transition-all duration-500 ease-in-out"
      style={{ 
        left: `${leftPanelWidth + leftPanelGap}px`,
        right: `${rightPanelWidth + rightPanelGap}px`,
        bottom: '16px',
        top: 'auto',
        zIndex: 200,
        transform: hideControls ? 'translateY(136px)' : 'translateY(0)',
        opacity: hideControls ? 0 : 1,
      }}
    >
      <div className="glass rounded-t-lg" style={{ height: `${itemHeight + (verticalPadding * 2)}px`, width: '100%', paddingTop: `${verticalPadding}px`, paddingBottom: `${verticalPadding}px`, paddingLeft: `${paddingHorizontal}px`, paddingRight: `${paddingHorizontal}px`, overflow: 'hidden' }}>
        <div className="shine" />
        <div 
          ref={cctvScrollContainerRef}
          className="flex items-center relative z-10"
          style={{ 
            height: `${itemHeight}px`,
            gap: `${gap}px`,
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
            scrollBehavior: 'smooth',
          }}
          onScroll={(e) => {
            const target = e.currentTarget;
            const scrollLeft = target.scrollLeft;
            const totalItemWidth = itemWidth + gap;
            const oneSetWidth = cctvList.length * totalItemWidth;
            
            isUserScrollingRef.current = true;
            if (userScrollTimeoutRef.current) {
              clearTimeout(userScrollTimeoutRef.current);
            }
            userScrollTimeoutRef.current = setTimeout(() => {
              isUserScrollingRef.current = false;
            }, 2000);
            
            if (scrollLeft >= oneSetWidth * 2 - 10) {
              target.scrollLeft = oneSetWidth + (scrollLeft - oneSetWidth * 2);
            }
            else if (scrollLeft <= 10) {
              target.scrollLeft = oneSetWidth + scrollLeft;
            }
          }}
        >
          {[...cctvList, ...cctvList, ...cctvList].map((cctvId, index) => (
            <div
              key={`bottom-cctv-${index}-${cctvId}`}
              className="relative rounded overflow-hidden border-2 border-white/40 hover:border-blue-400/70 flex-shrink-0 shadow-md"
              style={{ width: `${itemWidth}px`, height: `${itemHeight}px` }}
            >
              <video
                src={getRandomCCTVVideo(cctvId)}
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
              <div className="absolute inset-x-0 bottom-0 bg-white/80 px-2 py-0.5" style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                <div className="text-gray-900 text-[10px] font-semibold truncate" title={cctvId}>
                  {cctvId}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .glass {
          border-radius: 28px;
          position: relative;
          overflow: hidden;
          
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.2);
          
          backdrop-filter: blur(18px) saturate(140%);
          -webkit-backdrop-filter: blur(18px) saturate(140%);
          
          box-shadow:
            0 18px 40px rgba(0,0,0,.18),
            inset 0 1px 0 rgba(255,255,255,.25);
        }

        .glass::before {
          content: "";
          position: absolute;
          inset: -40%;
          background:
            radial-gradient(circle at 30% 30%, rgba(255,255,255,.55), transparent 40%),
            radial-gradient(circle at 70% 60%, rgba(255,255,255,.25), transparent 45%),
            linear-gradient(120deg, rgba(255,255,255,.25), rgba(255,255,255,0) 60%);
          transform: rotate(12deg);
          filter: blur(2px);
          opacity: .85;
        }

        .glass::after {
          content: "";
          position: absolute;
          inset: -20%;
          background:
            radial-gradient(circle at 20% 20%, rgba(255,255,255,.20), transparent 35%),
            radial-gradient(circle at 80% 70%, rgba(255,255,255,.16), transparent 40%);
          mix-blend-mode: screen;
          filter: blur(10px);
          animation: floaty 6s ease-in-out infinite;
          transform: translate3d(0,0,0);
        }

        .glass .shine {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='.22'/%3E%3C/svg%3E");
          opacity: .18;
          mix-blend-mode: overlay;
          pointer-events: none;
        }

        @keyframes floaty {
          0%   { transform: translate(-2%, -1%) scale(1.02); }
          50%  { transform: translate( 2%,  1%) scale(1.03); }
          100% { transform: translate(-2%, -1%) scale(1.02); }
        }
      `}</style>
    </div>
  );
};

export default BottomPanel;
