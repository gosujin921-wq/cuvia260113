import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { ScaledLayout } from '@/components/layouts/ScaledLayout';
import { ChatMessage } from '@/components/event-detail/types';
import { BasePopup } from '@/components/shared/BasePopup';

const AgentHubPage = () => {
  const navigate = useNavigate();
  const [chatInput, setChatInput] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [showToolPopup, setShowToolPopup] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isResponding]);

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

  const handleSendMessage = async (messageText?: string) => {
    const text = (messageText ?? chatInput).trim();
    if (!text) return;

    // 검색 시 agent-chat 페이지로 이동 (쿼리 파라미터 사용)
    navigate(`/agent-chat?q=${encodeURIComponent(text)}`);
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

  return (
    <ScaledLayout noScale>
      <div className="flex flex-1 overflow-hidden min-h-0 h-full relative" style={{ background: 'linear-gradient(to bottom, #ffffff, #fafafa)' }}>
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
        
        <main className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden h-full relative" style={{ zIndex: 10 }}>
          {/* Chat Content */}
          {messages.length > 0 && (
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0">
              <div className="p-6 space-y-8 max-w-[800px] mx-auto w-full">
                {/* 대화 로그 */}
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className="space-y-2">
                      <div className={`flex ${message.role === 'user' ? 'justify-end' : ''}`}>
                        <div
                          className={`${
                            message.role === 'user'
                              ? 'max-w-[70%] px-4 py-2 rounded-2xl border text-sm bg-gradient-to-br from-[#ff8566] to-[#ff8566] text-white border-transparent'
                              : 'w-full text-gray-900 text-sm'
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-orange-100' : 'text-gray-500'}`}>
                            {message.timestamp}
                          </div>
                        </div>
                      </div>
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

                {/* 스크롤 앵커 */}
                <div ref={bottomRef} className="h-[75px]" />
              </div>
            </div>
          )}

          {/* 중앙 입력 영역 (메시지가 없을 때) */}
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col relative z-10">
              {/* 상단: 로고와 Agent (대시보드와 동일한 위치) */}
              <div className="py-4 px-3 flex items-center gap-2.5">
                <div className="w-24 h-5 flex items-center justify-start">
                  <img 
                    src="/logo.svg" 
                    alt="CUVIA Logo" 
                    className="h-5 w-auto object-contain"
                  />
                </div>
                <span className="text-xl font-semibold text-gray-400 tracking-tight">Agent</span>
              </div>
              
              {/* 중앙: 문구와 채팅창 */}
              <div className="flex-1 flex flex-col items-center justify-center max-w-[800px] mx-auto w-full">
                <p className="text-3xl font-medium text-gray-900 text-center mb-8 leading-relaxed w-full" style={{ fontSize: '27px' }}>
                  자연어로 질문하면{' '}
                  <span className="bg-gradient-to-r from-[#ff8566] to-[#ff8566] bg-clip-text text-transparent font-semibold">
                    CUVIA Agent
                  </span>
                  가 적절한 정보와 화면으로 안내합니다.
                </p>
                <div className="w-full">
                  <div className="relative flex items-center gap-3 rounded-2xl px-4 py-3 agent-hub-chat-input" style={{ isolation: 'isolate' }}>
                    <button
                      onClick={() => setShowToolPopup(true)}
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors relative z-10"
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
                      placeholder="자연어로 질문하세요. (예:오늘 접수된 실종 신고 보여줘)"
                      className="flex-1 bg-transparent border-none text-gray-900 placeholder-gray-500 focus:outline-none resize-none overflow-hidden relative z-10"
                      style={{
                        minHeight: '24px',
                        maxHeight: '96px',
                        lineHeight: '24px',
                        fontSize: '16px',
                      }}
                      rows={1}
                    />
                  </div>
                </div>

                {/* 지원 기능 섹션 */}
                <div className="w-full mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">지원 기능</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* 통계 조회 */}
                    <button
                      onClick={() => {
                        const example = '8월 화재 통계';
                        setChatInput(example);
                        textareaRef.current?.focus();
                      }}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                          <Icon icon="mdi:chart-line" className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1.5">통계 조회</h4>
                          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                            자연어로 통계 데이터를 조회하고 시각화합니다.
                          </p>
                          <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                            <p className="text-sm text-gray-700">
                              예시: <span className="text-gray-900 font-medium">&quot;8월 화재 통계&quot;</span>, <span className="text-gray-900 font-medium">&quot;서초구 상위 5 이벤트&quot;</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* 지도 이동 */}
                    <button
                      onClick={() => {
                        const example = '서초구 지도';
                        setChatInput(example);
                        textareaRef.current?.focus();
                      }}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                          <Icon icon="mdi:map" className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1.5">지도 이동</h4>
                          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                            특정 지역이나 시설물의 위치로 지도를 이동합니다.
                          </p>
                          <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                            <p className="text-sm text-gray-700">
                              예시: <span className="text-gray-900 font-medium">&quot;서초구 지도&quot;</span>, <span className="text-gray-900 font-medium">&quot;강남역 CCTV&quot;</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* 메뉴 이동 */}
                    <button
                      onClick={() => {
                        const example = 'CCTV 설정 이동';
                        setChatInput(example);
                        textareaRef.current?.focus();
                      }}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                          <Icon icon="mdi:menu" className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1.5">메뉴 이동</h4>
                          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                            원하는 메뉴나 설정 화면으로 바로 이동합니다.
                          </p>
                          <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                            <p className="text-sm text-gray-700">
                              예시: <span className="text-gray-900 font-medium">&quot;CCTV 설정 이동&quot;</span>, <span className="text-gray-900 font-medium">&quot;이벤트 관리&quot;</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* 이벤트 이력 */}
                    <button
                      onClick={() => {
                        const example = '지난달 침수 이력';
                        setChatInput(example);
                        textareaRef.current?.focus();
                      }}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                          <Icon icon="mdi:history" className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1.5">이벤트 이력</h4>
                          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                            과거 이벤트 발생 이력을 검색합니다.
                          </p>
                          <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                            <p className="text-sm text-gray-700">
                              예시: <span className="text-gray-900 font-medium">&quot;지난달 침수 이력&quot;</span>, <span className="text-gray-900 font-medium">&quot;9월 이벤트 기록&quot;</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 입력 영역 (메시지가 있을 때 하단 고정) */
            <div className="bg-white flex-shrink-0 relative z-10">
              <div className="p-4 max-w-[800px] mx-auto w-full">
                <div className="relative flex items-center gap-3 rounded-2xl px-4 py-3 agent-hub-chat-input" style={{ isolation: 'isolate' }}>
                  <button
                    onClick={() => setShowToolPopup(true)}
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors relative z-10"
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
                    placeholder="자연어로 질문하세요. (예:오늘 접수된 실종 신고 보여줘)"
                    className="flex-1 bg-transparent border-none text-gray-900 placeholder-gray-500 focus:outline-none resize-none overflow-hidden relative z-10"
                    style={{
                      minHeight: '24px',
                      maxHeight: '96px',
                      lineHeight: '24px',
                      fontSize: '16px',
                    }}
                    rows={1}
                  />
                </div>
              </div>
            </div>
          )}

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

export default AgentHubPage;
