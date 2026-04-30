/**
 * 예측 CCTV 상세 정보
 *
 * 한/영 두 가지 언어 세트를 함께 가지고 있으며,
 * `getPredictedCCTVDetail(thumbnailUrl, lang)`을 통해 현재 언어 기준 데이터를 반환한다.
 */
import i18n from '@/src/i18n';

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

const PREDICTED_CCTV_DETAILS_KO: Record<string, PredictedCCTVDetail> = {
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

/** 영문 데이터 세트. 위 한국어 세트와 동일한 키를 가지며, 화면에 노출되는 모든 텍스트 필드를 영문으로 제공한다. */
const PREDICTED_CCTV_DETAILS_EN: Record<string, PredictedCCTVDetail> = {
  'qs_img_05_n': {
    objectAttributes: 'Dark coat, blue umbrella, walking on a pedestrian-priority road',
    expectedDistance: 'About 18m (from previous location)',
    movementTrend: 'Northbound (toward upper edge of frame)',
    expectedArrivalTime: '10:30:45 (now +35s)',
    routeFitScore: 15,
    detailedAnalysis: {
      movementDirection: 'Pattern observed at STAR-A230 (Love Church red pedestrian-priority road): paused next to a sign, then exited toward the upper edge of the frame. Northbound exit was sustained, so the next northern segment is a likely entry. Direction fits well.',
      movementSpeed: 'At STAR-A230, a brief pause for phone use was followed by resumed walking. If the same pattern holds, movement is expected to stay within average walking speed — reflected in the route fit.',
      pathStructure: 'Red pedestrian-priority section near "Ibadohae" with high pedestrian friendliness.',
      cctvLinkage: 'Coverage overlaps with 3 fixed CCTVs near Love Church, enabling continuous tracking.',
      similarCases: 'Pedestrians at this time of day typically head toward the church main gate or Yakdae Police Box.',
    },
  },
  'qs_img_11_n': {
    objectAttributes: 'Light gray top, patterned transparent umbrella, white sneakers',
    expectedDistance: 'About 12m',
    movementTrend: 'Northwest (steady walk toward upper edge of frame)',
    expectedArrivalTime: '10:31:20 (now +15s)',
    routeFitScore: 75,
    detailedAnalysis: {
      movementDirection: 'Pattern at STAR-A230 (Love Church side road): walked from lower-right toward the central road with umbrella, then exited toward the upper edge of frame. Exit direction was consistent, so northwestern segment entry is likely. Direction fits.',
      movementSpeed: 'Maintained a steady pace under umbrella at STAR-A230. ~4km/h walking pace expected to continue, matching the speed-fit criteria.',
      pathStructure: 'Wet side road where bus and pedestrian lanes overlap.',
      cctvLinkage: 'Adjacent fixed-cam #4 is ~15m away, enabling smooth tracking.',
      similarCases: 'On rainy days, pedestrians prefer eaves of buildings or shortest paths.',
    },
  },
  'qs_img_15_n': {
    objectAttributes: 'White large padded jacket, black bottoms, walking while using phone',
    expectedDistance: 'About 25m',
    movementTrend: 'Southwest (using crosswalk at lower-left of frame)',
    expectedArrivalTime: '10:32:30 (now +29s)',
    routeFitScore: 30,
    detailedAnalysis: {
      movementDirection: 'Pattern at STAR-A230 (Love Church four-way intersection): crossed diagonally at the crosswalk in front of "Sohan Realty," then exited toward lower-left (southwest). Crossing direction and exit direction connect, so southwestern segment entry is likely. Direction fits.',
      movementSpeed: 'Slower walking observed even while crossing, due to phone gazing. If the pattern continues, below-average speed is expected — reflected in the route fit.',
      pathStructure: 'Four-way intersection in a dense storefront area, directly connected to the crosswalk.',
      cctvLinkage: 'Linking with shop CCTVs (e.g., "Sohan Realty") minimizes blind spots.',
      similarCases: 'This area is a primary pedestrian path toward Chunui Stn or large shopping centers.',
    },
  },
  'qs_img_21_y': {
    objectAttributes: 'Gray hoodie, dark pants, using phone with both hands',
    expectedDistance: 'About 20m',
    movementTrend: 'Northeast (moving forward along the road beside the vehicle)',
    expectedArrivalTime: '10:33:30 (now +25s)',
    routeFitScore: 95,
    detailedAnalysis: {
      movementDirection: 'Pattern at STAR-A444 (road next to a silver vehicle): used phone with both hands while exiting toward the upper edge of frame in a northeasterly direction. Northeast exit was sustained, so the next northeastern alley segment is a likely entry. Direction fits.',
      movementSpeed: 'Below-average pace observed at STAR-A444 due to two-handed phone use. If the pattern persists, slow walking is expected to continue, matching the speed-fit criteria.',
      pathStructure: 'Typical residential alley with resident-priority parking and small shops.',
      cctvLinkage: 'Adjacent detector #2 (qs_img_25) connects in a straight line with the walking path.',
      similarCases: 'Sections like this carry a higher risk of pedestrian-vehicle conflict during phone use.',
    },
  },
  'qs_img_25_y': {
    objectAttributes: 'Gray hoodie, blue jeans, head down focused on phone',
    expectedDistance: 'About 15m',
    movementTrend: 'Southwest (approaching the camera head-on)',
    expectedArrivalTime: '10:34:10 (now +20s)',
    routeFitScore: 98,
    detailedAnalysis: {
      movementDirection: 'Pattern at STAR-A444 (near a yellow utility post): walked slowly along the center of the road, then exited toward the lower-front (southwest) of the camera. After head-down straight-line walking, the exit direction matched, so southwestern segment entry is likely. Direction fits.',
      movementSpeed: 'Did not look around at STAR-A444 — focus was solely on the phone screen. Stable but somewhat slow speed expected to continue, reflected in the route fit.',
      pathStructure: 'A bottleneck where many poles and posts narrow the walkway.',
      cctvLinkage: 'High-resolution detector enables precise extraction of clothing attributes.',
      similarCases: 'Resembles patterns where missing persons lose orientation and continue along a straight road.',
    },
  },
  'qs_img_30_y': {
    objectAttributes: 'Gray hoodie, slim build (back view), white sneakers',
    expectedDistance: 'About 30m',
    movementTrend: 'Northwest (straight-line walk along a one-way road)',
    expectedArrivalTime: '10:34:50 (now +30s)',
    routeFitScore: 96,
    detailedAnalysis: {
      movementDirection: 'Pattern at STAR-A481 (28 Moonlight St): entered the bottom of detector-1 frame, then exited toward the northwest (toward Moonlight St). If straight-line walking continues, northwestern segment entry is likely. Direction fits.',
      movementSpeed: 'Held the phone while moving forward at a steady pace at STAR-A481. With no stops or sudden acceleration, average walking speed is expected to continue, matching the speed-fit criteria.',
      pathStructure: 'Dense multi-family residential area directly connected to a pedestrian-only path.',
      cctvLinkage: 'Three nearby CCTVs have overlapping coverage, making continuous tracking very easy.',
      similarCases: 'Similar cases at this time of day tend to move toward the river (Gulpo Stream).',
    },
  },
  'qs_img_40_y': {
    objectAttributes: 'Gray hoodie, walking while checking phone, white sneakers',
    expectedDistance: 'About 22m',
    movementTrend: 'Northeast (continuing toward the road sign)',
    expectedArrivalTime: '10:35:30 (now +20s)',
    routeFitScore: 96,
    detailedAnalysis: {
      movementDirection: 'Pattern at STAR-A498 (near 54 Moonlight St): walked straight in the direction of the one-way arrow (toward upper edge of frame), then exited toward the northeast. The one-way direction and exit direction matched, so northeastern segment entry is likely. Direction fits.',
      movementSpeed: 'Speed dropped only minimally even while gazing at the phone. If the same pattern continues, straight-line walking pace is expected to be sustained — reflected in the route fit.',
      pathStructure: 'Narrow side road in front of a "specialty restaurant" with no clear walkway demarcation.',
      cctvLinkage: 'Mounted on top of a road sign, providing a strong overhead view.',
      similarCases: 'A spot where pedestrians often check phone maps to find their way.',
    },
  },
  'qs_img_47_y': {
    objectAttributes: 'Gray hoodie, gazing at phone screen, steady pace',
    expectedDistance: 'About 19m',
    movementTrend: 'Northwest (passing through a road near the crosswalk)',
    expectedArrivalTime: '10:35:45 (now +35s)',
    routeFitScore: 97,
    detailedAnalysis: {
      movementDirection: 'Pattern at STAR-A583 (near a crosswalk at 41 Sky Ave): used phone while moving along the center of the road toward the upper edge of frame, then exited toward the northwest. Northwest exit was sustained, so northwestern segment entry is likely. Direction fits.',
      movementSpeed: 'Intermittent slowdowns observed at STAR-A583 due to phone typing. If the pattern continues, walking speed is expected to stay around average — matching the speed-fit criteria.',
      pathStructure: 'Four-way section in front of "Chicken Bup Bup" with multiple possible movement paths.',
      cctvLinkage: 'Mounted at the center of the intersection, capturing entries and exits in all 4 directions.',
      similarCases: 'Many pedestrians here are heading to nearby convenience stores or cafés.',
    },
  },
  'qs_img_51_y': {
    objectAttributes: 'Gray hoodie, blue jeans, focused on two-handed phone use',
    expectedDistance: 'About 14m',
    movementTrend: 'Southwest (exiting toward the lower-front of the camera)',
    expectedArrivalTime: '10:36:50 (now +30s)',
    routeFitScore: 96,
    detailedAnalysis: {
      movementDirection: 'Pattern at STAR-A583 (road in front of a pharmacy): moved straight toward the camera, then exited toward the lower-front (southwest). Head-down forward motion and exit direction were consistent, so southwestern segment entry is likely. Direction fits.',
      movementSpeed: 'Maintained a very steady pace even while focused on the phone at STAR-A583. If the same goal-directed pattern persists, the same speed is expected — reflected in the route fit.',
      pathStructure: 'Dense pharmacy/clinic area with formal walkways made of paved blocks.',
      cctvLinkage: 'Highest linkage with the final capture point CCTV #59.',
      similarCases: 'Matches patterns where missing persons follow brightly lit shopping streets at night.',
    },
  },
  'cnc_04_1': {
    objectAttributes: 'Type: Vehicle (SUV class)\nColor: White\nDetails: Rear plate (014-jeo 4515) identifiable. Stationary, oriented away from camera (northwest). Matches a previously flagged vehicle in the watchlist database — 98% match in model and exterior features.',
    expectedDistance: 'About 1.5km (straight-line distance from side road exit to junction with Cloud Ave)',
    movementTrend: '[Risk] Subject B (victim) forced into vehicle; Subject A (perpetrator) boarded; rapid acceleration / departure imminent',
    expectedArrivalTime: '16:55:20 (estimated to leave the surveillance area and merge onto the main road within ~3 minutes)',
    routeFitScore: 96,
    routeFitScoreText: '96 pts (very high match with forced removal / restraint scenarios)',
    detailedAnalysis: {
      movementDirection: 'After pushing Subject B into the rear-right seat, the vehicle is preparing to drive toward the vanishing point in the upper frame (northwest).',
      movementSpeed: 'Currently stationary, but engine RPM rose immediately when doors closed — rapid acceleration / overspeed exit imminent.',
      pathStructure: 'The 28 Moonlight St area is a narrow residential block with no separation between pedestrians and vehicles. Large vehicles rarely enter, making it easy to avoid third-party witnesses if a crime occurs.',
      cctvLinkage: 'Upon exiting the STAR-A444 zone, automatically link and hand off to 12 CCTVs along Galaxy St and Moonlight St on the projected escape path.',
      similarCases: '[Vehicle match] Partial plate 12* 324* matches the suspect vehicle in a "forced boarding (attempted)" case reported in the area within the last 24 hours.\n[Behavior match] An adult male pushing an elderly person into the rear seat after a sudden stop in a narrow alley matches typical kidnapping/confinement patterns.',
      previousPath: 'Inferred to have entered from the Galaxy St side and made an emergency stop in the middle of the road as soon as the target (Subject B) was spotted.',
    },
    aiSimilarityAnalysis: {
      vehicleIdentity: 'Vehicle identity: This vehicle (partial plate: 12* 3***) is visually identical in plate number and rear lamp shape to a "white SUV" recorded as a suspect in past serious crime reports.',
      behaviorMechanism: 'Behavior mechanism: With ordinary assistance, a pedestrian boards the vehicle voluntarily. In this clip, however, Subject A is physically restraining Subject B\'s upper body and pushing them in.',
      geographicSpecificity: 'Geographic specificity: Stopping in a high-risk blind-spot location (side road) closely matches professional crime patterns.',
    },
  },
  'qs_img_59_y': {
    objectAttributes: 'Gray hoodie, dark pants, on a phone call or using phone',
    expectedDistance: 'About 18m',
    movementTrend: 'Southeast (entering toward emart24)',
    expectedArrivalTime: '10:37:20 (now +30s)',
    routeFitScore: 92,
    detailedAnalysis: {
      movementDirection: 'Pattern at STAR-A604 (29 Galaxy St, convenience store): paused near the convenience store entrance, then exited toward the upper-center of frame. The exit direction was sustained, so the northern segment is a likely entry. Direction fits.',
      movementSpeed: 'After loitering at the convenience store entrance (call/entry) at STAR-A604, walking resumed. Speed is expected to remain at a similar level after the pause — no sudden acceleration, so movement should stay within average walking speed, matching the speed-fit criteria.',
      pathStructure: 'Open area in front of emart24 allowing multi-directional movement.',
      cctvLinkage: 'Final capture point — additional CCTV linkage is required for further tracking.',
      similarCases: 'Resembles patterns where missing persons rest at a convenience store at night and lose direction afterwards.',
    },
  },
};

/**
 * 현재 i18n 언어에 맞춰 적절한 한/영 데이터 세트에서 항목을 조회한다.
 * @param thumbnailUrl 검색 키로 쓰일 썸네일 URL
 * @param lang 'ko' | 'en' (옵션) — 미지정 시 i18n.resolvedLanguage 사용
 */
export const getPredictedCCTVDetail = (thumbnailUrl: string, lang?: string): PredictedCCTVDetail | null => {
  const resolvedLang = (lang || i18n.resolvedLanguage || i18n.language || 'ko').slice(0, 2);
  const map = resolvedLang === 'en' ? PREDICTED_CCTV_DETAILS_EN : PREDICTED_CCTV_DETAILS_KO;

  // hijacking/cnc_04_1.mp4 등 (객체추적 2키 featured 영상)
  const cncMatch = thumbnailUrl.match(/cnc_04_1/);
  if (cncMatch) return map['cnc_04_1'] || null;

  // thumbnailUrl에서 파일명 추출 (예: /fastsearch_img/qs_img_05_n.mov -> qs_img_05_n)
  const match = thumbnailUrl.match(/qs_img_\d+_[yn]/);
  if (!match) return null;

  const key = match[0];
  return map[key] || null;
};

/** 외부에서 직접 KO 맵을 참조해야 하는 레거시 코드를 위해 export 유지. */
export const PREDICTED_CCTV_DETAILS = PREDICTED_CCTV_DETAILS_KO;
