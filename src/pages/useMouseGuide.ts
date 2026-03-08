import { useState, useEffect, useRef, useCallback } from 'react';

export type GuideType = 'mouse' | 'eye' | 'keyboard';

export type GuideStep = {
  id: string;
  targetId?: string;
  message: string;
  type: GuideType;
  delayAfterClick: number;
};

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'intro',
    targetId: 'fast-search-start-button',
    message: '실종 신고가 접수되었습니다.<br/>마지막 목격 위치와 대상자 정보를 확인한 뒤<br/><b>\'고속 검색 시작\'</b>을 선택하세요.',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'searching',
    message: 'CUVIA가 주변 CCTV를 분석하여<br/>대상자를 탐색합니다.',
    type: 'eye',
    delayAfterClick: 0,
  },
  {
    id: 'review-candidates',
    message: 'CUVIA가 탐색한 후보를 확인하세요.<br/>검색 조건을 추가하면 후보를 더 정확하게 좁힐 수 있습니다.',
    type: 'eye',
    delayAfterClick: 0,
  },
  {
    id: 'candidate-detail',
    targetId: 'capture-target-button',
    message: '후보 정보를 확인하세요.<br/>대상으로 판단되면 <b>\'대상 포착\'</b>을 선택하세요.',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'capture-complete',
    targetId: 'object-tracking-menu',
    message: '대상을 포착했습니다.<br/>다음 단계로 이동하려면<br/>\'객체 추적\' 메뉴를 선택하세요.',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'route-analysis',
    message: '확정된 후보를 기반으로<br/>CUVIA가 이동 경로를 분석합니다.',
    type: 'eye',
    delayAfterClick: 0,
  },
  {
    id: 'predicted-cctv',
    message: '예측된 CCTV를 확인하여<br/>대상자의 현재 위치를 탐색하세요.',
    type: 'eye',
    delayAfterClick: 0,
  },
  {
    id: 'predicted-cctv-detail',
    targetId: 'predicted-target-found-button',
    message: '예측된 CCTV와 분석 근거를 확인하세요.<br/>대상이 발견되면 <b>\'대상 포착\'</b>을 선택하세요.',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'capture-list-guide',
    targetId: 'capture-list-menu',
    message: '확보된 포착 정보를 바탕으로<br/>현장 및 타기관에 공유할 수 있습니다.<br/>\'포착 목록\' 메뉴를 선택하세요.',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'capture-list-review',
    targetId: 'create-propagation-package-button',
    message: '포착 정보를 확인하고 공유할 항목을 선택하세요.<br/>선택 후 <b>\'전파 패키지 생성\'</b>을 눌러주세요.',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'propagation',
    targetId: 'send-propagation-package-button',
    message: '선택한 근거를 기반으로 전파 패키지를 생성합니다.<br/>\'전파\' 버튼을 눌러 공유하세요.',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'report-download',
    targetId: 'report-download-button',
    message: '사건 처리가 완료되었습니다.<br/>결과 보고서를 생성하려면<br/><b>\'사건 처리 결과 보고서 다운로드\'</b>를 선택하세요.',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'report-result',
    targetId: 'report-pdf-button',
    message: '사건 처리 결과 보고서를 다운로드하세요.',
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
    setGuideMessage(step.message);
    setGuideType(step.type);
  }, [clearTimers]);

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
      // searching 단계를 거치지 않았으면 searching 먼저 표시
      targetStepId = currentStepIndex < 1 ? 'searching' : 'review-candidates';
    } else if (appState.fastSearchStarted) {
      targetStepId = 'searching';
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

  // 타겟 위치 추적 (타겟이 있는 스텝에서만)
  useEffect(() => {
    if (!showMouseGuide || !guideTarget) return;

    const updateTargetPosition = () => {
      const targetElement = document.getElementById(guideTarget);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setMousePosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      }
    };

    updateTargetPosition();
    const interval = setInterval(updateTargetPosition, 100);
    return () => clearInterval(interval);
  }, [showMouseGuide, guideTarget]);

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
