/**
 * CCTV 비디오 유틸리티 함수
 * public/cctv_img 디렉토리의 비디오 파일을 랜덤으로 섞어서 제공
 */

// CCTV 비디오 파일 목록
export const CCTV_VIDEO_FILES = [
  '/cctv_img/cctv1.mov',
  '/cctv_img/cctv3.mov',
  '/cctv_img/cctv4.mov',
  '/cctv_img/cctv5.mov',
  '/cctv_img/cctv6.mov',
];

// CCTV 이미지 파일 목록
export const CCTV_IMAGE_FILES = [
  '/cctv_img/002.jpg',
  '/cctv_img/003.jpg',
];

// CCTV 전체 미디어 파일 목록 (영상 6개)
export const CCTV_ALL_MEDIA: { src: string; type: 'video' | 'image' }[] = [
  { src: '/cctv_img/cctv1.mov', type: 'video' },
  { src: '/cctv_img/cctv5.mov', type: 'video' },
  { src: '/cctv_img/cctv3.mov', type: 'video' },
  { src: '/cctv_img/cctv4.mov', type: 'video' },
  { src: '/cctv_img/cctv6.mov', type: 'video' },
];

/**
 * 배열을 랜덤으로 섞는 함수 (Fisher-Yates 알고리즘)
 */
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * CCTV ID를 기반으로 일관된 랜덤 비디오 선택
 * 같은 CCTV ID는 항상 같은 비디오를 반환 (시드 기반)
 */
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit 정수로 변환
  }
  return Math.abs(hash);
};

/**
 * CCTV ID에 따라 랜덤으로 섞인 비디오 파일 반환
 * 같은 CCTV ID는 항상 같은 비디오를 반환 (시드 기반)
 */
export const getRandomCCTVVideo = (cctvId?: string): string => {
  if (cctvId) {
    // CCTV ID가 있으면 시드 기반으로 일관된 선택
    // CCTV ID를 시드로 사용하여 배열을 섞고, 그 결과에서 선택
    const seed = hashString(cctvId);
    const shuffled = [...CCTV_VIDEO_FILES];
    
    // 시드 기반 셔플
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (seed + i) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    const index = seed % CCTV_VIDEO_FILES.length;
    return shuffled[index];
  }
  
  // CCTV ID가 없으면 완전 랜덤
  return CCTV_VIDEO_FILES[Math.floor(Math.random() * CCTV_VIDEO_FILES.length)];
};

/**
 * 모든 CCTV ID에 대해 랜덤으로 섞인 비디오 맵 생성
 */
export const generateCCTVVideoMap = (cctvIds: string[]): Record<string, string> => {
  const videoMap: Record<string, string> = {};
  cctvIds.forEach(cctvId => {
    videoMap[cctvId] = getRandomCCTVVideo(cctvId);
  });
  return videoMap;
};
