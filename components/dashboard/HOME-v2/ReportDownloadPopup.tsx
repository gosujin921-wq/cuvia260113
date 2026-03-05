/**
 * 보고서다운로드 팝업
 * 문서 미리보기 및 파일 다운로드 팝업
 */
import React, { useState } from 'react';
import { Icon } from '@iconify/react';

interface ReportDownloadPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormatType = 'hwp' | 'jpg' | 'docx' | 'pdf';

const FORMAT_BUTTONS: { type: FormatType; label: string }[] = [
  { type: 'hwp', label: '한글(.hwp)' },
  { type: 'jpg', label: '이미지(.jpg)' },
  { type: 'docx', label: 'Word(.docx)' },
  { type: 'pdf', label: 'PDF(.pdf)' },
];

const ReportDownloadPopup: React.FC<ReportDownloadPopupProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 3; // 추후 실제 PDF 페이지 수로 대체 예정

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handleFormatClick = (format: FormatType) => {
    if (format === 'pdf') {
      const link = document.createElement('a');
      link.href = '/report.pdf';
      link.download = '사건처리결과보고서.pdf';
      link.click();
    }
    // 기타 형식(hwp, jpg, docx) 추후 구현 예정
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center"
      style={{ zIndex: 10003 }}
      onClick={handleBackdropClick}
    >
      <div
        className="bg-[#1a1a1a] border border-[#31353a] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          width: '960px',
          maxWidth: '95vw',
          height: '560px',
          maxHeight: '85vh',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#31353a] flex-shrink-0">
          <h3 className="text-white font-semibold text-base">
            문서 미리보기 및 파일 다운로드
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#0f0f0f]/50 border border-[#31353a] hover:border-red-500/50 hover:bg-red-500/10 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all"
            aria-label="닫기"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        {/* 본문: 좌측 미리보기 + 우측 저장 형식 */}
        <div className="flex-1 flex min-h-0">
          {/* 좌측: PDF 미리보기 영역 */}
          <div
            className="flex flex-col flex-1 min-w-0 border-r border-[#31353a]"
          >
            <div className="flex-1 flex items-center justify-center bg-[#0f0f0f]/50 relative overflow-hidden">
              <iframe
                src={`/report.pdf#page=${currentPage}&navpanes=0`}
                title="사건 처리 결과 보고서"
                className="w-full h-full border-0"
                style={{ minHeight: '400px' }}
              />

              {/* 좌우 페이지 넘김 버튼 */}
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 border border-[#31353a] hover:bg-black/80 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors z-10"
                aria-label="이전 페이지"
              >
                <Icon icon="mdi:chevron-left" className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 border border-[#31353a] hover:bg-black/80 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors z-10"
                aria-label="다음 페이지"
              >
                <Icon icon="mdi:chevron-right" className="w-6 h-6" />
              </button>
            </div>

            {/* 페이지 인디케이터 */}
            <div className="flex-shrink-0 px-4 py-2 border-t border-[#31353a] flex items-center justify-center gap-2">
              <span className="text-xs text-gray-400">
                {currentPage} / {totalPages}
              </span>
            </div>
          </div>

          {/* 우측: 저장 형식 선택 */}
          <div className="flex flex-col w-[180px] flex-shrink-0 p-3 bg-[#0f0f0f]/30">
            <h4 className="text-sm font-semibold text-gray-200 mb-4">
              다음형식으로 저장
            </h4>
            <div className="flex flex-col gap-3">
              {FORMAT_BUTTONS.map(({ type, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleFormatClick(type)}
                  className="w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-200 bg-[#1f1f1f] border border-[#31353a] hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-300 transition-colors text-left"
                  aria-label={label}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDownloadPopup;
