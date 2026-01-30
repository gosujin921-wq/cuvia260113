import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getRandomCCTVVideo } from '@/lib/cctv-video-utils';
import {
  getCandidateDetailData,
  addMinutesToTime,
  type TimelineEntry,
} from '@/lib/fast-search-candidate-detail';
import { getImageIdFromCaptureItem } from '@/lib/fast-search-image-attributes';

export interface CandidateCard {
  id: string;
  cctvId: string;
  cctvName: string;
  timestamp: string;
  confidence: number;
  location: string;
}

interface FastSearchCandidateDetailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateCard | null;
  onAnalyze?: (candidate: CandidateCard) => void;
  onShowOnMap?: (candidate: CandidateCard) => void;
}

const FastSearchCandidateDetailPopup: React.FC<FastSearchCandidateDetailPopupProps> = ({
  isOpen,
  onClose,
  candidate,
  onAnalyze,
  onShowOnMap,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [metaOpen, setMetaOpen] = useState(false);
  const playCountRef = useRef(0);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!candidate) return;
    playCountRef.current = 0;
  }, [candidate?.id]);

  const handleTimelineClick = useCallback((entry: TimelineEntry) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = entry.seconds;
    v.play().catch(() => {});
  }, []);

  if (!isOpen || !candidate) return null;

  const imageId = getImageIdFromCaptureItem(candidate);
  const detail = getCandidateDetailData(imageId, {
    cameraId: candidate.cctvId,
    score: candidate.confidence,
  });
  const timeEnd = addMinutesToTime(candidate.timestamp, 6);
  const timeRange = `${candidate.timestamp} ~ ${timeEnd}`;
  const videoSrc = getRandomCCTVVideo(candidate.cctvId);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] px-6"
      role="dialog"
      aria-modal="true"
      aria-label="고속검색 후보 상세"
      onClick={handleOverlayClick}
    >
      <div
        className="gradient-border-right-bottom w-full max-w-3xl flex flex-col rounded-lg shadow-lg"
        style={{
          maxHeight: '90vh',
          height: 'auto',
          background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          borderWidth: '1px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 (AIDetectionPopup / SituationSummary와 동일: p-4 border-b, 면 배경 없음) */}
        <div className="flex flex-wrap items-start justify-between gap-3 p-4 flex-shrink-0 border-b border-[#31353a]">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-white font-semibold text-sm">{candidate.cctvId}</span>
              <span className="text-gray-400 text-sm">·</span>
              <span className="text-gray-300 text-sm truncate">{candidate.location}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="text-gray-400">시간 범위</span>
              <span className="text-gray-300">{timeRange}</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400">후보 점수</span>
              <span className="text-white font-semibold">{candidate.confidence}%</span>
              <div
                className="h-2 rounded-full bg-[#0f0f0f] overflow-hidden border border-[#31353a]"
                style={{ width: 100 }}
                role="progressbar"
                aria-valuenow={candidate.confidence}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${candidate.confidence}%` }}
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors focus:outline-none flex-shrink-0"
            aria-label="닫기"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        {/* 컨텐츠 (SituationSummary 동일: overflow-y-auto p-4 space-y-4, 면 배경 없음) */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
          {/* 클립 영상 (AIDetectionPopup / CCTVMesh 동일: p-4 > bg-[#0f0f0f] 면) */}
          <div>
            <div className="w-full bg-[#0f0f0f] border border-[#31353a] rounded-md overflow-hidden relative" style={{ aspectRatio: '16/9' }}>
              <video
                ref={videoRef}
                src={videoSrc}
                className="w-full h-full object-contain"
                muted
                playsInline
                autoPlay
                aria-label="캡처 구간 클립"
                onEnded={() => {
                  const v = videoRef.current;
                  if (!v) return;
                  playCountRef.current += 1;
                  if (playCountRef.current < 2) {
                    v.currentTime = 0;
                    v.play().catch(() => {});
                  }
                }}
              />
            </div>
          </div>

          {/* 관찰 요약 (SituationSummary 블록 스타일: bg-[#0f0f0f] 면) */}
          <section className="bg-[#0f0f0f] border border-[#31353a] rounded-xl p-4" style={{ borderWidth: '1px' }}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">관찰 요약</h3>
            <p className="text-sm text-gray-300 leading-relaxed">{detail.observationSummary}</p>
          </section>

          {/* 타임라인 (동일 면 처리) */}
          <section className="bg-[#0f0f0f] border border-[#31353a] rounded-xl p-4" style={{ borderWidth: '1px' }}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">시간 기반 관찰 기록</h3>
            <ul className="space-y-1">
              {detail.timeline.map((entry, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => handleTimelineClick(entry)}
                    className="w-full text-left flex items-baseline gap-2 text-sm text-gray-300 hover:text-white hover:bg-[#1a1a1a] rounded px-2 py-1.5 -mx-2 transition-colors focus:outline-none focus:ring-1 focus:ring-[#31353a] focus:ring-inset"
                  >
                    <span className="text-gray-500 font-mono shrink-0">{entry.time}</span>
                    <span>{entry.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* 접힘: 후보 메타정보 (패널 칩 스타일) */}
          <section>
            <button
              type="button"
              onClick={() => setMetaOpen((o) => !o)}
              className="w-full flex items-center justify-between text-left py-2 px-4 rounded-lg bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a] border border-[#31353a] hover:border-[#3d4046] transition-colors focus:outline-none focus:ring-1 focus:ring-[#31353a] focus:ring-inset"
              aria-expanded={metaOpen}
              aria-controls="candidate-meta"
            >
              <span className="text-sm font-medium">후보 메타정보</span>
              <Icon icon={metaOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'} className="w-5 h-5 text-gray-500" aria-hidden />
            </button>
            <div id="candidate-meta" className="overflow-hidden" hidden={!metaOpen}>
              {metaOpen && (
                <div className="mt-2 p-4 rounded-lg bg-[#1a1a1a] border border-[#31353a] space-y-2 text-sm">
                  <div className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1">
                    <span className="text-gray-500">카메라 ID</span>
                    <span className="text-gray-300">{detail.meta.cameraId}</span>
                    <span className="text-gray-500">감지 객체</span>
                    <span className="text-gray-300">{detail.meta.detectedObject}</span>
                    <span className="text-gray-500">주요 속성</span>
                    <span className="text-gray-300">{detail.meta.mainAttributes}</span>
                    <span className="text-gray-500">행동 특징</span>
                    <span className="text-gray-300">{detail.meta.behavior}</span>
                    <span className="text-gray-500">이탈 방향</span>
                    <span className="text-gray-300">{detail.meta.exitDirection}</span>
                    <span className="text-gray-500">후보 점수</span>
                    <span className="text-gray-300">{detail.meta.score}/100</span>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* 푸터 (AIDetectionPopup 동일: p-4 border-t, 면 배경 없음) */}
        <div className="flex flex-wrap items-center justify-end gap-2 p-4 flex-shrink-0 border-t border-[#31353a]">
          <button
            type="button"
            onClick={() => {
              onAnalyze?.(candidate);
              onClose();
            }}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#0a0e14]"
            aria-label="이 후보 분석하기"
          >
            이 후보 분석하기
          </button>
          <button
            type="button"
            onClick={() => {
              onShowOnMap?.(candidate);
              onClose();
            }}
            className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-[#31353a] hover:bg-[#3d4046] border border-[#31353a] transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-[#0a0e14] flex items-center gap-2"
            aria-label="지도에서 위치 보기"
          >
            <Icon icon="mdi:map-marker" className="w-4 h-4" aria-hidden />
            지도에서 위치 보기
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-[#31353a] hover:bg-[#3d4046] border border-[#31353a] transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-[#0a0e14]"
            aria-label="닫기"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default FastSearchCandidateDetailPopup;
