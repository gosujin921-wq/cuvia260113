import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import Markdown from "react-markdown";
import { VlmAnalysisResult } from "./UnityAIAgentPopup";
import { EventType } from "@/src/apis/event/types";

interface PropagationListPanelProps {
    isVisible: boolean;
    width?: number;
    eventType: EventType;
    vlmAnalysisResult: VlmAnalysisResult;
    propagationTime: Date;
    onClose?: () => void;
    onBackToInitial?: () => void;
}

interface PropagationThread {
    id: string;
    title: string;
    status: "pending" | "in-progress" | "completed";
    createdAt: string;
    messages: ThreadMessage[];
}

interface ThreadMessage {
    id: string;
    role: "system" | "agency" | "user";
    content: string;
    timestamp: string;
    author?: string; // 신고기관명
    status?: "read" | "unread";
    showCompletionButton?: boolean; // 시뮬레이션 종료 확인 버튼 표시
}

const PropagationModal: React.FC<PropagationListPanelProps> = ({ isVisible, eventType, vlmAnalysisResult, propagationTime, onClose, onBackToInitial }) => {
    // 전파 패널 열림 시 0.5초 후 스크롤을 맨 아래로
    useEffect(() => {
        if (!isVisible) return;
        const scrollTimer = window.setTimeout(() => {
            const el = scrollContainerRef.current;
            if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        }, 500);
        return () => window.clearTimeout(scrollTimer);
    }, [isVisible]);

    // ESC 키로 닫기
    useEffect(() => {
        if (!isVisible) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && onClose) {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isVisible, onClose]);

    const makeContent = (result: VlmAnalysisResult) => {
        const { conclusion, summary, evidence } = result;
        const requestBlock =
            eventType === 12
                ? `✅ 요청사항
1. 현장 도착 즉시 상황 확인 및 당사자 분리/제지
2. 주변 인원 밀집 방지·동선 통제
3. 상황 지속/확대 또는 부상·위험물 정황 시 112 협조 요청 권고`
                : eventType === 10
                ? `✅ 요청사항
1. 쓰러진 인원 의식/호흡 확인, 출혈 여부 점검
2. 머리·목 부상 의심/무반응/호흡 이상 시 119 즉시 요청`
                : "";
        return `${conclusion}

🧾 사건 요약
${summary}

⏰ 관측 근거
${evidence}${requestBlock ? `\n\n${requestBlock}` : ""}
`;
    };

    const [threads, setThreads] = useState<PropagationThread[]>(() => {
        return [
            {
                id: "thread-1",
                title: `🚨 ${eventType === 12 ? "[현장 확인 요청 | 폭력(싸움) 의심]" : eventType === 10 ? "[현장 확인 요청 | 쓰러짐]" : "[전파]"} Zone1`,
                status: "pending",
                createdAt: propagationTime.toISOString(),
                messages: [
                    {
                        id: "msg-propagation",
                        role: "system",
                        content: makeContent(vlmAnalysisResult),
                        timestamp: propagationTime.toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        }),
                    },
                ],
            },
        ];
    });

    const currentThreadId = "thread-1";
    const [messageInput, setMessageInput] = useState("");
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);

    const bottomRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const inputContainerRef = useRef<HTMLDivElement | null>(null);

    const currentThread = threads.find((thread) => thread.id === currentThreadId);
    const threadMessages = currentThread?.messages || [];
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [inputContainerHeight, setInputContainerHeight] = useState(0);

    // 스크롤 위치에 따라 탑 버튼 표시/숨김
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            setShowScrollTop(container.scrollTop > 300);
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        scrollContainerRef.current?.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
        }
    }, [threadMessages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            const scrollHeight = textareaRef.current.scrollHeight;
            const lineHeight = 24;
            const maxHeight = lineHeight * 4;
            const newHeight = Math.min(scrollHeight, maxHeight);
            textareaRef.current.style.height = `${newHeight}px`;
        }

        // 입력창 높이 측정
        if (inputContainerRef.current) {
            setInputContainerHeight(inputContainerRef.current.offsetHeight);
        }
    }, [messageInput]);

    const addMessage = (role: "agency" | "user", content: string, author?: string) => {
        const timestamp = new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
        const newMessage: ThreadMessage = {
            id: `msg-${Date.now()}`,
            role,
            content,
            timestamp,
            author,
            status: role === "agency" ? "unread" : "read",
        };

        setThreads((prev) =>
            prev.map((thread) =>
                thread.id === "thread-1"
                    ? {
                          ...thread,
                          messages: [...thread.messages, newMessage],
                          status: role === "agency" ? "in-progress" : thread.status,
                      }
                    : thread
            )
        );
    };

    const handleSendMessage = () => {
        const text = messageInput.trim();
        if (!text) return;

        addMessage("user", text);
        setMessageInput("");
    };

    if (!isVisible) return null;

    return (
        <>
            {/* 딤 배경 */}
            <div className="fixed inset-0 bg-black/30 transition-opacity duration-500" style={{ zIndex: 10001 }} onClick={onClose} />

            {/* 중앙 패널 */}
            <div
                className="fixed top-1/2 left-1/2 flex flex-col transition-all duration-500 ease-out opacity-100 scale-100 bg-gray-100 rounded-xl p-4 shadow-2xl"
                style={{
                    transform: "translate(-50%, -50%)",
                    width: "900px",
                    maxWidth: "90vw",
                    height: "90vh",
                    maxHeight: "90vh",
                    zIndex: 10002,
                }}>
                <div className="flex flex-col gap-3 h-full" style={{ minHeight: 0 }}>
                    {/* 헤더 */}
                    <div
                        className="rounded-lg flex-shrink-0"
                        style={{
                            zIndex: 2,
                        }}>
                        {/* 정보 칩들 */}
                        <div className="flex items-center justify-between gap-2 flex-wrap relative">
                            <div className="flex items-center gap-2">
                                {/* 전파 건수 칩 */}
                                <div className="px-4 py-2 rounded-full text-xs font-medium bg-white/90 text-gray-700 flex items-center gap-2 border border-gray-200 shadow-sm" style={{ backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }}>
                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                    <span>전파 건수: {threads.length}건</span>
                                </div>
                                {/* 상태 칩 - 완료됨 또는 진행 중일 때만 표시 */}
                                {currentThread && currentThread.status !== "pending" && (
                                    <div className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 border shadow-sm ${currentThread.status === "completed" ? "bg-green-50 text-green-700 border-green-200" : "bg-blue-50 text-blue-700 border-blue-200"}`} style={{ backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }}>
                                        <span className={`w-2 h-2 rounded-full ${currentThread.status === "completed" ? "bg-green-400" : "bg-blue-400"} animate-pulse`}></span>
                                        <span>{currentThread.status === "completed" ? "완료됨" : "진행 중"}</span>
                                    </div>
                                )}
                            </div>

                            {/* 닫기 버튼 */}
                            <button type="button" onClick={onClose} className="flex-shrink-0 w-8 h-8 rounded-full bg-white/90 border border-gray-200 hover:border-red-300 hover:bg-red-50 flex items-center justify-center text-gray-600 hover:text-red-500 transition-all shadow-sm" aria-label="닫기">
                                <Icon icon="mdi:close" className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* 메인 영역 - 메시지 영역만 표시 */}
                    <div
                        className="rounded-lg flex-1 border border-gray-200 relative flex flex-col overflow-hidden bg-white shadow-lg"
                        style={{
                            minHeight: 0,
                            maxHeight: "100%",
                        }}>
                        {/* 메시지 영역 */}
                        <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
                            {/* 메시지 헤더 */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0 bg-gray-50">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-semibold text-gray-800 truncate">{currentThread?.title || "전파"}</h3>
                                    <p className="text-sm text-gray-600 mt-0.5">
                                        {currentThread &&
                                            new Date(currentThread.createdAt).toLocaleString("ko-KR", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                    </p>
                                </div>
                            </div>

                            {/* 메시지 영역 - 채팅 스타일 (HOME-v2 PropagationListPanel 참고) */}
                            <div
                                ref={scrollContainerRef}
                                className="flex-1 overflow-y-auto p-4 bg-gray-50/50"
                                style={{
                                    scrollbarWidth: "thin",
                                    scrollbarColor: "#d1d5db #f3f4f6",
                                }}>
                                {/* 메시지들 */}
                                <div className="flex flex-col gap-4 max-w-full">
                                    {threadMessages.map((message) => (
                                        <div key={message.id} className={message.role === "agency" ? "flex items-start gap-3" : "flex justify-end"}>
                                            {/* 왼쪽 정렬: agency (신고기관) - 수신 메시지 */}
                                            {message.role === "agency" && (
                                                <div className="flex items-start gap-3 w-[80%] min-w-[80%]">
                                                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-500 flex items-center justify-center border-2 border-white shadow-sm">
                                                        <Icon icon="mdi:alert-circle" className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-sm font-bold text-red-600">{message.author || "신고기관"}</span>
                                                                {message.status === "unread" && <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">NEW</span>}
                                                            </div>
                                                            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{message.content}</pre>
                                                            {message.showCompletionButton && (
                                                                <div className="mt-4 pt-4 border-t border-gray-200">
                                                                    <p className="text-sm text-gray-600 mb-4">해당 시뮬레이션을 종료합니다.</p>
                                                                    <button type="button" onClick={() => onBackToInitial?.()} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors" aria-label="확인">
                                                                        확인
                                                                    </button>
                                                                </div>
                                                            )}
                                                            <div className="text-xs text-gray-500 mt-2">{message.timestamp}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-end gap-2 w-[80%] min-w-[80%]">
                                                <div className="flex-1 min-w-0 flex flex-col items-end">
                                                    {message.role === "system" && (
                                                        <div className="bg-blue-50 border border-blue-100 rounded-2xl rounded-tr-sm p-4 shadow-sm w-full">
                                                            <div className="flex items-center justify-end gap-2 mb-2">
                                                                <span className="text-sm font-bold text-gray-800">전파 전송</span>
                                                            </div>
                                                            {message.content ? (
                                                                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans [&_p]:my-1 [&_p:last-child]:mb-0 [&_*:last-child]:mb-0">
                                                                    <Markdown>{message.content}</Markdown>
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-red-400">내용이 없습니다</p>
                                                            )}
                                                            <div className="text-xs text-gray-500 mt-2 text-right">{message.timestamp}</div>
                                                        </div>
                                                    )}
                                                </div>
                                                {message.role === "user" && (
                                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl rounded-tr-sm p-4 shadow-sm">
                                                        <div className="flex items-center justify-end gap-2 mb-2">
                                                            <span className="text-sm font-semibold text-blue-600">담당자</span>
                                                        </div>
                                                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                                        <div className="text-xs text-gray-500 mt-2 text-right">{message.timestamp}</div>
                                                    </div>
                                                )}
                                                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center border-2 border-white shadow-sm">
                                                    <Icon icon={message.role === "system" ? "mdi:send" : "mdi:account"} className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={bottomRef} />
                                </div>
                            </div>

                            {/* 입력 영역 */}
                            <div ref={inputContainerRef} className="flex-shrink-0 border-t border-gray-200 bg-white">
                                <div className="p-3">
                                    <div className="relative flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-colors">
                                        <textarea
                                            ref={textareaRef}
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    if (e.nativeEvent.isComposing) return;
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                            placeholder="메시지를 입력하세요..."
                                            className="flex-1 bg-transparent border-none text-gray-900 text-sm placeholder-gray-400 focus:outline-none resize-none overflow-hidden"
                                            style={{
                                                minHeight: "24px",
                                                maxHeight: "96px",
                                                lineHeight: "24px",
                                            }}
                                            rows={1}
                                        />
                                        <button onClick={handleSendMessage} disabled={!messageInput.trim()} className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95" aria-label="전송">
                                            <Icon icon="mdi:send" className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1.5 text-center">신고기관과의 소통 스레드입니다. 상황 진행 사항을 실시간으로 확인하세요.</p>
                                </div>
                            </div>

                            {/* 탑 버튼 */}
                            {showScrollTop && (
                                <button
                                    onClick={scrollToTop}
                                    className="absolute right-4 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-all hover:scale-110 z-50"
                                    style={{
                                        bottom: `${inputContainerHeight + 16}px`,
                                    }}
                                    aria-label="맨 위로">
                                    <Icon icon="mdi:chevron-up" className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PropagationModal;
