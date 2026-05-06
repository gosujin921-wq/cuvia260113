import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import i18nInstance from '@/src/i18n';
import { classifyMessage, findSimilarAttributes } from '@/lib/fast-search-attribute-utils';

interface IntentPayload {
  rawMessage: string;
  attributes: string[];
}

interface AIAgentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  hideControls?: boolean;
  /** 축소 모드일 때 위치 오버라이드 (예: 신고팝업 아래) */
  position?: { top?: string; right?: string; left?: string; bottom?: string };
  /** 고속검색 리스트 카드 개수 (첫 대화 문구용) */
  listCardCount?: number;
  /** SEARCH 인텐트: 해당 속성만 남기고 나머지 제외 */
  onSearchRequest?: (payload: IntentPayload) => void;
  /** REMOVE 인텐트: 속성 제외/삭제 */
  onRemoveRequest?: (payload: IntentPayload) => void;
  /** RESTORE 인텐트: 제외된 속성 복원 */
  onRestoreRequest?: (payload: IntentPayload) => void;
  /** 축소 모드일 때 최대 높이(px). 플로팅 버튼을 넘지 않도록 부모에서 계산해 전달 */
  maxHeight?: number;
  /** 재검색 완료 후 삭제 결과 정보 (요구조건, 삭제 건수) */
  reSearchResult?: { excludedAttributes: string[]; deletedCount: number; visibleCount?: number } | null;
  /** 객체 추적 상태 여부 */
  isObjectTracking?: boolean;
  /** 객체 추적 시작 시 호출 (메뉴 선택과 동일한 로직) */
  onObjectTrackingStart?: () => void;
  /** 객체 추적 애니메이션 완료 트리거 (지도 2D 전환 완료 시) */
  objectTrackingCompleted?: boolean;
  /** 고속검색 프로그래스 표시 여부 */
  showFastSearchProgress?: boolean;
  /** 고속검색 완료 시 호출 */
  onFastSearchComplete?: () => void;
  /** 재검색 시작 콜백 */
  onReSearchStart?: () => void;
  /** 재검색 완료 콜백 */
  onReSearchComplete?: () => void;
  /** 포착 알림 메시지 */
  captureNotificationMessage?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  type?: 'normal' | 'analyzing';
  progress?: number;
  currentStep?: number;
  totalSteps?: number;
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
  isTyping?: boolean;
  displayedContent?: string;
  suggestions?: string[];
}

const AGENT_GRADIENT = 'linear-gradient(135deg, #0066FF 0%, #8A2BE2 50%, #ff8566 100%)';

// 메시지 렌더링 공통 컴포넌트
interface MessageListProps {
  messages: ChatMessage[];
  isResponding: boolean;
  listCardCount: number;
  cameraCount: number;
  isExpanded: boolean;
  onSuggestionClick?: (suggestion: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isResponding, listCardCount, cameraCount, isExpanded, onSuggestionClick }) => {
  const { t } = useTranslation();
  return (
    <>
      {isExpanded && (
        <div className="flex items-center gap-2 text-gray-700 text-sm mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
            style={{
              background: AGENT_GRADIENT,
            }}
          >
            <img
              src="/simbol.svg"
              alt="AI"
              className="w-4 h-4"
              style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }}
            />
          </div>
          <span className="text-gray-900 font-semibold">CUVIA Agent</span>
        </div>
      )}
      
      {messages.map((message) => (
        <div key={message.id} className="space-y-2">
          {message.role === 'assistant' && (
            <div className={isExpanded ? 'space-y-2' : 'flex items-start gap-3'}>
              <div className={isExpanded ? '' : 'min-w-0 flex-1'}>
                {message.type === 'analyzing' ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('agent.analyzing')}</h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {message.content}{message.processingTime ? ' ' + t('agent.timingSuffix', { processing: message.processingTime, transmission: message.transmissionTime }) : ''}
                      </p>
                    </div>
                    
                    {/* 재검색 단계별 표시 */}
                    {message.id === 're-search-progress' && message.totalSteps === 3 && (
                      <div className="space-y-2 mb-3 text-xs">
                        <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <Icon icon={(message.currentStep || 0) > 1 ? 'mdi:check-circle' : (message.currentStep || 0) === 1 ? 'mdi:loading' : 'mdi:circle-outline'} className={`w-4 h-4 ${(message.currentStep || 0) === 1 ? 'animate-spin' : ''}`} />
                          <span>{t('agent.reSearchSteps.1')} {(message.currentStep || 0) === 1 && '⏳'}</span>
                        </div>
                        <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <Icon icon={(message.currentStep || 0) > 2 ? 'mdi:check-circle' : (message.currentStep || 0) === 2 ? 'mdi:loading' : 'mdi:circle-outline'} className={`w-4 h-4 ${(message.currentStep || 0) === 2 ? 'animate-spin' : ''}`} />
                          <span>{t('agent.reSearchSteps.2')} {(message.currentStep || 0) === 2 && '⏳'}</span>
                        </div>
                        <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <Icon icon={(message.currentStep || 0) > 3 ? 'mdi:check-circle' : (message.currentStep || 0) === 3 ? 'mdi:loading' : 'mdi:circle-outline'} className={`w-4 h-4 ${(message.currentStep || 0) === 3 ? 'animate-spin' : ''}`} />
                          <span>{t('agent.reSearchSteps.3')} {(message.currentStep || 0) === 3 && '⏳'}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* 고속검색 단계별 표시 */}
                    {message.id === 'fast-search-progress' && message.totalSteps === 5 && (
                      <div className="space-y-2 mb-3 text-xs">
                        <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <Icon icon={(message.currentStep || 0) > 1 ? 'mdi:check-circle' : 'mdi:circle-outline'} className="w-4 h-4" />
                          <span>{t('agent.fastSearchSteps.1')} {(message.currentStep || 0) === 1 && '✅'}</span>
                        </div>
                        <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <Icon icon={(message.currentStep || 0) > 2 ? 'mdi:check-circle' : (message.currentStep || 0) === 2 ? 'mdi:loading' : 'mdi:circle-outline'} className={`w-4 h-4 ${(message.currentStep || 0) === 2 ? 'animate-spin' : ''}`} />
                          <span>{t('agent.fastSearchSteps.2')} {(message.currentStep || 0) === 2 && '✅'}</span>
                        </div>
                        <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <Icon icon={(message.currentStep || 0) > 3 ? 'mdi:check-circle' : (message.currentStep || 0) === 3 ? 'mdi:loading' : 'mdi:circle-outline'} className={`w-4 h-4 ${(message.currentStep || 0) === 3 ? 'animate-spin' : ''}`} />
                          <span>{t('agent.fastSearchSteps.3')} {(message.currentStep || 0) === 3 && '⏳'}</span>
                        </div>
                        <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 4 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <Icon icon={(message.currentStep || 0) > 4 ? 'mdi:check-circle' : (message.currentStep || 0) === 4 ? 'mdi:loading' : 'mdi:circle-outline'} className={`w-4 h-4 ${(message.currentStep || 0) === 4 ? 'animate-spin' : ''}`} />
                          <span>{t('agent.fastSearchSteps.4')} {(message.currentStep || 0) === 4 && '…'}</span>
                        </div>
                        <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 5 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <Icon icon={(message.currentStep || 0) > 5 ? 'mdi:check-circle' : (message.currentStep || 0) === 5 ? 'mdi:loading' : 'mdi:circle-outline'} className={`w-4 h-4 ${(message.currentStep || 0) === 5 ? 'animate-spin' : ''}`} />
                          <span>{t('agent.fastSearchSteps.5')} {(message.currentStep || 0) === 5 && '…'}</span>
                        </div>
                        
                        {/* 5단계에서 카메라 카운트 표시 */}
                        {(message.currentStep || 0) === 5 && cameraCount > 0 && (
                          <div className="mt-2 text-blue-600 font-medium">
                            {t('agent.searchingCandidates', { count: cameraCount })}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* 객체 추적 단계별 표시 */}
                    {message.id !== 'fast-search-progress' && message.totalSteps === 5 && (
                      <div className="space-y-2 mb-3 text-xs">
                        <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <Icon icon={(message.currentStep || 0) > 1 ? 'mdi:check-circle' : 'mdi:circle-outline'} className="w-4 h-4" />
                          <span>{t('agent.objectTrackingSteps.1')} {(message.currentStep || 0) === 1 && '✅'}</span>
                        </div>
                        <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <Icon icon={(message.currentStep || 0) > 2 ? 'mdi:check-circle' : (message.currentStep || 0) === 2 ? 'mdi:loading' : 'mdi:circle-outline'} className={`w-4 h-4 ${(message.currentStep || 0) === 2 ? 'animate-spin' : ''}`} />
                          <span>{t('agent.objectTrackingSteps.2')} {(message.currentStep || 0) === 2 && '⏳'}</span>
                        </div>
                        <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <Icon icon={(message.currentStep || 0) > 3 ? 'mdi:check-circle' : (message.currentStep || 0) === 3 ? 'mdi:loading' : 'mdi:circle-outline'} className={`w-4 h-4 ${(message.currentStep || 0) === 3 ? 'animate-spin' : ''}`} />
                          <span>{t('agent.objectTrackingSteps.3')} {(message.currentStep || 0) === 3 && '…'}</span>
                        </div>
                        <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 4 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <Icon icon={(message.currentStep || 0) > 4 ? 'mdi:check-circle' : (message.currentStep || 0) === 4 ? 'mdi:loading' : 'mdi:circle-outline'} className={`w-4 h-4 ${(message.currentStep || 0) === 4 ? 'animate-spin' : ''}`} />
                          <span>{t('agent.objectTrackingSteps.4')} {(message.currentStep || 0) === 4 && '…'}</span>
                        </div>
                        <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 5 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <Icon icon={(message.currentStep || 0) > 5 ? 'mdi:check-circle' : (message.currentStep || 0) === 5 ? 'mdi:loading' : 'mdi:circle-outline'} className={`w-4 h-4 ${(message.currentStep || 0) === 5 ? 'animate-spin' : ''}`} />
                          <span>{t('agent.objectTrackingSteps.5')} {(message.currentStep || 0) === 5 && '…'}</span>
                        </div>
                      </div>
                    )}
                    
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
                    <div className="text-xs text-gray-500 mt-2">
                      {message.currentStep}/{message.totalSteps}
                    </div>

                    {/* 분석 결과 표시 (프로그래스 완료 시) */}
                    {message.progress && message.progress >= 1 && message.analysisResult && (
                      <div className="mt-4 space-y-4 pt-4 border-t border-gray-300">
                        {/* 한 줄 결론 */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4" style={{ borderWidth: '1px' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Icon icon="mdi:lightbulb-on" className="w-4 h-4 text-blue-600" />
                            <h4 className="text-gray-900 font-semibold text-sm">{t('captureList.analysis.conclusionTitle')}</h4>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: message.analysisResult.conclusion.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        </div>

                        {/* 사건 요약 */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4" style={{ borderWidth: '1px' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Icon icon="mdi:file-document-outline" className="w-4 h-4 text-blue-600" />
                            <h4 className="text-gray-900 font-semibold text-sm">{t('captureList.analysis.summaryTitle')}</h4>
                          </div>
                          <div className="space-y-1.5 text-sm">
                            <div className="text-gray-700">
                              <span className="text-gray-500">- {t('agent.summary.eventTime')}:</span> {message.analysisResult.summary.time}
                            </div>
                            <div className="text-gray-700">
                              <span className="text-gray-500">- {t('captureList.analysis.location')}:</span> {message.analysisResult.summary.location}
                            </div>
                            <div className="text-gray-700">
                              <span className="text-gray-500">- {t('agent.summary.personnel')}:</span> {message.analysisResult.summary.personnel}
                            </div>
                            <div className="text-gray-700">
                              <span className="text-gray-500">- {t('agent.summary.progressStatus')}:</span> {message.analysisResult.summary.status}
                            </div>
                            <div className="text-gray-700">
                              <span className="text-gray-500">- {t('captureList.analysis.riskLevel')}:</span> <span dangerouslySetInnerHTML={{ __html: message.analysisResult.summary.riskLevel.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            </div>
                          </div>
                        </div>

                        {/* 근거 */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4" style={{ borderWidth: '1px' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Icon icon="mdi:clipboard-text" className="w-4 h-4 text-blue-600" />
                            <h4 className="text-gray-900 font-semibold text-sm">{t('agent.summary.evidenceTitle')}</h4>
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
                        <div className="bg-white border border-gray-200 rounded-lg p-4" style={{ borderWidth: '1px' }}>
                          <div className="flex items-center gap-2 mb-3">
                            <Icon icon="mdi:shield-check" className="w-4 h-4 text-blue-600" />
                            <h4 className="text-gray-900 font-semibold text-sm">{t('agent.summary.recommendationsTitle')}</h4>
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
                                  style={{ borderWidth: '1px' }}
                                >
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
                    {!isExpanded && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-900 font-semibold text-sm">CUVIA Agent</span>
                      </div>
                    )}
                    <div className={`${isExpanded ? 'max-w-[70%] px-4 py-2 rounded-2xl border bg-gray-100 text-gray-900 border-gray-200' : 'rounded-xl border border-gray-200 bg-gray-50 p-4'}`} style={isExpanded ? { borderWidth: '1px' } : {}}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                        {message.id === 'welcome-msg'
                          ? t('agent.welcome', { count: listCardCount })
                          : (message.isTyping ? message.displayedContent : message.content)}
                        {message.isTyping && <span className="inline-block w-1 h-4 bg-gray-700 ml-0.5 animate-pulse" />}
                      </p>
                      {!message.isTyping && message.suggestions && message.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {message.suggestions.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => onSuggestionClick?.(s)}
                              className="text-xs px-2.5 py-1 rounded-full border border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-400 transition-colors cursor-pointer"
                              tabIndex={0}
                              aria-label={t('agent.applyConditionAria', { suggestion: s })}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className={`text-xs text-gray-500 ${isExpanded ? 'mt-1' : 'mt-2'}`}>
                        {message.timestamp}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          {message.role === 'user' && (
            <div className="flex justify-end">
              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  isExpanded
                    ? 'bg-gradient-to-br from-[#ff8566] to-[#ff8566] text-white border-transparent'
                    : ''
                }`}
                style={
                  !isExpanded
                    ? {
                        background: 'rgba(255, 133, 102, 0.2)',
                        color: '#1f2937',
                      }
                    : {}
                }
              >
                <p>{message.content}</p>
                <div className={`text-xs ${isExpanded ? 'text-orange-100' : 'text-gray-600'} mt-1`}>
                  {message.timestamp}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
      {isResponding && (
        <div className={isExpanded ? 'flex items-center gap-1 text-xs text-gray-500' : 'flex items-start gap-3'}>
          <div className={`flex items-center gap-1 ${!isExpanded ? 'pt-2' : ''}`}>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      )}
    </>
  );
};

// 입력 폼 공통 컴포넌트
interface ChatInputFormProps {
  chatInput: string;
  setChatInput: (value: string) => void;
  handleSendMessage: () => void;
  isResponding: boolean;
  onSkipResponse: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  inputKey: number;
  ignoreNextChangeRef: React.MutableRefObject<boolean>;
  isExpanded: boolean;
  placeholder?: string;
}

const ChatInputForm: React.FC<ChatInputFormProps> = ({
  chatInput,
  setChatInput,
  handleSendMessage,
  isResponding,
  onSkipResponse,
  textareaRef,
  inputKey,
  ignoreNextChangeRef,
  isExpanded,
  placeholder,
}) => {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t('agent.placeholder.fastSearch');
  return (
    <div className={isExpanded ? 'bg-white flex-shrink-0' : 'p-4 border-t border-gray-200 flex-shrink-0 bg-white'}>
      <div className={isExpanded ? 'p-4' : ''}>
        <div className="relative flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-500 transition-colors">
          {isExpanded && (
            <button
              onClick={() => {
                // 도구 팝업 (나중에 구현)
              }}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors self-center"
              aria-label={t('agent.tools.open')}
            >
              <Icon icon="mdi:plus" className="w-5 h-5" />
            </button>
          )}
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
            placeholder={resolvedPlaceholder}
            className={`flex-1 bg-transparent border-none text-gray-900 text-sm placeholder-gray-500 focus:outline-none resize-none ${
              isExpanded ? 'overflow-hidden self-center' : 'overflow-y-auto'
            }`}
            style={{
              minHeight: '24px',
              maxHeight: isExpanded ? '96px' : '72px',
              lineHeight: '24px',
            }}
            rows={1}
          />
          {isResponding ? (
            <button
              type="button"
              onClick={onSkipResponse}
              className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 ${
                isExpanded ? 'self-center' : ''
              }`}
              style={{ background: AGENT_GRADIENT }}
              aria-label={t('agent.cancelResponse')}
            >
              <Icon icon="mdi:close" className="w-5 h-5 text-white" />
            </button>
          ) : (
            <button
              id="agent-chat-send-button"
              type="button"
              onClick={handleSendMessage}
              disabled={!chatInput.trim()}
              className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 ${
                isExpanded ? 'self-center' : ''
              }`}
              style={{ background: AGENT_GRADIENT }}
              aria-label={t('agent.send')}
            >
              <img
                src="/simbol.svg"
                alt={t('agent.send')}
                className="w-5 h-5"
                style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }}
              />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          <span className="font-semibold">{isExpanded ? 'CUVIA Agent' : 'CUVIA Link'}</span>{' '}{t('agent.disclaimer')}
        </p>
      </div>
    </div>
  );
};

const AIAgentPopup: React.FC<AIAgentPopupProps> = ({ 
  isOpen, 
  onClose, 
  hideControls = false, 
  position: positionOverride, 
  listCardCount = 0, 
  onSearchRequest,
  onRemoveRequest,
  onRestoreRequest,
  maxHeight: maxHeightProp, 
  reSearchResult, 
  isObjectTracking = false, 
  onObjectTrackingStart, 
  objectTrackingCompleted = false, 
  showFastSearchProgress = false, 
  onFastSearchComplete, 
  onReSearchStart, 
  onReSearchComplete,
  captureNotificationMessage = '',
}) => {
  const { t } = useTranslation();
  const [chatInput, setChatInput] = useState('');
  const [inputKey, setInputKey] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 객체 추적 상태일 때 프로그래스 메시지 추가
  useEffect(() => {
    if (isObjectTracking) {
      setChatInput('');
      
      // 이미 프로그래스 메시지가 있는지 확인
      setMessages((prev) => {
        const hasObjectTrackingProgress = prev.some(msg => 
          msg.type === 'analyzing' && msg.totalSteps === 5
        );
        
        if (hasObjectTrackingProgress) {
          return prev;
        }
        
        // 객체 추적 프로그래스 메시지 추가
        const progressMessage: ChatMessage = {
          id: 'object-tracking-progress',
          role: 'assistant',
          content: t('agent.objectTracking.startMessage'),
          timestamp: new Date().toLocaleTimeString(
            i18nInstance.language?.startsWith('en') ? 'en-US' : 'ko-KR',
            { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !i18nInstance.language?.startsWith('en') }
          ),
          type: 'analyzing',
          progress: 0,
          currentStep: 1,
          totalSteps: 5,
        };
        
        return [...prev, progressMessage];
      });
      
      // 프로그래스 애니메이션 시작 (지도 애니메이션과 동기화)
      // 각 단계: 1번(0s) → 2번(2.1s) → 3번(4.1s) → 4번(6.1s) → 줌아웃(8.1s)
      const progressInterval = setInterval(() => {
        setMessages((prev) => {
          const updated = prev.map((msg) => {
            if (msg.id === 'object-tracking-progress' && msg.type === 'analyzing') {
              const newProgress = Math.min((msg.progress || 0) + 0.01, 1);
              let newStep = msg.currentStep || 1;
              
              // 지도 애니메이션과 동기화된 단계 진행
              const progressPercent = newProgress * 100;
              if (progressPercent >= 20 && newStep < 2) newStep = 2;
              if (progressPercent >= 40 && newStep < 3) newStep = 3;
              if (progressPercent >= 60 && newStep < 4) newStep = 4;
              if (progressPercent >= 80 && newStep < 5) newStep = 5;
              
              return { ...msg, progress: newProgress, currentStep: newStep };
            }
            return msg;
          });
          return updated;
        });
      }, 100);
      
      // 프로그래스는 onObjectTrackingComplete에서 완료 처리
      return () => {
        clearInterval(progressInterval);
      };
    }
  }, [isObjectTracking]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString(
        i18nInstance.language?.startsWith('en') ? 'en-US' : 'ko-KR',
        { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !i18nInstance.language?.startsWith('en') }
      ),
    },
  ]);
  const [isResponding, setIsResponding] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const ignoreNextChangeRef = useRef(false);
  const lastReSearchResultRef = useRef<{ excludedAttributes: string[]; deletedCount: number } | null>(null);
  const lastCaptureNotificationRef = useRef<string>('');
  const onFastSearchCompleteRef = useRef(onFastSearchComplete);
  onFastSearchCompleteRef.current = onFastSearchComplete;
  
  // 애니메이션 interval refs
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 고속검색 프로그래스 상태
  const [fastSearchStep, setFastSearchStep] = useState<number>(0);
  const [fastSearchProgress, setFastSearchProgress] = useState<number>(0);
  const [cameraCount, setCameraCount] = useState<number>(0);
  
  // 재검색 프로그래스 상태
  const [isReSearching, setIsReSearching] = useState<boolean>(false);

  // 답변 스킵 핸들러 (답변 취소)
  const handleSkipResponse = () => {
    // 모든 interval/timeout 정리
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (progressTimeoutRef.current) {
      clearTimeout(progressTimeoutRef.current);
      progressTimeoutRef.current = null;
    }
    
    // 타이핑 중이거나 프로그래스바 표시 중인 메시지 제거
    setMessages((prev) =>
      prev.filter((msg) => {
        // 타이핑 중인 메시지 제거
        if (msg.isTyping) return false;
        // 프로그래스바 메시지 제거
        if (msg.type === 'analyzing') return false;
        // 응답 대기 중인 메시지 제거 (마지막 assistant 메시지가 아직 완료되지 않은 경우)
        if (msg.role === 'assistant' && msg.content === '') return false;
        return true;
      })
    );
    
    setIsResponding(false);
  };

  // 컴포넌트 언마운트 시 모든 interval 정리
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (progressTimeoutRef.current) clearTimeout(progressTimeoutRef.current);
    };
  }, []);

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
      // 프로그래스 메시지 업데이트 시에는 스크롤하지 않음 (화면 튐 방지)
      const hasProgressUpdate = messages.some(msg => 
        msg.type === 'analyzing' && (msg.progress || 0) > 0 && (msg.progress || 0) < 1
      );
      
      if (!hasProgressUpdate) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  }, [messages, isResponding]);

  useEffect(() => {
    if (inputKey > 0) {
      textareaRef.current?.focus();
    }
  }, [inputKey]);

  // 포착 알림 메시지 처리
  useEffect(() => {
    if (!captureNotificationMessage) {
      lastCaptureNotificationRef.current = '';
      return;
    }
    if (captureNotificationMessage === lastCaptureNotificationRef.current) return;
    lastCaptureNotificationRef.current = captureNotificationMessage;
    
    const captureMessage: ChatMessage = {
      id: `capture-notification-${Date.now()}`,
      role: 'assistant',
      content: captureNotificationMessage,
      timestamp: new Date().toLocaleTimeString(
        i18nInstance.language?.startsWith('en') ? 'en-US' : 'ko-KR',
        { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !i18nInstance.language?.startsWith('en') }
      ),
      type: 'normal',
      isTyping: true,
      displayedContent: '',
    };
    
    setMessages((prev) => [...prev, captureMessage]);
    
    // 타이핑 애니메이션
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      currentIndex++;
      
      if (currentIndex <= captureNotificationMessage.length) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === captureMessage.id
              ? { ...msg, displayedContent: captureNotificationMessage.substring(0, currentIndex) }
              : msg
          )
        );
      } else {
        // 타이핑 완료
        clearInterval(typingInterval);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === captureMessage.id
              ? { ...msg, isTyping: false, displayedContent: captureNotificationMessage }
              : msg
          )
        );
      }
    }, 30);
    
    return () => clearInterval(typingInterval);
  }, [captureNotificationMessage]);

  // 고속검색 프로그래스 애니메이션
  useEffect(() => {
    if (!showFastSearchProgress) {
      setFastSearchStep(0);
      setFastSearchProgress(0);
      setCameraCount(0);
      return;
    }

    // 이미 프로그래스 메시지가 있으면 추가하지 않음
    setMessages((prev) => {
      const hasProgress = prev.some(msg => msg.id === 'fast-search-progress');
      if (hasProgress) {
        return prev;
      }
      
      // 고속검색 프로그래스 메시지 추가
      const progressMessage: ChatMessage = {
        id: 'fast-search-progress',
        role: 'assistant',
        content: t('agent.fastSearch.starting'),
        timestamp: new Date().toLocaleTimeString(
          i18nInstance.language?.startsWith('en') ? 'en-US' : 'ko-KR',
          { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !i18nInstance.language?.startsWith('en') }
        ),
        type: 'analyzing',
        progress: 0,
        currentStep: 1,
        totalSteps: 5,
      };
      
      // welcome 메시지가 있으면 제거하고, 없으면 기존 메시지 유지
      const hasWelcome = prev.some(msg => msg.id === 'welcome-msg');
      if (hasWelcome) {
        const withoutWelcome = prev.filter(msg => msg.id !== 'welcome-msg');
        return [...withoutWelcome, progressMessage];
      } else {
        return [...prev, progressMessage];
      }
    });

    // 단계별 진행 (각 단계 400ms)
    const stepDuration = 400;
    let currentStepIndex = 0;
    let stepInterval: ReturnType<typeof setInterval> | null = null;
    let countInterval: ReturnType<typeof setInterval> | null = null;
    let countTimeout: ReturnType<typeof setTimeout> | null = null;
    let completeTimeout: ReturnType<typeof setTimeout> | null = null;
    
    stepInterval = setInterval(() => {
      currentStepIndex++;
      setFastSearchStep(currentStepIndex);
      setFastSearchProgress(currentStepIndex / 5);
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === 'fast-search-progress'
            ? { ...msg, currentStep: currentStepIndex + 1, progress: currentStepIndex / 5 }
            : msg
        )
      );
      
      // 4단계까지 완료 후 카메라 카운트 시작
      if (currentStepIndex >= 4) {
        if (stepInterval) clearInterval(stepInterval);
        
        // 5단계 (카메라 카운트)
        countTimeout = setTimeout(() => {
          let count = 0;
          countInterval = setInterval(() => {
            count += Math.floor(Math.random() * 2) + 1;
            if (count >= 10) {
              count = 10;
              if (countInterval) clearInterval(countInterval);
              setCameraCount(count);
              
              // 완료 후 0.5초 대기 후 메시지 제거 및 완료 메시지 추가
              completeTimeout = setTimeout(() => {
                setMessages((prev) => {
                  // 프로그래스 메시지 제거
                  const withoutProgress = prev.filter((msg) => msg.id !== 'fast-search-progress');
                  
                  // welcome 메시지 추가 (고속검색 결과 안내)
                  const welcomeMessage: ChatMessage = {
                    id: 'welcome-msg',
                    role: 'assistant',
                    content: '',
                    timestamp: new Date().toLocaleTimeString(
                      i18nInstance.language?.startsWith('en') ? 'en-US' : 'ko-KR',
                      { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !i18nInstance.language?.startsWith('en') }
                    ),
                  };
                  
                  return [...withoutProgress, welcomeMessage];
                });
                
                const cb = onFastSearchCompleteRef.current;
                if (cb) {
                  cb();
                } else {
                  console.warn('[AIAgentPopup] onFastSearchComplete가 없음!');
                }
              }, 500);
            } else {
              setCameraCount(count);
            }
          }, 60);
        }, 150);
      }
    }, stepDuration);

    return () => {
      if (stepInterval) clearInterval(stepInterval);
      if (countInterval) clearInterval(countInterval);
      if (countTimeout) clearTimeout(countTimeout);
      if (completeTimeout) clearTimeout(completeTimeout);
    };
  }, [showFastSearchProgress]);

  // 객체 추적 완료 시 결과 메시지 추가 (지도 2D 전환 완료 시)
  const lastObjectTrackingCompletedRef = useRef<boolean>(false);
  useEffect(() => {
    if (objectTrackingCompleted && !lastObjectTrackingCompletedRef.current) {
      lastObjectTrackingCompletedRef.current = true;
      
      // 프로그래스 메시지 제거하고 완료 메시지 추가 (타이핑 애니메이션)
      setMessages((prev) => {
        const withoutProgress = prev.filter(msg => msg.id !== 'object-tracking-progress');
        
        const completionMessage: ChatMessage = {
          id: `assistant-complete-${Date.now()}`,
          role: 'assistant',
          content: t('agent.objectTracking.completeMessage'),
          timestamp: new Date().toLocaleTimeString(
            i18nInstance.language?.startsWith('en') ? 'en-US' : 'ko-KR',
            { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !i18nInstance.language?.startsWith('en') }
          ),
          type: 'normal',
          isTyping: true,
          displayedContent: '',
        };
        
        return [...withoutProgress, completionMessage];
      });
      
      // 타이핑 애니메이션
      const fullContent = t('agent.objectTracking.completeMessage');
      let currentIndex = 0;
      
      const typingInterval = setInterval(() => {
        currentIndex++;
        
        if (currentIndex <= fullContent.length) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id.startsWith('assistant-complete-')
                ? { ...msg, displayedContent: fullContent.substring(0, currentIndex) }
                : msg
            )
          );
        } else {
          // 타이핑 완료
          clearInterval(typingInterval);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id.startsWith('assistant-complete-')
                ? { ...msg, isTyping: false, displayedContent: fullContent }
                : msg
            )
          );
        }
      }, 30);
    }
    
    // 객체 추적이 종료되면 플래그 리셋
    if (!isObjectTracking) {
      lastObjectTrackingCompletedRef.current = false;
    }
  }, [objectTrackingCompleted, isObjectTracking]);

  // 재검색 완료 후 결과 메시지 자동 추가 (타이핑 애니메이션)
  useEffect(() => {
    if (reSearchResult && reSearchResult !== lastReSearchResultRef.current) {
      lastReSearchResultRef.current = reSearchResult;
      const { excludedAttributes, deletedCount, visibleCount } = reSearchResult;
      const isResultReSearchButton = excludedAttributes.some((a) => a.includes('대표 후보') || a.toLowerCase().includes('top candidate'));
      const isRestore = deletedCount < 0;
      const isRestoreAttr = excludedAttributes.some((a) => a.includes('복원') || a.toLowerCase().includes('restored'));

      const summarizeAttrs = (attrs: string[], max = 2): string => {
        if (attrs.length <= max) return attrs.join(', ');
        return t('agent.attributeOverflow', { list: attrs.slice(0, max).join(', '), more: attrs.length - max });
      };

      let fullContent: string;
      if (isResultReSearchButton) {
        fullContent = t('agent.reSearchResult.byCandidate');
      } else if (isRestore || isRestoreAttr) {
        const names = excludedAttributes.map((a) => a.replace(/ 복원$/, '').replace(/^Restored /i, ''));
        fullContent = t('agent.reSearchResult.restored', { names: summarizeAttrs(names) });
      } else {
        const count = visibleCount ?? Math.max(0, (listCardCount ?? 0) - deletedCount);
        fullContent = t('agent.reSearchResult.applied', { count });
      }
      
      const messageId = `assistant-research-${Date.now()}`;
      const resultMessage: ChatMessage = {
        id: messageId,
        role: 'assistant',
        content: fullContent,
        timestamp: new Date().toLocaleTimeString(
          i18nInstance.language?.startsWith('en') ? 'en-US' : 'ko-KR',
          { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !i18nInstance.language?.startsWith('en') }
        ),
        type: 'normal',
        isTyping: true,
        displayedContent: '',
      };
      
      setMessages((prev) => [...prev, resultMessage]);
      
      // 타이핑 애니메이션
      let currentIndex = 0;
      
      const typingInterval = setInterval(() => {
        currentIndex++;
        
        if (currentIndex <= fullContent.length) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? { ...msg, displayedContent: fullContent.substring(0, currentIndex) }
                : msg
            )
          );
        } else {
          // 타이핑 완료
          clearInterval(typingInterval);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? { ...msg, isTyping: false, displayedContent: fullContent }
                : msg
            )
          );
        }
      }, 30);
    }
  }, [reSearchResult]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = 24;
    const maxHeight = lineHeight * 3;
    const newHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${newHeight}px`;
  }, [chatInput, inputKey]);

  const isObjectTrackingMessage = (text: string): boolean => {
    // Object tracking trigger detection: keep Korean keywords for backward compatibility,
    // and also accept English equivalents for users who type in English.
    const lower = text.toLowerCase();
    return (
      text.includes('객체 추적을 시작해 주세요') ||
      text.includes('객체 추적') ||
      lower.includes('start object tracking') ||
      lower.includes('object tracking')
    );
  };

  const generateAssistantReply = (prompt: string): ChatMessage => {
    if (isObjectTrackingMessage(prompt)) {
      return {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '마지막 포착 이후 이동 경로를 기준으로 다음 포착 가능 CCTV를 예측하겠습니다.',
        timestamp: new Date().toLocaleTimeString(
          i18nInstance.language?.startsWith('en') ? 'en-US' : 'ko-KR',
          { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !i18nInstance.language?.startsWith('en') }
        ),
        type: 'analyzing',
        progress: 0,
        currentStep: 1,
        totalSteps: 5,
      };
    }
    const similar = findSimilarAttributes(prompt);
    const content = similar.length > 0
      ? t('agent.unknownPromptWithSuggestions', { prompt })
      : t('agent.unknownPrompt', { prompt });
    return {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date().toLocaleTimeString(
        i18nInstance.language?.startsWith('en') ? 'en-US' : 'ko-KR',
        { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !i18nInstance.language?.startsWith('en') }
      ),
      type: 'normal',
      suggestions: similar.length > 0 ? similar : undefined,
    };
  };

  const showNoMatchMessage = useCallback((text: string) => {
    const similar = findSimilarAttributes(text);
    const fullContent = similar.length > 0
      ? t('agent.unknownPromptWithSuggestions', { prompt: text })
      : t('agent.unknownPrompt', { prompt: text });

    setIsResponding(true);
    setTimeout(() => {
      const msgId = `assistant-${Date.now()}`;
      const errorMessage: ChatMessage = {
        id: msgId,
        role: 'assistant',
        content: fullContent,
        timestamp: new Date().toLocaleTimeString(
          i18nInstance.language?.startsWith('en') ? 'en-US' : 'ko-KR',
          { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !i18nInstance.language?.startsWith('en') }
        ),
        type: 'normal',
        isTyping: true,
        displayedContent: '',
        suggestions: similar.length > 0 ? similar : undefined,
      };
      setMessages((prev) => [...prev, errorMessage]);

      let idx = 0;
      const typingInterval = setInterval(() => {
        idx++;
        if (idx <= fullContent.length) {
          setMessages((prev) =>
            prev.map((m) => (m.id === msgId ? { ...m, displayedContent: fullContent.substring(0, idx) } : m))
          );
        } else {
          clearInterval(typingInterval);
          typingIntervalRef.current = null;
          setIsResponding(false);
          setMessages((prev) =>
            prev.map((m) => (m.id === msgId ? { ...m, isTyping: false, displayedContent: fullContent } : m))
          );
        }
      }, 30);
      typingIntervalRef.current = typingInterval;
    }, 700);
  }, []);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setChatInput(t('agent.showOnlyTemplate', { suggestion }));
  }, []);

  const showReSearchProgress = useCallback(() => {
    setIsReSearching(true);
    setIsResponding(true);
    onReSearchStart?.();

    setTimeout(() => {
      const progressMessage: ChatMessage = {
        id: 're-search-progress',
        role: 'assistant',
        content: t('agent.reSearchProgress'),
        timestamp: new Date().toLocaleTimeString(
          i18nInstance.language?.startsWith('en') ? 'en-US' : 'ko-KR',
          { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !i18nInstance.language?.startsWith('en') }
        ),
        type: 'analyzing',
        progress: 0,
        currentStep: 1,
        totalSteps: 3,
      };
      setMessages((prev) => [...prev, progressMessage]);

      let step = 0;
      const progressInterval = setInterval(() => {
        step++;
        const progress = step / 3;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === 're-search-progress'
              ? { ...msg, currentStep: step + 1, progress }
              : msg
          )
        );

        if (step >= 3) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setMessages((prev) => prev.filter((msg) => msg.id !== 're-search-progress'));
            setIsReSearching(false);
            setIsResponding(false);
            onReSearchComplete?.();
          }, 500);
        }
      }, 500);
    }, 700);
  }, [onReSearchStart, onReSearchComplete]);

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

    if (isObjectTrackingMessage(text) && onObjectTrackingStart) {
      onObjectTrackingStart();
      return;
    }

    const { intent, attributes } = classifyMessage(text);

    switch (intent) {
      case 'TRACK': {
        onObjectTrackingStart?.();
        return;
      }
      case 'SEARCH': {
        if (attributes.length === 0 || !onSearchRequest) {
          showNoMatchMessage(text);
        } else {
          onSearchRequest({ rawMessage: text, attributes });
          showReSearchProgress();
        }
        return;
      }
      case 'REMOVE': {
        if (attributes.length === 0 || !onRemoveRequest) {
          showNoMatchMessage(text);
        } else {
          onRemoveRequest({ rawMessage: text, attributes });
          showReSearchProgress();
        }
        return;
      }
      case 'RESTORE': {
        if (attributes.length === 0 || !onRestoreRequest) {
          showNoMatchMessage(text);
        } else {
          onRestoreRequest({ rawMessage: text, attributes });
          showReSearchProgress();
        }
        return;
      }
      default:
        break;
    }

    // 로딩 표시 (프로그래스바가 없는 일반 답변에만 적용)
    setIsResponding(true);

    setTimeout(() => {
      const assistantMessage = generateAssistantReply(text);
      
      // 프로그래스바가 있는 경우 (analyzing 타입)
      if (assistantMessage.type === 'analyzing') {
      setMessages((prev) => [...prev, assistantMessage]);
      setIsResponding(false);

        const isObjectTracking = assistantMessage.totalSteps === 5;
        const stepDuration = isObjectTracking ? 1000 : 1000; // 각 단계당 1초
        const totalDuration = isObjectTracking ? 5000 : 5000;
        
        const progressInterval = setInterval(() => {
          setMessages((prev) => {
            const updated = prev.map((msg) => {
              if (msg.id === assistantMessage.id && msg.type === 'analyzing') {
                const newProgress = Math.min((msg.progress || 0) + 0.02, 1);
                let newStep = msg.currentStep || 1;
                
                // 객체 추적일 경우 단계별 진행
                if (isObjectTracking && msg.totalSteps === 5) {
                  const progressPercent = newProgress * 100;
                  if (progressPercent >= 20 && newStep < 2) newStep = 2;
                  if (progressPercent >= 40 && newStep < 3) newStep = 3;
                  if (progressPercent >= 60 && newStep < 4) newStep = 4;
                  if (progressPercent >= 80 && newStep < 5) newStep = 5;
                }
                
                return { ...msg, progress: newProgress, currentStep: newStep };
              }
              return msg;
            });
            return updated;
          });
        }, 100);
        progressIntervalRef.current = progressInterval;

        const progressTimeout = setTimeout(() => {
          clearInterval(progressInterval);
          progressIntervalRef.current = null;
          
          // 객체 추적 완료 시 프로그래스바 제거하고 완료 메시지 추가 (타이핑 애니메이션)
          if (isObjectTracking) {
            setTimeout(() => {
              setMessages((prev) => {
                // 프로그래스바 메시지 제거
                const withoutProgress = prev.filter(msg => msg.id !== assistantMessage.id);
                
                // 완료 메시지 추가 (타이핑 시작)
                const completionMessage: ChatMessage = {
                  id: `assistant-complete-${Date.now()}`,
                  role: 'assistant',
                  content: t('agent.objectTracking.completeMessage'),
                  timestamp: new Date().toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  }),
                  type: 'normal',
                  isTyping: true,
                  displayedContent: '',
                };
                
                return [...withoutProgress, completionMessage];
              });
              
              // 타이핑 애니메이션
              const fullContent = t('agent.objectTracking.completeMessage');
              let currentIndex = 0;
              
              const typingInterval = setInterval(() => {
                currentIndex++;
                
                if (currentIndex <= fullContent.length) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id.startsWith('assistant-complete-')
                        ? { ...msg, displayedContent: fullContent.substring(0, currentIndex) }
                        : msg
                    )
                  );
                } else {
                  // 타이핑 완료
                  clearInterval(typingInterval);
                  typingIntervalRef.current = null;
                  setIsResponding(false);
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id.startsWith('assistant-complete-')
                        ? { ...msg, isTyping: false, displayedContent: fullContent }
                        : msg
                    )
                  );
                }
              }, 30);
              typingIntervalRef.current = typingInterval;
            }, 500);
          }
        }, totalDuration);
        progressTimeoutRef.current = progressTimeout;
      } else {
        // 프로그래스바가 없는 일반 답변: 로딩 후 타이핑 애니메이션
        setTimeout(() => {
          setIsResponding(false);
          
          // 타이핑 애니메이션 시작
          const typingMessage: ChatMessage = {
            ...assistantMessage,
            isTyping: true,
            displayedContent: '',
          };
          
          setMessages((prev) => [...prev, typingMessage]);
          
          // 타이핑 애니메이션 (한 글자씩)
          const fullContent = assistantMessage.content;
          let currentIndex = 0;
          
          const typingInterval = setInterval(() => {
            currentIndex++;
            
            if (currentIndex <= fullContent.length) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessage.id
                    ? { ...msg, displayedContent: fullContent.substring(0, currentIndex) }
                    : msg
                )
              );
            } else {
              // 타이핑 완료
              clearInterval(typingInterval);
              typingIntervalRef.current = null;
              setIsResponding(false);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessage.id
                    ? { ...msg, isTyping: false, displayedContent: fullContent }
                    : msg
                )
              );
            }
          }, 30); // 30ms마다 한 글자씩
          typingIntervalRef.current = typingInterval;
        }, 800); // 800ms 로딩 시간
      }
    }, 300); // 초기 딜레이 300ms
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
        <div
          className="fixed inset-y-0 right-0 z-[2000]"
          onClick={(e) => e.stopPropagation()}
          style={{ zIndex: 2000 }}
        >
          <div
            className="flex flex-col bg-white border-l border-[#31353a] h-full w-[30rem] overflow-hidden"
            style={{ borderLeftWidth: '1px' }}
          >
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
                aria-label={t('agent.collapse')}
              >
                <Icon icon="mdi:window-restore" className="w-5 h-5" />
              </button>
            </div>

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 p-3 pl-10 pr-9">
              <div className="space-y-3">
                <MessageList
                  messages={messages}
                  isResponding={isResponding}
                  listCardCount={listCardCount}
                  cameraCount={cameraCount}
                  isExpanded={true}
                  onSuggestionClick={handleSuggestionClick}
                />
              </div>

              <div ref={bottomRef} className="h-[75px]" />
            </div>

            <ChatInputForm
              chatInput={chatInput}
              setChatInput={setChatInput}
              handleSendMessage={handleSendMessage}
              isResponding={isResponding}
              onSkipResponse={handleSkipResponse}
              textareaRef={textareaRef}
              inputKey={inputKey}
              ignoreNextChangeRef={ignoreNextChangeRef}
              isExpanded={true}
              placeholder={isObjectTracking ? t('agent.placeholder.objectTracking') : t('agent.placeholder.fastSearch')}
            />
          </div>
        </div>
      ) : (
        <div
          className="absolute z-[1000]"
          style={
            positionOverride
              ? { position: 'absolute' as const, ...positionOverride }
              : {
                  top: `${padding + mainPopupHeight + gap + (hideControls ? 56 : 0)}px`,
                  right: `${padding}px`,
                }
          }
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="flex flex-col rounded-2xl bg-white border border-gray-200 shadow-lg relative overflow-hidden w-[420px]"
            style={{ height: maxHeightProp ?? 600 }}
          >
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
                aria-label={isExpanded ? t('agent.collapse') : t('agent.expand')}
              >
                <Icon icon={isExpanded ? 'mdi:window-restore' : 'mdi:window-maximize'} className="w-5 h-5" />
              </button>
            </div>

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4 pt-6">
              <div className="space-y-3">
                <MessageList
                  messages={messages}
                  isResponding={isResponding}
                  listCardCount={listCardCount}
                  cameraCount={cameraCount}
                  isExpanded={false}
                  onSuggestionClick={handleSuggestionClick}
                />
              </div>

              <div ref={bottomRef} className="h-2" />
            </div>

            <ChatInputForm
              chatInput={chatInput}
              setChatInput={setChatInput}
              handleSendMessage={handleSendMessage}
              isResponding={isResponding}
              onSkipResponse={handleSkipResponse}
              textareaRef={textareaRef}
              inputKey={inputKey}
              ignoreNextChangeRef={ignoreNextChangeRef}
              isExpanded={false}
              placeholder={isObjectTracking ? t('agent.placeholder.objectTracking') : t('agent.placeholder.fastSearch')}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AIAgentPopup;
