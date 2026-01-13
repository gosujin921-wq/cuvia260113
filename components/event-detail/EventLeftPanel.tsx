'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import BroadcastControls from '@/components/BroadcastControls';
import { getEventCategory, BaseEvent } from '@/lib/events-data';
import { EventData, RiskFactor } from './types';
import { riskLevelMeta } from './constants';

interface EventLeftPanelProps {
  event: EventData;
  baseEvent: BaseEvent;
  priority: '긴급' | '경계' | '주의';
  aiSummary: string;
  riskFactors: RiskFactor[];
  priorityScore: number;
  confidenceScore: number;
  riskReasonSummary: string;
  formattedDateTime: string;
  normalizedSource: string;
  dashboardEvent: ReturnType<typeof import('@/lib/events-data').convertToDashboardEvent> | null;
  onAddClipsRef: React.MutableRefObject<((clips: Array<{ id: string; cctvId: string; cctvName: string; timestamp: string; duration: string; frameTimestamp: string; thumbnail: string; status: 'saved' | 'ready' }>) => void) | null>;
  onOpenModalRef: React.MutableRefObject<(() => void) | null>;
  onModalStateChange?: (isOpen: boolean) => void;
}

export const EventLeftPanel: React.FC<EventLeftPanelProps> = ({
  event,
  baseEvent,
  priority,
  aiSummary,
  riskFactors,
  priorityScore,
  confidenceScore,
  riskReasonSummary,
  formattedDateTime,
  normalizedSource,
  dashboardEvent,
  onAddClipsRef,
  onOpenModalRef,
  onModalStateChange,
}) => {
  return (
    <aside className="flex flex-col flex-shrink-0 w-[370px] pl-4 pr-5 h-full overflow-hidden">
      <div className="py-4 px-3 flex items-center justify-between flex-shrink-0">
        <Link href="/" className="w-24 h-5 flex items-center justify-start">
          <img 
            src="/logo.svg" 
            alt="CUVIA Logo" 
            className="h-5 w-auto object-contain"
          />
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 hover:bg-[#36383B] rounded transition-colors"
          aria-label="대시보드로 이동"
        >
          <Icon icon="mdi:arrow-left" className="w-5 h-5 text-gray-400 hover:text-white" />
          <span className="text-sm text-gray-400 hover:text-white">dashboard</span>
        </Link>
      </div>
      <div className="flex-1 overflow-hidden min-h-0">
        <div className="w-full bg-[#161719] flex flex-col h-full overflow-y-auto">
          {/* 이벤트 헤더 정보 - 대시보드 이벤트 카드 스타일 */}
          <div className="px-3 pt-3 pb-4 border-b border-[#31353a]" style={{ paddingLeft: '14px' }}>
            {/* 2. 유형 / 카테고리 */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded text-xs ${
                baseEvent.domain === 'A'
                  ? baseEvent.type.includes('폭행') || baseEvent.type.includes('상해')
                    ? 'bg-red-500/20 text-red-400'
                    : baseEvent.type.includes('절도') || baseEvent.type.includes('강도')
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : baseEvent.type.includes('차량도주') || baseEvent.type.includes('추적')
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-blue-500/20 text-blue-400'
                  : baseEvent.domain === 'B'
                    ? 'bg-red-500/20 text-red-400'
                    : baseEvent.domain === 'C'
                      ? 'bg-purple-500/20 text-purple-400'
                      : baseEvent.domain === 'D'
                        ? 'bg-green-500/20 text-green-400'
                        : baseEvent.domain === 'E'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-gray-500/20 text-gray-400'
              }`}>
                {event.type}
              </span>
              <span className="text-blue-300 text-[0.75rem] font-medium">{getEventCategory(baseEvent)}</span>
            </div>

            {/* 3. 제목 (AI가 축약한 핵심 문장) */}
            <div className="text-white text-base font-semibold mb-2 flex items-center gap-2">
              <span>{event.title}</span>
              {priority === '긴급' && (
                <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">긴급</span>
              )}
              {priority === '경계' && (
                <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">경계</span>
              )}
              {priority === '주의' && (
                <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">주의</span>
              )}
            </div>
          </div>

          {/* 스크롤 가능한 컨텐츠 영역 */}
          <div className="space-y-2">
            {/* AI 인사이트 */}
            <div className="px-3 pt-4 pb-6">
              <div className="flex items-center gap-2 text-sm tracking-tight text-[#50A1FF] mb-2">
                <Icon icon="mdi:sparkles" className="w-5 h-5 text-[#50A1FF]" />
                <span className="text-[#50A1FF] font-semibold">AI 인사이트</span>
              </div>
              <div className="text-white text-sm leading-relaxed whitespace-pre-wrap px-3 py-2 bg-[#0f1723] border border-[#155DFC]">
                {aiSummary}
              </div>
            </div>
            <div className="px-3 pb-6">
              <BroadcastControls
                eventId={event.id}
                eventTitle={event.title}
                source={normalizedSource || '112 신고'}
                location={event.location}
                receivedAt={formattedDateTime}
                priority={priority}
                aiSummary={aiSummary}
                riskSummary={riskReasonSummary}
                onAddClipsRef={onAddClipsRef}
                onOpenModalRef={onOpenModalRef}
                onModalStateChange={onModalStateChange}
              />
            </div>
            {/* 기본 정보 */}
            <div className="px-3 space-y-2 text-sm text-gray-300">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">접수 시간</span>
                <span className="font-semibold">{formattedDateTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">신고 기관</span>
                <span className="font-semibold">{normalizedSource}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">위치</span>
                <span className="text-right ml-4 font-semibold">{event.location}</span>
              </div>
              {dashboardEvent && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">이벤트 상태</span>
                  <span className="font-semibold">{dashboardEvent.processingStage}</span>
                </div>
              )}
            </div>
            {/* 위험 요인 분석 */}
            {riskFactors.length > 0 && (
              <div className="px-3 space-y-3 mt-6 pb-6">
                <div className="flex items-center gap-2 text-sm text-white font-semibold">
                  <Icon icon="mdi:alert" className="w-4 h-4 text-red-300" />
                  위험 요인 분석
                </div>
                <div className="space-y-2">
                  {riskFactors.map((factor) => (
                    <div
                      key={factor.label}
                      className="flex items-center justify-between px-4 py-4 border-b border-[#2a2d36] last:border-b-0 bg-[#36383B] text-sm"
                    >
                      <div className="text-white font-semibold">{factor.label}</div>
                      <div className="flex items-center gap-3 justify-end text-right text-sm">
                        <span className="text-white font-semibold">{factor.value}</span>
                        <Icon
                          icon={riskLevelMeta[factor.level].icon}
                          className={`w-5 h-5 ${riskLevelMeta[factor.level].color}`}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 space-y-2 text-sm text-gray-100 bg-[#36383B] px-3 py-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-gray-300">우선순위 점수</span>
                      <span className="text-white font-semibold">{priorityScore}점</span>
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-gray-300">신뢰도</span>
                      <span className="text-white font-semibold">{confidenceScore}%</span>
                    </div>
                    <div className="px-1">
                      <span className="text-gray-300 text-xs">이유</span>
                      <p className="text-gray-100 text-sm leading-relaxed mt-1">
                        {riskReasonSummary}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

