import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getWeather } from "./service";

/** 다음 15분 단위 시각까지 남은 밀리초 계산 (예: 0:15, 0:30, 0:45, 1:00, 1:15...) */
const getMsUntilNext15Min = (): number => {
    const now = new Date();
    const nextTarget = new Date(now);
    const nextQuarter = Math.ceil((now.getMinutes() + 1) / 15) * 15;

    if (nextQuarter >= 60) {
        nextTarget.setHours(now.getHours() + 1, nextQuarter - 60, 0, 0);
    } else {
        nextTarget.setMinutes(nextQuarter, 0, 0);
    }

    return nextTarget.getTime() - now.getTime();
};

export const useGetWeather = (sido: string, station: string) => {
    const queryClient = useQueryClient();

    // 15분마다 refetch (예: 0:15, 0:30, 0:45, 1:00...)
    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | null = null;

        const timeoutId = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["weather", sido, station] });

            intervalId = setInterval(() => {
                queryClient.invalidateQueries({ queryKey: ["weather", sido, station] });
            }, 15 * 60 * 1000); // 15분
        }, getMsUntilNext15Min());

        return () => {
            clearTimeout(timeoutId);
            if (intervalId) clearInterval(intervalId);
        };
    }, [sido, station, queryClient]);

    return useQuery({
        queryKey: ["weather", sido, station],
        queryFn: () => getWeather(sido, station),
        staleTime: 15 * 60 * 1000, // 15분
    });
};
