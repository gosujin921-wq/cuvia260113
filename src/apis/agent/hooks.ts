import { useMutation, useQuery } from "@tanstack/react-query";
import { deleteAgent, getAgentList, getIncidentList, postAgent, putAgent } from "./service";
import { AgentAddRequest, AgentDeleteRequest, AgentUpdateRequest } from "./types";

export const useAddAgent = () => {
    return useMutation({
        mutationFn: (payload: AgentAddRequest) => postAgent(payload),
    });
};

export const useUpdateAgent = () => {
    return useMutation({
        mutationFn: (payload: AgentUpdateRequest) => putAgent(payload),
    });
};

export const useDeleteAgent = () => {
    return useMutation({
        mutationFn: (payload: AgentDeleteRequest) => deleteAgent(payload),
    });
};

export const useGetAgentList = (page: number, pageSize: number, searchData: string, sort: string) => {
    return useQuery({
        queryKey: ["agentList", page, pageSize, searchData, sort],
        queryFn: () => getAgentList(page, pageSize, searchData, sort),
    });
};

/** 도로 돌발 상황 조회
 * @param enabled - 조회 활성화 여부 (기본값: true)
 * @param refetchInterval - 자동 갱신 주기 (ms), enabled가 true일 때만 적용 (기본값: 20000ms)
 */
export const useGetIncidentList = (enabled: boolean = true, refetchInterval: number = 20000) => {
    return useQuery({
        queryKey: ["incidentList"],
        queryFn: () => getIncidentList(),
        enabled,
        refetchInterval: enabled ? refetchInterval : false,
        staleTime: 0,
    });
};
