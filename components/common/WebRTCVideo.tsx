import { IceServerInfo } from "@/src/apis/camera/types";
import { useRef, useEffect, useCallback, useState } from "react";

export interface WebRTCVideoProps {
    mediaAgentUrl?: string;
    rtspUrl?: string;
    className?: string;
    autoConnect?: boolean;
    iceServerList: IceServerInfo[];
    onConnectionChange?: (isConnected: boolean) => void;
    onError?: (error: string) => void;
}

const WebRTCVideo = ({ iceServerList, mediaAgentUrl, rtspUrl, className = "", autoConnect = true, onConnectionChange, onError }: WebRTCVideoProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const isConnectingRef = useRef(false);
    const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    // 콜백을 ref로 저장하여 의존성 문제 해결
    const onConnectionChangeRef = useRef(onConnectionChange);
    const onErrorRef = useRef(onError);

    useEffect(() => {
        onConnectionChangeRef.current = onConnectionChange;
        onErrorRef.current = onError;
    });

    // props를 ref로 저장하여 콜백 내부에서 최신 값 사용
    const rtspUrlRef = useRef(rtspUrl);
    const iceServerListRef = useRef(iceServerList);

    useEffect(() => {
        rtspUrlRef.current = rtspUrl;
        iceServerListRef.current = iceServerList;
    });

    const sendMessage = useCallback((msg: object) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(msg));
        }
    }, []);

    const handleSdpAnswer = useCallback(async (message: { sdpAnswer: string }) => {
        try {
            if (!pcRef.current) return;
            const answer = new RTCSessionDescription({
                type: "answer",
                sdp: message.sdpAnswer,
            });
            await pcRef.current.setRemoteDescription(answer);
            console.log("[WebRTC] SDP Answer 설정 완료");
        } catch (error) {
            console.error("[WebRTC] SDP Answer 설정 실패:", error);
        }
    }, []);

    const handleIceCandidate = useCallback(async (message: { candidate: RTCIceCandidateInit }) => {
        try {
            if (!pcRef.current) return;
            await pcRef.current.addIceCandidate(new RTCIceCandidate(message.candidate));
        } catch (error) {
            console.error("[WebRTC] ICE Candidate 추가 실패:", error);
        }
    }, []);

    const createPeerConnection = useCallback(() => {
        const currentRtspUrl = rtspUrlRef.current;
        const currentIceServers = iceServerList;

        if (!currentRtspUrl) {
            console.log("[WebRTC] RTSP URL 없음");
            return;
        }

        if (!currentIceServers || currentIceServers.length === 0) {
            console.log("[WebRTC] ICE 서버 목록 없음, PeerConnection 생성 중단");
            return;
        }

        const pc = new RTCPeerConnection({ iceServers: currentIceServers });
        pcRef.current = pc;

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendMessage({ id: "onIceCandidate", candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            if (videoRef.current && event.streams[0]) {
                videoRef.current.srcObject = event.streams[0];
                setIsConnected(true);
                setConnectionError(null);
                onConnectionChangeRef.current?.(true);

                // 기존 ping interval 정리 후 새로 시작
                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current);
                }
                pingIntervalRef.current = setInterval(() => {
                    sendMessage({ id: "ping" });
                }, 5000);
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
                const error = "연결 실패";
                setConnectionError(error);
                setIsConnected(false);
                onConnectionChangeRef.current?.(false);
                onErrorRef.current?.(error);
            }
        };

        pc.addTransceiver("video", { direction: "recvonly" });
        pc.addTransceiver("audio", { direction: "recvonly" });

        pc.createOffer()
            .then((offer) => pc.setLocalDescription(offer))
            .then(() => {
                sendMessage({
                    id: "start",
                    webrtc_info: { sdp_offer: pc.localDescription?.sdp },
                    camera_info: { rtsp_url: currentRtspUrl },
                });
            })
            .catch((error) => {
                console.error("[WebRTC] Offer 생성 실패:", error);
                const errorMsg = "Offer 생성 실패";
                setConnectionError(errorMsg);
                onErrorRef.current?.(errorMsg);
            });
    }, [sendMessage]);

    const stopStreaming = useCallback(() => {
        isConnectingRef.current = false;

        // Ping interval 정리
        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
        }

        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsConnected(false);
    }, []);

    const startStreaming = useCallback(() => {
        // 이미 연결 중이거나 연결된 상태면 무시
        if (isConnectingRef.current || wsRef.current) {
            console.log("[WebRTC] 이미 연결 중이거나 연결됨");
            return;
        }

        const currentMediaAgentUrl = mediaAgentUrl;
        const currentRtspUrl = rtspUrlRef.current;
        const currentIceServers = iceServerList;

        if (!currentMediaAgentUrl || !currentRtspUrl) {
            console.log("[WebRTC] URL 없음:", { mediaAgentUrl: currentMediaAgentUrl, rtspUrl: currentRtspUrl });
            return;
        }

        // ICE 서버 목록이 없으면 연결하지 않음
        if (!currentIceServers || currentIceServers.length === 0) {
            console.log("[WebRTC] ICE 서버 목록 아직 로딩 중, 연결 대기");
            return;
        }

        isConnectingRef.current = true;
        setConnectionError(null);

        console.log("[WebRTC] 연결 시작:", currentMediaAgentUrl);
        const ws = new WebSocket(currentMediaAgentUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("[WebRTC] WebSocket 연결 성공");
            createPeerConnection();
        };

        ws.onmessage = (message) => {
            try {
                const parsedMessage = JSON.parse(message.data);

                switch (parsedMessage.id) {
                    case "sdpAnswer":
                        handleSdpAnswer(parsedMessage);
                        break;
                    case "iceCandidate":
                        handleIceCandidate(parsedMessage);
                        break;
                    case "error":
                        console.error("[WebRTC] 서버 에러:", parsedMessage.message);
                        setConnectionError(parsedMessage.message);
                        onErrorRef.current?.(parsedMessage.message);
                        break;
                    case "pong":
                        // ping 응답 무시
                        break;
                    default:
                        console.warn("[WebRTC] 알 수 없는 메시지:", parsedMessage);
                }
            } catch (e) {
                console.error("[WebRTC] 메시지 파싱 실패:", e);
            }
        };

        ws.onerror = (error) => {
            console.error("[WebRTC] WebSocket 에러:", error);
            const errorMsg = "WebSocket 연결 실패";
            setConnectionError(errorMsg);
            onErrorRef.current?.(errorMsg);
            isConnectingRef.current = false;
        };

        ws.onclose = () => {
            console.log("[WebRTC] WebSocket 연결 종료");
            wsRef.current = null;
            isConnectingRef.current = false;
            setIsConnected(false);
            onConnectionChangeRef.current?.(false);
        };
    }, [mediaAgentUrl, createPeerConnection, handleSdpAnswer, handleIceCandidate]);

    // 연결 시작/정지 - ICE 서버 목록이 준비되면 연결 시작
    useEffect(() => {
        if (!autoConnect || !mediaAgentUrl || !rtspUrl || !iceServerList) {
            return;
        }

        // 약간의 지연을 두어 중복 호출 방지
        const timer = setTimeout(() => {
            startStreaming();
        }, 100);

        return () => {
            clearTimeout(timer);
            stopStreaming();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoConnect, mediaAgentUrl, rtspUrl, iceServerList]);

    // ICE 서버 로딩 중 또는 준비 안됨 상태 표시
    const isWaitingForIceServer = !iceServerList && mediaAgentUrl && rtspUrl;

    return (
        <div className={`relative ${className}`}>
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover bg-black" />
            {isWaitingForIceServer && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-yellow-400 text-xs">ICE 서버 로딩...</span>
                    </div>
                </div>
            )}
            {!isConnected && !connectionError && iceServerList && mediaAgentUrl && rtspUrl && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-white text-xs">연결 중...</span>
                    </div>
                </div>
            )}
            {connectionError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <span className="text-red-400 text-xs text-center px-2">{connectionError}</span>
                </div>
            )}
            {!mediaAgentUrl && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <span className="text-gray-400 text-xs">미디어 에이전트 없음</span>
                </div>
            )}
            {!rtspUrl && mediaAgentUrl && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <span className="text-gray-400 text-xs">RTSP URL 없음</span>
                </div>
            )}
        </div>
    );
};

export default WebRTCVideo;
