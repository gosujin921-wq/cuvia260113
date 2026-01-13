'use client';

import React, { useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getGradientButtonClassName, getSecondaryButtonClassName } from '@/components/shared/styles';

interface AdditionalDataNotificationPopupProps {
  isOpen: boolean;
  time: string;
  sender: string;
  content: string;
  onClose: () => void;
  onSendToAgent: () => void;
}

export const AdditionalDataNotificationPopup: React.FC<AdditionalDataNotificationPopupProps> = ({
  isOpen,
  time,
  sender,
  content,
  onClose,
  onSendToAgent,
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
      className="absolute bottom-6 right-6 bg-[#1a1a1a] border border-[#31353a] rounded-lg shadow-xl w-[420px] flex flex-col z-[9999]"
      style={{ borderWidth: '1px' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#31353a]" style={{ borderBottomWidth: '1px' }}>
        <div className="flex items-center gap-2">
          <Icon icon="mdi:bell-alert" className="w-5 h-5 text-yellow-400" />
          <h3 className="text-white text-sm font-semibold">추가 자료 알림</h3>
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

        {/* 발신 기관 */}
        <div className="flex items-center gap-2">
          <Icon icon="mdi:office-building-outline" className="w-4 h-4 text-gray-400" />
          <span className="text-white text-sm font-medium">{sender}</span>
        </div>

        {/* 내용 */}
        <div className="bg-[#0f0f0f] border border-[#31353a] rounded p-3" style={{ borderWidth: '1px' }}>
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      </div>

      {/* 버튼 영역 - AI 에이전트에 전달(왼쪽), 닫기(오른쪽) */}
      <div className="flex gap-2 p-4 border-t border-[#31353a]" style={{ borderTopWidth: '1px' }}>
        <button
          onClick={onSendToAgent}
          className={`flex-1 ${getGradientButtonClassName()}`}
        >
          <Icon icon="mdi:sparkles" className="w-4 h-4" />
          AI 에이전트에 전달
        </button>
        <button
          onClick={onClose}
          className={`flex-1 ${getSecondaryButtonClassName()}`}
        >
          닫기
        </button>
      </div>
    </div>
  );
};

