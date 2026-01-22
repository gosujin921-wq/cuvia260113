/**
 * 키보드 이벤트 처리 로직
 * 
 * 키보드 단축키를 눌렀을 때 실행되는 애니메이션과 상태 변경 로직을 관리합니다.
 * Dashboard 컴포넌트에서 사용하는 핸들러 함수들을 제공합니다.
 */

import { Event } from '@/types';
import { KeyboardShortcuts } from './keyboard-shortcuts';

/**
 * 이벤트로 이동하는 애니메이션 함수 타입
 */
export type AnimateToEventFn = (event: Event, callback?: () => void) => void;

/**
 * 키보드 액션 핸들러 타입
 */
export interface KeyboardActionHandlers {
  /** 이벤트로 이동 애니메이션 실행 */
  animateToEvent: AnimateToEventFn;
  /** 선택 해제 */
  clearSelection: () => void;
  /** 컨트롤 숨김 설정 */
  setHideControls: (value: boolean) => void;
  /** 패널 숨김 설정 */
  setHidePanels: (value: boolean) => void;
  /** AI 탐지 이벤트 ID 설정 */
  setAiDetectionEventId: (id: string | null) => void;
  /** 메인투망 이벤트 ID 설정 */
  setMainDriftnetEventId: (id: string | null) => void;
}

/**
 * 키보드 이벤트 핸들러 생성
 * 
 * @param shortcuts - 키보드 단축키 매핑
 * @param allEvents - 모든 이벤트 목록
 * @param handlers - 상태 변경 핸들러들
 * @returns 키보드 이벤트 핸들러 함수
 */
export const createKeyboardHandler = (
  shortcuts: KeyboardShortcuts,
  allEvents: Event[],
  handlers: KeyboardActionHandlers
): ((e: KeyboardEvent) => void) => {
  const { 
    animateToEvent, 
    clearSelection, 
    setHideControls, 
    setHidePanels, 
    setAiDetectionEventId, 
    setMainDriftnetEventId 
  } = handlers;

  return (e: KeyboardEvent) => {
    // 입력 필드에서는 단축키 무시
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    const action = shortcuts[e.key];
    if (!action) return;

    // Escape 키 처리
    if (e.key === 'Escape') {
      clearSelection();
      setHideControls(false);
      setHidePanels(false);
      return;
    }

    // 이벤트 찾기
    const event = allEvents.find(event => 
      event.eventId === action.eventId || event.id === action.eventId
    );

    if (!event) return;

    // 컨트롤/패널 숨김 설정
    if (action.hideControls) {
      setHideControls(true);
    }
    if (action.hidePanels) {
      setHidePanels(true);
    }

    // 키보드 2번: 메인투망팝업 표시 (펄스 애니메이션 포함, 패널 사라지는 애니메이션도 포함)
    if (e.key === '2') {
      animateToEvent(event, () => {
        // selectedEventId는 유지해서 펄스 애니메이션과 핀 중앙 이동이 작동하도록
        // MainDriftnetEventId를 설정해서 MainDriftnetPopup이 표시됨
        setMainDriftnetEventId(event.id);
      });
      return;
    }

    // 이벤트로 이동
    animateToEvent(event, () => {
      // AI 탐지 이벤트 설정
      if (action.setAiDetection) {
        setAiDetectionEventId(event.id);
      }
    });
  };
};
