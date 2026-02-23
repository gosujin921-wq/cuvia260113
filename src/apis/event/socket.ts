import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import type { EventEvt, EventVmsInfo, EventCameraInfo } from "./types";

/** WebSocket 이벤트 메시지 구조 */
export interface EventSocketMessage {
    vms_info: EventVmsInfo;
    camera_info: EventCameraInfo;
    evt: EventEvt;
}

/** WebSocket 연결 상태 */
export type SocketStatus = "connecting" | "connected" | "disconnected" | "error";

/** EventSocket 콜백 옵션 */
export interface EventSocketCallbacks {
    onMessage?: (data: EventSocketMessage) => void;
    onStatusChange?: (status: SocketStatus) => void;
    onError?: (error: string) => void;
}

/** EventSocket 설정 옵션 */
export interface EventSocketOptions extends EventSocketCallbacks {
    /** 자동 재연결 여부 (기본값: true) */
    autoReconnect?: boolean;
    /** 재연결 시도 간격 ms (기본값: 3000) */
    reconnectInterval?: number;
    /** 최대 재연결 시도 횟수 (기본값: 10, -1이면 무제한) */
    maxReconnectAttempts?: number;
}

const DEFAULT_OPTIONS: Required<Omit<EventSocketOptions, keyof EventSocketCallbacks>> = {
    autoReconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
};

/**
 * 이벤트 STOMP WebSocket 관리 클래스
 */
export class EventSocket {
    private client: Client | null = null;
    private subscription: StompSubscription | null = null;
    private status: SocketStatus = "disconnected";
    private reconnectAttempts = 0;
    private readonly url: string;
    private readonly options: Required<Omit<EventSocketOptions, keyof EventSocketCallbacks>> & EventSocketCallbacks;

    constructor(options: EventSocketOptions = {}) {
        const baseUrl = import.meta.env.VITE_WS_BASE_URL ?? import.meta.env.VITE_API_BASE_URL ?? "http://192.168.102.102:16000";
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
            console.warn("[EventSocket] 이미 연결되어 있습니다.");
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
                    console.log("[EventSocket] STOMP 연결 성공");
                    this.reconnectAttempts = 0;
                    this.setStatus("connected");

                    // 이벤트 토픽 구독
                    this.subscription =
                        this.client?.subscribe("/topic/event", (message: IMessage) => {
                            try {
                                const data = JSON.parse(message.body) as EventSocketMessage;
                                console.log("[EventSocket] 이벤트 수신:", data);
                                this.options.onMessage?.(data);
                            } catch (error) {
                                console.error("[EventSocket] 메시지 파싱 실패:", error, message.body);
                            }
                        }) ?? null;
                },

                onStompError: (frame) => {
                    console.error("[EventSocket] STOMP 에러:", frame.headers["message"]);
                    console.error("[EventSocket] 상세 정보:", frame.body);
                    this.setStatus("error");
                    this.options.onError?.(frame.headers["message"] || "STOMP Error");
                    this.scheduleReconnect();
                },

                onWebSocketError: (event) => {
                    console.error("[EventSocket] WebSocket 에러:", event);
                    this.setStatus("error");
                    this.options.onError?.("WebSocket Error");
                },

                onDisconnect: () => {
                    console.log("[EventSocket] 연결 종료");
                    this.setStatus("disconnected");
                },

                onWebSocketClose: (event) => {
                    console.log("[EventSocket] WebSocket 종료:", event.code, event.reason);
                    this.setStatus("disconnected");
                    this.scheduleReconnect();
                },
            });

            this.client.activate();
        } catch (error) {
            console.error("[EventSocket] 연결 생성 실패:", error);
            this.setStatus("error");
            this.scheduleReconnect();
        }
    }

    /** WebSocket 연결 해제 */
    disconnect(): void {
        this.reconnectAttempts = 0;

        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }

        if (this.client) {
            this.client.deactivate();
            this.client = null;
        }

        this.setStatus("disconnected");
    }

    /** 메시지 전송 */
    send(destination: string, body: object): boolean {
        if (!this.client?.connected) {
            console.warn("[EventSocket] 연결되지 않은 상태에서 전송 시도");
            return false;
        }

        try {
            this.client.publish({
                destination,
                body: JSON.stringify(body),
            });
            return true;
        } catch (error) {
            console.error("[EventSocket] 메시지 전송 실패:", error);
            return false;
        }
    }

    /** 토픽 구독 */
    subscribe(topic: string, callback: (data: EventSocketMessage) => void): StompSubscription | null {
        if (!this.client?.connected) {
            console.warn("[EventSocket] 연결되지 않은 상태에서 구독 시도");
            return null;
        }

        return this.client.subscribe(topic, (message: IMessage) => {
            try {
                const data = JSON.parse(message.body) as EventSocketMessage;
                callback(data);
            } catch (error) {
                console.error("[EventSocket] 메시지 파싱 실패:", error, message.body);
            }
        });
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
            console.warn("[EventSocket] 최대 재연결 시도 횟수 초과");
            return;
        }

        this.reconnectAttempts++;
        console.log(`[EventSocket] ${this.options.reconnectInterval}ms 후 재연결 시도 (${this.reconnectAttempts}/${maxAttempts === -1 ? "∞" : maxAttempts})`);
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
let eventSocketInstance: EventSocket | null = null;

export const getEventSocket = (options?: EventSocketOptions): EventSocket => {
    if (!eventSocketInstance) {
        eventSocketInstance = new EventSocket(options);
    }
    return eventSocketInstance;
};

export const resetEventSocket = (): void => {
    if (eventSocketInstance) {
        eventSocketInstance.disconnect();
        eventSocketInstance = null;
    }
};
