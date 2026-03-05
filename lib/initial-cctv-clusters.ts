/**
 * 1키 누르기 전 초기 화면용 CCTV 클러스터 데이터
 * 과천역 주변 5개 동(원문동, 별양동, 부림동, 중앙동, 관문동)에 50개 무작위 배치
 */

/** 동별 좌표 범위 [lngMin, lngMax, latMin, latMax] - 과천역 주변, 넓게 펼침 */
const DISTRICT_BOUNDS: Record<string, [number, number, number, number]> = {
  중앙동: [126.9925, 127.0005, 37.4315, 37.4390],
  별양동: [126.9940, 127.0020, 37.4345, 37.4410],
  부림동: [126.9915, 126.9995, 37.4285, 37.4360],
  원문동: [126.9875, 126.9955, 37.4295, 37.4375],
  관문동: [126.9955, 127.0045, 37.4295, 37.4395],
};

export interface InitialCCTVItem {
  id: string;
  name: string;
  lng: number;
  lat: number;
  direction: number;
  district: string;
}

/** 50개 초기 CCTV 생성 (무작위 좌표) */
export const getInitialCCTVClusters = (): InitialCCTVItem[] => {
  const districts = Object.keys(DISTRICT_BOUNDS);
  const items: InitialCCTVItem[] = [];
  const usedIds = new Set<number>();

  const getUniqueId = (): number => {
    for (let attempt = 0; attempt < 1000; attempt++) {
      const r = Math.floor(Math.random() * 999) + 1;
      if (!usedIds.has(r)) {
        usedIds.add(r);
        return r;
      }
    }
    return Math.floor(Math.random() * 999) + 1;
  };

  districts.forEach((district) => {
    const [lngMin, lngMax, latMin, latMax] = DISTRICT_BOUNDS[district];
    const count = 10; // 동당 10개 × 5동 = 50개

    for (let i = 0; i < count; i++) {
      const lng = lngMin + Math.random() * (lngMax - lngMin);
      const lat = latMin + Math.random() * (latMax - latMin);
      const direction = Math.floor(Math.random() * 360);
      const idNum = getUniqueId();
      const name = `별빛A-${String(idNum).padStart(3, '0')}`;

      items.push({
        id: `initial-${name}`,
        name,
        lng,
        lat,
        direction,
        district,
      });
    }
  });

  return items; // 50개
};

/** 도로 아이콘용 교통/돌발 아이콘 (무작위 좌표, 무작위 타입) */
/** 차량사고, 도로공사(철거공사), 도로침하 - 도시교통돌발정보·도로 버튼과 동일 */
const ROAD_INCIDENT_ICONS = [
  'mdi:car',               // 차량사고
  'mdi:shovel',            // 도로공사(철거공사)
  'mdi:minus-circle',      // 도로침하
] as const;

export interface RoadIncidentItem {
  id: string;
  lng: number;
  lat: number;
  icon: typeof ROAD_INCIDENT_ICONS[number];
}

/** 도로 버튼 연결용 돌발 아이콘 (15개, 무작위 위치·타입) */
export const getRoadIncidentMarkers = (): RoadIncidentItem[] => {
  const districts = Object.keys(DISTRICT_BOUNDS);
  const items: RoadIncidentItem[] = [];

  districts.forEach((district, dIdx) => {
    const [lngMin, lngMax, latMin, latMax] = DISTRICT_BOUNDS[district];
    const count = 3; // 동당 3개 × 5동 = 15개

    for (let i = 0; i < count; i++) {
      const lng = lngMin + Math.random() * (lngMax - lngMin);
      const lat = latMin + Math.random() * (latMax - latMin);
      const iconIdx = Math.floor(Math.random() * ROAD_INCIDENT_ICONS.length);
      const icon = ROAD_INCIDENT_ICONS[iconIdx];
      items.push({
        id: `road-incident-${dIdx}-${i}`,
        lng,
        lat,
        icon,
      });
    }
  });

  return items;
};
