'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getTabButtonClassName } from '@/components/shared/styles';

interface EventCenterColumn2Props {
  isRightPanelCollapsed: boolean;
  cctvSectionHeight: number | null;
  handleDragStart: (e: React.MouseEvent) => void;
  monitoringCCTVs: string[];
  handleRemoveFromMonitoring: (cctvKey: string) => void;
  setSelectedDetectedCCTV: (id: string | null) => void;
  setShowDetectedCCTVPopup: (show: boolean) => void;
  setSelectedMapCCTV?: (cctvId: string | null) => void;
  setShowMapCCTVPopup?: (show: boolean) => void;
  zoomLevel?: number;
  detectedCCTVThumbnails: Array<{
    id: string;
    cctvId: string;
    cctvName: string;
    timestamp: string;
    confidence: number;
    thumbnail: string;
    location: string;
    description: string;
    aiAnalysis?: string;
    suspectReason?: string;
    situation?: string;
  }>;
  cctvInfo: Record<string, {
    id: string;
    name: string;
    location: string;
    status: string;
  }>;
  cctvThumbnailMap: Record<string, string>;
  behaviorHighlights: string[];
  showMapCCTVPopup?: boolean;
  showDetectedCCTVPopup?: boolean;
  showCombinedCCTVPopup?: boolean;
  showAdditionalDataPopup?: boolean;
  showBroadcastDraftPopup?: boolean;
  movementTimeline: Array<{
    time: string;
    title: string;
    subtitle: string;
    cctvName: string | null;
    color: string;
    cctvId: string | null;
  }>;
  prototypeShowDetectedClipsDefault?: boolean;
  prototypeMovementTimelineFilter?: string[];
  prototypeBehaviorHighlightsFilter?: string[];
  prototypeShowSuspectInfo?: boolean;
  prototypeShowChildInfo?: boolean;
  prototypeShowVehicleAnalysis?: boolean;
  prototypeDetectedClipConfidence?: Record<string, number>;
}

export const EventCenterColumn2: React.FC<EventCenterColumn2Props> = ({
  isRightPanelCollapsed,
  cctvSectionHeight,
  handleDragStart,
  monitoringCCTVs,
  handleRemoveFromMonitoring,
  setSelectedDetectedCCTV,
  setShowDetectedCCTVPopup,
  setSelectedMapCCTV,
  setShowMapCCTVPopup,
  detectedCCTVThumbnails,
  cctvInfo,
  cctvThumbnailMap,
  behaviorHighlights,
  showMapCCTVPopup = false,
  showDetectedCCTVPopup = false,
  showCombinedCCTVPopup = false,
  showAdditionalDataPopup = false,
  showBroadcastDraftPopup = false,
  zoomLevel = 0,
  movementTimeline,
  prototypeShowDetectedClipsDefault = false,
  prototypeMovementTimelineFilter,
  prototypeBehaviorHighlightsFilter,
  prototypeShowSuspectInfo = false,
  prototypeShowChildInfo = false,
  prototypeShowVehicleAnalysis = false,
  prototypeDetectedClipConfidence = {},
}) => {
  const [activeTab, setActiveTab] = useState<'cctv' | 'movement' | 'analysis'>('cctv');

  // 줌 레벨에 따른 아이콘 스케일 계산
  const iconScale = zoomLevel === 0 ? 1 : 1.5; // 확대 시 1.5배

  // 키보드 단축키 (1: CCTV, 2: 위치 및 동선, 3: 분석 요약) - 팝업이 열려있으면 동작하지 않음
  useEffect(() => {
    if (showMapCCTVPopup || showDetectedCCTVPopup || showCombinedCCTVPopup || showAdditionalDataPopup || showBroadcastDraftPopup) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에 포커스가 있으면 무시
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === '1') {
        e.preventDefault();
        setActiveTab('cctv');
      } else if (e.key === '2') {
        e.preventDefault();
        setActiveTab('movement');
      } else if (e.key === '3') {
        e.preventDefault();
        setActiveTab('analysis');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showMapCCTVPopup, showDetectedCCTVPopup, showCombinedCCTVPopup, showAdditionalDataPopup, showBroadcastDraftPopup]);
  return (
    <div className="flex flex-col pt-4 pr-4 flex-1 min-w-0 min-h-0 overflow-hidden" data-section-container style={{ minHeight: 0, height: '100%' }}>
      {/* 탭 버튼 */}
      <div className="flex gap-2 mb-4 flex-shrink-0">
        <button
          onClick={() => setActiveTab('cctv')}
          className={getTabButtonClassName(activeTab === 'cctv')}
          style={{ borderWidth: activeTab === 'cctv' ? '0' : '1px' }}
        >
          CCTV
        </button>
        <button
          onClick={() => setActiveTab('movement')}
          className={getTabButtonClassName(activeTab === 'movement')}
          style={{ borderWidth: activeTab === 'movement' ? '0' : '1px' }}
        >
          위치 및 동선
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={getTabButtonClassName(activeTab === 'analysis')}
          style={{ borderWidth: activeTab === 'analysis' ? '0' : '1px' }}
        >
          분석 요약
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
        {activeTab === 'cctv' && (
          <div className="flex flex-col flex-1 min-h-0">
          {/* 포착된 CCTV 클립 */}
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden" style={{ flexBasis: '50%', flexGrow: 1, flexShrink: 1 }}>
            <div className="flex items-center gap-2 text-sm text-white font-semibold mb-3">
              <Icon icon="mdi:video-stabilization" className="w-4 h-4 text-purple-300" />
              포착된 CCTV 클립
            </div>
            <div className="overflow-y-auto flex-1">
              {prototypeShowDetectedClipsDefault ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Icon icon="mdi:video-off" className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-xs">영상 없음</p>
                  </div>
                </div>
              ) : (
                <div className={`grid gap-3`} style={{ 
                  gridTemplateColumns: isRightPanelCollapsed ? `repeat(auto-fill, minmax(160px, 1fr))` : `repeat(4, minmax(0, 1fr))`,
                }}>
                  {detectedCCTVThumbnails.map((detected) => (
                    <div
                      key={detected.id}
                      className="bg-[#0f0f0f] border border-[#31353a] rounded-lg overflow-hidden cursor-pointer hover:border-purple-500 transition-colors"
                      style={{ borderWidth: '1px' }}
                      onClick={() => {
                        setSelectedDetectedCCTV(detected.cctvId);
                        setShowDetectedCCTVPopup(true);
                      }}
                    >
                      <div className="relative aspect-video bg-black">
                        <img
                          src={detected.thumbnail}
                          alt={detected.cctvName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = cctvThumbnailMap[detected.cctvId] || '/cctv_img/001.jpg';
                          }}
                        />
                      {/* 정확도 라벨 */}
                      <div className="absolute top-2 right-2 px-2 py-1 bg-purple-600/90 backdrop-blur-sm text-white text-xs font-semibold rounded">
                        정확도 {prototypeDetectedClipConfidence[detected.cctvId] || detected.confidence}%
                      </div>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        {/* 이유: 타이틀 */}
                        <div className="text-white text-xs font-semibold line-clamp-1">{detected.description || detected.aiAnalysis || '포착됨'}</div>
                        {/* CCTV명 (한 줄 이상 시 ... 처리) */}
                        <div className="text-gray-400 text-xs truncate">{detected.cctvId}</div>
                        {/* 주소 */}
                        <div className="text-gray-500 text-xs truncate">{detected.location}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CCTV 모니터링 */}
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden" style={{ flexBasis: '50%', flexGrow: 1, flexShrink: 1 }}>
            <div className="flex items-center gap-2 text-sm text-white font-semibold mb-3">
              <Icon icon="mdi:cctv" className="w-4 h-4 text-blue-300" />
              CCTV 모니터링
            </div>
            <div className="overflow-y-auto flex-1">
              <div className={`grid gap-3`} style={{ 
                gridTemplateColumns: isRightPanelCollapsed ? `repeat(auto-fill, minmax(160px, 1fr))` : `repeat(4, minmax(0, 1fr))`,
              }}>
                {monitoringCCTVs.length === 0 ? (
                  <div className="col-span-4 text-center py-8">
                    <Icon icon="mdi:cctv-off" className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-xs">모니터링 중인 CCTV가 없습니다</p>
                  </div>
                ) : (
                  monitoringCCTVs.map((cctvKey) => {
                    const cctv = cctvInfo[cctvKey];
                    if (!cctv) return null;
                    
                    return (
                      <div
                        key={cctv.id}
                        className="bg-[#0f0f0f] border border-[#31353a] rounded-lg overflow-hidden relative group"
                        style={{ borderWidth: '1px' }}
                        onClick={() => {
                          if (setSelectedMapCCTV && setShowMapCCTVPopup) {
                            setSelectedMapCCTV(cctv.id);
                            setShowMapCCTVPopup(true);
                          }
                        }}
                      >
                        <div className="relative aspect-video bg-black">
                          <img
                            src={cctvThumbnailMap[cctv.id] || '/cctv_img/001.jpg'}
                            alt={cctv.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/cctv_img/001.jpg';
                            }}
                          />
                          <button
                            className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-black/90 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFromMonitoring(cctvKey);
                            }}
                            aria-label="모니터링에서 제거"
                          >
                            <Icon icon="mdi:close" className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="p-1.5 space-y-0.5">
                          {/* 위치: 타이틀 */}
                          <div className="text-white text-xs font-semibold line-clamp-1">
                            {cctv.location || '위치 정보 없음'}
                          </div>
                          {/* CCTV명 (1줄 이상 시 ... 처리) */}
                          <div className="text-gray-400 text-xs truncate">{cctv.id}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          </div>
        )}

        {activeTab === 'movement' && (
          <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
            <div className="flex items-center gap-2 text-sm text-white font-semibold mb-3 flex-shrink-0">
              <Icon icon="mdi:map-marker" className="w-5 h-5 text-green-300" />
              위치 및 동선
            </div>
            <div className="space-y-2 text-sm overflow-y-auto flex-1 min-h-0">
              {[...movementTimeline]
                .filter((entry) => {
                  if (prototypeMovementTimelineFilter && prototypeMovementTimelineFilter.length > 0) {
                    return prototypeMovementTimelineFilter.includes(entry.title);
                  }
                  return true;
                })
                .reverse()
                .map((entry, index) => (
                <div key={index} className="flex gap-3">
                  <div className="text-xs text-gray-500 w-16 flex-shrink-0">{entry.time}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${entry.color} mb-0.5`}>{entry.title}</p>
                    <p className="text-gray-400 text-xs mb-1">{entry.subtitle}</p>
                    {entry.cctvName && (
                      <p className="text-gray-500 text-xs">{entry.cctvName}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          {/* 분석 카드들 - 반응형 인라인 배치 */}
          <div className="flex flex-wrap gap-6">
            {/* 용의자 분석 카드 */}
            <div className="flex flex-col flex-1 min-w-[280px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-white font-semibold">
                  <Icon icon="mdi:account-search" className="w-4 h-4 text-blue-300" />
                  용의자 분석
                </div>
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs">추적중</span>
              </div>
              <div className="bg-[#0f0f0f] border border-[#31353a] p-4 space-y-3" style={{ borderWidth: '1px' }}>
                <div>
                  <div className="text-gray-400 text-xs mb-1">성별/연령</div>
                  <div className="text-white text-sm">남성, 30대 초반 추정</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">착의</div>
                  <div className="text-white text-sm">검은색 후드티, 청바지, 흰색 운동화</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">신체 정보</div>
                  <div className="text-white text-sm">170cm 추정, 중간 체격</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">행동</div>
                  <div className="text-white text-sm">아동을 강제로 이동시키는 장면 포착</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">ReID 신뢰도</div>
                  <div className="text-green-400 text-sm">89%</div>
                </div>
              </div>
            </div>

            {/* 아동 분석 카드 */}
            <div className="flex flex-col flex-1 min-w-[280px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-white font-semibold">
                  <Icon icon="mdi:account-search" className="w-4 h-4 text-blue-300" />
                  아동 분석
                </div>
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs">추적중</span>
              </div>
              <div className="bg-[#0f0f0f] border border-[#31353a] p-4 space-y-3" style={{ borderWidth: '1px' }}>
                <div>
                  <div className="text-gray-400 text-xs mb-1">성별/연령</div>
                  <div className="text-white text-sm">남아, 약 9세 추정</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">착의</div>
                  <div className="text-white text-sm">회색 점퍼, 검은색 바지</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">신체 정보</div>
                  <div className="text-white text-sm">130cm 초반 추정</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">마지막 포착</div>
                  <div className="text-white text-sm">골목 → 도로 방향 이동 후 차량 탑승</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">ReID 신뢰도</div>
                  <div className="text-green-400 text-sm">87%</div>
                </div>
              </div>
            </div>

            {/* 차량 분석 카드 */}
            <div className="flex flex-col flex-1 min-w-[280px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-white font-semibold">
                  <Icon icon="mdi:car" className="w-4 h-4 text-blue-300" />
                  차량 분석
                </div>
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs">추적중</span>
              </div>
              <div className="bg-[#0f0f0f] border border-[#31353a] p-4 space-y-3" style={{ borderWidth: '1px' }}>
                <div>
                  <div className="text-gray-400 text-xs mb-1">차종</div>
                  <div className="text-white text-sm">소형 승용차</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">색상</div>
                  <div className="text-white text-sm">흰색</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">번호판</div>
                  <div className="text-white text-sm">12가3456</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">방향</div>
                  <div className="text-white text-sm">북쪽으로 이동</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">속도</div>
                  <div className="text-white text-sm">약 60km/h</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">인식 신뢰도</div>
                  <div className="text-green-400 text-sm">92%</div>
                </div>
              </div>
            </div>
          </div>

          {/* 행동 요약 */}
          <div className="mt-6">
            <div className="flex items-center gap-2 text-sm text-red-300 font-semibold mb-3">
              <Icon icon="mdi:alert" className="w-4 h-4" />
              행동 요약
            </div>
            <div className="bg-[#2a1313] border border-red-500/40 p-4 space-y-2" style={{ borderWidth: '1px' }}>
              <ul className="text-sm text-red-100 space-y-1">
                {(prototypeBehaviorHighlightsFilter && prototypeBehaviorHighlightsFilter.length > 0
                  ? behaviorHighlights.filter((item) => prototypeBehaviorHighlightsFilter.some(filter => item.includes(filter)))
                  : behaviorHighlights
                ).map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
};
