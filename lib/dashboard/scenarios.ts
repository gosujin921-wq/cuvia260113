/**
 * 대시보드 시나리오 설정
 * 
 * 각 시나리오별로 다른 설정을 정의합니다.
 * 공통 컴포넌트는 이 설정을 기반으로 동작합니다.
 */

export type ScenarioType = 'surveillance' | 'demo';

export interface ScenarioConfig {
  type: ScenarioType;
  name: string;
  description: string;
  // 시나리오별 차이점을 여기에 추가
  features: {
    showCCTV?: boolean;
    showEventList?: boolean;
    showLeftPanel?: boolean;
    enableAnimations?: boolean;
    // 추가 기능 플래그들
  };
  // 데이터 필터링 옵션
  dataFilters?: {
    eventTypes?: string[];
    priorityLevels?: string[];
  };
}

export const scenarioConfigs: Record<ScenarioType, ScenarioConfig> = {
  surveillance: {
    type: 'surveillance',
    name: '투망감시',
    description: '실시간 투망감시 모드',
    features: {
      showCCTV: true,
      showEventList: true,
      showLeftPanel: true,
      enableAnimations: true,
    },
  },
  demo: {
    type: 'demo',
    name: '데모모드',
    description: '데모 모드',
    features: {
      showCCTV: true,
      showEventList: true,
      showLeftPanel: true,
      enableAnimations: true,
    },
  },
};

/**
 * 시나리오별 설정 가져오기
 */
export const getScenarioConfig = (scenario: ScenarioType): ScenarioConfig => {
  return scenarioConfigs[scenario];
};
