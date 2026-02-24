import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getWeather } from "./service";

/** 다음 정각 10분까지 남은 밀리초 계산 (예: 1:10, 2:10, 3:10...) */
const getMsUntilNextHour10 = (): number => {
    const now = new Date();
    const nextTarget = new Date(now);
    
    if (now.getMinutes() >= 10) {
        // 현재 시간이 10분 이후면 다음 시간의 10분으로
        nextTarget.setHours(now.getHours() + 1, 10, 0, 0);
    } else {
        // 현재 시간이 10분 이전이면 이번 시간의 10분으로
        nextTarget.setMinutes(10, 0, 0);
    }
    
    return nextTarget.getTime() - now.getTime();
};

export const useGetWeather = (sido: string, station: string) => {
    const queryClient = useQueryClient();

    // 매시간 10분마다 refetch (예: 1:10, 2:10, 3:10...)
    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | null = null;

        // 다음 정각 10분까지 기다린 후 1시간 간격으로 refetch
        const timeoutId = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["weather", sido, station] });

            intervalId = setInterval(() => {
                queryClient.invalidateQueries({ queryKey: ["weather", sido, station] });
            }, 60 * 60 * 1000); // 1시간
        }, getMsUntilNextHour10());

        return () => {
            clearTimeout(timeoutId);
            if (intervalId) clearInterval(intervalId);
        };
    }, [sido, station, queryClient]);

    return useQuery({
        queryKey: ["weather", sido, station],
        queryFn: () => getWeather(sido, station),
        staleTime: 60 * 60 * 1000, // 1시간
    });
};
