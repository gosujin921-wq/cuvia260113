import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ReportDownloadPopup from './ReportDownloadPopup';

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
  showCompletionButton?: boolean; // 시뮬레이션 종료 확인 버튼 표시
}

// 기본 신고 접수 내용 (하늘별빛경찰서)
const defaultReportContent = `🚨 실종자 신고 접수

▪ 신고 접수 정보

신고 기관: 하늘별빛경찰서
접수 시각: 오전 09:45:23
담당자: 김민수 경위

▪ 실종자 정보

이름/나이: 김도연 / 22세 (남)
인상착의: 회색 후드, 청바지, 흑색 짧은 머리, 176cm, 65kg
실종 장소: 은하로363번길 48 일원
실종 시각: 오전 09:30경

▪ 특이사항

⚠️ 장애 있음. 긴급 수색 요망.

보호자 진술에 따르면 평소 익숙한 경로를 벗어나지 않는 편이나, 
오늘 아침 집을 나선 후 연락이 두절됨.
휴대전화 위치추적 결과 은하로363번길 48 일대에서 마지막 신호 확인.`;

// 기본 더미 전파 내용
const defaultPropagationContent = `[112요청건/협조] 실종자 김도연(남/22) 동일인물 추정 연속포착 4건 공유드립니다.


🚨 1. 최신 포착(즉시 출동 기준)
10:35:56 / 별빛A-230 / 은하로363번길 48 / 유사도 95%
편의점 앞 체류 후 출입 반복, 전화 행동 확인 후 화면 상단 중앙 방향 이탈 관측


🚓 2. 최인근 파출소(출동 거점)
기준 지점(최신 포착지): 10:35:56 / 별빛A-230 / 은하로363번길 48
최인근 파출소: (파출소명) / 약 (거리)km

참고: 현장 출동·탐문 협조 시 해당 거점 우선 연계 부탁드립니다.


👤 3. 대상자 정보
성명/나이: 김도연 / 22세(남)
인상착의: 회색 후드, 청바지, 흑색 짧은 머리, 176cm / 65kg
실종 접수: 09:30경 은하로363번길 48 일원

🧭 4. 추적 판단 요약(방향/가능 동선)
남서 방향 이동 지속 추정(경로 적합도 83)
인접 CCTV 커버리지 중첩 구간으로 연속 추적 가능
체류 후 동일 방향 이탈 패턴 반복 관측


📡 5. 관제 확인 범위(현재 탐색 상태)
시간: 09:30~현재
범위: 은하로363번길 48 인근 및 인접 구간 반경 10km 확인
상기 범위 외 카메라는 아직 미확인 상태이며, 112에서 최신 목격정보/우선 확인 구역 회신 주시면 즉시 확대 확인 가능


🎯 6. 포착 현황(근거 상세)

🔎 (고속검색) 10:35:56 / 별빛A-230 / 은하로363번길 48 / 유사도 95%

· 편의점 앞 체류 후 출입 반복, 전화 행동 확인 후 화면 상단 중앙 방향 이탈 관측
🔗 (추적연계) 10:35:54 / 별빛A-444 / 은하로363번길 48

· 고속검색 후보와 외형·행동 패턴 일치로 연계 판단
🔗 (추적연계) 10:35:51 / 별빛A-498 / 달빛로301번길 54

· 고속검색 후보와 외형·행동 패턴 일치로 연계 판단
🔗 (추적연계) 10:12:31 / 별빛A-604 / 달빛로301번길 28

· 고속검색 후보와 외형·행동 패턴 일치로 연계 판단


🤝 7. 상호 협조(112 회신 요청)
112에서 최신 목격지/시간, 이동수단 여부, 외형변동(겉옷·모자·가방 등), 우선 확인 구역 회신 주시면
해당 조건으로 탐색 범위 즉시 갱신해 추가 확인 진행

추가 포착 또는 동선 변경 확인 시 바로 재전파


📎 8. 첨부
별빛A-230/444/498/604 포착 썸네일 및 클립
동선 지도(4지점 표시)


※ AI 분석 기반 추정 결과이며 최종 확인은 현장 판단 기준입니다.
관제 담당: 김쿠도 / 032-266-3454`;

// 112 회신: 실종자 발견 통보 (경찰관 답신)
const discoveryReportContent = `📢 [112 회신] 실종자 발견 통보

🚨 실종자 발견 통보

▪ 사건번호: 2026-02-23-별빛구-실종
▪ 대상자: 김도연 / 22세(남)


✅ 1. 발견 결과

발견 시각: 11:02:14
발견 장소: 달빛로301번길 54 인근 골목
발견 상태: 생명 징후 정상, 외상 없음

보호자 인계 예정
현장 출동 경찰관 확인 완료.


📍 2. 조치 사항

인근 수색 종료
추가 CCTV 탐색 중지 요청
119 이송 필요 없음


📡 3. 관제 협조 요청

관련 영상 백업 요청 (10:10~11:10 구간)
포착 지점 4건 자료 보존 요청


🔒 4. 상태 전환

해당 건 수색 종료 처리 요청드립니다.
추가 특이사항 발생 시 재통보 예정.

담당: 김민수 경위
하늘별빛경찰서`;

const PropagationListPanel: React.FC<PropagationListPanelProps> = ({
  isVisible,
  width = 700,
  onClose,
  onBackToInitial,
  captureItems = [],
}) => {
  const hasAddedDiscoveryRef = useRef(false);
  const [showReportDownloadPopup, setShowReportDownloadPopup] = useState(false);

  const handleClose = () => {
    onBackToInitial?.();
    onClose?.();
  };

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
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose, onBackToInitial]);

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
          // 1. 신고 접수 메시지 (하늘별빛경찰서)
          {
            id: 'msg-report',
            role: 'agency',
            content: defaultReportContent,
            timestamp: reportTime.toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            author: '하늘별빛경찰서',
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

  // 전파 패널 열림 시 2초 후 경찰관(112 회신) 답신 메시지 추가
  useEffect(() => {
    if (!isVisible) {
      hasAddedDiscoveryRef.current = false;
      return;
    }
    if (hasAddedDiscoveryRef.current) return;
    hasAddedDiscoveryRef.current = true;

    const timerId = window.setTimeout(() => {
      const discoveryId = `msg-discovery-${Date.now()}`;
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === currentThreadId
            ? {
                ...thread,
                messages: [
                  ...thread.messages,
                  {
                    id: discoveryId,
                    role: 'agency' as const,
                    content: discoveryReportContent,
                    timestamp: new Date().toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    }),
                    author: '하늘별빛경찰서',
                    status: 'unread' as const,
                    showCompletionButton: true as const,
                  },
                ],
                status: 'completed' as const,
              }
            : thread
        )
      );
    }, 2000);

    return () => window.clearTimeout(timerId);
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

  const handleSendMessage = () => {
    const text = messageInput.trim();
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
        onClick={handleClose}
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
                onClick={handleClose}
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
                  type="button"
                  onClick={() => setShowReportDownloadPopup(true)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors flex items-center gap-1.5"
                  aria-label="사건 처리 결과 보고서 다운로드"
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

                      {/* 오른쪽 정렬: system (전파 전송), user (담당자) - 발신 메시지 */}
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
                                        const isSection = paragraph.startsWith('👤') || paragraph.startsWith('📡') || paragraph.startsWith('🎯') || paragraph.startsWith('🧭') || paragraph.startsWith('🤝') || paragraph.startsWith('📎') || paragraph.startsWith('🚨') || paragraph.startsWith('🚓') || paragraph.startsWith('🔎') || paragraph.startsWith('🔗') || paragraph.startsWith('📍') || paragraph.startsWith('🔒');
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
                                  <span className="text-sm font-semibold text-blue-600">담당자</span>
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

      {/* 보고서다운로드 팝업 */}
      <ReportDownloadPopup
        isOpen={showReportDownloadPopup}
        onClose={() => setShowReportDownloadPopup(false)}
      />
    </>
  );
};

export default PropagationListPanel;
