import React, { useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import PropagationPackagePopup from './PropagationPackagePopup';

interface CaptureListPanelProps {
  isVisible: boolean;
  width?: number;
  captureItems?: CaptureItem[];
  onCreatePropagationPackage?: () => void;
}

export interface CaptureItem {
  id: string;
  cctvName: string;
  location: string;
  timestamp: string; // HH:MM:SS
  thumbnailUrl: string;
  videoUrl?: string;
  memo?: string;
  trackingPinNumber?: number; // 몇 번 핀에서 포착되었는지 (1~4)
  analysisResult?: string | {
    conclusion: string;
    summary: {
      time: string;
      location: string;
      personnel: string;
      features?: string;
      status: string;
      riskLevel: string;
    };
    evidence: string[];
    recommendations: string[];
  };
}

const CaptureListPanel: React.FC<CaptureListPanelProps> = ({
  isVisible,
  width = 700,
  captureItems = [],
  onCreatePropagationPackage,
}) => {
  const { t } = useTranslation();
  const [selectedCapture, setSelectedCapture] = useState<CaptureItem | null>(null);
  const [showPropagationPopup, setShowPropagationPopup] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* 전파 패키지 팝업 */}
      {showPropagationPopup && (
        <PropagationPackagePopup
          isOpen={showPropagationPopup}
          onClose={() => setShowPropagationPopup(false)}
          selectedItems={captureItems}
          onSendPropagation={onCreatePropagationPackage}
        />
      )}

      {/* 포착 상세 팝업 */}
      {selectedCapture && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] px-6"
          role="dialog"
          aria-modal="true"
          aria-label={t('captureList.detailAriaLabel')}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedCapture(null); }}
        >
          <div
            className="gradient-border-right-bottom w-full flex flex-col rounded-lg shadow-lg overflow-hidden"
            style={{
              maxWidth: '1100px',
              maxHeight: '75vh',
              height: '75vh',
              background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              borderWidth: '1px',
            }}
          >
            {/* 헤더 */}
            <div className="flex flex-wrap items-start justify-between gap-3 p-4 flex-shrink-0 border-b border-[#31353a]">
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-white font-semibold text-sm">{selectedCapture.cctvName}</span>
                  <span className="text-gray-400 text-sm">·</span>
                  <span className="text-gray-300 text-sm truncate">{selectedCapture.location}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="text-gray-400">{t('captureList.captureTime')}</span>
                  <span className="text-gray-300">{selectedCapture.timestamp}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCapture(null)}
                className="text-gray-400 hover:text-white transition-colors focus:outline-none flex-shrink-0"
                aria-label={t('common.close')}
                tabIndex={0}
              >
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            </div>

            {/* 2컬럼 레이아웃: 좌측 영상, 우측 정보 */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* 좌측: 영상 영역 */}
              <div className="flex-shrink-0 p-4 border-r border-[#31353a]/50" style={{ width: '50%' }}>
                <div 
                  ref={containerRef}
                  className="bg-[#0f0f0f] border border-[#31353a] rounded-md overflow-hidden relative" 
                  style={{ aspectRatio: '16/9', width: '100%' }}
                >
                  <img
                    src={selectedCapture.thumbnailUrl && selectedCapture.thumbnailUrl.trim() !== '' ? selectedCapture.thumbnailUrl : '/images/cctv-placeholder.jpg'}
                    alt={selectedCapture.cctvName}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* 우측: 분석 결과 영역 - 스크롤 가능 */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto min-h-0 p-4" style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#31353a #0f0f0f',
                }}>
                  <div className="space-y-4">
                    {selectedCapture.analysisResult ? (
                      typeof selectedCapture.analysisResult === 'string' ? (
                        // 마크다운 형식의 분석결과 - 전파 패키지 팝업 스타일
                        // [object-tracking] 마커가 포함된 경우 객체 추적 분석 결과 카드로 렌더링.
                        // 과거 한국어 마커('객체 추적')도 호환 유지.
                        (selectedCapture.analysisResult.includes('[object-tracking]') ||
                          selectedCapture.analysisResult.includes('객체 추적')) ? (
                          // 객체 추적 분석 결과
                          <div className="space-y-3">
                            {/* 예측 정보 */}
                            <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                              <div className="flex items-center gap-2 mb-3">
                                <Icon icon="mdi:information" className="w-5 h-5 text-blue-400" />
                                <h3 className="text-white font-semibold text-sm">{t('captureList.prediction.title')}</h3>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                  <Icon icon="mdi:navigation" className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-gray-400">{t('captureList.prediction.trendLabel')} </span>
                                    <span className="text-gray-300">{t('captureList.prediction.trendValue')}</span>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Icon icon="mdi:clock-outline" className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-gray-400">{t('captureList.prediction.etaLabel')} </span>
                                    <span className="text-gray-300">{t('captureList.prediction.etaValue')}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 경로 예측 상세 근거 */}
                            <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                              <div className="flex items-center gap-2 mb-3">
                                <Icon icon="mdi:map-marker-path" className="w-5 h-5 text-blue-400" />
                                <h3 className="text-white font-semibold text-sm">{t('captureList.routeRationale.title')}</h3>
                              </div>
                              <ul className="space-y-1.5 text-sm">
                                {(t('captureList.routeRationale.items', { returnObjects: true }) as string[]).map((line, i) => (
                                  <li key={i} className="flex items-start gap-2 text-gray-300">
                                    <span className="text-gray-500 mt-1">•</span>
                                    <span>{line}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ) : (
                          // 일반 마크다운 (48번 후보 등)
                          <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                            <pre className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                              {selectedCapture.analysisResult}
                            </pre>
                          </div>
                        )
                      ) : (
                        <>
                          {/* 한 줄 결론 */}
                          <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <Icon icon="mdi:lightbulb-on" className="w-4 h-4 text-blue-400" />
                              <h4 className="text-white font-semibold text-sm">{t('captureList.analysis.conclusionTitle')}</h4>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedCapture.analysisResult.conclusion.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </div>

                          {/* 사건 요약 */}
                          <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <Icon icon="mdi:file-document-outline" className="w-4 h-4 text-blue-400" />
                              <h4 className="text-white font-semibold text-sm">{t('captureList.analysis.summaryTitle')}</h4>
                            </div>
                            <div className="space-y-1.5 text-sm">
                              <div className="text-gray-300">
                                <span className="text-gray-400">- {t('captureList.analysis.time')}:</span> {selectedCapture.analysisResult.summary.time}
                              </div>
                              <div className="text-gray-300">
                                <span className="text-gray-400">- {t('captureList.analysis.location')}:</span> {selectedCapture.analysisResult.summary.location}
                              </div>
                              <div className="text-gray-300">
                                <span className="text-gray-400">- {t('captureList.analysis.personnel')}:</span> {selectedCapture.analysisResult.summary.personnel}
                              </div>
                              {selectedCapture.analysisResult.summary.features && (
                                <div className="text-gray-300">
                                  <span className="text-gray-400">- {t('captureList.analysis.features')}:</span> {selectedCapture.analysisResult.summary.features}
                                </div>
                              )}
                              <div className="text-gray-300">
                                <span className="text-gray-400">- {t('captureList.analysis.status')}:</span> {selectedCapture.analysisResult.summary.status}
                              </div>
                              <div className="text-gray-300">
                                <span className="text-gray-400">- {t('captureList.analysis.riskLevel')}:</span> <span dangerouslySetInnerHTML={{ __html: selectedCapture.analysisResult.summary.riskLevel.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                              </div>
                            </div>
                          </div>

                          {/* 관측 근거 (요약) */}
                          <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <Icon icon="mdi:clipboard-text" className="w-4 h-4 text-blue-400" />
                              <h4 className="text-white font-semibold text-sm">{t('captureList.analysis.evidenceTitle')}</h4>
                            </div>
                            <ul className="space-y-1.5">
                              {selectedCapture.analysisResult.evidence.map((item, idx) => (
                                <li key={idx} className="text-gray-300 text-sm leading-relaxed flex items-start">
                                  <span className="text-gray-400 mr-2">-</span>
                                  <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )
                    ) : (
                      <div className="bg-[#0f0f0f]/50 border border-[#31353a] rounded-lg p-6 flex flex-col items-center justify-center text-gray-400" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                        <Icon icon="mdi:information-outline" className="w-12 h-12 mb-3 opacity-50" />
                        <p className="text-sm">{t('captureList.noAnalysis')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className={`absolute top-0 bottom-0 flex flex-col transition-all duration-500 ease-out ${
          isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
        }`}
        style={{
          left: '80px',
          width: `${width}px`,
          zIndex: 150,
          paddingTop: '16px',
          paddingBottom: '16px',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        <div className="flex flex-col gap-3 h-full" style={{ paddingTop: isVisible ? '0.5rem' : '16px', minHeight: 0 }}>
          {/* 헤더 */}
          <div
            className="rounded-lg flex-shrink-0"
            style={{
              zIndex: 2,
            }}
          >
            {/* 정보 칩들 */}
            <div className="flex items-center gap-2 flex-wrap relative">
              {/* 총 포착 개수 칩 */}
              <div className="px-4 py-2 rounded-full text-xs font-medium bg-[#0f0f0f]/50 text-gray-300 flex items-center gap-2 border border-[#31353a]" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span>{t('captureList.totalCaptures', { count: captureItems.length })}</span>
              </div>
              
            
            </div>
          </div>

          {/* 리스트 영역 */}
          <div
            className="rounded-lg flex-1 gradient-border-right-bottom border border-[#31353a] relative"
            style={{
              minHeight: 0,
              maxHeight: '100%',
              background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* 상단 액션 버튼 */}
            <div className="flex items-center justify-end px-4 py-3 border-b border-[#31353a] flex-shrink-0">
              <button
                id="create-propagation-package-button"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPropagationPopup(true);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all text-white bg-blue-500 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/20 border border-blue-400/50"
                aria-label={t('captureList.createBroadcastPackage')}
              >
                <div className="flex items-center gap-1.5">
                  <Icon icon="mdi:package-variant-closed" className="w-3.5 h-3.5" />
                  <span>{t('captureList.createBroadcastPackage')}</span>
                </div>
              </button>
            </div>
            
            <div
              className="flex-1 overflow-y-auto"
              style={{
                padding: '16px',
                minHeight: 0,
                scrollbarWidth: 'thin',
                scrollbarColor: '#31353a #0f0f0f',
              }}
            >
              {captureItems.length === 0 ? (
                // 빈 상태
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <div className="w-20 h-20 rounded-full bg-[#0f0f0f]/50 border border-[#31353a] flex items-center justify-center mb-4" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
                    <Icon icon="mdi:camera-off" className="w-10 h-10 opacity-50" />
                  </div>
                  <p className="text-sm font-medium text-gray-300">{t('captureList.empty')}</p>
                  <p className="text-xs mt-2 text-gray-500 text-center max-w-xs">
                    {t('captureList.emptyHint')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3" style={{ minHeight: 'min-content' }}>
                  {captureItems.map((item, index) => (
                      <div
                        key={item.id}
                        id={index === 0 ? 'capture-item-0' : index === 1 ? 'capture-item-1' : undefined}
                        onClick={() => setSelectedCapture(item)}
                        className="relative bg-[#0f0f0f]/70 border border-[#31353a] rounded-lg overflow-hidden cursor-pointer transition-all group hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10"
                        style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
                      >
                        {/* 추적 핀 번호 뱃지 */}
                        {item.trackingPinNumber && (
                          <div className="absolute top-2 right-2 z-10 px-2 py-1 rounded text-[10px] font-bold bg-red-500/90 text-white">
                            {t('captureList.pinNumber', { number: item.trackingPinNumber })}
                          </div>
                        )}

                        {/* 썸네일 */}
                        <div className="relative w-full bg-black" style={{ height: '160px' }}>
                          <img
                            src={item.thumbnailUrl && item.thumbnailUrl.trim() !== '' ? item.thumbnailUrl : '/images/cctv-placeholder.jpg'}
                            alt={item.cctvName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%231a1a1a"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23666" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          
                        </div>

                        {/* 기본정보 */}
                        <div className="flex-1 min-w-0 p-3 space-y-1.5">
                          {/* CCTV명 */}
                          <div className="text-xs text-gray-300 font-semibold truncate" title={item.cctvName}>
                            {item.cctvName}
                          </div>
                          
                          {/* 장소 */}
                          <div className="text-xs text-gray-200 truncate" title={item.location}>
                            {item.location}
                          </div>

                          {/* 시간 */}
                          <div className="text-xs text-gray-200">
                            {item.timestamp}
                          </div>

                          {/* 메모 */}
                          {item.memo && (
                            <div className="text-xs text-gray-400 italic truncate" title={item.memo}>
                              "{item.memo}"
                            </div>
                          )}
                        </div>
                      </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CaptureListPanel;
