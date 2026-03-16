import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignCamera, getCameraAssignCameraInfo, getCameraList, getIceServerList, syncCamera } from "./service";
import { CameraAssignRequest } from "./types";

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

export const useGetCameraAssignCameraInfo = () => {
    return useQuery({
        queryKey: ["cameraAssignCameraInfo"],
        queryFn: () => getCameraAssignCameraInfo(),
    });
};

export const useAssignCamera = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ request, bridgeId }: { request: CameraAssignRequest; bridgeId: string }) => assignCamera(request, bridgeId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cameraAssignCameraInfo"] });
        },
    });
};

export const useSyncCamera = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => syncCamera(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["camera"] });
        },
    });
};
