
import React from 'react';
import { Icon } from '@iconify/react';

interface TopControlPanelProps {
  isVisible: boolean;
  isAutoMode: boolean;
  onAutoModeToggle: (enabled: boolean) => void;
}

const TopControlPanel: React.FC<TopControlPanelProps> = ({ 
  isVisible, 
  isAutoMode, 
  onAutoModeToggle 
}) => {
  if (!isVisible) return null;

  const handleToggle = () => {
    onAutoModeToggle(!isAutoMode);
  };

  return (
    <div 
      className="absolute top-0 left-0 right-0 z-[1500] transition-all duration-500 ease-in-out"
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: isVisible ? 1 : 0,
      }}
    >
      <div 
        className="gradient-border-right-bottom"
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          borderWidth: '1px',
        }}
      >
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <h3 className="text-white text-sm font-semibold">투망 감시</h3>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-gray-300 text-sm">자동모드</span>
            <button
              onClick={handleToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isAutoMode ? 'bg-blue-500' : 'bg-gray-600'
              }`}
              role="switch"
              aria-checked={isAutoMode}
              aria-label="자동모드 토글"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAutoMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            {isAutoMode && (
              <span className="text-blue-400 text-xs font-medium">ON</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopControlPanel;
