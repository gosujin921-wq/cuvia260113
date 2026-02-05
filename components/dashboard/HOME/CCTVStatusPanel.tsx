import { useState, useEffect, useMemo } from 'react';

interface HallStatus {
  hall: string;
  operationRate: number;
}

const CCTVStatusPanel = () => {
  const hallData: HallStatus[] = useMemo(() => [
    { hall: 'Hall1', operationRate: 95 },
    { hall: 'Hall2', operationRate: 89 },
    { hall: 'Hall3', operationRate: 92 },
    { hall: 'Hall4', operationRate: 87 },
  ], []);

  const [visibleStartIndex, setVisibleStartIndex] = useState(0);

  const totalStats = useMemo(() => {
    const totalNormal = 1192;
    const totalIssue = 48;
    const total = totalNormal + totalIssue;
    
    return { totalNormal, totalIssue, total };
  }, []);

  // 롤링 효과
  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleStartIndex((prev) => (prev + 2) % hallData.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [hallData.length]);

  const visibleHalls = [
    hallData[visibleStartIndex % hallData.length],
    hallData[(visibleStartIndex + 1) % hallData.length],
  ];

  return (
    <div 
      className="rounded-lg p-4 gradient-border-right-bottom flex flex-col"
      style={{ 
        flexShrink: 0,
        background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)', 
        backdropFilter: 'blur(4px)', 
        WebkitBackdropFilter: 'blur(4px)' 
      }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white text-sm font-semibold">CCTV 운영 현황</h3>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-gray-400">정상</span>
            <span className="text-green-400 font-medium">{totalStats.totalNormal}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            <span className="text-gray-400">장애</span>
            <span className="text-yellow-400 font-medium">{totalStats.totalIssue}</span>
          </div>
        </div>
      </div>

      {/* Hall 카드 그리드 (2x1 롤링) */}
      <div className="grid grid-cols-2 gap-3">
        {visibleHalls.map((hall, index) => (
          <div
            key={`${hall.hall}-${visibleStartIndex}-${index}`}
            className="bg-[#2a2d35] rounded-lg p-2.5 transition-opacity duration-300"
          >
            {/* Hall 이름 */}
            <div className="mb-2">
              <span className="text-white text-sm font-bold">{hall.hall}</span>
            </div>

            {/* 지표 */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-gray-400 text-xs font-semibold">장비 작동률</span>
              <span className="text-white text-sm font-bold">{hall.operationRate}%</span>
            </div>
            <div>
              <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${hall.operationRate}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CCTVStatusPanel;
