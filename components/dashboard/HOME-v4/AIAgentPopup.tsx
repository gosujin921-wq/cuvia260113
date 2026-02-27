import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { useChatStream } from '@/src/hooks/useChatStream';
import type { MapStreamData, ChartStreamData } from '@/types/streamJson.types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

interface AIAgentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  hideControls?: boolean;
  /** 축소 모드일 때 위치 오버라이드 (예: 신고팝업 아래) */
  position?: { top?: string; right?: string; left?: string; bottom?: string };
  /** 고속검색 리스트 카드 개수 (첫 대화 문구용) */
  listCardCount?: number;
  /** 삭제/제거 등 delete류 문장 전송 시 호출. rawMessage로 속성 파싱 후 리스트 숨김에 사용. 파싱된 속성 배열 반환 */
  onDeleteLikeRequest?: (payload: { rawMessage: string }) => string[];
  /** 축소 모드일 때 최대 높이(px). 플로팅 버튼을 넘지 않도록 부모에서 계산해 전달 */
  maxHeight?: number;
  /** 재검색 완료 후 삭제 결과 정보 (요구조건, 삭제 건수) */
  reSearchResult?: { excludedAttributes: string[]; deletedCount: number } | null;
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
  /** 2키: 추적 갱신 메시지 표시 (차량 재포착, 번호판 후보) */
  showFeaturedLayout?: boolean;
  /** "포착된 CCTV 영상 포함해서 전파 초안 생성해줘" 입력 시 호출 - 별빛A-655 캡처 애니메이션 후 포착목록 추가 */
  onPropagationDraftRequest?: () => void;
  /** "사건 영상 바로 보기" 버튼 클릭 시 호출 - 고속검색 팝업 표시 */
  onVideoView?: () => void;
  /** 스트림에서 map 타입 데이터 수신 시 호출 */
  onMapDataReceived?: (data: MapStreamData) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  type?: 'normal' | 'analyzing' | 'streaming-step';
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
  htmlContent?: string;
  stepMessage?: string;
  /** 스트림 type: 'chart' 수신 시 차트 데이터 */
  chartData?: ChartStreamData | null;
}

const AGENT_GRADIENT = 'linear-gradient(135deg, #0066FF 0%, #8A2BE2 50%, #ff8566 100%)';

// Chart.js 등록 (한 번만)
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const CHART_COLORS = [
  'rgba(255, 99, 132, 0.6)',
  'rgba(54, 162, 235, 0.6)',
  'rgba(255, 206, 86, 0.6)',
  'rgba(75, 192, 192, 0.6)',
  'rgba(153, 102, 255, 0.6)',
];

const getChartOptions = (title: string): ChartOptions<'bar' | 'line' | 'pie' | 'doughnut'> => ({
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { position: 'top' as const },
    title: { display: !!title, text: title },
  },
});

/** 스트림 chart 타입 데이터를 Chart.js로 렌더링 */
const StreamChart: React.FC<{ data: ChartStreamData }> = ({ data }) => {
  const chartType = (data.type || 'bar').toLowerCase();
  const labels = data.labels ?? [];
  const datasets = (data.datasets ?? []).map((ds, i) => ({
    label: ds.label ?? `데이터 ${i + 1}`,
    data: ds.data ?? [],
    backgroundColor: ds.backgroundColor ?? CHART_COLORS[i % CHART_COLORS.length],
  }));

  const chartData = {
    labels,
    datasets,
  };

  const options = getChartOptions(data.title ?? '');

  if (chartType === 'line') {
    return (
      <div className="w-full max-w-md h-64">
        <Line data={chartData} options={options as ChartOptions<'line'>} />
      </div>
    );
  }
  if (chartType === 'pie') {
    return (
      <div className="w-full max-w-xs h-64 mx-auto">
        <Pie data={chartData} options={options as ChartOptions<'pie'>} />
      </div>
    );
  }
  if (chartType === 'doughnut') {
    return (
      <div className="w-full max-w-xs h-64 mx-auto">
        <Doughnut data={chartData} options={options as ChartOptions<'doughnut'>} />
      </div>
    );
  }
  return (
    <div className="w-full max-w-md h-64">
      <Bar data={chartData} options={options as ChartOptions<'bar'>} />
    </div>
  );
};

// 메시지 렌더링 공통 컴포넌트
interface MessageListProps {
  messages: ChatMessage[];
  isResponding: boolean;
  listCardCount: number;
  cameraCount: number;
  isExpanded: boolean;
  onObjectTrackingStart?: () => void;
  onVideoView?: () => void;
  trackingUpdateMsgContent?: ReturnType<typeof getTrackingUpdateMsgContent>;
}

/** 초기 환영 문구 (채팅 시작 시 한 번만 표시) */
const WELCOME_TEXT = '안녕하세요. Agent Chat에 오신 것을 환영합니다. 어떤 도움이 필요하신가요?';

const getTrackingUpdateMsgContent = () => {
  const timeStr = new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return {
    title: '[추적 갱신] 차량 재포착, 번호판 후보 확보',
    camera: `카메라: 별빛A-655 | 시각: ${timeStr}`,
    match: '"차종/색상/외형 특징 일치(추정)."',
    plate: '"부분 번호판 후보: *12 324* **(가시성: 높음)**"',
    direction: '이동 방향: 동 방향 진행',
    body: '이동 중인 차량으로 추정되어 골든타임 확보를 위해 112 우선 전파를 권고합니다.',
    btnPropagate: '▶ 관할 경찰서에 전파하기',
  };
};

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isResponding,
  listCardCount,
  cameraCount,
  isExpanded,
  onObjectTrackingStart,
  onVideoView,
  trackingUpdateMsgContent,
}) => {
  const trackingContent = trackingUpdateMsgContent ?? getTrackingUpdateMsgContent();
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
                    {message.id !== 'object-tracking-progress' && (
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">AI 분석 중</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {message.content}{message.processingTime ? ` (처리 : ${message.processingTime}초, 전송 : ${message.transmissionTime}초)` : ''}
                        </p>
                      </div>
                    )}
                    
                    {/* 재검색 단계별 표시 */}
                    {message.id === 're-search-progress' && message.totalSteps === 3 && (
                      <div className="space-y-2 mb-3 text-xs">
                        <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <Icon icon={(message.currentStep || 0) > 1 ? 'mdi:check-circle' : (message.currentStep || 0) === 1 ? 'mdi:loading' : 'mdi:circle-outline'} className={`w-4 h-4 ${(message.currentStep || 0) === 1 ? 'animate-spin' : ''}`} />
                          <span>1. 조건 필터링 {(message.currentStep || 0) === 1 && '⏳'}</span>
                        </div>
                        <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <Icon icon={(message.currentStep || 0) > 2 ? 'mdi:check-circle' : (message.currentStep || 0) === 2 ? 'mdi:loading' : 'mdi:circle-outline'} className={`w-4 h-4 ${(message.currentStep || 0) === 2 ? 'animate-spin' : ''}`} />
                          <span>2. 결과 재정렬 {(message.currentStep || 0) === 2 && '⏳'}</span>
                        </div>
                        <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <Icon icon={(message.currentStep || 0) > 3 ? 'mdi:check-circle' : (message.currentStep || 0) === 3 ? 'mdi:loading' : 'mdi:circle-outline'} className={`w-4 h-4 ${(message.currentStep || 0) === 3 ? 'animate-spin' : ''}`} />
                          <span>3. 화면 업데이트 {(message.currentStep || 0) === 3 && '⏳'}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* 고속검색 단계별 표시 */}
                    {message.id === 'fast-search-progress' && message.totalSteps === 5 && (
                      <div className="space-y-2 mb-3 text-xs">
                        <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <Icon icon={(message.currentStep || 0) > 1 ? 'mdi:check-circle' : 'mdi:circle-outline'} className="w-4 h-4" />
                          <span>1. 사건 위치 기준 검색 범위 설정 {(message.currentStep || 0) === 1 && '✅'}</span>
                        </div>
                        <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <Icon icon={(message.currentStep || 0) > 2 ? 'mdi:check-circle' : (message.currentStep || 0) === 2 ? 'mdi:loading' : 'mdi:circle-outline'} className={`w-4 h-4 ${(message.currentStep || 0) === 2 ? 'animate-spin' : ''}`} />
                          <span>2. CCTV 목록 불러오기 {(message.currentStep || 0) === 2 && '✅'}</span>
                        </div>
                        <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <Icon icon={(message.currentStep || 0) > 3 ? 'mdi:check-circle' : (message.currentStep || 0) === 3 ? 'mdi:loading' : 'mdi:circle-outline'} className={`w-4 h-4 ${(message.currentStep || 0) === 3 ? 'animate-spin' : ''}`} />
                          <span>3. 특징 조건 적용(신고 내용) {(message.currentStep || 0) === 3 && '⏳'}</span>
                        </div>
                        <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 4 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <Icon icon={(message.currentStep || 0) > 4 ? 'mdi:check-circle' : (message.currentStep || 0) === 4 ? 'mdi:loading' : 'mdi:circle-outline'} className={`w-4 h-4 ${(message.currentStep || 0) === 4 ? 'animate-spin' : ''}`} />
                          <span>4. 후보 탐색 및 유사도 점수 계산 {(message.currentStep || 0) === 4 && '…'}</span>
                        </div>
                        <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 5 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <Icon icon={(message.currentStep || 0) > 5 ? 'mdi:check-circle' : (message.currentStep || 0) === 5 ? 'mdi:loading' : 'mdi:circle-outline'} className={`w-4 h-4 ${(message.currentStep || 0) === 5 ? 'animate-spin' : ''}`} />
                          <span>5. 결과 정렬 및 화면 준비 {(message.currentStep || 0) === 5 && '…'}</span>
                        </div>
                        
                        {/* 5단계에서 카메라 카운트 표시 */}
                        {(message.currentStep || 0) === 5 && cameraCount > 0 && (
                          <div className="mt-2 text-blue-600 font-medium">
                            후보를 탐색하고 있습니다… (카메라 {cameraCount}대 확인 중)
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* 객체 추적 단계별 표시 */}
                    {message.id === 'object-tracking-progress' && message.totalSteps === 4 && (
                      <div className="space-y-3 mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-2">AI 분석중</h3>
                          <p className="text-xs text-gray-600 mb-1">추적 대상: 차량 1대 · 관련 인물 2명(추정)</p>
                          <p className="text-xs text-gray-600">추적 범위: 반경 2km · CCTV 42대 · 최근 20분</p>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <Icon icon={(message.currentStep || 0) > 1 ? 'mdi:check-circle' : (message.currentStep || 0) === 1 ? 'mdi:loading' : 'mdi:circle-outline'} className={`w-4 h-4 flex-shrink-0 ${(message.currentStep || 0) === 1 ? 'animate-spin' : ''}`} />
                            <span>1. 차량 트랙 생성 및 재포착 감시(실시간)</span>
                          </div>
                          <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <Icon icon={(message.currentStep || 0) > 2 ? 'mdi:check-circle' : (message.currentStep || 0) === 2 ? 'mdi:loading' : 'mdi:circle-outline'} className={`w-4 h-4 flex-shrink-0 ${(message.currentStep || 0) === 2 ? 'animate-spin' : ''}`} />
                            <span>2. 번호판 후보 프레임 자동 선별(가시성 높은 프레임 우선)</span>
                          </div>
                          <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <Icon icon={(message.currentStep || 0) > 3 ? 'mdi:check-circle' : (message.currentStep || 0) === 3 ? 'mdi:loading' : 'mdi:circle-outline'} className={`w-4 h-4 flex-shrink-0 ${(message.currentStep || 0) === 3 ? 'animate-spin' : ''}`} />
                            <span>3. 예상 이동 경로 계산 및 다음 CCTV 우선순위 갱신</span>
                          </div>
                          <div className={`flex items-center gap-2 ${(message.currentStep || 0) >= 4 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <Icon icon={(message.currentStep || 0) > 4 ? 'mdi:check-circle' : (message.currentStep || 0) === 4 ? 'mdi:loading' : 'mdi:circle-outline'} className={`w-4 h-4 flex-shrink-0 ${(message.currentStep || 0) === 4 ? 'animate-spin' : ''}`} />
                            <span>4. 동행자(남/여) 동반 포착 여부 동시 탐색</span>
                          </div>
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
                            <h4 className="text-gray-900 font-semibold text-sm">1. 한 줄 결론</h4>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: message.analysisResult.conclusion.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        </div>

                        {/* 사건 요약 */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4" style={{ borderWidth: '1px' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Icon icon="mdi:file-document-outline" className="w-4 h-4 text-blue-600" />
                            <h4 className="text-gray-900 font-semibold text-sm">2. 사건 요약</h4>
                          </div>
                          <div className="space-y-1.5 text-sm">
                            <div className="text-gray-700">
                              <span className="text-gray-500">- 발생 시각:</span> {message.analysisResult.summary.time}
                            </div>
                            <div className="text-gray-700">
                              <span className="text-gray-500">- 위치/카메라:</span> {message.analysisResult.summary.location}
                            </div>
                            <div className="text-gray-700">
                              <span className="text-gray-500">- 관여 인원(추정):</span> {message.analysisResult.summary.personnel}
                            </div>
                            <div className="text-gray-700">
                              <span className="text-gray-500">- 진행 상태:</span> {message.analysisResult.summary.status}
                            </div>
                            <div className="text-gray-700">
                              <span className="text-gray-500">- 위험도:</span> <span dangerouslySetInnerHTML={{ __html: message.analysisResult.summary.riskLevel.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            </div>
                          </div>
                        </div>

                        {/* 근거 */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4" style={{ borderWidth: '1px' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Icon icon="mdi:clipboard-text" className="w-4 h-4 text-blue-600" />
                            <h4 className="text-gray-900 font-semibold text-sm">3. 근거</h4>
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
                            <h4 className="text-gray-900 font-semibold text-sm">4. 대응 추천</h4>
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
                ) : message.type === 'streaming-step' ? (
                  <>
                    {!isExpanded && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-900 font-semibold text-sm">CUVIA Agent</span>
                      </div>
                    )}
                    <div className={`${isExpanded ? 'max-w-[70%] px-4 py-2 rounded-2xl border bg-gray-100 text-gray-900 border-gray-200' : 'rounded-xl border border-gray-200 bg-gray-50 p-4'}`} style={isExpanded ? { borderWidth: '1px' } : {}}>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Icon icon="mdi:loading" className="w-4 h-4 animate-spin text-blue-500" />
                        <span>{message.stepMessage || '처리 중...'}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">{message.timestamp}</div>
                    </div>
                  </>
                ) : (
                  <>
                    {!isExpanded && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-900 font-semibold text-sm">CUVIA Agent</span>
                      </div>
                    )}
                    <div className={`${isExpanded ? 'max-w-[70%] px-4 py-2 rounded-2xl border bg-gray-100 text-gray-900 border-gray-200' : 'rounded-xl border border-gray-200 bg-gray-50 p-4'}`} style={isExpanded ? { borderWidth: '1px' } : {}}>
                      {message.id === 'tracking-update-msg' ? (
                        <div className="space-y-3">
                          {message.isTyping ? (
                            <>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                                {message.displayedContent ?? ''}
                                <span className="inline-block w-1 h-4 bg-gray-700 ml-0.5 animate-pulse align-middle" aria-hidden="true" />
                              </p>
                              <div className="text-xs text-gray-500 pt-1">{message.timestamp}</div>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-semibold text-gray-900">{trackingContent.title}</p>
                              <p className="text-xs text-gray-600">{trackingContent.camera}</p>
                              <p className="text-xs text-gray-600">{trackingContent.match}</p>
                              <p className="text-xs text-gray-600" dangerouslySetInnerHTML={{ __html: trackingContent.plate.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<strong>$1</strong>') }} />
                              <p className="text-xs text-gray-600">{trackingContent.direction}</p>
                              <p className="text-sm leading-relaxed text-gray-700">{trackingContent.body}</p>
                              <button
                                type="button"
                                className="px-3 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors w-full"
                                aria-label="관할 경찰서에 전파하기"
                              >
                                {trackingContent.btnPropagate}
                              </button>
                              <div className="text-xs text-gray-500 pt-1">{message.timestamp}</div>
                            </>
                          )}
                        </div>
                      ) : message.id === 'welcome-msg' ? (
                        <>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                            {message.displayedContent ?? message.content ?? ''}
                          </p>
                          <div className="text-xs text-gray-500 pt-1">{message.timestamp}</div>
                        </>
                      ) : message.chartData ? (
                        <>
                          {message.htmlContent && (
                            <div
                              className="text-sm leading-relaxed text-gray-700 agent-html-content mb-3"
                              dangerouslySetInnerHTML={{ __html: message.htmlContent }}
                            />
                          )}
                          <div className="rounded-lg border border-gray-200 bg-white p-3 overflow-hidden">
                            <StreamChart data={message.chartData} />
                          </div>
                          <div className={`text-xs text-gray-500 ${isExpanded ? 'mt-1' : 'mt-2'}`}>
                            {message.timestamp}
                          </div>
                        </>
                      ) : message.htmlContent ? (
                        <>
                          <div
                            className="text-sm leading-relaxed text-gray-700 agent-html-content"
                            dangerouslySetInnerHTML={{ __html: message.htmlContent }}
                          />
                          <div className={`text-xs text-gray-500 ${isExpanded ? 'mt-1' : 'mt-2'}`}>
                            {message.timestamp}
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                            {message.isTyping ? message.displayedContent : message.content}
                            {message.isTyping && <span className="inline-block w-1 h-4 bg-gray-700 ml-0.5 animate-pulse" />}
                          </p>
                          <div className={`text-xs text-gray-500 ${isExpanded ? 'mt-1' : 'mt-2'}`}>
                            {message.timestamp}
                          </div>
                        </>
                      )}
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
  placeholder = "검색 조건을 자연어로 입력해 주세요.",
}) => {
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
              aria-label="도구 열기"
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
            placeholder={placeholder}
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
              aria-label="답변 취소"
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
              aria-label="전송"
            >
              <img
                src="/simbol.svg"
                alt="전송"
                className="w-5 h-5"
                style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }}
              />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          <span className="font-semibold">{isExpanded ? 'CUVIA Agent' : 'CUVIA Link'}</span>는 실수를 할 수 있습니다. 중요한 정보는 재차 확인하세요.
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
  onDeleteLikeRequest, 
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
  showFeaturedLayout = false,
  onPropagationDraftRequest,
  onVideoView,
  onMapDataReceived,
}) => {
  const [slideEntered, setSlideEntered] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [trackingUpdateMsgContent, setTrackingUpdateMsgContent] = useState<ReturnType<typeof getTrackingUpdateMsgContent> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSlideEntered(false);
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(() => setSlideEntered(true));
      });
      return () => cancelAnimationFrame(t);
    } else {
      setSlideEntered(false);
    }
  }, [isOpen]);

  // 팝업 열릴 때 welcome 메시지가 없으면 초기 문구로 설정
  useEffect(() => {
    if (!isOpen) return;
    setMessages((prev) => {
      const hasWelcome = prev.some((msg) => msg.id === 'welcome-msg');
      if (hasWelcome) {
        return prev.map((msg) =>
          msg.id === 'welcome-msg'
            ? { ...msg, content: WELCOME_TEXT, displayedContent: WELCOME_TEXT }
            : msg
        );
      }
      return [{ id: 'welcome-msg', role: 'assistant' as const, content: WELCOME_TEXT, timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), displayedContent: WELCOME_TEXT }, ...prev];
    });
  }, [isOpen]);
  const [inputKey, setInputKey] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 객체 추적 상태일 때 프로그래스 메시지 추가
  useEffect(() => {
    if (isObjectTracking) {
      setChatInput('');
      
      // 이미 프로그래스 메시지가 있는지 확인
      setMessages((prev) => {
        const hasObjectTrackingProgress = prev.some(msg => 
          msg.id === 'object-tracking-progress' && msg.type === 'analyzing'
        );
        
        if (hasObjectTrackingProgress) {
          return prev;
        }
        
        // 객체 추적 프로그래스 메시지 추가
        const progressMessage: ChatMessage = {
          id: 'object-tracking-progress',
          role: 'assistant',
          content: '',
          timestamp: new Date().toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          type: 'analyzing',
          progress: 0,
          currentStep: 1,
          totalSteps: 4,
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
              
              // 4단계 진행 (25%, 50%, 75%, 100%)
              const progressPercent = newProgress * 100;
              if (progressPercent >= 25 && newStep < 2) newStep = 2;
              if (progressPercent >= 50 && newStep < 3) newStep = 3;
              if (progressPercent >= 75 && newStep < 4) newStep = 4;
              
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
      content: WELCOME_TEXT,
      timestamp: new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      displayedContent: WELCOME_TEXT,
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

  // 스트림 메시지 ID ref (스트림 중 업데이트용)
  const streamMessageIdRef = useRef<string | null>(null);

  // onMapDataReceived ref (의존성 배열에서 제외하기 위함)
  const onMapDataReceivedRef = useRef(onMapDataReceived);
  onMapDataReceivedRef.current = onMapDataReceived;

  // Chat Stream 훅
  const chatStream = useChatStream({
    onChartDataReceived: useCallback((data: ChartStreamData) => {
      const msgId = streamMessageIdRef.current;
      if (!msgId) return;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === msgId ? { ...msg, type: 'normal' as const, chartData: data } : msg
        )
      );
    }, []),
    onStepChange: useCallback((step: number, message: string) => {
      const msgId = streamMessageIdRef.current;
      if (!msgId) return;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === msgId
            ? { ...msg, stepMessage: message, currentStep: step }
            : msg
        )
      );
    }, []),
    onMessageReceived: useCallback((content: string) => {
      const msgId = streamMessageIdRef.current;
      if (!msgId) return;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === msgId
            ? { ...msg, type: 'normal', htmlContent: content, stepMessage: undefined }
            : msg
        )
      );
    }, []),
    onMapDataReceived: useCallback((data: MapStreamData) => {
      onMapDataReceivedRef.current?.(data);
    }, []),
    onComplete: useCallback((success: boolean, message: string, data?: { chart_data?: ChartStreamData | null }) => {
      const msgId = streamMessageIdRef.current;
      if (!msgId) return;
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== msgId) return msg;
          const next: ChatMessage = {
            ...msg,
            type: 'normal',
            htmlContent: message,
            stepMessage: undefined,
          };
          if (data?.chart_data) next.chartData = data.chart_data;
          return next;
        })
      );
      setIsResponding(false);
      streamMessageIdRef.current = null;
    }, []),
    onError: useCallback((error: string) => {
      const msgId = streamMessageIdRef.current;
      if (msgId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === msgId
              ? { ...msg, type: 'normal', content: `오류가 발생했습니다: ${error}`, stepMessage: undefined }
              : msg
          )
        );
      }
      setIsResponding(false);
      streamMessageIdRef.current = null;
    }, []),
  });

  // 팝업 열릴 때 세션 초기화
  useEffect(() => {
    if (isOpen) {
      chatStream.initSession();
    }
  }, [isOpen, chatStream.initSession]);

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
    const container = scrollContainerRef.current;
    if (!container) return;

    // 프로그래스 메시지 업데이트 시에는 스크롤하지 않음 (화면 튐 방지)
    const hasProgressUpdate = messages.some(msg =>
      msg.type === 'analyzing' && (msg.progress || 0) > 0 && (msg.progress || 0) < 1
    );

    if (!hasProgressUpdate) {
      // requestAnimationFrame으로 DOM 업데이트 후 스크롤 적용
      const rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        });
      });
      return () => cancelAnimationFrame(rafId);
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
      timestamp: new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
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
        content: '고속검색을 시작합니다.',
        timestamp: new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
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
                  
                  const welcomeMessage: ChatMessage = {
                    id: 'welcome-msg',
                    role: 'assistant',
                    content: WELCOME_TEXT,
                    displayedContent: WELCOME_TEXT,
                    timestamp: new Date().toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    }),
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

  // 2키: 추적 갱신 메시지 추가 (차량 재포착, 번호판 후보) + 타이핑 애니메이션
  const lastShowFeaturedLayoutRef = useRef<boolean>(false);
  const trackingUpdateTypingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (showFeaturedLayout && !lastShowFeaturedLayoutRef.current) {
      lastShowFeaturedLayoutRef.current = true;
      const content = getTrackingUpdateMsgContent();
      setTrackingUpdateMsgContent(content);
      const fullText = [
        content.title,
        content.camera,
        content.match,
        '"부분 번호판 후보: 12 324 (가시성: 높음)"',
        content.direction,
        content.body,
      ].join('\n');
      const trackingUpdateMessage: ChatMessage = {
        id: 'tracking-update-msg',
        role: 'assistant',
        content: fullText,
        timestamp: new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        type: 'normal',
        isTyping: true,
        displayedContent: '',
      };
      setMessages((prev) => [...prev, trackingUpdateMessage]);

      let currentIndex = 0;
      trackingUpdateTypingRef.current = setInterval(() => {
        currentIndex++;

        if (currentIndex <= fullText.length) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === 'tracking-update-msg'
                ? { ...msg, displayedContent: fullText.substring(0, currentIndex) }
                : msg
            )
          );
        } else {
          if (trackingUpdateTypingRef.current) {
            clearInterval(trackingUpdateTypingRef.current);
            trackingUpdateTypingRef.current = null;
          }
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === 'tracking-update-msg'
                ? { ...msg, isTyping: false, displayedContent: fullText }
                : msg
            )
          );
        }
      }, 25);
    }
    if (!showFeaturedLayout) {
      lastShowFeaturedLayoutRef.current = false;
    }

    return () => {
      if (trackingUpdateTypingRef.current) {
        clearInterval(trackingUpdateTypingRef.current);
        trackingUpdateTypingRef.current = null;
      }
    };
  }, [showFeaturedLayout]);

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
          content: '마지막 포착 이후 이동 경로를 기준으로 다음 포착 가능 CCTV 예측을 완료 했습니다.',
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
      const fullContent = '마지막 포착 이후 이동 경로를 기준으로 다음 포착 가능 CCTV 예측을 완료 했습니다.';
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
      const { excludedAttributes, deletedCount } = reSearchResult;
      const isResultReSearchButton = excludedAttributes.some((a) => a.includes('대표 후보'));
      const fullContent = isResultReSearchButton
        ? `대표 후보 기반 재분석이 완료되었습니다.\n현재 결과를 토대로 객체 추적을 진행하거나 조건을 추가 입력해 후보를 정밀화하세요.`
        : `${excludedAttributes.join(', ')} 조건이 적용되어 ${deletedCount}건이 제외되었습니다.`;
      
      const messageId = `assistant-research-${Date.now()}`;
      const resultMessage: ChatMessage = {
        id: messageId,
        role: 'assistant',
        content: fullContent,
        timestamp: new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
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

  const isDeleteLikeMessage = (text: string): boolean => {
    const deleteKeywords = ['숨김', '숨겨', '삭제', '빼줘', '빼주', '제거', '없애', '지워', '삭제해', '제거해', '제외', '빼줘요', '삭제해줘', '제거해줘', '지워줘', '없애줘'];
    const t = text.trim();
    return deleteKeywords.some(kw => t.includes(kw));
  };

  const isObjectTrackingMessage = (text: string): boolean => {
    return text.includes('객체 추적을 시작해 주세요') || text.includes('객체 추적');
  };

  const generateAssistantReply = (prompt: string): ChatMessage => {
    if (isObjectTrackingMessage(prompt)) {
      return {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '마지막 포착 이후 이동 경로를 기준으로 다음 포착 가능 CCTV를 예측하겠습니다.',
        timestamp: new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        type: 'analyzing',
        progress: 0,
        currentStep: 1,
        totalSteps: 5,
      };
    }
    return {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: `"${prompt}"에 대한 응답입니다. Agent Chat에서 다양한 기능을 사용할 수 있습니다.`,
      timestamp: new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      type: 'normal',
    };
  };

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

    const isPropagationDraftMessage = (t: string) =>
      t.includes('포착된 CCTV 영상 포함해서 전파 초안 생성해줘');

    if (isPropagationDraftMessage(text) && onPropagationDraftRequest) {
      onPropagationDraftRequest();
      return;
    }

    if (isDeleteLikeMessage(text) && onDeleteLikeRequest) {
      const parsedAttributes = onDeleteLikeRequest({ rawMessage: text });
      
      // 파싱된 속성이 없으면 (존재하지 않는 속성)
      if (!parsedAttributes || parsedAttributes.length === 0) {
        setIsResponding(true);
        
        // 고민하는 아이콘 표시 (700ms)
        setTimeout(() => {
          const fullContent = `"${text}"에 대한 정보가 없습니다. 더 구체적인 속성을 입력해 주세요.`;
          const errorMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: fullContent,
            timestamp: new Date().toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            type: 'normal',
            isTyping: true,
            displayedContent: '',
          };
          setMessages((prev) => [...prev, errorMessage]);
          setIsResponding(false);
          
          // 타이핑 애니메이션
          let currentIndex = 0;
          
          const typingInterval = setInterval(() => {
            currentIndex++;
            
            if (currentIndex <= fullContent.length) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === errorMessage.id
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
                  msg.id === errorMessage.id
                    ? { ...msg, isTyping: false, displayedContent: fullContent }
                    : msg
                )
              );
            }
          }, 30);
          typingIntervalRef.current = typingInterval;
        }, 700);
      } else {
        // 파싱된 속성이 있으면 재검색 프로그래스 표시
        setIsReSearching(true);
        setIsResponding(true);
        
        // 재검색 시작 콜백 호출
        if (onReSearchStart) {
          onReSearchStart();
        }
        
        // 재검색 프로그래스 메시지 추가
        setTimeout(() => {
          const progressMessage: ChatMessage = {
            id: 're-search-progress',
            role: 'assistant',
            content: '조건에 맞는 결과를 재검색하고 있습니다.',
            timestamp: new Date().toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            type: 'analyzing',
            progress: 0,
            currentStep: 1,
            totalSteps: 3,
          };
          setMessages((prev) => [...prev, progressMessage]);
          
          // 프로그래스 애니메이션 (3단계, 각 500ms)
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
              // 완료 후 프로그래스 메시지 제거 (재검색 결과는 useEffect에서 추가됨)
              setTimeout(() => {
                setMessages((prev) => prev.filter((msg) => msg.id !== 're-search-progress'));
                setIsReSearching(false);
                setIsResponding(false);
                
                // 재검색 완료 콜백 호출
                if (onReSearchComplete) {
                  onReSearchComplete();
                }
              }, 500);
            }
          }, 500);
        }, 700);
      }
      return;
    }

    // 객체 추적 메시지인 경우 먼저 시작 콜백 호출하고 리턴 (프로그래스는 다이얼로그 확인 후 실행)
    if (isObjectTrackingMessage(text) && onObjectTrackingStart) {
      onObjectTrackingStart();
      return;
    }

    // 스트림 API 호출
    setIsResponding(true);

    const streamMsgId = `stream-${Date.now()}`;
    streamMessageIdRef.current = streamMsgId;

    const streamMessage: ChatMessage = {
      id: streamMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      type: 'streaming-step',
      stepMessage: '응답 준비 중...',
    };

    setMessages((prev) => [...prev, streamMessage]);
    chatStream.startStream(text);
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
          className="fixed inset-y-0 right-0 transition-all duration-300 ease-out"
          onClick={(e) => e.stopPropagation()}
          style={{
            zIndex: 90,
            transform: slideEntered ? 'translateX(0)' : 'translateX(100%)',
            opacity: slideEntered ? 1 : 0,
          }}
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
                aria-label="축소"
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
                  onObjectTrackingStart={onObjectTrackingStart}
                  onVideoView={onVideoView}
                  trackingUpdateMsgContent={trackingUpdateMsgContent ?? undefined}
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
              placeholder={isObjectTracking ? "검색된 내용으로 객체 추적을 시작해 주세요." : "검색 조건을 자연어로 입력해 주세요."}
            />
          </div>
        </div>
      ) : (
        <div
          className="absolute"
          style={
            positionOverride
              ? {
                  position: 'absolute' as const,
                  ...positionOverride,
                  zIndex: 90,
                  transform: slideEntered ? 'translateX(0)' : 'translateX(100%)',
                  opacity: slideEntered ? 1 : 0,
                  transition: 'transform 0.3s ease-out, opacity 0.3s ease-out, top 0.3s ease-out, right 0.3s ease-out',
                }
              : {
                  top: `${padding + mainPopupHeight + gap + (hideControls ? 56 : 0)}px`,
                  right: `${padding}px`,
                  zIndex: 90,
                  transform: slideEntered ? 'translateX(0)' : 'translateX(100%)',
                  opacity: slideEntered ? 1 : 0,
                  transition: 'transform 0.3s ease-out, opacity 0.3s ease-out, top 0.3s ease-out, right 0.3s ease-out',
                }
          }
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="flex flex-col rounded-2xl bg-white border border-gray-200 shadow-lg relative overflow-hidden w-[420px] transition-[height] duration-300 ease-out"
            style={{ height: maxHeightProp ?? 600 }}
          >
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
                aria-label={isExpanded ? '축소' : '확장'}
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
                  onObjectTrackingStart={onObjectTrackingStart}
                  onVideoView={onVideoView}
                  trackingUpdateMsgContent={trackingUpdateMsgContent ?? undefined}
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
              placeholder={isObjectTracking ? "검색된 내용으로 객체 추적을 시작해 주세요." : "검색 조건을 자연어로 입력해 주세요."}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AIAgentPopup;
