export interface AgentAddRequest {
    agent_type: 1 | 2 | 3 | 4; // 1: 미디어 Agent, 2: 선별 관제 Agent, 3: 다운로드 수집 Agent, 4: stun/turn 서버
    agent_ip: string;
    agent_port: number;
    agent_name: string;
    protocol?: "stun" | "turn";
    priority?: number;
    username?: string;
    credential?: string;
    is_used: 0 | 1; // 0: 미사용, 1: 사용
    custom_config: object;
}

export interface AgentUpdateRequest extends AgentAddRequest {
    agent_id: number;
}

export interface AgentDeleteRequest {
    agent_ids: number[];
}

export interface AgentListPageData {
    agent_id: number;
    agent_type: 1 | 2 | 3 | 4; // 1: 미디어 Agent, 2: 선별 관제 Agent, 3: 다운로드 수집 Agent, 4: stun/turn 서버
    agent_ip: string;
    agent_port: number;
    agent_name: string;
    protocol?: "stun" | "turn";
    priority?: number;
    username?: string;
    credential?: string;
    is_used: 0 | 1; // 0: 미사용, 1: 사용
    status: 0 | 1 | 2; // 0: 대기, 1: 활성화, 2: 비활성화
    custom_config: object;
}

export interface AgentListResponse {
    page: number;
    page_size: number;
    total: number;
    page_data: AgentListPageData[];
}
