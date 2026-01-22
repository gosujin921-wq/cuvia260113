import React from 'react';
import EventDetailPopup from './EventDetailPopup';

interface AIDetectionPopupProps {
  event: React.ComponentProps<typeof EventDetailPopup>['event'];
  onClose: () => void;
}

/**
 * AI탐지 팝업 컴포넌트
 * 대시보드 맵뷰에서 AI 탐지된 이벤트를 표시하는 팝업입니다.
 */
const AIDetectionPopup: React.FC<AIDetectionPopupProps> = ({ event, onClose }) => {
  return <EventDetailPopup event={event} onClose={onClose} title="AI 탐지" icon="mdi:robot" />;
};

export default AIDetectionPopup;
