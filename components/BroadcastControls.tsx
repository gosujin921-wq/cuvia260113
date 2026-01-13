'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { BroadcastDraftPopup, ClipData } from './event-detail/BroadcastDraftPopup';

type PriorityLabel = '긴급' | '경계' | '주의';

export type { ClipData } from './event-detail/BroadcastDraftPopup';

export type BroadcastControlsProps = {
  eventId: string;
  eventTitle: string;
  source: string;
  location: string;
  receivedAt: string;
  priority: PriorityLabel;
  aiSummary: string;
  riskSummary: string;
  onAddClipsRef?: React.MutableRefObject<((clips: ClipData[]) => void) | null>;
  onOpenModalRef?: React.MutableRefObject<(() => void) | null>;
  onModalStateChange?: (isOpen: boolean) => void;
};

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

const defaultAttachments: Attachment[] = [];

const availableRecipients = ['경찰', '소방', '재난안전', '지자체'];

const BroadcastControls: React.FC<BroadcastControlsProps> = ({
  eventId,
  eventTitle,
  source,
  location,
  receivedAt,
  priority,
  aiSummary,
  riskSummary,
  onAddClipsRef,
  onOpenModalRef,
  onModalStateChange,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 모달 상태 변경 시 상위 컴포넌트에 알림
  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(isModalOpen);
    }
  }, [isModalOpen, onModalStateChange]);
  const defaultMessage = useMemo(() => {
    const safeSummary = aiSummary?.trim() || '';
    const safeRisk = riskSummary?.trim() || '';

    return [
      '【이벤트 기본 정보】',
      `- 이벤트명: ${eventTitle}`,
      `- 우선순위: ${priority}`,
      `- 접수시간: ${receivedAt}`,
      `- 위치: ${location}`,
      `- 신고기관: ${source}`,
      '',
      '【위험 요인 분석】',
      safeRisk ? `- ${safeRisk}` : '- 현재 이벤트의 위험 요인과 위험도, 우선 대응 우선순위를 요약합니다.',
      '',
      '【인물/행동 분석】',
      safeSummary
        ? `- ${safeSummary}`
        : '- 관련 인물(용의자/피해자)의 특징, 현재 상태, 도주/이동 패턴을 요약합니다.',
      '',
      '【위치 및 동선 요약】',
      `- 주요 발생 지점과 인근 동선(진입·이탈 방향, 인접 CCTV 포인트)을 요약해 전파 대상이 현장 위치를 빠르게 파악할 수 있도록 합니다.`,
      '',
      '【출동 및 통제 권고】',
      '- 우선 출동 대상(경찰·교통·순찰·기동대 등)과 권장 병력 규모를 제안합니다.',
      '- 도로 차단이 필요한 경우, 차단 지점(주요 교차로·램프·골목 입구 등)을 명시합니다.',
      '- 2차 피해(추가 범행, 2차 사고, 군중 밀집 등) 방지를 위한 관제실–현장 간 공조 포인트를 정리합니다.',
    ]
      .filter(Boolean)
      .join('\n');
  }, [aiSummary, riskSummary, eventTitle, priority, receivedAt, location, source]);
  const [message, setMessage] = useState(defaultMessage);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(['경찰', '소방']);
  const [attachments, setAttachments] = useState<Attachment[]>(defaultAttachments);
  const [draftStatus, setDraftStatus] = useState<'idle' | 'drafting'>('idle');
  const [broadcastCount, setBroadcastCount] = useState(0);
  
  // 외부에서 클립 추가 함수 노출
  React.useEffect(() => {
    if (onAddClipsRef) {
      onAddClipsRef.current = (clips: ClipData[]) => {
        const newAttachments: Attachment[] = clips.map((clip) => ({
          id: clip.id,
          cctvId: clip.cctvId,
          thumbnail: clip.thumbnail,
          frameTimestamp: clip.frameTimestamp,
          timestamp: clip.timestamp,
          duration: clip.duration,
          status: clip.status,
        }));
        setAttachments((prev) => [...prev, ...newAttachments]);
        // CCTV 모달에서 클립이 추가되면 전파 초안 작성 상태로 전환
        setDraftStatus('drafting');
      };
    }
    return () => {
      if (onAddClipsRef) {
        onAddClipsRef.current = null;
      }
    };
  }, [onAddClipsRef]);

  // 외부에서 모달 열기 함수 노출
  React.useEffect(() => {
    if (onOpenModalRef) {
      onOpenModalRef.current = () => {
        setIsModalOpen(true);
      };
    }
    return () => {
      if (onOpenModalRef) {
        onOpenModalRef.current = null;
      }
    };
  }, [onOpenModalRef]);

  useEffect(() => {
    if (!isModalOpen) {
      setMessage(defaultMessage);
      return;
    }

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isModalOpen, defaultMessage]);

  const handleOpen = () => setIsModalOpen(true);
  const handleClose = () => setIsModalOpen(false);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpen();
    }
  };

  const handleBroadcast = () => {
    console.info('Broadcast request:', { eventId, message, recipients: selectedRecipients, attachments });
    setDraftStatus('idle');
    handleClose();
    // 전파 성공 알림 표시
    setBroadcastCount((prev) => prev + 1);
    
    const { date, time } = getFormattedDateTime();
    const recipientLabels = selectedRecipients.map(getRecipientLabel).join(', ');
    const alertMessage = `전파가 성공적으로 전송되었습니다.\n\n전파 일자: ${date}\n전파 시각: ${time}\n해당 이벤트 전파 횟수: ${broadcastCount + 1}회\n전파 수신: ${recipientLabels}`;
    
    alert(alertMessage);
  };

  const handleSaveDraft = () => {
    console.info('Broadcast draft saved:', { eventId, message, recipients: selectedRecipients, attachments });
    setDraftStatus('drafting');
    handleClose();
  };

  const toggleRecipient = (recipient: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(recipient) ? prev.filter((item) => item !== recipient) : [...prev, recipient]
    );
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments((prev) => prev.filter((attachment) => attachment.id !== attachmentId));
  };

  // 전파 대상 매핑
  const getRecipientLabel = (recipient: string): string => {
    const mapping: Record<string, string> = {
      '경찰': '112 상황실',
      '소방': '119 상황실',
      '재난안전': '재난안전',
      '지자체': '도시안전과',
    };
    return mapping[recipient] || recipient;
  };

  // 날짜/시간 포맷팅
  const getFormattedDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return {
      date: `${year}.${month}.${day}`,
      time: `${hours}:${minutes}:${seconds}`,
    };
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-label="전파 모달 열기"
        className="w-full bg-[#155DFC] text-white py-2 text-sm font-semibold tracking-tight flex items-center justify-center gap-2 hover:bg-[#1f6dff] focus:outline-none focus:ring-2 focus:ring-[#50A1FF] rounded-none transition-colors"
      >
        <Icon icon="mdi:send" className="w-4 h-4" />
        {draftStatus === 'drafting' || attachments.length > 0 ? '전파 초안 작성 중' : '전파 초안 작성'}
      </button>

      <BroadcastDraftPopup
        isOpen={isModalOpen}
        eventId={eventId}
        eventTitle={eventTitle}
        source={source}
        location={location}
        receivedAt={receivedAt}
        priority={priority}
        aiSummary={aiSummary}
        riskSummary={riskSummary}
        message={message}
        setMessage={setMessage}
        selectedRecipients={selectedRecipients}
        toggleRecipient={toggleRecipient}
        attachments={attachments}
        removeAttachment={removeAttachment}
        onClose={handleClose}
        onBroadcast={handleBroadcast}
        onSaveDraft={handleSaveDraft}
      />
    </>
  );
};

export default BroadcastControls;

