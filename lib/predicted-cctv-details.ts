/**
 * 예측 CCTV 상세 정보
 */

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
    previousPath: string;
    similarCases: string;
  };
}

export const PREDICTED_CCTV_DETAILS: Record<string, PredictedCCTVDetail> = {
  'qs_img_05_n': {
    objectAttributes: '어두운색 외투, 파란색 우산 소지, 보행자 우선도로 이동',
    expectedDistance: '약 18m (이전 위치 기준)',
    movementTrend: '북향 (화면 상단 방향)',
    expectedArrivalTime: '10:30:45 (현재 시각 + 35초)',
    routeFitScore: 15,
    detailedAnalysis: {
      movementDirection: '마지막 프레임 기준 북향을 유지하며 화면 상단으로 이동 중.',
      movementSpeed: '휴대폰 확인을 위해 일시 정지 후 재보행하는 불규칙한 속도 패턴.',
      pathStructure: '\'이바도해\' 붉은색 보행자 우선도로 구간으로 보행 편의성이 높음.',
      cctvLinkage: '참사랑교회 인근 고정형 CCTV 3대와 화각이 중첩되어 연속 추적 가능.',
      previousPath: '인근 골목에서 진입하여 표지판 근처에서 체류하는 경향을 보임.',
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
      movementDirection: '화면 우측 하단에서 북서 방향으로 도로를 가로질러 이동.',
      movementSpeed: '우산을 쓴 상태에서 급가속 없이 시속 약 4km의 안정적인 보행 속도 유지.',
      pathStructure: '노면이 젖은 이면도로이며, 버스 통행로와 보행로가 혼재된 구간임.',
      cctvLinkage: '다음 지점인 고정4번 카메라와 약 15m 거리로 인접하여 추적 용이.',
      previousPath: '이전 고정2번 지점에서 이탈하여 직선 경로를 따라 진입한 패턴.',
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
      movementDirection: '사거리 횡단보도를 남서 방향으로 대각선 횡단 중.',
      movementSpeed: '횡단 중에도 휴대폰 화면을 응시하며 다소 느린 속도로 이동.',
      pathStructure: '상가 밀집 지역의 사거리이며 횡단보도와 직접 연결되는 동선임.',
      cctvLinkage: '\'세종공인중개사\' 등 상가 CCTV와 연동 시 사각지대 최소화 가능.',
      previousPath: '참사랑교회 방향에서 내려와 길주로 방면으로 이동하는 흐름.',
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
      movementDirection: '화면 하단에서 북동 방향으로 골목길 진입 중.',
      movementSpeed: '양손 스마트폰 조작으로 인해 평균보다 낮은 보행 속도 관찰.',
      pathStructure: '거주자 우선 주차 구역과 점포가 밀집된 전형적인 주택가 골목.',
      cctvLinkage: '인접한 검지2번(25번 영상) 카메라와 보행 동선이 직선으로 연결됨.',
      previousPath: '길주로 대로변에서 주택가 안쪽으로 유입되는 패턴 반복.',
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
      movementDirection: '마지막 프레임 기준 남서 방향(카메라 정면)으로 접근 중.',
      movementSpeed: '주변을 살피지 않고 화면에만 집중하여 안정적이나 느린 보행.',
      pathStructure: '전신주 및 지주대가 많아 보행로가 협소해지는 병목 구간임.',
      cctvLinkage: '고화질 검지기로 객체의 의복 속성을 정밀하게 추출 가능한 구간.',
      previousPath: '검지1번 지점을 통과하여 지속적으로 골목 안쪽으로 보행 중.',
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
      movementDirection: '카메라에서 멀어지는 북서 방향으로 직선 보행.',
      movementSpeed: '정지나 급가속 없이 평균 보행 속도 범위를 안정적으로 유지.',
      pathStructure: '다세대 주택이 밀집된 구간으로 보행자 전용 동선과 직접 연결됨.',
      cctvLinkage: '인접 CCTV 3대의 커버리지가 중첩되어 연속 추적이 매우 용이함.',
      previousPath: '특정 지점(길주로 골목)에서 체류한 후 기존 이동 방향을 유지하여 이탈.',
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
      movementDirection: '\'일방통행\' 화살표 방향인 북동쪽으로 보행 유지.',
      movementSpeed: '보행 중 휴대폰을 주머니에서 꺼내는 행동이 있으나 속도 저하는 미미함.',
      pathStructure: '\'요리 전문점\' 앞 좁은 이면도로이며 보행로 구분이 명확하지 않음.',
      cctvLinkage: '도로 표지판 상단에 설치된 카메라로 상단 뷰 확보가 양호함.',
      previousPath: '달빛로 주택가를 빠져나와 다시 상가 밀집 지역으로 진입하는 동선.',
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
      movementDirection: '마지막 프레임 기준 북서 방향을 유지하며 화면 상단 이탈.',
      movementSpeed: '스마트폰 타이핑으로 인해 보행 속도가 간헐적으로 느려짐.',
      pathStructure: '\'치킨 붑붑\' 앞 사거리 구간으로 다방면의 이동 경로가 존재함.',
      cctvLinkage: '사거리 중심에 설치되어 4개 방향의 진출입 객체를 모두 감지함.',
      previousPath: '길주로377번길에서 이동해와 은하로 대로변 방면으로 향함.',
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
      movementDirection: '화면 상단에서 남서 방향(정면)으로 성기약국 앞 통과.',
      movementSpeed: '매우 일정한 속도로 보행하며 목적지가 명확한 것으로 추정됨.',
      pathStructure: '약국 및 병원 밀집 구역으로 보도 블록이 설치된 정식 보행로 구간.',
      cctvLinkage: '최종 포착 지점인 CCTV 59번과 가장 높은 연계성을 가짐.',
      previousPath: '사거리를 통과하여 emart24 편의점 방향으로 직선 이동 중.',
      similarCases: '야간 시간대 밝은 상점가 조명을 따라 이동하는 실종자 행동 양식과 일치.',
    },
  },
  'cnc_04_1': {
    objectAttributes: '종류: 차량(승용/SUV 계열로 보임)\n색상: 흰색\n특징: 후면이 보이는 상태로 카메라에서 멀어지는 방향으로 이동(도로 중앙 차로 이용)',
    expectedDistance: '약 1.5km (인근 중동대로 합류 지점까지의 직선거리)',
    movementTrend: '[위험] 객체 전원 차량 탑승 완료 후 화면 상단(북서 방향)으로 급가속 이탈 준비',
    expectedArrivalTime: '16:55:20 (현 시각 기준 약 3분 내 주요 관제 구역 이탈 및 대로 진입 예상)',
    routeFitScore: 96,
    routeFitScoreText: '96점 (강제 연행 및 이동 자유 억압 범죄 시나리오와 매우 높은 일치율)',
    detailedAnalysis: {
      movementDirection: '차량 우측 뒷좌석 진입 후 화면 상단 방향(북서 방향)으로 도주로 확보',
      movementSpeed: '인물 승차 시까지 정지 상태였으나, 문 폐쇄 직후 급격한 가속 예상',
      pathStructure: '보차 구분이 없는 협소한 주택가 이면도로 구조로 인해 타인의 시선을 피하기 용이함',
      cctvLinkage: '별빛A-444 영역 이탈 시, 예상 경로상에 위치한 은하로 일대 12개소 CCTV 자동 연계 및 핸드오버 실시',
      previousPath: '달빛로 방면에서 진입하여 해당 지점(은하로363번길 48)에 급정차한 것으로 분석됨',
      similarCases: '',
    },
  },
  'qs_img_59_y': {
    objectAttributes: '회색 후드티, 어두운색 바지, 휴대폰 통화 또는 조작',
    expectedDistance: '약 18m',
    movementTrend: '남동쪽 (emart24 방향 진입)',
    expectedArrivalTime: '10:37:20 (현재 시각 + 30초)',
    routeFitScore: 92,
    detailedAnalysis: {
      movementDirection: '편의점 앞에서 체류하며 입장·퇴장을 반복한 후 상단 중앙 방향으로 이탈.',
      movementSpeed: '체류 중 정지와 이동을 반복하며 불규칙한 속도 패턴을 보임.',
      pathStructure: 'emart24 편의점 앞 개방된 공간으로 다방향 이동이 가능한 구간.',
      cctvLinkage: '최종 포착 지점으로 이후 추적을 위한 주변 CCTV 연계가 필요함.',
      previousPath: '은하로391번길 검지3-B 지점에서 직선 이동하여 편의점에 도착.',
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
