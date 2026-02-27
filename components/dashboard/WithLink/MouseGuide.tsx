export type GuideType = 'mouse' | 'eye' | 'keyboard';

export type MouseGuideProps = {
  show: boolean;
  hideDuringProgress?: boolean;
  guideTarget: string | null;
  guideMessage: string;
  guideType: GuideType;
  mousePosition: { x: number; y: number };
};

const overlapPx = 3;

const getBoxTransform = (guideMessage: string) => {
  const isBelowLeft = guideMessage === '검색된 결과 확인 후 정형 검색 조건을 추가 입력하여 후보를 좁히거나 늘려보세요.';
  const isAboveLeft =
    guideMessage === '전송 버튼을 클릭하세요';
  const isAboveRight =
    guideMessage === '객체 추적 메뉴를 클릭하세요.' ||
    guideMessage === '포착한 대상의 정보를 확인하고 AI로 생성된 전파문 초안을 확인, 전파 패키지를 생성 및 전송합니다.';
  const isLeftAligned = isBelowLeft;

  if (isAboveLeft) return 'translateX(-100%)';
  if (isAboveRight || isLeftAligned) return 'translateX(0)';
  return 'translateX(-50%)';
};

const getTriangleStyle = (guideMessage: string) => {
  const isAlignRight = guideMessage === '전송 버튼을 클릭하세요';
  const isAlignLeft =
    guideMessage === '검색된 결과 확인 후 정형 검색 조건을 추가 입력하여 후보를 좁히거나 늘려보세요.' ||
    guideMessage === '객체 추적 메뉴를 클릭하세요.' ||
    guideMessage === '포착한 대상의 정보를 확인하고 AI로 생성된 전파문 초안을 확인, 전파 패키지를 생성 및 전송합니다.';

  if (isAlignRight) return { right: 0, left: 'auto' as const, transform: 'translateX(50%)' };
  if (isAlignLeft) return { left: 0, transform: 'translateX(-50%)' };
  return { left: '50%' as const, transform: 'translateX(-50%)' };
};

const triangleBase = {
  width: 0,
  height: 0,
  borderLeft: '12px solid transparent',
  borderRight: '12px solid transparent',
} as const;

const triangleInnerBase = {
  width: 0,
  height: 0,
  borderLeft: '10px solid transparent',
  borderRight: '10px solid transparent',
} as const;

export const MouseGuide = ({
  show,
  hideDuringProgress = false,
  guideTarget,
  guideMessage,
  guideType,
  mousePosition,
}: MouseGuideProps) => {
  if (!show || hideDuringProgress || !guideTarget) return null;

  const isBelowLeft = guideMessage === '검색된 결과 확인 후 정형 검색 조건을 추가 입력하여 후보를 좁히거나 늘려보세요.';
  const isAboveLeft = guideMessage === '전송 버튼을 클릭하세요';
  const isAboveRight =
    guideMessage === '객체 추적 메뉴를 클릭하세요.' ||
    guideMessage === '포착한 대상의 정보를 확인하고 AI로 생성된 전파문 초안을 확인, 전파 패키지를 생성 및 전송합니다.';

  const isLeftShifted = guideMessage === '객체 추적 메뉴를 클릭하세요.' ||
    guideMessage === '포착한 대상의 정보를 확인하고 AI로 생성된 전파문 초안을 확인, 전파 패키지를 생성 및 전송합니다.';
  const boxMargin = (() => {
    if (isBelowLeft) return { marginLeft: -20, marginRight: 20 };
    if (isAboveLeft) return { marginLeft: -20, marginRight: -20 };
    if (isLeftShifted) return { marginLeft: -20, marginRight: 20 };
    if (isAboveRight) return { marginLeft: 20, marginRight: 20 };
    return { marginLeft: 0, marginRight: 0 };
  })();

  const triangleStyle = getTriangleStyle(guideMessage);

  return (
    <div
      className="fixed pointer-events-none z-[10010]"
      style={{
        left: `${mousePosition.x}px`,
        top: `${mousePosition.y}px`,
      }}
    >
      {guideType !== 'eye' && (
        <div
          className="absolute"
          style={{
            left: '0',
            top: '0',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className={`w-7 h-7 rounded-full animate-guide-circle-pulse ${guideTarget === 'agent-chat-input' ? 'bg-[#ff00ff]/80' : 'bg-white/80'}`}
            style={{
              boxShadow:
                guideTarget === 'agent-chat-input'
                  ? '0 0 15px rgba(255, 0, 255, 0.9), 0 0 30px rgba(255, 0, 255, 0.6)'
                  : '0 0 15px rgba(255, 255, 255, 0.9), 0 0 30px rgba(255, 255, 255, 0.6)',
            }}
          />
        </div>
      )}

      {guideMessage && (
        <div
          key={guideMessage}
          className="absolute animate-fade-in"
          style={{
            left: '0',
            bottom: isBelowLeft ? undefined : '20px',
            top: isBelowLeft ? '20px' : undefined,
            transform: getBoxTransform(guideMessage),
          }}
        >
          <div className="relative">
            {isBelowLeft ? (
              <>
                <div
                  className="absolute"
                  style={{
                    ...triangleStyle,
                    bottom: '100%',
                    marginBottom: `-${overlapPx}px`,
                    ...triangleBase,
                    borderBottom: '12px solid rgb(217 70 239)',
                  }}
                  aria-hidden
                />
                <div
                  className="absolute"
                  style={{
                    ...triangleStyle,
                    bottom: '100%',
                    marginBottom: `-${overlapPx - 1}px`,
                    ...triangleInnerBase,
                    borderBottom: '10px solid white',
                  }}
                  aria-hidden
                />
              </>
            ) : (
              <>
                <div
                  className="absolute"
                  style={{
                    ...triangleStyle,
                    top: '100%',
                    marginTop: `-${overlapPx}px`,
                    ...triangleBase,
                    borderTop: '12px solid rgb(217 70 239)',
                  }}
                  aria-hidden
                />
                <div
                  className="absolute"
                  style={{
                    ...triangleStyle,
                    top: '100%',
                    marginTop: `-${overlapPx - 1}px`,
                    ...triangleInnerBase,
                    borderTop: '10px solid white',
                  }}
                  aria-hidden
                />
              </>
            )}
            <div
              className="bg-white border-2 border-fuchsia-500 rounded-xl px-4 py-2 relative z-10"
              style={{
                boxShadow: '0 0 12px rgba(217, 70, 239, 0.4)',
                marginLeft: `${boxMargin.marginLeft}px`,
                marginRight: `${boxMargin.marginRight}px`,
              }}
            >
              <div className="text-gray-700 text-sm font-bold flex items-center gap-2 whitespace-nowrap">
                <span className="text-xl flex-shrink-0">
                  {guideType === 'mouse' ? '👆' : guideType === 'eye' ? '👀' : '⌨️'}
                </span>
                <span dangerouslySetInnerHTML={{ __html: guideMessage }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
