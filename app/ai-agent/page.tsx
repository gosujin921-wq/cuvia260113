'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const AIAgentPageContent = () => {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // URL 쿼리 파라미터에서 초기 질문 가져오기
    const query = searchParams.get('query');
    if (query) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: query,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([userMessage]);
      setInput('');
      setIsLoading(true);

      // TODO: 실제 AI API 연동
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'AI 응답을 처리 중입니다. 실제 AI API와 연동하면 여기에 응답이 표시됩니다.',
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1000);
    }
  }, [searchParams]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // TODO: 실제 AI API 연동
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'AI 응답을 처리 중입니다. 실제 AI API와 연동하면 여기에 응답이 표시됩니다.',
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f0f0f] overflow-hidden">
      {/* Header */}
      <header className="flex h-16 items-center justify-between bg-[#1a1a1a] border-b border-[#2a2a2a] px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-24 h-5 flex items-center justify-center">
              <img 
                src="/logo.svg" 
                alt="CUVIA Logo" 
                className="h-5 w-auto object-contain"
              />
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Icon icon="mdi:robot" className="w-6 h-6 text-blue-400" />
            <span className="text-xl font-semibold text-white">AI Agent</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/agent-hub"
            className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-full transition-colors text-sm"
          >
            Agent Hub로 돌아가기
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-full transition-colors text-sm"
          >
            대시보드로 돌아가기
          </Link>
        </div>
      </header>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-16 h-16 bg-gradient-to-br from-[#7C62F0] to-[#5A3FEA] rounded-full flex items-center justify-center mb-4">
              <Icon icon="mdi:sparkles" className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">AI Agent와 대화하기</h2>
            <p className="text-sm text-center max-w-md">
              자연어로 질문하거나 명령을 입력하면 AI Agent가 도와드립니다.
              <br />
              예: "화재 이벤트를 검색해줘", "오늘 발생한 고위험 이벤트 보여줘"
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-[#7C62F0] to-[#5A3FEA] rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon icon="mdi:sparkles" className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-[#7C62F0] to-[#5A3FEA] text-white'
                      : 'bg-[#1a1a1a] border border-[#2a2a2a] text-white'
                  }`}
                  style={{ borderWidth: '1px' }}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-purple-100' : 'text-gray-400'
                    }`}
                  >
                    {message.timestamp}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-[#2a2a2a] rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon icon="mdi:account" className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon icon="mdi:robot" className="w-5 h-5 text-white" />
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-3" style={{ borderWidth: '1px' }}>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="border-t border-[#2a2a2a] bg-[#1a1a1a] p-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleInputKeyPress}
              placeholder="메시지를 입력하세요... (Enter로 전송)"
              className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#2a2a2a] text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              style={{ borderWidth: '1px' }}
              disabled={isLoading}
              aria-label="질문 입력"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-gradient-to-br from-[#7C62F0] to-[#5A3FEA] hover:from-[#8B72F5] hover:to-[#6A4FFA] disabled:bg-[#2a2a2a] disabled:text-gray-500 text-white transition-colors font-medium flex items-center gap-2"
            aria-label="전송"
          >
            <Icon icon="mdi:sparkles" className="w-5 h-5" />
            <span>전송</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AIAgentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-[#0f0f0f]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">로딩 중...</p>
        </div>
      </div>
    }>
      <AIAgentPageContent />
    </Suspense>
  );
}
