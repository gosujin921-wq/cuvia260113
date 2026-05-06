import { useEffect, useState } from "react";
import { CameraListPageData, IceServerInfo } from "@/src/apis/camera/types";
import WebRTCVideo from "@/components/common/WebRTCVideo";

interface UnityBottomPanelProps {
    iceServerList?: IceServerInfo[];
    cctvList: CameraListPageData[];
    showCCTV: boolean;
    hideControls: boolean;
    leftPanelWidth: number;
    windowWidth: number;
    cctvScrollContainerRef: React.RefObject<HTMLDivElement | null>;
    isUserScrollingRef: React.MutableRefObject<boolean>;
    userScrollTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
    autoScrollIntervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
    mediaAgentUrl?: string;
}

interface BottomPanelCCTVItemProps {
    cctv: CameraListPageData;
    width: number;
    height: number;
    mediaAgentUrl?: string;
    iceServerList: IceServerInfo[];
}

interface BottomPanelCCTVItemProps2 extends BottomPanelCCTVItemProps {
    play: boolean;
}

const BottomPanelCCTVItem = ({ cctv, width, height, mediaAgentUrl, iceServerList, play }: BottomPanelCCTVItemProps2) => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [retryKey, setRetryKey] = useState(0);

    const handleConnectionChange = (connected: boolean) => {
        setIsConnected(connected);
        if (connected) {
            setConnectionError(null);
            setRetryCount(0);
        }
    };

    const handleError = (error: string) => {
        if (retryCount < 1) {
            console.log(`[CCTV] ${cctv.camera_name} 연결 실패, 재시도 중... (${retryCount + 1}/1)`);
            setRetryCount((prev) => prev + 1);
            setTimeout(() => {
                setRetryKey((prev) => prev + 1);
            }, 1000);
        } else {
            setConnectionError(error);
        }
    };

    return (
        <div className="relative rounded overflow-hidden border-2 border-[#31353a] hover:border-blue-500/50 flex-shrink-0" style={{ width: `${width}px`, height: `${height}px` }}>
            <WebRTCVideo key={retryKey} iceServerList={iceServerList ?? []} mediaAgentUrl={mediaAgentUrl} rtspUrl={cctv.rtsp_url} className="w-full h-full" autoConnect={true} play={play} onConnectionChange={handleConnectionChange} onError={handleError} />
            <div className="absolute top-2 left-2" style={{ zIndex: 10 }}>
                <span className={`px-2 py-0.5 ${isConnected ? "bg-red-500/90" : connectionError ? "bg-orange-500/90" : "bg-gray-500/90"} text-white text-xs font-semibold rounded flex items-center gap-1`}>
                    {isConnected && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>}
                    {isConnected ? "LIVE" : connectionError ? "ERR" : "OFF"}
                </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-0.5">
                <div className="text-white text-[10px] font-semibold truncate" title={cctv.camera_name}>
                    {cctv.camera_name}
                </div>
            </div>
        </div>
    );
};

const UnityBottomPanel = ({ iceServerList, showCCTV, hideControls, leftPanelWidth, windowWidth, cctvScrollContainerRef, isUserScrollingRef, userScrollTimeoutRef, autoScrollIntervalRef, cctvList, mediaAgentUrl }: UnityBottomPanelProps) => {
    const [play, setPlay] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "2") {
                setPlay((prev) => !prev);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const rightPanelWidth = 370;
    const verticalPadding = 16;
    const gap = 12;
    const paddingHorizontal = 16;
    const totalPaddingWidth = paddingHorizontal * 2;

    // CCTV 패널 좌우 여백 동일하게
    const leftPanelGap = 20; // 좌측 패널과의 여백
    const rightPanelGap = 20; // 우측 패널과의 여백
    const availableWidth = windowWidth - leftPanelWidth - rightPanelWidth - leftPanelGap - rightPanelGap;

    // 패널 높이 고정 (기존 4개 기준 높이 유지)
    const fixedItemHeight = 150; // 고정 높이
    const minItemWidth = 200; // 최소 아이템 너비

    // 표시할 아이템 개수 계산
    const calculateVisibleCount = () => {
        const minWidthForN = (n: number) => minItemWidth * n + gap * (n - 1) + totalPaddingWidth;
        let maxCount = 1;
        for (let i = 1; i <= 10; i++) {
            if (minWidthForN(i) <= availableWidth) {
                maxCount = i;
            } else {
                break;
            }
        }
        return Math.max(1, maxCount);
    };

    const visibleCount = calculateVisibleCount();
    const totalGapWidth = gap * (visibleCount - 1);
    const itemWidth = Math.floor((availableWidth - totalGapWidth - totalPaddingWidth) / visibleCount);
    const itemHeight = fixedItemHeight; // 고정 높이 사용

    // 자동 스크롤 로직
    useEffect(() => {
        if (!showCCTV || hideControls) {
            if (autoScrollIntervalRef.current) {
                clearInterval(autoScrollIntervalRef.current);
                autoScrollIntervalRef.current = null;
            }
            return;
        }

        const startAutoScroll = () => {
            if (autoScrollIntervalRef.current) {
                clearInterval(autoScrollIntervalRef.current);
            }

            autoScrollIntervalRef.current = setInterval(() => {
                if (cctvScrollContainerRef.current && !isUserScrollingRef.current) {
                    const container = cctvScrollContainerRef.current;
                    const totalItemWidth = itemWidth + gap;
                    const oneSetWidth = cctvList?.length * totalItemWidth;
                    const currentScroll = container.scrollLeft;
                    const nextScroll = currentScroll + totalItemWidth;

                    if (nextScroll >= oneSetWidth * 2 - 10) {
                        container.scrollLeft = oneSetWidth + (nextScroll - oneSetWidth * 2);
                    } else {
                        container.scrollLeft = nextScroll;
                    }
                }
            }, 3000);
        };

        const container = cctvScrollContainerRef.current;
        if (container) {
            const totalItemWidth = itemWidth + gap;
            const oneSetWidth = cctvList?.length * totalItemWidth;
            setTimeout(() => {
                if (container) {
                    container.scrollLeft = oneSetWidth;
                }
            }, 100);
            startAutoScroll();
        }

        return () => {
            if (autoScrollIntervalRef.current) {
                clearInterval(autoScrollIntervalRef.current);
                autoScrollIntervalRef.current = null;
            }
            if (userScrollTimeoutRef.current) {
                clearTimeout(userScrollTimeoutRef.current);
                userScrollTimeoutRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showCCTV, hideControls, windowWidth, leftPanelWidth]);

    if (!cctvList || cctvList.length === 0) {
        return null;
    }

    return (
        <div
            className={`absolute transition-all duration-500 ease-in-out ${!showCCTV ? "hidden" : ""}`}
            style={{
                left: `${leftPanelWidth + leftPanelGap}px`,
                right: `${rightPanelWidth + rightPanelGap}px`,
                bottom: "16px",
                top: "auto",
                zIndex: 200,
                transform: hideControls ? "translateY(136px)" : "translateY(0)",
                opacity: hideControls ? 0 : 1,
            }}>
            <div
                className="rounded-t-lg gradient-border-right-bottom"
                style={{
                    height: `${itemHeight + verticalPadding * 2}px`,
                    width: "100%",
                    paddingTop: `${verticalPadding}px`,
                    paddingBottom: `${verticalPadding}px`,
                    paddingLeft: `${paddingHorizontal}px`,
                    paddingRight: `${paddingHorizontal}px`,
                    background: "linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)",
                    backdropFilter: "blur(4px)",
                    WebkitBackdropFilter: "blur(4px)",
                    overflow: "hidden",
                }}>
                <div
                    ref={cctvScrollContainerRef}
                    className="flex items-center"
                    style={{
                        height: `${itemHeight}px`,
                        gap: `${gap}px`,
                        overflowX: "auto",
                        overflowY: "hidden",
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(255, 255, 255, 0.2) transparent",
                        scrollBehavior: "smooth",
                    }}
                    onScroll={(e) => {
                        const target = e.currentTarget;
                        const scrollLeft = target.scrollLeft;
                        const totalItemWidth = itemWidth + gap;
                        const oneSetWidth = cctvList.length * totalItemWidth;

                        isUserScrollingRef.current = true;
                        if (userScrollTimeoutRef.current) {
                            clearTimeout(userScrollTimeoutRef.current);
                        }
                        userScrollTimeoutRef.current = setTimeout(() => {
                            isUserScrollingRef.current = false;
                        }, 2000);

                        if (scrollLeft >= oneSetWidth * 2 - 10) {
                            target.scrollLeft = oneSetWidth + (scrollLeft - oneSetWidth * 2);
                        } else if (scrollLeft <= 10) {
                            target.scrollLeft = oneSetWidth + scrollLeft;
                        }
                    }}>
                    {cctvList?.map((cctv, index) => (
                        <BottomPanelCCTVItem key={`bottom-cctv-${index}-${cctv.camera_id}`} cctv={cctv} width={itemWidth} height={itemHeight} mediaAgentUrl={mediaAgentUrl} iceServerList={iceServerList ?? []} play={play} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UnityBottomPanel;
