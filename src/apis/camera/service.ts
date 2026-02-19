import { axiosInstance } from "../axios";
import { normalizeResponse } from "../base";
import { BaseResponse } from "../types";
import { CameraResponse } from "./types";

export const getCameraList = async (): Promise<CameraResponse[]> => {
    const resp = await axiosInstance.get<BaseResponse<CameraResponse[]>>("/api/cameras");
    return normalizeResponse(resp.data);
};
