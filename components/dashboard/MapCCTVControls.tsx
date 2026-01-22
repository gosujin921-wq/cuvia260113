import { Icon } from '@iconify/react';
import CCTVIcon from '@/components/common/CCTVIcon';
import { MapViewState, MapViewHandlers } from './MapView';

interface MapCCTVControlsProps {
  mapViewState: MapViewState;
  mapViewHandlers: MapViewHandlers;
  hideControls: boolean;
}

/**
 * 맵 컨트롤 및 CCTV 컨트롤 버튼 컴포넌트
 * 
 * 맵 확대/축소, 2D/3D 모드 전환, 회전 버튼과
 * CCTV 토글, CCTV 이름 표시, CCTV 화각 표시 버튼을 포함합니다.
 */
const MapCCTVControls = ({ mapViewState, mapViewHandlers, hideControls }: MapCCTVControlsProps) => {
  const handleCCTVToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = !mapViewState.showCCTV;
    mapViewHandlers.setShowCCTV(newValue);
    if (newValue) {
      mapViewHandlers.setShowCCTVViewAngle(() => true);
      mapViewHandlers.setShowCCTVName(() => true);
    } else {
      mapViewHandlers.setShowCCTVViewAngle(() => false);
      mapViewHandlers.setShowCCTVName(() => false);
    }
  };

  return (
    <>
      {/* 맵 컨트롤 버튼들 - 우측 상단 */}
      <div 
        className="absolute top-4 left-4 flex flex-col gap-2 transition-all duration-500 ease-in-out" 
        style={{ 
          zIndex: 250,
          transform: hideControls ? 'translateX(-200px)' : 'translateX(0)',
          opacity: hideControls ? 0 : 1,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            mapViewHandlers.setZoomLevel(prev => Math.min(prev + 1, 1));
          }}
          disabled={mapViewState.zoomLevel >= 1}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          aria-label="확대"
        >
          <Icon icon="mdi:plus" className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            mapViewHandlers.setZoomLevel(prev => Math.max(prev - 1, 0));
          }}
          disabled={mapViewState.zoomLevel <= 0}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          aria-label="축소"
        >
          <Icon icon="mdi:minus" className="w-5 h-5" />
        </button>
        <div className="w-full h-px bg-gray-300 my-1" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            mapViewHandlers.setIs3DMode(false);
          }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
            !mapViewState.is3DMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
              : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm'
          }`}
          aria-label="2D"
        >
          <Icon icon="mdi:view-dashboard" className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            mapViewHandlers.setIs3DMode(true);
          }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
            mapViewState.is3DMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
              : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm'
          }`}
          aria-label="3D"
        >
          <Icon icon="mdi:cube" className="w-5 h-5" />
        </button>
        {mapViewState.is3DMode && (
          <>
            <div className="w-full h-px bg-gray-300 my-1" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                mapViewHandlers.setMapBearing(prev => prev - 15);
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"
              aria-label="회전 왼쪽"
            >
              <Icon icon="mdi:rotate-left" className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                mapViewHandlers.setMapBearing(prev => prev + 15);
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"
              aria-label="회전 오른쪽"
            >
              <Icon icon="mdi:rotate-right" className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* CCTV 컨트롤 버튼들 - 좌측 중앙 */}
      <div 
        className="absolute left-4 top-1/2 flex flex-col gap-2 transition-all duration-500 ease-in-out" 
        style={{ 
          zIndex: 250,
          transform: hideControls ? 'translateX(-200px) translateY(-50%)' : 'translateX(0) translateY(-50%)',
          opacity: hideControls ? 0 : 1,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {mapViewState.showCCTV && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              mapViewHandlers.setShowCCTVName(prev => !prev);
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              mapViewState.showCCTVName 
                ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-[0_0_15px_rgba(251,146,60,0.5)]' 
                : 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border border-blue-500/30 hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]'
            }`}
            style={{ borderWidth: '1px' }}
            aria-label="CCTV 명 켜기"
          >
            <Icon icon="mdi:label" className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={handleCCTVToggle}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
            mapViewState.showCCTV 
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.6),0_0_40px_rgba(59,130,246,0.3)] ring-2 ring-blue-500/30' 
              : 'bg-gradient-to-br from-[#2a2a2a] via-[#1a1a1a] to-[#0f0f0f] hover:from-[#3a3a3a] hover:via-[#2a2a2a] hover:to-[#1a1a1a] text-gray-300 border-2 border-blue-500/40 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.5),0_0_40px_rgba(59,130,246,0.2)]'
          }`}
          style={{ borderWidth: '1px' }}
          aria-label="CCTV"
        >
          <CCTVIcon className={`w-5 h-5 text-white ${mapViewState.showCCTV ? 'drop-shadow-lg' : ''}`} />
        </button>
        {mapViewState.showCCTV && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              mapViewHandlers.setShowCCTVViewAngle(prev => !prev);
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              mapViewState.showCCTVViewAngle 
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]' 
                : 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border border-blue-500/30 hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]'
            }`}
            style={{ borderWidth: '1px' }}
            aria-label="시야각 켜기"
          >
            <Icon icon="mdi:angle-acute" className="w-5 h-5" />
          </button>
        )}
      </div>
    </>
  );
};

export default MapCCTVControls;
