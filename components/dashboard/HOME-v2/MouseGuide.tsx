import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';

const Tooltip = ({ label, children }: { label: string; children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ x: rect.left + rect.width / 2, y: rect.top });
    }
    setVisible(true);
  };

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && createPortal(
        <div
          className="fixed px-2 py-1 rounded bg-gray-800 text-white text-[11px] font-medium whitespace-nowrap pointer-events-none z-[10020]"
          style={{ left: `${pos.x}px`, top: `${pos.y - 8}px`, transform: 'translate(-50%, -100%)' }}
        >
          {label}
        </div>,
        document.body
      )}
    </div>
  );
};

export type GuideType = 'mouse' | 'eye' | 'keyboard';

export type MouseGuideProps = {
  show: boolean;
  guideTarget: string | null;
  guideMessage: string;
  guideType: GuideType;
  mousePosition: { x: number; y: number };
  currentStepIndex: number;
  totalSteps: number;
  currentStepId?: string;
  onPrev?: () => void;
  onNext?: () => void;
  navigationDisabled?: boolean;
  nextDisabled?: boolean;
};

const STEP_ICONS: Record<string, string> = {
  intro: 'mdi:cursor-default-click',
  searching: 'mdi:radar',
  'review-candidates': 'mdi:account-search-outline',
  'candidate-detail': 'mdi:account-check-outline',
  'capture-complete': 'mdi:check-circle-outline',
  'route-analysis': 'mdi:map-marker-path',
  'predicted-cctv': 'mdi:cctv',
  'predicted-cctv-detail': 'mdi:clipboard-text-search-outline',
  'capture-list-guide': 'mdi:format-list-checks',
  'capture-list-review': 'mdi:package-variant-closed',
  propagation: 'mdi:broadcast',
};

export const MouseGuide = ({
  show,
  guideTarget,
  guideMessage,
  guideType,
  mousePosition,
  currentStepIndex,
  totalSteps,
  currentStepId,
  onPrev,
  onNext,
  navigationDisabled = false,
  nextDisabled = false,
}: MouseGuideProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [bodyHeight, setBodyHeight] = useState<number | 'auto'>('auto');
  const bodyRef = useRef<HTMLDivElement>(null);
  const prevStepId = useRef(currentStepId);

  useEffect(() => {
    if (prevStepId.current !== currentStepId) {
      setCollapsed(false);
      prevStepId.current = currentStepId;
    }
  }, [currentStepId]);

  useEffect(() => {
    if (!bodyRef.current) return;
    setBodyHeight(bodyRef.current.scrollHeight);
  }, [guideMessage, currentStepId]);

  const handleToggleCollapse = useCallback(() => {
    if (!bodyRef.current) return;
    setBodyHeight(bodyRef.current.scrollHeight);
    requestAnimationFrame(() => {
      setCollapsed(prev => !prev);
    });
  }, []);

  if (!show || (!guideTarget && !guideMessage)) return null;

  const iconName = currentStepId ? STEP_ICONS[currentStepId] : undefined;
  const stepNumber = currentStepIndex + 1;
  const isFirst = currentStepIndex <= 0;

  return (
    <>
      {/* 타겟 위치를 따라가는 펄스 원 */}
      {guideTarget && guideType !== 'eye' && (
        <div
          className="fixed pointer-events-none z-[10010]"
          style={{
            left: `${mousePosition.x}px`,
            top: `${mousePosition.y}px`,
          }}
        >
          <div
            className="absolute"
            style={{
              left: '0',
              top: '0',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className="w-7 h-7 rounded-full animate-guide-circle-pulse bg-white/80"
              style={{
                boxShadow: '0 0 15px rgba(255, 255, 255, 0.9), 0 0 30px rgba(255, 255, 255, 0.6)',
              }}
            />
          </div>
        </div>
      )}

      {/* 메시지 박스 */}
      {guideMessage && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[10010]"
          style={{ bottom: currentStepId === 'intro' ? '214px' : '32px' }}
          aria-live="polite"
        >
          <div
            className="gradient-border-right-bottom rounded-lg overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              boxShadow: '0 4px 24px 0 rgba(31, 38, 135, 0.15)',
            }}
          >
            {/* 헤더: STEP + 접기/펼치기 + 이전/다음 */}
            <div className={`flex items-center justify-between px-4 ${collapsed ? 'py-2.5' : 'pt-3 pb-1'}`}>
              <div className="flex items-center gap-2">
                {iconName && (
                  <Icon icon={iconName} className="w-4 h-4 text-gray-700" />
                )}
                <span className="text-xs font-bold text-gray-700 tracking-wide">
                  STEP {stepNumber}
                  <span className="font-normal text-gray-600 ml-1">/ {totalSteps}</span>
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Tooltip label="이전">
                  <button
                    type="button"
                    onClick={onPrev}
                    disabled={isFirst || navigationDisabled}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="이전 단계"
                    tabIndex={0}
                  >
                    <Icon icon="mdi:chevron-left" className="w-4 h-4 text-gray-700" />
                  </button>
                </Tooltip>
                <Tooltip label="다음">
                  <button
                    type="button"
                    onClick={onNext}
                    disabled={navigationDisabled || nextDisabled}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="다음 단계"
                    tabIndex={0}
                  >
                    <Icon icon="mdi:chevron-right" className="w-4 h-4 text-gray-700" />
                  </button>
                </Tooltip>
                <div className="w-px h-3.5 bg-gray-500 mx-0.5" />
                <Tooltip label={collapsed ? '펼치기' : '접기'}>
                  <button
                    type="button"
                    onClick={handleToggleCollapse}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/10 transition-colors"
                    aria-label={collapsed ? '가이드 펼치기' : '가이드 접기'}
                    tabIndex={0}
                  >
                  <Icon
                    icon={collapsed ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                    className="w-4 h-4 text-gray-700 transition-transform duration-200"
                  />
                </button>
                </Tooltip>
              </div>
            </div>

            {/* 메시지 본문 (접기/펼치기) */}
            <div
              ref={bodyRef}
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                maxHeight: collapsed ? 0 : bodyHeight,
                opacity: collapsed ? 0 : 1,
              }}
            >
              <div className="px-5 pb-3.5 pt-1">
                <span
                  className="text-gray-900 text-sm font-medium leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: guideMessage }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
