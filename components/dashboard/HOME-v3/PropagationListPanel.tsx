import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface PropagationListPanelProps {
  isVisible: boolean;
  width?: number;
  onClose?: () => void;
}

interface PropagationThread {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
  messages: ThreadMessage[];
}

interface ThreadMessage {
  id: string;
  role: 'system' | 'agency' | 'user';
  content: string;
  timestamp: string;
  author?: string; // 신고기관명
  status?: 'read' | 'unread';
}

// 기본 신고 접수 내용 (부천원미경찰서)
const defaultReportContent = `🚨 실종자 신고 접수

▪ 신고 접수 정보

신고 기관: 부천원미경찰서
접수 시각: 오전 09:45:23
담당자: 김민수 경위

▪ 실종자 정보

이름/나이: 김도연 / 22세 (남)
인상착의: 회색 후드, 청바지, 흑색 짧은 머리, 176cm, 65kg
실종 장소: 춘의동 125-46 일원
실종 시각: 오전 09:30경

▪ 특이사항

⚠️ 장애 있음. 긴급 수색 요망.

보호자 진술에 따르면 평소 익숙한 경로를 벗어나지 않는 편이나, 
오늘 아침 집을 나선 후 연락이 두절됨.
휴대전화 위치추적 결과 춘의동 일대에서 마지막 신호 확인.`;

// 기본 더미 전파 내용
const defaultPropagationContent = `[112요청건/협조] 실종자 김도연(남/22) 동일인물 추정 연속포착 4건 공유드립니다.

👤 1. 대상자 정보
성명/나이: 김도연 / 22세(남)
인상착의: 회색 후드, 청바지, 흑색 짧은 머리, 176cm / 65kg
실종 접수: 09:30경 춘의동 125-46 일원

📡 2. 관제 확인 범위
시간: 09:30~현재
범위: 춘의동 125-46 인근 및 인접 구간 반경 10km 확인
상기 범위 외 카메라는 아직 미확인 상태이며, 112에서 최신 목격정보/우선 확인 구역 회신 주시면 즉시 확대 확인 가능

🎯 3. 포착 현황
🔎 (고속검색) 10:35:56 / 원미A-230 / 춘의동 125-46 / 유사도 95%
· 편의점 앞 체류 후 출입 반복, 전화 행동 확인 후 화면 상단 중앙 방향 이탈 관측
🔗 (추적연계) 10:35:54 / 원미A-444 / 길주로363번길 48
· 고속검색 후보와 외형·행동 패턴 일치로 연계 판단
🔗 (추적연계) 10:35:51 / 원미A-498 / 달빛로301번길 54
· 고속검색 후보와 외형·행동 패턴 일치로 연계 판단
🔗 (추적연계) 10:12:31 / 원미A-604 / 춘의동 125-32
· 고속검색 후보와 외형·행동 패턴 일치로 연계 판단

🧭 4. 추적 판단 요약
남서 방향 이동 지속 추정(경로 적합도 83)
인접 CCTV 커버리지 중첩 구간으로 연속 추적 가능 체류 후 동일 방향 이탈 패턴 반복 관측

🤝 5. 상호 협조
112에서 최신 목격지/시간, 이동수단 여부, 외형변동(겉옷·모자·가방 등), 우선 확인 구역 회신 주시면 해당 조건으로 탐색 범위 즉시 갱신해 추가 확인 진행
추가 포착 또는 동선 변경 확인 시 바로 재전파

📎 6. 첨부
원미A-230/444/498/604 포착 썸네일 및 클립
동선 지도(4지점 표시)

※ AI 분석 기반 추정 결과이며 최종 확인은 현장 판단 기준입니다.
관제 담당: 김쿠도 / 032-266-3454`;

const PropagationListPanel: React.FC<PropagationListPanelProps> = ({
  isVisible,
  width = 700,
  onClose,
}) => {
  // ESC 키로 닫기
  useEffect(() => {
    if (!isVisible) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose]);

  const [threads, setThreads] = useState<PropagationThread[]>(() => {
    const now = new Date();
    const reportTime = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3시간 전
    const propagationTime = new Date(now.getTime() - 10 * 60 * 1000); // 10분 전
    
    return [
      {
        id: 'thread-1',
        title: '실종자 김도연(22세) 긴급 수색',
        status: 'pending',
        createdAt: reportTime.toISOString(),
        messages: [
          // 1. 신고 접수 메시지 (부천원미경찰서)
          {
            id: 'msg-report',
            role: 'agency',
            content: defaultReportContent,
            timestamp: reportTime.toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            author: '부천원미경찰서',
            status: 'read',
          },
          // 2. 전파 전송 메시지 (내가 보낸 전파)
          {
            id: 'msg-propagation',
            role: 'system',
            content: defaultPropagationContent,
            timestamp: propagationTime.toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
          },
        ],
      },
    ];
  });
  
  const [currentThreadId, setCurrentThreadId] = useState('thread-1');
  const [messageInput, setMessageInput] = useState('');
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

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [threadMessages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
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

  const addMessage = (role: 'agency' | 'user', content: string, author?: string) => {
    const timestamp = new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const newMessage: ThreadMessage = {
      id: `msg-${Date.now()}`,
      role,
      content,
      timestamp,
      author,
      status: role === 'agency' ? 'unread' : 'read',
    };

    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === currentThreadId
          ? {
              ...thread,
              messages: [...thread.messages, newMessage],
              status: role === 'agency' ? 'in-progress' : thread.status,
            }
          : thread
      )
    );
  };

  const handleSendMessage = () => {
    const text = messageInput.trim();
    if (!text) return;

    addMessage('user', text);
    setMessageInput('');

    // 시뮬레이션: 신고기관 응답
    setTimeout(() => {
      addMessage('agency', '전파 내용 확인했습니다. 현재 현장 파견 중입니다.', '원미경찰서');
    }, 2000);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* 딤 배경 */}
      <div 
        className="fixed inset-0 bg-black/70 transition-opacity duration-500"
        style={{ zIndex: 10001 }}
        onClick={onClose}
      />

      {/* 중앙 패널 */}
      <div
        className="fixed top-1/2 left-1/2 flex flex-col transition-all duration-500 ease-out opacity-100 scale-100"
        style={{
          transform: 'translate(-50%, -50%)',
          width: '900px',
          maxWidth: '90vw',
          height: '90vh',
          maxHeight: '90vh',
          zIndex: 10002,
          padding: '16px',
        }}
      >
        <div className="flex flex-col gap-3 h-full" style={{ minHeight: 0 }}>
          {/* 헤더 */}
          <div
            className="rounded-lg flex-shrink-0"
            style={{
              zIndex: 2,
            }}
          >
            {/* 정보 칩들 */}
            <div className="flex items-center justify-between gap-2 flex-wrap relative">
              <div className="flex items-center gap-2">
                {/* 전파 건수 칩 */}
                <div className="px-4 py-2 rounded-full text-xs font-medium bg-[#0f0f0f]/50 text-gray-300 flex items-center gap-2 border border-[#31353a]" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <span>전파 건수: {threads.length}건</span>
                </div>
                
                {/* 상태 칩 - 완료됨 또는 진행 중일 때만 표시 */}
                {currentThread && currentThread.status !== 'pending' && (
                  <div className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 border ${
                    currentThread.status === 'completed' ? 'bg-green-500/10 text-green-300 border-green-500/50' :
                    'bg-blue-500/10 text-blue-300 border-blue-500/50'
                  }`} style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                    <span className={`w-2 h-2 rounded-full ${
                      currentThread.status === 'completed' ? 'bg-green-400' : 'bg-blue-400'
                    } animate-pulse`}></span>
                    <span>
                      {currentThread.status === 'completed' ? '완료됨' : '진행 중'}
                    </span>
                  </div>
                )}
              </div>
              
              {/* 닫기 버튼 */}
              <button
                type="button"
                onClick={onClose}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0f0f0f]/50 border border-[#31353a] hover:border-red-500/50 hover:bg-red-500/10 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all"
                aria-label="닫기"
              >
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 메인 영역 - 메시지 영역만 표시 */}
          <div
            className="rounded-lg flex-1 gradient-border-right-bottom border border-[#31353a] relative flex flex-col overflow-hidden"
            style={{
              minHeight: 0,
              maxHeight: '100%',
              background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
          >
            {/* 메시지 영역 */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              {/* 메시지 헤더 */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#31353a] flex-shrink-0 bg-[#0a0a0a]/50">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-200 truncate">{currentThread?.title || '전파'}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {currentThread && new Date(currentThread.createdAt).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <button
                  onClick={() => {
                    // 전파 내용 다운로드
                    const content = threadMessages.map(msg => 
                      `[${msg.role === 'agency' ? msg.author : msg.role === 'system' ? '전파 전송' : '담당자'}] ${msg.timestamp}\n\n${msg.content}\n\n---\n\n`
                    ).join('');
                    
                    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `사건처리결과보고서_${currentThread?.title}_${new Date().toISOString().slice(0, 10)}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors flex items-center gap-1.5"
                >
                  <Icon icon="mdi:download" className="w-4 h-4" />
                  <span>사건 처리 결과 보고서 다운로드</span>
                </button>
              </div>

              {/* 메시지 영역 - 타임라인 스타일 */}
              <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-4"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#31353a #0f0f0f',
                }}
              >
                <div className="max-w-full">
                  {/* 타임라인 컨테이너 */}
                  <div className="relative pl-12">
                    {/* 타임라인 세로선 */}
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[#31353a]" />
                    
                    {/* 메시지들 */}
                    <div className="space-y-6">
                      {threadMessages.map((message, index) => (
                        <div key={message.id} className="relative flex items-start gap-4" style={{
                          marginLeft: (message.role === 'system' || message.role === 'user') ? '40px' : '0px',
                        }}>
                          {/* 타임라인 아이콘 */}
                          <div className="relative z-10 flex-shrink-0 -ml-12">
                            {message.role === 'agency' && (
                              <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center border-4 border-[#0a0a0a] shadow-md">
                                <Icon icon="mdi:alert-circle" className="w-4 h-4 text-white" />
                              </div>
                            )}
                            {message.role === 'system' && (
                              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center border-4 border-[#0a0a0a] shadow-md">
                                <Icon icon="mdi:send" className="w-4 h-4 text-white" />
                              </div>
                            )}
                            {message.role === 'user' && (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center border-4 border-[#0a0a0a] shadow-md">
                                <Icon icon="mdi:account" className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>

                          {/* 메시지 내용 */}
                          <div className="flex-1 min-w-0">
                            {message.role === 'agency' && (
                              <div className="bg-[#0f0f0f]/70 border border-[#31353a] rounded-lg p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-sm font-bold text-red-400">{message.author || '신고기관'}</span>
                                  <span className="text-sm text-gray-500">•</span>
                                  <span className="text-sm text-gray-500">{message.timestamp}</span>
                                  {message.status === 'unread' && (
                                    <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold ml-auto">
                                      NEW
                                    </span>
                                  )}
                                </div>
                                <pre className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">
                                  {message.content}
                                </pre>
                              </div>
                            )}

                            {message.role === 'system' && (
                              <div className="bg-[#393a42] border border-[#31353a] rounded-lg p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-sm font-bold text-gray-200">전파 전송</span>
                                  <span className="text-sm text-gray-500">•</span>
                                  <span className="text-sm text-gray-500">{message.timestamp}</span>
                                </div>
                                {message.content ? (
                                  <>
                                    <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-sans space-y-4">
                                      {message.content.split('\n\n').map((paragraph, idx) => (
                                        <div key={idx} className={paragraph.startsWith('👤') || paragraph.startsWith('📡') || paragraph.startsWith('🎯') || paragraph.startsWith('🧭') || paragraph.startsWith('🤝') || paragraph.startsWith('📎') ? 'mt-4 first:mt-0' : ''}>
                                          {paragraph}
                                        </div>
                                      ))}
                                    </div>
                                    
                                    {/* 포착 목록 */}
                                    <div className="mt-4 pt-4 border-t border-[#31353a]">
                                      <div className="text-xs font-semibold text-gray-400 mb-3">📎 포착 목록</div>
                                      <div className="grid grid-cols-2 gap-2">
                                        {[
                                          { video: 'http://192.168.102.102/video/qs_img_59_y.mp4', poster: '/images/fast-search/qs_img_57_48.png', name: '원미A-230 영상' },
                                          { video: 'http://192.168.102.102/video/qs_img_57_y.mov', poster: '/images/fast-search/qs_img_57_28.png', name: '원미A-604 영상' },
                                        ].map((item, idx) => (
                                          <div key={idx} className="relative group">
                                            <div className="aspect-video bg-black rounded overflow-hidden border border-[#31353a] group-hover:border-blue-500/50 transition-colors relative">
                                              <video
                                                src={item.video}
                                                poster={item.poster}
                                                className="w-full h-full object-cover"
                                                muted
                                                playsInline
                                                preload="metadata"
                                              />
                                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                <Icon icon="mdi:play-circle" className="w-8 h-8 text-white opacity-80" />
                                              </div>
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-1 text-center truncate">{item.name}</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <p className="text-sm text-red-400">내용이 없습니다</p>
                                )}
                              </div>
                            )}

                            {message.role === 'user' && (
                              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-sm font-semibold text-blue-300">담당자</span>
                                  <span className="text-sm text-gray-500">•</span>
                                  <span className="text-sm text-gray-500">{message.timestamp}</span>
                                </div>
                                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                  {message.content}
                                </p>
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
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="메시지를 입력하세요..."
                      className="flex-1 bg-transparent border-none text-gray-900 text-sm placeholder-gray-400 focus:outline-none resize-none overflow-hidden"
                      style={{
                        minHeight: '24px',
                        maxHeight: '96px',
                        lineHeight: '24px',
                      }}
                      rows={1}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                      aria-label="전송"
                    >
                      <Icon icon="mdi:send" className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5 text-center">
                    신고기관과의 소통 스레드입니다. 상황 진행 사항을 실시간으로 확인하세요.
                  </p>
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
                  aria-label="맨 위로"
                >
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

export default PropagationListPanel;
