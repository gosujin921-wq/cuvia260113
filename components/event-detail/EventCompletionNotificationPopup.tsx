
import React from 'react';
import { Icon } from '@iconify/react';
import { NotificationPopup } from '@/components/shared/NotificationPopup';
import { getPrimaryButtonClassName, getSecondaryButtonClassName } from '@/components/shared/styles';

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
  return (
    <NotificationPopup
      isOpen={isOpen}
      onClose={onClose}
      title="사건 종료 알림"
      titleIcon={<Icon icon="mdi:check-circle" className="w-5 h-5 text-green-400" />}
      position="center"
    >
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
      <div className="flex gap-2 p-4">
        <button
          onClick={onStopMonitoring}
          className={`flex-1 ${getPrimaryButtonClassName()}`}
        >
          <Icon icon="mdi:stop-circle-outline" className="w-4 h-4" />
          모니터링 중단
        </button>
        <button
          onClick={onCreateReport}
          className={`flex-1 ${getPrimaryButtonClassName()}`}
        >
          <Icon icon="mdi:file-document-edit-outline" className="w-4 h-4" />
          보고서 작성
        </button>
      </div>
    </NotificationPopup>
  );
};

