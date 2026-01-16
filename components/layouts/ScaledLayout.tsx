

import { ReactNode } from 'react';

interface ScaledLayoutProps {
  children: ReactNode;
  noScale?: boolean;
}

/**
 * 공통 스케일 레이아웃 컴포넌트
 * 모든 페이지에 0.85배 스케일과 브라우저 해상도에 맞는 높이 조정을 적용
 * noScale이 true이면 scale을 적용하지 않음
 */
export const ScaledLayout = ({ children, noScale = false }: ScaledLayoutProps) => {
  if (noScale) {
    return (
      <div 
        className="flex flex-col bg-[#161719] overflow-hidden relative"
        style={{
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <div className="flex flex-col w-full h-full">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col bg-[#161719] overflow-hidden relative"
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <div 
        className="flex flex-col"
        style={{
          width: '117.65%',
          height: '117.65vh',
          minHeight: '117.65vh',
          transform: 'scale(0.85)',
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  );
};

