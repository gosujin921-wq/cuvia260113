'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface InsightCard {
  wanderingDuration: string;
  riskScore: number;
  behaviorSummary: string;
  anomalies: string[];
  cctvHint: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface TimelineItem {
  time: string;
  label: string;
  detail: string;
}

interface PathPoint {
  id: string;
  label: string;
  status: 'normal' | 'repeat' | 'exit';
}

interface ReIDCandidate {
  id: string;
  similarity: string;
  lastSeen: string;
  location: string;
}

interface ThreadItem {
  id: string;
  title: string;
  type: string;
  depth: number;
}

const BehaviorAnalysisPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('wandering');
  const [selectedCCTV, setSelectedCCTV] = useState<string>('CCTV-04');
  const [insight, setInsight] = useState<InsightCard | null>(null);
  const [aiActions, setAiActions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const categories: Category[] = [
    { id: 'wandering', name: '배회 (Wandering)', icon: 'mdi:walk' },
    { id: 'fall', name: '쓰러짐 (Fall-down)', icon: 'mdi:human-fall' },
    { id: 'rapid-exit', name: '급이탈 (Rapid Exit)', icon: 'mdi:run-fast' },
    { id: 'pursuit', name: '추격/도주', icon: 'mdi:run' },
    { id: 'stare', name: '정체/응시', icon: 'mdi:eye-outline' },
    { id: 'combined', name: '이상 행동 종합', icon: 'mdi:account-alert' },
    { id: 'path', name: '동선/경로 분석', icon: 'mdi:map-marker-path' },
    { id: 'reid', name: 'ReID 유사 인물', icon: 'mdi:account-search' },
    { id: 'thread', name: '행동 스레드 만들기', icon: 'mdi:link-variant' },
  ];

  const timeline: TimelineItem[] = [
    { time: '12:30', label: '배회 감지', detail: '8분간 영역 반복 이동' },
    { time: '12:32', label: '동선 반복', detail: '동일 경로 3회 이상' },
    { time: '12:34', label: '정체 행동', detail: '3분간 제자리 정체' },
    { time: '12:35', label: '급이탈', detail: 'CCTV-04 → CCTV-07 방향으로 급 이동' },
  ];

  const pathPoints: PathPoint[] = [
    { id: 'A', label: '진입 지점', status: 'normal' },
    { id: 'B', label: '반복 구간', status: 'repeat' },
    { id: 'C', label: '정체 지점', status: 'repeat' },
    { id: 'D', label: '급이탈 방향', status: 'exit' },
  ];

  const reidCandidates: ReIDCandidate[] = [
    { id: 'RH-12', similarity: '82%', lastSeen: '2024-01-05', location: 'CCTV-21 (평촌동)' },
    { id: 'RH-08', similarity: '74%', lastSeen: '2023-12-28', location: 'CCTV-14 (호계동)' },
  ];

  const threadItems: ThreadItem[] = [
    { id: '1', title: '배회 행동', type: 'Wandering', depth: 0 },
    { id: '2', title: '급이탈 탐지', type: 'Rapid Exit', depth: 1 },
    { id: '3', title: '추격 후보', type: 'Pursuit', depth: 2 },
  ];

  const defaultInsight: InsightCard = {
    wanderingDuration: '배회 행동 8분 지속',
    riskScore: 68,
    behaviorSummary: '동행자 없음 / 목적지 없음 / 되돌아가기 반복',
    anomalies: [
      '20초 전 급이탈 행동 감지',
      '동선 반복 패턴 3회',
      '이동 속도 증가 구간 확인',
    ],
    cctvHint: 'CCTV-04 → CCTV-07 이동 경로 예측 정확도 73%'
  };

  useEffect(() => {
    const query = searchParams.get('query');
    if (query) {
      setInput(query);
      handleQuery(query);
    } else {
      setInsight(defaultInsight);
      setAiActions(['동선 예측 경로 준비', 'ReID 후보 2건 업데이트']);
    }
  }, [searchParams]);

  const handleQuery = (query: string) => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('급이탈')) {
      setInsight({
        wanderingDuration: '급이탈 전 배회 6분 감지',
        riskScore: 74,
        behaviorSummary: '이탈 직전 속도 1.8배 증가, 경로 변경 2회',
        anomalies: [
          '이탈 방향 CCTV-07 우선 모니터링 필요',
          '재진입 확률 34%',
        ],
        cctvHint: 'CCTV-04 → CCTV-07 이동 예측 성공률 79%'
      });
      setSelectedCategory('rapid-exit');
      setAiActions(['동선 예측 경로 보기', '연관 CCTV 추천 완료']);
    } else if (lowerQuery.includes('reid')) {
      setInsight({
        wanderingDuration: 'ReID 후보 2건 일치',
        riskScore: 62,
        behaviorSummary: '동일 패턴: 배회 → 급이탈 → 되돌아감',
        anomalies: ['최근 30일 내 동일 패턴 4회', '동안/만안 권역에서 반복'],
        cctvHint: 'ReID 후보 RH-12 (82%) 추적 권장'
      });
      setSelectedCategory('reid');
      setAiActions(['ReID 후보 더 보기', '행동 스레드 생성']);
    } else if (lowerQuery.includes('배회') || lowerQuery.includes('행동')) {
      setInsight(defaultInsight);
      setSelectedCategory('wandering');
      setAiActions(['동선 예측 경로 보기', '행동 통계 보기']);
    } else {
      setInsight(defaultInsight);
      setAiActions([]);
    }

    setIsLoading(false);
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        setIsLoading(true);
        setTimeout(() => {
          handleQuery(input.trim());
        }, 500);
      }
    }
  };

  const handleCategorySelect = (categoryId: string) => setSelectedCategory(categoryId);

  const handleActionClick = (action: string) => {
    console.log('Behavior action:', action);
  };

  return (
    <div className="flex flex-col h-screen bg-[#161719] overflow-hidden">
      {/* 상단 헤더 */}
      <header className="flex h-16 items-center justify-between bg-[#1a1a1a] border-b border-[#31353a] px-6" style={{ borderWidth: '1px' }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-24 h-5 flex items-center justify-center">
              <img src="/logo.svg" alt="CUVIA Logo" className="h-5 w-auto object-contain" />
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Icon icon="mdi:eye" className="w-6 h-6 text-blue-400" />
            <span className="text-xl font-semibold text-white">행동 분석</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/agent-hub" className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-full transition-colors text-sm">
            Agent Hub
          </Link>
          <Link href="/" className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-full transition-colors text-sm">
            대시보드
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        {/* 좌측: 카테고리 */}
        <div className="w-64 flex-shrink-0 bg-[#1a1a1a] border-r border-[#31353a] overflow-y-auto" style={{ borderWidth: '1px' }}>
          <div className="p-4 border-b border-[#31353a]" style={{ borderWidth: '1px' }}>
            <h2 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
              <Icon icon="mdi:folder" className="w-5 h-5 text-blue-400" />
              행동 분석 카테고리
            </h2>
          </div>
          <div className="p-2 space-y-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all border ${
                  selectedCategory === category.id
                    ? 'bg-blue-500/20 border-blue-500/50 text-white'
                    : 'border-transparent text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                }`}
                style={{ borderWidth: '1px' }}
              >
                <div className="flex items-center gap-3">
                  <Icon icon={category.icon} className="w-5 h-5" />
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 중앙 */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* 검색 */}
          <div className="p-4 border-b border-[#2a2a2a] bg-[#1a1a1a]" style={{ borderWidth: '1px' }}>
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Icon icon="mdi:magnify" className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleInputKeyPress}
                  placeholder="행동을 분석하세요... (예: 이 사람 계속 배회해?)"
                  className="w-full pl-12 pr-14 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/20 transition-all"
                  style={{ borderWidth: '1px' }}
                  disabled={isLoading}
                />
                {input && (
                  <button
                    onClick={() => {
                      setInput('');
                      setInsight(defaultInsight);
                      setAiActions([]);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-[#2a2a2a] rounded-full transition-colors"
                  >
                    <Icon icon="mdi:close" className="w-5 h-5 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* AI 인사이트 */}
            {insight && (
              <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6" style={{ borderWidth: '1px' }}>
                <div className="flex items-start gap-3 mb-4">
                  <Icon icon="mdi:lightbulb-on" className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-3">📌 AI 행동 인사이트</h3>
                    <div className="space-y-2 text-sm">
                      <div className="text-white font-medium">{insight.wanderingDuration}</div>
                      <div className="text-red-400 font-semibold">위험 가능성 {insight.riskScore}%</div>
                      <div className="text-gray-300">{insight.behaviorSummary}</div>
                      {insight.anomalies.map((item, idx) => (
                        <div key={idx} className="text-gray-300">• {item}</div>
                      ))}
                      <div className="text-blue-400 font-medium">→ {insight.cctvHint}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-gray-400 mb-6">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            )}

            {insight && (
              <>
                {/* CCTV Large View */}
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 mb-6" style={{ borderWidth: '1px' }}>
                  <h3 className="text-white font-semibold text-lg mb-4">CCTV Large View</h3>
                  <div className="bg-[#242424] rounded-lg overflow-hidden">
                    <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center relative">
                      <Icon icon="mdi:walk" className="w-12 h-12 text-gray-600" />
                      <div className="absolute top-4 left-4 bg-red-500/40 border border-red-500/70 rounded px-3 py-1 text-xs text-white" style={{ borderWidth: '1px' }}>
                        배회 감지
                      </div>
                      <div className="absolute bottom-4 right-4 text-right text-xs text-gray-300">
                        이동 속도: 1.4m/s<br />시선 방향: 북동
                      </div>
                    </div>
                  </div>
                </div>

                {/* 행동 타임라인 & 동선 맵 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6" style={{ borderWidth: '1px' }}>
                    <h3 className="text-white font-semibold text-lg mb-4">행동 타임라인</h3>
                    <div className="space-y-4">
                      {timeline.map((item, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="text-blue-400 font-medium w-16">{item.time}</div>
                          <div>
                            <div className="text-white font-medium">{item.label}</div>
                            <div className="text-gray-400 text-sm">{item.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6" style={{ borderWidth: '1px' }}>
                    <h3 className="text-white font-semibold text-lg mb-4">동선 맵 (Path Map)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {pathPoints.map((point) => (
                        <div
                          key={point.id}
                          className={`rounded-lg p-4 text-center border ${
                            point.status === 'repeat'
                              ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300'
                              : point.status === 'exit'
                                ? 'border-red-500/50 bg-red-500/10 text-red-300'
                                : 'border-[#2a2a2a] bg-[#242424] text-gray-300'
                          }`}
                          style={{ borderWidth: '1px' }}
                        >
                          <div className="text-2xl font-semibold">{point.id}</div>
                          <div className="text-sm mt-2">{point.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ReID 및 스레드 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6" style={{ borderWidth: '1px' }}>
                    <h3 className="text-white font-semibold text-lg mb-4">ReID 후보 카드</h3>
                    <div className="space-y-3">
                      {reidCandidates.map((candidate) => (
                        <div key={candidate.id} className="bg-[#242424] border border-[#2a2a2a] rounded-lg p-4" style={{ borderWidth: '1px' }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-medium">{candidate.id}</span>
                            <span className="text-blue-400 text-sm">{candidate.similarity} 유사</span>
                          </div>
                          <div className="text-gray-400 text-xs">last seen: {candidate.lastSeen}</div>
                          <div className="text-gray-300 text-xs mt-1">{candidate.location}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6" style={{ borderWidth: '1px' }}>
                    <h3 className="text-white font-semibold text-lg mb-4">행동 스레드</h3>
                    <div className="space-y-3">
                      {threadItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-[#242424] border border-[#2a2a2a] rounded-lg p-3"
                          style={{ borderWidth: '1px', marginLeft: `${item.depth * 16}px` }}
                        >
                          <div className="flex items-center gap-2">
                            <Icon icon="mdi:link-variant" className="w-4 h-4 text-blue-400" />
                            <span className="text-white text-sm font-medium">{item.title}</span>
                            <span className="text-gray-400 text-xs">{item.type}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 우측 */}
        <div className="w-80 flex-shrink-0 bg-[#1a1a1a] border-l border-[#2a2a2a] overflow-y-auto hidden" style={{ borderWidth: '1px' }}>
          <div className="p-4 border-b border-[#2a2a2a]" style={{ borderWidth: '1px' }}>
            <h2 className="text-white font-semibold text-sm mb-2">조건/필터</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">행동 유형</label>
              <select className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm" style={{ borderWidth: '1px' }}>
                <option>배회</option>
                <option>쓰러짐</option>
                <option>급이탈</option>
                <option>추격/도주</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-2 block">시간 범위</label>
              <select className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm" style={{ borderWidth: '1px' }}>
                <option>최근 5분</option>
                <option>최근 10분</option>
                <option>최근 30분</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-2 block">CCTV 선택</label>
              <select className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm" style={{ borderWidth: '1px' }}>
                <option>CCTV-04</option>
                <option>CCTV-07</option>
                <option>CCTV-12</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-2 block">연관 가능성</label>
              <select className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm" style={{ borderWidth: '1px' }}>
                <option>전체</option>
                <option>높음</option>
                <option>중간</option>
                <option>낮음</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-2 block">ReID 후보</label>
              <select className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm" style={{ borderWidth: '1px' }}>
                <option>전체</option>
                <option>RH-12</option>
                <option>RH-08</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-2 block">위험도</label>
              <select className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm" style={{ borderWidth: '1px' }}>
                <option>전체</option>
                <option>High</option>
                <option>Medium</option>
              </select>
            </div>

            <div className="pt-4 border-t border-[#2a2a2a]" style={{ borderWidth: '1px' }}>
              <h3 className="text-white font-semibold text-sm mb-3">AI 제안 액션</h3>
              <div className="space-y-2">
                {[
                  '동선 예측 경로 보기',
                  '연관 CCTV 추천',
                  'ReID 후보 더 보기',
                  '행동 스레드 생성',
                  '사건대응 Agent로 전송',
                  '행동 통계 보기',
                  '영상 구간 저장',
                  '증거 장면 10초 추출',
                ].map((action) => (
                  <button
                    key={action}
                    onClick={() => handleActionClick(action)}
                    className="w-full px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 text-sm hover:bg-blue-500/30 transition-colors text-left"
                    style={{ borderWidth: '1px' }}
                  >
                    🟦 {action}
                  </button>
                ))}
              </div>
            </div>

            {aiActions.length > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4" style={{ borderWidth: '1px' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon icon="mdi:robot" className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-medium text-sm">AI 추천 완료</span>
                </div>
                <div className="space-y-1">
                  {aiActions.map((action, index) => (
                    <div key={index} className="text-sm text-gray-300 flex items-center gap-2">
                      <Icon icon="mdi:check-circle" className="w-4 h-4 text-green-400" />
                      {action}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function BehaviorAnalysisPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-[#0f0f0f]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">로딩 중...</p>
        </div>
      </div>
    }>
      <BehaviorAnalysisPageContent />
    </Suspense>
  );
}
