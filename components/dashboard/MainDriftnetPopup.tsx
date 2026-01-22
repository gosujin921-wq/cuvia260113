import React from 'react';
import EventDetailPopup from './EventDetailPopup';

interface MainDriftnetPopupProps {
  event: React.ComponentProps<typeof EventDetailPopup>['event'];
  onClose: () => void;
}

/**
 * 메인투망 팝업 컴포넌트
 * 대시보드 맵뷰에서 메인 투망 이벤트를 표시하는 팝업입니다.
 */
const MainDriftnetPopup: React.FC<MainDriftnetPopupProps> = ({ event, onClose }) => {
  return <EventDetailPopup event={event} onClose={onClose} title="메인 투망" icon="mdi:robot" />;
};

export default MainDriftnetPopup;
