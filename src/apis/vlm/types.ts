export interface VlmRequest {
    event_id: number;
    vms_id: number;
    camera_id: string;
    occurred_at: string;
}

/** VLM 분석 상태 */
export type VlmAnalysisStatus = "REQUESTED" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CANCELLED";

/** VLM 분석 결과 데이터 */
export interface VlmAnalysisData {
    /** 작업 ID */
    job_id: string;
    /** 분석 상태 */
    status: VlmAnalysisStatus;
    /** 현재 진행 순서 (IN_PROGRESS 상태에서 사용) */
    sequence?: number;
    /** 진행 상태 메시지 (IN_PROGRESS 상태에서 사용) */
    progress_message?: string;
    /** 한 줄 요약 (COMPLETED 상태에서 사용) */
    one_line?: string;
    /** 상세 요약 (COMPLETED 상태에서 사용) */
    summary?: string;
    /** 근거 (COMPLETED 상태에서 사용) */
    evidence?: string;
    /** 권장사항 (COMPLETED 상태에서 사용) */
    recommendations?: string;
    /** 원본 텍스트 */
    raw_text?: string;
    time: number | null;
    progress: number;
}

/** VLM 분석 결과 메시지 (WebSocket) */
export interface VlmAnalysisMessage {
    data: VlmAnalysisData;
}
