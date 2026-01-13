'use client';

import React, { useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getGradientButtonClassName, getSecondaryButtonClassName } from '@/components/shared/styles';

interface EventCompletionNotificationPopupProps {
  isOpen: boolean;
  time: string;
  eventTitle: string;
  content: string;
  onClose: () => void;
  onStopMonitoring: () => void;
  onCreateReport: () => void;
}

export const EventCompletionNotificationPopup: React.FC<EventCompletionNotificationPopupProps> = ({
  isOpen,
  time,
  eventTitle,
  content,
  onClose,
  onStopMonitoring,
  onCreateReport,
}) => {
  // ESC 키로 팝업 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1a] border border-[#31353a] rounded-lg shadow-xl w-[420px] flex flex-col"
        style={{ borderWidth: '1px' }}
        onClick={(e) => e.stopPropagation()}
      >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#31353a]" style={{ borderBottomWidth: '1px' }}>
        <div className="flex items-center gap-2">
          <Icon icon="mdi:check-circle" className="w-5 h-5 text-green-400" />
          <h3 className="text-white text-sm font-semibold">사건 종료 알림</h3>
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
      <div className="p-4 space-y-3">
        {/* 시간 */}
        <div className="flex items-center gap-2">
          <Icon icon="mdi:clock-outline" className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300 text-sm">{time}</span>
        </div>

        {/* 사건명 */}
        <div className="flex items-center gap-2">
          <Icon icon="mdi:file-document-outline" className="w-4 h-4 text-gray-400" />
          <span className="text-white text-sm font-medium">{eventTitle}</span>
        </div>

        {/* 내용 */}
        <div className="bg-[#0f0f0f] border border-[#31353a] rounded p-3" style={{ borderWidth: '1px' }}>
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      </div>

      {/* 버튼 영역 - 모니터링 중단(왼쪽), 보고서 작성(오른쪽) */}
      <div className="flex gap-2 p-4 border-t border-[#31353a]" style={{ borderTopWidth: '1px' }}>
        <button
          onClick={onStopMonitoring}
          className={`flex-1 ${getSecondaryButtonClassName()}`}
        >
          <Icon icon="mdi:stop-circle-outline" className="w-4 h-4" />
          모니터링 중단
        </button>
        <button
          onClick={onCreateReport}
          className={`flex-1 ${getGradientButtonClassName()}`}
        >
          <Icon icon="mdi:file-document-edit-outline" className="w-4 h-4" />
          보고서 작성
        </button>
      </div>
      </div>
    </div>
  );
};

