import React, { useEffect, useState, useRef } from "react";
import { Icon } from "@iconify/react";
import { usePostVlmRequest, useVlmSocket } from "@/src/apis/vlm/hooks";
import { VlmRequest } from "@/src/apis/vlm/types";

interface UnityAIAgentPopupProps {
    isOpen: boolean;
    onClose: () => void;
    hideControls?: boolean;
    /** 축소 모드일 때 위치 오버라이드 (예: 신고팝업 아래) */
    position?: { top?: string; right?: string; left?: string; bottom?: string };
    /** 축소 모드일 때 최대 높이(px). 플로팅 버튼을 넘지 않도록 부모에서 계산해 전달 */
    maxHeight?: number;
    eventTime: Date;
    isReadyToAnalyze?: boolean;
    isUnityMode?: boolean;
    vlmRequestInfo?: VlmRequest;
    mainCameraName: string;
}

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    type?: "normal" | "analyzing";
    progress?: number;
    processingTime?: number;
    transmissionTime?: number;
    analysisResult?: {
        conclusion: string;
        summary: {
            time: string;
            location: string;
            personnel: string;
            status: string;
            riskLevel: string;
        };
        evidence: string[];
        recommendations: string[];
    };
}

const AGENT_GRADIENT = "linear-gradient(135deg, #0066FF 0%, #8A2BE2 50%, #ff8566 100%)";

const UnityAIAgentPopup: React.FC<UnityAIAgentPopupProps> = ({ isOpen, mainCameraName, hideControls = false, position: positionOverride, maxHeight: maxHeightProp, eventTime, isReadyToAnalyze = true, isUnityMode = false, vlmRequestInfo }) => {
    const [chatInput, setChatInput] = useState("네, 분석해 주세요.");
    const [inputKey, setInputKey] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "welcome-msg",
            role: "assistant",
            content: `${mainCameraName}에서 싸움 이벤트가 감지되었습니다. 사건을 분석해드릴까요?`,
            timestamp: eventTime.toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            }),
        },
    ]);
    const [isResponding, setIsResponding] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const ignoreNextChangeRef = useRef(false);
    const { mutate: postVlmRequest } = usePostVlmRequest();

    // VLM 웹소켓 훅
    const { analysisStatus, progressMessage, progressSequence, result: vlmResult, subscribeToAnalysis, unsubscribe: unsubscribeVlm, processingTime } = useVlmSocket({ autoConnect: false });

    // VLM 분석 상태 변경 시 메시지 업데이트 (웹소켓 콜백에서 상태 업데이트 - 의도된 패턴)
    useEffect(() => {
        if (!analysisStatus) return;

        if (analysisStatus === "IN_PROGRESS") {
            // 진행 중 메시지 업데이트
            setMessages((prev) => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg?.type === "analyzing") {
                    return prev.map((msg, idx) =>
                        idx === prev.length - 1
                            ? {
                                  ...msg,
                                  content: progressMessage,
                                  progress: progressSequence / 100,
                                  processingTime: processingTime,
                              }
                            : msg
                    );
                }
                return prev;
            });
        } else if (analysisStatus === "COMPLETED" && vlmResult) {
            // 분석 완료 - 결과 표시
            setIsAnalyzing(false);
            setMessages((prev) => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg?.type === "analyzing") {
                    return prev.map((msg, idx) =>
                        idx === prev.length - 1
                            ? {
                                  ...msg,
                                  progress: 1,
                                  analysisResult: {
                                      conclusion: vlmResult.oneLine || "",
                                      summary: {
                                          time: new Date().toLocaleString("ko-KR"),
                                          location: vlmRequestInfo?.camera_id || "",
                                          personnel: "-",
                                          status: "분석 완료",
                                          riskLevel: "-",
                                      },
                                      evidence: vlmResult.evidence ? [vlmResult.evidence] : [],
                                      recommendations: vlmResult.recommendations ? [vlmResult.recommendations] : [],
                                  },
                              }
                            : msg
                    );
                }
                return prev;
            });
            unsubscribeVlm();
        } else if (analysisStatus === "FAILED" || analysisStatus === "CANCELLED") {
            // 분석 실패/취소
            setIsAnalyzing(false);
            setMessages((prev) => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg?.type === "analyzing") {
                    return prev.map((msg, idx) =>
                        idx === prev.length - 1
                            ? {
                                  ...msg,
                                  content: analysisStatus === "FAILED" ? "분석에 실패했습니다." : "분석이 취소되었습니다.",
                                  type: "normal" as const,
                                  progress: undefined,
                              }
                            : msg
                    );
                }
                return prev;
            });
            unsubscribeVlm();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [analysisStatus, progressMessage, progressSequence, vlmResult, vlmRequestInfo]);

    // 컴포넌트 언마운트 시 웹소켓 구독 해제
    useEffect(() => {
        return () => {
            unsubscribeVlm();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
        }
    }, [messages, isResponding]);

    useEffect(() => {
        if (inputKey > 0) {
            textareaRef.current?.focus();
        }
    }, [inputKey]);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        const lineHeight = 24;
        const maxHeight = lineHeight * 3;
        const newHeight = Math.min(el.scrollHeight, maxHeight);
        el.style.height = `${newHeight}px`;
    }, [chatInput, inputKey]);

    const isPositiveResponse = (text: string): boolean => {
        const positiveKeywords = ["네", "예", "좋아", "분석", "해주세요", "해줘", "해주", "해", "요청", "시작"];
        const normalizedText = text.toLowerCase().replace(/[.,!?]/g, "");
        return positiveKeywords.some((keyword) => normalizedText.includes(keyword.toLowerCase()));
    };

    const handleSendMessage = () => {
        const text = chatInput.trim();
        if (!text || isResponding) return;

        const userTimestamp = new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: "user",
            content: text,
            timestamp: userTimestamp,
        };

        setMessages((prev) => [...prev, userMessage]);
        setChatInput("");
        setInputKey((k) => k + 1);
        ignoreNextChangeRef.current = true;
        setIsResponding(true);
        setIsExpanded(true);

        // Unity 모드에서는 VLM API 호출 및 웹소켓 구독
        if (isUnityMode && isPositiveResponse(text)) {
            const vlmRequest: VlmRequest = {
                event_id: vlmRequestInfo?.event_id ?? 0,
                vms_id: vlmRequestInfo?.vms_id ?? 0,
                camera_id: vlmRequestInfo?.camera_id ?? "",
            };

            // 분석 중 메시지 추가
            const analyzingMessage: ChatMessage = {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: "비디오를 분석하고 있습니다.",
                timestamp: new Date().toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                }),
                type: "analyzing",
                progress: 0,
                processingTime: 0,
            };

            setMessages((prev) => [...prev, analyzingMessage]);
            setIsResponding(false);
            setIsAnalyzing(true);

            // VLM 요청 후 웹소켓 구독
            postVlmRequest(vlmRequest, {
                onSuccess: () => {
                    console.log("[VLM] 요청 성공, 웹소켓 구독 시작");
                    // 분석 결과 구독 시작
                    subscribeToAnalysis(vlmRequest.event_id, vlmRequest.vms_id, vlmRequest.camera_id);
                },
                onError: (error) => {
                    console.error("[VLM] 요청 실패:", error);
                    setIsAnalyzing(false);
                    setMessages((prev) =>
                        prev.map((msg, idx) =>
                            idx === prev.length - 1 && msg.type === "analyzing"
                                ? {
                                      ...msg,
                                      content: "분석 요청에 실패했습니다.",
                                      type: "normal" as const,
                                      progress: undefined,
                                  }
                                : msg
                        )
                    );
                },
            });
            return;
        }
    };

    if (!isOpen) return null;

    const mainPopupWidth = 420;
    const mainPopupVideoHeight = mainPopupWidth * (9 / 16);
    const mainPopupTitleHeight = 40;
    const mainPopupPadding = 12;
    const mainPopupHeight = mainPopupVideoHeight + mainPopupTitleHeight + mainPopupPadding;
    const padding = 20;
    const gap = 10;

    return (
        <>
            {isExpanded ? (
                <div className="fixed inset-y-0 right-0 z-[2000]" onClick={(e) => e.stopPropagation()} style={{ zIndex: 2000 }}>
                    <div className="flex flex-col bg-white border-l border-[#31353a] h-full w-[30rem] overflow-hidden" style={{ borderLeftWidth: "1px" }}>
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                            <button type="button" onClick={() => setIsExpanded(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none" aria-label="축소">
                                <Icon icon="mdi:window-restore" className="w-5 h-5" />
                            </button>
                        </div>

                        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 p-3 pl-10 pr-9">
                            {/* CUVIA Agent 헤더 */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-gray-700 text-sm">
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                                        style={{
                                            background: AGENT_GRADIENT,
                                        }}>
                                        <img src="/simbol.svg" alt="AI" className="w-4 h-4" style={{ filter: "brightness(0) saturate(100%) invert(100%)" }} />
                                    </div>
                                    <span className="text-gray-900 font-semibold">CUVIA Agent</span>
                                </div>
                                {messages.map((message) => (
                                    <div key={message.id} className="space-y-2">
                                        {message.role === "assistant" && (
                                            <div className="space-y-2">
                                                <div>
                                                    {message.type === "analyzing" ? (
                                                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                                            {isAnalyzing && (
                                                                <>
                                                                    <div className="mb-3">
                                                                        <h3 className="text-sm font-semibold text-gray-900 mb-2">AI 분석 중</h3>
                                                                        <p className="text-sm text-gray-700 leading-relaxed">
                                                                            {/* 소요시간만 */}
                                                                            {message.content} (소요시간 : {message.processingTime}초)
                                                                        </p>
                                                                    </div>
                                                                    <div className="mb-2">
                                                                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                                            <div
                                                                                className="h-full rounded-full transition-all duration-300"
                                                                                style={{
                                                                                    width: `${(message.progress || 0) * 100}%`,
                                                                                    background: AGENT_GRADIENT,
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}

                                                            {/* 분석 결과 표시 (프로그래스 완료 시) */}
                                                            {message.progress && message.progress >= 1 && message.analysisResult && (
                                                                <div className={`space-y-4 ${isAnalyzing ? "border-t border-gray-300 pt-4 mt-4 " : ""}`}>
                                                                    {/* 한 줄 결론 */}
                                                                    <div className="bg-white border border-gray-200 rounded-lg p-4" style={{ borderWidth: "1px" }}>
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <Icon icon="mdi:lightbulb-on" className="w-4 h-4 text-blue-600" />
                                                                            <h4 className="text-gray-900 font-semibold text-sm">1. 한 줄 결론</h4>
                                                                        </div>
                                                                        <p className="text-gray-700 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: message.analysisResult.conclusion.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                                                                    </div>

                                                                    {/* 사건 요약 */}
                                                                    <div className="bg-white border border-gray-200 rounded-lg p-4" style={{ borderWidth: "1px" }}>
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <Icon icon="mdi:file-document-outline" className="w-4 h-4 text-blue-600" />
                                                                            <h4 className="text-gray-900 font-semibold text-sm">2. 사건 요약</h4>
                                                                        </div>
                                                                        <div className="space-y-1.5 text-sm">
                                                                            <div className="text-gray-700">
                                                                                <span className="text-gray-500">- 발생 시각:</span> {message.analysisResult.summary.time}
                                                                            </div>
                                                                            <div className="text-gray-700">
                                                                                <span className="text-gray-500">- 위치/카메라:</span> {message.analysisResult.summary.location}
                                                                            </div>
                                                                            <div className="text-gray-700">
                                                                                <span className="text-gray-500">- 관여 인원(추정):</span> {message.analysisResult.summary.personnel}
                                                                            </div>
                                                                            <div className="text-gray-700">
                                                                                <span className="text-gray-500">- 진행 상태:</span> {message.analysisResult.summary.status}
                                                                            </div>
                                                                            <div className="text-gray-700">
                                                                                <span className="text-gray-500">- 위험도:</span> <span dangerouslySetInnerHTML={{ __html: message.analysisResult.summary.riskLevel.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* 근거 */}
                                                                    <div className="bg-white border border-gray-200 rounded-lg p-4" style={{ borderWidth: "1px" }}>
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <Icon icon="mdi:clipboard-text" className="w-4 h-4 text-blue-600" />
                                                                            <h4 className="text-gray-900 font-semibold text-sm">3. 근거</h4>
                                                                        </div>
                                                                        <ul className="space-y-1.5">
                                                                            {message.analysisResult.evidence.map((item, idx) => (
                                                                                <li key={idx} className="text-gray-700 text-sm leading-relaxed flex items-start">
                                                                                    <span className="text-gray-400 mr-2">-</span>
                                                                                    <span>{item}</span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>

                                                                    {/* 대응 추천 (퀵 버튼) */}
                                                                    <div className="bg-white border border-gray-200 rounded-lg p-4" style={{ borderWidth: "1px" }}>
                                                                        <div className="flex items-center gap-2 mb-3">
                                                                            <Icon icon="mdi:shield-check" className="w-4 h-4 text-blue-600" />
                                                                            <h4 className="text-gray-900 font-semibold text-sm">4. 대응 추천</h4>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {message.analysisResult.recommendations.map((rec, idx) => {
                                                                                const buttonText = rec.match(/\[(.*?)\]/)?.[1] || rec;
                                                                                return (
                                                                                    <button
                                                                                        key={idx}
                                                                                        onClick={() => {
                                                                                            // 퀵 버튼 기능 (나중에 구현)
                                                                                        }}
                                                                                        className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm hover:border-blue-500 hover:bg-blue-50 transition-colors"
                                                                                        style={{ borderWidth: "1px" }}>
                                                                                        {buttonText}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="max-w-[70%] px-4 py-2 rounded-2xl border bg-gray-100 text-gray-900 border-gray-200" style={{ borderWidth: "1px" }}>
                                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                                            <div className="text-xs text-gray-500 mt-1">{message.timestamp}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {message.role === "user" && (
                                            <div className="flex justify-end">
                                                <div className="max-w-[70%] px-4 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap bg-gradient-to-br from-[#ff8566] to-[#ff8566] text-white border-transparent">
                                                    <p>{message.content}</p>
                                                    <div className="text-xs text-orange-100 mt-1">{message.timestamp}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isResponding && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                                    </div>
                                )}
                            </div>

                            <div ref={bottomRef} className="h-[75px]" />
                        </div>

                        <div className="bg-white flex-shrink-0">
                            <div className="p-4">
                                <div className="relative flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-500 transition-colors">
                                    <button
                                        onClick={() => {
                                            // 도구 팝업 (나중에 구현)
                                        }}
                                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors self-center"
                                        aria-label="도구 열기">
                                        <Icon icon="mdi:plus" className="w-5 h-5" />
                                    </button>
                                    <textarea
                                        ref={textareaRef}
                                        key={inputKey}
                                        value={chatInput}
                                        onChange={(e) => {
                                            if (ignoreNextChangeRef.current) {
                                                ignoreNextChangeRef.current = false;
                                                return;
                                            }
                                            setChatInput(e.target.value);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="CUVIA에게 물어보기"
                                        className="flex-1 bg-transparent border-none text-gray-900 text-sm placeholder-gray-500 focus:outline-none resize-none overflow-hidden self-center"
                                        style={{
                                            minHeight: "24px",
                                            maxHeight: "96px",
                                            lineHeight: "24px",
                                        }}
                                        rows={1}
                                    />
                                    <button type="button" onClick={handleSendMessage} disabled={!chatInput.trim() || isResponding || !isReadyToAnalyze} className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 self-center" style={{ background: AGENT_GRADIENT }} aria-label="전송">
                                        <img src="/simbol.svg" alt="전송" className="w-5 h-5" style={{ filter: "brightness(0) saturate(100%) invert(100%)" }} />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    <span className="font-semibold">CUVIA Agent</span>는 실수를 할 수 있습니다. 중요한 정보는 재차 확인하세요.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    className="absolute z-[1000]"
                    style={
                        positionOverride
                            ? { position: "absolute" as const, ...positionOverride }
                            : {
                                  top: `${padding + mainPopupHeight + gap + (hideControls ? 56 : 0)}px`,
                                  right: `${padding}px`,
                              }
                    }
                    onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col rounded-2xl bg-white border border-gray-200 shadow-lg relative overflow-hidden w-[420px]" style={{ maxHeight: maxHeightProp ?? 600 }}>
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                            <button type="button" onClick={() => setIsExpanded(!isExpanded)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none" aria-label={isExpanded ? "축소" : "확장"}>
                                <Icon icon={isExpanded ? "mdi:window-restore" : "mdi:window-maximize"} className="w-5 h-5" />
                            </button>
                        </div>

                        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4 pt-6">
                            <div className="space-y-3">
                                {messages.map((message) => (
                                    <div key={message.id} className="space-y-2">
                                        {message.role === "assistant" && (
                                            <div className="flex items-start gap-3">
                                                <div className="min-w-0 flex-1">
                                                    {message.type === "analyzing" ? (
                                                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                                            <div className="mb-3">
                                                                <h3 className="text-sm font-semibold text-gray-900 mb-2">AI 분석 중</h3>
                                                                <p className="text-sm text-gray-700 leading-relaxed">
                                                                    {message.content} (소요시간 : {message.processingTime}초)
                                                                </p>
                                                            </div>
                                                            <div className="mb-2">
                                                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full transition-all duration-300"
                                                                        style={{
                                                                            width: `${(message.progress || 0) * 100}%`,
                                                                            background: AGENT_GRADIENT,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* 분석 결과 표시 (프로그래스 완료 시) */}
                                                            {message.progress && message.progress >= 1 && message.analysisResult && (
                                                                <div className="mt-4 space-y-4 pt-4 border-t border-gray-300">
                                                                    {/* 한 줄 결론 */}
                                                                    <div className="bg-white border border-gray-200 rounded-lg p-4" style={{ borderWidth: "1px" }}>
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <Icon icon="mdi:lightbulb-on" className="w-4 h-4 text-blue-600" />
                                                                            <h4 className="text-gray-900 font-semibold text-sm">1. 한 줄 결론</h4>
                                                                        </div>
                                                                        <p className="text-gray-700 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: message.analysisResult.conclusion.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                                                                    </div>

                                                                    {/* 사건 요약 */}
                                                                    <div className="bg-white border border-gray-200 rounded-lg p-4" style={{ borderWidth: "1px" }}>
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <Icon icon="mdi:file-document-outline" className="w-4 h-4 text-blue-600" />
                                                                            <h4 className="text-gray-900 font-semibold text-sm">2. 사건 요약</h4>
                                                                        </div>
                                                                        <div className="space-y-1.5 text-sm">
                                                                            <div className="text-gray-700">
                                                                                <span className="text-gray-500">- 발생 시각:</span> {message.analysisResult.summary.time}
                                                                            </div>
                                                                            <div className="text-gray-700">
                                                                                <span className="text-gray-500">- 위치/카메라:</span> {message.analysisResult.summary.location}
                                                                            </div>
                                                                            <div className="text-gray-700">
                                                                                <span className="text-gray-500">- 관여 인원(추정):</span> {message.analysisResult.summary.personnel}
                                                                            </div>
                                                                            <div className="text-gray-700">
                                                                                <span className="text-gray-500">- 진행 상태:</span> {message.analysisResult.summary.status}
                                                                            </div>
                                                                            <div className="text-gray-700">
                                                                                <span className="text-gray-500">- 위험도:</span> <span dangerouslySetInnerHTML={{ __html: message.analysisResult.summary.riskLevel.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* 근거 */}
                                                                    <div className="bg-white border border-gray-200 rounded-lg p-4" style={{ borderWidth: "1px" }}>
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <Icon icon="mdi:clipboard-text" className="w-4 h-4 text-blue-600" />
                                                                            <h4 className="text-gray-900 font-semibold text-sm">3. 근거</h4>
                                                                        </div>
                                                                        <ul className="space-y-1.5">
                                                                            {message.analysisResult.evidence.map((item, idx) => (
                                                                                <li key={idx} className="text-gray-700 text-sm leading-relaxed flex items-start">
                                                                                    <span className="text-gray-400 mr-2">-</span>
                                                                                    <span>{item}</span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>

                                                                    {/* 대응 추천 (퀵 버튼) */}
                                                                    <div className="bg-white border border-gray-200 rounded-lg p-4" style={{ borderWidth: "1px" }}>
                                                                        <div className="flex items-center gap-2 mb-3">
                                                                            <Icon icon="mdi:shield-check" className="w-4 h-4 text-blue-600" />
                                                                            <h4 className="text-gray-900 font-semibold text-sm">4. 대응 추천</h4>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {message.analysisResult.recommendations.map((rec, idx) => {
                                                                                const buttonText = rec.match(/\[(.*?)\]/)?.[1] || rec;
                                                                                return (
                                                                                    <button
                                                                                        key={idx}
                                                                                        onClick={() => {
                                                                                            // 퀵 버튼 기능 (나중에 구현)
                                                                                        }}
                                                                                        className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm hover:border-blue-500 hover:bg-blue-50 transition-colors"
                                                                                        style={{ borderWidth: "1px" }}>
                                                                                        {buttonText}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-gray-900 font-semibold text-sm">CUVIA Agent</span>
                                                            </div>
                                                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                                                <div className="text-xs text-gray-500 mt-2">{message.timestamp}</div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {message.role === "user" && (
                                            <div className="flex justify-end">
                                                <div
                                                    className="max-w-[70%] px-4 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                                                    style={{
                                                        background: "rgba(255, 133, 102, 0.2)",
                                                        color: "#1f2937",
                                                    }}>
                                                    <p>{message.content}</p>
                                                    <div className="text-xs text-gray-600 mt-1">{message.timestamp}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isResponding && (
                                    <div className="flex items-start gap-3">
                                        <div className="flex items-center gap-1 pt-2">
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div ref={bottomRef} className="h-2" />
                        </div>

                        <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white">
                            <div className="relative flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-500 transition-colors">
                                <textarea
                                    ref={textareaRef}
                                    key={inputKey}
                                    value={chatInput}
                                    onChange={(e) => {
                                        if (ignoreNextChangeRef.current) {
                                            ignoreNextChangeRef.current = false;
                                            return;
                                        }
                                        setChatInput(e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="CUVIA에게 물어보기"
                                    className="flex-1 bg-transparent border-none text-gray-900 text-sm placeholder-gray-500 focus:outline-none resize-none overflow-y-auto"
                                    style={{
                                        minHeight: "24px",
                                        maxHeight: "72px",
                                        lineHeight: "24px",
                                    }}
                                    rows={1}
                                />
                                <button type="button" onClick={handleSendMessage} disabled={!chatInput.trim() || isResponding || !isReadyToAnalyze} className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95" style={{ background: AGENT_GRADIENT }} aria-label="전송">
                                    <img src="/simbol.svg" alt="전송" className="w-5 h-5" style={{ filter: "brightness(0) saturate(100%) invert(100%)" }} />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                <span className="font-semibold">CUVIA Link</span>는 실수를 할 수 있습니다. 중요한 정보는 재차 확인하세요.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UnityAIAgentPopup;
