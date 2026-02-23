import { useMutation } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useRef } from "react";
import { postVlmRequest } from "./service";
import { VlmRequest, VlmAnalysisData } from "./types";
import { VlmSocket, SocketStatus, VlmSocketOptions } from "./socket";

export const usePostVlmRequest = () => {
    return useMutation({
        mutationFn: (payload: VlmRequest) => postVlmRequest(payload),
    });
};

/** useVlmSocket 옵션 */
export interface UseVlmSocketOptions {
    /** 자동 연결 여부 (기본값: true) */
    autoConnect?: boolean;
    /** 자동 재연결 여부 (기본값: true) */
    autoReconnect?: boolean;
    /** 재연결 시도 간격 ms (기본값: 3000) */
    reconnectInterval?: number;
    /** 최대 재연결 시도 횟수 (기본값: 10, -1이면 무제한) */
    maxReconnectAttempts?: number;
}

/** useVlmSocket 반환 타입 */
export interface UseVlmSocketReturn {
    /** 현재 연결 상태 */
    status: SocketStatus;
    /** 마지막으로 수신한 메시지 */
    lastMessage: VlmAnalysisData | null;
    /** 현재 작업 ID */
    jobId: string | null;
    /** 분석 진행 상태 */
    analysisStatus: VlmAnalysisData["status"] | null;
    /** 진행 메시지 (IN_PROGRESS 상태) */
    progressMessage: string;
    /** 진행 순서 (IN_PROGRESS 상태) */
    progressSequence: number;
    /** 완료된 분석 결과 (COMPLETED 상태) */
    result: {
        oneLine: string;
        summary: string;
        evidence: string;
        recommendations: string;
        rawText: string;
    } | null;
    /** 수동 연결 */
    connect: () => void;
    /** 연결 해제 */
    disconnect: () => void;
    /** 분석 토픽 구독 */
    subscribeToAnalysis: (eventId: number, vmsId: number, cameraId: string) => void;
    /** 구독 해제 */
    unsubscribe: () => void;
}

/**
 * VLM 분석 WebSocket Hook
 */
export const useVlmSocket = (options: UseVlmSocketOptions = {}): UseVlmSocketReturn => {
    const { autoConnect = true, autoReconnect = true, reconnectInterval = 3000, maxReconnectAttempts = 10 } = options;

    const [status, setStatus] = useState<SocketStatus>("disconnected");
    const [lastMessage, setLastMessage] = useState<VlmAnalysisData | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);
    const [analysisStatus, setAnalysisStatus] = useState<VlmAnalysisData["status"] | null>(null);
    const [progressMessage, setProgressMessage] = useState("");
    const [progressSequence, setProgressSequence] = useState(0);
    const [result, setResult] = useState<UseVlmSocketReturn["result"]>(null);

    const socketRef = useRef<VlmSocket | null>(null);
    const isInitializedRef = useRef(false);

    // 소켓 초기화 (한 번만 실행)
    useEffect(() => {
        if (isInitializedRef.current) return;
        isInitializedRef.current = true;

        const socketOptions: VlmSocketOptions = {
            autoReconnect,
            reconnectInterval,
            maxReconnectAttempts,
            onStatusChange: setStatus,
            onMessage: (data) => {
                setLastMessage(data);
                setJobId(data.job_id);
                setAnalysisStatus(data.status);
            },
            onRequested: (id) => {
                setJobId(id);
                setResult(null);
                setProgressMessage("");
                setProgressSequence(0);
            },
            onProgress: (_id, sequence, message) => {
                setProgressSequence(sequence);
                setProgressMessage(message);
            },
            onCompleted: (_id, data) => {
                setResult(data);
            },
            onFailed: () => {
                setResult(null);
            },
            onCancelled: () => {
                setResult(null);
            },
        };

        socketRef.current = new VlmSocket(socketOptions);

        if (autoConnect) {
            socketRef.current.connect();
        }

        return () => {
            socketRef.current?.disconnect();
            socketRef.current = null;
            isInitializedRef.current = false;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // 빈 의존성 배열 - 마운트 시 한 번만 실행 (의도적으로 초기 옵션만 사용)

    const connect = useCallback(() => {
        socketRef.current?.connect();
    }, []);

    const disconnect = useCallback(() => {
        socketRef.current?.disconnect();
    }, []);

    // 연결 후 구독하는 함수
    const subscribeToAnalysis = useCallback((eventId: number, vmsId: number, cameraId: string) => {
        const socket = socketRef.current;
        if (!socket) {
            console.warn("[useVlmSocket] 소켓 인스턴스가 없습니다.");
            return;
        }

        // 연결되지 않은 상태면 먼저 연결
        if (socket.getStatus() !== "connected") {
            console.log("[useVlmSocket] 연결 시작 후 구독 예정...");
            socket.connect();
        }

        // 구독 시도 (소켓 내부에서 연결 후 자동 구독 처리)
        socket.subscribeToAnalysis(eventId, vmsId, cameraId);
    }, []);

    const unsubscribe = useCallback(() => {
        socketRef.current?.unsubscribe();
    }, []);

    return {
        status,
        lastMessage,
        jobId,
        analysisStatus,
        progressMessage,
        progressSequence,
        result,
        connect,
        disconnect,
        subscribeToAnalysis,
        unsubscribe,
    };
};
