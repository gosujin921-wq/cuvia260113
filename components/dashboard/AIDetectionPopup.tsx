import React from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { Event } from '@/types';
import { getEventById, generateAIInsight, getAIInsightKeywords } from '@/lib/events-data';
import { getRandomCCTVVideo } from '@/lib/cctv-video-utils';
import { getPrimaryButtonClassName } from '@/components/shared/styles';

interface AIDetectionPopupProps {
  event: Event | null;
  onClose: () => void;
}

/**
 * AI탐지 팝업 컴포넌트
 * 대시보드 맵뷰에서 AI 탐지된 이벤트를 표시하는 팝업입니다.
 */
const AIDetectionPopup: React.FC<AIDetectionPopupProps> = ({ event, onClose }) => {
  const navigate = useNavigate();

  if (!event) return null;

  // "상가 절도 의심" 이벤트는 팝업 전체 제외
  const isTheftEvent = event.title.includes('상가 절도 의심') || event.title.includes('현금 절취 포착');
  if (isTheftEvent) return null;

  const baseEvent = event.eventId ? getEventById(event.eventId) : null;
  const keywords = baseEvent ? getAIInsightKeywords(baseEvent) : [];
  const aiInsightText = baseEvent ? generateAIInsight(baseEvent) : null;

  const handleBroadcast = () => {
    const generateBroadcastInsight = () => {
      if (event.type.includes('화재')) {
        return '화재 이벤트 발생. 강풍 영향으로 확산 위험이 높으며, 접근 가능한 도로가 제한적입니다. 즉시 소방대 출동이 필요합니다.';
      } else if (event.type.includes('미아') || event.type.includes('배회')) {
        return '실종/배회 이벤트 발생. 마지막 목격 좌표 기준 반경 300m 내에서 배회 행동이 감지되었습니다. 즉시 수색대 출동이 필요합니다.';
      } else if (event.type.includes('약자')) {
        return '약자 쓰러짐 이벤트 발생. 강풍·조도·지형 영향으로 긴급도 High입니다. 즉시 구조대 출동이 필요합니다.';
      } else if (event.type.includes('치안') || event.type.includes('폭행') || event.type.includes('절도')) {
        return '치안 사건 발생. CCTV AI 감지 및 112 신고가 동시에 접수되어 고신뢰도 사건으로 분류되었습니다. 즉시 경찰 출동이 필요합니다.';
      }
      return `${event.title} 이벤트 발생. 현재 상황을 분석 중이며, 필요시 즉시 대응이 필요합니다.`;
    };
    
    const aiInsight = generateBroadcastInsight();
    const message = `[${event.location.name}]\n\n${aiInsight}`;
    
    alert(message);
  };

  return (
    <div className="absolute top-5 right-5 z-[1000]">
      <div
        className="bg-[#101013] border border-cyan-500/40 shadow-[0_0_30px_rgba(34,211,238,0.3),0_0_60px_rgba(34,211,238,0.15)] w-[420px] max-h-[600px] overflow-y-auto flex flex-col rounded-2xl"
        style={{ borderWidth: '1px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          className="flex items-center justify-between p-4 border-b border-[#31353a]"
          style={{ borderBottomWidth: '1px' }}
        >
          <div className="flex items-center gap-2 text-base font-semibold text-white">
            <Icon icon="mdi:robot" className="w-5 h-5 text-blue-400" />
            <h3>AI 탐지</h3>
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
        <div className="flex-1 overflow-y-auto">
          {/* 감지된 CCTV 영상 */}
          <div className="p-4">
          <div className="w-full bg-[#0f0f0f] border border-cyan-500/30 rounded-xl overflow-hidden relative shadow-[0_0_20px_rgba(34,211,238,0.2)]" style={{ borderWidth: '1px', aspectRatio: '16/9' }}>
          <video 
            src={event.id ? getRandomCCTVVideo(event.id) : getRandomCCTVVideo()}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Live/Clip 상태 오버레이 */}
          <div className="absolute top-2 left-2 flex gap-2" style={{ zIndex: 10 }}>
            <span className="px-2 py-0.5 bg-red-500/90 text-white text-xs font-semibold rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              LIVE
            </span>
            <span className="px-2 py-0.5 bg-blue-500/90 text-white text-xs font-semibold rounded">
              CLIP
            </span>
          </div>
          
          {/* 플레이 타임라인과 인디케이터 */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3" style={{ zIndex: 10 }}>
            {/* 타임라인 */}
            <div className="relative w-full h-1 bg-gray-600/50 rounded-full mb-2 cursor-pointer flex items-center">
              {/* 재생 진행 바 */}
              <div 
                className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
                style={{ width: '35%' }}
              ></div>
              {/* 재생 인디케이터 */}
              <div 
                className="absolute w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg"
                style={{ left: '35%', top: '50%', transform: 'translate(-50%, -50%)' }}
              ></div>
            </div>
            {/* 시간 표시 */}
            <div className="flex items-center justify-between text-white text-xs">
              <span>00:12</span>
              <span className="text-gray-400">00:35</span>
            </div>
          </div>
          </div>
          </div>

          {/* 이벤트 명 */}
          <div className="px-4 mb-4">
            <div className="text-white font-semibold text-sm mb-1">{event.title}</div>
            <div className="text-gray-400 text-xs">{event.location.name}</div>
          </div>

          {/* AI 분석 - AI 인사이트 요약 + 핵심 키워드 */}
          {keywords.length > 0 || aiInsightText ? (
            <div className="px-4 mb-4">
              <div className="bg-blue-500/10 border border-cyan-500/40 rounded-xl p-4 shadow-[0_0_20px_rgba(34,211,238,0.25)]" style={{ borderWidth: '1px' }}>
                <div className="flex items-start gap-2 mb-3">
                  <img 
                    src="/simbol.svg" 
                    alt="AI" 
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    style={{ filter: 'brightness(0) saturate(100%) invert(60%) sepia(100%) saturate(2000%) hue-rotate(190deg) brightness(1.1)' }}
                  />
                  <h3 className="text-white font-semibold text-sm">AI 분석</h3>
                </div>
                
                {/* AI 인사이트 내용 요약 */}
                {aiInsightText && (
                  <div className="mb-3 text-xs text-white leading-relaxed">
                    {aiInsightText.split('. ').filter(s => s.trim()).slice(0, 2).map((sentence, idx) => (
                      <div key={idx} className="text-white mb-1">
                        {sentence.trim()}{sentence.trim().endsWith('.') ? '' : '.'}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 핵심 키워드 */}
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {keywords.slice(0, 5).map((keyword, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-500/30"
                        style={{ borderWidth: '1px' }}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* 버튼 영역 - 모니터링화면으로 가기 | 바로 전파 */}
        <div className="p-4 border-t border-[#31353a] flex gap-2 flex-shrink-0" style={{ borderTopWidth: '1px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (event.eventId) {
                navigate(`/event/${event.eventId}`);
              }
            }}
            className={`flex-1 ${getPrimaryButtonClassName()}`}
          >
            모니터링화면으로 가기
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleBroadcast();
            }}
            className={`flex-1 ${getPrimaryButtonClassName()}`}
          >
            바로 전파
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIDetectionPopup;
