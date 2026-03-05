import { Icon } from '@iconify/react';

type TrafficStatusType = 'congestion' | 'slow' | 'smooth' | 'unknown';

interface RouteSegment {
  location: string;
  distance: string;
  status: TrafficStatusType;
  statusLabel: string;
  speed: string;
  hasThumbnail?: boolean;
}

const DEFAULT_SEGMENTS: RouteSegment[] = [
  { location: '동작대교', distance: '3.4km', status: 'congestion', statusLabel: '정체', speed: '9km/h', hasThumbnail: true },
  { location: '사당역', distance: '1.1km', status: 'slow', statusLabel: '서행', speed: '18km/h', hasThumbnail: true },
  { location: '사당IC', distance: '1.2km', status: 'smooth', statusLabel: '원활', speed: '38km/h', hasThumbnail: false },
  { location: '남태령고개', distance: '1.4km', status: 'smooth', statusLabel: '원활', speed: '48km/h', hasThumbnail: true },
  { location: '관문4', distance: '', status: 'unknown', statusLabel: '', speed: '', hasThumbnail: false },
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

/** 구간별 교통 흐름: 위치·거리, 정체/서행/원활, 속도, 썸네일 영역 */
export const TrafficRouteStatusSection = () => {
  return (
    <div
      className="rounded-lg p-4 gradient-border-left-top flex flex-col"
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
        <h3 className="text-white text-sm font-semibold">구간별 교통 흐름</h3>
        <span className="text-gray-400 text-xs">실시간</span>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="flex gap-2">
          {/* 왼쪽 연속 컬러 바 (세로) */}
          <div className="w-1.5 flex-shrink-0 flex flex-col rounded-full overflow-hidden">
            {DEFAULT_SEGMENTS.map((seg, idx) => (
              <div
                key={idx}
                className={`flex-1 min-h-[32px] ${statusBarColor[seg.status]}`}
                style={{ flex: seg.status === 'unknown' ? 0.5 : 1 }}
              />
            ))}
          </div>
          {/* 오른쪽 콘텐츠 영역 */}
          <div className="flex-1 min-w-0 flex flex-col">
            {DEFAULT_SEGMENTS.map((seg, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between gap-2 py-2.5 min-h-[32px] ${idx < DEFAULT_SEGMENTS.length - 1 ? 'border-b border-gray-600/50' : ''}`}
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
                <div className="w-12 h-9 flex-shrink-0 rounded overflow-hidden bg-[#393a42] flex items-center justify-center">
                  {seg.hasThumbnail ? (
                    <img src="/cctv_img/001.jpg" alt="" className="w-full h-full object-cover" />
                  ) : seg.status !== 'unknown' ? (
                    <Icon icon="mdi:cctv-off" className="w-5 h-5 text-gray-500" aria-hidden="true" />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
