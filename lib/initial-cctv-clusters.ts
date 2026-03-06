/**
 * 1키 누르기 전 초기 화면용 CCTV 클러스터 데이터
 * 과천역 주변 5개 동(원문동, 별양동, 부림동, 중앙동, 관문동)에 50개 무작위 배치
 */

/** 동별 좌표 범위 [lngMin, lngMax, latMin, latMax] - 과천역 주변, 넓게 펼침 */
const DISTRICT_BOUNDS: Record<string, [number, number, number, number]> = {
  중앙동: [126.9900, 127.0030, 37.4290, 37.4415],
  별양동: [126.9920, 127.0050, 37.4320, 37.4440],
  부림동: [126.9885, 127.0025, 37.4255, 37.4385],
  원문동: [126.9845, 126.9985, 37.4265, 37.4400],
  관문동: [126.9930, 127.0075, 37.4265, 37.4420],
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

/** 거리 기반 클러스터 그룹 (가까운 CCTV 묶음) */
export interface InitialCCTVClusterGroup {
  id: string;
  name: string; // 대표 이름 (첫 번째 아이템)
  centerLng: number;
  centerLat: number;
  items: InitialCCTVItem[];
}

/** 거리 기반 클러스터링 (반경 ~50m, 1도≈111km → 0.00045 deg) */
const CLUSTER_RADIUS_DEG = 0.00045;

const distSq = (a: InitialCCTVItem, b: InitialCCTVItem): number => {
  const dlng = a.lng - b.lng;
  const dlat = a.lat - b.lat;
  return dlng * dlng + dlat * dlat;
};

export const clusterInitialCCTVs = (items: InitialCCTVItem[]): InitialCCTVClusterGroup[] => {
  const r2 = CLUSTER_RADIUS_DEG * CLUSTER_RADIUS_DEG;
  const n = items.length;
  const parent = items.map((_, i) => i);

  const find = (i: number): number => {
    if (parent[i] !== i) parent[i] = find(parent[i]);
    return parent[i];
  };
  const union = (a: number, b: number) => {
    const pa = find(a);
    const pb = find(b);
    if (pa !== pb) parent[pa] = pb;
  };

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (distSq(items[i], items[j]) <= r2) union(i, j);
    }
  }

  const groupMap = new Map<number, InitialCCTVItem[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!groupMap.has(root)) groupMap.set(root, []);
    groupMap.get(root)!.push(items[i]);
  }

  const groups: InitialCCTVClusterGroup[] = [];
  groupMap.forEach((groupItems) => {
    if (groupItems.length < 2) return; // 1개는 클러스터링하지 않음
    const centerLng = groupItems.reduce((s, p) => s + p.lng, 0) / groupItems.length;
    const centerLat = groupItems.reduce((s, p) => s + p.lat, 0) / groupItems.length;
    groups.push({
      id: `cluster-${groupItems[0].id}`,
      name: groupItems[0].name,
      centerLng,
      centerLat,
      items: groupItems,
    });
  });
  return groups;
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
