import { axiosInstance } from "../axios";
import { normalizeResponse } from "../base";
import { BaseResponse } from "../types";
import { VlmRequest } from "./types";

export const postVlmRequest = async (payload: VlmRequest) => {
    const resp = await axiosInstance.post<BaseResponse<BaseResponse>>("/v1/cuvia-was/vlm", payload);
    return normalizeResponse(resp.data);
};
