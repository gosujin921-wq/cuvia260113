import { useEffect, useState } from 'react';

const DISPLAY_WIDTH = 573;
const DISPLAY_HEIGHT = 1520;

const FEATURES = [
  {
    title: 'CUVIA DASHBOARD',
    desc: '도시 데이터 통합 관제 대시보드',
    keywords: ['통합 모니터링', '지도 기반 관제', 'AI 위험 분석', '위젯 리포팅'],
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
    title: 'CUVIA\nDRIVE',
    desc: '실시간 통합 운영·제어 시스템',
    keywords: ['통합 운영', '실시간 모니터링', '시스템 제어', '데이터 보안'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 8h4M7 11h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'CUVIA Metis',
    desc: 'VLM 기반 초고속 영상\n검색·추적',
    keywords: ['VLM 영상 검색', '유사도 분석', 'RE-ID 재추적', '경로 예측'],
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
    desc: 'AI Agent 기반 상황\n분석·대응 워크플로우',
    keywords: ['AI Agent', '자연어 분석', '상황 판단', '보고 자동화'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 16l5 5M18 13h3M13 18v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
    label: 'Re-ID 객체\n재추적', sub: '이동 경로 분석',
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
  { name: 'CUVIA LINK', desc: '도메인지식 기반\n의사결정 지원 시스템' },
  { name: 'CUVIA Metis', desc: 'VLM 기반\n영상 분석 · 고속검색' },
  { name: 'CUVIA Visual', desc: 'GIS 기반\n공간 관제 · 상황 MAP' },
  { name: 'CUVIA\nDRIVE', desc: '실시간 통합\n운영·제어 시스템' },
  { name: 'CUVIA\nDASHBOARD', desc: 'AI 분석 기반\n지도 통합 모니터링' },
  { name: 'CUVIA\nFMS', desc: '시설물 모니터링\n장애 · 자재 관리' },
];

const AI_AGENTS = [
  {
    name: 'Dashboard Agent',
    features: ['대시보드에서\n바로 사용', '즉시 연동\n빠른 지원', '운영 흐름\n보조형 Agent', '자연어 UI\n직관 제어'],
  },
  {
    name: 'Workspace Agent',
    features: ['핵심 요약·\n우선순위 제시', '보고서·전파문\n자동 생성', '프로젝트별\n맥락 누적 기반 응답', '근거 기반\n판단 지원'],
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
    className="w-full h-[1px] my-4 flex-shrink-0"
    style={{ background: 'linear-gradient(90deg, transparent, rgba(0,94,184,0.4), transparent)' }}
  />
);

const SectionLabel = ({ children }: { children: string }) => (
  <div className="flex items-center gap-3 mb-4 flex-shrink-0">
    <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35))' }} />
    <p className="text-gray-400 text-[18px] tracking-[0.2em] uppercase font-semibold">{children}</p>
    <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.35), transparent)' }} />
  </div>
);

export default function BackwallPage() {
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
          className={`relative z-10 flex flex-col h-full px-7 py-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          {/* Logo */}
          <div className="flex flex-col items-center flex-shrink-0">
            <img
              src="/simbol.svg"
              alt="CUVIA Symbol"
              className="w-12 h-12 mb-3"
              style={{ filter: 'brightness(1.4) drop-shadow(0 0 20px rgba(33,96,173,0.5))' }}
            />
            <img src="/logo.svg" alt="CUVIA" className="h-8" style={{ filter: 'brightness(0) invert(1)' }} />
          </div>

          <Divider />

          {/* Slogan */}
          <div className="flex flex-col items-center text-center flex-shrink-0">
            <p className="text-blue-400 text-[18px] font-semibold tracking-[0.3em] uppercase mb-3">
              Next Generation AI Platform
            </p>
            <h1 className="text-white font-bold leading-tight" style={{ fontSize: '52px', letterSpacing: '-0.02em' }}>
              스마트시티의 미래,<br />지능형 운영을 재정의하다
            </h1>
          </div>

          <div className="h-8 flex-shrink-0" />

          {/* Content sections */}
          <div className="flex flex-col flex-1 gap-8">
            {/* Key Capabilities */}
            <div>
              <SectionLabel>Key Capabilities</SectionLabel>
              <div className="flex flex-col gap-6">
                <div className="flex justify-center gap-12">
                  {KEY_CAPABILITIES.slice(0, 2).map((cap) => (
                    <div key={cap.label} className="flex flex-col items-center w-[140px]">
                      <div
                        className="rounded-full flex items-center justify-center mb-3 text-blue-400 [&>svg]:w-9 [&>svg]:h-9"
                        style={{
                          width: '72px',
                          height: '72px',
                          background: 'linear-gradient(135deg, rgba(0,94,184,0.6) 0%, rgba(0,94,184,0.3) 100%)',
                          border: '1px solid rgba(0,94,184,0.6)',
                        }}
                      >
                        {cap.icon}
                      </div>
                      <p className="text-white text-[20px] font-bold text-center leading-snug whitespace-pre-line">{cap.label}</p>
                      <p className="text-gray-300 text-[16px] text-center mt-1.5">{cap.sub}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-8">
                  {KEY_CAPABILITIES.slice(2).map((cap) => (
                    <div key={cap.label} className="flex flex-col items-center w-[140px]">
                      <div
                        className="rounded-full flex items-center justify-center mb-3 text-blue-400 [&>svg]:w-9 [&>svg]:h-9"
                        style={{
                          width: '72px',
                          height: '72px',
                          background: 'linear-gradient(135deg, rgba(0,94,184,0.6) 0%, rgba(0,94,184,0.3) 100%)',
                          border: '1px solid rgba(0,94,184,0.6)',
                        }}
                      >
                        {cap.icon}
                      </div>
                      <p className="text-white text-[20px] font-bold text-center leading-snug whitespace-pre-line">{cap.label}</p>
                      <p className="text-gray-300 text-[16px] text-center mt-1.5">{cap.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Core Solutions */}
            <div>
              <SectionLabel>Core Solutions</SectionLabel>
              <div className="flex flex-col gap-2.5">
                {FEATURES.map((feature) => (
                  <div
                    key={feature.title}
                    className="relative rounded-xl overflow-hidden gradient-border-right-bottom"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.10) 100%)',
                      backdropFilter: 'blur(4px)',
                      WebkitBackdropFilter: 'blur(4px)',
                    }}
                  >
                    <div className="px-5 py-4 flex items-start gap-4">
                      <div
                        className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-blue-400 [&>svg]:w-6 [&>svg]:h-6 mt-0.5"
                        style={{
                          background: 'linear-gradient(135deg, rgba(0,94,184,0.5) 0%, rgba(0,94,184,0.25) 100%)',
                          border: '1px solid rgba(0,94,184,0.5)',
                        }}
                      >
                        {feature.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-white text-[24px] font-bold tracking-wide leading-tight">{feature.title}</h3>
                        <p className="text-blue-300 text-[17px] font-medium mt-1">{feature.desc}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {feature.keywords.map((kw) => (
                            <span key={kw} className="text-gray-300 text-[14px] px-3 py-1 rounded border border-gray-500/50 bg-white/[0.08]">{kw}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Logo */}
            <div className="flex flex-col items-center mt-auto">
              <img src="/cudo_CI.svg" alt="CUDO Communications" className="h-14 opacity-50" style={{ filter: 'brightness(0) invert(1) opacity(0.6)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
