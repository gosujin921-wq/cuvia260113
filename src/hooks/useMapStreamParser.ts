import { useCallback, useState } from "react";
import type { MapStreamPayload, MapStreamMarker, GeoJsonFeature, GeoJsonFeatureCollection, MapStreamData } from "@/types/streamJson.types";
import { isMapStreamPayload } from "@/types/streamJson.types";

interface ParseResult {
    success: boolean;
    data: GeoJsonFeatureCollection | null;
    error: string | null;
}

interface UseMapStreamParserReturn {
    featureCollection: GeoJsonFeatureCollection | null;
    error: string | null;
    isLoading: boolean;
    parseSSELine: (line: string) => ParseResult;
    parseMapPayload: (payload: unknown) => ParseResult;
    reset: () => void;
}

const SSE_DATA_PREFIX = "data: ";

const validateMarker = (marker: MapStreamMarker): boolean => {
    return typeof marker.id === "string" && typeof marker.lat === "number" && typeof marker.lng === "number" && !isNaN(marker.lat) && !isNaN(marker.lng) && marker.lat >= -90 && marker.lat <= 90 && marker.lng >= -180 && marker.lng <= 180;
};

const markerToFeature = (marker: MapStreamMarker): GeoJsonFeature => ({
    type: "Feature",
    geometry: {
        type: "Point",
        coordinates: [marker.lng, marker.lat],
    },
    properties: {
        id: marker.id,
        title: marker.title,
        description: marker.description,
        color: marker.color,
        icon: marker.icon,
        markerType: marker.type,
        category: marker.category,
        dong: marker.dong,
        location: marker.location,
        restrict_type: marker.restrict_type,
        start_time: marker.start_time,
        est_end_time: marker.est_end_time,
        rtsp_url: marker.rtsp_url ?? null,
        damage_persons_sum: marker.damage_persons_sum ?? null,
        damage_persons: marker.damage_persons ?? null,
        sido: marker.sido ?? null,
        sgg: marker.sgg ?? null,
        sido_rep_lat: marker.sido_rep_lat ?? null,
        sido_rep_lng: marker.sido_rep_lng ?? null,
        emd: marker.emd ?? null,
    },
});

const mapDataToFeatureCollection = (data: MapStreamData): GeoJsonFeatureCollection => {
    const validMarkers = data.markers.filter(validateMarker);
    const features = validMarkers.map(markerToFeature);

    return {
        type: "FeatureCollection",
        features,
        metadata: {
            totalCount: data.total_count,
            filters: data.filters,
            mapType: data.type,
            availableTypes: data.available_types,
            center: data.center,
            zoom: data.zoom,
        },
    };
};

export const useMapStreamParser = (): UseMapStreamParserReturn => {
    const [featureCollection, setFeatureCollection] = useState<GeoJsonFeatureCollection | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const parseMapPayload = useCallback((payload: unknown): ParseResult => {
        if (!isMapStreamPayload(payload)) {
            return {
                success: false,
                data: null,
                error: "유효한 map 타입 페이로드가 아닙니다",
            };
        }

        const mapPayload = payload as MapStreamPayload;

        if (!mapPayload.data || !Array.isArray(mapPayload.data.markers)) {
            return {
                success: false,
                data: null,
                error: "markers 배열이 존재하지 않습니다",
            };
        }

        try {
            const collection = mapDataToFeatureCollection(mapPayload.data);
            setFeatureCollection(collection);
            setError(null);
            return { success: true, data: collection, error: null };
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : "FeatureCollection 변환 실패";
            setError(errorMsg);
            return { success: false, data: null, error: errorMsg };
        }
    }, []);

    const parseSSELine = useCallback(
        (line: string): ParseResult => {
            setIsLoading(true);

            const trimmed = line.trim();
            if (!trimmed.startsWith(SSE_DATA_PREFIX)) {
                setIsLoading(false);
                return {
                    success: false,
                    data: null,
                    error: "SSE data: 형식이 아닙니다",
                };
            }

            const jsonStr = trimmed.slice(SSE_DATA_PREFIX.length);

            let parsed: unknown;
            try {
                parsed = JSON.parse(jsonStr);
            } catch {
                setIsLoading(false);
                setError("JSON 파싱 실패");
                return { success: false, data: null, error: "JSON 파싱 실패" };
            }

            if (typeof parsed === "object" && parsed !== null && (parsed as { type?: string }).type !== "map") {
                setIsLoading(false);
                return {
                    success: false,
                    data: null,
                    error: `map 타입이 아닙니다 (type: ${(parsed as { type?: string }).type})`,
                };
            }

            const result = parseMapPayload(parsed);
            setIsLoading(false);
            return result;
        },
        [parseMapPayload]
    );

    const reset = useCallback(() => {
        setFeatureCollection(null);
        setError(null);
        setIsLoading(false);
    }, []);

    return {
        featureCollection,
        error,
        isLoading,
        parseSSELine,
        parseMapPayload,
        reset,
    };
};

export { mapDataToFeatureCollection, markerToFeature, validateMarker };
