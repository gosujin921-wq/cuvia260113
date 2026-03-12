import { useState, useRef, useCallback, useEffect } from "react";
import { MapStreamData, ChartStreamData, isStepStreamPayload, isMessageStreamPayload, isMapStreamPayload, isChartStreamPayload, isCompleteStreamPayload, CompleteStreamPayload, isTableStreamPayload, TableStreamData, isDisclaimerStreamPayload } from "@/types/streamJson.types";

const API_BASE_URL = "";

export interface ChatStreamState {
    isStreaming: boolean;
    currentStep: number;
    stepMessage: string;
    messageContent: string;
    mapData: MapStreamData | null;
    chartData: ChartStreamData[];
    tableData: TableStreamData | null;
    disclaimer: string | null;
    error: string | null;
    isComplete: boolean;
}

interface UseChatStreamOptions {
    onStepChange?: (step: number, message: string) => void;
    onMessageReceived?: (content: string, intent?: string) => void;
    onMapDataReceived?: (data: MapStreamData) => void;
    onChartDataReceived?: (data: ChartStreamData) => void;
    onTableDataReceived?: (data: TableStreamData) => void;
    onDisclaimerReceived?: (data: string) => void;
    onComplete?: (success: boolean, message: string, data?: CompleteStreamPayload) => void;
    onError?: (error: string) => void;
}

const generateSessionId = (): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `session_${timestamp}_${random}`;
};

export const useChatStream = (options: UseChatStreamOptions = {}) => {
    const [state, setState] = useState<ChatStreamState>({
        isStreaming: false,
        currentStep: 0,
        stepMessage: "",
        messageContent: "",
        mapData: null,
        chartData: [],
        tableData: null,
        disclaimer: null,
        error: null,
        isComplete: false,
    });

    const sessionIdRef = useRef<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const initSession = useCallback(() => {
        if (!sessionIdRef.current) {
            sessionIdRef.current = generateSessionId();
        }
        return sessionIdRef.current;
    }, []);

    const resetSession = useCallback(() => {
        sessionIdRef.current = null;
    }, []);

    const getSessionId = useCallback(() => sessionIdRef.current, []);

    const resetState = useCallback(() => {
        setState({
            isStreaming: false,
            currentStep: 0,
            stepMessage: "",
            messageContent: "",
            mapData: null,
            chartData: [],
            tableData: null,
            disclaimer: null,
            error: null,
            isComplete: false,
        });
    }, []);

    const abortStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setState((prev) => ({ ...prev, isStreaming: false }));
    }, []);

    const startStream = useCallback(
        async (userMessage: string) => {
            const sessionId = initSession();

            abortStream();
            resetState();

            setState((prev) => ({ ...prev, isStreaming: true, isComplete: false }));

            const controller = new AbortController();
            abortControllerRef.current = controller;

            const url = `${API_BASE_URL}/api/chat/stream?user_message=${encodeURIComponent(userMessage)}&session_id=${sessionId}`;

            try {
                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        Accept: "text/event-stream",
                    },
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const reader = response.body?.getReader();
                if (!reader) {
                    throw new Error("Response body is not readable");
                }

                const decoder = new TextDecoder();
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });

                    const lines = buffer.split("\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (!trimmedLine || !trimmedLine.startsWith("data: ")) {
                            continue;
                        }

                        const jsonStr = trimmedLine.slice(6);
                        if (!jsonStr) continue;

                        try {
                            const payload = JSON.parse(jsonStr);
                            if (isStepStreamPayload(payload)) {
                                const { step, message } = payload.data;
                                setState((prev) => ({
                                    ...prev,
                                    currentStep: step,
                                    stepMessage: message,
                                }));
                                options.onStepChange?.(step, message);
                            } else if (isMessageStreamPayload(payload)) {
                                setState((prev) => ({
                                    ...prev,
                                    messageContent: payload.content,
                                }));
                                options.onMessageReceived?.(payload.content, payload.intent);
                            } else if (isMapStreamPayload(payload)) {
                                setState((prev) => ({
                                    ...prev,
                                    mapData: payload.data,
                                }));
                                options.onMapDataReceived?.(payload.data);
                            } else if (isChartStreamPayload(payload)) {
                                setState((prev) => ({
                                    ...prev,
                                    chartData: [...prev.chartData, payload.data],
                                }));
                                options.onChartDataReceived?.(payload.data);
                            } else if (isTableStreamPayload(payload)) {
                                setState((prev) => {
                                    return {
                                        ...prev,
                                        tableData: payload.data,
                                    };
                                });
                                options.onTableDataReceived?.(payload.data);
                            } else if (isDisclaimerStreamPayload(payload)) {
                                setState((prev) => ({ ...prev, disclaimer: payload.data }));
                                options.onDisclaimerReceived?.(payload.data);
                            } else if (isCompleteStreamPayload(payload)) {
                                setState((prev) => ({
                                    ...prev,
                                    isComplete: true,
                                    isStreaming: false,
                                    messageContent: payload.message,
                                    mapData: payload.data?.map_data ?? prev.mapData,
                                    chartData: payload.data?.chart_data ? [...prev.chartData, payload.data.chart_data] : prev.chartData,
                                    disclaimer: payload.data?.disclaimer ?? prev.disclaimer,
                                }));
                                options.onComplete?.(payload.success, payload.message, payload);
                            }
                        } catch (parseError) {
                            console.warn("[useChatStream] JSON 파싱 실패:", jsonStr);
                        }
                    }
                }

                setState((prev) => ({ ...prev, isStreaming: false }));
            } catch (error) {
                if ((error as Error).name === "AbortError") {
                    return;
                }

                const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
                setState((prev) => ({
                    ...prev,
                    isStreaming: false,
                    error: errorMessage,
                }));
                options.onError?.(errorMessage);
            }
        },
        [initSession, abortStream, resetState, options]
    );

    useEffect(() => {
        return () => {
            abortStream();
        };
    }, [abortStream]);

    return {
        ...state,
        sessionId: sessionIdRef.current,
        startStream,
        abortStream,
        initSession,
        resetSession,
        getSessionId,
        resetState,
    };
};

export default useChatStream;
