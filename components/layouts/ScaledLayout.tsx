'use client';

import { ReactNode } from 'react';

interface ScaledLayoutProps {
  children: ReactNode;
}

/**
 * 공통 스케일 레이아웃 컴포넌트
 * 모든 페이지에 0.8배 스케일과 브라우저 해상도에 맞는 높이 조정을 적용
 */
export const ScaledLayout = ({ children }: ScaledLayoutProps) => {
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
          width: '125%',
          height: '125vh',
          minHeight: '125vh',
          transform: 'scale(0.8)',
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  );
};

