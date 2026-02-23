import { useEffect, useState, useCallback, useRef } from "react";
import { EventSocket, type EventSocketMessage, type EventSocketOptions, type SocketStatus } from "./socket";

interface UseEventSocketOptions extends Omit<EventSocketOptions, "onMessage" | "onStatusChange" | "onError"> {
    /** 자동 연결 여부 (기본값: true) */
    autoConnect?: boolean;
    /** 이벤트 최대 보관 개수 (기본값: 100) */
    maxEvents?: number;
}

interface UseEventSocketReturn {
    /** 현재 연결 상태 */
    status: SocketStatus;
    /** 연결 여부 */
    isConnected: boolean;
    /** 수신된 이벤트 목록 (최신순) */
    events: EventSocketMessage[];
    /** 마지막으로 수신된 이벤트 */
    lastEvent: EventSocketMessage | null;
    /** 수동 연결 */
    connect: () => void;
    /** 수동 연결 해제 */
    disconnect: () => void;
    /** 이벤트 목록 초기화 */
    clearEvents: () => void;
}

/**
 * 이벤트 WebSocket을 React에서 사용하기 위한 훅
 *
 * @example
 * ```tsx
 * const { status, isConnected, events, lastEvent } = useEventSocket();
 *
 * useEffect(() => {
 *     if (lastEvent) {
 *         console.log("새 이벤트:", lastEvent.evt);
 *     }
 * }, [lastEvent]);
 * ```
 */
export const useEventSocket = (options: UseEventSocketOptions = {}): UseEventSocketReturn => {
    const { autoConnect = true, maxEvents = 100, ...socketOptions } = options;

    const [status, setStatus] = useState<SocketStatus>("disconnected");
    const [events, setEvents] = useState<EventSocketMessage[]>([]);
    const [lastEvent, setLastEvent] = useState<EventSocketMessage | null>(null);

    const socketRef = useRef<EventSocket | null>(null);
    const maxEventsRef = useRef(maxEvents);
    const socketOptionsRef = useRef(socketOptions);
    const isConnectedRef = useRef(false);

    // maxEvents 변경 시 ref 업데이트
    useEffect(() => {
        maxEventsRef.current = maxEvents;
    }, [maxEvents]);

    // 메시지 핸들러
    const handleMessage = useCallback((data: EventSocketMessage) => {
        setLastEvent(data);
        setEvents((prev) => {
            const newEvents = [data, ...prev];
            if (newEvents.length > maxEventsRef.current) {
                return newEvents.slice(0, maxEventsRef.current);
            }
            return newEvents;
        });
    }, []);

    // 상태 변경 핸들러
    const handleStatusChange = useCallback((newStatus: SocketStatus) => {
        setStatus(newStatus);
    }, []);

    // 연결
    const connect = useCallback(() => {
        if (isConnectedRef.current || socketRef.current) {
            return;
        }

        socketRef.current = new EventSocket({
            ...socketOptionsRef.current,
            onMessage: handleMessage,
            onStatusChange: handleStatusChange,
        });
        socketRef.current.connect();
        isConnectedRef.current = true;
    }, [handleMessage, handleStatusChange]);

    // 연결 해제
    const disconnect = useCallback(() => {
        socketRef.current?.disconnect();
        socketRef.current = null;
        isConnectedRef.current = false;
    }, []);

    // 이벤트 초기화
    const clearEvents = useCallback(() => {
        setEvents([]);
        setLastEvent(null);
    }, []);

    // 마운트 시 자동 연결, 언마운트 시 정리
    useEffect(() => {
        if (autoConnect && !isConnectedRef.current) {
            connect();
        }

        return () => {
            socketRef.current?.disconnect();
            socketRef.current = null;
            isConnectedRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoConnect]);

    return {
        status,
        isConnected: status === "connected",
        events,
        lastEvent,
        connect,
        disconnect,
        clearEvents,
    };
};

/**
 * 특정 이벤트 타입만 필터링하여 수신하는 훅
 *
 * @example
 * ```tsx
 * // 배회(0), 쓰러짐(10), 폭력(12) 이벤트만 수신
 * const { events } = useFilteredEventSocket({
 *     eventTypes: [0, 10, 12],
 * });
 * ```
 */
interface UseFilteredEventSocketOptions extends UseEventSocketOptions {
    /** 수신할 이벤트 타입 목록 */
    eventTypes?: number[];
    /** 수신할 이벤트 상태 목록 (1: 시작, 2: 진행중, 4: 종료) */
    eventStats?: (1 | 2 | 4)[];
}

export const useFilteredEventSocket = (options: UseFilteredEventSocketOptions = {}): UseEventSocketReturn => {
    const { eventTypes, eventStats, maxEvents = 100, autoConnect = true, ...socketOptions } = options;

    const [status, setStatus] = useState<SocketStatus>("disconnected");
    const [filteredEvents, setFilteredEvents] = useState<EventSocketMessage[]>([]);
    const [lastFilteredEvent, setLastFilteredEvent] = useState<EventSocketMessage | null>(null);

    const socketRef = useRef<EventSocket | null>(null);
    const eventTypesRef = useRef(eventTypes);
    const eventStatsRef = useRef(eventStats);
    const maxEventsRef = useRef(maxEvents);
    const socketOptionsRef = useRef(socketOptions);
    const isConnectedRef = useRef(false);

    useEffect(() => {
        eventTypesRef.current = eventTypes;
        eventStatsRef.current = eventStats;
        maxEventsRef.current = maxEvents;
    }, [eventTypes, eventStats, maxEvents]);

    // 필터링 및 메시지 핸들러
    const handleMessage = useCallback((data: EventSocketMessage) => {
        const evt = data.evt;
        const types = eventTypesRef.current;
        const stats = eventStatsRef.current;

        if (types && types.length > 0 && !types.includes(evt.type)) {
            return;
        }

        if (stats && stats.length > 0 && !stats.includes(evt.stat)) {
            return;
        }

        setLastFilteredEvent(data);
        setFilteredEvents((prev) => {
            const max = maxEventsRef.current;
            const newEvents = [data, ...prev];
            return newEvents.length > max ? newEvents.slice(0, max) : newEvents;
        });
    }, []);

    const handleStatusChange = useCallback((newStatus: SocketStatus) => {
        setStatus(newStatus);
    }, []);

    const connect = useCallback(() => {
        if (isConnectedRef.current || socketRef.current) {
            return;
        }

        socketRef.current = new EventSocket({
            ...socketOptionsRef.current,
            onMessage: handleMessage,
            onStatusChange: handleStatusChange,
        });
        socketRef.current.connect();
        isConnectedRef.current = true;
    }, [handleMessage, handleStatusChange]);

    const disconnect = useCallback(() => {
        socketRef.current?.disconnect();
        socketRef.current = null;
        isConnectedRef.current = false;
    }, []);

    const clearEvents = useCallback(() => {
        setFilteredEvents([]);
        setLastFilteredEvent(null);
    }, []);

    useEffect(() => {
        if (autoConnect && !isConnectedRef.current) {
            connect();
        }

        return () => {
            socketRef.current?.disconnect();
            socketRef.current = null;
            isConnectedRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoConnect]);

    return {
        status,
        isConnected: status === "connected",
        events: filteredEvents,
        lastEvent: lastFilteredEvent,
        connect,
        disconnect,
        clearEvents,
    };
};
