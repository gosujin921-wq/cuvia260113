import { useState, useEffect, useRef, useCallback } from 'react';

export type GuideType = 'mouse' | 'eye' | 'keyboard';

export type BubblePosition = 'above-center' | 'above-left' | 'above-right' | 'below-center' | 'below-left' | 'below-right';

export type GuideStep = {
  id: string;
  targetId: string;
  message: string;
  type: GuideType;
  delayAfterClick: number;
  autoAdvanceDelay?: number;
  pauseAfterClick?: boolean;
  bubble?: BubblePosition;
};

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'fast-search-start',
    targetId: 'fast-search-start-button',
    message: '고속검색 시작 버튼을 클릭하세요',
    type: 'mouse',
    delayAfterClick: 0,
    pauseAfterClick: true,
  },
  {
    id: 'radius-chip',
    targetId: 'radius-chip-button',
    message: '검색된 결과 확인 후 정형 검색 조건을 추가 입력하여 후보를 좁히거나 늘려보세요.',
    type: 'mouse',
    delayAfterClick: 500,
    bubble: 'below-left',
  },
  {
    id: 'radius-confirm',
    targetId: 'radius-confirm-button',
    message: '400m 이상으로 설정 후 확인 버튼을 클릭하세요.',
    type: 'mouse',
    delayAfterClick: 300,
    bubble: 'above-right',
  },
  {
    id: 'agent-chat-input',
    targetId: 'agent-chat-input',
    message: '검색된 결과 확인 후 비정형 검색 조건을 자연어로 입력하여 후보를 좁힐 수 있습니다.<br>(예 : 우산 쓴 사람 빼줘, 우산 삭제 등)',
    type: 'keyboard',
    delayAfterClick: 0,
  },
  {
    id: 'agent-chat-send',
    targetId: 'agent-chat-send-button',
    message: '전송 버튼을 클릭하세요',
    type: 'mouse',
    delayAfterClick: 0,
    bubble: 'above-right',
  },
  {
    id: 'fast-search-candidate-10',
    targetId: 'fast-search-candidate-10',
    message: '디테일한 고속 검색 결과를 확인해 보세요.',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'detail-tab',
    targetId: 'detail-tab-button',
    message: '후보 메타정보 탭을 클릭하세요.',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'similarity-dropdown',
    targetId: 'similarity-dropdown',
    message: '유사도 상세 정보를 확인하세요.',
    type: 'mouse',
    delayAfterClick: 2000,
  },
  {
    id: 'capture-target',
    targetId: 'capture-target-button',
    message: '대상을 포착 시 대상 포착 버튼을 눌러주세요.',
    type: 'mouse',
    delayAfterClick: 1000,
  },
  {
    id: 'match-button-10',
    targetId: 'match-button-10',
    message: '고속 검색 후보군 중 확정 후보는 맞음을 선택하여 후보군에 추가하세요.',
    type: 'mouse',
    delayAfterClick: 1000,
  },
  {
    id: 'wrong-button-1',
    targetId: 'wrong-button-1',
    message: '고속 검색 후보군 중 맞지 않는 후보는 틀림으로 체크하세요.',
    type: 'mouse',
    delayAfterClick: 1000,
  },
  {
    id: 're-search',
    targetId: 're-search-button',
    message: '추가한 조건 및 대표 후보를 기반으로 재검색을 시작합니다.',
    type: 'mouse',
    delayAfterClick: 1000,
  },
  {
    id: 'object-tracking-menu',
    targetId: 'object-tracking-menu',
    message: '객체 추적 메뉴를 클릭하세요.',
    type: 'mouse',
    delayAfterClick: 500,
    bubble: 'above-left',
  },
  {
    id: 'object-tracking-confirm',
    targetId: 'object-tracking-confirm-button',
    message: '시작 버튼을 클릭하세요.',
    type: 'mouse',
    delayAfterClick: 0,
  },
  {
    id: 'predicted-cctv-7',
    targetId: 'predicted-cctv-7',
    message: '객체추적 결과를 통해 지도에서 이동 경로를 확인하고,<br/>마지막 확인 지점 이후 포착 예측 주변 CCTV 리스트를 확인합니다.',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'route-prediction-dropdown',
    targetId: 'route-prediction-dropdown',
    message: '경로 예측 상세 근거를 확인하세요.',
    type: 'mouse',
    delayAfterClick: 2000,
  },
  {
    id: 'predicted-target-found',
    targetId: 'predicted-target-found-button',
    message: '대상을 포착 시 대상 포착 버튼을 눌러주세요.',
    type: 'mouse',
    delayAfterClick: 1000,
  },
  {
    id: 'predicted-cctv-close',
    targetId: 'predicted-cctv-close-button',
    message: '대상 포착을 완료한 뒤 닫기를 눌러 팝업을 닫아주세요.',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'capture-list-menu-click',
    targetId: 'capture-list-menu',
    message: '포착한 대상의 정보를 확인하고 AI로 생성된 전파문 초안을 확인, 전파 패키지를 생성 및 전송합니다.',
    type: 'mouse',
    delayAfterClick: 500,
    bubble: 'above-left',
  },
  {
    id: 'capture-item-0',
    targetId: 'capture-item-0',
    message: '객체 추적 시 포착한 대상의 전파 근거 정보를 확인합니다.',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'capture-detail-close-1',
    targetId: 'capture-detail-close-button',
    message: '전파 근거 내용을 확인 후 팝업을 닫아주세요.',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'capture-item-1',
    targetId: 'capture-item-1',
    message: '고속 검색 시 포착한 대상의 전파 근거 정보를 확인합니다.',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'capture-detail-close-2',
    targetId: 'capture-detail-close-button',
    message: '전파 근거 내용을 확인 후 팝업을 닫아주세요.',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'capture-checkbox-0',
    targetId: 'capture-checkbox-0',
    message: '별빛A-638을 선택하세요.',
    type: 'mouse',
    delayAfterClick: 1000,
  },
  {
    id: 'capture-checkbox-1',
    targetId: 'capture-checkbox-1',
    message: '별빛A-604를 선택하세요.',
    type: 'mouse',
    delayAfterClick: 1000,
  },
  {
    id: 'create-propagation-package',
    targetId: 'create-propagation-package-button',
    message: '포착한 정보를 토대로 전파의 초안을 AI가 생성합니다.',
    type: 'mouse',
    delayAfterClick: 1000,
  },
  {
    id: 'propagation-detail-tab',
    targetId: 'propagation-detail-tab',
    message: '상세 보기 탭을 클릭하세요.',
    type: 'mouse',
    delayAfterClick: 3000,
  },
  {
    id: 'send-propagation-package',
    targetId: 'send-propagation-package-button',
    message: '전파 패키지를 전송하세요.',
    type: 'mouse',
    delayAfterClick: 0,
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
  radiusConfirmed: boolean;
  agentChatHasUsan: boolean;
  agentChatSent: boolean;
  reSearchResult: boolean;
  reSearchExcludedAttributes: string[];
  reSearchProgressDone: boolean;
  objectTrackingStarted: boolean;
  objectTrackingCompleted: boolean;
  showPredictedCCTVList: boolean;
  showCaptureList: boolean;
  showPropagationList: boolean;
};

export const useMouseGuide = () => {
  const [showMouseGuide, setShowMouseGuide] = useState<boolean>(true);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [guideTarget, setGuideTarget] = useState<string | null>(null);
  const [guideMessage, setGuideMessage] = useState<string>('');
  const [guideType, setGuideType] = useState<GuideType>('mouse');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);

  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
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
    setGuideTarget(step.targetId);
    setGuideMessage(step.message);
    setGuideType(step.type);

    if (step.autoAdvanceDelay && step.autoAdvanceDelay > 0) {
      autoAdvanceTimerRef.current = setTimeout(() => {
        applyStep(index + 1);
      }, step.autoAdvanceDelay);
    }
  }, [clearTimers]);

  const advanceToNext = useCallback(() => {
    const currentStep = GUIDE_STEPS[currentStepIndex];

    setGuideTarget(null);
    setGuideMessage('');
    clearTimers();

    if (currentStep?.pauseAfterClick) {
      setCurrentStepIndex(currentStepIndex);
      return;
    }

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

  const jumpToStepByTarget = useCallback((targetId: string, delay = 0) => {
    const index = currentStepIndex >= 0
      ? GUIDE_STEPS.findIndex((s, i) => i > currentStepIndex && s.targetId === targetId)
      : GUIDE_STEPS.findIndex(s => s.targetId === targetId);

    const resolvedIndex = index === -1
      ? GUIDE_STEPS.findIndex(s => s.targetId === targetId)
      : index;

    if (resolvedIndex === -1) return;

    clearTimers();
    setGuideTarget(null);
    setGuideMessage('');

    if (delay > 0) {
      pendingTimerRef.current = setTimeout(() => {
        applyStep(resolvedIndex);
      }, delay);
    } else {
      applyStep(resolvedIndex);
    }
  }, [currentStepIndex, applyStep, clearTimers]);

  const syncToAppState = useCallback((appState: AppStateForSync) => {
    if (!showMouseGuide || currentStepIndex < 0) return;

    const currentStep = GUIDE_STEPS[currentStepIndex];
    if (!currentStep) return;

    const targetEl = document.getElementById(currentStep.targetId);
    if (targetEl) return;

    if (appState.showPropagationList) {
      jumpToStep('propagation-detail-tab');
      return;
    }
    if (appState.showCaptureList) {
      jumpToStep('capture-item-0');
      return;
    }
    if (appState.objectTrackingCompleted && appState.showPredictedCCTVList) {
      jumpToStep('predicted-cctv-7');
      return;
    }
    if (appState.objectTrackingStarted) {
      jumpToStep('object-tracking-confirm');
      return;
    }
    if (appState.reSearchResult && appState.reSearchProgressDone) {
      const isResultReSearchButton = appState.reSearchExcludedAttributes.some((a) => a.includes('대표 후보'));
      jumpToStep(isResultReSearchButton ? 'object-tracking-menu' : 'fast-search-candidate-10');
      return;
    }
    if (appState.agentChatSent) {
      return;
    }
    if (appState.agentChatHasUsan) {
      jumpToStep('agent-chat-send');
      return;
    }
    if (appState.radiusConfirmed) {
      jumpToStep('agent-chat-input');
      return;
    }
    if (appState.fastSearchProgressDone && !appState.reSearchInProgress) {
      jumpToStep('radius-chip');
      return;
    }
    if (appState.fastSearchStarted) {
      jumpToStep('fast-search-start');
      return;
    }
  }, [showMouseGuide, currentStepIndex, jumpToStep]);

  useEffect(() => {
    if (!showMouseGuide || currentStepIndex < 0) return;

    const currentStep = GUIDE_STEPS[currentStepIndex];
    if (!currentStep) return;

    const isPaused = currentStep.pauseAfterClick && !guideTarget;

    if (!isPaused && currentStep.id === 'agent-chat-input') {
      const checkInput = () => {
        const inputEl = document.getElementById('agent-chat-input') as HTMLTextAreaElement;
        if (inputEl && inputEl.value.includes('우산')) {
          advanceToNext();
        }
      };
      const interval = setInterval(checkInput, 200);
      return () => clearInterval(interval);
    }

    const handleGlobalClick = (e: MouseEvent) => {
      const clickedEl = e.target as HTMLElement;

      if (!isPaused) {
        const currentTargetEl = document.getElementById(currentStep.targetId);
        if (currentTargetEl && (currentTargetEl === clickedEl || currentTargetEl.contains(clickedEl))) {
          advanceToNext();
          return;
        }
      }

      for (let i = currentStepIndex + 1; i < GUIDE_STEPS.length; i++) {
        const futureStep = GUIDE_STEPS[i];
        const futureEl = document.getElementById(futureStep.targetId);
        if (futureEl && (futureEl === clickedEl || futureEl.contains(clickedEl))) {
          clearTimers();
          setGuideTarget(null);
          setGuideMessage('');

          if (futureStep.pauseAfterClick) {
            setCurrentStepIndex(i);
            return;
          }

          const delay = futureStep.delayAfterClick ?? 500;
          const nextIdx = i + 1;
          if (nextIdx >= GUIDE_STEPS.length) {
            setCurrentStepIndex(nextIdx);
            return;
          }
          if (delay > 0) {
            pendingTimerRef.current = setTimeout(() => {
              applyStep(nextIdx);
            }, delay);
          } else {
            applyStep(nextIdx);
          }
          return;
        }
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    return () => document.removeEventListener('click', handleGlobalClick, true);
  }, [showMouseGuide, currentStepIndex, guideTarget, advanceToNext, applyStep, clearTimers]);

  // 마우스 위치 추적
  useEffect(() => {
    if (!showMouseGuide) return;

    if (guideTarget) {
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
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [showMouseGuide, guideTarget]);

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

  const currentBubble: BubblePosition | undefined =
    currentStepIndex >= 0 && currentStepIndex < GUIDE_STEPS.length
      ? GUIDE_STEPS[currentStepIndex].bubble
      : undefined;

  return {
    showMouseGuide,
    setShowMouseGuide,
    mousePosition,
    guideTarget,
    guideMessage,
    guideType,
    currentStepIndex,
    currentBubble,
    setGuideTarget,
    setGuideMessage,
    setGuideType,
    applyStep,
    advanceToNext,
    jumpToStep,
    jumpToStepByTarget,
    syncToAppState,
    resetGuide,
    toggleGuide,
    totalSteps: GUIDE_STEPS.length,
  };
};
