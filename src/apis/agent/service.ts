import { axiosInstance } from "../axios";
import { normalizeResponse } from "../base";
import { BaseResponse } from "../types";
import { AgentAddRequest } from "./types";

export const postAgent = async (payload: AgentAddRequest) => {
    const resp = await axiosInstance.post<BaseResponse>("/api/agents", payload);
    return normalizeResponse(resp.data);
};
