"use client";

import { subscribeUnityToReact } from "@/lib/unity/unityBridge";
import { useEffect, useState } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";

interface UnityCanvasProps {
    className?: string;
    style?: React.CSSProperties;
}

const UnityCanvas = ({ className, style }: UnityCanvasProps) => {
    const { unityProvider, isLoaded, loadingProgression, requestFullscreen, sendMessage, unload } = useUnityContext({
        loaderUrl: "/Build/public.loader.js",
        dataUrl: "/Build/public.data",
        frameworkUrl: "/Build/public.framework.js",
        codeUrl: "/Build/public.wasm",
    });

    const [count, setCount] = useState(0);
    const testSend = () => {
        if (!isLoaded) {
            console.warn("[UnityCanvas] Unity가 아직 로드되지 않았습니다.");
            return;
        }
        //테스트 유니티로 메시지 보내기
        const obj = {
            methodName: "zoomLevel",
            payload: {
                value: 1,
            },
        };
        //(유니티 오브젝트 이름,함수이름 (유니티꺼), 데이터 (파라미터는 하나이상 안되므로 json을 써준것))
        try {
            sendMessage("WebGLBridge", "OnReactEvent", JSON.stringify(obj));
            setCount(count + 1);
        } catch (error) {
            console.error("[UnityCanvas] sendMessage 호출 에러:", error);
        }
    };

    useEffect(() => {
        if (isLoaded) {
            // sendMessage를 window.unityInstance.SendMessage로 래핑
            window.unityInstance = {
                SendMessage: (obj: string, method: string, value: string) => {
                    try {
                        sendMessage(obj, method, value);
                    } catch (error) {
                        console.error("[UnityCanvas] window.unityInstance.SendMessage 호출 에러:", error);
                    }
                },
            };
            console.log("[UnityCanvas] window.unityInstance 설정 완료");
        }

        return () => {
            // Cleanup: window.unityInstance 제거
            if (window.unityInstance) {
                delete window.unityInstance;
                console.log("[UnityCanvas] window.unityInstance 해제");
            }
        };
    }, [isLoaded, sendMessage]);

    useEffect(() => {
        // Cleanup function
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

    const handleFullscreen = () => {
        if (!isLoaded) {
            console.warn("[UnityCanvas] Unity가 아직 로드되지 않았습니다.");
            return;
        }

        try {
            requestFullscreen(true);
        } catch (error) {
            console.error("[UnityCanvas] requestFullscreen 호출 에러:", error);
        }
    };

    useEffect(() => {
        // ✅ Unity → React 이벤트 수신 설정
        const unsubscribe = subscribeUnityToReact((eventName, eventData) => {
            if (eventName === "tvClicked") {
                try {
                    const data = JSON.parse(eventData);
                    console.log("[UnityCanvas] 파싱된 데이터:", data);
                    // TODO: 데이터 처리
                } catch (e) {
                    console.error("[UnityCanvas] JSON 파싱 에러:", e);
                }
            } else if (eventName === "cctvClicked") {
                try {
                    const data = JSON.parse(eventData);
                    console.log("[UnityCanvas] 파싱된 데이터:", data);
                    // TODO: 데이터 처리
                } catch (e) {
                    console.error("[UnityCanvas] JSON 파싱 에러:", e);
                }
            }
        });

        // cleanup: 컴포넌트 언마운트 시 구독 해제
        return () => {
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (isLoaded) {
            window.unityInstance = {
                SendMessage: (obj, method, value) => {
                    sendMessage(obj, method, value);
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
            />
        </div>
    );
};

export default UnityCanvas;
