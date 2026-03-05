/**
 * 예측 CCTV 상세 정보
 */

/** AI 유사사유 판독 (별빛A-655 등 차량 추적 시나리오용) */
export interface AiSimilarityAnalysis {
  vehicleIdentity: string;
  behaviorMechanism: string;
  geographicSpecificity: string;
}

export interface PredictedCCTVDetail {
  objectAttributes: string;
  expectedDistance: string;
  movementTrend: string;
  expectedArrivalTime: string;
  routeFitScore: number;
  /** 정성 평가 등 텍스트로 표시할 때 사용 (routeFitScore 대신 표시) */
  routeFitScoreText?: string;
  detailedAnalysis: {
    movementDirection: string;
    movementSpeed: string;
    pathStructure: string;
    cctvLinkage: string;
    similarCases: string;
    /** 이전 경로 (선택, 별빛A-655 등) */
    previousPath?: string;
  };
  /** AI 유사사유 판독 (선택, 별빛A-655 등) */
  aiSimilarityAnalysis?: AiSimilarityAnalysis;
}

export const PREDICTED_CCTV_DETAILS: Record<string, PredictedCCTVDetail> = {
  'qs_img_05_n': {
    objectAttributes: '어두운색 외투, 파란색 우산 소지, 보행자 우선도로 이동',
    expectedDistance: '약 18m (이전 위치 기준)',
    movementTrend: '북향 (화면 상단 방향)',
    expectedArrivalTime: '10:30:45 (현재 시각 + 35초)',
    routeFitScore: 15,
    detailedAnalysis: {
      movementDirection: '별빛A-230(사랑교회 앞 붉은색 보행자 우선도로)에서 표지판 옆 정지 후 화면 상단 방향으로 이탈한 패턴이 관찰됨. 이탈 방향이 북향으로 유지되었으므로, 예상 경로상 북쪽 인접 구역 진입 가능성이 높아 방향 적합함.',
      movementSpeed: '별빛A-230에서 휴대폰 조작으로 인한 일시 정지 후 재보행 패턴이 확인됨. 동일한 행동 패턴이 지속될 경우 평균 보행 속도 범위 내 이동이 예상되어 경로 적합도에 반영함.',
      pathStructure: '\'이바도해\' 붉은색 보행자 우선도로 구간으로 보행 편의성이 높음.',
      cctvLinkage: '사랑교회 인근 고정형 CCTV 3대와 화각이 중첩되어 연속 추적 가능.',
      similarCases: '해당 시간대 보행자들은 주로 교회 정문 또는 약대파출소 방향으로 이동함.',
    },
  },
  'qs_img_11_n': {
    objectAttributes: '연회색 상의, 패턴 있는 투명 우산, 흰색 운동화',
    expectedDistance: '약 12m',
    movementTrend: '북서쪽 (화면 상단으로 일정한 보행)',
    expectedArrivalTime: '10:31:20 (현재 시각 + 15초)',
    routeFitScore: 75,
    detailedAnalysis: {
      movementDirection: '별빛A-230(사랑교회 인근 이면도로)에서 우산 착용 상태로 화면 우측 하단에서 중앙 도로 방향 보행 후 화면 상단으로 이탈한 패턴이 관찰됨. 이탈 방향이 일정하여 북서 방향 다음 구역 진입 가능성이 높아 방향 적합함.',
      movementSpeed: '별빛A-230에서 우산 착용 상태로 일정한 속도를 유지한 것이 확인됨. 시속 약 4km 전후의 보행 속도가 유지될 것으로 예상되어 속도 적합도에 부합함.',
      pathStructure: '노면이 젖은 이면도로이며, 버스 통행로와 보행로가 혼재된 구간임.',
      cctvLinkage: '다음 지점인 고정4번 카메라와 약 15m 거리로 인접하여 추적 용이.',
      similarCases: '비 오는 날씨로 인해 보행자들이 건물 처마 밑이나 최단거리 동선을 선호함.',
    },
  },
  'qs_img_15_n': {
    objectAttributes: '흰색 대형 패딩, 검은색 하의, 휴대폰 조작 보행',
    expectedDistance: '약 25m',
    movementTrend: '남서쪽 (화면 하단 좌측 횡단보도 이용)',
    expectedArrivalTime: '10:32:30 (현재 시각 + 29초)',
    routeFitScore: 30,
    detailedAnalysis: {
      movementDirection: '별빛A-230(사랑교회 인근 사거리)에서 소한공인중개사 앞 횡단보도 대각선 횡단 후 화면 하단 좌측(남서) 방향으로 이탈한 패턴이 관찰됨. 횡단 방향과 이탈 방향이 연속되어 남서쪽 인접 구역 진입 가능성이 높아 방향 적합함.',
      movementSpeed: '별빛A-230에서 횡단 중에도 휴대폰 응시로 인한 다소 느린 보행이 관찰됨. 동일한 행동 패턴이 지속될 경우 평균 이하 속도 유지가 예상되어 경로 적합도에 반영함.',
      pathStructure: '상가 밀집 지역의 사거리이며 횡단보도와 직접 연결되는 동선임.',
      cctvLinkage: '\'소한공인중개사\' 등 상가 CCTV와 연동 시 사각지대 최소화 가능.',
      similarCases: '해당 지점은 주로 춘의역 또는 대형 상가로 향하는 주 보행로임.',
    },
  },
  'qs_img_21_y': {
    objectAttributes: '회색 후드티, 어두운색 바지, 휴대폰 양손 조작',
    expectedDistance: '약 20m',
    movementTrend: '북동쪽 (차량 옆 도로를 따라 전방 이동)',
    expectedArrivalTime: '10:33:30 (현재 시각 + 25초)',
    routeFitScore: 95,
    detailedAnalysis: {
      movementDirection: '별빛A-444(은색 차량 옆 도로)에서 양손 휴대폰 조작하며 북동 방향으로 화면 상단 이탈한 패턴이 관찰됨. 이탈 방향이 북동으로 유지되었으므로, 골목길 북동쪽 인접 구역 진입 가능성이 높아 방향 적합함.',
      movementSpeed: '별빛A-444에서 스마트폰 양손 조작으로 인해 평균보다 낮은 보행 속도가 관찰됨. 동일한 행동 패턴이 유지되면 느린 보행이 계속될 것으로 예상되어 속도 적합도에 부합함.',
      pathStructure: '거주자 우선 주차 구역과 점포가 밀집된 전형적인 주택가 골목.',
      cctvLinkage: '인접한 검지2번(25번 영상) 카메라와 보행 동선이 직선으로 연결됨.',
      similarCases: '해당 구간은 보행 중 스마트폰 사용 시 차량과의 충돌 위험이 높은 사례가 많음.',
    },
  },
  'qs_img_25_y': {
    objectAttributes: '회색 후드티, 청바지, 고개 숙이고 스마트폰 집중',
    expectedDistance: '약 15m',
    movementTrend: '남서쪽 (카메라 정면 방향으로 접근)',
    expectedArrivalTime: '10:34:10 (현재 시각 + 20초)',
    routeFitScore: 98,
    detailedAnalysis: {
      movementDirection: '별빛A-444(노란색 지주대 부근)에서 도로 중앙 따라 서행 보행 후 카메라 정면 하단(남서) 방향으로 이탈한 패턴이 관찰됨. 고개 숙인 채 직선 보행 후 이탈 방향이 일치하여 남서쪽 인접 구역 진입 가능성이 높아 방향 적합함.',
      movementSpeed: '별빛A-444에서 주변을 살피지 않고 화면에만 집중하여 보행한 것이 확인됨. 안정적이나 다소 느린 속도가 유지될 것으로 예상되어 경로 적합도에 반영함.',
      pathStructure: '전신주 및 지주대가 많아 보행로가 협소해지는 병목 구간임.',
      cctvLinkage: '고화질 검지기로 객체의 의복 속성을 정밀하게 추출 가능한 구간.',
      similarCases: '실종자들이 주로 방향감을 잃고 직선 도로를 따라 계속 걷는 패턴과 유사.',
    },
  },
  'qs_img_30_y': {
    objectAttributes: '회색 후드티, 뒷모습 슬림한 체격, 흰색 운동화',
    expectedDistance: '약 30m',
    movementTrend: '북서쪽 (일방통행 도로를 따라 직선 보행)',
    expectedArrivalTime: '10:34:50 (현재 시각 + 30초)',
    routeFitScore: 96,
    detailedAnalysis: {
      movementDirection: '별빛A-481(달빛로301번길 28)에서 검지1 화각 하단 등장 후 북서 방향(달빛로 방면)으로 이탈한 패턴이 관찰됨. 직선 도로 보행 패턴이 유지되면 북서쪽 인접 구역 진입 가능성이 높아 방향 적합함.',
      movementSpeed: '별빛A-481에서 휴대폰을 든 채 일정한 속도로 전방 이동한 것이 확인됨. 정지나 급가속 없이 평균 보행 속도 유지가 예상되어 속도 적합도에 부합함.',
      pathStructure: '다세대 주택이 밀집된 구간으로 보행자 전용 동선과 직접 연결됨.',
      cctvLinkage: '인접 CCTV 3대의 커버리지가 중첩되어 연속 추적이 매우 용이함.',
      similarCases: '해당 시간대 유사 사례 분석 시 주로 하천(굴포천) 방향으로 이동하는 패턴임.',
    },
  },
  'qs_img_40_y': {
    objectAttributes: '회색 후드티, 휴대폰 확인하며 보행, 흰색 운동화',
    expectedDistance: '약 22m',
    movementTrend: '북동쪽 (표지판 방향으로 보행 유지)',
    expectedArrivalTime: '10:35:30 (현재 시각 + 20초)',
    routeFitScore: 96,
    detailedAnalysis: {
      movementDirection: '별빛A-498(달빛로301번길 54 인근)에서 일방통행 화살표 방향(화면 상단)으로 직선 보행 후 북동 방향 이탈한 패턴이 관찰됨. 일방통행 방향과 이탈 방향이 일치하여 북동쪽 인접 구역 진입 가능성이 높아 방향 적합함.',
      movementSpeed: '별빛A-498에서 보행 중 휴대폰 응시 시에도 속도 저하가 미미했음. 동일한 패턴이 지속되면 직선 보행 속도가 유지될 것으로 예상되어 경로 적합도에 반영함.',
      pathStructure: '\'요리 전문점\' 앞 좁은 이면도로이며 보행로 구분이 명확하지 않음.',
      cctvLinkage: '도로 표지판 상단에 설치된 카메라로 상단 뷰 확보가 양호함.',
      similarCases: '보행자들이 길을 찾기 위해 휴대폰 지도를 자주 확인하는 지점임.',
    },
  },
  'qs_img_47_y': {
    objectAttributes: '회색 후드티, 스마트폰 화면 응시, 일정한 보행 속도',
    expectedDistance: '약 19m',
    movementTrend: '북서쪽 (횡단보도 인근 도로 통과)',
    expectedArrivalTime: '10:35:45 (현재 시각 + 35초)',
    routeFitScore: 97,
    detailedAnalysis: {
      movementDirection: '별빛A-583(별빛구 하늘로 245번길 41, 횡단보도 인근)에서 스마트폰 조작하며 도로 중앙 따라 상단 방향 이동 후 북서 방향 이탈한 패턴이 관찰됨. 이탈 방향이 북서로 유지되어 북서쪽 인접 구역 진입 가능성이 높아 방향 적합함.',
      movementSpeed: '별빛A-583에서 스마트폰 타이핑으로 인해 간헐적 감속이 관찰됨. 동일한 행동 패턴이 유지되면 평균 전후의 보행 속도 범위 내 이동이 예상되어 속도 적합도에 부합함.',
      pathStructure: '\'치킨 붑붑\' 앞 사거리 구간으로 다방면의 이동 경로가 존재함.',
      cctvLinkage: '사거리 중심에 설치되어 4개 방향의 진출입 객체를 모두 감지함.',
      similarCases: '인근 편의점이나 카페를 목적으로 이동하는 보행자 패턴이 많음.',
    },
  },
  'qs_img_51_y': {
    objectAttributes: '회색 후드티, 청바지, 양손 스마트폰 조작 집중',
    expectedDistance: '약 14m',
    movementTrend: '남서쪽 (카메라 정면 하단 방향 이탈)',
    expectedArrivalTime: '10:36:50 (현재 시각 + 30초)',
    routeFitScore: 96,
    detailedAnalysis: {
      movementDirection: '별빛A-583(건강약국 앞 도로)에서 카메라 정면 방향으로 이동한 후 정면 하단(남서) 방향으로 이탈한 패턴이 관찰됨. 고개 숙인 채 정면 진행 후 이탈한 흐름이 일관되어 남서쪽 인접 구역 진입 가능성이 높아 방향 적합함.',
      movementSpeed: '별빛A-583에서 스마트폰 집중 보행 중에도 매우 일정한 속도를 유지한 것이 확인됨. 목적지가 명확한 보행 패턴이 지속될 경우 동일 속도 유지가 예상되어 경로 적합도에 반영함.',
      pathStructure: '약국 및 병원 밀집 구역으로 보도 블록이 설치된 정식 보행로 구간.',
      cctvLinkage: '최종 포착 지점인 CCTV 59번과 가장 높은 연계성을 가짐.',
      similarCases: '야간 시간대 밝은 상점가 조명을 따라 이동하는 실종자 행동 양식과 일치.',
    },
  },
  'cnc_04_1': {
    objectAttributes: '종류: 차량 (SUV 계열)\n색상: 흰색\n특징: 후면 번호판(014저 4515) 식별 상태로 카메라에서 멀어지는 방향(북서향)으로 정차 중. 이전 수배 차량 데이터베이스의 모델 및 외관 특징과 98% 일치함.',
    expectedDistance: '약 1.5km (이면도로 탈출 후 인근 구름대로 합류 지점까지의 직선거리)',
    movementTrend: '[위험] 인물 B(피해자) 강제 승차 완료 및 인물 A(가해자) 탑승 후 급가속 이탈 징후 포착',
    expectedArrivalTime: '16:55:20 (현 시각 기준 약 3분 내 주요 관제 구역 이탈 및 대로 진입 예상)',
    routeFitScore: 96,
    routeFitScoreText: '96점 (강제 연행 및 이동 자유 억압 범죄 시나리오와 매우 높은 일치율)',
    detailedAnalysis: {
      movementDirection: '인물 B를 우측 뒷좌석으로 밀어 넣은 후, 차량은 화면 상단(북서 방향)의 소실점을 향해 주행 준비 중.',
      movementSpeed: '정차 중이었으나 문 폐쇄와 동시에 엔진 회전수(RPM) 상승 감지, 즉각적인 급가속 및 과속 이탈이 예상됨.',
      pathStructure: '달빛로301번길 28 일대는 보차 구분이 없는 협소한 주택가로, 대형 차량 진입이 적어 범죄 발생 시 타인의 시선을 피하기 용이한 구조임.',
      cctvLinkage: '별빛A-444 영역 이탈 즉시, 도주 예상 경로상에 위치한 은하로 및 달빛로 일대 12개소 CCTV 자동 연계 및 핸드오버 실시.',
      similarCases: '[차량 일치] 부분 번호판:12* 324*는 24시간 내 인근 지역에서 보고된 \'강제 승차 미수\' 사건의 용의 차량과 동일함.[행동 일치] 좁은 골목길 급정차 후 성인 남성이 노약자를 뒷좌석에 밀어 넣는 행위는 전형적인 납치/감금 행동 패턴과 일치함.',
      previousPath: '은하로 방면에서 진입하여 타겟(인물 B) 발견 즉시 도로 중앙에 급정차한 것으로 분석됨.',
    },
    aiSimilarityAnalysis: {
      vehicleIdentity: '차량 정체성(Identity): 해당 차량(부분 번호판: 12* 3***)은 과거 강력범죄 의심 기록에 등록된 \'화이트 SUV\'와 번호판 및 후면 램프 형상이 시각적으로 동일함.',
      behaviorMechanism: '행동 메커니즘: 단순 부축의 경우 보행자가 자발적으로 차에 오르지만, 본 영상에서는 인물 A가 인물 B의 상체를 결착하여 밀어 넣는 물리력을 행사하고 있음.',
      geographicSpecificity: '지리적 특이성: 범죄 발생 위험도가 높은 사각지대(이면도로)를 정차 지점으로 선택한 점이 전문 범죄 패턴과 매우 흡사함.',
    },
  },
  'qs_img_59_y': {
    objectAttributes: '회색 후드티, 어두운색 바지, 휴대폰 통화 또는 조작',
    expectedDistance: '약 18m',
    movementTrend: '남동쪽 (emart24 방향 진입)',
    expectedArrivalTime: '10:37:20 (현재 시각 + 30초)',
    routeFitScore: 92,
    detailedAnalysis: {
      movementDirection: '별빛A-604(은하로391번길 29, 편의점)에서 편의점 입구 근처 체류 후 상단 중앙 방향으로 이탈한 패턴이 관찰됨. 이탈 방향이 일정하게 유지되어 북쪽 인접 구역 진입 가능성이 높아 방향 적합함.',
      movementSpeed: '별빛A-604에서 편의점 입구 체류(전화·입장) 후 재보행 패턴이 확인됨. 체류 후에도 보행 속도가 유사 수준으로 유지될 것으로 예상되어, 급가속 없이 평균 보행 속도 범위 내 이동 가능성이 높아 속도 적합도에 부합함.',
      pathStructure: 'emart24 편의점 앞 개방된 공간으로 다방향 이동이 가능한 구간.',
      cctvLinkage: '최종 포착 지점으로 이후 추적을 위한 주변 CCTV 연계가 필요함.',
      similarCases: '야간 실종자들이 편의점에서 휴식 후 방향을 잃고 이동하는 패턴과 유사.',
    },
  },
};

export const getPredictedCCTVDetail = (thumbnailUrl: string): PredictedCCTVDetail | null => {
  // hijacking/cnc_04_1.mp4 등 (객체추적 2키 featured 영상)
  const cncMatch = thumbnailUrl.match(/cnc_04_1/);
  if (cncMatch) return PREDICTED_CCTV_DETAILS['cnc_04_1'] || null;

  // thumbnailUrl에서 파일명 추출 (예: /fastsearch_img/qs_img_05_n.mov -> qs_img_05_n)
  const match = thumbnailUrl.match(/qs_img_\d+_[yn]/);
  if (!match) return null;

  const key = match[0];
  return PREDICTED_CCTV_DETAILS[key] || null;
};
