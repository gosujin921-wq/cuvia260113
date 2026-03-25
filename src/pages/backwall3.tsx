const DISPLAY_WIDTH = 1050;
const DISPLAY_HEIGHT = 1485;

const GUIDE_SECTIONS = [
  {
    title: 'CCTV·위치 조회',
    sub: 'CCTV 위치나 분포, 특정 지역의 CCTV를 조회하는 질문',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="3" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    keywords: ['과천시 전체 CCTV 보여줘', '과천시 별양동 CCTV 보여줘', '지금 내가 주의깊게 봐야할 지역 알려줘'],
    labelType: 'local' as const,
  },
  {
    title: '이벤트 조회',
    sub: '사건·이벤트 발생 현황을 조회하는 질문',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <path d="M12 2L2 22h20L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 10v4M12 17v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    keywords: ['과천시 침수사건 보여줘', '과천시 별양동 폭력사건 보여줘', '과천시 쓰러짐 사건 보여줘'],
    labelType: 'local' as const,
  },
  {
    title: '분석·비교·요약',
    sub: '기간별 분석, 패턴 확인, 요약 브리핑 성격의 질문',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    keywords: ['지난달 사건사고 분석해줘', '쓰러짐 요일/시간 패턴 분석해줘', '작년이랑 올해 침수 비교해줘'],
    labelType: 'local' as const,
  },
  {
    title: '위험 구간 정보',
    sub: '공공 데이터 기반 위험정보와 시설 정보를 확인하는 질문',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    keywords: ['OO시 범죄 주의구간 보여줘', 'OO시 침수 위험구간 높은 곳 보여줘', 'OO시 교통사고 다발구역 보여줘'],
    labelType: 'national' as const,
  },
  {
    title: '시설·매뉴얼 조회',
    sub: '주변 시설 검색이나 대응 매뉴얼·지침을 확인하는 질문',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 6h8M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    keywords: ['OO시 AED 위치 보여줘', 'OO시 경찰서 위치 보여줘', 'OO시 침수 발생했을 때 대응 절차 알려줘'],
    labelType: 'national' as const,
  },
];

export default function Backwall3Page() {
  return (
    <div className="flex items-center justify-center w-screen h-screen bg-neutral-800 overflow-hidden">
      <div
        className="relative flex-shrink-0 overflow-hidden"
        style={{
          width: `${DISPLAY_WIDTH}px`,
          height: `${DISPLAY_HEIGHT}px`,
          background: '#0a0e14',
        }}
      >
        <div className="relative w-full h-full">

            <div className="relative z-10 flex flex-col h-full px-12 py-10">
              {/* Header */}
              <div className="text-center mb-6">
                <p className="text-blue-400 text-[40px] font-bold tracking-[0.15em] mb-4">
                  CUVIA Link 질문 가이드
                </p>
                <p className="text-gray-200 text-[24px] leading-[1.6] mx-auto">
                  자연어 질문으로 CCTV, 이벤트, 시설, 위험정보를 통합 조회하고<br />
                  지도 중심 시각화로 조회·분석·요약까지 지원하는
                  AI 기반 도시 운영 지원 서비스
                </p>
              </div>

              {/* Sections */}
              <div className="flex flex-col gap-3 flex-1">
                {GUIDE_SECTIONS.map((section) => (
                  <div
                    key={section.title}
                    className="rounded-xl overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {/* Section header */}
                    <div className="flex items-start gap-4 px-7 pt-6 pb-2.5">
                      <div
                        className="w-11 h-11 rounded-lg flex items-center justify-center text-blue-400 p-2.5 flex-shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, rgba(0,94,184,0.5) 0%, rgba(0,94,184,0.25) 100%)',
                          border: '1px solid rgba(0,94,184,0.5)',
                        }}
                      >
                        {section.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-white text-[26px] font-bold tracking-wide leading-tight">
                            {section.title}
                          </p>
                          {section.labelType === 'local' && (
                            <span
                              className="text-amber-300 text-[22px] font-semibold px-4 py-0.5 rounded-full flex-shrink-0"
                              style={{
                                background: 'rgba(251,191,36,0.15)',
                                border: '1px solid rgba(251,191,36,0.4)',
                              }}
                            >
                              과천시 시나리오 데이터
                            </span>
                          )}
                          {section.labelType === 'national' && (
                            <span
                              className="text-emerald-300 text-[22px] font-semibold px-4 py-0.5 rounded-full flex-shrink-0"
                              style={{
                                background: 'rgba(16,185,129,0.15)',
                                border: '1px solid rgba(16,185,129,0.4)',
                              }}
                            >
                              전국 데이터
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-[22px] mt-0.5">
                          {section.sub}
                        </p>
                      </div>
                    </div>

                    {/* Keywords */}
                    <div className="px-7 pt-2.5 pb-6 flex flex-wrap gap-2.5">
                      {section.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="text-blue-700 text-[22px] font-semibold px-4 py-1.5 rounded-lg"
                          style={{
                            background: 'rgba(255,255,255,0.92)',
                            border: '1px solid rgba(255,255,255,0.6)',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                          }}
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="text-center mt-auto pt-3">
                <div
                  className="w-full h-[1px] mb-3"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(0,94,184,0.3), transparent)' }}
                />
                <p className="text-gray-500 text-[22px] tracking-wider">
                  © CUDO Communications. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
