import { axiosInstance } from "../axios";
import { normalizeResponse } from "../base";
import { BaseResponse } from "../types";
import { AgentAddRequest, AgentDeleteRequest, AgentListResponse, AgentUpdateRequest } from "./types";

export const postAgent = async (payload: AgentAddRequest) => {
    const resp = await axiosInstance.post<BaseResponse>("/v1/cuvia-was/agent-info/regist", payload);
    return resp.data;
};

export const putAgent = async (payload: AgentUpdateRequest) => {
    const resp = await axiosInstance.put<BaseResponse>("/v1/cuvia-was/agent-info/update", payload);
    return resp.data;
};

export const deleteAgent = async (payload: AgentDeleteRequest) => {
    const resp = await axiosInstance.delete<BaseResponse>("/v1/cuvia-was/agent-info/delete", {
        data: payload,
    });
    return resp.data;
};

export const getAgentList = async (page: number, pageSize: number, searchData: string, sort: string): Promise<AgentListResponse> => {
    const resp = await axiosInstance.get<BaseResponse<AgentListResponse>>(`/v1/cuvia-was/agent-info/list?page=${page}&page_size=${pageSize}&search_data=${searchData}&sort=${sort}`);
    return normalizeResponse(resp.data);
};
