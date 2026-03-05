import { subscribeUnityToReact } from "@/lib/unity/unityBridge";
import { useCallback, useEffect } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";

interface UnityCanvasProps {
    className?: string;
    style?: React.CSSProperties;
}

/** 캐시 제어: .data/.wasm은 재검증 후 캐시, .bundle은 변경 없이 캐시, 나머지는 캐시 안 함 */
const handleCacheControl = (url: string) => {
    if (url.match(/\.data/) || url.match(/\.wasm/)) {
        return "must-revalidate";
    }
    if (url.match(/\.bundle/)) {
        return "immutable";
    }
    return "no-store";
};

const UnityCanvas = ({ className, style }: UnityCanvasProps) => {
    const { unityProvider, isLoaded, loadingProgression, sendMessage, unload } = useUnityContext({
        loaderUrl: "/Build/public.loader.js",
        dataUrl: "/Build/public.data",
        frameworkUrl: "/Build/public.framework.js",
        codeUrl: "/Build/public.wasm",
        cacheControl: handleCacheControl,
        webglContextAttributes: {
            powerPreference: "high-performance",
            preserveDrawingBuffer: false,
            alpha: false,
        },
    });

    useEffect(() => {
        if (isLoaded) {
            window.unityInstance = {
                SendMessage: (obj: string, method: string, value: string) => {
                    try {
                        sendMessage(obj, method, value);
                    } catch (error) {
                        console.error("[UnityCanvas] SendMessage 에러:", error);
                    }
                },
            };
            console.log("[UnityCanvas] window.unityInstance 설정 완료");
        }

        return () => {
            if (window.unityInstance) {
                delete window.unityInstance;
            }
        };
    }, [isLoaded, sendMessage]);

    useEffect(() => {
        return () => {
            try {
                if (isLoaded) {
                    unload();
                }
            } catch (error) {
                console.error("[UnityCanvas] unload 호출 에러:", error);
            }
        };
    }, [unload, isLoaded]);

    useEffect(() => {
        const unsubscribe = subscribeUnityToReact((eventName, eventData) => {
            if (eventName === "tvClicked" || eventName === "cctvClicked") {
                try {
                    const data = JSON.parse(eventData);
                    console.log(`[UnityCanvas] ${eventName} 파싱된 데이터:`, data);
                } catch (e) {
                    console.error("[UnityCanvas] JSON 파싱 에러:", e);
                }
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return (
        <div
            className={className}
            style={{
                ...style,
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "#1a1a1a",
            }}>
            {!isLoaded && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 1000,
                        textAlign: "center",
                    }}>
                    <div className="text-white text-lg mb-4">Unity 로딩 중... {Math.round(loadingProgression * 100)}%</div>
                    <div
                        style={{
                            width: "300px",
                            height: "20px",
                            background: "#2a2a2a",
                            borderRadius: "10px",
                            overflow: "hidden",
                        }}>
                        <div
                            style={{
                                width: `${loadingProgression * 100}%`,
                                height: "100%",
                                background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                                transition: "width 0.3s ease",
                            }}
                        />
                    </div>
                </div>
            )}

            <Unity
                unityProvider={unityProvider}
                style={{
                    width: "100%",
                    height: "100%",
                    visibility: isLoaded ? "visible" : "hidden",
                }}
                devicePixelRatio={2}
            />
        </div>
    );
};

export default UnityCanvas;
