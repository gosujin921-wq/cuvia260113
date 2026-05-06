import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

/** 도시 교통 돌발정보 섹션 - 카드 롤링 */
const TRAFFIC_INCIDENT_VIDEOS = [
  "/cctv_img/cctv5.mov",
  "/cctv_img/cctv6.mov",
  "/cctv_img/cmcseoul.mov",
  "/cctv_img/dongjak.mov",
  "/cctv_img/namtae.mov",
  "/cctv_img/sadang.mov",
  "/cctv_img/seocho_station.mov",
];

interface IncidentCard {
  roadDirection: string;
  roadName: string;
  section: string;
  content: string;
  occurrenceTime: string;
  endTime: string;
  control: string;
  hasThumbnail: boolean;
  icon: string;
}

const INCIDENT_CARDS: IncidentCard[] = [
  {
    roadDirection: "강변북로 일산방향",
    roadName: "강변북로",
    section: "잠실철교 → 잠실대교",
    content: "버스사고",
    occurrenceTime: "2026-03-05 08:30",
    endTime: "미정",
    control: "3/4차로",
    hasThumbnail: true,
    icon: "mdi:car-brake-alert",
  },
  {
    roadDirection: "경부고속도로 서울방향",
    roadName: "경부고속도로",
    section: "안성IC → 안성JC",
    content: "화물차 관련 사고",
    occurrenceTime: "2026-03-05 17:55",
    endTime: "미정",
    control: "5차로",
    hasThumbnail: true,
    icon: "mdi:car-brake-alert",
  },
  {
    roadDirection: "오산시 서부로 화성방향",
    roadName: "오산시 서부로",
    section: "금암교차로 → 가장교차로",
    content: "도로침하",
    occurrenceTime: "2025-07-16 20:18",
    endTime: "미정",
    control: "전차로",
    hasThumbnail: true,
    icon: "mdi:alert-octagon",
  },
  {
    roadDirection: "봉담과천로 과천방향",
    roadName: "봉담과천로",
    section: "과천터널 → 과천IC",
    content: "과천고가교 철거공사로 인한 통제",
    occurrenceTime: "2025-10-28 14:14",
    endTime: "미정",
    control: "전차로",
    hasThumbnail: true,
    icon: "mdi:hammer",
  },
];

const ROLLING_INTERVAL_MS = 5000;

interface TrafficIncidentSectionProps {
  /** 영상 소스 (미지정 시 cctv_img 영상 사용) */
  videoSrc?: string;
}

export const TrafficIncidentSection = ({ videoSrc }: TrafficIncidentSectionProps) => {
  const { t } = useTranslation();
  const [cardIndex, setCardIndex] = useState(0);
  // i18n으로 mock card 데이터 변환 — JSON에 영문이 있으면 사용, 없으면 KO fallback
  const incidentRaw = INCIDENT_CARDS[cardIndex];
  const incident = {
    ...incidentRaw,
    roadDirection: t(`trafficIncident.cards.${cardIndex}.roadDirection`, { defaultValue: incidentRaw.roadDirection }),
    roadName: t(`trafficIncident.cards.${cardIndex}.roadName`, { defaultValue: incidentRaw.roadName }),
    section: t(`trafficIncident.cards.${cardIndex}.section`, { defaultValue: incidentRaw.section }),
    content: t(`trafficIncident.cards.${cardIndex}.content`, { defaultValue: incidentRaw.content }),
    endTime: t(`trafficIncident.cards.${cardIndex}.endTime`, { defaultValue: incidentRaw.endTime }),
    control: t(`trafficIncident.cards.${cardIndex}.control`, { defaultValue: incidentRaw.control }),
  };
  const videoUrl = videoSrc ?? TRAFFIC_INCIDENT_VIDEOS[cardIndex % TRAFFIC_INCIDENT_VIDEOS.length];

  useEffect(() => {
    const interval = setInterval(() => {
      setCardIndex((prev) => (prev + 1) % INCIDENT_CARDS.length);
    }, ROLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

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
        <h3 className="text-white text-sm font-semibold">{t('trafficIncident.title')}</h3>
        <span className="text-amber-400 text-xs font-medium">{incident.roadDirection}</span>
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
              <Icon icon={incident.icon} className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="text-white text-xs font-medium truncate">{incident.roadName}</span>
              <span className="text-gray-400 text-xs truncate">{incident.section}</span>
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="flex flex-col gap-1">
            <div className="flex gap-2 text-xs">
              <span className="text-blue-400 flex-shrink-0">{t('trafficIncident.content')}</span>
              <span className="text-gray-300 truncate">{incident.content}</span>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="text-blue-400 flex-shrink-0">{t('trafficIncident.occurrenceTime')}</span>
              <span className="text-gray-300 truncate">{incident.occurrenceTime}</span>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="text-blue-400 flex-shrink-0">{t('trafficIncident.endTime')}</span>
              <span className="text-gray-300 truncate">{incident.endTime}</span>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="text-blue-400 flex-shrink-0">{t('trafficIncident.control')}</span>
              <span className="text-gray-300 truncate">{incident.control}</span>
            </div>
          </div>
        </div>

        {/* 우측: 영상 썸네일 또는 아이콘 */}
        <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-[#2a2d35] flex items-center justify-center">
          {incident.hasThumbnail ? (
            <video
              key={cardIndex}
              src={videoUrl}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
              autoPlay
              aria-label={t('trafficIncident.videoAriaLabel')}
            />
          ) : (
            <Icon icon="mdi:cctv-off" className="w-10 h-10 text-gray-500" aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  );
};
