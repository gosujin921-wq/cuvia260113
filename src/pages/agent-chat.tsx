import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useSearchParams } from 'react-router-dom';
import { ScaledLayout } from '@/components/layouts/ScaledLayout';
import { ChatMessage } from '@/components/event-detail/types';
import { chatBlocks } from '@/components/event-detail/constants';
import CCTVIcon from '@/components/common/CCTVIcon';
import { BasePopup } from '@/components/shared/BasePopup';

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  createdAt: string;
}

const AgentChatPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q');
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 'project-1',
      name: '프로젝트',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    {
      id: 'chat-1',
      title: '새 채팅',
      messages: [
        {
          id: 'chat-1-msg-1',
          role: 'assistant',
          content: '안녕하세요. Agent Chat에 오신 것을 환영합니다. 어떤 도움이 필요하신가요?',
          timestamp: new Date().toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        },
      ],
      createdAt: new Date().toISOString(),
    },
  ]);
  const [currentChatId, setCurrentChatId] = useState('chat-1');
  const [chatInput, setChatInput] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [showToolPopup, setShowToolPopup] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const hasProcessedInitialQueryRef = useRef(false);

  const currentChat = chatSessions.find((chat) => chat.id === currentChatId);
  const chatMessages = currentChat?.messages || [];

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chatMessages, isResponding]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = 24;
      const maxHeight = lineHeight * 4;
      const newHeight = Math.min(scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [chatInput]);

  const addMessage = (role: 'assistant' | 'user', content: string, buttons?: string[]) => {
    const timestamp = new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const newMessage = {
      id: `${role}-${Date.now()}`,
      role,
      content,
      timestamp,
      buttons,
    };

    setChatSessions((prev) =>
      prev.map((chat) =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              title:
                role === 'user' && chat.messages.length === 1
                  ? content.slice(0, 30) + (content.length > 30 ? '...' : '')
                  : chat.title,
            }
          : chat
      )
    );
  };

  const generateAssistantReply = (prompt: string) => {
    return `"${prompt}"에 대한 응답입니다. Agent Chat에서 다양한 기능을 사용할 수 있습니다.`;
  };

  // 초기 쿼리 처리
  useEffect(() => {
    if (initialQuery && !hasProcessedInitialQueryRef.current) {
      hasProcessedInitialQueryRef.current = true;
      
      const text = decodeURIComponent(initialQuery).trim();
      if (!text) return;
      
      // 사용자 메시지 추가
      const userTimestamp = new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const userMessage = {
        id: `user-${Date.now()}-${Math.random()}`,
        role: 'user' as const,
        content: text,
        timestamp: userTimestamp,
      };

      setChatSessions((prev) => {
        const currentChat = prev.find((chat) => chat.id === currentChatId);
        if (!currentChat) return prev;
        
        return prev.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: [...chat.messages, userMessage],
                title: chat.messages.length === 1
                  ? text.slice(0, 30) + (text.length > 30 ? '...' : '')
                  : chat.title,
              }
            : chat
        );
      });

      setIsResponding(true);
      
      // 답변 생성 (700ms 후)
      const replyTimer = setTimeout(() => {
        const reply = `"${text}"에 대한 응답입니다. Agent Chat에서 다양한 기능을 사용할 수 있습니다.`;
        const assistantTimestamp = new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        const assistantMessage = {
          id: `assistant-${Date.now()}-${Math.random()}`,
          role: 'assistant' as const,
          content: reply,
          timestamp: assistantTimestamp,
        };

        setChatSessions((prev) => {
          const currentChat = prev.find((chat) => chat.id === currentChatId);
          if (!currentChat) return prev;
          
          return prev.map((chat) =>
            chat.id === currentChatId
              ? {
                  ...chat,
                  messages: [...chat.messages, assistantMessage],
                }
              : chat
          );
        });
        setIsResponding(false);
        
        // 답변 추가 후 URL에서 쿼리 파라미터 제거
        setTimeout(() => {
          const newSearchParams = new URLSearchParams();
          setSearchParams(newSearchParams);
        }, 100);
      }, 700);

      return () => clearTimeout(replyTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const handleSendMessage = async (messageText?: string) => {
    const text = (messageText ?? chatInput).trim();
    if (!text || isResponding) return;

    addMessage('user', text);
    setChatInput('');
    setIsResponding(true);

    try {
      setTimeout(() => {
        const reply = generateAssistantReply(text);
        addMessage('assistant', reply);
        setIsResponding(false);
      }, 700);
    } catch (error) {
      addMessage('assistant', '응답을 생성하는 중 오류가 발생했습니다.');
      setIsResponding(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  const handleFileUpload = () => {
    setShowToolPopup(false);
    setSelectedFiles([]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNewChat = () => {
    const newChatId = `chat-${Date.now()}`;
    const newChat: ChatSession = {
      id: newChatId,
      title: '새 채팅',
      messages: [
        {
          id: `${newChatId}-msg-1`,
          role: 'assistant',
          content: '안녕하세요. 무엇을 도와드릴까요?',
          timestamp: new Date().toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        },
      ],
      createdAt: new Date().toISOString(),
    };
    setChatSessions((prev) => [newChat, ...prev]);
    setCurrentChatId(newChatId);
    setChatInput('');
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setChatInput('');
  };

  const handleNewProject = () => {
    const newProjectId = `project-${Date.now()}`;
    const newProject: Project = {
      id: newProjectId,
      name: '새 프로젝트',
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => [newProject, ...prev]);
  };

  const filteredChatSessions = chatSessions;

  return (
    <ScaledLayout noScale>
      <div className="flex flex-1 overflow-hidden bg-white agent-chat-page min-h-0 h-full">
        {/* 좌측 패널 */}
        <aside
          className={`border-r border-gray-200 flex flex-col overflow-hidden transition-all duration-300 flex-shrink-0 relative ${
            isLeftPanelOpen ? 'w-64' : 'w-16'
          }`}
          style={{ 
            background: 'linear-gradient(to bottom, #ffffff, #fafafa)',
            zIndex: 10 
          }}
        >
          {/* 애니메이션 백그라운드 그라데이션 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
            {/* 오렌지 그라데이션 원 1 */}
            <div 
              className="absolute rounded-full agent-hub-gradient-1"
              style={{
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(255, 133, 102, 0.8) 0%, rgba(255, 133, 102, 0.5) 30%, rgba(255, 133, 102, 0.2) 50%, transparent 70%)',
                filter: 'blur(120px)',
                opacity: 0.4,
                top: '-10%',
                left: '-10%',
              }}
            />
            {/* 파란색 그라데이션 원 1 */}
            <div 
              className="absolute rounded-full agent-hub-gradient-2"
              style={{
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, rgba(37, 99, 235, 0.5) 30%, rgba(37, 99, 235, 0.2) 50%, transparent 70%)',
                filter: 'blur(100px)',
                opacity: 0.4,
                top: '20%',
                right: '-5%',
              }}
            />
            {/* 오렌지 그라데이션 원 2 */}
            <div 
              className="absolute rounded-full agent-hub-gradient-3"
              style={{
                width: '550px',
                height: '550px',
                background: 'radial-gradient(circle, rgba(255, 133, 102, 0.7) 0%, rgba(255, 133, 102, 0.4) 30%, rgba(255, 133, 102, 0.15) 50%, transparent 70%)',
                filter: 'blur(110px)',
                opacity: 0.35,
                bottom: '10%',
                left: '15%',
              }}
            />
            {/* 파란색 그라데이션 원 2 */}
            <div 
              className="absolute rounded-full agent-hub-gradient-4"
              style={{
                width: '450px',
                height: '450px',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.7) 0%, rgba(37, 99, 235, 0.4) 30%, rgba(37, 99, 235, 0.15) 50%, transparent 70%)',
                filter: 'blur(90px)',
                opacity: 0.35,
                bottom: '-5%',
                right: '10%',
              }}
            />
          </div>
          {/* 접기/펼치기 아이콘 */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0 bg-gray-50/80 relative" style={{ zIndex: 2 }}>
            <button
              onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label={isLeftPanelOpen ? '패널 접기' : '패널 펼치기'}
            >
              <Icon icon="mdi:menu" className="w-6 h-6" />
            </button>
            {isLeftPanelOpen && (
              <button
                onClick={() => {
                  // 검색 기능 (나중에 구현)
                }}
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                aria-label="검색"
              >
                <Icon icon="mdi:magnify" className="w-6 h-6" />
              </button>
            )}
          </div>

          {isLeftPanelOpen ? (
            <div className="flex flex-col h-full flex-1 min-h-0 relative" style={{ zIndex: 2 }}>
              {/* 새 채팅 */}
              <div className="px-6 py-2 border-b border-gray-200 flex-shrink-0">
                <button
                  onClick={handleNewChat}
                  className="w-full flex items-center justify-between py-2 text-gray-700 hover:bg-white/50 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Icon icon="mdi:square-edit-outline" className="w-5 h-5 text-gray-600" />
                    <span className="font-medium" style={{ fontSize: '15px' }}>새 채팅</span>
                  </div>
                </button>
              </div>

              {/* 스크롤 가능한 컨텐츠 영역 */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {/* 프로젝트 섹션 */}
                <div className="px-6 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">프로젝트</span>
                    <Icon icon="mdi:chevron-right" className="w-5 h-5 text-gray-400" />
                  </div>
                  <button
                    onClick={handleNewProject}
                    className="w-full flex items-center gap-2 py-1.5 text-gray-700 hover:bg-white/50 rounded-lg transition-colors mb-1"
                  >
                    <Icon icon="mdi:folder-plus-outline" className="w-5 h-5 text-gray-500" />
                    <span style={{ fontSize: '15px' }}>새 프로젝트</span>
                  </button>
                  <div className="space-y-0.5">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="w-full flex items-center justify-between py-1.5 text-gray-700 hover:bg-white/50 rounded-lg transition-colors group"
                      >
                        <button className="flex items-center gap-2 flex-1 min-w-0 text-left">
                          <Icon icon="mdi:folder-outline" className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          <span className="truncate" style={{ fontSize: '15px' }}>{project.name}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // 프로젝트 메뉴 기능 (나중에 구현)
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pl-1.5 pt-1.5 pb-1.5 pr-0 hover:bg-white/70 rounded"
                          aria-label="프로젝트 메뉴"
                        >
                          <Icon icon="mdi:dots-vertical" className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 채팅 섹션 */}
                <div className="px-6 py-2">
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">채팅</span>
                  </div>
                  <div className="space-y-0.5">
                    {filteredChatSessions.map((chat) => (
                      <div
                        key={chat.id}
                        className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-all group ${
                          currentChatId === chat.id
                            ? 'bg-white/50 text-gray-900'
                            : 'text-gray-700 hover:bg-white/50'
                        }`}
                        style={{ fontSize: '15px' }}
                      >
                        <button
                          onClick={() => handleSelectChat(chat.id)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <span className="block truncate">{chat.title}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // 채팅 메뉴 기능 (나중에 구현)
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pl-1.5 pt-1.5 pb-1.5 pr-0 hover:bg-white/70 rounded"
                          aria-label="채팅 메뉴"
                        >
                          <Icon icon="mdi:dots-vertical" className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 하단 네비게이션 */}
              <div className="border-t border-gray-200 flex-shrink-0">
                <div className="px-6 py-2 space-y-1">
                  <button className="w-full flex items-center gap-2 py-1.5 text-gray-700 hover:bg-white/50 rounded-lg transition-colors">
                    <Icon icon="mdi:history" className="w-5 h-5 text-gray-500" />
                    <span style={{ fontSize: '15px' }}>활동</span>
                  </button>
                  <button className="w-full flex items-center gap-2 py-1.5 text-gray-700 hover:bg-white/50 rounded-lg transition-colors">
                    <Icon icon="mdi:cog-outline" className="w-5 h-5 text-gray-500" />
                    <span style={{ fontSize: '15px' }}>설정 및 도움말</span>
                  </button>
                </div>
                <div className="px-6 py-2 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Icon icon="mdi:map-marker-outline" className="w-5 h-5" />
                    <div>
                      <div>대한민국 경기도 과천시 갈현동</div>
                      <div className="text-gray-400">IP 주소 기반 • 위치 업데이트</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full items-center py-4 space-y-6 flex-1">
              <button
                onClick={handleNewChat}
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                aria-label="새 채팅"
              >
                <Icon icon="mdi:square-edit-outline" className="w-6 h-6" />
              </button>
              <div className="flex-1"></div>
              <button
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                aria-label="히스토리"
              >
                <Icon icon="mdi:history" className="w-6 h-6" />
              </button>
              <button
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                aria-label="설정"
              >
                <Icon icon="mdi:cog-outline" className="w-6 h-6" />
              </button>
            </div>
          )}
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden h-full">
          {/* Header */}
          <header className="border-b border-gray-200 bg-white px-6 flex-shrink-0 relative" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-gray-900">{currentChat?.title || 'CUVIA Agent'}</h1>
                <button className="flex items-center text-gray-500 hover:text-gray-700 transition-colors">
                  <Icon icon="mdi:chevron-down" className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-4">
              <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors">
                <Icon icon="mdi:share-variant-outline" className="w-5 h-5" />
                <span className="text-sm">공유하기</span>
              </button>
              <button className="flex items-center text-gray-500 hover:text-gray-700 transition-colors">
                <Icon icon="mdi:dots-vertical" className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Chat Content */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0">
            <div className="p-6 space-y-8 max-w-[800px] mx-auto w-full">
              {/* AI Chat Blocks */}
              <div className="space-y-4">
                {chatBlocks.map((block) => (
                  <div key={block.title} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon icon={block.icon} className="w-5 h-5 text-blue-600" />
                      <h4 className="text-gray-900 font-semibold text-sm">{block.title}</h4>
                    </div>
                    <p className="text-gray-700 leading-relaxed" style={{ fontSize: '15px' }}>{block.content}</p>
                  </div>
                ))}
              </div>

              {/* CCTV 추천 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CCTVIcon className="w-5 h-5 text-blue-600" />
                  <h4 className="text-gray-900 font-semibold text-sm">CCTV 추천</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['CCTV-7 (현장)', 'CCTV-12 (북쪽 50m)', 'CCTV-15 (골목길)'].map((cctv) => (
                    <button
                      key={cctv}
                      className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      {cctv}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-gray-200"></div>

              {/* 대화 로그 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-700 text-sm">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                    style={{
                      background: 'linear-gradient(135deg, #0066FF 0%, #8A2BE2 50%, #ff8566 100%)',
                    }}
                  >
                    <img
                      src="/simbol.svg"
                      alt="AI"
                      className="w-4 h-4"
                      style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }}
                    />
                  </div>
                  <span className="text-gray-900">CUVIA</span>
                </div>
                <div className="space-y-3">
                  {chatMessages.map((message) => (
                    <div key={message.id} className="space-y-2">
                      <div className={`flex ${message.role === 'user' ? 'justify-end' : ''}`}>
                        <div
                          className={`${
                            message.role === 'user'
                              ? 'max-w-[70%] px-4 py-2 rounded-2xl border bg-gradient-to-br from-[#ff8566] to-[#ff8566] text-white border-transparent'
                              : 'w-full text-gray-900'
                          }`}
                          style={{ fontSize: '15px' }}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-orange-100' : 'text-gray-500'}`}>
                            {message.timestamp}
                          </div>
                        </div>
                      </div>
                      {message.role === 'assistant' && message.buttons && message.buttons.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {message.buttons.map((button) => (
                            <button
                              key={button}
                              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            >
                              {button}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {isResponding && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  )}
                </div>
              </div>

              {/* 스크롤 앵커 */}
              <div ref={bottomRef} className="h-[75px]" />
            </div>
          </div>

          {/* 입력 영역 */}
          <div className="bg-white flex-shrink-0">
            <div className="p-4 max-w-[800px] mx-auto w-full">
              <div className="relative flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-500 transition-colors">
                <button
                  onClick={() => setShowToolPopup(true)}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                  aria-label="도구 열기"
                >
                  <Icon icon="mdi:plus" className="w-5 h-5" />
                </button>
                <textarea
                  ref={textareaRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="CUVIA에게 물어보기"
                  className="flex-1 bg-transparent border-none text-gray-900 text-sm placeholder-gray-500 focus:outline-none resize-none overflow-hidden"
                  style={{
                    minHeight: '24px',
                    maxHeight: '96px',
                    lineHeight: '24px',
                  }}
                  rows={1}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim()}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #0066FF 0%, #8A2BE2 50%, #ff8566 100%)',
                  }}
                  aria-label="검색"
                >
                  <img
                    src="/simbol.svg"
                    alt="검색"
                    className="w-5 h-5"
                    style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }}
                  />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                CUVIA Agent는 실수를 할 수 있습니다. 중요한 정보는 재차 확인하세요.
              </p>
            </div>
          </div>

          {/* 도구 팝업 */}
          <BasePopup
            isOpen={showToolPopup}
            onClose={() => {
              setShowToolPopup(false);
              setSelectedFiles([]);
            }}
            title="도구"
            titleIcon={<Icon icon="mdi:tools" className="w-5 h-5 text-blue-600" />}
            maxWidth="max-w-md"
            overlayClassName="bg-black/20"
            containerClassName="bg-white border-gray-200"
          >
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">파일 업로드</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Icon icon="mdi:cloud-upload" className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">클릭하여 파일 선택</p>
                    <p className="text-xs text-gray-500">또는 파일을 여기에 드래그하세요</p>
                  </label>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-900">선택된 파일 ({selectedFiles.length})</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Icon icon="mdi:file" className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          <span className="text-sm text-gray-900 truncate">{file.name}</span>
                          <span className="text-xs text-gray-500 flex-shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          onClick={() => handleRemoveFile(index)}
                          className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-600 transition-colors"
                          aria-label="파일 제거"
                        >
                          <Icon icon="mdi:close" className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFiles.length > 0 && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setShowToolPopup(false);
                      setSelectedFiles([]);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleFileUpload}
                    className="flex-1 px-4 py-2 bg-gradient-to-br from-[#ff8566] to-[#ff8566] hover:from-[#ff8566] hover:to-[#ff8566] text-white rounded-lg text-sm transition-colors"
                  >
                    업로드
                  </button>
                </div>
              )}
            </div>
          </BasePopup>
        </main>
      </div>
    </ScaledLayout>
  );
};

export default AgentChatPage;
