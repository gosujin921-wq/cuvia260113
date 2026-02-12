import { useQuery } from "@tanstack/react-query";
import { getWeather } from "./service";

export const useGetWeather = (sido: string, station: string) => {
    return useQuery({
        queryKey: ["weather", sido, station],
        queryFn: () => getWeather(sido, station),
    });
};
