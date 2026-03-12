import { useEffect, useState } from 'react';

const DISPLAY_WIDTH = 528;
const DISPLAY_HEIGHT = 1520;

const FEATURES = [
  {
    title: 'CUVIA DASHBOARD',
    desc: '도시 전역 데이터 통합 모니터링',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: 'CUVIA Metis',
    desc: 'VLM 기반 영상 검색 및 추적',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 11h6M11 8v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'CUVIA LINK',
    desc: 'AI Agent 기반 상황 판단 지원',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 16l5 5M18 13h3M13 18v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'CUVIA DRIVE',
    desc: '관제 상황판 통합 운영',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 8h4M7 11h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
];

const SEARCH_FLOW = [
  { step: '01', label: '특징 정보 접수', sub: '신고 정보 기반' },
  { step: '02', label: '고속검색 실시', sub: 'VLM 영상 분석' },
  { step: '03', label: 'CCTV 내 탐지', sub: '유사도 분석' },
  { step: '04', label: '이동 경로 추적', sub: 'RE-ID 재추적' },
  { step: '05', label: 'AI Agent 서비스', sub: '영상 요약·캡션' },
];

const KEY_CAPABILITIES = [
  {
    label: 'VLM\n영상 검색', sub: '초고속 CCTV 탐색',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 11h6M11 8v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: '영상\n유사도 분석', sub: '후보 객체 탐색',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="13" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 7h4M16 5v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'RE-ID 객체\n재추적', sub: '이동 경로 분석',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: '이동 경로\n예측', sub: '포착 지점 분석',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: 'AI Agent\n기반 분석', sub: '요약·판단·협업 지원',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 16l5 5M18 13h3M13 18v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

const STATS = [
  { value: '7,000+', label: '사전 학습된 위험 시나리오' },
  { value: '4단계', label: 'AI 위험 등급 자동 분류' },
  { value: '9개', label: '도시 핵심 도메인 통합' },
];

const DOMAINS = [
  { label: '재난·안전', icon: <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3"><path d="M12 2L2 22h20L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M12 10v4M12 17v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { label: '방범·보안', icon: <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3"><path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
  { label: '도시통합관제', icon: <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg> },
  { label: '교통·주차', icon: <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3"><path d="M5 17h14M6 9h12l-1.5 8H7.5L6 9zM8 9V6a1 1 0 011-1h6a1 1 0 011 1v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: '생활·복지', icon: <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3"><path d="M12 21C12 21 4 13.5 4 8.5C4 5.46 6.46 3 9.5 3c1.74 0 3.41.81 4.5 2.09A5.99 5.99 0 0118.5 3C21.54 3 24 5.46 24 8.5c0 5-8 12.5-8 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: '환경·생태', icon: <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3"><path d="M12 22V8M12 8C12 8 7 3 3 3c0 4 5 9 9 5M12 12c0 0 5-5 9-5-4 0-9 5-9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: '시설물', icon: <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: '에너지', icon: <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: '산업·경제', icon: <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3"><path d="M3 21h18M6 21V10l5-3v14M13 21V7l5-3v17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
];

const PRODUCT_LINEUP = [
  { name: 'CUVIA LINK', desc: '도메인지식 기반 의사결정 지원' },
  { name: 'CUVIA Metis', desc: 'VLM 기반 고속검색' },
  { name: 'CUVIA Visual', desc: '공간 관제' },
  { name: 'CUVIA DRIVE', desc: '상황판 통합 운영' },
  { name: 'CUVIA DASHBOARD', desc: '통합관제 대시보드' },
  { name: 'CUVIA FMS', desc: '시설물 관제' },
];

const AI_AGENTS = [
  {
    name: 'Dashboard Agent',
    features: ['대시보드에서\n바로 사용', '즉시 연동\n빠른 지원', '운영 흐름\n보조형 Agent'],
  },
  {
    name: 'Workspace Agent',
    features: ['핵심 요약·우선순위 제시', '보고서·전파문 자동 생성', '신속한 대응 지원'],
  },
];

const ORB_CONFIGS = [
  { name: 'display-orb-float-1', duration: 5 },
  { name: 'display-orb-float-2', duration: 6 },
  { name: 'display-orb-float-3', duration: 5.5 },
  { name: 'display-orb-float-4', duration: 6.5 },
] as const;

const GlowOrb = ({ className, animIndex = 0 }: { className: string; animIndex?: number }) => {
  const config = ORB_CONFIGS[animIndex % ORB_CONFIGS.length];
  return (
    <div
      className={`absolute rounded-full blur-[80px] pointer-events-none ${className}`}
      style={{ opacity: 0.3, animation: `${config.name} ${config.duration}s ease-in-out infinite` }}
    />
  );
};

const Divider = () => (
  <div
    className="w-full h-[1px] my-3 flex-shrink-0"
    style={{ background: 'linear-gradient(90deg, transparent, rgba(0,94,184,0.4), transparent)' }}
  />
);

const SectionLabel = ({ children }: { children: string }) => (
  <p className="text-gray-500 text-[14px] tracking-[0.2em] uppercase font-semibold text-center mb-3 flex-shrink-0">{children}</p>
);

export default function DisplayPage2() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-black overflow-hidden">
      <div
        className="relative flex-shrink-0 overflow-hidden"
        style={{
          width: `${DISPLAY_WIDTH}px`,
          height: `${DISPLAY_HEIGHT}px`,
          background: 'linear-gradient(180deg, #060a10 0%, #0a0e14 15%, #0c1018 50%, #0a0e14 85%, #060a10 100%)',
        }}
      >
        <GlowOrb className="w-[300px] h-[300px] bg-blue-600 -top-20 -left-20" animIndex={0} />
        <GlowOrb className="w-[220px] h-[220px] bg-indigo-500 top-[400px] -right-10" animIndex={1} />
        <GlowOrb className="w-[260px] h-[260px] bg-blue-500 top-[900px] -left-20" animIndex={2} />
        <GlowOrb className="w-[200px] h-[200px] bg-purple-600 bottom-[200px] right-0" animIndex={3} />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div
          className={`relative z-10 flex flex-col h-full px-7 py-5 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          {/* Logo */}
          <div className="flex flex-col items-center flex-shrink-0">
            <img
              src="/simbol.svg"
              alt="CUVIA Symbol"
              className="w-14 h-14 mb-2"
              style={{ filter: 'brightness(1.4) drop-shadow(0 0 20px rgba(33,96,173,0.5))' }}
            />
            <img src="/logo.svg" alt="CUVIA" className="h-5" style={{ filter: 'brightness(0) invert(1)' }} />
          </div>

          <Divider />

          {/* Slogan */}
          <div className="flex flex-col items-center text-center flex-shrink-0">
            <p className="text-blue-400 text-[14px] font-semibold tracking-[0.3em] uppercase mb-3">
              Next Generation AI Platform
            </p>
            <h1 className="text-white font-bold leading-tight mb-3" style={{ fontSize: '40px', letterSpacing: '-0.02em' }}>
              스마트시티의 미래,<br />지능형 운영을 재정의하다
            </h1>
            <p className="text-gray-400 text-[14px] leading-relaxed">
              분산된 도시 데이터를 연결하고 영상 맥락 기반 분석으로<br />
              도시 상황을 판단하고 신속한 대응을 지원하는 지능형 도시 운영 플랫폼
            </p>
          </div>

          <Divider />

          {/* Key Capabilities */}
          <SectionLabel>Key Capabilities</SectionLabel>
          <div className="flex items-start justify-between gap-1 px-1 flex-shrink-0">
            {KEY_CAPABILITIES.map((cap, i) => (
              <div key={cap.label} className="flex flex-col items-center flex-1 relative">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-2.5 text-blue-400 [&>svg]:w-5 [&>svg]:h-5"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,94,184,0.4) 0%, rgba(0,94,184,0.15) 100%)',
                    border: '1px solid rgba(0,94,184,0.4)',
                  }}
                >
                  {cap.icon}
                </div>
                {i < KEY_CAPABILITIES.length - 1 && (
                  <div
                    className="absolute top-[24px] left-[calc(50%+28px)] h-[1px]"
                    style={{ width: 'calc(100% - 56px)', background: 'linear-gradient(90deg, rgba(0,94,184,0.5), rgba(0,94,184,0.15))' }}
                  />
                )}
                <p className="text-white text-[14px] font-bold text-center leading-snug whitespace-pre-line">{cap.label}</p>
                <p className="text-gray-500 text-[11px] text-center mt-1">{cap.sub}</p>
              </div>
            ))}
          </div>

          <Divider />

          {/* System Architecture */}
          <SectionLabel>System Architecture</SectionLabel>
          <div className="grid grid-cols-3 gap-1.5 flex-shrink-0">
            {PRODUCT_LINEUP.map((product) => (
              <div
                key={product.name}
                className="relative rounded-lg py-3 px-3 text-center gradient-border-right-bottom"
                style={{ background: 'linear-gradient(135deg, rgba(0,94,184,0.08) 0%, rgba(33,96,173,0.04) 100%)' }}
              >
                <p className="text-white text-[15px] font-bold leading-tight">{product.name}</p>
                <p className="text-gray-400 text-[11px] mt-1">{product.desc}</p>
              </div>
            ))}
          </div>

          <Divider />

          {/* Core Solutions */}
          <SectionLabel>Core Solutions</SectionLabel>
          <div className="grid grid-cols-2 gap-2 flex-shrink-0">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="relative rounded-lg overflow-hidden gradient-border-right-bottom flex flex-col items-center text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.06) 100%)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                }}
              >
                <div className="px-3 py-3 flex flex-col items-center">
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-blue-400 mb-2 [&>svg]:w-4 [&>svg]:h-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0,94,184,0.25) 0%, rgba(0,94,184,0.08) 100%)',
                      border: '1px solid rgba(0,94,184,0.25)',
                    }}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-white text-[16px] font-bold tracking-tight">{feature.title}</h3>
                  <span className="text-gray-400 text-[12px] font-medium mt-1">{feature.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <Divider />

          {/* AI Agents */}
          <div className="text-center flex-shrink-0 mb-2">
            <SectionLabel>AI Agent</SectionLabel>
            <p className="text-gray-400 text-[12px]"><span className="text-blue-400 font-semibold">CUVIA LINK</span> 기반 지능형 에이전트 · 근거 기반 판단 · 실행 중심 워크플로우</p>
          </div>
          <div className="grid grid-cols-2 gap-2 flex-shrink-0">
            {AI_AGENTS.map((agent) => (
              <div key={agent.name} className="py-2.5 px-2">
                <h4 className="text-white text-[13px] font-bold mb-2 text-center">{agent.name}</h4>
                <div className="grid grid-cols-3 gap-1.5">
                  {agent.features.map((f) => (
                    <div
                      key={f}
                      className="rounded-md px-1.5 py-2 text-center border border-gray-700/30 bg-white/[0.03]"
                    >
                      <p className="text-gray-300 text-[10px] leading-snug whitespace-pre-line">{f}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Divider />

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 flex-shrink-0">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <span className="text-white text-[24px] font-bold tabular-nums">{stat.value}</span>
                <span className="text-gray-500 text-[11px] font-medium">{stat.label}</span>
              </div>
            ))}
          </div>

          <Divider />

          {/* Domains */}
          <div className="flex flex-wrap justify-center gap-1.5 flex-shrink-0">
            {DOMAINS.map((d) => (
              <span key={d.label} className="inline-flex items-center gap-1 text-gray-400 text-[10px] font-medium px-2.5 py-1 rounded-full border border-gray-700/50 bg-white/[0.03]">
                <span className="text-blue-400/70">{d.icon}</span>{d.label}
              </span>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="flex flex-col items-center flex-shrink-0 mt-auto">
            <div
              className="w-full rounded-lg px-5 py-4 text-center mb-3 gradient-border-right-bottom"
              style={{ background: 'linear-gradient(135deg, rgba(0,94,184,0.15) 0%, rgba(0,94,184,0.05) 100%)' }}
            >
              <p className="text-white/90 text-[18px] font-semibold">"CUVIA는 단순한 솔루션이 아닙니다"</p>
              <p className="text-blue-400 text-[15px] font-medium mt-1">하나의 지능형 운영 생태계입니다</p>
            </div>
            <img src="/cudo_CI.svg" alt="CUDO Communications" className="h-10 opacity-50" style={{ filter: 'brightness(0) invert(1) opacity(0.6)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
