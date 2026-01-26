import React from 'react';
import { Icon } from '@iconify/react';
import { Event } from '@/types';

interface SituationSummaryProps {
  event: Event | null;
  onClose: () => void;
  hideControls?: boolean;
}

/**
 * 상황요약 팝업 컴포넌트
 * 대시보드 맵뷰에서 이벤트를 선택했을 때 표시되는 팝업입니다.
 */
const SituationSummary: React.FC<SituationSummaryProps> = ({ event, onClose, hideControls = false }) => {
  if (!event) return null;

  // "상가 절도 의심" 이벤트는 팝업 전체 제외
  const isTheftEvent = event.title.includes('상가 절도 의심') || event.title.includes('현금 절취 포착');
  if (isTheftEvent) return null;

  const aiCaseSummaryText =
    '경찰청 신고에 따르면, 2026-01-07 09:30경 부천시 원미구 부천로 245번길 일원에서 22세 남성 김도연이 마지막으로 확인된 이후 행방불명 상태로 확인되었습니다.';

  const TOP_PANEL_HEIGHT = 56;
  const topOffset = hideControls ? 20 + TOP_PANEL_HEIGHT : 20;

  return (
    <div className="absolute right-5 z-[1000]" style={{ top: `${topOffset}px` }}>
      <div
        className="gradient-border-left-top w-[420px] max-h-[600px] overflow-y-auto flex flex-col rounded-lg"
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          borderWidth: '1px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          className="flex items-center justify-between p-4 border-b border-[#31353a]"
          style={{ borderBottomWidth: '1px' }}
        >
          <div className="flex items-center gap-2 text-base font-semibold text-white">
            <Icon icon="mdi:file-document-outline" className="w-5 h-5 text-gray-400" />
            <h3>상황 요약</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors focus:outline-none"
            aria-label="닫기"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* AI 사건요약 */}
          <div className="rounded-xl border border-blue-500/30 bg-[#0f0f0f] p-4 shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:border-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-300" style={{ borderWidth: '1px' }}>
            <div className="flex items-start gap-3">
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #0066FF 0%, #8A2BE2 50%, #ff8566 100%)',
                }}
              >
                <img
                  src="/simbol.svg"
                  alt="AI"
                  className="w-4 h-4"
                  style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-white font-semibold text-sm">AI 사건요약</div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/10">
                    요약
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-200 leading-relaxed whitespace-pre-line">
                  {aiCaseSummaryText}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SituationSummary;
