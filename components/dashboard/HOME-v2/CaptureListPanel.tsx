import React, { useState } from 'react';
import { Icon } from '@iconify/react';

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
  analysisResult?: {
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedCapture, setSelectedCapture] = useState<CaptureItem | null>(null);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === captureItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(captureItems.map((item) => item.id)));
    }
  };

  return (
    <>
      {/* 포착 상세 팝업 */}
      {selectedCapture && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000]"
          onClick={() => setSelectedCapture(null)}
        >
          <div
            className="bg-[#1a1a1a] rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#31353a]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <Icon icon="mdi:cctv" className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedCapture.cctvName}</h3>
                  <p className="text-sm text-gray-400">{selectedCapture.location} · {selectedCapture.timestamp}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCapture(null)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
              >
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            </div>

            {/* 컨텐츠 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* 영상 영역 */}
                <div className="space-y-4">
                  <div className="bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    {selectedCapture.videoUrl ? (
                      <video
                        src={selectedCapture.videoUrl}
                        controls
                        className="w-full h-full"
                        poster={selectedCapture.thumbnailUrl}
                      />
                    ) : (
                      <img
                        src={selectedCapture.thumbnailUrl}
                        alt={selectedCapture.cctvName}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>

                {/* 분석 결과 영역 */}
                <div className="space-y-4">
                  {selectedCapture.analysisResult ? (
                    <>
                      {/* 한 줄 결론 */}
                      <div className="bg-[#2a2a2a] border border-[#31353a] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon icon="mdi:lightbulb-on" className="w-4 h-4 text-blue-500" />
                          <h4 className="text-white font-semibold text-sm">1. 한 줄 결론</h4>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedCapture.analysisResult.conclusion.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                      </div>

                      {/* 사건 요약 */}
                      <div className="bg-[#2a2a2a] border border-[#31353a] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon icon="mdi:file-document-outline" className="w-4 h-4 text-blue-500" />
                          <h4 className="text-white font-semibold text-sm">2. 사건 요약</h4>
                        </div>
                        <div className="space-y-1.5 text-sm">
                          <div className="text-gray-300">
                            <span className="text-gray-400">- 관측 시간대:</span> {selectedCapture.analysisResult.summary.time}
                          </div>
                          <div className="text-gray-300">
                            <span className="text-gray-400">- 위치/카메라:</span> {selectedCapture.analysisResult.summary.location}
                          </div>
                          <div className="text-gray-300">
                            <span className="text-gray-400">- 대상 인물(추정):</span> {selectedCapture.analysisResult.summary.personnel}
                          </div>
                          {selectedCapture.analysisResult.summary.features && (
                            <div className="text-gray-300">
                              <span className="text-gray-400">- 주요 특징:</span> {selectedCapture.analysisResult.summary.features}
                            </div>
                          )}
                          <div className="text-gray-300">
                            <span className="text-gray-400">- 행동 상태:</span> {selectedCapture.analysisResult.summary.status}
                          </div>
                          <div className="text-gray-300">
                            <span className="text-gray-400">- 위험도:</span> <span dangerouslySetInnerHTML={{ __html: selectedCapture.analysisResult.summary.riskLevel.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </div>
                        </div>
                      </div>

                      {/* 관측 근거 (요약) */}
                      <div className="bg-[#2a2a2a] border border-[#31353a] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon icon="mdi:clipboard-text" className="w-4 h-4 text-blue-500" />
                          <h4 className="text-white font-semibold text-sm">3. 관측 근거 (요약)</h4>
                        </div>
                        <ul className="space-y-1.5">
                          {selectedCapture.analysisResult.evidence.map((item, idx) => (
                            <li key={idx} className="text-gray-300 text-sm leading-relaxed flex items-start">
                              <span className="text-gray-500 mr-2">-</span>
                              <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : (
                    <div className="bg-[#2a2a2a] border border-[#31353a] rounded-lg p-6 flex flex-col items-center justify-center text-gray-400">
                      <Icon icon="mdi:information-outline" className="w-12 h-12 mb-3 opacity-50" />
                      <p className="text-sm">분석 결과가 없습니다.</p>
                    </div>
                  )}
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
              <div className="px-4 py-2 rounded-full text-xs font-medium bg-[#1a1a1a] text-gray-300 flex items-center gap-2 border border-[#31353a]">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>총 포착: {captureItems.length}건</span>
              </div>
              
              {/* 선택된 개수 칩 */}
              {selectedIds.size > 0 && (
                <div className="px-4 py-2 rounded-full text-xs font-medium bg-[#1a1a1a] text-blue-300 flex items-center gap-2 border border-blue-500/50">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>선택됨: {selectedIds.size}건</span>
                </div>
              )}
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
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#31353a]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 rounded text-xs font-medium transition-colors text-gray-300 hover:text-white hover:bg-[#2a2a2a] border border-[#31353a]"
                  aria-label={selectedIds.size === captureItems.length ? '전체 해제' : '전체 선택'}
                >
                  {selectedIds.size === captureItems.length ? '전체 해제' : '전체 선택'}
                </button>
              </div>
              
              <button
                type="button"
                onClick={onCreatePropagationPackage}
                disabled={selectedIds.size === 0}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedIds.size > 0
                    ? 'text-white bg-blue-500 hover:bg-blue-600'
                    : 'text-gray-500 bg-gray-700 cursor-not-allowed'
                }`}
                aria-label="전파 패키지 생성"
              >
                <div className="flex items-center gap-1.5">
                  <Icon icon="mdi:package-variant-closed" className="w-3.5 h-3.5" />
                  <span>전파 패키지 생성</span>
                </div>
              </button>
            </div>
            
            <div
              className="flex-1 overflow-y-auto"
              style={{
                padding: '16px',
                minHeight: 0,
              }}
            >
              {captureItems.length === 0 ? (
                // 빈 상태
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Icon icon="mdi:camera-off" className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-sm">포착된 대상이 없습니다.</p>
                  <p className="text-xs mt-2 text-gray-500">
                    객체 추적 중 CCTV 라이브에서 "대상 발견" 버튼을 눌러 포착하세요.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3" style={{ minHeight: 'min-content' }}>
                  {captureItems.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedCapture(item)}
                        className={`relative bg-[#393a42] rounded-lg overflow-hidden cursor-pointer transition-all group ${
                          isSelected ? 'ring-2 ring-blue-500' : ''
                        }`}
                      >
                        {/* 선택 체크박스 */}
                        <div
                          className="absolute top-2 left-2 z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelect(item.id);
                          }}
                        >
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-500 border-2 border-blue-500'
                                : 'bg-black/50 border-2 border-gray-400 hover:border-blue-400'
                            }`}
                          >
                            {isSelected && <Icon icon="mdi:check" className="w-4 h-4 text-white" />}
                          </div>
                        </div>

                        {/* 추적 핀 번호 뱃지 */}
                        {item.trackingPinNumber && (
                          <div className="absolute top-2 right-2 z-10 px-2 py-1 rounded text-[10px] font-bold bg-red-500/90 text-white">
                            {item.trackingPinNumber}번 핀
                          </div>
                        )}

                        {/* 썸네일 */}
                        <div className="relative w-full bg-black" style={{ height: '160px' }}>
                          <img
                            src={item.thumbnailUrl}
                            alt={item.cctvName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%231a1a1a"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23666" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          
                          {/* 재생 아이콘 오버레이 */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <Icon icon="mdi:play" className="w-8 h-8 text-white" />
                            </div>
                          </div>
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
                    );
                  })}
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
