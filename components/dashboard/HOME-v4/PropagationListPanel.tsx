import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface CaptureItem {
  id: string;
  cctvName: string;
  location: string;
  timestamp: string;
  thumbnailUrl: string;
  videoUrl: string;
  confidence?: number;
  analysisResult?: string;
}

interface PropagationListPanelProps {
  isVisible: boolean;
  width?: number;
  onClose?: () => void;
  onBackToInitial?: () => void;
  captureItems?: CaptureItem[];
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

// 기본 신고 접수 내용 (하늘별빛경찰서)
const defaultReportContent = `🚨 실종자 신고 접수

▪ 신고 접수 정보

신고 기관: 하늘별빛경찰서
접수 시각: 오전 09:45:23
담당자: 김쿠도

▪ 실종자 정보

이름/나이: 김도연 / 22세 (남)
인상착의: 회색 후드, 청바지, 흑색 짧은 머리, 176cm, 65kg
실종 장소: 은하로363번길 48 일원
실종 시각: 오전 09:30경

▪ 특이사항

⚠️ 장애 있음. 긴급 수색 요망.

보호자 진술에 따르면 평소 익숙한 경로를 벗어나지 않는 편이나, 
오늘 아침 집을 나선 후 연락이 두절됨.
휴대전화 위치추적 결과 은하로363번길 일대에서 마지막 신호 확인.`;

// 기본 전파 내용 (납치 의심 차량)
const defaultPropagationContent = `[112 긴급 전파] 납치(의심) 차량 이동 정황 — 번호판 후보 확보(관제 확인)

1. 대상 정보
· 사건 유형: **납치(의심)** (성인 남성이 성인 여성과 동행 후 차량 이동 정황)
· 관련 차량: **번호판 후보 12 324*** (가시성: 높음) / 차종·색상·외형 특징 일치(추정)

2. 관제 확인 범위
· 확인 시간대: **14:00~현재**
· 확인 구역: **은하로363번길 48 일대** (반경 약 2km)
· 관제 방식: **차량 중심 객체추적(실시간) 진행 중**

3. 포착 현황
· CCTV-01 | 14:02:18: 성인 남성-성인 여성 동행, 여성 움직임 비자발적 정황 관찰(추정)
· CCTV-19 | 14:05:08: 차량 **재포착**, 번호판 후보 **12 324*** 확보(가시성: 높음)
· 이동 방향: **동 방향 진행**(추정)

4. 추적 판단 요약
· 차량이 **이동 중**으로 판단되어, **차량 중심 추적**을 유지하며 후속 포착을 갱신 중입니다.
· 현재 확보 단서 기준으로 **현장 확인/출동 검토**가 필요합니다.

5. 상호 협조(요청)
· 번호판 후보 **12 324*** 및 동일/유사 차량에 대한 **즉시 확인 및 출동 검토** 요청드립니다.
· 관제에서 **추가 포착 발생 시 즉시 업데이트** 드리겠습니다.

6. 첨부(전달)
· **캡처 3장** (번호판 후보 포함)
· **클립 2개** (전후 60초 구간)
· **지도 스냅샷 1장** (포착 지점 및 추정 이동 경로)

※ **AI 분석 기반 추정 결과이며 최종 확인은 현장 판단 기준입니다.**

관제 담당: **김쿠도 / 032-266-3454**`;

const PropagationListPanel: React.FC<PropagationListPanelProps> = ({
  isVisible,
  width = 700,
  onClose,
  onBackToInitial,
  captureItems = [],
}) => {
  const hasAddedDiscoveryRef = useRef(false);

  // 전파 패널 열림 시 0.5초 후 스크롤을 맨 아래로
  useEffect(() => {
    if (!isVisible) return;
    let checkTimer: ReturnType<typeof setTimeout> | null = null;
    const scrollTimer = window.setTimeout(() => {
      const el = scrollContainerRef.current;
      if (el) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        // smooth 스크롤 완료 후 탑 버튼 표시 보장
        checkTimer = window.setTimeout(() => {
          setShowScrollTop(el.scrollTop > 300);
        }, 600);
      }
    }, 500);
    return () => {
      window.clearTimeout(scrollTimer);
      if (checkTimer) window.clearTimeout(checkTimer);
    };
  }, [isVisible]);

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
          // 1. 전파 전송 메시지 (내가 보낸 전파) — 2번부터 시작
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

  // 전파 패널 열림 시 하늘별빛경찰서 대화 시퀀스 추가 (2초 → 5초 → 8초)
  const policeReply1 = '전파 내용 확인했습니다. **112 접수번호(사건번호) 생성**하겠습니다.\n현재 차량이 **어느 방향 도로로 진입**했나요?';
  const userReply = '최신 포착은 CCTV-19 14:05:08, 위치는 달빛로301번길 28 인근 교차로, 진행은 **동 방향 은하로**입니다.';
  const policeReply2 = '출동 중입니다. 추가 업데이트만 부탁드립니다.';

  const typingIntervalRef = useRef<number | null>(null);
  const autoTypingTimeoutRef = useRef<number | null>(null);
  const autoSendTimeoutRef = useRef<number | null>(null);

  const startAutoTypingReply = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const fullText = `최신 포착은 별빛A-655 ${timeStr}, 위치는 은하빌딩, 진행은 **달빛동 방향** 입니다.`;

    if (typingIntervalRef.current !== null) {
      window.clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    if (autoSendTimeoutRef.current !== null) {
      window.clearTimeout(autoSendTimeoutRef.current);
      autoSendTimeoutRef.current = null;
    }

    setMessageInput('');
    let index = 0;

    const intervalId = window.setInterval(() => {
      index += 1;
      setMessageInput(fullText.slice(0, index));

      if (index >= fullText.length) {
        window.clearInterval(intervalId);
        typingIntervalRef.current = null;

        const sendTimeoutId = window.setTimeout(() => {
          handleSendMessage(fullText);
        }, 300);

        autoSendTimeoutRef.current = sendTimeoutId;
      }
    }, 40);

    typingIntervalRef.current = intervalId;
  };

  useEffect(() => {
    if (!isVisible) {
      hasAddedDiscoveryRef.current = false;
      return;
    }
    if (hasAddedDiscoveryRef.current) return;
    hasAddedDiscoveryRef.current = true;

    const addAgencyMsg = (content: string) => {
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === currentThreadId
            ? {
                ...thread,
                messages: [
                  ...thread.messages,
                  {
                    id: `msg-agency-${Date.now()}`,
                    role: 'agency' as const,
                    content,
                    timestamp: new Date().toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    }),
                    author: '하늘별빛경찰서',
                    status: 'unread' as const,
                  },
                ],
                status: 'in-progress' as const,
              }
            : thread
        )
      );
    };

    const addUserMsg = (content: string) => {
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === currentThreadId
            ? {
                ...thread,
                messages: [
                  ...thread.messages,
                  {
                    id: `msg-user-${Date.now()}`,
                    role: 'user' as const,
                    content,
                    timestamp: new Date().toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    }),
                    status: 'read' as const,
                  },
                ],
              }
            : thread
        )
      );
    };

    const t1 = window.setTimeout(() => {
      addAgencyMsg(policeReply1);

      const typingTimeoutId = window.setTimeout(() => {
        startAutoTypingReply();
      }, 1000);

      if (autoTypingTimeoutRef.current !== null) {
        window.clearTimeout(autoTypingTimeoutRef.current);
      }

      autoTypingTimeoutRef.current = typingTimeoutId;
    }, 2000);
    const t2 = window.setTimeout(() => {
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === currentThreadId ? { ...thread, status: 'completed' as const } : thread
        )
      );
    }, 3000);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      if (autoTypingTimeoutRef.current !== null) {
        window.clearTimeout(autoTypingTimeoutRef.current);
      }
      if (typingIntervalRef.current !== null) {
        window.clearInterval(typingIntervalRef.current);
      }
      if (autoSendTimeoutRef.current !== null) {
        window.clearTimeout(autoSendTimeoutRef.current);
      }
    };
  }, [isVisible, currentThreadId]);
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
    if (!container || !isVisible) return;

    const handleScroll = () => {
      setShowScrollTop(container.scrollTop > 300);
    };

    handleScroll(); // 초기 체크 (패널 열림/스크롤 후 상태 반영)
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isVisible, threadMessages]);

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
    
    // 입력창 높이 측정 (패널 열림 시 및 레이아웃 변경 시)
    if (isVisible && inputContainerRef.current) {
      setInputContainerHeight(inputContainerRef.current.offsetHeight);
    }
  }, [messageInput, isVisible]);

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

  const handleSendMessage = (overrideText?: string) => {
    const text = (overrideText ?? messageInput).trim();
    if (!text) return;

    addMessage('user', text);
    setMessageInput('');

    // 시뮬레이션: 신고기관 응답
    setTimeout(() => {
      addMessage('agency', '전파 내용 확인했습니다. 현재 현장 파견 중입니다.', '별빛경찰서');
    }, 2000);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* 딤 배경 */}
      <div 
        className="fixed inset-0 bg-black/30 transition-opacity duration-500"
        style={{ zIndex: 10001 }}
        onClick={onClose}
      />

      {/* 중앙 패널 */}
      <div
        className="fixed top-1/2 left-1/2 flex flex-col transition-all duration-500 ease-out opacity-100 scale-100 bg-gray-100 rounded-xl p-4 shadow-2xl"
        style={{
          transform: 'translate(-50%, -50%)',
          width: '900px',
          maxWidth: '90vw',
          height: '90vh',
          maxHeight: '90vh',
          zIndex: 10002,
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
                <div className="px-4 py-2 rounded-full text-xs font-medium bg-white/90 text-gray-700 flex items-center gap-2 border border-gray-200 shadow-sm" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <span>전파 건수: {threads.length}건</span>
                </div>
                
                {/* 상태 칩 - 완료됨 또는 진행 중일 때만 표시 */}
                {currentThread && currentThread.status !== 'pending' && (
                  <div className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 border shadow-sm ${
                    currentThread.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                    'bg-blue-50 text-blue-700 border-blue-200'
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
                className="flex-shrink-0 w-8 h-8 rounded-full bg-white/90 border border-gray-200 hover:border-red-300 hover:bg-red-50 flex items-center justify-center text-gray-600 hover:text-red-500 transition-all shadow-sm"
                aria-label="닫기"
              >
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 메인 영역 - 메시지 영역만 표시 */}
          <div
            className="rounded-lg flex-1 border border-gray-200 relative flex flex-col overflow-hidden bg-white shadow-lg"
            style={{
              minHeight: 0,
              maxHeight: '100%',
            }}
          >
            {/* 메시지 영역 */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
              {/* 메시지 헤더 */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0 bg-gray-50">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-800 truncate">{currentThread?.title || '전파'}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">
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
                      `[${msg.role === 'agency' ? msg.author : msg.role === 'system' ? '전파 전송' : '김쿠도'}] ${msg.timestamp}\n\n${msg.content}\n\n---\n\n`
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

              {/* 메시지 영역 - 채팅 스타일 */}
              <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-4 bg-gray-50/50"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#d1d5db #f3f4f6',
                }}
              >
                <div className="flex flex-col gap-4 max-w-full">
                  {threadMessages.map((message) => (
                    <div
                      key={message.id}
                      className={message.role === 'agency' ? 'flex items-start gap-3' : 'flex justify-end'}
                    >
                      {/* 왼쪽 정렬: agency (신고기관) - 수신 메시지 */}
                      {message.role === 'agency' && (
                        <div className="flex items-start gap-3 w-[80%] min-w-[80%]">
                          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-500 flex items-center justify-center border-2 border-white shadow-sm">
                            <Icon icon="mdi:alert-circle" className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-bold text-red-600">{message.author || '신고기관'}</span>
                                {message.status === 'unread' && (
                                  <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                                    NEW
                                  </span>
                                )}
                              </div>
                              <div
                                className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans"
                                dangerouslySetInnerHTML={{
                                  __html: message.content
                                    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-900 font-semibold">$1</strong>')
                                    .replace(/\*(.+?)\*/g, '<em class="text-gray-800">$1</em>'),
                                }}
                              />
                              <div className="text-xs text-gray-500 mt-2">{message.timestamp}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 오른쪽 정렬: system (전파 전송), user (김쿠도) - 발신 메시지 */}
                      {(message.role === 'system' || message.role === 'user') && (
                        <div className="flex items-start gap-2 w-[80%] min-w-[80%]">
                          <div className="flex-1 min-w-0 flex flex-col items-end">
                            {message.role === 'system' && (
                              <div className="bg-blue-50 border border-blue-100 rounded-2xl rounded-tr-sm p-4 shadow-sm w-full">
                                <div className="flex items-center justify-end gap-2 mb-2">
                                  <span className="text-sm font-bold text-gray-800">전파 전송</span>
                                </div>
                                {message.content ? (
                                  <>
                                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans space-y-4">
                                      {message.content.split('\n\n').map((paragraph, idx) => {
                                        const isSection = /^[1-6]\.\s/.test(paragraph.trim());
                                        const html = paragraph
                                          .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-900 font-semibold">$1</strong>')
                                          .replace(/\*(.+?)\*/g, '<em class="text-gray-800">$1</em>');
                                        return (
                                          <div
                                            key={idx}
                                            className={isSection ? 'mt-4 first:mt-0' : ''}
                                            dangerouslySetInnerHTML={{ __html: html }}
                                          />
                                        );
                                      })}
                                    </div>

                                    {captureItems.length > 0 && (
                                      <div className="mt-4 pt-4 border-t border-blue-100">
                                        <div className="text-xs font-semibold text-gray-600 mb-3">📎 포착 목록 ({captureItems.length}건)</div>
                                        <div className="grid grid-cols-2 gap-2">
                                          {captureItems.map((item) => (
                                            <div key={item.id} className="relative group">
                                              <div className="aspect-video bg-gray-100 rounded overflow-hidden border border-gray-200 group-hover:border-blue-300 transition-colors relative">
                                                <video
                                                  src={item.videoUrl}
                                                  poster={item.thumbnailUrl}
                                                  className="w-full h-full object-cover"
                                                  muted
                                                  playsInline
                                                  preload="metadata"
                                                />
                                              </div>
                                              <div className="text-[10px] text-gray-600 mt-1 text-center truncate">{item.cctvName} - {item.timestamp}</div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <p className="text-sm text-red-400">내용이 없습니다</p>
                                )}
                                <div className="text-xs text-gray-500 mt-2 text-right">{message.timestamp}</div>
                              </div>
                            )}

                            {message.role === 'user' && (
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl rounded-tr-sm p-4 shadow-sm">
                                <div className="flex items-center justify-end gap-2 mb-2">
                                  <span className="text-sm font-semibold text-blue-600">김쿠도</span>
                                </div>
                                <div
                                  className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
                                  dangerouslySetInnerHTML={{
                                    __html: message.content
                                      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-900 font-semibold">$1</strong>')
                                      .replace(/\*(.+?)\*/g, '<em class="text-gray-800">$1</em>'),
                                  }}
                                />
                                <div className="text-xs text-gray-500 mt-2 text-right">{message.timestamp}</div>
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center border-2 border-white shadow-sm">
                            <Icon icon={message.role === 'system' ? 'mdi:send' : 'mdi:account'} className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              </div>

              {/* 입력 영역 */}
              <div ref={inputContainerRef} className="flex-shrink-0 border-t border-gray-200 bg-white">
                <div className="p-3">
                    <div className="relative flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-colors">
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
                    신고기관과의 채팅입니다. 상황 진행 사항을 실시간으로 확인하세요.
                  </p>
                </div>
              </div>

              {/* 탑 버튼 */}
              {showScrollTop && (
                <button
                  onClick={scrollToTop}
                  className="absolute right-4 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-all hover:scale-110 z-50"
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
