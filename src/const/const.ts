// 한국 경계 (남서 ~ 북동)
export const KOREA_BOUNDS: [[number, number], [number, number]] = [
    [115.0, 25.0], // 남서 (경도, 위도) - 한국 전체 조망용 여유
    [140.0, 50.0], // 북동 (경도, 위도)
];

// 생활안전지도(safemap) 공개 GeoServer WMS 엔드포인트
export const SAFEMAP_WMS_ENDPOINT = "https://www.safemap.go.kr/geoserver_pos/safemap/wms";

// safemap WMS 레이어 코드
export const SAFEMAP_LAYER = {
    /** 침수흔적도 */
    FLUDMARKS: "A2SM_FLUDMARKS",
    /** 도시침수지도 */
    FLOODDAMAGE: "A2SM_FLOODDAMAGE",
} as const;