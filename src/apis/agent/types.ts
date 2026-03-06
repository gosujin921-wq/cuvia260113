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

// ========== 도로 돌발 상황 조회 ==========

/** 도로 돌발 상황 목록 한 건 */
export interface IncidentListItem {
    route_id: string;
    link_id: string;
    spot_id: string;
    reg_seq: string;
    confirm_date: string;
    start_date: string;
    est_end_date: string;
    end_date: string;
    /** 통제/발생 차로 (1~6차로, 부분차로, 전차로, 갓길) */
    restrict_type: string;
    inci_desc: string;
    inci_place1: string;
    inci_place2: string;
    /** 발생위치 좌표(경도) */
    coord_x: string;
    /** 발생위치 좌표(위도) */
    coord_y: string;
}

/** 도로 돌발 상황 조회 응답 data */
export interface IncidentListData {
    header_cd: string;
    header_msg: string;
    item_count: number;
    items: IncidentListItem[];
}
