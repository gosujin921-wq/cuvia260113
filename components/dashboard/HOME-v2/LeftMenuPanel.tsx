import { Icon } from '@iconify/react';
import { useState } from 'react';

interface LeftMenuPanelProps {
  onMenuSelect?: (menuId: 'fast-search' | 'object-tracking' | 'broadcast') => void;
  selectedMenuId?: 'fast-search' | 'object-tracking' | 'broadcast' | null;
}

const LeftMenuPanel = ({ onMenuSelect, selectedMenuId = null }: LeftMenuPanelProps) => {
  const handleMenuClick = (menuId: 'fast-search' | 'object-tracking' | 'broadcast') => {
    onMenuSelect?.(menuId);
  };

  const menuItems = [
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
      id: 'broadcast' as const,
      icon: 'mdi:broadcast',
      label: '전파',
    },
  ];

  return (
    <div
      className="flex flex-col items-center py-6 px-3 h-full"
      style={{
        width: '80px',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(23,23,23,0.8) 100%)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRight: '1px solid rgba(255,255,255,0.1)',
      }}
    >
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
          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className="flex flex-col items-center justify-center w-full group"
              aria-label={item.label}
              tabIndex={0}
            >
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
    </div>
  );
};

export default LeftMenuPanel;
