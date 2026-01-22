import { useState, useEffect } from 'react';
import { getRandomCCTVVideo } from '@/lib/cctv-video-utils';

interface CCTVVideoPanelProps {
  showCCTV: boolean;
  hideControls?: boolean;
}

const CCTVVideoPanel = ({ showCCTV, hideControls = false }: CCTVVideoPanelProps) => {
  const [currentCCTVIndex, setCurrentCCTVIndex] = useState(0);

  useEffect(() => {
    if (!showCCTV) return;
    
    const interval = setInterval(() => {
      setCurrentCCTVIndex((prev) => prev + 1);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [showCCTV]);

  useEffect(() => {
    if (!showCCTV) return;
    
    if (currentCCTVIndex >= 8) {
      const timer = setTimeout(() => {
        setCurrentCCTVIndex(0);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentCCTVIndex, showCCTV]);

  if (!showCCTV) return null;

  const cctvList = ['CCTV-V-1', 'CCTV-V-2', 'CCTV-V-3', 'CCTV-V-4', 'CCTV-V-5', 'CCTV-V-6', 'CCTV-V-7', 'CCTV-V-8'];
  const duplicatedList = [...cctvList, ...cctvList, ...cctvList];
  const itemWidth = 200;
  const gap = 12;
  const padding = 12;
  const totalItemWidth = itemWidth + gap;
  const baseOffset = cctvList.length * totalItemWidth;
  const currentOffset = baseOffset + (currentCCTVIndex * totalItemWidth);

  return (
    <div
      className="absolute bottom-0 left-0 right-0 transition-all duration-500 ease-in-out"
      style={{ 
        zIndex: 200,
        transform: hideControls ? 'translateY(136px)' : 'translateY(0)',
        opacity: hideControls ? 0 : 1,
      }}
    >
      <div className="bg-[#242a34] border-t border-[#31353a] rounded-t-lg" style={{ height: '136px', width: '100%', overflow: 'hidden' }}>
        <div 
          className="flex items-center h-full transition-transform duration-500 ease-in-out"
          style={{ 
            gap: `${gap}px`,
            padding: `${padding}px`,
            transform: `translateX(-${currentOffset}px)`,
          }}
        >
          {duplicatedList.map((cctvId, index) => (
            <div
              key={`bottom-cctv-${index}-${cctvId}`}
              className="relative rounded overflow-hidden border-2 border-[#31353a] hover:border-blue-500/50 flex-shrink-0"
              style={{ width: `${itemWidth}px`, height: '100%' }}
            >
              <video
                src={getRandomCCTVVideo(cctvId)}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-0.5">
                <div className="text-white text-[10px] font-semibold truncate" title={cctvId}>
                  {cctvId}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CCTVVideoPanel;
