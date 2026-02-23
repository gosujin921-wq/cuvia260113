import { useQuery } from "@tanstack/react-query";
import { getCameraList, getIceServerList } from "./service";

export const useGetCamera = (page: number, pageSize: number, searchData: string, sort: string) => {
    return useQuery({
        queryKey: ["camera", page, pageSize, searchData, sort],
        queryFn: () => getCameraList(page, pageSize, searchData, sort),
    });
};

export const useGetIceServerList = () => {
    return useQuery({
        queryKey: ["iceServerList"],
        queryFn: () => getIceServerList(),
    });
};
