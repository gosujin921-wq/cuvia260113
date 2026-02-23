import React, { useState } from "react";
import { Event } from "@/types";
import CCTVIcon from "@/components/common/CCTVIcon";
import WebRTCVideo from "@/components/common/WebRTCVideo";
import { IceServerInfo } from "@/src/apis/camera/types";

export interface CameraInfo {
    rtsp_url: string;
}

interface UnityCCTVMeshTrackingProps {
    event: Event | null;
    onClose: () => void;
    cctvName: string;
    isMain: boolean;
    position?: { top?: number | string; left?: number | string; right?: number | string; bottom?: number | string };
    width?: number;
    hideControls?: boolean;
    highlighted?: boolean;
    onHover?: (cctvId: string | null) => void;
    cctvId?: string;
    mediaAgentUrl?: string;
    cameraInfo?: CameraInfo;
    iceServerList: IceServerInfo[];
}

const UnityCCTVMeshTracking: React.FC<UnityCCTVMeshTrackingProps> = ({ event, cctvName, position, isMain, width = 420, hideControls = false, highlighted = false, onHover, cctvId, mediaAgentUrl, cameraInfo, iceServerList }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [retryKey, setRetryKey] = useState(0);

    const handleConnectionChange = (connected: boolean) => {
        setIsConnected(connected);
        if (connected) {
            setConnectionError(null);
        }
    };

    const handleError = (error: string) => {
        setConnectionError(error);
    };

    const handleRetry = () => {
        setConnectionError(null);
        setRetryKey((prev) => prev + 1);
    };

    if (!event) return null;

    const isTheftEvent = event.title.includes("상가 절도 의심") || event.title.includes("현금 절취 포착");
    if (isTheftEvent) return null;

    const TOP_PANEL_HEIGHT = 56;
    const defaultPosition: { top: string; right: string } = { top: "1.25rem", right: "1.25rem" };
    const finalPosition = position || defaultPosition;

    const getTopValue = (top: string | number | undefined): string | undefined => {
        if (top === undefined) return undefined;
        if (typeof top === "number") {
            return hideControls ? `${top + TOP_PANEL_HEIGHT}px` : `${top}px`;
        }
        if (typeof top === "string") {
            if (top.includes("px")) {
                const numValue = parseInt(top.replace("px", ""));
                return hideControls ? `${numValue + TOP_PANEL_HEIGHT}px` : top;
            }
            return top;
        }
        return undefined;
    };

    const positionStyle: React.CSSProperties =
        position === undefined
            ? {}
            : {
                  position: "absolute",
                  zIndex: 1000,
                  ...(finalPosition.top !== undefined && { top: getTopValue(finalPosition.top) }),
                  ...("left" in finalPosition && finalPosition.left !== undefined && { left: typeof finalPosition.left === "number" ? `${finalPosition.left}px` : finalPosition.left }),
                  ...(finalPosition.right !== undefined && { right: typeof finalPosition.right === "number" ? `${finalPosition.right}px` : finalPosition.right }),
                  ...("bottom" in finalPosition && finalPosition.bottom !== undefined && { bottom: typeof finalPosition.bottom === "number" ? `${finalPosition.bottom}px` : finalPosition.bottom }),
              };

    return (
        <div style={positionStyle}>
            <div
                className="gradient-border-left-top flex flex-col rounded-lg"
                style={{
                    width: `${width}px`,
                    background: "linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)",
                    backdropFilter: "blur(2px)",
                    WebkitBackdropFilter: "blur(2px)",
                    ...(isMain
                        ? {
                              border: "3px solid #0066FF",
                              boxShadow: "0 0 20px rgba(0, 102, 255, 0.6), 0 0 40px rgba(0, 102, 255, 0.3)",
                          }
                        : {}),
                    ...(highlighted && isMain
                        ? {
                              outline: "3px solid #ef4444",
                              outlineOffset: "2px",
                          }
                        : highlighted
                        ? {
                              outline: "3px solid #3b82f6",
                              outlineOffset: "2px",
                          }
                        : {}),
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={() => onHover?.(cctvId as string)}
                onMouseLeave={() => onHover?.(null)}>
                <div className="flex items-center justify-between px-3 py-1.5 flex-shrink-0">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                        <CCTVIcon className="w-4 h-4 text-blue-400" />
                        <h3>{cctvName}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-500"}`} />
                        <span className="text-xs text-gray-400">{isConnected ? "연결됨" : "연결 중..."}</span>
                    </div>
                </div>

                <div className="flex-shrink-0">
                    <div className="px-3 pb-3">
                        <div className="w-full bg-[#0f0f0f] border border-[#31353a] rounded-md overflow-hidden relative" style={{ borderWidth: "1px", aspectRatio: "16/9" }}>
                            <WebRTCVideo key={retryKey} iceServerList={iceServerList ?? []} mediaAgentUrl={mediaAgentUrl} rtspUrl={cameraInfo?.rtsp_url} className="w-full h-full" autoConnect={true} onConnectionChange={handleConnectionChange} onError={handleError} />

                            <div className="absolute top-2 left-2" style={{ zIndex: 10 }}>
                                <span className={`px-2 py-0.5 ${isConnected ? "bg-red-500/90" : "bg-gray-500/90"} text-white text-xs font-semibold rounded flex items-center gap-1`}>
                                    <span className={`w-1.5 h-1.5 bg-white rounded-full ${isConnected ? "animate-pulse" : ""}`}></span>
                                    {isConnected ? "LIVE" : "CONNECTING"}
                                </span>
                            </div>

                            {connectionError && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                                    <div className="text-center">
                                        <p className="text-red-400 text-sm mb-2">{connectionError}</p>
                                        <button onClick={handleRetry} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
                                            재연결
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnityCCTVMeshTracking;
