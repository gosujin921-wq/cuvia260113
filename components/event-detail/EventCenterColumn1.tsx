'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { movementTimeline } from './constants';
import { 
  getCCTVIconClassName, 
  getCCTVLabelClassName
} from '@/components/shared/styles';
import { AdditionalDataNotificationPopup } from './AdditionalDataNotificationPopup';

interface EventCenterColumn1Props {
  isRightPanelCollapsed: boolean;
  showCCTV: boolean;
  setShowCCTV: (value: boolean | ((prev: boolean) => boolean)) => void;
  showCCTVViewAngle: boolean;
  setShowCCTVViewAngle: (value: boolean | ((prev: boolean) => boolean)) => void;
  showCCTVName: boolean;
  setShowCCTVName: (value: boolean | ((prev: boolean) => boolean)) => void;
  selectedMapCCTV: string | null;
  setSelectedMapCCTV: (value: string | null) => void;
  setShowMapCCTVPopup: (value: boolean) => void;
  setShowDetectedCCTVPopup: (value: boolean) => void;
  setSelectedDetectedCCTV: (value: string | null) => void;
  setShowCombinedCCTVPopup: (value: boolean) => void;
  setSelectedCombinedCCTV: (value: string | null) => void;
  zoomLevel?: number;
  setZoomLevel?: (value: number | ((prev: number) => number)) => void;
  isTrackingPinVisible?: boolean;
  isTrackingProgress?: boolean;
  trackingProgress?: number;
  trackingPinPosition?: { left: number; top: number };
  isTrackingReselectActive?: boolean; // 재추적 버튼 활성화 상태
  additionalDataNotification?: {
    isOpen: boolean;
    time: string;
    sender: string;
    content: string;
    onClose: () => void;
    onSendToAgent: () => void;
  };
  // 프로토타입용 props
  prototypePin1Visible?: boolean;
  prototypePin2Visible?: boolean;
  prototypePin3Visible?: boolean;
  prototypeRouteVisible?: boolean;
  prototypePin1Label?: string;
  prototypePin1Pulse?: boolean;
  prototypePin1Color?: 'red' | 'yellow';
  prototypePin2Pulse?: boolean;
  prototypeShowRoute1to2?: boolean;
  prototypePin3Pulse?: boolean;
  prototypeShowRoute2to3?: boolean;
  prototypePin3Color?: 'blue' | 'red';
  prototypeShowRoute3to4?: boolean;
}

export const EventCenterColumn1: React.FC<EventCenterColumn1Props> = ({
  isRightPanelCollapsed,
  showCCTV,
  setShowCCTV,
  showCCTVViewAngle,
  setShowCCTVViewAngle,
  showCCTVName,
  setShowCCTVName,
  selectedMapCCTV,
  setSelectedMapCCTV,
  setShowMapCCTVPopup,
  setShowDetectedCCTVPopup,
  setSelectedDetectedCCTV,
  setShowCombinedCCTVPopup,
  setSelectedCombinedCCTV,
  isTrackingPinVisible = true,
  isTrackingProgress = false,
  trackingProgress = 0,
  trackingPinPosition = { left: 85, top: 45 },
  zoomLevel: propZoomLevel,
  setZoomLevel: propSetZoomLevel,
  additionalDataNotification,
  prototypePin1Visible = true,
  prototypePin2Visible = true,
  prototypePin3Visible = true,
  prototypeRouteVisible = true,
  prototypePin1Label,
  prototypePin1Pulse = false,
  prototypePin1Color = 'red',
  prototypePin2Pulse = false,
  prototypeShowRoute1to2 = false,
  prototypePin3Pulse = false,
  prototypeShowRoute2to3 = false,
  prototypePin3Color = 'blue',
  prototypeShowRoute3to4 = false,
}) => {
  // 줌 레벨 기본값 (prop이 없으면 내부 상태 사용)
  const [internalZoomLevel, setInternalZoomLevel] = React.useState(0);
  const currentZoomLevel = propZoomLevel !== undefined ? propZoomLevel : internalZoomLevel;
  const currentSetZoomLevel = propSetZoomLevel || setInternalZoomLevel;
  
  // 줌 레벨에 따른 지도 스케일 계산
  const mapScale = currentZoomLevel === 0 ? 1 : 1.5; // 확대 시 1.5배
  const mapTransformOrigin = 'center center'; // 확대 기준점
  const pinScale = mapScale; // 핀도 맵과 동일한 스케일 적용
  // CCTV 위치 정보 (맵 좌표 기준) - 같은 위치에 여러 CCTV가 있을 수 있음
  const cctvLocationGroups: Record<string, { position: { left: number; top: number }; cctvs: string[] }> = {
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

  // CCTV ID로 위치 그룹 찾기
  const getLocationGroupForCCTV = (cctvId: string) => {
    for (const [locationId, group] of Object.entries(cctvLocationGroups)) {
      if (group.cctvs.includes(cctvId)) {
        return group;
      }
    }
    return null;
  };

  // CCTV ID로 위치 그룹의 CCTV 목록 가져오기
  const getCCTVsAtSameLocation = (cctvId: string): string[] => {
    const group = getLocationGroupForCCTV(cctvId);
    return group ? group.cctvs : [cctvId];
  };

  // 타임라인에서 CCTV별 title (감지 이유) 찾기
  const getTimelineTitle = (cctvId: string) => {
    if (cctvId === '현재 위치') {
      // 현재 위치는 마지막 항목의 title 사용
      const lastEntry = movementTimeline[movementTimeline.length - 1];
      return lastEntry?.title || '';
    }
    const entry = movementTimeline.find((item) => {
      return item.cctvId === cctvId;
    });
    return entry?.title || '';
  };

  // 각 위치의 CCTV 그룹 정보
  const location1CCTVs = getCCTVsAtSameLocation('CCTV-7');
  const location2CCTVs = getCCTVsAtSameLocation('CCTV-12');
  const location3CCTVs = getCCTVsAtSameLocation('CCTV-15');
  const location4CCTVs = getCCTVsAtSameLocation('CCTV-3');
  const location5CCTVs = getCCTVsAtSameLocation('CCTV-16'); // 현재 위치

  // CCTV 클릭 핸들러 - 색상에 따라 다른 팝업 열기
  const handleCCTVClick = (cctvId: string, borderColor: string) => {
    // red (추적중) → CCTV 팝업만
    if (borderColor === 'border-red-500') {
      setSelectedMapCCTV(cctvId);
      setShowMapCCTVPopup(true);
    } else {
      // yellow 또는 blue (과거 동선) → 통합 팝업 (탭 전환)
      setSelectedCombinedCCTV(cctvId);
      setShowCombinedCCTVPopup(true);
    }
  };

  // borderColor를 CCTV 아이콘 variant로 변환
  const getCCTVVariant = (borderColor: string): 'default' | 'active' | 'tracking' | 'warning' => {
    if (borderColor === 'border-red-500') return 'tracking';
    if (borderColor === 'border-blue-500') return 'active';
    if (borderColor === 'border-yellow-500') return 'warning';
    return 'default';
  };

  // 타임라인 타이틀 색상 결정 헬퍼 함수
  const getTimelineTitleColor = (iconColor: string) => {
    if (iconColor.includes('yellow')) return '#facc15';
    if (iconColor.includes('blue')) return '#60a5fa';
    if (iconColor.includes('red')) return '#f87171';
    return '#9ca3af';
  };

  // CCTV 카메라 개수 포맷팅 헬퍼 함수
  const formatCCTVCount = (count: number): string => {
    return count > 999 ? '999+' : count.toString();
  };

  // CCTV 아이콘 박스 스타일 생성 헬퍼 함수
  const getCCTVIconBoxStyle = (count: number, pinScale: number) => {
    const hasMultiple = count > 1;
    return {
      zIndex: 110,
      position: 'relative' as const,
      transform: `scale(${pinScale})`,
      paddingLeft: hasMultiple ? '4px' : undefined,
      paddingRight: hasMultiple ? '4px' : undefined
    };
  };

  // CCTV 아이콘 렌더링 헬퍼 함수
  const renderCCTVIcons = (
    cctvIds: string[],
    basePosition: { left: number; top: number },
    borderColor: string,
    iconColor: string,
    timelineTitle: string,
    viewAngleRotation: number = 0
  ) => {
    if (currentZoomLevel === 0) {
      // 축소 모드: 클러스터 뱃지만 표시
      return (
        <div 
          className="absolute cursor-pointer" 
          style={{ left: `${basePosition.left}%`, top: `${basePosition.top}%`, transform: 'translate(-50%, -50%)', zIndex: 100 }}
          onClick={() => {
            handleCCTVClick(cctvIds[0], borderColor);
          }}
        >
          <div 
            className={`${getCCTVIconClassName(getCCTVVariant(borderColor))} flex items-center justify-center ${cctvIds.length > 1 ? 'w-auto min-w-[28px]' : ''}`} 
            style={getCCTVIconBoxStyle(cctvIds.length, pinScale)}
          >
            <Icon 
              icon="mdi:cctv" 
              className={iconColor}
              width="16px" 
              height="16px"
            />
            {/* CCTV 카메라 개수 - 축소 모드에서만 표시 */}
            {cctvIds.length > 1 && (
              <span className={`text-xs font-semibold ${iconColor} ml-1`} style={{ whiteSpace: 'nowrap' }}>
                {formatCCTVCount(cctvIds.length)}
              </span>
            )}
          </div>
          {showCCTVName && (
            <div className={`${getCCTVLabelClassName(getCCTVVariant(borderColor))} mt-1`}>
              {cctvIds[0]}
            </div>
          )}
          {/* 타임라인 타이틀 */}
          <div 
            className={`${getCCTVLabelClassName(getCCTVVariant(borderColor)).replace('text-white', '')} absolute top-full left-1/2 -translate-x-1/2 ${showCCTVName ? 'mt-8' : 'mt-1'}`} 
            style={{ 
              color: getTimelineTitleColor(iconColor)
            }}
          >
            {timelineTitle}
          </div>
          {/* 시야각 표시 */}
          {showCCTVViewAngle && (
            <div 
              className="absolute"
              style={{
                width: '120px',
                height: '120px',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) rotate(${viewAngleRotation}deg)`,
                transformOrigin: 'center center',
                pointerEvents: 'none',
                zIndex: 50,
              }}
            >
              <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', top: 0, left: 0 }}>
                <path
                  d="M 60 60 L 60 10 A 50 50 0 0 1 110 60 Z"
                  fill="rgba(59, 130, 246, 0.2)"
                  stroke="rgba(59, 130, 246, 0.6)"
                  strokeWidth="2"
                />
              </svg>
            </div>
          )}
        </div>
      );
    } else {
      // 확대 모드: 개별 CCTV 아이콘 표시
      return cctvIds.map((cctvId, index) => {
        // 개별 아이콘들을 약간씩 다른 위치에 배치 (원형으로 배치)
        const angle = (index / cctvIds.length) * 2 * Math.PI;
        const radius = cctvIds.length > 1 ? 4.5 : 0; // 퍼센트 단위, 여러 개일 때만 분산
        const offsetLeft = Math.cos(angle) * radius;
        const offsetTop = Math.sin(angle) * radius;
        
        // 각 CCTV마다 다른 시야각 회전값 적용 (0도부터 시작해서 각도별로 분산)
        const individualViewAngle = viewAngleRotation + (index * 45); // 각 CCTV마다 45도씩 회전
        
        return (
          <div
            key={cctvId}
            className="absolute cursor-pointer" 
            style={{ 
              left: `${basePosition.left + offsetLeft}%`, 
              top: `${basePosition.top + offsetTop}%`, 
              transform: 'translate(-50%, -50%)', 
              zIndex: 100 
            }}
            onClick={() => {
              handleCCTVClick(cctvId, borderColor);
            }}
          >
            <div className={getCCTVIconClassName(getCCTVVariant(borderColor))} style={getCCTVIconBoxStyle(1, pinScale)}>
              <Icon 
                icon="mdi:cctv" 
                className={iconColor}
                width="16px" 
                height="16px"
              />
            </div>
            {showCCTVName && (
              <div className={`${getCCTVLabelClassName(getCCTVVariant(borderColor))} mt-1`}>
                {cctvIds.length > 1 ? `${cctvId}-${index + 1}` : cctvId}
              </div>
            )}
            {/* 타임라인 타이틀 */}
            <div 
              className={`${getCCTVLabelClassName(getCCTVVariant(borderColor)).replace('text-white', '')} absolute top-full left-1/2 -translate-x-1/2 ${showCCTVName ? 'mt-8' : 'mt-1'}`} 
              style={{ 
                color: getTimelineTitleColor(iconColor)
              }}
            >
              {timelineTitle}
            </div>
            {/* 시야각 표시 */}
            {showCCTVViewAngle && (
              <div 
                className="absolute"
                style={{
                  width: '120px',
                  height: '120px',
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) rotate(${individualViewAngle}deg)`,
                  transformOrigin: 'center center',
                  pointerEvents: 'none',
                  zIndex: 50,
                }}
              >
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', top: 0, left: 0 }}>
                  <path
                    d="M 60 60 L 60 10 A 50 50 0 0 1 110 60 Z"
                    fill="rgba(59, 130, 246, 0.2)"
                    stroke="rgba(59, 130, 246, 0.6)"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            )}
          </div>
        );
      });
    }
  };

  return (
    <div className="flex flex-col pr-4 flex-shrink-0" style={{ width: isRightPanelCollapsed ? '50%' : '55%', minHeight: 0, height: '100%' }}>
      {/* 지도 컨테이너 wrapper */}
      <div className="relative overflow-hidden" style={{ height: '100%' }}>
        {/* 줌 컨트롤 버튼 - 지도 확대와 무관하게 고정 위치 */}
        <div 
          className="absolute top-4 left-4 flex flex-col gap-2" 
          style={{ zIndex: 250 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              currentSetZoomLevel((prev: number) => Math.min(prev + 1, 1));
            }}
            disabled={currentZoomLevel >= 1}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border border-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderWidth: '1px' }}
            aria-label="확대"
          >
            <Icon icon="mdi:plus" className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              currentSetZoomLevel((prev: number) => Math.max(prev - 1, 0));
            }}
            disabled={currentZoomLevel <= 0}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border border-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderWidth: '1px' }}
            aria-label="축소"
          >
            <Icon icon="mdi:minus" className="w-5 h-5" />
          </button>
        </div>

        {/* CCTV 토글 버튼 - +/- 버튼 아래에 그룹핑 */}
        <div 
          className="absolute top-4 left-4 flex flex-col gap-2" 
          style={{ zIndex: 250, marginTop: '100px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              const newShowCCTV = !showCCTV;
              setShowCCTV(newShowCCTV);
              // CCTV 토글을 켜면 라벨과 화각도 함께 켜짐
              if (newShowCCTV) {
                setShowCCTVViewAngle(true);
                setShowCCTVName(true);
              } else {
                // CCTV 토글을 끄면 라벨과 화각도 함께 꺼짐
                setShowCCTVViewAngle(false);
                setShowCCTVName(false);
              }
            }}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              showCCTV 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border border-[#2a2a2a]'
            }`}
            style={{ borderWidth: '1px' }}
            aria-label="CCTV"
          >
            <Icon icon="mdi:cctv" className="w-5 h-5" />
          </button>
          
          {/* CCTV 서브 토글 버튼들 - CCTV 온오프와 상관없이 항상 표시 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCCTVViewAngle(prev => !prev);
            }}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              showCCTVViewAngle 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border border-[#2a2a2a]'
            }`}
            style={{ borderWidth: '1px' }}
            aria-label="시야각 켜기"
          >
            <Icon icon="mdi:angle-acute" className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCCTVName(prev => !prev);
            }}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              showCCTVName 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border border-[#2a2a2a]'
            }`}
            style={{ borderWidth: '1px' }}
            aria-label="CCTV 명 켜기"
          >
            <Icon icon="mdi:label" className="w-5 h-5" />
          </button>
        </div>

        {/* 지도 - 박스 밖으로 */}
        {/* TODO: 지도 이미지 200% 확대 - 나중에 제거 필요 */}
        <div
          className="relative border border-[#31353a] bg-cover bg-center bg-no-repeat transition-transform duration-300"
          style={{
            borderWidth: '1px',
            backgroundImage: 'url(/map_anyang.png)',
            backgroundSize: '500%', // TODO: 지도 이미지 500% 확대 - 나중에 제거 필요 (원래: 'cover')
            height: '100%',
            width: '100%',
            transform: `scale(${mapScale})`,
            transformOrigin: mapTransformOrigin,
          }}
        >


        {/* 가상 CCTV 아이콘들 - 그레이 컬러 */}
        {showCCTV && [
          { left: 10, top: 20, count: 1, viewAngle: 45 },
          { left: 25, top: 15, count: 3, viewAngle: 90 },
          { left: 35, top: 30, count: 1, viewAngle: 135 },
          { left: 55, top: 25, count: 2, viewAngle: 180 },
          { left: 70, top: 20, count: 1, viewAngle: 225 },
          { left: 85, top: 30, count: 4, viewAngle: 270 },
          { left: 20, top: 50, count: 2, viewAngle: 45 },
          { left: 40, top: 55, count: 1, viewAngle: 90 },
          { left: 60, top: 50, count: 3, viewAngle: 135 },
          { left: 80, top: 55, count: 1, viewAngle: 180 },
          { left: 15, top: 75, count: 2, viewAngle: 225 },
          { left: 30, top: 70, count: 1, viewAngle: 270 },
          { left: 50, top: 75, count: 5, viewAngle: 45 },
          { left: 70, top: 70, count: 2, viewAngle: 90 },
          { left: 90, top: 75, count: 1, viewAngle: 135 },
          { left: 10, top: 90, count: 1, viewAngle: 180 },
          { left: 25, top: 95, count: 3, viewAngle: 225 },
          { left: 45, top: 90, count: 2, viewAngle: 270 },
          { left: 65, top: 95, count: 1, viewAngle: 45 },
          { left: 85, top: 90, count: 4, viewAngle: 90 },
        ].map((item, index) => {
          const cctvName = `CCTV-V-${index + 1}`;
          if (currentZoomLevel === 0) {
            // 축소 모드: 클러스터 뱃지만 표시
            return (
              <div
                key={`virtual-cctv-${index}`}
                className="absolute cursor-pointer"
                style={{ 
                  left: `${item.left}%`, 
                  top: `${item.top}%`, 
                  transform: 'translate(-50%, -50%)', 
                  zIndex: 50 
                }}
                onClick={() => {
                  // 나중에 모달 띄울 예정
                }}
              >
                <div 
                  className={`${getCCTVIconClassName('default')} flex items-center justify-center ${item.count > 1 ? 'w-auto min-w-[28px]' : ''}`} 
                  style={{ ...getCCTVIconBoxStyle(item.count, pinScale), zIndex: 60 }}
                >
                  <Icon 
                    icon="mdi:cctv" 
                    className="text-gray-400"
                    width="16px" 
                    height="16px"
                  />
                  {/* CCTV 카메라 개수 - 축소 모드에서만 표시 */}
                  {item.count > 1 && (
                    <span className="text-xs font-semibold text-gray-400 ml-1" style={{ whiteSpace: 'nowrap' }}>
                      {formatCCTVCount(item.count)}
                    </span>
                  )}
                </div>
                {/* CCTV 이름 라벨 */}
                {showCCTVName && (
                  <div className={`${getCCTVLabelClassName('default')} mt-1`}>
                    {cctvName}
                  </div>
                )}
                {/* 시야각 표시 */}
                {showCCTVViewAngle && (
                  <div 
                    className="absolute"
                    style={{
                      width: '120px',
                      height: '120px',
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, -50%) rotate(${item.viewAngle}deg)`,
                      transformOrigin: 'center center',
                      pointerEvents: 'none',
                      zIndex: 30,
                    }}
                  >
                    <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', top: 0, left: 0 }}>
                      <path
                        d="M 60 60 L 60 10 A 50 50 0 0 1 110 60 Z"
                        fill="rgba(156, 163, 175, 0.2)"
                        stroke="rgba(156, 163, 175, 0.6)"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                )}
              </div>
            );
          } else {
            // 확대 모드: 개별 CCTV 아이콘 표시
            return Array.from({ length: item.count }, (_, i) => {
              const angle = (i / item.count) * 2 * Math.PI;
              const radius = item.count > 1 ? 4.5 : 0; // 퍼센트 단위, 여러 개일 때만 분산
              const offsetLeft = Math.cos(angle) * radius;
              const offsetTop = Math.sin(angle) * radius;
              
              // 각 CCTV마다 다른 시야각 회전값 적용
              const individualViewAngle = item.viewAngle + (i * 45); // 각 CCTV마다 45도씩 회전
              
              return (
                  <div
                    key={`virtual-cctv-${index}-${i}`}
                    className="absolute cursor-pointer"
                    style={{ 
                      left: `${item.left + offsetLeft}%`, 
                      top: `${item.top + offsetTop}%`, 
                      transform: 'translate(-50%, -50%)', 
                      zIndex: 50 
                    }}
                    onClick={() => {
                      // 나중에 모달 띄울 예정
                    }}
                  >
                    <div className={getCCTVIconClassName('default')} style={{ ...getCCTVIconBoxStyle(1, pinScale), zIndex: 60 }}>
                      <Icon 
                        icon="mdi:cctv" 
                        className="text-gray-400"
                        width="16px" 
                        height="16px"
                      />
                  </div>
                  {/* CCTV 이름 라벨 */}
                  {showCCTVName && (
                    <div className={`${getCCTVLabelClassName('default')} mt-1`}>
                      CCTV-V-{index + 1}-{i + 1}
                    </div>
                  )}
                  {/* 시야각 표시 */}
                  {showCCTVViewAngle && (
                    <div 
                      className="absolute"
                      style={{
                        width: '120px',
                        height: '120px',
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) rotate(${individualViewAngle}deg)`,
                        transformOrigin: 'center center',
                        pointerEvents: 'none',
                        zIndex: 30,
                      }}
                    >
                      <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', top: 0, left: 0 }}>
                        <path
                          d="M 60 60 L 60 10 A 50 50 0 0 1 110 60 Z"
                          fill="rgba(156, 163, 175, 0.2)"
                          stroke="rgba(156, 163, 175, 0.6)"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              );
            });
          }
        })}

        {/* 지도 이미지 위에 SVG 오버레이 - 동선은 항상 표시 */}
        {/* 프로그레스바가 표시될 때는 동선 숨김 (추적 핀과 동일하게) */}
        {!isTrackingProgress && (prototypeRouteVisible || prototypeShowRoute1to2) && (
          <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full" preserveAspectRatio="none" style={{ visibility: (prototypeRouteVisible || prototypeShowRoute1to2) ? 'visible' : 'hidden' }}>
            {/* 전체 동선 경로 - 타임라인 순서대로: CCTV-7 (노란색) → CCTV-15 → CCTV-12 → 현재 위치 (빨간색) */}
            {prototypeRouteVisible && (
              <polyline 
                points={`30,160 140,130 80,120 ${trackingPinPosition.left * 2},${trackingPinPosition.top * 2}`}
                fill="none" 
                stroke="#5390ff" 
                strokeWidth="0.5" 
                strokeDasharray="2 2"
                className="animate-dash"
              />
            )}
            {/* 핀1과 핀2 사이 동선 (프로토타입) */}
            {prototypeShowRoute1to2 && (
              <polyline 
                points="30,160 140,130"
                fill="none" 
                stroke="#5390ff" 
                strokeWidth="0.5" 
                strokeDasharray="2 2"
                className="animate-dash"
              />
            )}
            {/* 핀2와 핀3 사이 동선 (프로토타입) */}
            {prototypeShowRoute2to3 && (
              <polyline 
                points="140,130 80,120"
                fill="none" 
                stroke="#5390ff" 
                strokeWidth="0.5" 
                strokeDasharray="2 2"
                className="animate-dash"
              />
            )}
            {/* 핀3과 핀4 사이 동선 (프로토타입) */}
            {prototypeShowRoute3to4 && (
              <polyline 
                points={`80,120 ${trackingPinPosition.left * 2},${trackingPinPosition.top * 2}`}
                fill="none" 
                stroke="#5390ff" 
                strokeWidth="0.5" 
                strokeDasharray="2 2"
                className="animate-dash"
              />
            )}
          </svg>
        )}

        {/* CCTV 아이콘들로 핀 대체 - 컬러 CCTV는 항상 표시 */}
        {/* 타임라인 순서: CCTV-7 (노란색) → CCTV-15 → CCTV-12 → 현재 위치 (빨간색) */}
        {/* 1. CCTV-7 (추적동선 - 빨간색) - 신고지역 */}
        {prototypePin1Visible && (
          <div 
            className="absolute flex items-center justify-center" 
            style={{ left: '15%', top: '80%', transform: 'translate(-50%, -50%)', zIndex: 120 }}
          >
            {/* 고정된 대쉬 스트로크 원 (제일 큰 원, 애니메이션 없음) - 추적 범위 표시 */}
            {prototypePin1Pulse && (
              <div className="absolute" style={{ width: '176px', height: '176px', zIndex: 75, left: '50%', top: '50%', transform: 'translate(-50%, -50%)', visibility: prototypePin1Pulse ? 'visible' : 'hidden' }}>
                <svg width="176" height="176" viewBox="0 0 176 176" style={{ position: 'absolute', top: 0, left: 0 }}>
                  <circle
                    cx="88"
                    cy="88"
                    r="88"
                    fill="none"
                    stroke="rgba(59, 130, 246, 0.6)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                </svg>
                {/* 범위 라벨 */}
                <div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', marginTop: '100px', zIndex: 76 }}>
                  <span className="text-blue-400 text-xs font-semibold whitespace-nowrap">추적 범위 : 500m</span>
                </div>
              </div>
            )}
            {/* 펄스 애니메이션 원들 (blue 컬러) */}
            {prototypePin1Pulse && (
              <>
                <div className="absolute animate-circle-pulse" style={{ width: '80px', height: '80px', zIndex: 80, animationDelay: '0s' }}>
                  <div className="w-full h-full rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.5)' }}></div>
                </div>
                <div className="absolute animate-circle-pulse" style={{ width: '80px', height: '80px', zIndex: 79, animationDelay: '0.3s' }}>
                  <div className="w-full h-full rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.4)' }}></div>
                </div>
                <div className="absolute animate-circle-pulse" style={{ width: '80px', height: '80px', zIndex: 78, animationDelay: '0.6s' }}>
                  <div className="w-full h-full rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.3)' }}></div>
                </div>
              </>
            )}
            {/* CCTV 아이콘 */}
            <div style={{ zIndex: 130, position: 'relative' }}>
              {renderCCTVIcons(
                location1CCTVs,
                { left: 15, top: 80 },
                prototypePin1Color === 'yellow' ? 'border-yellow-500' : 'border-red-500',
                prototypePin1Color === 'yellow' ? 'text-yellow-400' : 'text-red-400',
                prototypePin1Label || getTimelineTitle('CCTV-7'),
                45
              )}
            </div>
          </div>
        )}
        
        {/* 2. CCTV-15 - 용의자가 차량에 아이 태우는 장면 포착 (과거 동선) */}
        {prototypePin2Visible && (
          <div 
            className="absolute flex items-center justify-center" 
            style={{ left: '70%', top: '65%', transform: 'translate(-50%, -50%)', zIndex: 120, visibility: prototypePin2Visible ? 'visible' : 'hidden' }}
          >
            {/* 고정된 대쉬 스트로크 원 (제일 큰 원, 애니메이션 없음) - 추적 범위 표시 */}
            {prototypePin2Pulse && (
              <div className="absolute" style={{ width: '176px', height: '176px', zIndex: 75, left: '50%', top: '50%', transform: 'translate(-50%, -50%)', visibility: prototypePin2Pulse ? 'visible' : 'hidden' }}>
                <svg width="176" height="176" viewBox="0 0 176 176" style={{ position: 'absolute', top: 0, left: 0 }}>
                  <circle
                    cx="88"
                    cy="88"
                    r="88"
                    fill="none"
                    stroke="rgba(59, 130, 246, 0.6)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                </svg>
                {/* 범위 라벨 */}
                <div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', marginTop: '100px', zIndex: 76 }}>
                  <span className="text-blue-400 text-xs font-semibold whitespace-nowrap">추적 범위 : 500m</span>
                </div>
              </div>
            )}
            {/* 펄스 애니메이션 원들 (blue 컬러) */}
            {prototypePin2Pulse && (
              <>
                <div className="absolute animate-circle-pulse" style={{ width: '80px', height: '80px', zIndex: 80, animationDelay: '0s' }}>
                  <div className="w-full h-full rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.5)' }}></div>
                </div>
                <div className="absolute animate-circle-pulse" style={{ width: '80px', height: '80px', zIndex: 79, animationDelay: '0.3s' }}>
                  <div className="w-full h-full rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.4)' }}></div>
                </div>
                <div className="absolute animate-circle-pulse" style={{ width: '80px', height: '80px', zIndex: 78, animationDelay: '0.6s' }}>
                  <div className="w-full h-full rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.3)' }}></div>
                </div>
              </>
            )}
            {/* CCTV 아이콘 */}
            <div style={{ zIndex: 130, position: 'relative' }}>
              {renderCCTVIcons(
                location3CCTVs,
                { left: 70, top: 65 },
                'border-blue-500',
                'text-blue-400',
                getTimelineTitle('CCTV-15'),
                135
              )}
            </div>
          </div>
        )}
        
        {/* 3. CCTV-12 - 차량 도주 추적 중 */}
        {prototypePin3Visible && (
          <div 
            className="absolute flex items-center justify-center" 
            style={{ left: '40%', top: '60%', transform: 'translate(-50%, -50%)', zIndex: 120, visibility: prototypePin3Visible ? 'visible' : 'hidden' }}
          >
            {/* 고정된 대쉬 스트로크 원 (제일 큰 원, 애니메이션 없음) - 추적 범위 표시 (1.5배) */}
            {prototypePin3Pulse && (
              <div className="absolute" style={{ width: '264px', height: '264px', zIndex: 75, left: '50%', top: '50%', transform: 'translate(-50%, -50%)', visibility: prototypePin3Pulse ? 'visible' : 'hidden' }}>
                <svg width="264" height="264" viewBox="0 0 264 264" style={{ position: 'absolute', top: 0, left: 0 }}>
                  <circle
                    cx="132"
                    cy="132"
                    r="132"
                    fill="none"
                    stroke="rgba(59, 130, 246, 0.6)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                </svg>
                {/* 범위 라벨 */}
                <div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', marginTop: '150px', zIndex: 76 }}>
                  <span className="text-blue-400 text-xs font-semibold whitespace-nowrap">추적 범위 : 1,000m</span>
                </div>
              </div>
            )}
            {/* 펄스 애니메이션 원들 (1.5배 크기) */}
            {prototypePin3Pulse && (
              <>
                <div className="absolute animate-circle-pulse" style={{ width: '120px', height: '120px', zIndex: 80, animationDelay: '0s' }}>
                  <div className="w-full h-full rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.5)' }}></div>
                </div>
                <div className="absolute animate-circle-pulse" style={{ width: '120px', height: '120px', zIndex: 79, animationDelay: '0.3s' }}>
                  <div className="w-full h-full rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.4)' }}></div>
                </div>
                <div className="absolute animate-circle-pulse" style={{ width: '120px', height: '120px', zIndex: 78, animationDelay: '0.6s' }}>
                  <div className="w-full h-full rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.3)' }}></div>
                </div>
              </>
            )}
            {/* CCTV 아이콘 */}
            <div style={{ zIndex: 130, position: 'relative' }}>
              {renderCCTVIcons(
                location2CCTVs,
                { left: 40, top: 60 },
                prototypePin3Color === 'red' ? 'border-red-500' : 'border-blue-500',
                prototypePin3Color === 'red' ? 'text-red-400' : 'text-blue-400',
                getTimelineTitle('CCTV-12'),
                90
              )}
            </div>
          </div>
        )}
        
        {/* 현재 위치 CCTV - 모든 요소를 하나의 컨테이너에 중앙 정렬 */}
        {isTrackingPinVisible && (
          <div 
            className="absolute flex items-center justify-center" 
            style={{ left: `${trackingPinPosition.left}%`, top: `${trackingPinPosition.top}%`, transform: 'translate(-50%, -50%)', zIndex: 120 }}
          >
            {/* 고정된 대쉬 스트로크 원 (제일 큰 원, 애니메이션 없음) - 추적 범위 표시 */}
            <div className="absolute" style={{ width: '176px', height: '176px', zIndex: 75, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
              <svg width="176" height="176" viewBox="0 0 176 176" style={{ position: 'absolute', top: 0, left: 0 }}>
                <circle
                  cx="88"
                  cy="88"
                  r="88"
                  fill="none"
                  stroke="rgba(59, 130, 246, 0.6)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              </svg>
              {/* 범위 라벨 */}
              <div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', marginTop: '100px', zIndex: 76 }}>
                <span className="text-blue-400 text-xs font-semibold whitespace-nowrap">추적 범위 : 500m</span>
              </div>
            </div>
            {/* 펄스 애니메이션 원들 (blue 컬러) */}
            <div className="absolute animate-circle-pulse" style={{ width: '80px', height: '80px', zIndex: 80, animationDelay: '0s' }}>
              <div className="w-full h-full rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.5)' }}></div>
            </div>
            <div className="absolute animate-circle-pulse" style={{ width: '80px', height: '80px', zIndex: 79, animationDelay: '0.3s' }}>
              <div className="w-full h-full rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.4)' }}></div>
            </div>
            <div className="absolute animate-circle-pulse" style={{ width: '80px', height: '80px', zIndex: 78, animationDelay: '0.6s' }}>
              <div className="w-full h-full rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.3)' }}></div>
            </div>
            {/* CCTV 아이콘들 */}
            {currentZoomLevel === 0 ? (
              // 축소 모드: 클러스터 뱃지만 표시
              <div 
                className="absolute cursor-pointer" 
                style={{ zIndex: 130 }}
                onClick={() => {
                  handleCCTVClick(location5CCTVs[0] || 'CCTV-16', 'border-red-500');
                }}
              >
                <div 
                  className={`${getCCTVIconClassName('tracking')} flex items-center justify-center ${location5CCTVs.length > 1 ? 'w-auto min-w-[28px]' : ''}`} 
                  style={getCCTVIconBoxStyle(location5CCTVs.length, pinScale)}
                >
                  <Icon 
                    icon="mdi:cctv" 
                    className="text-red-400" 
                    width="16px" 
                    height="16px"
                  />
                  {/* CCTV 카메라 개수 - 축소 모드에서만 표시 */}
                  {location5CCTVs.length > 1 && (
                    <span className="text-xs font-semibold text-red-400 ml-1" style={{ whiteSpace: 'nowrap' }}>
                      {formatCCTVCount(location5CCTVs.length)}
                    </span>
                  )}
                </div>
                {showCCTVName && (
                  <div className={`${getCCTVLabelClassName('tracking')} mt-1`} style={{ zIndex: 140 }}>
                    현재 위치
                  </div>
                )}
                {/* 타임라인 타이틀 */}
                <div 
                  className={`${getCCTVLabelClassName('tracking').replace('text-white', '')} absolute top-full left-1/2 -translate-x-1/2 ${showCCTVName ? 'mt-8' : 'mt-1'}`} 
                  style={{ 
                    zIndex: 140,
                    color: '#f87171'
                  }}
                >
                  {getTimelineTitle('현재 위치')}
                </div>
              </div>
            ) : (
              // 확대 모드: 개별 CCTV 아이콘 표시
              location5CCTVs.map((cctvId, index) => {
                const angle = (index / location5CCTVs.length) * 2 * Math.PI;
                const radius = location5CCTVs.length > 1 ? 4.5 : 0; // 퍼센트 단위, 여러 개일 때만 분산
                const offsetLeft = Math.cos(angle) * radius;
                const offsetTop = Math.sin(angle) * radius;
                
                // 각 CCTV마다 다른 시야각 회전값 적용
                const individualViewAngle = 0 + (index * 45); // 각 CCTV마다 45도씩 회전
                
                return (
                  <div
                    key={cctvId}
                    className="absolute cursor-pointer" 
                    style={{ 
                      left: `${offsetLeft * 10}px`, 
                      top: `${offsetTop * 10}px`, 
                      transform: 'translate(-50%, -50%)', 
                      zIndex: 130 
                    }}
                    onClick={() => {
                      handleCCTVClick(cctvId, 'border-red-500');
                    }}
                  >
                    <div className={getCCTVIconClassName('tracking')} style={getCCTVIconBoxStyle(1, pinScale)}>
                      <Icon 
                        icon="mdi:cctv" 
                        className="text-red-400" 
                        width="16px" 
                        height="16px"
                      />
                    </div>
                    {showCCTVName && (
                      <div className={`${getCCTVLabelClassName('tracking')} absolute top-full left-1/2 -translate-x-1/2 mt-1`}>
                        {location5CCTVs.length > 1 ? `${cctvId}-${index + 1}` : cctvId}
                      </div>
                    )}
                    {/* 타임라인 타이틀 */}
                    <div 
                      className={`${getCCTVLabelClassName('tracking').replace('text-white', '')} absolute top-full left-1/2 -translate-x-1/2 ${showCCTVName ? 'mt-8' : 'mt-1'}`} 
                      style={{ 
                        color: '#f87171'
                      }}
                    >
                      {getTimelineTitle('현재 위치')}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        </div>

        {/* 프로그레스바 오버레이 */}
        {isTrackingProgress && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[200]">
            <div className="bg-[#1a1a1a] border border-[#31353a] rounded-lg p-6 min-w-[400px]">
              <div className="text-white text-sm font-semibold mb-4 text-center">AI가 추적대상을 재 분석 중입니다...</div>
              <div className="w-full h-2 bg-[#0f0f0f] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-50 ease-linear"
                  style={{ width: `${trackingProgress}%` }}
                ></div>
              </div>
              <div className="text-gray-400 text-xs mt-2 text-center">{Math.round(trackingProgress)}%</div>
            </div>
          </div>
        )}

        {/* 추가 자료 알림 팝업 - 맵 우측 하단 */}
        {additionalDataNotification && (
          <AdditionalDataNotificationPopup
            isOpen={additionalDataNotification.isOpen}
            time={additionalDataNotification.time}
            sender={additionalDataNotification.sender}
            content={additionalDataNotification.content}
            onClose={additionalDataNotification.onClose}
            onSendToAgent={additionalDataNotification.onSendToAgent}
          />
        )}

        {/* 카메라 범례 - 맵 우측 하단 */}
        <div 
          className="absolute bottom-4 right-4 bg-[#1a1a1a] border border-[#31353a] rounded-lg p-4 space-y-2"
          style={{ zIndex: 250, borderWidth: '1px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 border-2 border-yellow-500 rounded flex items-center justify-center" style={{ width: '20px', height: '20px' }}>
                <Icon icon="mdi:cctv" className="text-yellow-400" style={{ width: '14px', height: '14px' }} />
              </div>
              <span className="text-gray-300" style={{ fontSize: '14.4px' }}>초기 포착</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 border-2 border-blue-500 rounded flex items-center justify-center" style={{ width: '20px', height: '20px' }}>
                <Icon icon="mdi:cctv" className="text-blue-400" style={{ width: '14px', height: '14px' }} />
              </div>
              <span className="text-gray-300" style={{ fontSize: '14.4px' }}>과거 동선</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 border-2 border-red-500 rounded flex items-center justify-center" style={{ width: '20px', height: '20px' }}>
                <Icon icon="mdi:cctv" className="text-red-400" style={{ width: '14px', height: '14px' }} />
              </div>
              <span className="text-gray-300" style={{ fontSize: '14.4px' }}>추적 동선</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 border-2 border-gray-500 rounded flex items-center justify-center" style={{ width: '20px', height: '20px' }}>
                <Icon icon="mdi:cctv" className="text-gray-400" style={{ width: '14px', height: '14px' }} />
              </div>
              <span className="text-gray-300" style={{ fontSize: '14.4px' }}>일반 CCTV</span>
            </div>
            {/* 추적 범위 범례 */}
            <div className="flex items-center gap-2.5 pt-2 border-t border-[#31353a]">
              <div className="flex items-center justify-center relative" style={{ width: '20px', height: '20px' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" style={{ position: 'absolute' }}>
                  <circle
                    cx="10"
                    cy="10"
                    r="9"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="1.8"
                    strokeDasharray="2.4 2.4"
                  />
                  {/* 대시 안에 여백을 둔 하늘색 원 */}
                  <circle
                    cx="10"
                    cy="10"
                    r="5.5"
                    fill="#60A5FA"
                  />
                </svg>
              </div>
              <span className="text-gray-300" style={{ fontSize: '14.4px' }}>추적 범위</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

