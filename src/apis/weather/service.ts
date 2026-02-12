import { axiosInstance } from "../axios";
import { normalizeResponse } from "../base";
import type { BaseResponse } from "../types";
import type { WeatherResponse } from "./types";

export const getWeather = async (sido: string, station: string): Promise<WeatherResponse> => {
    const res = await axiosInstance.get<BaseResponse<WeatherResponse>>(`/api/weather?sido_nm=${sido}&station_nm=${station}`);
    return normalizeResponse(res.data);
};
