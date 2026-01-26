import React, { useEffect, useState, useRef } from 'react';
import { Icon } from '@iconify/react';

interface AIAgentPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const AGENT_GRADIENT = 'linear-gradient(135deg, #0066FF 0%, #8A2BE2 50%, #ff8566 100%)';

const AIAgentPopup: React.FC<AIAgentPopupProps> = ({ isOpen, onClose }) => {
  const [chatInput, setChatInput] = useState('');
  const [inputKey, setInputKey] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: '안녕하세요. Agent Chat에 오신 것을 환영합니다. 어떤 도움이 필요하신가요?',
      timestamp: new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    },
  ]);
  const [isResponding, setIsResponding] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const ignoreNextChangeRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
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
    el.style.height = 'auto';
    const lineHeight = 24;
    const maxHeight = lineHeight * 3;
    const newHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${newHeight}px`;
  }, [chatInput, inputKey]);

  const generateAssistantReply = (prompt: string): string => {
    return `"${prompt}"에 대한 응답입니다. Agent Chat에서 다양한 기능을 사용할 수 있습니다.`;
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
      const reply = generateAssistantReply(text);
      const assistantTimestamp = new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: assistantTimestamp,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsResponding(false);
    }, 700);
  };

  if (!isOpen) return null;

  return (
    <div
      className="absolute top-[calc(1.25rem+348px+0.5rem)] right-5 z-[1000]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-[420px] max-h-[600px] flex flex-col rounded-2xl bg-white border border-gray-200 shadow-lg relative overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
          aria-label="닫기"
        >
          <Icon icon="mdi:close" className="w-5 h-5" />
        </button>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4 pt-6">
          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                {message.role === 'assistant' && (
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: AGENT_GRADIENT }}
                    >
                      <img
                        src="/simbol.svg"
                        alt="AI"
                        className="w-4 h-4"
                        style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-900 font-semibold text-sm">CUVIA Agent</span>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <div className="text-xs text-gray-500 mt-2">{message.timestamp}</div>
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
                      <div className="text-xs text-gray-600 mt-1">{message.timestamp}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isResponding && (
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: AGENT_GRADIENT }}
                >
                  <img
                    src="/simbol.svg"
                    alt="AI"
                    className="w-4 h-4"
                    style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }}
                  />
                </div>
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
              placeholder="CUVIA에게 물어보기"
              className="flex-1 bg-transparent border-none text-gray-900 text-sm placeholder-gray-500 focus:outline-none resize-none overflow-y-auto"
              style={{
                minHeight: '24px',
                maxHeight: '72px',
                lineHeight: '24px',
              }}
              rows={1}
            />
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isResponding}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              style={{ background: AGENT_GRADIENT }}
              aria-label="전송"
            >
              <img
                src="/simbol.svg"
                alt="전송"
                className="w-5 h-5"
                style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }}
              />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            CUVIA Link는 실수를 할 수 있습니다. 중요한 정보는 재차 확인하세요.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAgentPopup;
