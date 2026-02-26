/**
 * public/streamJson 폴더 내 JSON 스트림 데이터 파싱용 타입 정의
 * - stepType.json, messageType.json, chartType.json, mapType.json
 */

// ========== stepType.json ==========
export interface StepStreamData {
  step: number;
  message: string;
}

export interface StepStreamPayload {
  type: "step";
  data: StepStreamData;
}

// ========== messageType.json ==========
export interface MessageStreamPayload {
  type: "message";
  content: string;
  intent?: string;
}

// ========== chartType.json ==========
export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string;
}

export interface ChartStreamData {
  type: string; // e.g. "bar" | "line" | "pie" | "doughnut"
  title: string;
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartStreamPayload {
  type: "chart";
  data: ChartStreamData;
}

// ========== mapType.json ==========
export interface MapStreamFilters {
  event_name?: string;
  sido?: string;
  start_date?: string;
  end_date?: string;
}

export interface MapStreamMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
  color: string | null;
  icon: string | null;
  type: string; // e.g. "event"
  category: string | null;
  dong: string | null;
}

export interface MapStreamCenter {
  lat: number;
  lng: number;
}

export interface MapStreamWmsLayer {
  url: string;
  layer: string;
  style: string;
  transparent: boolean;
  format: string; // e.g. "image/png"
  opacity: number;
}

export interface MapStreamData {
  total_count: number;
  filters: MapStreamFilters;
  type: string; // e.g. "list", "pin"
  markers: MapStreamMarker[];
  available_types: string[]; // e.g. ["marker", "heatmap", "cluster"]
  wms_layers: MapStreamWmsLayer[];
  center: MapStreamCenter;
  center_lat: number;
  center_lng: number;
  zoom: number;
}

export interface MapStreamPayload {
  type: "map";
  data: MapStreamData;
}

// ========== 유니온: 스트림 페이로드 공통 타입 ==========
export type StreamPayload =
  | StepStreamPayload
  | MessageStreamPayload
  | ChartStreamPayload
  | MapStreamPayload;

// ========== 타입 가드 (런타임 파싱 검증용) ==========
export const isStepStreamPayload = (
  payload: unknown
): payload is StepStreamPayload =>
  typeof payload === "object" &&
  payload !== null &&
  (payload as StepStreamPayload).type === "step" &&
  typeof (payload as StepStreamPayload).data === "object";

export const isMessageStreamPayload = (
  payload: unknown
): payload is MessageStreamPayload =>
  typeof payload === "object" &&
  payload !== null &&
  (payload as MessageStreamPayload).type === "message" &&
  typeof (payload as MessageStreamPayload).content === "string";

export const isChartStreamPayload = (
  payload: unknown
): payload is ChartStreamPayload =>
  typeof payload === "object" &&
  payload !== null &&
  (payload as ChartStreamPayload).type === "chart" &&
  typeof (payload as ChartStreamPayload).data === "object";

export const isMapStreamPayload = (
  payload: unknown
): payload is MapStreamPayload =>
  typeof payload === "object" &&
  payload !== null &&
  (payload as MapStreamPayload).type === "map" &&
  typeof (payload as MapStreamPayload).data === "object";

/** JSON 문자열을 파싱 후 StreamPayload로 타입 단언 (검증은 타입 가드 사용 권장) */
export const parseStreamJson = (json: string): StreamPayload =>
  JSON.parse(json) as StreamPayload;

// ========== GeoJSON 타입 정의 ==========
export interface GeoJsonPointGeometry {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

export interface GeoJsonFeatureProperties {
  id: string;
  title: string;
  description: string;
  color: string | null;
  icon: string | null;
  markerType: string;
  category: string | null;
  dong: string | null;
}

export interface GeoJsonFeature {
  type: "Feature";
  geometry: GeoJsonPointGeometry;
  properties: GeoJsonFeatureProperties;
}

export interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
  metadata?: {
    totalCount: number;
    filters: MapStreamFilters;
    mapType: string;
    availableTypes: string[];
    center: MapStreamCenter;
    zoom: number;
  };
}
