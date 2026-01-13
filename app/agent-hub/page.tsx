'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AgentCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export default function AgentHubPage() {
  const router = useRouter();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [input, setInput] = useState('');

  const agents: AgentCard[] = [
    {
      id: 'statistics',
      title: '통계조회',
      description: '사건 발생 패턴과 위험도를 분석해 관제 전략에 도움이 되는 통계를 제공합니다.',
      icon: 'mdi:chart-line',
      color: 'blue',
    },
    {
      id: 'event-history',
      title: '이벤트 이력',
      description: '과거 사건 기록을 검색하고 비교해 판단에 도움을 줍니다.',
      icon: 'mdi:history',
      color: 'blue',
    },
    {
      id: 'incident-response',
      title: '사건 대응',
      description: '사건의 위험도·연관성·우선순위를 분석해 즉시 대응을 돕습니다.',
      icon: 'mdi:alert-circle',
      color: 'blue',
    },
    {
      id: 'behavior-analysis',
      title: '행동 분석',
      description: 'CCTV 행동 패턴을 분석해 사건과 관련된 단서를 제공합니다.',
      icon: 'mdi:eye',
      color: 'blue',
    },
    {
      id: 'map-spatial',
      title: '지도/공간',
      description: '지도·CCTV·지형 정보를 기반으로 최적의 대응 경로를 제안합니다.',
      icon: 'mdi:map',
      color: 'blue',
    },
    {
      id: 'document-broadcast',
      title: '문서/전파',
      description: '112/119 전파문과 보고서를 자동으로 생성해 문서 업무를 지원합니다.',
      icon: 'mdi:file-document',
      color: 'blue',
    },
  ];

  const getColorClasses = () => {
    return {
      bg: 'bg-[#36383B]',
      icon: 'text-blue-400',
      hover: 'hover:bg-[#3f4144]',
    };
  };

  const handleAgentClick = (agentId: string) => {
    if (agentId === 'statistics') {
      router.push('/statistics');
      return;
    }
    if (agentId === 'event-history') {
      router.push('/event-history');
      return;
    }
    if (agentId === 'incident-response') {
      router.push('/incident-response');
      return;
    }
    if (agentId === 'behavior-analysis') {
      router.push('/behavior-analysis');
      return;
    }
    setSelectedAgent(agentId);
    // TODO: 각 Agent별 상세 페이지 또는 모달 구현
  };

  const handleKeyDown = (e: React.KeyboardEvent, agentId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAgentClick(agentId);
    }
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        // 입력 내용을 쿼리 파라미터로 전달하여 ai-agent 페이지로 이동
        router.push(`/ai-agent?query=${encodeURIComponent(input.trim())}`);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#161719] overflow-hidden relative">
      {/* 상단 헤더 (최소화) */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-24 h-5 flex items-center justify-center">
            <img 
              src="/logo.svg" 
              alt="CUVIA Logo" 
              className="h-5 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
            />
          </div>
        </Link>
        <Link
          href="/"
          className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          대시보드
        </Link>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-40">
        {/* 로고/타이틀 영역 */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Icon icon="mdi:robot" className="w-10 h-10 text-blue-400" />
            <h1 className="text-4xl font-normal text-white">Agent Hub</h1>
          </div>
        </div>

        {/* 검색창 영역 (캡슐 디자인) */}
        <div className="w-full max-w-2xl mb-8">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
              <Icon icon="mdi:sparkles" className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleInputKeyPress}
              placeholder="Agent Hub에 질문하세요..."
              className="w-full pl-12 pr-14 py-4 bg-[#1a1a1a] border border-[#31353a] text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/20 transition-all rounded-full"
              style={{ borderWidth: '1px' }}
              aria-label="질문 입력"
            />
            {input && (
              <button
                onClick={() => setInput('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-[#31353a] transition-colors rounded-full"
                aria-label="입력 지우기"
              >
                <Icon icon="mdi:close" className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Agent 카드 그리드 (직사각형 디자인) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl">
          {agents.map((agent) => {
            const colors = getColorClasses();
            const isSelected = selectedAgent === agent.id;
            
            return (
              <div
                key={agent.id}
                onClick={() => handleAgentClick(agent.id)}
                onKeyDown={(e) => handleKeyDown(e, agent.id)}
                tabIndex={0}
                aria-label={`${agent.title} Agent 열기`}
                className={`
                  ${colors.bg} ${colors.hover}
                  p-6 cursor-pointer transition-all duration-200 rounded-none
                  ${isSelected ? 'ring-2 ring-offset-2 ring-offset-[#161719] ring-blue-500' : ''}
                `}
              >
                <div className="flex items-start gap-4">
                  <div className={`
                    ${colors.icon} bg-[#161719] flex-shrink-0 rounded-lg flex items-center justify-center
                  `} style={{ width: '56px', height: '56px' }}>
                    <Icon icon={agent.icon} className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {agent.title}
                      {(agent.id === 'incident-response' || agent.id === 'event-history' || 
                        agent.id === 'behavior-analysis' || agent.id === 'map-spatial' || 
                        agent.id === 'document-broadcast') && (
                        <span className="ml-2 text-sm font-normal text-gray-400">Agent</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {agent.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

