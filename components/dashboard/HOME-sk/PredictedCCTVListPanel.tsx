import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import PredictedCCTVDetailPopup from './PredictedCCTVDetailPopup';

interface PredictedCCTVListPanelProps {
  isVisible: boolean;
  width?: number;
  onAddCapture?: (cctvName: string, location: string, confidence: number, capturedImage?: string, analysisResult?: string, videoUrl?: string) => void;
  hoveredCCTVId?: string | null;
  onCCTVHover?: (cctvId: string | null) => void;
  /** 반경(m) 변경 시 부모에 전달 (지도 대시 원 연동) */
  onRadiusChange?: (radius: number) => void;
  /** CCTV 카드 선택(상세 팝업 오픈) 시 호출 */
  onCCTVSelect?: () => void;
  /** CCTV 상세 팝업 닫힘 시 호출 */
  onCCTVDetailClose?: () => void;
  /** 외부에서 열 CCTV ID */
  openCCTVId?: string | null;
  /** CCTV가 열렸을 때 호출 */
  onCCTVOpened?: () => void;
  /** 외부에서 팝업 닫기 신호 */
  closeCCTVPopupSignal?: number;
  /** 팝업 열릴 때 자동 포착 실행 여부 */
  autoCapture?: boolean;
}

export interface PredictedCCTVItem {
  id: string;
  cctvName: string;
  location: string;
  distance: number; // 미터
  predictedTime: string; // HH:MM:SS
  confidence: number; // 0-100
  direction: string; // 예: "북동쪽", "남쪽"
  thumbnailUrl: string;
  posterUrl?: string;
}

// Mock 데이터 - 4번 핀(본관 1F 메인 로비) 근처 CCTV 10개
const PREDICTED_CCTV_DATA: PredictedCCTVItem[] = [
  {
    id: '1',
    cctvName: 'GATE-MAIN-02',
    location: '본관 1F 메인 로비',
    distance: 15,
    predictedTime: '09:35:15',
    confidence: 15,
    direction: '북동쪽',
    thumbnailUrl: '/fastsearch_img/qs_img_05_n.mp4',
    posterUrl: '/fastsearch_img/qs_img_05_n.png',
  },
  {
    id: '2',
    cctvName: 'LOBBY-MAIN-01',
    location: '본관 1F 메인 로비',
    distance: 20,
    predictedTime: '09:35:30',
    confidence: 75,
    direction: '북서쪽',
    thumbnailUrl: '/fastsearch_img/qs_img_11_n.mp4',
    posterUrl: '/fastsearch_img/qs_img_11_n.png',
  },
  {
    id: '3',
    cctvName: 'GATE-EAST-04',
    location: '본관 1F 메인 로비',
    distance: 18,
    predictedTime: '09:35:45',
    confidence: 30,
    direction: '동쪽',
    thumbnailUrl: '/fastsearch_img/qs_img_15_n.mp4',
    posterUrl: '/fastsearch_img/qs_img_15_n.png',
  },
  {
    id: '4',
    cctvName: 'GATE-WEST-08',
    location: '본관 1F 메인 로비',
    distance: 22,
    predictedTime: '09:36:00',
    confidence: 95,
    direction: '남서쪽',
    thumbnailUrl: '/fastsearch_img/qs_img_21_y.mp4',
    posterUrl: '/fastsearch_img/qs_img_21_y_2.png',
  },
  {
    id: '5',
    cctvName: 'CORR-1F-09',
    location: '본관 1F 메인 로비',
    distance: 25,
    predictedTime: '09:36:15',
    confidence: 98,
    direction: '남동쪽',
    thumbnailUrl: '/fastsearch_img/qs_img_25_y_2.mp4',
    posterUrl: '/fastsearch_img/qs_img_25_y_2.png',
  },
  {
    id: '6',
    cctvName: 'ELEV-1F-03',
    location: '본관 1F 메인 로비',
    distance: 25,
    predictedTime: '09:36:30',
    confidence: 96,
    direction: '서쪽',
    thumbnailUrl: '/fastsearch_img/qs_img_30_y_2.mp4',
    posterUrl: '/fastsearch_img/qs_img_30_y_2.png',
  },
  {
    id: '7',
    cctvName: 'STAIR-1F-A',
    location: '본관 1F 메인 로비',
    distance: 28,
    predictedTime: '09:36:45',
    confidence: 96,
    direction: '동쪽',
    thumbnailUrl: '/fastsearch_img/qs_img_40_y_2.mp4',
    posterUrl: '/fastsearch_img/qs_img_40_y_2.png',
  },
  {
    id: '8',
    cctvName: 'PARK-EXIT-B2',
    location: '본관 1F 메인 로비',
    distance: 30,
    predictedTime: '09:37:00',
    confidence: 97,
    direction: '북쪽',
    thumbnailUrl: '/fastsearch_img/qs_img_47_y_2.mp4',
    posterUrl: '/fastsearch_img/qs_img_47_y_2.png',
  },
  {
    id: '9',
    cctvName: 'PARK-RAMP-B1',
    location: '본관 1F 메인 로비',
    distance: 32,
    predictedTime: '09:37:15',
    confidence: 96,
    direction: '남서쪽',
    thumbnailUrl: '/fastsearch_img/qs_img_51_y_2.mp4',
    posterUrl: '/fastsearch_img/qs_img_51_y_2.png',
  },
  {
    id: '10',
    cctvName: 'GATE-CARGO-W',
    location: '본관 1F 메인 로비',
    distance: 30,
    predictedTime: '09:37:30',
    confidence: 92,
    direction: '남동쪽',
    thumbnailUrl: '/fastsearch_img/qs_img_59_y_2.mp4',
    posterUrl: '/fastsearch_img/qs_img_59_y_2.png',
  },
];

/** 팝업 열리면 비디오 일시정지, poster로 대역폭 절약 */
const ListVideo: React.FC<{ src: string; posterUrl?: string; isPaused: boolean }> = ({ src, posterUrl, isPaused }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPaused) v.pause();
    else v.play().catch(() => {});
  }, [isPaused]);
  if (!src?.trim()) return <div className="absolute inset-0 bg-black" aria-hidden />;
  return (
    <video
      ref={videoRef}
      src={src}
      poster={posterUrl}
      loop
      muted
      playsInline
      preload="none"
      className="absolute top-0 left-0 w-full h-full object-cover"
    />
  );
};

const PredictedCCTVListPanel: React.FC<PredictedCCTVListPanelProps> = ({
  isVisible,
  width = 700,
  onAddCapture,
  hoveredCCTVId: externalHoveredCCTVId,
  onCCTVHover,
  onRadiusChange,
  onCCTVSelect,
  onCCTVDetailClose,
  openCCTVId,
  onCCTVOpened,
  closeCCTVPopupSignal,
  autoCapture = false,
}) => {
  const { t, i18n } = useTranslation();
  const [selectedCCTV, setSelectedCCTV] = useState<PredictedCCTVItem | null>(null);
  const sortOption = 'confidence' as const;
  const radius = 100;

  const hoveredCCTVId = externalHoveredCCTVId;

  // 영문 모드에서는 mock CCTV 카드 데이터의 한국어 명칭/주소를 짧은 영문으로 치환
  const isEN = (i18n.resolvedLanguage || i18n.language || 'ko').startsWith('en');
  const localizeCCTVName = (name: string) => isEN ? name.replace(/^별빛/, 'STAR-') : name;
  const localizeLocation = (loc: string) => {
    if (!isEN) return loc;
    // 자주 등장하는 거리명 매핑
    return loc
      .replace(/본관 1F 메인 로비/g, 'HQ / 1F Lobby')
      .replace(/본관 1F 메인 로비/g, 'HQ / 1F Lobby')
      .replace(/M16 동 3F 설계실/g, 'M16 / 3F Design Lab')
      .replace(/서측 출입 게이트/g, '29 Galaxy St');
  };
  const PREDICTED_CCTV_DATA_LOCALIZED = React.useMemo(() => {
    return PREDICTED_CCTV_DATA.map(item => ({
      ...item,
      cctvName: localizeCCTVName(item.cctvName),
      location: localizeLocation(item.location),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  React.useEffect(() => {
    if (closeCCTVPopupSignal && closeCCTVPopupSignal > 0) {
      setSelectedCCTV(null);
    }
  }, [closeCCTVPopupSignal]);

  React.useEffect(() => {
    if (!openCCTVId || !isVisible) return;
    const cctv = PREDICTED_CCTV_DATA_LOCALIZED.find(item => item.id === openCCTVId);
    if (cctv) {
      setSelectedCCTV(cctv);
      if (onCCTVOpened) onCCTVOpened();
    }
  }, [openCCTVId, isVisible, onCCTVOpened]);

  const isPopupOpen = selectedCCTV !== null;

  return (
    <>
      <div
        className={`absolute top-0 bottom-0 flex flex-col transition-all duration-500 ease-out ${
          isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
        }`}
        style={{
          left: '80px',
          width: `${width}px`,
          zIndex: 150,
          paddingTop: '16px',
          paddingBottom: '16px',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        <div className="flex flex-col gap-3 h-full" style={{ paddingTop: isVisible ? '0.5rem' : '16px', minHeight: 0 }}>
          {/* 헤더 */}
          <div
            className="rounded-lg flex-shrink-0"
            style={{
              zIndex: 2,
            }}
          >
            {/* 필터 칩들 */}
            <div className="flex items-center gap-2 flex-wrap relative">
              {/* 반경 칩 */}
              <div className="relative">
                <div
                  className="px-4 py-2 rounded-full text-xs font-medium bg-[#1a1a1a] text-gray-300 flex items-center gap-2 border border-[#31353a] select-none cursor-default"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>{t('predictedCCTV.radius', { radius })}</span>
                  <Icon icon="mdi:chevron-down" className="w-4 h-4" />
                </div>
                
              </div>

              {/* 정렬 칩 */}
              <div className="relative">
                <div
                  className="px-4 py-2 rounded-full text-xs font-medium bg-[#1a1a1a] text-gray-300 flex items-center gap-2 border border-[#31353a] select-none cursor-default"
                >
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>{t('predictedCCTV.sort', { value: sortOption === 'confidence' ? t('predictedCCTV.sortConfidence') : sortOption === 'distance' ? t('predictedCCTV.sortDistance') : t('predictedCCTV.sortTime') })}</span>
                  <Icon icon="mdi:chevron-down" className="w-4 h-4" />
                </div>
                
              </div>
            </div>
          </div>

          {/* 리스트 영역 */}
          <div
            className="rounded-lg flex-1 gradient-border-right-bottom border border-[#31353a] relative"
            style={{
              minHeight: 0,
              maxHeight: '100%',
              background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              className="flex-1 overflow-y-auto"
              style={{
                padding: '16px',
                minHeight: 0,
              }}
            >
              <div className="grid grid-cols-3 gap-3" style={{ minHeight: 'min-content' }}>
                {PREDICTED_CCTV_DATA_LOCALIZED.map((item) => (
                  <div
                    key={item.id}
                    id={item.id === '4' ? 'predicted-cctv-7' : undefined}
                    onClick={() => {
                      setSelectedCCTV(item);
                      onCCTVSelect?.();
                    }}
                    onMouseEnter={() => onCCTVHover?.(item.id)}
                    onMouseLeave={() => onCCTVHover?.(null)}
                    className={`relative bg-[#393a42] rounded-lg overflow-hidden cursor-pointer transition-all group ${
                      hoveredCCTVId === item.id ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0a0e14] scale-105' : ''
                    }`}
                  >
                    {/* 썸네일 */}
                    <div className="relative w-full bg-black overflow-hidden" style={{ paddingTop: '56.25%' }}>
                      <ListVideo src={item.thumbnailUrl} posterUrl={item.posterUrl} isPaused={isPopupOpen} />
                      
                      {/* 호버 시 주소 아래→위 슬라이드 */}
                      <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out bg-black/70 px-2 py-1">
                        <div className="text-[10px] text-gray-200 truncate" title={item.location}>
                          {item.location}
                        </div>
                      </div>
                    </div>
                    
                    {/* CCTV명 + 경로 적합도 */}
                    <div className="px-3 py-2 flex items-center justify-between gap-2">
                      <div className="text-xs text-gray-300 font-semibold truncate" title={item.cctvName}>
                        {item.cctvName}
                      </div>
                      <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-blue-500/20 text-[10px] text-blue-400 font-semibold leading-none">
                        {t('predictedCCTV.score', { score: item.confidence })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CCTV 상세 팝업 */}
      <PredictedCCTVDetailPopup
        isOpen={selectedCCTV !== null}
        onClose={() => {
          setSelectedCCTV(null);
          onCCTVDetailClose?.();
        }}
        cctv={selectedCCTV}
        onAddCapture={onAddCapture}
        autoCapture={autoCapture}
      />
    </>
  );
};

export default PredictedCCTVListPanel;
