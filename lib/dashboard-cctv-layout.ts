/**
 * CCTV 패널 레이아웃 (BottomPanel과 동일한 값 사용).
 * 플로팅 Agent Hub 버튼 위치를 패널 높이 변화에 맞춰 계산할 때 사용.
 */
const RIGHT_PANEL_WIDTH = 370;
const CCTV_PANEL_GAP = 8;
const VERTICAL_PADDING = 16;
const FIXED_ITEM_HEIGHT = 150;
const PANEL_BOTTOM_PX = 16;
const FLOATING_BUTTON_GAP_PX = 30;

export interface CCTVPanelLayout {
  panelHeight: number;
  panelTopFromBottom: number;
  /** 플로팅 버튼 bottom (px). 패널 상단에서 30px 띄운 위치 */
  buttonBottom: number;
  /** CCTV 패널 right (px) */
  panelRight: number;
}

export function getCCTVPanelLayout(_opts?: {
  windowWidth?: number;
  leftPanelWidth?: number;
}): CCTVPanelLayout {
  const panelHeight = FIXED_ITEM_HEIGHT + VERTICAL_PADDING * 2;
  const panelTopFromBottom = PANEL_BOTTOM_PX + panelHeight;
  const buttonBottom = panelTopFromBottom + FLOATING_BUTTON_GAP_PX;
  const panelRight = RIGHT_PANEL_WIDTH + CCTV_PANEL_GAP;
  return { panelHeight, panelTopFromBottom, buttonBottom, panelRight };
}
