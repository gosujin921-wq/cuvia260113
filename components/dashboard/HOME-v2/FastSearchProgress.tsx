import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface FastSearchProgressProps {
  isVisible: boolean;
  onComplete?: () => void;
  hideDim?: boolean;
  /** 재검색 등 시 상단 문구 (예: "결과를 재검색합니다.") */
  titleOverride?: string;
  /** 부모 컨테이너 내부 중앙에 배치 (fixed 대신 absolute) */
  inContainer?: boolean;
}

const FastSearchProgress: React.FC<FastSearchProgressProps> = ({
  isVisible,
  onComplete,
  hideDim = false,
  titleOverride,
  inContainer = false,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [cameraCount, setCameraCount] = useState<number>(0);

  const steps = [
    '사건 위치 기준 검색 범위 설정 중...',
    'CCTV 목록 불러오는 중...',
    '특징 조건 및 신고 내용 적용 중...',
    '후보 탐색 및 유사도 점수 계산 중...',
    '결과 정렬 및 화면 준비 중...',
  ];

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      setIsSearching(false);
      setCameraCount(0);
      return;
    }

    // 각 단계를 순차적으로 진행
    const stepIntervalMs = 400; // 650ms → 400ms (약 1.6배 빠르게)
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          // 모든 단계 완료 후 탐색 단계로
          setTimeout(() => {
            setIsSearching(true);
            // 카메라 카운트 애니메이션
            let count = 0;
            const countIntervalMs = 50; // 80ms → 50ms (약 1.6배 빠르게)
            const countInterval = setInterval(() => {
              count += Math.floor(Math.random() * 4) + 2; // 증가량 늘림 (2~5)
              if (count >= 37) {
                count = 37;
                clearInterval(countInterval);
                setCameraCount(count);
                // 37에 도달한 후 0.5초만 표시
                if (onComplete) {
                  setTimeout(() => {
                    onComplete();
                  }, 500); // 1000ms → 500ms
                }
              } else {
                setCameraCount(count);
              }
            }, countIntervalMs);
          }, 150); // 280ms → 150ms
          return prev;
        }
      });
    }, stepIntervalMs);

    return () => clearInterval(stepInterval);
  }, [isVisible, steps.length, onComplete]);

  if (!isVisible) {
    return null;
  }

  const containerClass = inContainer
    ? 'absolute inset-0 flex items-center justify-center z-[2001]'
    : 'fixed inset-0 flex items-center justify-center z-[2001]';

  return (
    <>
      {/* 딤 레이어 (inContainer일 때는 부모에서 처리) */}
      {!hideDim && !inContainer && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000]"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* 프로그래스바 컨테이너 */}
      <div
        className={containerClass}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="rounded-2xl px-8 py-6 min-w-[500px] relative overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* 그라데이션 이너 글로우 - 가장자리만 (라운드) */}
          <div
            className="absolute rounded-2xl"
            style={{
              inset: '-8px',
              background: 'radial-gradient(ellipse at center, #0066FF 0%, #8A2BE2 50%, #ff8566 100%)',
              animation: 'fast-search-gradient-move 3s ease-in-out infinite',
              opacity: 0.1,
              filter: 'blur(15px)',
              mixBlendMode: 'screen',
              zIndex: 0,
              maskImage: 'radial-gradient(ellipse 95% 50% at center, transparent 30%, black 70%)',
              WebkitMaskImage: 'radial-gradient(ellipse 95% 50% at center, transparent 30%, black 70%)',
            }}
          />
          {/* 화이트 오퍼시티 레이어 */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              zIndex: 1,
            }}
          />

          {/* 내용 */}
          <div className="relative z-10">
            {titleOverride && (
              <div className="text-center text-white font-medium mb-4">
                {titleOverride}
              </div>
            )}
            {!isSearching ? (
              <>
                {/* 프로그래스바 */}
                <div className="mb-4">
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${((currentStep + 1) / steps.length) * 100}%`,
                        background: 'linear-gradient(90deg, #0066FF 0%, #8A2BE2 50%, #ff8566 100%)',
                        boxShadow: '0 0 10px rgba(0, 102, 255, 0.5)',
                      }}
                    />
                  </div>
                </div>

                {/* 현재 단계 텍스트 */}
                <div className="text-center">
                  <div className="text-sm text-white font-medium">
                    {steps[currentStep]}
                  </div>
                  <div className="text-xs text-white/70 mt-1">
                    {currentStep + 1} / {steps.length}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Icon
                    icon="mdi:loading"
                    className="w-4 h-4 text-white animate-spin"
                  />
                  <div className="text-sm text-white font-medium">
                    후보를 탐색하고 있습니다.
                  </div>
                </div>
                <div className="text-xs text-white/70">
                  (카메라 {cameraCount}대 확인 중...)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 쿠비아 로고 - 우측 하단 (inContainer일 때는 숨김) */}
      {!inContainer && (
        <div
          className="fixed bottom-6 right-6 z-[2002]"
          style={{ pointerEvents: 'none' }}
        >
          <img
            src="/logo.svg"
            alt="CUVIA"
            className="h-6 w-auto object-contain opacity-80"
          />
        </div>
      )}
    </>
  );
};

export default FastSearchProgress;
