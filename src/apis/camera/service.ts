import { axiosInstance } from "../axios";
import { normalizeResponse } from "../base";
import { BaseResponse } from "../types";
import { CameraAssignCameraInfo, CameraAssignRequest, CameraResponse, IceServerResponse } from "./types";

export const getCameraList = async (page: number, pageSize: number, searchData: string, sort: string): Promise<CameraResponse> => {
    const resp = await axiosInstance.get<BaseResponse<CameraResponse>>(`/v1/cuvia-was/camera/list?page=${page}&page_size=${pageSize}&search_data=${searchData}&sort=${sort}`);
    return normalizeResponse(resp.data);
};

export const getIceServerList = async (): Promise<IceServerResponse> => {
    const resp = await axiosInstance.get<BaseResponse<IceServerResponse>>(`/v1/cuvia-was/agent-info/ice-servers/list`);
    return normalizeResponse(resp.data);
};

export const getCameraAssignCameraInfo = async (): Promise<CameraAssignCameraInfo> => {
    const resp = await axiosInstance.get<BaseResponse<CameraAssignCameraInfo>>(`/v1/cuvia-was/cctv-setting/list`);
    return normalizeResponse(resp.data);
};

export const assignCamera = async (request: CameraAssignRequest, bridgeId: string) => {
    const resp = await axiosInstance.patch<BaseResponse>(`/v1/cuvia-was/cctv-setting/update/${bridgeId}`, request);
    return normalizeResponse(resp.data);
};
