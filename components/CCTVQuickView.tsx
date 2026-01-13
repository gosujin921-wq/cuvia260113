'use client';

import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';

interface CCTVQuickViewProps {
  isVisible?: boolean;
  cctvList?: Array<{
    id: string;
    name: string;
    location: string;
    thumbnail?: string;
  }>;
  onClose?: () => void;
}

const CCTVQuickView = ({ isVisible = false, cctvList = [], onClose }: CCTVQuickViewProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || cctvList.length === 0 || !scrollContainerRef.current) return;

    const scrollContainer = scrollContainerRef.current;
    const cardWidth = 192 + 12; // w-48 (192px) + gap-3 (12px)
    const containerWidth = scrollContainer.offsetWidth;
    const visibleCardsPerRow = Math.floor(containerWidth / cardWidth);
    
    let currentScrollIndex = 0;
    const totalCards = cctvList.length * 3; // 3번 반복
    const maxScrollIndex = totalCards - visibleCardsPerRow;

    const interval = setInterval(() => {
      if (scrollContainer) {
        currentScrollIndex = (currentScrollIndex + 1) % maxScrollIndex;
        
        // 무한 스크롤: 끝에 도달하면 처음으로 부드럽게 이동
        if (currentScrollIndex === 0 && scrollContainer.scrollLeft > totalCards * cardWidth / 3) {
          scrollContainer.scrollLeft = 0;
        }
        
        scrollContainer.scrollTo({
          left: currentScrollIndex * cardWidth,
          behavior: 'smooth',
        });
      }
    }, 3000); // 3초마다 한 칸씩 이동

    return () => clearInterval(interval);
  }, [isVisible, cctvList.length]);

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-[#161719] border-t border-[#31353a] px-4 py-3" style={{ zIndex: 300, height: '450px' }}>
      <div className="flex items-center mb-2">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:cctv" className="w-5 h-5 text-white" />
          <span className="text-white font-semibold text-sm">CCTV Quick View</span>
        </div>
      </div>
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto overflow-y-hidden pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {cctvList.length === 0 ? (
          <div className="flex items-center justify-center flex-1 text-gray-400 text-sm">
            CCTV 정보가 없습니다.
          </div>
        ) : (
          <div className="inline-grid grid-rows-3 grid-flow-col gap-3" style={{ gridAutoColumns: '12rem' }}>
            {[...cctvList, ...cctvList, ...cctvList].map((cctv, index) => (
              <div
                key={`${cctv.id}-${index}`}
                className="relative w-48 h-28 bg-[#36383B] overflow-hidden border border-[#31353a] cursor-pointer hover:border-blue-500 transition-all hover:scale-105"
                style={{ borderWidth: '1px' }}
              >
              <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 flex items-center justify-center relative">
                {cctv.thumbnail ? (
                  <img src={cctv.thumbnail} alt={cctv.name} className="w-full h-full object-cover" />
                ) : (
                  <>
                    {/* CCTV 영상 시뮬레이션 */}
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-gray-900/40" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <Icon icon="mdi:cctv" className="w-10 h-10 text-gray-500" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-gray-600 rounded-full opacity-50 animate-pulse" />
                      </div>
                    </div>
                    {/* 라이브 인디케이터 */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-red-600 rounded-full" style={{ borderWidth: '1px' }}>
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-white text-[10px] font-medium">LIVE</span>
                    </div>
                  </>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-2 py-2">
                <p className="text-white text-xs font-medium truncate">{cctv.name}</p>
                <p className="text-gray-400 text-[10px] truncate">{cctv.location}</p>
              </div>
            </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CCTVQuickView;

