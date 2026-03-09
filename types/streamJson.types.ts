/**
 * streamJson 스트림 데이터 파싱용 타입 정의
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

// ========== messageType.json ==========
export interface DisclaimerStreamPayload {
    type: "disclaimer";
    data: string;
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

// ========== tableType.json ==========

export interface TableStreamData {
    type: "table";
    columns: string[];
    data: (string | number)[][];
    extension?: Record<string, string | number | boolean>[];
    title?: string;
    total_count?: number;
    meta?: Record<string, string>;
}

export interface TableStreamPayload {
    type: "table";
    data: TableStreamData;
}

// ========== htmlType.json ==========
export interface HtmlStreamPayload {
    type: "html";
    content: string;
}

// ========== markdownType.json ==========
export interface MarkdownStreamPayload {
    type: "markdown";
    content: string;
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
    location?: string;
    restrict_type?: string;
    start_time?: string;
    est_end_time?: string;
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
    type: string; // e.g. "list", "pin", "cctv"
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

// ========== completeType (최종 응답) ==========
export interface CompleteStreamTableData {
    columns?: string[];
    data?: (string | number)[][];
    title?: string | null;
    format: string;
    html?: string;
}

export interface CompleteStreamData {
    map_data?: MapStreamData;
    tables?: CompleteStreamTableData[];
    table?: CompleteStreamTableData & { html?: string };
    chart_data?: ChartStreamData | null;
    chart?: ChartStreamData | null;
    show_table?: boolean;
    disclaimer?: string;
}

export interface CompleteStreamPayload {
    success: boolean;
    message: string;
    title?: string;
    rationale?: string;
    data?: CompleteStreamData;
    actions?: unknown[];
    status?: string;
    context?: {
        slots?: Record<string, string>;
        meta?: Record<string, string>;
    };
    type?: string;
    intent?: string;
}

// ========== 유니온: 스트림 페이로드 공통 타입 ==========
export type StreamPayload = StepStreamPayload | MessageStreamPayload | DisclaimerStreamPayload | ChartStreamPayload | MapStreamPayload | CompleteStreamPayload | HtmlStreamPayload | MarkdownStreamPayload;

// ========== 타입 가드 (런타임 파싱 검증용) ==========
export const isStepStreamPayload = (payload: unknown): payload is StepStreamPayload => typeof payload === "object" && payload !== null && (payload as StepStreamPayload).type === "step" && typeof (payload as StepStreamPayload).data === "object";

export const isMessageStreamPayload = (payload: unknown): payload is MessageStreamPayload => typeof payload === "object" && payload !== null && (payload as MessageStreamPayload).type === "message" && typeof (payload as MessageStreamPayload).content === "string";

export const isDisclaimerStreamPayload = (payload: unknown): payload is DisclaimerStreamPayload => typeof payload === "object" && payload !== null && (payload as DisclaimerStreamPayload).type === "disclaimer" && typeof (payload as DisclaimerStreamPayload).data === "string";

export const isChartStreamPayload = (payload: unknown): payload is ChartStreamPayload => typeof payload === "object" && payload !== null && (payload as ChartStreamPayload).type === "chart" && typeof (payload as ChartStreamPayload).data === "object";

export const isTableStreamPayload = (payload: unknown): payload is TableStreamPayload => typeof payload === "object" && payload !== null && (payload as TableStreamPayload).type === "table" && typeof (payload as TableStreamPayload).data === "object";

export const isHtmlStreamPayload = (payload: unknown): payload is HtmlStreamPayload => typeof payload === "object" && payload !== null && (payload as HtmlStreamPayload).type === "html" && typeof (payload as HtmlStreamPayload).content === "string";

export const isMarkdownStreamPayload = (payload: unknown): payload is MarkdownStreamPayload => typeof payload === "object" && payload !== null && (payload as MarkdownStreamPayload).type === "markdown" && typeof (payload as MarkdownStreamPayload).content === "string";

export const isMapStreamPayload = (payload: unknown): payload is MapStreamPayload => typeof payload === "object" && payload !== null && (payload as MapStreamPayload).type === "map" && typeof (payload as MapStreamPayload).data === "object";

export const isCompleteStreamPayload = (payload: unknown): payload is CompleteStreamPayload => typeof payload === "object" && payload !== null && typeof (payload as CompleteStreamPayload).success === "boolean" && typeof (payload as CompleteStreamPayload).message === "string";

/** JSON 문자열을 파싱 후 StreamPayload로 타입 단언 (검증은 타입 가드 사용 권장) */
export const parseStreamJson = (json: string): StreamPayload => JSON.parse(json) as StreamPayload;

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
    location?: string;
    restrict_type?: string;
    start_time?: string;
    est_end_time?: string;
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
