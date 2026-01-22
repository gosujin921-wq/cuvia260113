/**
 * CCTV 화각 관리 유틸리티
 * 
 * 화각 = 부채꼴의 각도 (시야각의 넓이)
 * 방향 = 부채꼴 끝이 가리키는 방향
 */

export interface CCTVConfig {
  cctvId: string;
  direction: number; // 방향 (0-360도, 부채꼴 끝이 가리키는 방향)
  viewAngle: number; // 화각 (부채꼴의 각도, 0-180도)
  description?: string;
}

/**
 * CCTV 설정 데이터
 * 여기서 화각(viewAngle)을 쉽게 수정할 수 있습니다.
 * 
 * viewAngle 값:
 * - 30: 좁은 화각
 * - 45: 중간 좁은 화각
 * - 60: 중간 화각
 * - 90: 기본 화각 (현재)
 * - 120: 넓은 화각
 * - 150: 매우 넓은 화각
 * - 180: 반원
 */
export const cctvConfigs: CCTVConfig[] = [
  // 첫 번째 행
  { cctvId: 'cctv-0', direction: 45, viewAngle: 90, description: 'CCTV-V-1 (10%, 20%)' },
  { cctvId: 'cctv-1', direction: 90, viewAngle: 90, description: 'CCTV-V-2 (25%, 15%)' },
  { cctvId: 'cctv-2', direction: 135, viewAngle: 90, description: 'CCTV-V-3 (35%, 30%)' },
  { cctvId: 'cctv-3', direction: 180, viewAngle: 90, description: 'CCTV-V-4 (55%, 25%)' },
  { cctvId: 'cctv-4', direction: 225, viewAngle: 90, description: 'CCTV-V-5 (70%, 20%)' },
  { cctvId: 'cctv-5', direction: 270, viewAngle: 90, description: 'CCTV-V-6 (85%, 30%)' },
  
  // 두 번째 행
  { cctvId: 'cctv-6', direction: 45, viewAngle: 90, description: 'CCTV-V-7 (20%, 50%)' },
  { cctvId: 'cctv-7', direction: 90, viewAngle: 90, description: 'CCTV-V-8 (40%, 55%)' },
  { cctvId: 'cctv-8', direction: 135, viewAngle: 90, description: 'CCTV-V-9 (60%, 50%)' },
  { cctvId: 'cctv-9', direction: 180, viewAngle: 90, description: 'CCTV-V-10 (80%, 55%)' },
  
  // 세 번째 행
  { cctvId: 'cctv-10', direction: 225, viewAngle: 90, description: 'CCTV-V-11 (15%, 75%)' },
  { cctvId: 'cctv-11', direction: 270, viewAngle: 90, description: 'CCTV-V-12 (30%, 70%)' },
  { cctvId: 'cctv-12', direction: 45, viewAngle: 90, description: 'CCTV-V-13 (50%, 75%)' },
  { cctvId: 'cctv-13', direction: 90, viewAngle: 90, description: 'CCTV-V-14 (70%, 70%)' },
  { cctvId: 'cctv-14', direction: 135, viewAngle: 90, description: 'CCTV-V-15 (90%, 75%)' },
  
  // 네 번째 행
  { cctvId: 'cctv-15', direction: 180, viewAngle: 90, description: 'CCTV-V-16 (10%, 90%)' },
  { cctvId: 'cctv-16', direction: 225, viewAngle: 90, description: 'CCTV-V-17 (25%, 95%)' },
  { cctvId: 'cctv-17', direction: 270, viewAngle: 90, description: 'CCTV-V-18 (45%, 90%)' },
  { cctvId: 'cctv-18', direction: 45, viewAngle: 90, description: 'CCTV-V-19 (65%, 95%)' },
  { cctvId: 'cctv-19', direction: 90, viewAngle: 90, description: 'CCTV-V-20 (85%, 90%)' },
];

/**
 * CCTV 설정을 Map으로 변환
 */
export const getCCTVConfigMap = (): Record<string, CCTVConfig> => {
  return cctvConfigs.reduce((acc, config) => {
    acc[config.cctvId] = config;
    return acc;
  }, {} as Record<string, CCTVConfig>);
};

/**
 * CCTV 방향 가져오기
 */
export const getCCTVDirection = (cctvId: string, defaultDirection: number = 90): number => {
  const config = getCCTVConfigMap()[cctvId];
  return config?.direction ?? defaultDirection;
};

/**
 * CCTV 화각 가져오기
 */
export const getCCTVViewAngle = (cctvId: string, defaultViewAngle: number = 90): number => {
  const config = getCCTVConfigMap()[cctvId];
  return config?.viewAngle ?? defaultViewAngle;
};

/**
 * CCTV 화각 설정
 */
export const setCCTVViewAngle = (cctvId: string, viewAngle: number): void => {
  const config = getCCTVConfigMap()[cctvId];
  if (config) {
    config.viewAngle = Math.max(0, Math.min(180, viewAngle)); // 0-180도 제한
  }
};

/**
 * 여러 CCTV 화각 일괄 설정
 */
export const setCCTVViewAngles = (updates: Array<{ cctvId: string; viewAngle: number }>): void => {
  updates.forEach(({ cctvId, viewAngle }) => {
    setCCTVViewAngle(cctvId, viewAngle);
  });
};

/**
 * 모든 CCTV 화각 일괄 조정
 */
export const adjustAllCCTVViewAngles = (delta: number): void => {
  cctvConfigs.forEach(config => {
    config.viewAngle = Math.max(0, Math.min(180, config.viewAngle + delta));
  });
};

/**
 * SVG 부채꼴 경로 생성 (화각에 따라 동적으로 계산)
 * @param viewAngle 화각 (부채꼴의 각도, 0-180도)
 * @param radius 반지름 (기본값 50)
 * @param centerX 중심 X (기본값 60)
 * @param centerY 중심 Y (기본값 60)
 * @returns SVG path d 속성 값
 */
export const generateViewAnglePath = (
  viewAngle: number,
  radius: number = 50,
  centerX: number = 60,
  centerY: number = 60
): string => {
  // 화각을 라디안으로 변환
  const angleRad = (viewAngle * Math.PI) / 180;
  
  // 시작 각도 (위쪽에서 시작, 화각의 절반만큼 왼쪽으로)
  const startAngle = -angleRad / 2;
  const startX = centerX + radius * Math.sin(startAngle);
  const startY = centerY - radius * Math.cos(startAngle);
  
  // 끝 각도 (화각의 절반만큼 오른쪽으로)
  const endAngle = angleRad / 2;
  const endX = centerX + radius * Math.sin(endAngle);
  const endY = centerY - radius * Math.cos(endAngle);
  
  // 큰 호인지 작은 호인지 판단 (180도 이상이면 큰 호)
  const largeArcFlag = viewAngle > 180 ? 1 : 0;
  
  // SVG path 생성
  // M: 시작점 이동
  // L: 중심에서 시작점으로 선
  // A: 호 그리기
  // Z: 시작점으로 닫기
  return `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
};

/**
 * jQuery를 사용한 화각 조절 (브라우저 콘솔에서 사용 가능)
 * 
 * 사용 예시:
 * setCCTVViewAngleById('cctv-0', 120); // cctv-0의 화각을 120도로 설정
 * setCCTVViewAngleById('cctv-0', 60);  // cctv-0의 화각을 60도로 설정
 */
export const setCCTVViewAngleById = (cctvId: string, viewAngle: number): void => {
  setCCTVViewAngle(cctvId, viewAngle);
  
  // 브라우저에서 실행 중이면 DOM 업데이트
  if (typeof window !== 'undefined') {
    // React 컴포넌트 리렌더링을 위한 이벤트 발생
    window.dispatchEvent(new CustomEvent('cctv-view-angle-changed', {
      detail: { cctvId, viewAngle }
    }));
  }
};

/**
 * jQuery 스타일로 모든 CCTV 화각 조절
 * 
 * 사용 예시:
 * $setAllCCTVViewAngles(120); // 모든 CCTV 화각을 120도로 설정
 */
export const $setAllCCTVViewAngles = (viewAngle: number): void => {
  cctvConfigs.forEach(config => {
    config.viewAngle = Math.max(0, Math.min(180, viewAngle));
  });
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cctv-view-angle-changed', {
      detail: { all: true, viewAngle }
    }));
  }
};

/**
 * jQuery 스타일로 특정 CCTV 그룹의 화각 조절
 * 
 * 사용 예시:
 * $setCCTVViewAngles(['cctv-0', 'cctv-1', 'cctv-2'], 60);
 */
export const $setCCTVViewAngles = (cctvIds: string[], viewAngle: number): void => {
  cctvIds.forEach(cctvId => {
    setCCTVViewAngle(cctvId, viewAngle);
  });
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cctv-view-angle-changed', {
      detail: { cctvIds, viewAngle }
    }));
  }
};

/**
 * 브라우저 콘솔에서 사용할 수 있도록 전역 함수 등록
 * 개발 모드에서만 사용 가능
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).CCTVViewAngle = {
    // 모든 CCTV 화각 설정
    setAll: (viewAngle: number) => {
      $setAllCCTVViewAngles(viewAngle);
      console.log(`모든 CCTV 화각을 ${viewAngle}도로 설정했습니다.`);
    },
    
    // 특정 CCTV 그룹 화각 설정
    setGroup: (cctvIds: string[], viewAngle: number) => {
      $setCCTVViewAngles(cctvIds, viewAngle);
      console.log(`CCTV ${cctvIds.join(', ')}의 화각을 ${viewAngle}도로 설정했습니다.`);
    },
    
    // 개별 CCTV 화각 설정
    set: (cctvId: string, viewAngle: number) => {
      setCCTVViewAngleById(cctvId, viewAngle);
      console.log(`CCTV ${cctvId}의 화각을 ${viewAngle}도로 설정했습니다.`);
    },
    
    // 모든 CCTV 화각 조정
    adjustAll: (delta: number) => {
      adjustAllCCTVViewAngles(delta);
      console.log(`모든 CCTV 화각을 ${delta > 0 ? '+' : ''}${delta}도 조정했습니다.`);
    },
    
    // 현재 설정 확인
    get: (cctvId: string) => {
      const config = getCCTVConfigMap()[cctvId];
      if (config) {
        console.log(`CCTV ${cctvId}:`, {
          direction: config.direction,
          viewAngle: config.viewAngle,
          description: config.description
        });
        return config;
      } else {
        console.warn(`CCTV ${cctvId}를 찾을 수 없습니다.`);
        return null;
      }
    },
    
    // 모든 CCTV 설정 확인
    list: () => {
      console.table(cctvConfigs.map(c => ({
        cctvId: c.cctvId,
        direction: c.direction,
        viewAngle: c.viewAngle,
        description: c.description
      })));
      return cctvConfigs;
    }
  };
  
  console.log('%cCCTV 화각 조절 도구가 준비되었습니다!', 'color: #3b82f6; font-weight: bold;');
  console.log('사용법:');
  console.log('  CCTVViewAngle.setAll(120)        // 모든 CCTV 화각을 120도로');
  console.log('  CCTVViewAngle.set("cctv-0", 60)  // cctv-0 화각을 60도로');
  console.log('  CCTVViewAngle.setGroup([...], 90) // 특정 그룹 화각 설정');
  console.log('  CCTVViewAngle.adjustAll(10)      // 모든 CCTV 화각 +10도');
  console.log('  CCTVViewAngle.get("cctv-0")      // CCTV 설정 확인');
  console.log('  CCTVViewAngle.list()            // 모든 CCTV 설정 확인');
}
