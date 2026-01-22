/**
 * 키보드 단축키 매핑 설정
 * 
 * 시나리오별로 다른 키보드 단축키를 정의할 수 있습니다.
 * 각 단축키는 특정 이벤트 ID와 연결되어 있으며,
 * 키를 누르면 해당 이벤트로 이동하고 애니메이션을 실행합니다.
 */

import { ScenarioType } from './scenarios';

/**
 * 키보드 단축키 액션 타입
 */
export type KeyboardAction = {
  /** 이동할 이벤트 ID (eventId 또는 id) */
  eventId: string;
  /** 컨트롤 숨김 여부 */
  hideControls?: boolean;
  /** 패널 숨김 여부 */
  hidePanels?: boolean;
  /** AI 탐지 이벤트로 설정할지 여부 */
  setAiDetection?: boolean;
};

/**
 * 키보드 단축키 매핑 타입
 * 키: 키보드 키 (예: '1', '2', '3', 'Escape')
 * 값: 실행할 액션
 */
export type KeyboardShortcuts = Record<string, KeyboardAction>;

/**
 * 공통 키보드 단축키 설정
 */
const commonKeyboardShortcuts: KeyboardShortcuts = {
  '1': {
    eventId: 'A-20260107-004',
    hideControls: true,
  },
  '2': {
    eventId: 'A-20251210-003',
    hideControls: true,
    hidePanels: true,
    setAiDetection: true,
  },
  '3': {
    eventId: 'A-20241124-001',
    hideControls: true,
  },
  'Escape': {
    eventId: '', // Escape는 특별 처리 (선택 해제)
  },
};

/**
 * 시나리오별 키보드 단축키 설정
 */
export const keyboardShortcutsByScenario: Record<ScenarioType, KeyboardShortcuts> = {
  surveillance: commonKeyboardShortcuts,
  demo: commonKeyboardShortcuts,
};

/**
 * 시나리오별 키보드 단축키 가져오기
 * 
 * @param scenario - 시나리오 타입
 * @returns 키보드 단축키 매핑
 */
export const getKeyboardShortcuts = (scenario: ScenarioType): KeyboardShortcuts => {
  return keyboardShortcutsByScenario[scenario] || {};
};
