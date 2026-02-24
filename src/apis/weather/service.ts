import { axiosInstance } from "../axios";
import { normalizeResponse } from "../base";
import type { BaseResponse } from "../types";
import type { WeatherResponse } from "./types";

export const getWeather = async (sido: string, station: string): Promise<WeatherResponse> => {
    const res = await axiosInstance.get<BaseResponse<WeatherResponse>>(`/v1/cuvia-was/weather?sido_nm=${encodeURIComponent(sido)}&station_nm=${encodeURIComponent(station)}`);
    return normalizeResponse(res.data);
};
