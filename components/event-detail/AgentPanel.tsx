
import React, { useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { ChatMessage, SavedClip } from './types';
import { chatBlocks, quickCommands, cctvInfo } from './constants';
import CCTVIcon from '@/components/common/CCTVIcon';

interface AgentPanelProps {
  categoryLabel: string;
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (value: string) => void;
  isResponding: boolean;
  savedClips: SavedClip[];
  setSelectedMapCCTV?: (cctvId: string | null) => void;
  setShowMapCCTVPopup?: (show: boolean) => void;
  handleSendMessage: (messageText?: string) => void;
  handleDeleteClip: (clipId: string) => void;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({
  categoryLabel,
  chatMessages,
  chatInput,
  setChatInput,
  isResponding,
  savedClips,
  setSelectedMapCCTV,
  setShowMapCCTVPopup,
  handleSendMessage,
  handleDeleteClip,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chatMessages, isResponding]);

  // textarea 자동 높이 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = 24; // 대략적인 line-height (text-sm 기준)
      const maxHeight = lineHeight * 4; // 최대 4줄
      const newHeight = Math.min(scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [chatInput]);

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden h-full">
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-3 pl-10 pr-9 space-y-8 min-h-0">
        {/* AI Chat Blocks */}
        <div className="space-y-4">
          {chatBlocks.map((block) => (
            <div key={block.title} className="bg-gray-50 border border-gray-200 rounded-lg p-4" style={{ borderWidth: '1px' }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon icon={block.icon} className="w-4 h-4 text-blue-600" />
                <h4 className="text-gray-900 font-semibold text-sm">{block.title}</h4>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{block.content}</p>
            </div>
          ))}
        </div>

        {/* CCTV 추천 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4" style={{ borderWidth: '1px' }}>
          <div className="flex items-center gap-2 mb-3">
            <CCTVIcon className="w-4 h-4 text-blue-600" />
            <h4 className="text-gray-900 font-semibold text-sm">CCTV 추천</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {['CCTV-7 (현장)', 'CCTV-12 (북쪽 50m)', 'CCTV-15 (골목길)'].map((cctv) => (
              <button
                key={cctv}
                onClick={() => {
                  if (setSelectedMapCCTV && setShowMapCCTVPopup) {
                    setSelectedMapCCTV(cctv);
                    setShowMapCCTVPopup(true);
                  }
                }}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm hover:border-blue-500 hover:bg-blue-50 transition-colors"
                style={{ borderWidth: '1px' }}
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
            <span className="text-gray-900">CUVIA Agent</span>
          </div>
          <div className="space-y-3">
            {chatMessages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div
                  className={`flex ${message.role === 'user' ? 'justify-end' : ''}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-2xl border text-sm ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-[#ff8566] to-[#ff8566] text-white border-transparent'
                        : 'bg-gray-100 text-gray-900 border-gray-200'
                    }`}
                    style={{ borderWidth: '1px' }}
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
                        onClick={() => {
                          if (setSelectedMapCCTV && setShowMapCCTVPopup) {
                            setSelectedMapCCTV(button);
                            setShowMapCCTVPopup(true);
                          }
                        }}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm hover:border-blue-500 hover:bg-blue-50 transition-colors"
                        style={{ borderWidth: '1px' }}
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

        {/* 스크롤 앵커 - 항상 하단에 고정 */}
        <div ref={bottomRef} style={{ height: '75px' }} />
      </div>

      {/* 입력 영역 */}
      <div className="bg-white flex-shrink-0">
        <div className="p-4">
          <div className="relative flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-500 transition-colors">
            <button
              onClick={() => {
                // 도구 팝업 (나중에 구현)
              }}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors self-center"
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
              className="flex-1 bg-transparent border-none text-gray-900 text-sm placeholder-gray-500 focus:outline-none resize-none overflow-hidden self-center"
              style={{
                minHeight: '24px',
                maxHeight: '96px',
                lineHeight: '24px',
              }}
              rows={1}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!chatInput.trim() || isResponding}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 self-center"
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
    </main>
  );
};
