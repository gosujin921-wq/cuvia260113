import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import type { VlmAnalysisMessage, VlmAnalysisData, VlmAnalysisStatus } from "./types";
import { SocketStatus } from "../event/socket";

/** WebSocket 연결 상태 */

/** VlmSocket 콜백 옵션 */
export interface VlmSocketCallbacks {
    onMessage?: (data: VlmAnalysisData) => void;
    onStatusChange?: (status: SocketStatus) => void;
    onError?: (error: string) => void;
    /** 분석 상태별 콜백 */
    onRequested?: (jobId: string) => void;
    onProgress?: (jobId: string, sequence: number, progressMessage: string, time: number) => void;
    onCompleted?: (jobId: string, data: { oneLine: string; summary: string; evidence: string; recommendations: string; rawText: string }) => void;
    onFailed?: (jobId: string) => void;
    onCancelled?: (jobId: string) => void;
}

/** VlmSocket 설정 옵션 */
export interface VlmSocketOptions extends VlmSocketCallbacks {
    /** 자동 재연결 여부 (기본값: true) */
    autoReconnect?: boolean;
    /** 재연결 시도 간격 ms (기본값: 3000) */
    reconnectInterval?: number;
    /** 최대 재연결 시도 횟수 (기본값: 10, -1이면 무제한) */
    maxReconnectAttempts?: number;
}

const DEFAULT_OPTIONS: Required<Omit<VlmSocketOptions, keyof VlmSocketCallbacks>> = {
    autoReconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
};

/**
 * VLM 분석 STOMP WebSocket 관리 클래스
 */
export class VlmSocket {
    private client: Client | null = null;
    private subscription: StompSubscription | null = null;
    private status: SocketStatus = "disconnected";
    private reconnectAttempts = 0;
    private readonly url: string;
    private readonly options: Required<Omit<VlmSocketOptions, keyof VlmSocketCallbacks>> & VlmSocketCallbacks;
    private currentTopic: string | null = null;

    constructor(options: VlmSocketOptions = {}) {
        const baseUrl = import.meta.env.VITE_WS_BASE_URL ?? import.meta.env.VITE_API_BASE_URL ?? "http://112.216.247.186:16000";
        const wsProtocol = baseUrl.startsWith("https") ? "wss" : "ws";
        const host = baseUrl.replace(/^https?:\/\//, "");
        this.url = `${wsProtocol}://${host}/v1/cuvia-was/selecive-event/event`;

        this.options = {
            ...DEFAULT_OPTIONS,
            ...options,
        };
    }

    /** 현재 연결 상태 */
    getStatus(): SocketStatus {
        return this.status;
    }

    /** WebSocket 연결 */
    connect(): void {
        if (this.client?.connected) {
            console.warn("[VlmSocket] 이미 연결되어 있습니다.");
            return;
        }

        this.cleanup();
        this.setStatus("connecting");

        try {
            this.client = new Client({
                brokerURL: this.url,
                reconnectDelay: this.options.autoReconnect ? this.options.reconnectInterval : 0,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,

                onConnect: () => {
                    this.reconnectAttempts = 0;
                    this.setStatus("connected");

                    // 이전에 구독 중이던 토픽이 있으면 재구독
                    if (this.currentTopic) {
                        this.subscribeToAnalysis(this.currentTopic);
                    }
                },

                onStompError: (frame) => {
                    console.error("[VlmSocket] STOMP 에러:", frame.headers["message"]);
                    console.error("[VlmSocket] 상세 정보:", frame.body);
                    this.setStatus("error");
                    this.options.onError?.(frame.headers["message"] || "STOMP Error");
                    this.scheduleReconnect();
                },

                onWebSocketError: (event) => {
                    console.error("[VlmSocket] WebSocket 에러:", event);
                    this.setStatus("error");
                    this.options.onError?.("WebSocket Error");
                },

                onDisconnect: () => {
                    this.setStatus("disconnected");
                },

                onWebSocketClose: (event) => {
                    console.log("[VlmSocket] WebSocket 종료:", event.code, event.reason);
                    this.setStatus("disconnected");
                    this.scheduleReconnect();
                },
            });

            this.client.activate();
        } catch (error) {
            console.error("[VlmSocket] 연결 생성 실패:", error);
            this.setStatus("error");
            this.scheduleReconnect();
        }
    }

    /** VLM 분석 토픽 구독 */
    subscribeToAnalysis(topic: string): void;
    subscribeToAnalysis(eventId: number, vmsId: number, cameraId: string): void;
    subscribeToAnalysis(topicOrEventId: string | number, vmsId?: number, cameraId?: string): void {
        const topic = typeof topicOrEventId === "string" ? topicOrEventId : `/topic/analysis/${topicOrEventId}/${vmsId}/${cameraId}`;

        if (!this.client?.connected) {
            console.warn("[VlmSocket] 연결되지 않은 상태에서 구독 시도, 토픽 저장 후 연결 시 구독 예정:", topic);
            this.currentTopic = topic;
            return;
        }

        // 기존 구독 해제
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }

        this.currentTopic = topic;
        console.log("[VlmSocket] 토픽 구독:", topic);

        this.subscription = this.client.subscribe(topic, (message: IMessage) => {
            try {
                const parsed = JSON.parse(message.body) as VlmAnalysisMessage;
                const data = parsed.data;
                console.log("[VlmSocket] 메시지 수신:", data);

                // 일반 메시지 콜백
                this.options.onMessage?.(data);

                // 상태별 콜백 처리
                this.handleStatusCallback(data);
            } catch (error) {
                console.error("[VlmSocket] 메시지 파싱 실패:", error, message.body);
            }
        });
    }

    /** 상태별 콜백 처리 */
    private handleStatusCallback(data: VlmAnalysisData): void {
        const status: VlmAnalysisStatus = data.status;
        const jobId = data.job_id;

        switch (status) {
            case "REQUESTED":
                console.log("[VlmSocket] 분석 요청됨, job_id:", jobId);
                this.options.onRequested?.(jobId);
                break;

            case "IN_PROGRESS":
                console.log("[VlmSocket] 분석 진행 중:", data.progress, data.progress_message, data.time);
                this.options.onProgress?.(jobId, data.progress, data.progress_message ?? "", data.time ?? 0);
                break;

            case "COMPLETED":
                console.log("[VlmSocket] 분석 완료, job_id:", jobId);
                console.log("  - 한 줄 요약:", data.one_line);
                console.log("  - 요약:", data.summary);
                console.log("  - 근거:", data.evidence);
                console.log("  - 권장사항:", data.recommendations);
                console.log("  - 원본:", data.raw_text);
                this.options.onCompleted?.(jobId, {
                    oneLine: data.one_line ?? "",
                    summary: data.summary ?? "",
                    evidence: data.evidence ?? "",
                    recommendations: data.recommendations ?? "",
                    rawText: data.raw_text ?? "",
                });
                break;

            case "FAILED":
                console.log("[VlmSocket] 분석 실패, job_id:", jobId);
                this.options.onFailed?.(jobId);
                break;

            case "CANCELLED":
                console.log("[VlmSocket] 분석 취소됨, job_id:", jobId);
                this.options.onCancelled?.(jobId);
                break;

            default:
                console.warn("[VlmSocket] 알 수 없는 상태:", status);
        }
    }

    /** 현재 구독 해제 */
    unsubscribe(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }
        this.currentTopic = null;
    }

    /** WebSocket 연결 해제 */
    disconnect(): void {
        this.reconnectAttempts = 0;
        this.unsubscribe();

        if (this.client) {
            this.client.deactivate();
            this.client = null;
        }

        this.setStatus("disconnected");
    }

    /** 메시지 전송 */
    send(destination: string, body: object): boolean {
        if (!this.client?.connected) {
            console.warn("[VlmSocket] 연결되지 않은 상태에서 전송 시도");
            return false;
        }

        try {
            this.client.publish({
                destination,
                body: JSON.stringify(body),
            });
            return true;
        } catch (error) {
            console.error("[VlmSocket] 메시지 전송 실패:", error);
            return false;
        }
    }

    private setStatus(newStatus: SocketStatus): void {
        if (this.status !== newStatus) {
            this.status = newStatus;
            this.options.onStatusChange?.(newStatus);
        }
    }

    private scheduleReconnect(): void {
        if (!this.options.autoReconnect) return;

        const maxAttempts = this.options.maxReconnectAttempts;
        if (maxAttempts !== -1 && this.reconnectAttempts >= maxAttempts) {
            console.warn("[VlmSocket] 최대 재연결 시도 횟수 초과");
            return;
        }

        this.reconnectAttempts++;
        console.log(`[VlmSocket] ${this.options.reconnectInterval}ms 후 재연결 시도 (${this.reconnectAttempts}/${maxAttempts === -1 ? "∞" : maxAttempts})`);
    }

    private cleanup(): void {
        if (this.subscription) {
            try {
                this.subscription.unsubscribe();
            } catch {
                // ignore
            }
            this.subscription = null;
        }

        if (this.client) {
            try {
                this.client.deactivate();
            } catch {
                // ignore
            }
            this.client = null;
        }
    }
}

/** 싱글톤 인스턴스 생성 헬퍼 */
let vlmSocketInstance: VlmSocket | null = null;

export const getVlmSocket = (options?: VlmSocketOptions): VlmSocket => {
    if (!vlmSocketInstance) {
        vlmSocketInstance = new VlmSocket(options);
    }
    return vlmSocketInstance;
};

export const resetVlmSocket = (): void => {
    if (vlmSocketInstance) {
        vlmSocketInstance.disconnect();
        vlmSocketInstance = null;
    }
};
