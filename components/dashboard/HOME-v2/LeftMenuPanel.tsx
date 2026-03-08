import { Icon } from '@iconify/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LeftMenuPanelProps {
  onMenuSelect?: (menuId: 'net-monitoring' | 'fast-search' | 'object-tracking' | 'capture-list' | 'propagation' | 'broadcast') => void;
  selectedMenuId?: 'net-monitoring' | 'fast-search' | 'object-tracking' | 'capture-list' | 'propagation' | 'broadcast' | null;
  captureCount?: number; // 포착 목록 개수 (뱃지 표시용)
  showNotification?: boolean; // 포착 알림 애니메이션
}

const LeftMenuPanel = ({ onMenuSelect, selectedMenuId = null, captureCount = 0, showNotification = false }: LeftMenuPanelProps) => {
  const navigate = useNavigate();
  
  const handleMenuClick = (menuId: 'net-monitoring' | 'fast-search' | 'object-tracking' | 'capture-list' | 'propagation' | 'broadcast') => {
    onMenuSelect?.(menuId);
  };

  const menuItems = [
    {
      id: 'net-monitoring' as const,
      icon: 'mdi:radar',
      label: '투망감시',
    },
    {
      id: 'fast-search' as const,
      icon: 'mdi:magnify-scan',
      label: '고속검색',
    },
    {
      id: 'object-tracking' as const,
      icon: 'mdi:target',
      label: '객체추적',
    },
    {
      id: 'capture-list' as const,
      icon: 'mdi:camera-burst',
      label: '포착목록',
      badge: captureCount,
    },
    {
      id: 'propagation' as const,
      icon: 'mdi:send',
      label: '전파',
    },
  ];

  return (
    <div
      className="flex flex-col items-center py-6 px-3 h-full relative"
      style={{
        width: '80px',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(23,23,23,0.8) 100%)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRight: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* 포착 알림 오버레이 */}
      {showNotification && (
        <div className="absolute inset-0 bg-blue-500/20 animate-capture-menu-flash pointer-events-none" style={{ zIndex: 100 }} />
      )}
      {/* 로고 영역 */}
      <div className="mb-4 pb-4 border-b border-gray-700/50 w-full flex justify-center">
        <img
          src="/logo.svg"
          alt="CUVIA"
          className="h-8 w-auto object-contain"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
      </div>

      {/* 메뉴 아이템들 */}
      <div className="flex flex-col items-center gap-3 w-full">
        {menuItems.map((item) => {
          const isActive = selectedMenuId === item.id;
          const hasBadge = item.badge !== undefined && item.badge > 0;
          return (
            <button
              key={item.id}
              id={item.id === 'object-tracking' ? 'object-tracking-menu' : item.id === 'capture-list' ? 'capture-list-menu' : item.id === 'propagation' ? 'propagation-menu' : undefined}
              onClick={() => handleMenuClick(item.id)}
              className="flex flex-col items-center justify-center w-full group relative"
              aria-label={item.label}
              tabIndex={0}
            >
              {/* 아이콘 컨테이너 */}
              <div className="relative">
                {/* 아이콘 - 라운드 정사각형 배경 */}
                {isActive ? (
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200 relative"
                    style={{
                      background: '#000000',
                      backgroundClip: 'padding-box',
                      border: '2px solid transparent',
                      borderRadius: '1rem',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: '-2px',
                        borderRadius: '1rem',
                        padding: '2px',
                        background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%)',
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        maskComposite: 'exclude',
                        pointerEvents: 'none',
                      }}
                    />
                    <Icon
                      icon={item.icon}
                      className="w-5 h-5 transition-all duration-200 text-white"
                    />
                  </div>
                ) : (
                  <Icon
                    icon={item.icon}
                    className="w-7 h-7 transition-all duration-200 text-gray-400 group-hover:text-white"
                  />
                )}
                
                {/* 뱃지 */}
                {hasBadge && (
                  <div
                    className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold ${
                      showNotification && item.id === 'capture-list' ? 'animate-capture-badge-pop' : ''
                    }`}
                    style={{
                      boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
                    }}
                  >
                    {item.badge}
                  </div>
                )}
              </div>
              
              {/* 텍스트 - 박스 밖 */}
              <span
                className={`
                  text-[10px] font-medium mt-1.5 transition-all duration-200
                  ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}
                `}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* 디바이더 */}
      <div className="w-full px-2 my-4">
        <div className="h-px bg-gray-700/50" />
      </div>

      {/* 쿠비아 링크 */}
      <a
        href="/cuvia-link"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center justify-center w-full group"
        aria-label="CUVIA 웹사이트"
        tabIndex={0}
      >
        <svg 
          className="transition-all duration-200 text-gray-400 group-hover:text-white"
          style={{ width: '22.4px', height: '22.4px' }}
          viewBox="0 0 57.5 51.66"
          fill="currentColor"
        >
          <polygon points="19.23 23.24 29.28 5.81 41.39 5.81 49.16 19.28 55.87 19.28 44.74 0 25.93 0 15.87 17.42 19.23 23.24"/>
          <polygon points="41.39 45.85 11.56 45.85 14.92 51.66 44.74 51.66 55.87 32.38 49.16 32.38 41.39 45.85"/>
          <polygon points="43.89 36.31 12.76 36.31 3.36 20.02 0 25.83 9.41 42.12 40.54 42.12 43.89 36.31"/>
          <polygon points="22.28 33.71 12.22 16.29 21.62 0 14.92 0 5.51 16.29 15.57 33.71 22.28 33.71"/>
          <path d="M53.72,22.05c-2.08,0-3.78,1.69-3.78,3.78s1.7,3.78,3.78,3.78,3.78-1.69,3.78-3.78-1.69-3.78-3.78-3.78Z"/>
        </svg>
        <span className="text-[10px] font-medium mt-1.5 transition-all duration-200 text-gray-400 group-hover:text-white">
          CUVIA Link
        </span>
      </a>
    </div>
  );
};

export default LeftMenuPanel;
