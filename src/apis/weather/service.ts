import { axiosInstance } from "../axios";
import { normalizeResponse } from "../base";
import type { BaseResponse } from "../types";
import type { WeatherResponse } from "./types";

export const getWeather = async (): Promise<WeatherResponse> => {
    const res = await axiosInstance.get<BaseResponse<WeatherResponse>>("/api/weather");
    return normalizeResponse(res.data);
};
