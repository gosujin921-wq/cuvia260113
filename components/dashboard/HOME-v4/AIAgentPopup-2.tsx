import React, { useEffect, useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';

interface AIAgentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  hideControls?: boolean;
  /** 축소 모드일 때 위치 오버라이드 (예: 신고팝업 아래) */
  position?: { top?: string; right?: string; left?: string; bottom?: string };
  /** 축소 모드일 때 최대 높이(px). 플로팅 버튼을 넘지 않도록 부모에서 계산해 전달 */
  maxHeight?: number;
  /** 플로팅 바에서 전송 시 첫 메시지 (팝업 열릴 때 처리) */
  initialMessage?: string | null;
  /** initialMessage 처리 완료 시 호출 (부모에서 상태 클리어용) */
  onInitialMessageProcessed?: () => void;
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
  isTyping?: boolean; // 타이핑 중인지 여부
  displayedContent?: string; // 현재 표시된 내용
  /** 지난달 사건사고 요약 전용 메시지 */
  incidentSummary?: true;
}

const AGENT_GRADIENT = 'linear-gradient(135deg, #0066FF 0%, #8A2BE2 50%, #ff8566 100%)';

// 메시지 렌더링 공통 컴포넌트
interface MessageListProps {
  messages: ChatMessage[];
  isResponding: boolean;
  isExpanded: boolean;
}

const INCIDENT_SUMMARY_TABLE_ROWS = [
  { category: '총 발생', status: '4393건', analysis: '전월 대비 43.0% 감소' },
  { category: '주요 유형', status: '전체', analysis: '집중 관리 필요' },
  { category: '취약 시간', status: '수요일 21:00 (집중)', analysis: '순찰 강화 권장' },
  { category: '발생 패턴', status: '특정 지역 집중', analysis: 'CCTV 사각지대 점검' },
  { category: '조치 권고', status: '순찰차 거점 배치', analysis: '가로등 조도 개선' },
];

const ADDITIONAL_POPUP1_TABLE_DATA = [
  { date: '2026-03-03', time: '23:59', type: '폭력', location: '경기도 부천시 소사본1동', cctv: 'BC_소사본1동_002' },
  { date: '2026-03-03', time: '22:09', type: '폭력', location: '경기도 부천시 고강1동', cctv: 'BC_고강1동_007' },
  { date: '2026-03-03', time: '05:09', type: '폭력', location: '경기도 부천시 소사본1동', cctv: 'BC_소사본1동_013' },
  { date: '2026-03-03', time: '05:08', type: '폭력', location: '경기도 부천시 상2동', cctv: 'BC_상2동_002' },
  { date: '2026-03-03', time: '04:56', type: '폭력', location: '경기도 부천시 성곡동', cctv: 'BC_성곡동_003' },
  { date: '2026-03-03', time: '04:46', type: '폭력', location: '경기도 부천시 송내1동', cctv: 'BC_송내1동_017' },
  { date: '2026-03-03', time: '04:34', type: '폭력', location: '경기도 부천시 중2동', cctv: 'BC_중2동_002' },
  { date: '2026-03-03', time: '04:11', type: '폭력', location: '경기도 부천시 도당동', cctv: 'BC_도당동_020' },
  { date: '2026-03-03', time: '03:54', type: '폭력', location: '경기도 부천시 오정동', cctv: 'BC_오정동_003' },
  { date: '2026-03-03', time: '03:20', type: '폭력', location: '경기도 부천시 오정동', cctv: 'BC_오정동_004' },
  { date: '2026-03-03', time: '02:17', type: '폭력', location: '경기도 부천시 중3동', cctv: 'BC_중3동_011' },
  { date: '2026-03-03', time: '02:05', type: '폭력', location: '경기도 부천시 심곡2동', cctv: 'BC_심곡2동_012' },
  { date: '2026-03-03', time: '01:41', type: '폭력', location: '경기도 부천시 역곡2동', cctv: 'BC_역곡2동_018' },
];

const INCIDENT_TREND_DATA = [
  { date: '02.01', count: 280 }, { date: '02.02', count: 235 }, { date: '02.03', count: 260 }, { date: '02.04', count: 260 },
  { date: '02.05', count: 140 }, { date: '02.06', count: 130 }, { date: '02.07', count: 140 }, { date: '02.08', count: 120 },
  { date: '02.09', count: 130 }, { date: '02.10', count: 155 }, { date: '02.11', count: 130 }, { date: '02.12', count: 125 },
  { date: '02.13', count: 140 }, { date: '02.14', count: 160 }, { date: '02.15', count: 165 }, { date: '02.16', count: 140 },
  { date: '02.17', count: 130 }, { date: '02.18', count: 145 }, { date: '02.19', count: 150 }, { date: '02.20', count: 125 },
  { date: '02.21', count: 130 }, { date: '02.22', count: 140 }, { date: '02.23', count: 145 }, { date: '02.24', count: 145 },
  { date: '02.25', count: 145 }, { date: '02.26', count: 145 }, { date: '02.27', count: 145 },
];

const IncidentSummaryCard: React.FC = () => (
  <div
    className="rounded-xl overflow-hidden break-words w-full min-w-0"
    style={{
      background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      border: '1px solid rgba(255,255,255,0.1)',
    }}
  >
    <div className="p-4 space-y-5">
      {/* L1: 현황 요약 헤더 */}
      <section>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">1. 현황 요약</h3>
        <div
          className="rounded-lg px-4 py-2.5 text-center text-white text-sm font-medium"
          style={{
            background: 'rgba(30,30,35,0.8)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          전체 (4393건), 전월 대비 43.0% 감소 추세입니다.
        </div>
      </section>

      {/* L2: 핵심 지표 통합 분석 */}
      <section className="pt-1">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">2. 핵심 지표 통합 분석</h3>
        <p className="text-sm text-gray-200 leading-relaxed mb-3">
          지난달 동안의 핵심 지표(①발생량(4393건) ②추세(전월 대비 43.0% 감소) 주요 유형(전체) ④피크지역(상2동))를 통합 분석했습니다.
        </p>
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(40,40,48,0.9)' }}>
                <th className="px-3 py-2.5 text-left text-white font-semibold">구분</th>
                <th className="px-3 py-2.5 text-left text-white font-semibold">현황</th>
                <th className="px-3 py-2.5 text-left text-white font-semibold">분석/제언</th>
              </tr>
            </thead>
            <tbody>
              {INCIDENT_SUMMARY_TABLE_ROWS.map((row, idx) => (
                <tr
                  key={row.category}
                  style={{ background: idx % 2 === 0 ? 'rgba(35,35,42,0.6)' : 'rgba(40,40,48,0.6)' }}
                >
                  <td className="px-3 py-2 text-gray-300 font-medium">{row.category}</td>
                  <td className="px-3 py-2 text-gray-200">{row.status}</td>
                  <td className="px-3 py-2 text-gray-200">{row.analysis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* L3: 최근 발생 추이 차트 */}
      <section className="pt-1">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">3. 최근 발생 추이</h3>
        <div className="flex items-center justify-end gap-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-sm text-gray-300">사건수</span>
        </div>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={INCIDENT_TREND_DATA} margin={{ top: 4, right: 20, left: 4, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
              <XAxis
                dataKey="date"
                ticks={['02.01', '02.03', '02.05', '02.07', '02.09', '02.11', '02.13', '02.15', '02.17', '02.19', '02.21', '02.23', '02.25', '02.27']}
                tick={{ fill: '#9ca3af', fontSize: 11, angle: -45 }}
                tickMargin={8}
                interval={0}
                padding={{ left: 4, right: 12 }}
              />
              <YAxis domain={[100, 300]} ticks={[100, 150, 200, 250, 300]} tick={{ fill: '#9ca3af', fontSize: 11 }} width={28} tickSize={0} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(30,30,35,0.95)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#e5e7eb' }}
              />
              <ReferenceLine y={250} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" strokeWidth={1} />
              <ReferenceLine y={300} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" strokeWidth={1} />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* 데이터 기준 및 안내 (캡션 블록) */}
        <div
          className="mt-0 rounded-lg px-3 py-2.5"
          style={{
            background: 'rgba(50,50,58,0.6)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <p className="text-sm text-white font-medium">
            (기준: 부천시 / 지난달 / 핵심 지표 5가지)
          </p>
          <p className="text-sm text-gray-300 mt-1">
            데이터가 많아 상위 5건만 표시합니다. 전체 이력은 이력 페이지에서 더욱 상세하게 조회하실 수 있습니다.
          </p>
        </div>
      </section>

      <hr className="border-t border-[#40424a]" role="separator" />

      <p className="text-xs text-gray-400 text-center">
        위 데이터는 임의 가공된 예시이며, 실제 사건·통계를 의미하지 않습니다.
      </p>
    </div>
  </div>
);

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isResponding,
  isExpanded,
}) => {
  return (
    <>
      {isExpanded && (
        <div className="flex items-center gap-2 text-gray-200 text-sm mb-3">
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
          <span className="text-white font-semibold">CUVIA Agent</span>
        </div>
      )}
      
      {messages.map((message) => (
        <div key={message.id} className="space-y-2 min-w-0 overflow-hidden">
          {message.role === 'assistant' && (
            <div className={isExpanded ? 'space-y-2' : 'flex items-start gap-3'}>
              <div className={isExpanded ? '' : 'min-w-0 flex-1'}>
                {message.incidentSummary ? (
                  <div className="space-y-2 w-full min-w-0">
                    <IncidentSummaryCard />
                    <div className="text-xs text-gray-300">{message.timestamp}</div>
                  </div>
                ) : (
                  <>
                    {!isExpanded && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-semibold text-sm">CUVIA Agent</span>
                      </div>
                    )}
                    <div className={`break-words overflow-hidden ${isExpanded ? 'max-w-[70%] px-4 py-2 rounded-2xl border bg-[#393a42] text-white border-[#40424a]' : 'rounded-xl border border-[#40424a] bg-[#393a42] p-4'}`} style={isExpanded ? { borderWidth: '1px' } : {}}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-gray-200">
                        {message.content}
                      </p>
                      <div className={`text-xs text-gray-300 ${isExpanded ? 'mt-1' : 'mt-2'}`}>
                        {message.timestamp}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          {message.role === 'user' && (
            <div className="flex justify-end min-w-0">
              <div
                className="max-w-[70%] min-w-0 break-words overflow-hidden px-4 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                style={{
                  background: '#4b5563',
                  color: '#f3f4f6',
                }}
              >
                <p>{message.content}</p>
                <div className="text-xs text-gray-300 mt-1">
                  {message.timestamp}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
      {isResponding && (
        <div className={isExpanded ? 'flex items-center gap-1 text-xs text-gray-300' : 'flex items-start gap-3'}>
          <div className={`flex items-center gap-1 ${!isExpanded ? 'pt-2' : ''}`}>
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
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
    <div className={`min-w-0 ${isExpanded ? 'flex-shrink-0' : 'p-4 border-t border-[#31353a] flex-shrink-0'} relative z-20`} style={{ background: 'transparent' }}>
      <div className={isExpanded ? 'p-4' : ''}>
        <div className="relative flex items-center gap-3 min-w-0 bg-[#393a42] border border-[#40424a] rounded-2xl px-4 py-3 focus-within:border-blue-500 transition-colors">
          {isExpanded && (
            <button
              onClick={() => {
                // 도구 팝업 (나중에 구현)
              }}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors self-center"
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
            className={`flex-1 min-w-0 bg-transparent border-none text-white text-sm placeholder-gray-400 focus:outline-none resize-none relative z-10 break-words overflow-y-auto ${
              isExpanded ? 'self-center' : ''
            }`}
            style={{
              minHeight: '24px',
              maxHeight: isExpanded ? '96px' : '72px',
              lineHeight: '24px',
            }}
            rows={1}
            tabIndex={0}
            aria-label="에이전트 메시지 입력"
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
        <p className="text-xs text-gray-300 mt-2 text-center">
          <span className="font-semibold text-gray-200">{isExpanded ? 'CUVIA Agent' : 'CUVIA Link'}</span>는 실수를 할 수 있습니다. 중요한 정보는 재차 확인하세요.
        </p>
      </div>
    </div>
  );
};

interface AdditionalPopupProps {
  onClose: () => void;
  label: string;
  className?: string;
  children: React.ReactNode;
}

const AdditionalPopup: React.FC<AdditionalPopupProps> = ({ onClose, className = '', children }) => (
  <div
    className={`flex flex-col flex-1 min-h-0 rounded-xl overflow-hidden relative border border-[#40424a] ${className}`}
    style={{
      background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
    }}
  >
    <div className="absolute top-3 right-3 z-10">
      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors focus:outline-none"
        aria-label="닫기"
      >
        <Icon icon="mdi:close" className="w-5 h-5" />
      </button>
    </div>
    <div className="flex-1 min-h-0 p-4 pt-12 overflow-auto">
      {children}
    </div>
  </div>
);

const AdditionalPopup1Table: React.FC = () => (
  <div className="space-y-3">
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: 'rgb(40,40,48)' }}>
            <th className="px-3 py-2.5 text-left text-white font-semibold">날짜</th>
            <th className="px-3 py-2.5 text-left text-white font-semibold">발생 시간</th>
            <th className="px-3 py-2.5 text-left text-white font-semibold">유형</th>
            <th className="px-3 py-2.5 text-left text-white font-semibold">상세 위치</th>
            <th className="px-3 py-2.5 text-left text-white font-semibold">CCTV</th>
          </tr>
        </thead>
        <tbody>
          {ADDITIONAL_POPUP1_TABLE_DATA.map((row, idx) => (
            <tr
              key={`${row.date}-${row.time}-${idx}`}
              style={{ background: idx % 2 === 0 ? 'rgb(35,35,42)' : 'rgb(40,40,48)' }}
            >
              <td className="px-3 py-2 text-gray-300">{row.date}</td>
              <td className="px-3 py-2 text-gray-300">{row.time}</td>
              <td className="px-3 py-2 text-gray-200">{row.type}</td>
              <td className="px-3 py-2 text-gray-200">{row.location}</td>
              <td className="px-3 py-2 text-gray-300 text-sm">{row.cctv}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div
      className="rounded-lg px-3 py-2.5"
      style={{
        background: 'rgba(40,40,48,0.6)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <p className="text-sm text-white font-medium">(기준: 부천시 / 2026-03-03 ~ 2026-03-03)</p>
      <p className="text-sm text-gray-300 mt-1">오후 03:33:13</p>
    </div>
  </div>
);

const CHART_TABS = [
  { key: 'line' as const, label: '선' },
  { key: 'pie' as const, label: '파이' },
  { key: 'bar' as const, label: '막대' },
  { key: 'donut' as const, label: '도넛' },
] as const;

const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'rgba(30,30,35,0.95)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '8px',
  },
  labelStyle: { color: '#e5e7eb' as const },
  wrapperStyle: {
    outline: 'none',
  },
  itemStyle: { color: '#e5e7eb' as const },
};

// 프라이머리 블루(#0066FF) + 에이전트 그라데이션(#8A2BE2, #ff8566) 베이스로 조화되는 팔레트
const CHART_LEGEND_COLORS = [
  '#0066FF', // primary blue
  '#3b82f6',
  '#60a5fa',
  '#2563eb',
  '#1d4ed8',
  '#8A2BE2', // gradient violet
  '#8b5cf6',
  '#a78bfa',
  '#7c3aed',
  '#ff8566', // gradient coral
  '#fb923c',
  '#f97316',
];

const PRIMARY_CHART_COLOR = CHART_LEGEND_COLORS[0];

const PIE_SIZE = { outer: 70, inner: 45 };
const PIE_SIZE_15X = { outer: Math.round(PIE_SIZE.outer * 1.5), inner: Math.round(PIE_SIZE.inner * 1.5) };

const AdditionalPopup2Chart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartHeight, setChartHeight] = useState(180);
  const [activeTab, setActiveTab] = useState<(typeof CHART_TABS)[number]['key']>('line');
  const pieData = INCIDENT_TREND_DATA.map((d) => ({ name: d.date, value: d.count }));

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { height } = entries[0]?.contentRect ?? {};
      if (typeof height === 'number' && height > 0) setChartHeight(height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isSeriesChart = activeTab === 'line' || activeTab === 'bar';
  const isPieOrDonut = activeTab === 'pie' || activeTab === 'donut';

  return (
    <div className="h-full flex flex-col min-h-0 gap-2">
      <div className="flex items-center justify-start gap-2 flex-shrink-0">
        <div className="flex rounded-lg overflow-hidden border border-[#40424a] bg-[#393a42] p-0.5">
          {CHART_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors rounded-md ${
                activeTab === tab.key
                  ? 'bg-[#4b5563] text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              aria-label={`${tab.label} 차트`}
              aria-pressed={activeTab === tab.key}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 아래 범례 (스크롤 없음) */}
      <div
        className="flex flex-wrap gap-x-3 gap-y-1.5 py-2 px-2 rounded-lg flex-shrink-0 min-h-[40px] overflow-hidden"
        style={{
          background: 'rgba(40,40,48,0.6)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {isSeriesChart && (
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ background: PRIMARY_CHART_COLOR }}
              aria-hidden
            />
            <span className="text-xs text-gray-300">사건수</span>
          </div>
        )}
        {isPieOrDonut &&
          pieData.map((item, index) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ background: CHART_LEGEND_COLORS[index % CHART_LEGEND_COLORS.length] }}
                aria-hidden
              />
              <span className="text-xs text-gray-300 whitespace-nowrap">
                {item.name} <span className="text-gray-200 font-medium">{item.value}건</span>
              </span>
            </div>
          ))}
      </div>

      <div ref={chartContainerRef} className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height={chartHeight}>
          {activeTab === 'line' && (
            <LineChart data={INCIDENT_TREND_DATA} margin={{ top: 4, right: 20, left: 4, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
              <XAxis
                dataKey="date"
                ticks={['02.01', '02.03', '02.05', '02.07', '02.09', '02.11', '02.13', '02.15', '02.17', '02.19', '02.21', '02.23', '02.25', '02.27']}
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickMargin={8}
                interval={0}
                padding={{ left: 4, right: 12 }}
              />
              <YAxis domain={[100, 300]} ticks={[100, 150, 200, 250, 300]} tick={{ fill: '#9ca3af', fontSize: 11 }} width={28} tickSize={0} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE.contentStyle} labelStyle={TOOLTIP_STYLE.labelStyle} wrapperStyle={TOOLTIP_STYLE.wrapperStyle} itemStyle={TOOLTIP_STYLE.itemStyle} />
              <ReferenceLine y={250} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" strokeWidth={1} />
              <ReferenceLine y={300} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" strokeWidth={1} />
              <Line type="monotone" dataKey="count" stroke={PRIMARY_CHART_COLOR} strokeWidth={2} dot={{ fill: PRIMARY_CHART_COLOR, r: 2 }} />
            </LineChart>
          )}
          {activeTab === 'bar' && (
            <BarChart data={INCIDENT_TREND_DATA} margin={{ top: 4, right: 20, left: 4, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" vertical={false} />
              <XAxis
                dataKey="date"
                ticks={['02.01', '02.05', '02.10', '02.15', '02.20', '02.25']}
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickMargin={8}
                interval={0}
                padding={{ left: 4, right: 12 }}
              />
              <YAxis domain={[0, 300]} ticks={[0, 100, 150, 200, 250, 300]} tick={{ fill: '#9ca3af', fontSize: 11 }} width={28} tickSize={0} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE.contentStyle} labelStyle={TOOLTIP_STYLE.labelStyle} wrapperStyle={TOOLTIP_STYLE.wrapperStyle} itemStyle={TOOLTIP_STYLE.itemStyle} />
              <Bar dataKey="count" fill={PRIMARY_CHART_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
          {activeTab === 'pie' && (
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={PIE_SIZE_15X.outer}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_LEGEND_COLORS[index % CHART_LEGEND_COLORS.length]} stroke="rgba(30,30,35,0.95)" strokeWidth={1} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE.contentStyle} labelStyle={TOOLTIP_STYLE.labelStyle} wrapperStyle={TOOLTIP_STYLE.wrapperStyle} itemStyle={TOOLTIP_STYLE.itemStyle} formatter={(value: number | undefined, name: string | undefined) => [`${value ?? 0}건`, name ?? '']} />
            </PieChart>
          )}
          {activeTab === 'donut' && (
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={PIE_SIZE_15X.inner}
                outerRadius={PIE_SIZE_15X.outer}
                paddingAngle={1}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_LEGEND_COLORS[index % CHART_LEGEND_COLORS.length]} stroke="rgba(30,30,35,0.95)" strokeWidth={1} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE.contentStyle} labelStyle={TOOLTIP_STYLE.labelStyle} wrapperStyle={TOOLTIP_STYLE.wrapperStyle} itemStyle={TOOLTIP_STYLE.itemStyle} formatter={(value: number | undefined, name: string | undefined) => [`${value ?? 0}건`, name ?? '']} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const AIAgentPopup2: React.FC<AIAgentPopupProps> = ({
  isOpen,
  onClose,
  hideControls = false,
  position: positionOverride,
  maxHeight: maxHeightProp,
  initialMessage,
  onInitialMessageProcessed,
}) => {
  const [slideEntered, setSlideEntered] = useState(false);
  const [showAdditionalPopup1, setShowAdditionalPopup1] = useState(true);
  const [showAdditionalPopup2, setShowAdditionalPopup2] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const isExpanded = false;

  useEffect(() => {
    if (isOpen) {
      setSlideEntered(false);
      setShowAdditionalPopup1(true);
      setShowAdditionalPopup2(true);
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(() => setSlideEntered(true));
      });
      return () => cancelAnimationFrame(t);
    } else {
      setSlideEntered(false);
    }
  }, [isOpen]);

  const isIncidentSummaryMessage = (t: string) =>
    /지난달\s*사건\s*사고\s*요약|지난달\s*사건사고\s*요약|사건\s*사고\s*요약해줘|사건사고\s*요약해줘|지난달\s*요약/.test(t);

  const processedInitialMessageRef = useRef<string | null>(null);
  const onInitialMessageProcessedRef = useRef(onInitialMessageProcessed);
  onInitialMessageProcessedRef.current = onInitialMessageProcessed;

  // 플로팅 바에서 전송된 initialMessage 처리 (한 번만)
  useEffect(() => {
    if (!isOpen || !initialMessage?.trim()) return;
    const text = initialMessage.trim();
    if (processedInitialMessageRef.current === text) return;
    processedInitialMessageRef.current = text;

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

    const summaryMessage: ChatMessage = {
      id: 'incident-summary-msg',
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      incidentSummary: true,
    };
    const fallbackMsg: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '지난달 사건사고 요약을 원하시면 "지난달 사건사고 요약해줘"라고 입력해주세요.',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'normal',
    };

    setMessages((prev) => {
      const hasUserWithContent = prev.some((m) => m.role === 'user' && m.content === text);
      if (hasUserWithContent) return prev;
      const withUser = [...prev, userMessage];
      const assistant = isIncidentSummaryMessage(text) ? summaryMessage : fallbackMsg;
      return [...withUser, assistant];
    });

    onInitialMessageProcessedRef.current?.();
    processedInitialMessageRef.current = null;
  }, [isOpen, initialMessage]);

  const [inputKey, setInputKey] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: `user-${Date.now()}`,
      role: 'user',
      content: '지난달 사건사고 요약해줘',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    },
    {
      id: 'incident-summary-msg',
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      incidentSummary: true,
    },
  ]);
  const [isResponding, setIsResponding] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const ignoreNextChangeRef = useRef(false);

  const handleSkipResponse = () => {
    setMessages((prev) =>
      prev.filter((msg) => {
        if (msg.isTyping) return false;
        if (msg.type === 'analyzing') return false;
        if (msg.role === 'assistant' && msg.content === '') return false;
        return true;
      })
    );
    setIsResponding(false);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (container) container.scrollTop = container.scrollHeight;
      });
    });
    return () => cancelAnimationFrame(rafId);
  }, [messages, isResponding]);

  useEffect(() => {
    if (inputKey > 0) {
      textareaRef.current?.focus();
    }
  }, [inputKey]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = 24;
    const maxHeight = lineHeight * 3;
    const newHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${newHeight}px`;
  }, [chatInput, inputKey]);

  const isIncidentSummaryMsg = (s: string) =>
    /지난달\s*사건\s*사고\s*요약|지난달\s*사건사고\s*요약|사건\s*사고\s*요약해줘|사건사고\s*요약해줘|지난달\s*요약/.test(s);

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

    if (isIncidentSummaryMsg(text)) {
      setIsResponding(true);
      setTimeout(() => {
        const summaryMessage: ChatMessage = {
          id: 'incident-summary-msg',
          role: 'assistant',
          content: '',
          timestamp: new Date().toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          incidentSummary: true,
        };
        setMessages((prev) => [...prev, summaryMessage]);
        setIsResponding(false);
      }, 500);
      return;
    }

    // 지난달 사건사고 외 메시지는 간단 안내만
    const fallbackMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '지난달 사건사고 요약을 원하시면 "지난달 사건사고 요약해줘"라고 입력해주세요.',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'normal',
    };
    setMessages((prev) => [...prev, fallbackMessage]);
  };

  if (!isOpen) return null;

  const mainPopupWidth = 420;
  const mainPopupVideoHeight = mainPopupWidth * (9 / 16);
  const mainPopupTitleHeight = 40;
  const mainPopupPadding = 12;
  const mainPopupHeight = mainPopupVideoHeight + mainPopupTitleHeight + mainPopupPadding;
  const padding = 20;
  const gap = 10;

  const agentWidth = isExpanded ? 'w-[36rem]' : 'w-[480px]';
  const additionalPopupWidth = isExpanded ? 'w-[48rem]' : 'w-[680px]';
  const containerStyle = isExpanded
    ? { zIndex: 310, transform: slideEntered ? 'translateX(0)' : 'translateX(100%)', opacity: slideEntered ? 1 : 0 }
    : positionOverride
      ? { position: 'absolute' as const, ...positionOverride, zIndex: 90, transform: slideEntered ? 'translateX(0)' : 'translateX(100%)', opacity: slideEntered ? 1 : 0, transition: 'transform 0.3s ease-out, opacity 0.3s ease-out, top 0.3s ease-out, right 0.3s ease-out, bottom 0.3s ease-out' }
      : { position: 'absolute' as const, top: `${padding + mainPopupHeight + gap + (hideControls ? 56 : 0)}px`, right: `${padding}px`, zIndex: 90, transform: slideEntered ? 'translateX(0)' : 'translateX(100%)', opacity: slideEntered ? 1 : 0, transition: 'transform 0.3s ease-out, opacity 0.3s ease-out, top 0.3s ease-out, right 0.3s ease-out' };

  return (
    <div
      className={`flex items-stretch gap-2 transition-all duration-300 ease-out ${isExpanded ? 'fixed inset-y-0 right-0' : 'absolute'}`}
      style={containerStyle}
      onClick={(e) => e.stopPropagation()}
    >
      {(showAdditionalPopup1 || showAdditionalPopup2) && (
        <div
          className={`flex flex-col flex-shrink-0 gap-2 ${additionalPopupWidth} ${isExpanded ? 'h-full pl-4 py-4 pr-2' : ''}`}
          style={!isExpanded ? { height: maxHeightProp ?? 600 } : undefined}
        >
          {showAdditionalPopup1 && (
            <AdditionalPopup onClose={() => setShowAdditionalPopup1(false)} label="추가 팝업 1" className="flex-1 min-h-0">
              <AdditionalPopup1Table />
            </AdditionalPopup>
          )}
          {showAdditionalPopup2 && (
            <AdditionalPopup onClose={() => setShowAdditionalPopup2(false)} label="추가 팝업 2" className="flex-1 min-h-0">
              <AdditionalPopup2Chart />
            </AdditionalPopup>
          )}
        </div>
      )}
      <div
        className={`flex flex-col flex-shrink-0 overflow-hidden relative border border-[#40424a] transition-[width] duration-300 ease-out ${agentWidth} ${isExpanded ? 'h-full border-l rounded-none' : 'rounded-2xl'}`}
        style={{
          height: isExpanded ? undefined : (maxHeightProp ?? 600),
          background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      >
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors focus:outline-none"
            aria-label="닫기"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>
        <div
          ref={scrollContainerRef}
          className={`flex-1 overflow-y-auto overflow-x-hidden min-h-0 min-w-0 ${isExpanded ? 'p-3 pl-10 pr-9' : 'p-4 space-y-4 pt-6'}`}
        >
          <div className="space-y-3">
            <MessageList
                messages={messages}
                isResponding={isResponding}
                isExpanded={isExpanded}
              />
          </div>
          <div ref={bottomRef} className={isExpanded ? 'h-[75px]' : 'h-2'} />
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
          isExpanded={isExpanded}
          placeholder="지난달 사건사고 요약을 원하시면 '지난달 사건사고 요약해줘'라고 입력해주세요."
        />
      </div>
    </div>
  );
};

export default AIAgentPopup2;
