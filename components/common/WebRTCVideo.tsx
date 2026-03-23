import { IceServerInfo } from "@/src/apis/camera/types";
import { useRef, useEffect, useCallback, useState } from "react";

export interface WebRTCVideoProps {
    mediaAgentUrl?: string;
    rtspUrl?: string;
    /** WebRTC 실패·미가용 시 재생할 로컬/정적 영상 (예: /cctv_img/cctv1.mov) */
    fallbackVideoSrc?: string;
    className?: string;
    autoConnect?: boolean;
    iceServerList: IceServerInfo[];
    onConnectionChange?: (isConnected: boolean) => void;
    onError?: (error: string) => void;
    /** 로컬 폴백 영상 재생 여부 (부모에서 캡션 등 배치용) */
    onFallbackPlaybackChange?: (usingFallback: boolean) => void;
    /** true면 컴포넌트 내부 폴백 안내 문구를 렌더하지 않음 (부모가 비디오 아래에 둘 때) */
    hideFallbackDisclaimer?: boolean;
}

const WebRTCVideo = ({
    iceServerList,
    mediaAgentUrl,
    rtspUrl,
    fallbackVideoSrc,
    className = "",
    autoConnect = true,
    onConnectionChange,
    onError,
    onFallbackPlaybackChange,
    hideFallbackDisclaimer = false,
}: WebRTCVideoProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const isConnectingRef = useRef(false);
    const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const fallbackAfterErrorRef = useRef(false);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [usingFallbackFile, setUsingFallbackFile] = useState(false);

    const onConnectionChangeRef = useRef(onConnectionChange);
    const onErrorRef = useRef(onError);
    const onFallbackPlaybackChangeRef = useRef(onFallbackPlaybackChange);

    useEffect(() => {
        onConnectionChangeRef.current = onConnectionChange;
        onErrorRef.current = onError;
        onFallbackPlaybackChangeRef.current = onFallbackPlaybackChange;
    });

    useEffect(() => {
        onFallbackPlaybackChangeRef.current?.(usingFallbackFile);
    }, [usingFallbackFile]);

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

    const attachFallbackFile = useCallback((src: string) => {
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = null;
        v.src = src;
        v.loop = true;
        v.muted = true;
        v.playsInline = true;
        void v.play().catch(() => {});
        setUsingFallbackFile(true);
        setConnectionError(null);
        setIsConnected(false);
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
        const currentIceServers = iceServerListRef.current;

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
                setUsingFallbackFile(false);
                onConnectionChangeRef.current?.(true);

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

    const clearFallbackVideo = useCallback(() => {
        const v = videoRef.current;
        if (v) {
            v.pause();
            v.removeAttribute("src");
            v.load();
        }
        setUsingFallbackFile(false);
    }, []);

    const startStreaming = useCallback(() => {
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

        if (!currentIceServers || currentIceServers.length === 0) {
            console.log("[WebRTC] ICE 서버 목록 아직 로딩 중, 연결 대기");
            return;
        }

        isConnectingRef.current = true;
        setConnectionError(null);
        setUsingFallbackFile(false);

        console.log("[WebRTC] 연결 시작:", currentMediaAgentUrl);
        const ws = new WebSocket(currentMediaAgentUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("[WebRTC] WebSocket 연결 성공");
            createPeerConnection();
        };

        ws.onmessage = async (message) => {
            try {
                const parsedMessage = JSON.parse(message.data);

                switch (parsedMessage.id) {
                    case "sdpAnswer":
                        await handleSdpAnswer(parsedMessage);
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

    const canTryWebRtc = Boolean(mediaAgentUrl && rtspUrl && iceServerList && iceServerList.length > 0);

    useEffect(() => {
        fallbackAfterErrorRef.current = false;
    }, [mediaAgentUrl, rtspUrl, iceServerList?.length, fallbackVideoSrc]);

    useEffect(() => {
        if (!autoConnect) return;

        if (!canTryWebRtc) {
            if (fallbackVideoSrc) {
                clearFallbackVideo();
                attachFallbackFile(fallbackVideoSrc);
            }
            return () => {
                if (fallbackVideoSrc) {
                    clearFallbackVideo();
                }
            };
        }

        clearFallbackVideo();
        const timer = setTimeout(() => {
            startStreaming();
        }, 100);

        return () => {
            clearTimeout(timer);
            stopStreaming();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoConnect, canTryWebRtc, fallbackVideoSrc, mediaAgentUrl, rtspUrl, iceServerList?.length]);

    useEffect(() => {
        if (!connectionError || !fallbackVideoSrc || fallbackAfterErrorRef.current || !canTryWebRtc) return;

        fallbackAfterErrorRef.current = true;
        stopStreaming();
        requestAnimationFrame(() => {
            attachFallbackFile(fallbackVideoSrc);
        });
    }, [connectionError, fallbackVideoSrc, canTryWebRtc, stopStreaming, attachFallbackFile]);

    const isWaitingForIceServer = !!mediaAgentUrl && !!rtspUrl && (!iceServerList || iceServerList.length === 0) && !usingFallbackFile;

    return (
        <div className={`relative flex h-full min-h-0 flex-col ${className}`}>
            <div className="relative min-h-0 w-full flex-1">
                <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover bg-black" />
                {isWaitingForIceServer && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
                            <span className="text-xs text-yellow-400">ICE 서버 로딩...</span>
                        </div>
                    </div>
                )}
                {!isConnected && !connectionError && !usingFallbackFile && iceServerList && mediaAgentUrl && rtspUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            <span className="text-xs text-white">연결 중...</span>
                        </div>
                    </div>
                )}
                {connectionError && !usingFallbackFile && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                        <span className="px-2 text-center text-xs text-red-400">{connectionError}</span>
                    </div>
                )}
                {!mediaAgentUrl && !usingFallbackFile && !fallbackVideoSrc && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                        <span className="text-xs text-gray-400">미디어 에이전트 없음</span>
                    </div>
                )}
                {!rtspUrl && mediaAgentUrl && !usingFallbackFile && !fallbackVideoSrc && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                        <span className="text-xs text-gray-400">RTSP URL 없음</span>
                    </div>
                )}
            </div>
            {usingFallbackFile && !hideFallbackDisclaimer ? (
                <div
                    className="mt-2 flex items-center"
                    role="note"
                    aria-live="polite">
                <span className="mr-1 h-2 w-2 rounded-full bg-amber-400 inline-block" aria-hidden="true" />
                <p className="text-center text-[11px] font-semibold leading-snug tracking-wide text-amber-100 sm:text-xs m-0 p-0">
                    해당 영상은 실제 교통상황과 다를 수 있습니다
                </p>
            </div>
            ) : null}
        </div>
    );
};

export default WebRTCVideo;
