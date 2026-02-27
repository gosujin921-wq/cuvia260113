import React, { useEffect, useState, useRef } from 'react';
import { Icon } from '@iconify/react';

interface AgentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  hideControls?: boolean;
  position?: { top?: string; right?: string; left?: string; bottom?: string };
  maxHeight?: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isTyping?: boolean;
  displayedContent?: string;
}

const AGENT_GRADIENT = 'linear-gradient(135deg, #0066FF 0%, #8A2BE2 50%, #ff8566 100%)';

const AgentPopup: React.FC<AgentPopupProps> = ({
  isOpen,
  onClose,
  hideControls = false,
  position: positionOverride,
  maxHeight: maxHeightProp,
}) => {
  const [slideEntered, setSlideEntered] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [inputKey, setInputKey] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isResponding, setIsResponding] = useState(false);
  const [popupWidth, setPopupWidth] = useState(520);
  const [popupHeight, setPopupHeight] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ignoreNextChangeRef = useRef(false);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resolvedHeight = popupHeight ?? maxHeightProp ?? 720;

  const handleResizeMouseDown = (
    e: React.MouseEvent,
    direction: 'left' | 'top' | 'top-left',
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = popupWidth;
    const startHeight = resolvedHeight;

    const cursorMap = {
      left: 'col-resize',
      top: 'row-resize',
      'top-left': 'nwse-resize',
    } as const;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (direction === 'left' || direction === 'top-left') {
        const deltaX = startX - moveEvent.clientX;
        setPopupWidth(Math.max(360, Math.min(startWidth + deltaX, 900)));
      }
      if (direction === 'top' || direction === 'top-left') {
        const deltaY = startY - moveEvent.clientY;
        setPopupHeight(Math.max(300, Math.min(startHeight + deltaY, window.innerHeight - 48)));
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = cursorMap[direction];
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    if (isOpen) {
      setSlideEntered(false);
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(() => setSlideEntered(true));
      });
      return () => cancelAnimationFrame(t);
    } else {
      setSlideEntered(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (bottomRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = 'auto';
    const newHeight = Math.min(el.scrollHeight, 72);
    el.style.height = `${newHeight}px`;
  }, [chatInput, inputKey]);

  const handleSkipResponse = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    setMessages((prev) =>
      prev.filter((msg) => {
        if (msg.isTyping) return false;
        if (msg.role === 'assistant' && msg.content === '') return false;
        return true;
      })
    );
    setIsResponding(false);
  };

  const handleSendMessage = () => {
    const text = chatInput.trim();
    if (!text || isResponding) return;

    const userTimestamp = new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: userTimestamp,
    };

    setMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setInputKey((k) => k + 1);
    ignoreNextChangeRef.current = true;
    setIsResponding(true);

    setTimeout(() => {
      const replyContent = `"${text}"에 대한 응답입니다.`;
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        isTyping: true,
        displayedContent: '',
      };

      setMessages((prev) => [...prev, assistantMessage]);

      let currentIndex = 0;
      typingIntervalRef.current = setInterval(() => {
        currentIndex++;
        if (currentIndex <= replyContent.length) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? { ...msg, displayedContent: replyContent.substring(0, currentIndex) }
                : msg
            )
          );
        } else {
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
          }
          setIsResponding(false);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? { ...msg, isTyping: false, displayedContent: replyContent }
                : msg
            )
          );
        }
      }, 30);
    }, 700);
  };

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const padding = 20;
  const mainPopupHeight = 0;
  const gap = 10;

  return (
    <div
      className="absolute"
      style={
        positionOverride
          ? {
              position: 'absolute' as const,
              ...positionOverride,
              zIndex: 90,
              transform: slideEntered ? 'translateX(0)' : 'translateX(100%)',
              opacity: slideEntered ? 1 : 0,
              transition: 'transform 0.3s ease-out, opacity 0.3s ease-out, top 0.3s ease-out, right 0.3s ease-out, bottom 0.3s ease-out',
            }
          : {
              top: `${padding + mainPopupHeight + gap + (hideControls ? 56 : 0)}px`,
              right: `${padding}px`,
              zIndex: 90,
              transform: slideEntered ? 'translateX(0)' : 'translateX(100%)',
              opacity: slideEntered ? 1 : 0,
              transition: 'transform 0.3s ease-out, opacity 0.3s ease-out, top 0.3s ease-out, right 0.3s ease-out',
            }
      }
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="flex flex-col rounded-2xl bg-white border border-gray-200 shadow-lg relative overflow-hidden"
        style={{ height: `${resolvedHeight}px`, width: `${popupWidth}px` }}
      >
        {/* 좌상단 모서리 리사이즈 핸들 */}
        <div
          className="absolute left-0 top-0 w-4 h-4 cursor-nwse-resize z-30"
          onMouseDown={(e) => handleResizeMouseDown(e, 'top-left')}
          role="separator"
          aria-label="팝업 크기 대각선 조절"
          tabIndex={0}
        />
        {/* 상단 리사이즈 핸들 */}
        <div
          className="absolute left-4 top-0 right-0 h-1.5 cursor-row-resize z-20 group"
          onMouseDown={(e) => handleResizeMouseDown(e, 'top')}
          role="separator"
          aria-label="팝업 높이 조절"
          tabIndex={0}
        >
          <div className="absolute left-0 right-0 top-0 h-0.5 bg-transparent group-hover:bg-blue-400 group-active:bg-blue-500 transition-colors rounded-full" />
        </div>
        {/* 좌측 리사이즈 핸들 */}
        <div
          className="absolute left-0 top-4 bottom-0 w-1.5 cursor-col-resize z-20 group"
          onMouseDown={(e) => handleResizeMouseDown(e, 'left')}
          role="separator"
          aria-label="팝업 너비 조절"
          tabIndex={0}
        >
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-transparent group-hover:bg-blue-400 group-active:bg-blue-500 transition-colors rounded-full" />
        </div>
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4 pt-4">
          <div className="space-y-3">
            {messages.length === 0 && (
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-900 font-semibold text-sm">CUVIA Agent</span>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm leading-relaxed text-gray-700">
                      안녕하세요. 무엇을 도와드릴까요?
                    </p>
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                {message.role === 'assistant' && (
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-900 font-semibold text-sm">CUVIA Agent</span>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                          {message.isTyping ? message.displayedContent : message.content}
                          {message.isTyping && <span className="inline-block w-1 h-4 bg-gray-700 ml-0.5 animate-pulse" />}
                        </p>
                        <div className="text-xs text-gray-500 mt-2">
                          {message.timestamp}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {message.role === 'user' && (
                  <div className="flex justify-end">
                    <div
                      className="max-w-[70%] px-4 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                      style={{
                        background: 'rgba(255, 133, 102, 0.2)',
                        color: '#1f2937',
                      }}
                    >
                      <p>{message.content}</p>
                      <div className="text-xs text-gray-600 mt-1">
                        {message.timestamp}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isResponding && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-1 pt-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            )}
          </div>

          <div ref={bottomRef} className="h-2" />
        </div>

        <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white">
          <div className="relative flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-500 transition-colors">
            <textarea
              id="agent-chat-input"
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
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="에이전트에게 명령을 입력하세요..."
              className="flex-1 bg-transparent border-none text-gray-900 text-sm placeholder-gray-500 focus:outline-none resize-none overflow-y-auto"
              style={{
                minHeight: '24px',
                maxHeight: '72px',
                lineHeight: '24px',
              }}
              rows={1}
              aria-label="에이전트 메시지 입력"
              tabIndex={0}
            />
            {isResponding ? (
              <button
                type="button"
                onClick={handleSkipResponse}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95"
                style={{ background: AGENT_GRADIENT }}
                aria-label="답변 취소"
                tabIndex={0}
              >
                <Icon icon="mdi:close" className="w-5 h-5 text-white" />
              </button>
            ) : (
              <button
                id="agent-chat-send-button"
                type="button"
                onClick={handleSendMessage}
                disabled={!chatInput.trim()}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                style={{ background: AGENT_GRADIENT }}
                aria-label="전송"
                tabIndex={0}
              >
                <img
                  src="/simbol.svg"
                  alt="전송"
                  className="w-5 h-5"
                  style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }}
                />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            <span className="font-semibold">CUVIA Agent</span>는 실수를 할 수 있습니다. 중요한 정보는 재차 확인하세요.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgentPopup;
