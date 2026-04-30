import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface HeatmapPanelProps {
  className?: string;
  areaLabelPrefix?: string; // 'Zone', 'Hall', '동' 등
  areaLabels?: Record<string, string>; // zone1 -> '중동', zone2 -> '상동' 등 커스텀 라벨
  minVisibleCount?: number; // 최소 표시 개수
}

const HeatmapPanel = ({ className = '', areaLabelPrefix = 'Zone', areaLabels, minVisibleCount = 4 }: HeatmapPanelProps) => {
  const { t } = useTranslation();
  const [heatmapAreaOffset, setHeatmapAreaOffset] = useState(0);
  const [heatmapAnimationKey, setHeatmapAnimationKey] = useState(0);
  const [previousHeatmapData, setPreviousHeatmapData] = useState<Record<string, Record<string, number>>>({});
  const previousHeatmapDataRef = useRef<Record<string, Record<string, number>>>({});
  const [visibleHeatmapCount, setVisibleHeatmapCount] = useState(minVisibleCount);
  const heatmapGridRef = useRef<HTMLDivElement>(null);

  // 모든 지역 목록 (zone1~zone8)
  const allHeatmapAreas = useMemo(() => {
    return [
      'zone1',
      'zone2',
      'zone3',
      'zone4',
      'zone5',
      'zone6',
      'zone7',
      'zone8',
    ];
  }, []);

  const getSeededInt = (seed: string, maxInclusive: number) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % (maxInclusive + 1);
  };

  const heatmapTimeSlots = useMemo(() => {
    return Array.from({ length: 12 }, (_, idx) => {
      const hour = idx * 2;
      const padded = hour.toString().padStart(2, '0');
      return {
        key: `${padded}`,
        label: padded,
        startHour: hour,
      };
    });
  }, []);

  // 현재 표시할 지역 (화면 높이에 따라 동적으로 계산)
  const heatmapAreas = useMemo(() => {
    const startIndex = heatmapAreaOffset % allHeatmapAreas.length;
    const result: string[] = [];
    for (let i = 0; i < visibleHeatmapCount; i++) {
      const index = (startIndex + i) % allHeatmapAreas.length;
      result.push(allHeatmapAreas[index]);
    }
    return result;
  }, [heatmapAreaOffset, allHeatmapAreas, visibleHeatmapCount]);

  type HeatmapBucket = 'none' | 'low' | 'mid' | 'high';
  const getHeatmapBucket = (count: number): HeatmapBucket => {
    if (count <= 0) return 'none';
    if (count <= 2) return 'low';
    if (count <= 5) return 'mid';
    return 'high';
  };

  const getHeatmapCellClassName = (count: number) => {
    const bucket = getHeatmapBucket(count);
    if (bucket === 'none') return 'bg-[#1f2937]';
    if (bucket === 'low') return 'bg-[#3b5a8c]';
    if (bucket === 'mid') return 'bg-[#005eb8]';
    return 'bg-[#F87171]';
  };

  const heatmapData = useMemo(() => {
    const nowSeed = typeof window !== 'undefined' ? new Date().toISOString().slice(0, 10) : 'static';
    const result: Record<string, Record<string, number>> = {};

    // 구역별 컬러 분포 패턴 정의
    const getAreaDistribution = (area: string) => {
      const areaNum = parseInt(area.replace('zone', '')) || 1;
      const jitter = getSeededInt(`${nowSeed}:${area}:jitter`, 11) - 5;
      
      switch (areaNum) {
        case 1:
          return {
            noneThreshold: 65 + jitter,
            lowThreshold: 25,
            midThreshold: 10,
          };
        case 2:
          return {
            noneThreshold: 40 + jitter,
            lowThreshold: 30,
            midThreshold: 25,
          };
        case 3:
          return {
            noneThreshold: 45 + jitter,
            lowThreshold: 25,
            midThreshold: 20,
          };
        case 4:
          return {
            noneThreshold: 50 + jitter,
            lowThreshold: 25,
            midThreshold: 20,
          };
        case 5:
          return {
            noneThreshold: 30 + jitter,
            lowThreshold: 30,
            midThreshold: 30,
          };
        case 6:
          return {
            noneThreshold: 50 + jitter,
            lowThreshold: 35,
            midThreshold: 10,
          };
        case 7:
          return {
            noneThreshold: 35 + jitter,
            lowThreshold: 25,
            midThreshold: 30,
          };
        case 8:
          return {
            noneThreshold: 45 + jitter,
            lowThreshold: 20,
            midThreshold: 25,
          };
        default:
          return {
            noneThreshold: 55 + jitter,
            lowThreshold: 25,
            midThreshold: 15,
          };
      }
    };

    heatmapAreas.forEach((area) => {
      result[area] = {};
      const distribution = getAreaDistribution(area);
      
      heatmapTimeSlots.forEach((slot) => {
        const cellSeed = getSeededInt(`${nowSeed}:${area}:${slot.key}:cell`, 1000);
        const baseRand = cellSeed % 100;
        const slotJitter = getSeededInt(`${nowSeed}:${area}:${slot.key}:j`, 21) - 10;
        
        const cellNoneOffset = getSeededInt(`${nowSeed}:${area}:${slot.key}:noneOffset`, 31) - 15;
        const noneThreshold = Math.max(20, Math.min(80, distribution.noneThreshold + slotJitter + cellNoneOffset));
        
        const lowThreshold = distribution.lowThreshold;
        const midThreshold = distribution.midThreshold;
        const highThreshold = 100 - noneThreshold - lowThreshold - midThreshold;

        let value: number;
        const valueRand = baseRand;
        
        if (valueRand < noneThreshold) {
          value = 0;
        } else if (valueRand < noneThreshold + lowThreshold) {
          value = 1 + getSeededInt(`${nowSeed}:${area}:${slot.key}:low`, 1);
        } else if (valueRand < noneThreshold + lowThreshold + midThreshold) {
          value = 3 + getSeededInt(`${nowSeed}:${area}:${slot.key}:mid`, 2);
        } else {
          value = 6 + getSeededInt(`${nowSeed}:${area}:${slot.key}:high`, 3);
        }

        result[area][slot.key] = value;
      });
    });

    return result;
  }, [heatmapAreas, heatmapTimeSlots]);

  // 초기 데이터 저장
  useEffect(() => {
    if (Object.keys(previousHeatmapDataRef.current).length === 0 && Object.keys(heatmapData).length > 0) {
      const initialData = JSON.parse(JSON.stringify(heatmapData));
      previousHeatmapDataRef.current = initialData;
      setPreviousHeatmapData(initialData);
    }
  }, [heatmapData]);

  // 히트맵 지역 롤링 (5초마다)
  useEffect(() => {
    const totalAreaPages = Math.ceil(allHeatmapAreas.length / visibleHeatmapCount);
    if (totalAreaPages <= 1) return;

    const intervalId = setInterval(() => {
      const currentDataCopy = JSON.parse(JSON.stringify(heatmapData));
      previousHeatmapDataRef.current = currentDataCopy;

      setPreviousHeatmapData(currentDataCopy);

      setHeatmapAreaOffset((prev) => (prev + visibleHeatmapCount) % allHeatmapAreas.length);
      setHeatmapAnimationKey((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [allHeatmapAreas.length, visibleHeatmapCount, heatmapData]);

  return (
    <div className={`rounded-lg p-4 gradient-border-right-bottom flex flex-col ${className}`} style={{ flexShrink: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm">{t('heatmap.title')}</h3>
        <span className="text-gray-400 text-xs">{t('heatmap.last24h')}</span>
      </div>
      <div className="flex items-center justify-end gap-4 text-[12px] text-gray-200 mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#1f2937] border border-gray-500/30" />
          <span>None</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#3b5a8c]" />
          <span>1–2</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#005eb8]" />
          <span>3–5</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#F87171]" />
          <span>6+</span>
        </div>
      </div>

      <div className="flex flex-col">
        {/* 그리드 */}
        <div ref={heatmapGridRef} className="space-y-1 relative">
          {heatmapAreas.map((area, index) => {
            const groupIndex = Math.floor(index / 2);
            const isFirstGroup = groupIndex === 0;
            const groupDelay = isFirstGroup ? 0 : 200;
            
            return (
              <div
                key={`${area}-${heatmapAnimationKey}`}
                className="flex items-center gap-0"
                style={{
                  animation: `fadeInUp 0.4s ease-out ${groupDelay}ms both`,
                }}
              >
                <div className="w-10 text-[12px] text-gray-400 truncate" title={area}>
                  {areaLabels ? (areaLabels[area] || area) : area.replace('zone', areaLabelPrefix)}
                </div>
                <div className="grid grid-cols-12 gap-1 flex-1 min-w-0">
                  {heatmapTimeSlots.map((slot, slotIndex) => {
                    const count = heatmapData[area]?.[slot.key] ?? 0;
                    const bucket = getHeatmapBucket(count);
                    const isNowNone = bucket === 'none';
                    
                    const label = t('heatmap.cellLabel', { area, start: slot.label, end: (slot.startHour + 2).toString().padStart(2, '0'), count });
                    const borderClass = bucket === 'none' ? 'border border-gray-500/30' : '';
                    
                    const cellSeed = `${heatmapAnimationKey}-${area}-${slot.key}`;
                    const delaySeed = getSeededInt(`${cellSeed}-delay`, 100);
                    const cellDelay = (index * 50) + (slotIndex * 20) + (delaySeed % 100);
                    
                    const newColorClass = getHeatmapCellClassName(count);
                    const newColorValue = bucket === 'low' ? '#3b5a8c' : 
                                         bucket === 'mid' ? '#005eb8' : 
                                         bucket === 'high' ? '#F87171' : '#1f2937';
                    
                    const shouldAnimate = !isNowNone;
                    
                    return (
                      <div
                        key={`${area}-${slot.key}-${heatmapAnimationKey}`}
                        className={`aspect-square rounded-md ${borderClass} ${!shouldAnimate ? newColorClass : ''} ${bucket !== 'none' ? 'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]' : ''} ${shouldAnimate ? 'heatmap-cell-sparkle-dissolve' : ''}`}
                        title={label}
                        aria-label={label}
                        style={{
                          '--new-color': newColorValue,
                          ...(shouldAnimate ? { 
                            backgroundColor: newColorValue,
                            animation: `heatmapCellSparkleDissolve 1.8s cubic-bezier(0.4, 0, 0.2, 1) ${cellDelay}ms both`,
                          } : {}),
                        } as React.CSSProperties}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes heatmapCellSparkleDissolve {
            /* Phase 1: None 상태에서 반짝이기 (0-30%) */
            0% {
              background-color: #1f2937;
              opacity: 0.6;
              transform: scale(1);
              filter: brightness(0.8);
            }
            15% {
              background-color: #1f2937;
              opacity: 1;
              transform: scale(1.05);
              filter: brightness(1.5);
            }
            30% {
              background-color: #1f2937;
              opacity: 0.95;
              transform: scale(1.08);
              filter: brightness(1.3);
            }
            
            /* Phase 2: 새로운 컬러로 디졸브 (30-100%) */
            40% {
              background-color: var(--new-color);
              opacity: 0.4;
              transform: scale(1.05);
              filter: brightness(0.6) blur(1.5px);
            }
            55% {
              background-color: var(--new-color);
              opacity: 0.7;
              transform: scale(1.08);
              filter: brightness(1.1) blur(1px);
            }
            70% {
              background-color: var(--new-color);
              opacity: 0.9;
              transform: scale(1.05);
              filter: brightness(1.2) blur(0.5px);
            }
            85% {
              background-color: var(--new-color);
              opacity: 0.95;
              transform: scale(1.02);
              filter: brightness(1.05) blur(0.3px);
            }
            100% {
              background-color: var(--new-color);
              opacity: 1;
              transform: scale(1);
              filter: brightness(1) blur(0px);
            }
          }
          
          .heatmap-cell-sparkle-dissolve {
            animation: heatmapCellSparkleDissolve 1.8s cubic-bezier(0.4, 0, 0.2, 1) both;
          }
        `}</style>

        {/* X축 라벨 (아래) */}
        <div className="flex items-center gap-0 mt-2 flex-shrink-0">
          <div className="w-10" />
          <div className="grid grid-cols-12 gap-1 flex-1 min-w-0">
            {heatmapTimeSlots.map((slot, index) => {
              const isLast = index === heatmapTimeSlots.length - 1;
              return (
                <div key={slot.key} className="text-[12px] text-gray-400 text-center select-none">
                  {isLast ? (
                    <>
                      {slot.label}
                      <br />
                      {t('heatmap.hourSuffix')}
                    </>
                  ) : (
                    slot.label
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapPanel;
