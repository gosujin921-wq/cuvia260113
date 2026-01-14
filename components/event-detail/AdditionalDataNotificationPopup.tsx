
import React from 'react';
import { Icon } from '@iconify/react';
import { NotificationPopup } from '@/components/shared/NotificationPopup';
import { getPrimaryButtonClassName, getSecondaryButtonClassName } from '@/components/shared/styles';

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
  return (
    <NotificationPopup
      isOpen={isOpen}
      onClose={onClose}
      title="추가 자료 알림"
      titleIcon={<Icon icon="mdi:bell-alert" className="w-5 h-5 text-yellow-400" />}
      position="bottom-right"
    >
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
      <div className="flex gap-2 p-4">
        <button
          onClick={onSendToAgent}
          className={`flex-1 ${getPrimaryButtonClassName()}`}
        >
          <img 
            src="/simbol.svg" 
            alt="AI" 
            className="w-4 h-4"
            style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }}
          />
          AI 에이전트에 전달
        </button>
        <button
          onClick={onClose}
          className={`flex-1 ${getSecondaryButtonClassName()}`}
        >
          닫기
        </button>
      </div>
    </NotificationPopup>
  );
};

