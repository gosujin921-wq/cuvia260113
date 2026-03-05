import { Icon } from "@iconify/react";

/** 도시 교통 돌발정보 섹션 - 이미지 디자인 기반 */
const TRAFFIC_INCIDENT_VIDEOS = [
  "/fastsearch_img/qs_img_05_n.mp4",
  "/fastsearch_img/qs_img_11_n.mp4",
  "/fastsearch_img/qs_img_15_n.mp4",
  "/fastsearch_img/qs_img_21_y.mp4",
  "/fastsearch_img/qs_img_25_y.mp4",
  "/fastsearch_img/qs_img_30_y.mp4",
  "/fastsearch_img/qs_img_40_y.mp4",
  "/fastsearch_img/qs_img_47_y.mp4",
  "/fastsearch_img/qs_img_51_y.mp4",
  "/fastsearch_img/qs_img_59_y.mp4",
];

const DEFAULT_INCIDENT = {
  roadDirection: "강변북로 일산방향",
  roadName: "강변북로",
  section: "잠실철교 → 잠실대교",
  content: "버스사고",
  occurrenceTime: "2026-03-05 08:30",
  endTime: "미정",
  control: "3/4차로",
};

interface TrafficIncidentSectionProps {
  /** 영상 소스 (미지정 시 fastsearch_img 중 랜덤) */
  videoSrc?: string;
}

export const TrafficIncidentSection = ({ videoSrc }: TrafficIncidentSectionProps) => {
  const videoUrl = videoSrc ?? TRAFFIC_INCIDENT_VIDEOS[0];

  return (
    <div
      className="rounded-lg p-4 gradient-border-left-top flex flex-col"
      style={{
        flexShrink: 0,
        background: "linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white text-sm font-semibold">도시 교통 돌발 정보</h3>
        <span className="text-amber-400 text-xs font-medium">{DEFAULT_INCIDENT.roadDirection}</span>
      </div>

      {/* 본문: 사고 정보 + 썸네일 영상 */}
      <div className="flex gap-2 p-3 bg-[#393a42] rounded-lg min-w-0">
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* 아이콘 + 위치 */}
          <div className="flex items-start gap-2">
            <div
              className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded"
              style={{ background: "rgba(220, 38, 38, 0.9)" }}
            >
              <Icon icon="mdi:car-brake-alert" className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="text-white text-xs font-medium truncate">{DEFAULT_INCIDENT.roadName}</span>
              <span className="text-gray-400 text-xs truncate">{DEFAULT_INCIDENT.section}</span>
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="flex flex-col gap-1">
            <div className="flex gap-2 text-xs">
              <span className="text-blue-400 flex-shrink-0">내용</span>
              <span className="text-gray-300 truncate">{DEFAULT_INCIDENT.content}</span>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="text-blue-400 flex-shrink-0">발생시각</span>
              <span className="text-gray-300 truncate">{DEFAULT_INCIDENT.occurrenceTime}</span>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="text-blue-400 flex-shrink-0">종료시각</span>
              <span className="text-gray-300 truncate">{DEFAULT_INCIDENT.endTime}</span>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="text-blue-400 flex-shrink-0">통제</span>
              <span className="text-gray-300 truncate">{DEFAULT_INCIDENT.control}</span>
            </div>
          </div>
        </div>

        {/* 우측: 영상 썸네일 */}
        <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-black">
          <video
            src={videoUrl}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            autoPlay
            aria-label="교통 상황 영상"
          />
        </div>
      </div>
    </div>
  );
};
