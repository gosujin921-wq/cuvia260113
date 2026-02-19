import { useMutation } from "@tanstack/react-query";
import { postAgent } from "./service";
import { AgentAddRequest } from "./types";

export const useAddAgent = () => {
    return useMutation({
        mutationFn: (payload: AgentAddRequest) => postAgent(payload),
    });
};
