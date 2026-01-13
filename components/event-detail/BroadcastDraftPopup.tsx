'use client';

import React, { useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getSecondaryButtonClassName, getPrimaryButtonClassName, getRecipientButtonClassName } from '@/components/shared/styles';

export type ClipData = {
  id: string;
  cctvId: string;
  cctvName: string;
  timestamp: string;
  duration: string;
  frameTimestamp: string;
  thumbnail: string;
  status: 'saved' | 'ready';
};

type PriorityLabel = '긴급' | '경계' | '주의';

type AttachmentStatus = 'ready' | 'saved';

type Attachment = {
  id: string;
  cctvId: string;
  thumbnail: string;
  frameTimestamp: string;
  timestamp: string;
  duration: string;
  status: AttachmentStatus;
};

interface BroadcastDraftPopupProps {
  isOpen: boolean;
  eventId: string;
  eventTitle: string;
  source: string;
  location: string;
  receivedAt: string;
  priority: PriorityLabel;
  aiSummary: string;
  riskSummary: string;
  message: string;
  setMessage: (message: string) => void;
  selectedRecipients: string[];
  toggleRecipient: (recipient: string) => void;
  attachments: Attachment[];
  removeAttachment: (attachmentId: string) => void;
  onClose: () => void;
  onBroadcast: () => void;
  onSaveDraft: () => void;
}

const availableRecipients = ['경찰', '소방', '재난안전', '지자체'];

export const BroadcastDraftPopup = ({
  isOpen,
  eventId,
  eventTitle,
  source,
  location,
  receivedAt,
  priority,
  aiSummary,
  riskSummary,
  message,
  setMessage,
  selectedRecipients,
  toggleRecipient,
  attachments,
  removeAttachment,
  onClose,
  onBroadcast,
  onSaveDraft,
}: BroadcastDraftPopupProps) => {
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

  const priorityBadgeClass =
    priority === '긴급'
      ? 'bg-red-500/20 text-red-400'
      : priority === '경계'
        ? 'bg-yellow-500/20 text-yellow-400'
        : 'bg-blue-500/20 text-blue-400';

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] px-6"
      role="dialog"
      aria-modal="true"
      aria-label="전파 모달"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-[#101013] border border-[#31353a] w-full max-w-4xl flex flex-col shadow-lg"
        style={{ maxHeight: '140vh', height: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 팝업 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-[#31353a] flex-shrink-0">
          <div className="flex items-center gap-2 text-base font-semibold text-white">
            <Icon icon="mdi:send" className="w-5 h-5 text-[#50A1FF]" />
            전파 초안 작성
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="전파 모달 닫기"
            className="text-gray-400 hover:text-white focus:outline-none transition-colors"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* 이벤트 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-400 text-xs mb-1">이벤트명</div>
                <div className="text-white font-semibold text-sm">{eventTitle}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">우선순위</div>
                <span className={`inline-block px-2 py-0.5 text-xs font-semibold ${priorityBadgeClass}`}>
                  {priority}
                </span>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">접수 시간</div>
                <div className="text-gray-300 text-sm">{receivedAt}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">위치</div>
                <div className="text-gray-300 text-sm">{location}</div>
              </div>
            </div>

            {/* 전파 대상 */}
            <div className="space-y-2">
              <div className="text-white font-semibold text-sm">전파 대상</div>
              <div className="flex flex-wrap gap-2">
                {availableRecipients.map((recipient) => {
                  const isSelected = selectedRecipients.includes(recipient);
                  return (
                    <button
                      key={recipient}
                      type="button"
                      onClick={() => toggleRecipient(recipient)}
                      className={getRecipientButtonClassName(isSelected)}
                    >
                      {recipient}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 전파 메시지 */}
            <div className="space-y-2">
              <div className="text-white font-semibold text-sm">전파 메시지</div>
              <textarea
                id="broadcast-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="w-full h-80 bg-white text-gray-900 border border-[#31353a] text-sm p-3 focus:outline-none focus:ring-2 focus:ring-[#50A1FF] resize-none placeholder:text-gray-500"
              />
            </div>

            {/* 이벤트 클립 */}
            <div className="space-y-2">
              <div className="text-white font-semibold text-sm">이벤트 클립</div>
              {attachments.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="min-w-[160px] bg-[#36383B] border border-[#2a2d36] shadow-sm relative">
                      <button
                        type="button"
                        onClick={() => removeAttachment(attachment.id)}
                        className="absolute top-2 right-2 z-10 text-white bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors"
                        aria-label="첨부 삭제"
                      >
                        <Icon icon="mdi:close" className="w-4 h-4" />
                      </button>
                      <div className="relative h-24 bg-gray-200 overflow-hidden">
                        <img 
                          src={attachment.thumbnail} 
                          alt={`${attachment.cctvId} 썸네일`} 
                          className="absolute inset-0 w-full h-full object-cover" 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/cctv_img/001.jpg';
                          }}
                        />
                        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                          {attachment.frameTimestamp}
                        </span>
                      </div>
                      <div className="px-3 py-2 space-y-1 text-xs bg-white">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-gray-900">{attachment.cctvId}</span>
                          <span className="text-gray-500">{attachment.status === 'ready' ? '전파 준비' : '저장'}</span>
                        </div>
                        <div className="text-gray-500">{attachment.timestamp}</div>
                        <div className="text-gray-700">{attachment.duration}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-[#2a2d36] text-xs text-gray-300 p-4 text-center">
                  첨부된 정보가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 border-t border-[#31353a] flex-shrink-0">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onBroadcast}
              className={getPrimaryButtonClassName()}
            >
              즉시 전파
            </button>
            <button
              type="button"
              onClick={onSaveDraft}
              className={getSecondaryButtonClassName()}
            >
              초안 저장
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={getSecondaryButtonClassName()}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

