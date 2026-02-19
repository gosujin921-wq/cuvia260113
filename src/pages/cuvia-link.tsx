import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate, Link } from 'react-router-dom';
import { ScaledLayout } from '@/components/layouts/ScaledLayout';
import { BasePopup } from '@/components/shared/BasePopup';

const CuviaLinkPage = () => {
  const navigate = useNavigate();
  const [chatInput, setChatInput] = useState('');
  const [showToolPopup, setShowToolPopup] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isComposingRef = useRef(false);
  const pendingEnterRef = useRef(false);

  const promptCategories = [
    {
      id: 'summary',
      title: '상황 요약하기',
      prompts: [
        '지난달 사건사고 요약해줘',
        '지난주 폭력 사건 핵심만 정리해줘',
        '지난주 쓰러짐 통계 보여줘',
      ],
    },
    {
      id: 'pattern',
      title: '패턴 분석하기',
      prompts: [
        '폭력 제일 많이 발생한 곳은 어디야?',
        '쓰러짐 많은 CCTV 알려줘',
        '폭력은 보통 몇 시에 많이 발생해?',
      ],
    },
    {
      id: 'history',
      title: '이력 조회하기',
      prompts: [
        '어제 밤 폭력사건 보여줘',
        '지난주 침수 이벤트 조회해줘',
        '부천역 주변 CCTV에서 쓰러짐 찾아줘',
      ],
    },
    {
      id: 'map',
      title: '지도에서 보기',
      prompts: [
        '부천 범죄주의구간 보여줘',
        '침수 위험구간 높은 곳 보여줘',
        '부천역 근처 대피소 보여줘',
      ],
    },
    {
      id: 'monitor',
      title: '우선 감시 추천받기',
      prompts: [
        '지금 당장 모니터링 해야 할 CCTV 10개 띄워줘',
        '호우특보면 어디부터 감시해야 돼?',
        '쓰러짐 자주 뜨는 곳 CCTV 추천해줘',
      ],
    },
    {
      id: 'manual',
      title: '메뉴얼 확인하기',
      prompts: [
        '침수 발생했을 때 초동 대응 절차 알려줘',
        '폭력 사건 대응 근거 포함해서 정리해줘',
      ],
    },
  ];


  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = 24;
      const maxHeight = lineHeight * 4;
      const newHeight = Math.min(scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
      
      // 높이가 초기 높이보다 크면 확장된 상태로 간주
      setIsInputExpanded(newHeight > lineHeight);
    }
  }, [chatInput]);

  const handleSendMessage = async (messageText?: string) => {
    // textarea의 현재 값을 직접 읽어옴 (우선순위: messageText > textareaRef.current.value > chatInput)
    let currentValue = messageText;
    if (!currentValue && textareaRef.current) {
      currentValue = textareaRef.current.value;
    }
    if (!currentValue) {
      currentValue = chatInput;
    }
    
    const text = currentValue.trim();
    if (!text) return;

    // 입력창 초기화
    setChatInput('');
    if (textareaRef.current) {
      textareaRef.current.value = '';
    }
    
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
            className="absolute rounded-full cuvia-link-gradient-1"
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
            className="absolute rounded-full cuvia-link-gradient-2"
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
            className="absolute rounded-full cuvia-link-gradient-3"
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
            className="absolute rounded-full cuvia-link-gradient-4"
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
          {/* 중앙 입력 영역 */}
          <div className="flex-1 flex flex-col relative z-10">
              {/* 상단: 로고와 Agent (대시보드와 동일한 위치) */}
              <div className="py-4 px-3 flex items-center gap-2.5">
                <Link to="/" className="w-24 h-5 flex items-center justify-start">
                  <img 
                    src="/logo.svg" 
                    alt="CUVIA Logo" 
                    className="h-5 w-auto object-contain"
                  />
                </Link>
                <span className="text-xl font-semibold text-gray-400 tracking-tight">Link</span>
              </div>
              
              {/* 중앙: 문구와 채팅창 */}
              <div 
                className="flex-1 flex flex-col items-center justify-center max-w-[800px] mx-auto w-full"
                onClick={() => {
                  if (selectedCategory) {
                    setSelectedCategory(null);
                  }
                }}
              >
                <h1 
                  className="text-4xl text-center mb-1 leading-relaxed w-full" 
                  style={{ fontSize: '40px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="font-bold" style={{ color: '#475569' }}>관제 특화 AI Agent,</span>{' '}
                  <span className="bg-gradient-to-r from-[#ff8566] to-[#ff8566] bg-clip-text text-transparent font-bold">
                    CUVIA Link
                  </span>
                </h1>
                <p 
                  className="text-lg font-normal text-gray-600 text-center mb-8 leading-relaxed w-full" 
                  style={{ fontSize: '17px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  자연어로 질문하면 내부 관제 데이터와 외부 근거를 종합해 신속하고 일관된 의사결정을 지원합니다.
                </p>
                <div className="w-full" onClick={(e) => e.stopPropagation()}>
                  <div 
                    className="relative flex items-center gap-3 px-4 py-3 cuvia-link-chat-input"
                    style={{ 
                      isolation: 'isolate',
                      borderRadius: isInputExpanded ? '1rem' : '9999px',
                      transition: 'border-radius 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    }}
                  >
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
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setChatInput(newValue);
                        // 엔터 키가 대기 중이고 조합이 완료되었으면 메시지 전송
                        if (pendingEnterRef.current && !isComposingRef.current) {
                          pendingEnterRef.current = false;
                          const textToSend = newValue.trim();
                          if (textToSend) {
                            handleSendMessage(textToSend);
                          }
                        }
                      }}
                      onCompositionStart={() => {
                        isComposingRef.current = true;
                      }}
                      onCompositionEnd={(e) => {
                        isComposingRef.current = false;
                        // 조합이 끝난 후 최신 값으로 업데이트
                        const newValue = (e.target as HTMLTextAreaElement).value;
                        setChatInput(newValue);
                        // 엔터 키가 대기 중이면 메시지 전송
                        if (pendingEnterRef.current) {
                          pendingEnterRef.current = false;
                          const textToSend = newValue.trim();
                          if (textToSend) {
                            handleSendMessage(textToSend);
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          // 조합 중이면 조합 완료를 기다림
                          if (isComposingRef.current) {
                            pendingEnterRef.current = true;
                            return;
                          }
                          // 조합이 완료되었으면 즉시 전송
                          const target = e.target as HTMLTextAreaElement;
                          const fullText = target.value.trim();
                          if (fullText) {
                            handleSendMessage(fullText);
                          }
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
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // 버튼 클릭 시점에 textarea의 현재 값을 직접 읽어서 전달
                        const currentText = textareaRef.current?.value || chatInput;
                        handleSendMessage(currentText);
                      }}
                      disabled={!chatInput.trim()}
                      className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all relative z-10 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                      style={{
                        background: 'linear-gradient(135deg, #0066FF 0%, #8A2BE2 50%, #ff8566 100%)',
                        pointerEvents: 'auto',
                      }}
                      aria-label="검색"
                      type="button"
                    >
                      <img
                        src="/simbol.svg"
                        alt="검색"
                        className="w-5 h-5 pointer-events-none"
                        style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }}
                      />
                    </button>
                  </div>
                </div>

                {/* 추천 프롬프트 영역 - 고정 높이와 너비 */}
                <div className="w-full mt-4 flex justify-center">
                  <div style={{ width: '900px', height: '220px' }}>
                    {/* 추천 프롬프트 카테고리 버튼 - 선택되지 않았을 때만 표시 */}
                    {!selectedCategory && (
                      <div className="flex flex-wrap gap-2 justify-center" style={{ height: '220px' }}>
                        {promptCategories.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className="px-2.5 py-1.5 rounded-full font-medium bg-white border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all h-fit flex items-center gap-1"
                            style={{ fontSize: '13px' }}
                          >
                            {category.title}
                            <Icon icon="mdi:chevron-right" className="w-3.5 h-3.5" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 선택된 카테고리의 추천 문구들 - 리스트 형식 텍스트 */}
                    {selectedCategory && (
                      <div className="space-y-2" style={{ height: '220px' }}>
                        {promptCategories
                          .find((cat) => cat.id === selectedCategory)
                          ?.prompts.map((prompt, index) => (
                            <div key={index} className="w-full text-left">
                              <button
                                onClick={() => {
                                  setChatInput(prompt);
                                  setSelectedCategory(null);
                                  textareaRef.current?.focus();
                                }}
                                className="inline-block px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                              >
                                {prompt}
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
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

export default CuviaLinkPage;
