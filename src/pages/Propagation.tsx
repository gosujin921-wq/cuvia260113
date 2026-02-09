import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ScaledLayout } from '@/components/layouts/ScaledLayout';

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
const defaultPropagationContent = `📡 전파 요약 (객체 추적 연계)

▪ 전파 대상

원미구 일대 동일 인물 추정 객체 (총 2건 포착)

▪ 주요 포착 내용 요약

1차 포착(고속검색 기준)

카메라: 원미A-604
위치: 길주로391번길 29 (약대파출소 인근)
포착 시각: 오후 10:53:07
유사도: 95%
행동 요약: 편의점 앞 체류 → 입·퇴장 반복 → 전화 행동 후 화면 상단 중앙 방향 이탈

2차 포착(객체 추적 연계)

카메라: 원미A-638
위치: 원미구 춘의동 125-32
포착 시각: 오후 10:53:25
연계 판단: 고속검색 후보와 외형·행동 패턴 일치

▪ 객체 추적 분석 결과

예상 이동 거리: 약 22m (이전 위치 기준)
이동 추세: 남서 방향 이동 지속 (최근 3프레임 평균)
예상 도달 시각: 09:36:00 (현재 시각 기준 +30초)
경로 적합도: 83점

▪ 추적 근거 요약

평균 보행 속도로 방향 유지 이동 중
하천 산책로 및 보행자 동선과 직접 연결된 구간
인접 CCTV 3대 커버리지 중첩 구간으로 연속 추적 가능
체류 후 동일 방향 이탈 패턴 반복 관측
유사 시간대 사례 분석 결과, 하천 방향 이동 비중 높음

▪ 종합 판단

고속검색으로 확보된 후보 객체가 인접 CCTV에서 연속 포착됨.
동일 외형·행동 패턴 기반 연계 추적 신뢰도 높음으로 판단됨.`;

const PropagationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // location.state에서 전파 내용 가져오기
  const propagationData = location.state as { content?: string; title?: string; selectedItems?: any[] } | null;
  
  console.log('전파 페이지 - propagationData:', propagationData);

  const [threads, setThreads] = useState<PropagationThread[]>(() => {
    // 전파 패키지에서 넘어온 경우 또는 기본 더미 데이터
    const propagationContent = propagationData?.content || defaultPropagationContent;
    const title = propagationData?.title || '실종자 김도연(22세) 긴급 수색';
    
    console.log('초기화 - content 길이:', propagationContent.length);
    console.log('초기화 - title:', title);
    
    const now = new Date();
    const reportTime = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3시간 전
    const propagationTime = new Date(now.getTime() - 10 * 60 * 1000); // 10분 전
    
    return [
      {
        id: 'thread-1',
        title: title,
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
            content: propagationContent,
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

  const currentThread = threads.find((thread) => thread.id === currentThreadId);
  const threadMessages = currentThread?.messages || [];
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  console.log('현재 스레드:', currentThread);
  console.log('메시지 목록:', threadMessages);

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

  const handleNewThread = () => {
    const newThreadId = `thread-${Date.now()}`;
    const newThread: PropagationThread = {
      id: newThreadId,
      title: '새 전파',
      status: 'pending',
      createdAt: new Date().toISOString(),
      messages: [],
    };
    setThreads((prev) => [newThread, ...prev]);
    setCurrentThreadId(newThreadId);
    setMessageInput('');
  };

  return (
    <ScaledLayout noScale>
      <div className="flex flex-1 overflow-hidden bg-white min-h-0 h-full relative">
        {/* 상단 좌측 로고 */}
        <div className="absolute top-5 left-5 z-20">
          <img
            src="/logo.svg"
            alt="CUVIA"
            className="h-5 w-auto object-contain"
          />
        </div>

        {/* 좌측 패널 - 전파 스레드 리스트 */}
        <aside
          className="w-64 border-r border-gray-200 flex flex-col overflow-hidden flex-shrink-0 relative"
          style={{ 
            background: 'linear-gradient(to bottom, #ffffff, #fafafa)',
            zIndex: 10 
          }}
        >
          {/* 애니메이션 백그라운드 그라데이션 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
            <div 
              className="absolute rounded-full"
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
            <div 
              className="absolute rounded-full"
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
          </div>

          {/* 상단 여백 */}
          <div className="h-16 flex-shrink-0" style={{ zIndex: 2 }} />

          {/* 스레드 리스트 */}
          <div className="flex-1 overflow-y-auto p-3 relative" style={{ zIndex: 2 }}>
            <div className="space-y-2">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setCurrentThreadId(thread.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    currentThreadId === thread.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-1">
                    <Icon 
                      icon={
                        thread.status === 'completed' ? 'mdi:check-circle' :
                        thread.status === 'in-progress' ? 'mdi:clock-outline' :
                        'mdi:send-circle-outline'
                      } 
                      className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        thread.status === 'completed' ? 'text-green-500' :
                        thread.status === 'in-progress' ? 'text-blue-500' :
                        'text-gray-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">
                        {thread.title}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {new Date(thread.createdAt).toLocaleString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </aside>

        {/* 메인 컨텐츠 - 스레드 채팅 */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* 헤더 */}
          <div className="border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0 bg-white">
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">{currentThread?.title || '전파'}</h1>
              <p className="text-xs text-gray-500 mt-1">
                {currentThread?.status === 'completed' && '완료됨'}
                {currentThread?.status === 'in-progress' && '진행 중'}
                {currentThread?.status === 'pending' && '대기 중'}
                {' · '}
                {currentThread && new Date(currentThread.createdAt).toLocaleString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
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
                  a.download = `전파_${currentThread?.title}_${new Date().toISOString().slice(0, 10)}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors flex items-center gap-1.5"
              >
                <Icon icon="mdi:download" className="w-4 h-4" />
                <span>다운로드</span>
              </button>
              <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                currentThread?.status === 'completed' ? 'bg-green-100 text-green-700' :
                currentThread?.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {currentThread?.status === 'completed' && '완료'}
                {currentThread?.status === 'in-progress' && '진행 중'}
                {currentThread?.status === 'pending' && '대기 중'}
              </div>
            </div>
          </div>

          {/* 메시지 영역 - 타임라인 스타일 */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-6"
            style={{
              background: 'linear-gradient(to bottom, #fafafa, #ffffff)',
            }}
          >
            <div className="max-w-4xl mx-auto">
              {/* 타임라인 컨테이너 */}
              <div className="relative pl-12">
                {/* 타임라인 세로선 - 아이콘 중심(20px)에 맞춤 */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-300" />
                
                {/* 메시지들 */}
                <div className="space-y-8">
                  {threadMessages.map((message, index) => (
                    <div key={message.id} className="relative flex items-start gap-6">
                      {/* 타임라인 아이콘 - 선 중앙에 배치 */}
                      <div className="relative z-10 flex-shrink-0 -ml-12">
                        {message.role === 'agency' && (
                          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center border-4 border-white shadow-md">
                            <Icon icon="mdi:alert-circle" className="w-4 h-4 text-white" />
                          </div>
                        )}
                        {message.role === 'system' && (
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center border-4 border-white shadow-md">
                            <Icon icon="mdi:send" className="w-4 h-4 text-white" />
                          </div>
                        )}
                        {message.role === 'user' && (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center border-4 border-white shadow-md">
                            <Icon icon="mdi:account" className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>

                      {/* 메시지 내용 */}
                      <div className="flex-1 min-w-0">
                        {message.role === 'agency' && (
                          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-sm font-bold text-red-600">{message.author || '신고기관'}</span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">{message.timestamp}</span>
                              {message.status === 'unread' && (
                                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold ml-auto">
                                  NEW
                                </span>
                              )}
                            </div>
                            <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                              {message.content}
                            </pre>
                          </div>
                        )}

                        {message.role === 'system' && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-sm font-bold text-blue-700">전파 전송</span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">{message.timestamp}</span>
                            </div>
                            {message.content ? (
                              <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                                {message.content}
                              </pre>
                            ) : (
                              <p className="text-sm text-red-500">내용이 없습니다</p>
                            )}
                          </div>
                        )}

                        {message.role === 'user' && (
                          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-4 text-white shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-sm font-semibold">담당자</span>
                              <span className="text-xs opacity-70">•</span>
                              <span className="text-xs opacity-80">{message.timestamp}</span>
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
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
          <div className="bg-white flex-shrink-0">
            <div className="p-4 max-w-[800px] mx-auto w-full">
              <div className="relative flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-500 transition-colors">
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
                  disabled={!messageInput.trim()}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #0066FF 0%, #8A2BE2 50%, #ff8566 100%)',
                  }}
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
                신고기관과의 소통 스레드입니다. 상황 진행 사항을 실시간으로 확인하세요.
              </p>
            </div>
          </div>

          {/* 탑 버튼 */}
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-white border-2 border-gray-300 shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-all hover:scale-110 z-50"
              aria-label="맨 위로"
            >
              <Icon icon="mdi:chevron-up" className="w-6 h-6" />
            </button>
          )}
        </main>
      </div>
    </ScaledLayout>
  );
};

export default PropagationPage;
