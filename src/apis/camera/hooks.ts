import { useQuery } from "@tanstack/react-query";
import { getCameraList } from "./service";

export const useGetCamera = () => {
    return useQuery({
        queryKey: ["camera"],
        queryFn: getCameraList,
    });
};
