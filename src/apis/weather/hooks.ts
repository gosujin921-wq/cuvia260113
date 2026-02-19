import { useQuery } from "@tanstack/react-query";
import { getWeather } from "./service";
import { WeatherResponse } from "./types";
import { BaseResponse } from "../types";

export const useGetWeather = (sido: string, station: string) => {
    return useQuery({
        queryKey: ["weather", sido, station],
        queryFn: (): WeatherResponse => {
            return {
                    sido_nm: sido,
                    station_nm: station,
                    current_temp: "20",
                    current_humidity: "50",
                    min_temp: "10",
                    max_temp: "30",
                    weather: "1",
                    fcst_date: "2026-01-01",
                    fcst_time: "12:00",
                    pm10_value: "10",
                    pm25_value: "10",
                    pm10_grade: "1",
                    pm25_grade: "1",
            }
        }
    });
};
