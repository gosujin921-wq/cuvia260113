import { RiskLevel } from './types';

export const riskLevelMeta: Record<RiskLevel, { icon: string; color: string }> = {
  strong: { icon: 'mdi:alert', color: 'text-red-400' },
  high: { icon: 'mdi:alert', color: 'text-orange-400' },
  medium: { icon: 'mdi:alert', color: 'text-yellow-400' },
  low: { icon: 'mdi:alert', color: 'text-yellow-300' },
};

export const chatBlocks = [
  {
    title: '사건 해석',
    icon: 'mdi:lightbulb-on',
    content:
      '유괴 의심 사건이 확인되었습니다. 검은 후드티 남성이 파란 가방 멘 아이를 억지로 끌고 가는 장면이 CCTV에 포착되었습니다.',
  },
  {
    title: '관련 행동 분석',
    icon: 'mdi:run-fast',
    content:
      '용의자가 아이를 안고 산책로 쪽으로 뛰어갔으며, 이후 차량에 아이를 태우는 장면이 세 번째 CCTV에서 포착되었습니다.',
  },
  {
    title: '인물 추정',
    icon: 'mdi:account-badge',
    content: '용의자는 검은색 후드티 착용 남성. 아이는 파란 가방을 멘 상태로 확인됨. 차량을 이용한 도주 추정.',
  },
  {
    title: '대응 추천',
    icon: 'mdi:shield-check',
    content: '즉시 경찰 출동이 필요합니다. 차량 도주 추적을 위해 주변 CCTV 집중 모니터링 및 전방 차단이 필요합니다.',
  },
];

export const quickCommands = [
  '이 사건 분석해줘',
  '용의자 특징 알려줘',
  '추적 경로 보여줘',
  '전파문 초안 작성해줘',
  '위험도 재계산해줘',
  '유사 사건 찾아줘',
];

export const behaviorHighlights = [
  '검은 후드티 성인 남성이 아동을 강제로 이동시키는 장면 포착',
  '횡단보도 → 골목 방향 이동 후 아동이 차량에 탑승하는 장면 확인',
  '흰색 소형 승용차 이용해 북측 도로로 도주',
  '아동은 차량 탑승 이후 미포착 상태 → 차량 중심 추적 전환',
  '현재 차량 도주 중, AI 추적 유지',
];

export const movementTimeline = [
  { 
    time: '15:20:00', 
    title: '유괴 의심 신고 접수', 
    subtitle: '관양초등학교 앞 놀이터',
    cctvName: null,
    color: 'text-red-400',
    cctvId: null
  },
  { 
    time: '15:20:15', 
    title: '유괴범과 아동 함께 이동 포착', 
    subtitle: '인접 CCTV',
    cctvName: 'CCTV-7',
    color: 'text-yellow-400',
    cctvId: 'CCTV-7'
  },
  { 
    time: '15:21:30', 
    title: '시민 신고: 산책로 쪽으로 뛰어감', 
    subtitle: '새로운 신고 접수',
    cctvName: null,
    color: 'text-orange-400',
    cctvId: null
  },
  { 
    time: '15:22:45', 
    title: '용의자가 차량에 아이 태우는 장면 포착', 
    subtitle: '세 번째 CCTV',
    cctvName: 'CCTV-15',
    color: 'text-blue-400',
    cctvId: 'CCTV-15'
  },
  { 
    time: '15:23:00', 
    title: '차량 도주 추적 중', 
    subtitle: '주변 CCTV 모니터링',
    cctvName: 'CCTV-12',
    color: 'text-blue-400',
    cctvId: 'CCTV-12'
  },
];

export const routeRecommendation = '최단 출동 경로: 관양초등학교 → 산책로 방향 (ETA 5분)';

export const cctvInfo: Record<string, { id: string; name: string; location: string; status: string; confidence: number }> = {
  'CCTV-7 (현장)': {
    id: 'CCTV-7',
    name: '관양초등학교 앞 놀이터',
    location: '현장',
    status: '활성',
    confidence: 96,
  },
  'CCTV-12 (산책로 방향)': {
    id: 'CCTV-12',
    name: '산책로 입구',
    location: '산책로 방향',
    status: '추적중',
    confidence: 88,
  },
  'CCTV-15 (차량 탑승 지점)': {
    id: 'CCTV-15',
    name: '산책로 인근',
    location: '차량 탑승 지점',
    status: '추적중',
    confidence: 95,
  },
  'CCTV-9 (동쪽 100m)': {
    id: 'CCTV-9',
    name: '평촌동 주거지',
    location: '동쪽 100m',
    status: '대기',
    confidence: 65,
  },
  'CCTV-11 (서쪽 80m)': {
    id: 'CCTV-11',
    name: '비산2동 골목',
    location: '서쪽 80m',
    status: '대기',
    confidence: 58,
  },
  'CCTV-3 (남쪽 120m)': {
    id: 'CCTV-3',
    name: '관양동 교차로',
    location: '남쪽 120m',
    status: '추적중',
    confidence: 72,
  },
  'CCTV-5 (북동쪽 150m)': {
    id: 'CCTV-5',
    name: '호계동 상가',
    location: '북동쪽 150m',
    status: '추적중',
    confidence: 81,
  },
  'CCTV-8 (서남쪽 90m)': {
    id: 'CCTV-8',
    name: '인덕동 주택가',
    location: '서남쪽 90m',
    status: '대기',
    confidence: 67,
  },
  'CCTV-13 (동남쪽 110m)': {
    id: 'CCTV-13',
    name: '범계동 상권',
    location: '동남쪽 110m',
    status: '추적중',
    confidence: 75,
  },
  'CCTV-16 (북서쪽 130m)': {
    id: 'CCTV-16',
    name: '동안동 골목',
    location: '북서쪽 130m',
    status: '대기',
    confidence: 69,
  },
};

export const cctvThumbnailMap: Record<string, string> = {
  'CCTV-7': '/cctv_img/001.jpg',
  'CCTV-12': '/cctv_img/002.jpg',
  'CCTV-15': '/cctv_img/003.jpg',
  'CCTV-9': '/cctv_img/004.jpg',
  'CCTV-11': '/cctv_img/005.jpg',
  'CCTV-3': '/cctv_img/001.jpg',
  'CCTV-5': '/cctv_img/002.jpg',
  'CCTV-8': '/cctv_img/003.jpg',
  'CCTV-13': '/cctv_img/004.jpg',
  'CCTV-16': '/cctv_img/005.jpg',
};

export const cctvFovMap: Record<string, string> = {
  'CCTV-7': '110°',
  'CCTV-12': '95°',
  'CCTV-15': '120°',
  'CCTV-9': '100°',
  'CCTV-11': '105°',
};

// CCTV 위/경도 정보
export const cctvCoordinatesMap: Record<string, { latitude: string; longitude: string }> = {
  'CCTV-7': { latitude: '37.3925', longitude: '126.9567' },
  'CCTV-12': { latitude: '37.3930', longitude: '126.9570' },
  'CCTV-15': { latitude: '37.3920', longitude: '126.9560' },
  'CCTV-9': { latitude: '37.3935', longitude: '126.9575' },
  'CCTV-11': { latitude: '37.3928', longitude: '126.9565' },
  'CCTV-3': { latitude: '37.3922', longitude: '126.9562' },
  'CCTV-5': { latitude: '37.3932', longitude: '126.9572' },
  'CCTV-8': { latitude: '37.3927', longitude: '126.9567' },
  'CCTV-13': { latitude: '37.3930', longitude: '126.9568' },
  'CCTV-16': { latitude: '37.3925', longitude: '126.9570' },
  'CCTV-17': { latitude: '37.3926', longitude: '126.9571' },
  'CCTV-18': { latitude: '37.3927', longitude: '126.9572' },
  'CCTV-19': { latitude: '37.3928', longitude: '126.9573' },
  'CCTV-20': { latitude: '37.3929', longitude: '126.9574' },
};

// 포착된 CCTV 썸네일 데이터 (CCTV에서 감지되어 판단된 기준)
// 접수시간 직전이 처음 포착된 시간, 최신순으로 정렬
export const detectedCCTVThumbnails = [
  {
    id: 'detected-1',
    cctvId: 'CCTV-15',
    cctvName: 'CCTV-15',
    thumbnail: '/cctv_img/003.jpg',
    timestamp: '15:22:45',
    confidence: 95,
    description: '용의자가 차량에 아이를 태우는 장면 포착',
    location: '산책로 인근',
    aiAnalysis: '용의자가 아이를 차량에 태우는 장면 명확히 확인, 차량 도주 시작',
    suspectReason: '검은 후드티 남성이 파란 가방 멘 아이를 차량에 태우는 장면 포착',
    situation: '차량을 이용한 도주로 추정, 차량 번호 확인 필요',
  },
  {
    id: 'detected-2',
    cctvId: 'CCTV-12',
    cctvName: 'CCTV-12',
    thumbnail: '/cctv_img/002.jpg',
    timestamp: '15:21:45',
    confidence: 88,
    description: '산책로 방향 이동 포착',
    location: '산책로 입구',
    aiAnalysis: '용의자가 아이를 안고 산책로 쪽으로 이동하는 장면 확인',
    suspectReason: '검은 후드티 남성이 아이를 안고 빠르게 이동, 시민 신고 내용과 일치',
    situation: '산책로 방향으로 이동 중, 차량 탑승 전 단계로 추정',
  },
  {
    id: 'detected-3',
    cctvId: 'CCTV-7',
    cctvName: 'CCTV-7',
    thumbnail: '/cctv_img/001.jpg',
    timestamp: '15:20:15',
    confidence: 96,
    description: '유괴범과 아동 함께 이동 포착',
    location: '관양초등학교 앞 놀이터',
    aiAnalysis: '검은 후드티 남성이 파란 가방 멘 아이를 억지로 끌고 가는 장면 명확히 확인',
    suspectReason: '112 신고 내용과 일치하는 장면 포착, 유괴 의심 행위 확인',
    situation: '유괴 의심 사건의 첫 CCTV 포착, 용의자와 피해 아동 동시 확인',
  },
  {
    id: 'detected-4',
    cctvId: 'CCTV-3',
    cctvName: 'CCTV-3',
    thumbnail: '/cctv_img/001.jpg',
    timestamp: '15:23:10',
    confidence: 82,
    description: '차량 도주 추적',
    location: '관양동 교차로',
    aiAnalysis: '의심 차량이 교차로를 통과하며 도주 중',
    suspectReason: '용의자가 탑승한 것으로 추정되는 차량이 급가속하며 도주',
    situation: '차량 도주 추적 중, 전방 차단 필요',
  },
  {
    id: 'detected-5',
    cctvId: 'CCTV-9',
    cctvName: 'CCTV-9',
    thumbnail: '/cctv_img/004.jpg',
    timestamp: '15:23:30',
    confidence: 75,
    description: '차량 이동 경로 확인',
    location: '주변 도로',
    aiAnalysis: '의심 차량의 이동 경로 추적 중',
    suspectReason: '차량 도주 경로상 위치에서 의심 차량 포착',
    situation: '차량 도주 추적 지속 중',
  },
];

// CCTV 위치 그룹 정보 - 같은 위치에 여러 CCTV가 있을 수 있음
export const cctvLocationGroups: Record<string, { position: { left: number; top: number }; cctvs: string[] }> = {
  'location-1': {
    position: { left: 15, top: 80 },
    cctvs: ['CCTV-7', 'CCTV-8', 'CCTV-9'], // 같은 위치에 여러 CCTV
  },
  'location-2': {
    position: { left: 40, top: 60 },
    cctvs: ['CCTV-12', 'CCTV-11'], // 같은 위치에 여러 CCTV
  },
  'location-3': {
    position: { left: 70, top: 65 },
    cctvs: ['CCTV-15'], // 단독 CCTV
  },
  'location-4': {
    position: { left: 50, top: 40 },
    cctvs: ['CCTV-3', 'CCTV-5', 'CCTV-13'], // 같은 위치에 여러 CCTV
  },
  'location-5': {
    position: { left: 85, top: 45 },
    cctvs: ['CCTV-16', 'CCTV-17', 'CCTV-18', 'CCTV-19', 'CCTV-20'], // 현재 위치 주변 (용의자 추적중) - 5개 클러스터
  },
};


