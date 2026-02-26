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
            <div className="fixed inset-0 bg-black/70 transition-opacity duration-500" style={{ zIndex: 10001 }} onClick={onClose} />

            {/* 중앙 패널 */}
            <div
                className="fixed top-1/2 left-1/2 flex flex-col transition-all duration-500 ease-out opacity-100 scale-100"
                style={{
                    transform: "translate(-50%, -50%)",
                    width: "900px",
                    maxWidth: "90vw",
                    height: "90vh",
                    maxHeight: "90vh",
                    zIndex: 10002,
                    padding: "16px",
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
                                <div className="px-4 py-2 rounded-full text-xs font-medium bg-[#0f0f0f]/50 text-gray-300 flex items-center gap-2 border border-[#31353a]" style={{ backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }}>
                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                    <span>전파 건수: {threads.length}건</span>
                                </div>
                            </div>

                            {/* 닫기 버튼 */}
                            <button type="button" onClick={onClose} className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0f0f0f]/50 border border-[#31353a] hover:border-red-500/50 hover:bg-red-500/10 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all" aria-label="닫기">
                                <Icon icon="mdi:close" className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* 메인 영역 - 메시지 영역만 표시 */}
                    <div
                        className="rounded-lg flex-1 gradient-border-right-bottom border border-[#31353a] relative flex flex-col overflow-hidden"
                        style={{
                            minHeight: 0,
                            maxHeight: "100%",
                            background: "linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)",
                            backdropFilter: "blur(2px)",
                            WebkitBackdropFilter: "blur(2px)",
                        }}>
                        {/* 메시지 영역 */}
                        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                            {/* 메시지 헤더 */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-[#31353a] flex-shrink-0 bg-[#0a0a0a]/50">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-semibold text-gray-200 truncate">{currentThread?.title || "전파"}</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">
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

                            {/* 메시지 영역 - 타임라인 스타일 */}
                            <div
                                ref={scrollContainerRef}
                                className="flex-1 overflow-y-auto p-4"
                                style={{
                                    scrollbarWidth: "thin",
                                    scrollbarColor: "#31353a #0f0f0f",
                                }}>
                                <div className="max-w-full">
                                    {/* 타임라인 컨테이너 */}
                                    <div className="relative pl-12">
                                        {/* 타임라인 세로선 */}
                                        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[#31353a]" />

                                        {/* 메시지들 */}
                                        <div className="space-y-6">
                                            {threadMessages.map((message) => (
                                                <div
                                                    key={message.id}
                                                    className="relative flex items-start gap-4"
                                                    style={{
                                                        marginLeft: message.role === "system" || message.role === "user" ? "40px" : "0px",
                                                    }}>
                                                    {/* 타임라인 아이콘 */}
                                                    <div className="relative z-10 flex-shrink-0 -ml-12">
                                                        {message.role === "agency" && (
                                                            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center border-4 border-[#0a0a0a] shadow-md">
                                                                <Icon icon="mdi:alert-circle" className="w-4 h-4 text-white" />
                                                            </div>
                                                        )}
                                                        {message.role === "system" && (
                                                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center border-4 border-[#0a0a0a] shadow-md">
                                                                <Icon icon="mdi:send" className="w-4 h-4 text-white" />
                                                            </div>
                                                        )}
                                                        {message.role === "user" && (
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center border-4 border-[#0a0a0a] shadow-md">
                                                                <Icon icon="mdi:account" className="w-4 h-4 text-white" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* 메시지 내용 */}
                                                    <div className="flex-1 min-w-0">
                                                        {message.role === "agency" && (
                                                            <div className="bg-[#0f0f0f]/70 border border-[#31353a] rounded-lg p-4 shadow-sm">
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <span className="text-sm font-bold text-red-400">{message.author || "신고기관"}</span>
                                                                    <span className="text-sm text-gray-500">•</span>
                                                                    <span className="text-sm text-gray-500">{message.timestamp}</span>
                                                                    {message.status === "unread" && <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold ml-auto">NEW</span>}
                                                                </div>
                                                                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">{message.content}</pre>
                                                                {message.showCompletionButton && (
                                                                    <div className="mt-4 pt-4 border-t border-[#31353a]">
                                                                        <p className="text-sm text-gray-300 mb-4">해당 시뮬레이션을 종료합니다.</p>
                                                                        <button type="button" onClick={() => onBackToInitial?.()} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors" aria-label="확인">
                                                                            확인
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {message.role === "system" && (
                                                            <div className="bg-[#393a42] border border-[#31353a] rounded-lg p-4 shadow-sm">
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <span className="text-sm font-bold text-gray-200">전파 전송</span>
                                                                    <span className="text-sm text-gray-500">•</span>
                                                                    <span className="text-sm text-gray-500">{message.timestamp}</span>
                                                                </div>
                                                                {message.content ? (
                                                                    <div className="text-sm text-gray-300 whitespace-pre-wrap font-sans">
                                                                        <Markdown>{message.content}</Markdown>
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-sm text-red-400">내용이 없습니다</p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {message.role === "user" && (
                                                            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-4 shadow-sm">
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <span className="text-sm font-semibold text-blue-300">담당자</span>
                                                                    <span className="text-sm text-gray-500">•</span>
                                                                    <span className="text-sm text-gray-500">{message.timestamp}</span>
                                                                </div>
                                                                <p className="text-sm text-gray-300whitespace-pre-wrap">{message.content}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div ref={bottomRef} />
                                </div>
                            </div>

                            {/* 입력 영역 */}
                            <div ref={inputContainerRef} className="flex-shrink-0 border-t border-[#31353a] bg-[#0a0a0a]/50">
                                <div className="p-3">
                                    <div className="relative flex items-center gap-2 bg-white border border-gray-300 rounded-md px-3 py-2 focus-within:border-blue-500 transition-colors">
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
                                    className="absolute right-4 w-10 h-10 rounded-full bg-[#0f0f0f]/90 border border-[#31353a] shadow-lg flex items-center justify-center text-gray-400 hover:text-white hover:border-blue-500/50 transition-all hover:scale-110 z-50"
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
