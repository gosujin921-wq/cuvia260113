import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export type GuideType = 'mouse' | 'eye' | 'keyboard';

export type GuideStep = {
  id: string;
  targetId?: string;
  additionalHighlightIds?: string[];
  /**
   * i18n key (e.g. 'guide.steps.intro') — translated at render time inside the hook.
   * Stored as a key (not as a translated string) so language changes propagate live.
   */
  messageKey: string;
  type: GuideType;
  delayAfterClick: number;
};

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'intro',
    targetId: 'fast-search-start-button',
    messageKey: 'sk.guide.steps.intro',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'review-candidates',
    targetId: 'fast-search-candidate-10',
    additionalHighlightIds: ['radius-chip-button'],
    messageKey: 'sk.guide.steps.review-candidates',
    type: 'eye',
    delayAfterClick: 0,
  },
  {
    id: 'candidate-detail',
    targetId: 'capture-target-button',
    messageKey: 'sk.guide.steps.candidate-detail',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'route-analysis',
    messageKey: 'sk.guide.steps.route-analysis',
    type: 'eye',
    delayAfterClick: 0,
  },
  {
    id: 'predicted-cctv',
    targetId: 'predicted-cctv-7',
    messageKey: 'sk.guide.steps.predicted-cctv',
    type: 'eye',
    delayAfterClick: 0,
  },
  {
    id: 'predicted-cctv-detail',
    targetId: 'predicted-target-found-button',
    messageKey: 'sk.guide.steps.predicted-cctv-detail',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'capture-list-review',
    targetId: 'create-propagation-package-button',
    messageKey: 'sk.guide.steps.capture-list-review',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'propagation',
    targetId: 'send-propagation-package-button',
    messageKey: 'sk.guide.steps.propagation',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'report-download',
    targetId: 'report-download-button',
    messageKey: 'sk.guide.steps.report-download',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'report-result',
    targetId: 'report-pdf-button',
    messageKey: 'sk.guide.steps.report-result',
    type: 'mouse',
    delayAfterClick: 500,
  },
];

export type GuideState = {
  showMouseGuide: boolean;
  guideTarget: string | null;
  guideMessage: string;
  guideType: GuideType;
  mousePosition: { x: number; y: number };
  currentStepIndex: number;
};

type AppStateForSync = {
  fastSearchStarted: boolean;
  fastSearchProgressDone: boolean;
  reSearchInProgress: boolean;
  objectTrackingCompleted: boolean;
  showPredictedCCTVList: boolean;
  showCaptureList: boolean;
};

export const useMouseGuide = () => {
  const { t, i18n } = useTranslation();
  const [showMouseGuide, setShowMouseGuide] = useState<boolean>(true);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [guideTarget, setGuideTarget] = useState<string | null>(null);
  const [guideMessage, setGuideMessage] = useState<string>('');
  const [guideType, setGuideType] = useState<GuideType>('mouse');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);

  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
  }, []);

  const applyStep = useCallback((index: number) => {
    clearTimers();

    if (index < 0 || index >= GUIDE_STEPS.length) {
      setGuideTarget(null);
      setGuideMessage('');
      setGuideType('mouse');
      setCurrentStepIndex(index);
      return;
    }

    const step = GUIDE_STEPS[index];
    setCurrentStepIndex(index);
    setGuideTarget(step.targetId ?? null);
    setGuideMessage(t(step.messageKey));
    setGuideType(step.type);
  }, [clearTimers, t]);

  // 언어가 바뀌었을 때 현재 표시 중인 가이드 메시지를 새 언어로 즉시 갱신
  useEffect(() => {
    if (currentStepIndex < 0 || currentStepIndex >= GUIDE_STEPS.length) return;
    const step = GUIDE_STEPS[currentStepIndex];
    setGuideMessage(t(step.messageKey));
  }, [i18n.language, currentStepIndex, t]);

  const advanceToNext = useCallback(() => {
    const currentStep = GUIDE_STEPS[currentStepIndex];

    setGuideTarget(null);
    setGuideMessage('');
    clearTimers();

    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= GUIDE_STEPS.length) {
      setCurrentStepIndex(nextIndex);
      return;
    }

    const delay = currentStep?.delayAfterClick ?? 500;
    if (delay > 0) {
      pendingTimerRef.current = setTimeout(() => {
        applyStep(nextIndex);
      }, delay);
    } else {
      applyStep(nextIndex);
    }
  }, [currentStepIndex, applyStep, clearTimers]);

  const jumpToStep = useCallback((stepId: string, delay = 0) => {
    const index = GUIDE_STEPS.findIndex(s => s.id === stepId);
    if (index === -1) return;

    clearTimers();
    setGuideTarget(null);
    setGuideMessage('');

    if (delay > 0) {
      pendingTimerRef.current = setTimeout(() => {
        applyStep(index);
      }, delay);
    } else {
      applyStep(index);
    }
  }, [applyStep, clearTimers]);

  const syncToAppState = useCallback((appState: AppStateForSync) => {
    if (!showMouseGuide || currentStepIndex < 0) return;

    const currentStep = GUIDE_STEPS[currentStepIndex];
    if (!currentStep) return;

    // 타겟이 있는 스텝은 타겟이 DOM에 존재하면 동기화 스킵
    if (currentStep.targetId && guideTarget) {
      const targetEl = document.getElementById(currentStep.targetId);
      if (targetEl) return;
    }

    // 앱 상태 기반으로 올바른 마일스톤 결정 (가장 진행된 상태부터 체크)
    let targetStepId: string | null = null;

    if (appState.showCaptureList) {
      targetStepId = 'capture-list-review';
    } else if (appState.objectTrackingCompleted && appState.showPredictedCCTVList) {
      targetStepId = 'predicted-cctv';
    } else if (appState.fastSearchStarted && appState.fastSearchProgressDone && !appState.reSearchInProgress) {
      targetStepId = 'review-candidates';
    }

    if (targetStepId) {
      const targetIdx = GUIDE_STEPS.findIndex(s => s.id === targetStepId);
      if (targetIdx > currentStepIndex) {
        jumpToStep(targetStepId);
      }
    }
  }, [showMouseGuide, currentStepIndex, guideTarget, jumpToStep]);

  // 타겟 클릭 감지 (intro)
  useEffect(() => {
    if (!showMouseGuide || currentStepIndex < 0) return;

    const currentStep = GUIDE_STEPS[currentStepIndex];
    if (!currentStep?.targetId) return;

    const handleGlobalClick = (e: MouseEvent) => {
      const clickedEl = e.target as HTMLElement;
      const currentTargetEl = document.getElementById(currentStep.targetId!);
      if (currentTargetEl && (currentTargetEl === clickedEl || currentTargetEl.contains(clickedEl))) {
        advanceToNext();
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    return () => document.removeEventListener('click', handleGlobalClick, true);
  }, [showMouseGuide, currentStepIndex, guideTarget, advanceToNext]);

  // 타겟 위치 추적 + 오렌지 스트로크 하이라이트
  useEffect(() => {
    if (!showMouseGuide || !guideTarget) return;

    let highlightedEl: HTMLElement | null = null;
    const additionalEls: HTMLElement[] = [];

    const currentStep = GUIDE_STEPS[currentStepIndex];
    const extraIds = currentStep?.additionalHighlightIds ?? [];

    const updateTargetPosition = () => {
      const el = document.getElementById(guideTarget);
      if (el) {
        if (highlightedEl !== el) {
          highlightedEl?.classList.remove('guide-target-highlight');
          el.classList.add('guide-target-highlight');
          highlightedEl = el;
        }
        const rect = el.getBoundingClientRect();
        setMousePosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      }

      for (const id of extraIds) {
        const extra = document.getElementById(id);
        if (extra && !additionalEls.includes(extra)) {
          extra.classList.add('guide-target-highlight');
          additionalEls.push(extra);
        }
      }
    };

    updateTargetPosition();
    const interval = setInterval(updateTargetPosition, 100);
    return () => {
      clearInterval(interval);
      highlightedEl?.classList.remove('guide-target-highlight');
      additionalEls.forEach((el) => el.classList.remove('guide-target-highlight'));
    };
  }, [showMouseGuide, guideTarget, currentStepIndex]);

  const getStepId = useCallback((index: number): string | undefined => {
    if (index < 0 || index >= GUIDE_STEPS.length) return undefined;
    return GUIDE_STEPS[index].id;
  }, []);

  const resetGuide = useCallback(() => {
    clearTimers();
    setCurrentStepIndex(-1);
    setGuideTarget(null);
    setGuideMessage('');
    setGuideType('mouse');
  }, [clearTimers]);

  const toggleGuide = useCallback(() => {
    setShowMouseGuide(prev => !prev);
  }, []);

  const currentStepId =
    currentStepIndex >= 0 && currentStepIndex < GUIDE_STEPS.length
      ? GUIDE_STEPS[currentStepIndex].id
      : undefined;

  return {
    showMouseGuide,
    setShowMouseGuide,
    mousePosition,
    guideTarget,
    guideMessage,
    guideType,
    currentStepIndex,
    currentStepId,
    setGuideTarget,
    setGuideMessage,
    setGuideType,
    applyStep,
    advanceToNext,
    jumpToStep,
    getStepId,
    syncToAppState,
    resetGuide,
    toggleGuide,
    totalSteps: GUIDE_STEPS.length,
  };
};
