import { Icon } from '@iconify/react';
import { useState, useEffect, useRef } from 'react';
import { getRandomCCTVVideo } from '@/lib/cctv-video-utils';

const SCROLL_DURATION_MS = 3500;
const PAUSE_AFTER_SCROLL_MS = 800;
const FALLBACK_INTERVAL_MS = 5000;

type TrafficStatusType = 'congestion' | 'slow' | 'smooth' | 'unknown';

interface RouteSegment {
  location: string;
  distance: string;
  status: TrafficStatusType;
  statusLabel: string;
  speed: string;
  hasThumbnail?: boolean;
}

/** 1번째: 동작대교 → 관문4 방향 */
const ROUTE_SET_1: RouteSegment[] = [
  { location: '동작대교', distance: '3.4km', status: 'congestion', statusLabel: '정체', speed: '9km/h', hasThumbnail: true },
  { location: '사당역', distance: '1.1km', status: 'slow', statusLabel: '서행', speed: '18km/h', hasThumbnail: true },
  { location: '사당IC', distance: '1.2km', status: 'smooth', statusLabel: '원활', speed: '38km/h', hasThumbnail: false },
  { location: '남태령고개', distance: '1.4km', status: 'smooth', statusLabel: '원활', speed: '48km/h', hasThumbnail: true },
  { location: '관문4', distance: '', status: 'unknown', statusLabel: '', speed: '', hasThumbnail: false },
];

/** 2번째: 관문4 → 동작대교 방향 (이미지 반영) */
const ROUTE_SET_2: RouteSegment[] = [
  { location: '관문4', distance: '1.5km', status: 'smooth', statusLabel: '원활', speed: '42km/h', hasThumbnail: true },
  { location: '남태령고개', distance: '1.2km', status: 'smooth', statusLabel: '원활', speed: '33km/h', hasThumbnail: true },
  { location: '사당IC', distance: '1.1km', status: 'congestion', statusLabel: '정체', speed: '11km/h', hasThumbnail: false },
  { location: '사당역', distance: '3.4km', status: 'slow', statusLabel: '서행', speed: '18km/h', hasThumbnail: true },
  { location: '동작대교', distance: '', status: 'unknown', statusLabel: '', speed: '', hasThumbnail: false },
];

/** 3번째: 과천우면산로/반포대로 서울→과천 방향 */
const ROUTE_SET_3: RouteSegment[] = [
  { location: '반포대교', distance: '0.9km', status: 'congestion', statusLabel: '정체', speed: '7km/h', hasThumbnail: false },
  { location: '서울성모병원', distance: '1.2km', status: 'congestion', statusLabel: '정체', speed: '6km/h', hasThumbnail: true },
  { location: '서초역사거리', distance: '1.1km', status: 'congestion', statusLabel: '정체', speed: '11km/h', hasThumbnail: true },
  { location: '우면산터널', distance: '2.3km', status: 'smooth', statusLabel: '원활', speed: '50km/h', hasThumbnail: false },
  { location: '선암IC', distance: '', status: 'unknown', statusLabel: '', speed: '', hasThumbnail: false },
];

/** 4번째: 과천우면산로/반포대로 과천→서울 방향 */
const ROUTE_SET_4: RouteSegment[] = [
  { location: '선암IC', distance: '2.3km', status: 'smooth', statusLabel: '원활', speed: '52km/h', hasThumbnail: false },
  { location: '우면산터널', distance: '1.1km', status: 'slow', statusLabel: '서행', speed: '18km/h', hasThumbnail: false },
  { location: '서초역사거리', distance: '1.2km', status: 'congestion', statusLabel: '정체', speed: '5km/h', hasThumbnail: true },
  { location: '서울성모병원', distance: '0.9km', status: 'congestion', statusLabel: '정체', speed: '12km/h', hasThumbnail: true },
  { location: '반포대교', distance: '', status: 'unknown', statusLabel: '', speed: '', hasThumbnail: false },
];

const ROUTE_SETS = [ROUTE_SET_1, ROUTE_SET_2, ROUTE_SET_3, ROUTE_SET_4];

/** 카드별 노선 문구: [노선명, 방향] */
const ROUTE_LABELS: [string, string][] = [
  ['과천대로/동작대로', '과천대로→동작대로'],
  ['과천대로/동작대로', '동작대로→과천대로'],
  ['과천우면산로/반포대로', '서울→과천'],
  ['과천우면산로/반포대로', '과천→서울'],
];

const statusBarColor: Record<TrafficStatusType, string> = {
  congestion: 'bg-red-500',
  slow: 'bg-amber-500',
  smooth: 'bg-green-500',
  unknown: 'bg-gray-500',
};

const statusTextColor: Record<TrafficStatusType, string> = {
  congestion: 'text-red-400',
  slow: 'text-amber-400',
  smooth: 'text-green-400',
  unknown: 'text-gray-400',
};

/** 노선별 소통정보: 롤링으로 4개 노선 교차 표시. 스크롤 가능 시 자동 스크롤 후 다음 노선으로 전환. 마우스 호버 시 일시정지 */
export const TrafficRouteStatusSection = () => {
  const [routeIndex, setRouteIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);
  const segments = ROUTE_SETS[routeIndex];

  const goToNextRoute = () => {
    setRouteIndex((prev) => (prev + 1) % ROUTE_SETS.length);
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = 0;
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    let rafId: number | undefined;
    let cancelled = false;

    const waitThenRun = (delayMs: number, callback: () => void) => {
      let accumulated = 0;
      let lastTime = performance.now();

      const tick = () => {
        if (cancelled) return;
        const now = performance.now();
        if (!isHoveredRef.current) {
          accumulated += now - lastTime;
        }
        lastTime = now;

        if (accumulated >= delayMs) {
          callback();
        } else {
          rafId = requestAnimationFrame(tick);
        }
      };
      rafId = requestAnimationFrame(tick);
    };

    const startScrollOrFallback = () => {
      if (cancelled) return;
      const maxScroll = el.scrollHeight - el.clientHeight;

      if (maxScroll <= 0) {
        waitThenRun(FALLBACK_INTERVAL_MS, goToNextRoute);
        return;
      }

      let scrollElapsed = 0;
      let lastTime = performance.now();
      const startScrollTop = el.scrollTop;

      const animateScroll = () => {
        if (cancelled) return;
        const now = performance.now();
        if (!isHoveredRef.current) {
          scrollElapsed += now - lastTime;
        }
        lastTime = now;

        const progress = Math.min(scrollElapsed / SCROLL_DURATION_MS, 1);
        const easeProgress = 1 - (1 - progress) ** 1.5;
        if (!isHoveredRef.current) {
          el.scrollTop = startScrollTop + (maxScroll - startScrollTop) * easeProgress;
        }

        if (progress < 1) {
          rafId = requestAnimationFrame(animateScroll);
        } else {
          waitThenRun(PAUSE_AFTER_SCROLL_MS, goToNextRoute);
        }
      };

      rafId = requestAnimationFrame(animateScroll);
    };

    const timerId = setTimeout(startScrollOrFallback, 150);

    return () => {
      cancelled = true;
      clearTimeout(timerId);
      if (rafId !== undefined) cancelAnimationFrame(rafId);
    };
  }, [routeIndex]);

  const handleMouseEnter = () => { isHoveredRef.current = true; };
  const handleMouseLeave = () => { isHoveredRef.current = false; };

  return (
    <div
      className="rounded-lg p-4 gradient-border-left-top flex flex-col"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        flexShrink: 0,
        flex: 1,
        minHeight: '180px',
        background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white text-sm font-semibold">노선별 소통정보</h3>
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-xs font-medium">{ROUTE_LABELS[routeIndex][0]}</span>
          <span className="text-amber-400 text-xs font-medium">{ROUTE_LABELS[routeIndex][1]}</span>
        </div>
      </div>
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-auto">
        <div className="flex gap-2">
          {/* 왼쪽 연속 컬러 바 (세로) */}
          <div className="w-1.5 flex-shrink-0 flex flex-col rounded-full overflow-hidden">
            {segments.map((seg, idx) => (
              <div
                key={idx}
                className={`flex-1 min-h-[32px] ${statusBarColor[seg.status]}`}
                style={{ flex: seg.status === 'unknown' ? 0.5 : 1 }}
              />
            ))}
          </div>
          {/* 오른쪽 콘텐츠 영역 */}
          <div className="flex-1 min-w-0 flex flex-col">
            {segments.map((seg, idx) => (
              <div
                key={`${routeIndex}-${idx}`}
                className={`flex items-center justify-between gap-2 py-2.5 min-h-[32px] ${idx < segments.length - 1 ? 'border-b border-gray-600/50' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-white text-xs font-medium truncate">{seg.location}</span>
                    {seg.distance && (
                      <span className="text-gray-400 text-xs flex-shrink-0">{seg.distance}</span>
                    )}
                  </div>
                  {seg.statusLabel ? (
                    <span className={`text-xs font-medium ${statusTextColor[seg.status]}`}>
                      {seg.statusLabel} {seg.speed}
                    </span>
                  ) : null}
                </div>
                {idx === segments.length - 1 ? (
                  <div className="w-12 h-9 flex-shrink-0" aria-hidden="true" />
                ) : (
                <div className="w-12 h-9 flex-shrink-0 rounded overflow-hidden bg-[#393a42] flex items-center justify-center">
                  {seg.hasThumbnail ? (
                    <video
                      src={getRandomCCTVVideo(seg.location)}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                      autoPlay
                      aria-label={`${seg.location} 교통 영상`}
                    />
                  ) : (
                    <Icon icon="mdi:cctv-off" className="w-5 h-5 text-gray-500" aria-hidden="true" />
                  )}
                </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
