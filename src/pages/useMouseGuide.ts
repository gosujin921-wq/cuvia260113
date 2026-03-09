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
    message: '실종 신고가 접수되었습니다.<br/>실종자 정보를 바탕으로 주변 CCTV 영상에서 대상을 빠르게 탐색할 수 있습니다.<br/><b>[고속검색 시작]</b> 버튼을 클릭해주세요.',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'review-candidates',
    targetId: 'fast-search-candidate-10',
    message: '실종자 특징을 기반으로 유사 후보를 탐색했습니다.<br/>검색 결과는 조건 조정과 사용자 피드백을 통해 더욱 정교하게 개선될 수 있습니다.<br/><br/><span style="opacity:0.7; font-weight:600;">직접 해볼 수 있는 기능</span><br/><span style="opacity:0.6">&nbsp;&nbsp;• 상단 반경을 클릭해 탐색 범위를 변경하기</span><br/><span style="opacity:0.6">&nbsp;&nbsp;• CUVIA Link에 비정형 조건 입력하기</span><br/><span style="opacity:0.5">&nbsp;&nbsp;&nbsp;&nbsp;예 : "회색 후드 입은 사람만 보여줘", "우산 쓴 사람은 제외해줘"</span><br/><span style="opacity:0.6">&nbsp;&nbsp;• 후보 카드에서 맞음 / 틀림 선택하기</span><br/><br/><b>[후보 카드]</b>를 클릭하면 다음 단계로 넘어갑니다.',
    type: 'eye',
    delayAfterClick: 0,
  },
  {
    id: 'candidate-detail',
    targetId: 'capture-target-button',
    message: '후보가 포착된 클립 영상을 확인하세요.<br/>CUVIA는 영상의 주요 장면을 VLM 기반 텍스트로 요약하고,<br/>신고 정보와 영상 정보를 비교해 유사도 점수를 제공합니다.<br/><br/><span style="opacity:0.7; font-weight:600;">직접 해볼 수 있는 기능</span><br/><span style="opacity:0.6">&nbsp;&nbsp;• 후보 클립 영상 확인</span><br/><span style="opacity:0.6">&nbsp;&nbsp;• 후보 메타 정보 확인 및 유사도 점수 확인</span><br/><br/><b>[대상 포착]</b> 버튼을 누르면 해당 인물을 대상으로 확정하고 다음 단계로 진행됩니다.',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'route-analysis',
    message: '포착된 대상을 기반으로 객체추적이 진행됩니다.<br/>대상이 나타난 CCTV와 포착 시각을 분석하여<br/>시간 흐름에 따른 이동 경로를 생성하고 지도 위에 표시합니다.<br/><br/>이 단계는 별도 조작 없이 자동으로 진행되며, 잠시 후 다음 단계로 넘어갑니다.',
    type: 'eye',
    delayAfterClick: 0,
  },
  {
    id: 'predicted-cctv',
    targetId: 'predicted-cctv-7',
    message: '마지막 포착 지점을 중심으로 주변 CCTV를 투망감시합니다.<br/>CUVIA는 마지막으로 포착된 CCTV와 이전 포착 지점의 영상을 함께 분석하여,<br/>VLM 기반으로 이동 방향, 보행 동선, 보행로 구조를 파악합니다.<br/><br/><b>[CCTV 카드]</b> 중 하나를 클릭하면 다음 단계로 이동합니다.',
    type: 'eye',
    delayAfterClick: 0,
  },
  {
    id: 'predicted-cctv-detail',
    targetId: 'predicted-target-found-button',
    message: '추천된 CCTV 영상에서 대상을 찾아보세요.<br/>CUVIA는 대상이 나타날 가능성이 높은 CCTV를 재생하고,<br/>찾아야 하는 객체의 속성과 함께 이 CCTV를 추천한 상세 근거를 제공합니다.<br/><br/><b>[대상 포착]</b> 버튼을 누르면 전파할 수 있는 전파 목록으로 이동합니다.',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'capture-list-review',
    targetId: 'create-propagation-package-button',
    message: '포착된 정보를 확인하고 전파 패키지를 생성하세요.<br/>CUVIA는 이전 단계에서 확보한 대상 정보를 모아<br/>공유할 정보를 선택하고 전파할 수 있도록 지원합니다.<br/><br/><span style="opacity:0.7; font-weight:600;">직접 해볼 수 있는 기능</span><br/><span style="opacity:0.6">&nbsp;&nbsp;• 포착된 대상 카드를 클릭해 시간대별 캡션 설명, 후보 메타 정보 등 상세 내용 확인</span><br/><span style="opacity:0.6">&nbsp;&nbsp;• 공유할 정보 선택</span><br/><span style="opacity:0.6">&nbsp;&nbsp;• 전파 패키지 생성 버튼 클릭</span><br/><br/><b>[전파 패키지 생성]</b> 버튼을 누르면 다음 단계로 진행됩니다.',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'propagation',
    targetId: 'send-propagation-package-button',
    message: '전파 패키지를 바탕으로 전파문을 작성하세요.<br/>CUVIA는 지금까지 선택한 클립, 포착 정보, 대상 정보를 종합해<br/>전파문 초안을 자동으로 생성합니다.<br/><br/><span style="opacity:0.7; font-weight:600;">직접 해볼 수 있는 기능</span><br/><span style="opacity:0.6">&nbsp;&nbsp;• AI 생성 전파문 초안 확인 및 수정</span><br/><span style="opacity:0.6">&nbsp;&nbsp;• 최인근 파출소 / 소방서 정보 확인</span><br/><br/><b>[전파 패키지 전송]</b> 버튼을 누르면 다음 단계인 전파 스레드로 이동합니다.',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'report-download',
    targetId: 'report-download-button',
    message: '전파 스레드에서 신고 및 전파 내역을 확인하세요.<br/>수신한 신고 정보와 보낸 전파 내용을 대화형 스레드 형태로 확인할 수 있습니다.<br/><br/><span style="opacity:0.7; font-weight:600;">직접 해볼 수 있는 기능</span><br/><span style="opacity:0.6">&nbsp;&nbsp;• 수신한 신고 정보, 보낸 전파 내용 확인</span><br/><span style="opacity:0.6">&nbsp;&nbsp;• 추가 요청 / 회신 내용 확인</span><br/><span style="opacity:0.6">&nbsp;&nbsp;• 경찰서 처리 결과 확인</span><br/><br/><b>[사건 처리 결과 보고서 다운로드]</b> 버튼을 누르면 다음 단계로 진행됩니다.',
    type: 'mouse',
    delayAfterClick: 500,
  },
  {
    id: 'report-result',
    targetId: 'report-pdf-button',
    message: 'AI가 사건 대응 전 과정을 종합해 최종 보고서를 생성합니다.<br/>지금까지의 모든 단계에서 확인한 내용과<br/>사용자가 선택한 정보, 수신·전송된 전파 내역을 바탕으로<br/>사건 처리 결과 보고서를 자동으로 작성합니다.<br/><br/><span style="opacity:0.7; font-weight:600;">직접 해볼 수 있는 기능</span><br/><span style="opacity:0.6">&nbsp;&nbsp;• AI가 작성한 최종 보고서 내용 확인</span><br/><span style="opacity:0.6">&nbsp;&nbsp;• 원하는 저장 형식 선택</span><br/><br/><b>[저장 형식]</b>을 선택하면 튜토리얼이 종료됩니다.',
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
    };

    updateTargetPosition();
    const interval = setInterval(updateTargetPosition, 100);
    return () => {
      clearInterval(interval);
      highlightedEl?.classList.remove('guide-target-highlight');
    };
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
