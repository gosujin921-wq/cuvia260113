import { useMutation, useQuery } from "@tanstack/react-query";
import { deleteAgent, getAgentList, postAgent, putAgent } from "./service";
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
