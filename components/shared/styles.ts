// 공통 컴포넌트 스타일 정의
// 이 파일을 수정하면 모든 컴포넌트에 일괄 적용됩니다.

// 컬러 팔레트
export const colorPalette = {
  // 배경 컬러
  background: {
    primary: '#161719',
    secondary: '#0f0f0f',
    tertiary: '#1a1a1a',
    hover: '#2a2a2a',
    border: '#31353a',
    card: '#36383B',
  },
  // 텍스트 컬러
  text: {
    primary: 'white',
    secondary: 'gray-300',
    tertiary: 'gray-400',
    muted: 'gray-500',
    disabled: 'gray-600',
  },
  // 액센트 컬러
  accent: {
    blue: {
      light: 'blue-400',
      base: 'blue-500',
      dark: 'blue-600',
      darker: 'blue-700',
    },
    red: {
      light: 'red-400',
      base: 'red-500',
      dark: 'red-600',
    },
    yellow: {
      light: 'yellow-400',
      base: 'yellow-500',
    },
    green: {
      base: 'green-600',
      dark: 'green-700',
    },
    purple: {
      light: 'purple-400',
      base: 'purple-500',
      dark: 'purple-600',
      darker: 'purple-700',
    },
    indigo: {
      base: 'indigo-600',
      dark: 'indigo-700',
    },
  },
};

// 폰트 사이즈
export const fontSizes = {
  xs: 'text-xs',      // 12px
  sm: 'text-sm',      // 14px
  base: 'text-base',   // 16px
  lg: 'text-lg',      // 18px
  xl: 'text-xl',      // 20px
  '2xl': 'text-2xl',  // 24px
  '3xl': 'text-3xl',  // 30px
};

// 폰트 웨이트
export const fontWeights = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export const buttonStyles = {
  primary: {
    base: "px-4 py-2 text-sm font-semibold transition-colors",
    active: "bg-blue-600 hover:bg-blue-700 text-white",
    inactive: "bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border border-[#2a2a2a]",
  },
  secondary: {
    base: "px-4 py-2 text-sm font-semibold transition-colors",
    active: "bg-blue-600 hover:bg-blue-700 text-white",
    inactive: "bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border border-[#2a2a2a]",
  },
  icon: {
    base: "w-10 h-10 flex items-center justify-center transition-colors",
    active: "bg-blue-600 hover:bg-blue-700 text-white",
    inactive: "bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border border-[#2a2a2a]",
  },
  gradient: {
    base: "px-4 py-2 text-sm font-semibold transition-all flex items-center justify-center gap-2",
    style: "bg-gradient-to-br from-[#7C62F0] to-[#5A3FEA] hover:from-[#8B72F5] hover:to-[#6A4FFA] text-white shadow-lg hover:shadow-xl",
  },
  recipient: {
    base: "px-3 py-1.5 text-sm font-medium transition-colors rounded",
    active: "bg-blue-600 hover:bg-blue-700 text-white",
    inactive: "bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 border border-[#2a2a2a]",
  },
};

export const cardStyles = {
  default: "bg-[#0f0f0f] border border-[#31353a] p-4 rounded",
  compact: "bg-[#0f0f0f] border border-[#31353a] p-2 rounded",
};

export const inputStyles = {
  default: "w-full px-4 py-3 bg-[#0f0f0f] border border-[#2a2a2a] text-white placeholder-gray-500 focus:outline-none focus:border-blue-500",
};

export const cctvIconStyles = {
  default: "w-7 h-7 bg-[#1a1a1a] border-2 border-gray-500 rounded-lg flex items-center justify-center shadow-xl relative hover:scale-110 transition-transform",
  active: "w-7 h-7 bg-[#1a1a1a] border-2 border-blue-500 rounded-lg flex items-center justify-center shadow-xl relative hover:scale-110 transition-transform",
  tracking: "w-7 h-7 bg-[#1a1a1a] border-2 border-red-500 rounded-lg flex items-center justify-center shadow-xl relative hover:scale-110 transition-transform",
  warning: "w-7 h-7 bg-[#1a1a1a] border-2 border-yellow-500 rounded-lg flex items-center justify-center shadow-xl relative hover:scale-110 transition-transform",
};

export const cctvLabelStyles = {
  base: "absolute top-full left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#1a1a1a] border rounded text-white text-xs whitespace-nowrap shadow-lg z-10",
  default: "border-gray-500",
  active: "border-blue-500",
  tracking: "border-red-500",
  warning: "border-yellow-500",
};

export const timelineTitleStyles = {
  base: "absolute top-full left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#1a1a1a] border rounded text-xs shadow-lg z-10 whitespace-normal break-words max-w-[300px] w-fit",
  default: "border-gray-500",
  active: "border-blue-500",
  tracking: "border-red-500",
  warning: "border-yellow-500",
};

export const cctvBadgeStyles = {
  base: "absolute -top-[18px] -right-[18px] w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-lg border-2 z-20",
  default: "bg-purple-500/90 border-purple-400",
  tracking: "bg-blue-500/90 border-blue-400",
};

export const cctvViewAngleStyles = {
  container: 'absolute pointer-events-none',
  svg: 'absolute top-0 left-0',
};

export const ptzButtonStyles = {
  base: "p-2 border border-[#31353a] text-white transition-colors",
  default: "bg-[#0f0f0f] hover:bg-[#2a2a2a]",
  active: "bg-blue-600",
  preset: {
    base: "w-12 h-12 border border-[#31353a] text-white transition-colors rounded-full text-xs flex items-center justify-center",
    default: "bg-[#0f0f0f] hover:bg-[#2a2a2a]",
    active: "bg-blue-600",
  },
};

// 헬퍼 함수들
export const getTabButtonClassName = (isActive: boolean) => {
  const base = buttonStyles.primary.base;
  const state = isActive ? buttonStyles.primary.active : buttonStyles.primary.inactive;
  const borderStyle = isActive ? '' : 'border border-[#2a2a2a]';
  return `${base} ${state} ${borderStyle}`.trim();
};

export const getPrimaryButtonClassName = () => {
  return `${buttonStyles.primary.base} ${buttonStyles.primary.active} flex items-center justify-center`.trim();
};

export const getSecondaryButtonClassName = () => {
  return `${buttonStyles.secondary.base} ${buttonStyles.secondary.inactive} flex items-center justify-center`.trim();
};

export const getIconButtonClassName = (isActive: boolean = false) => {
  const base = buttonStyles.icon.base;
  const state = isActive ? buttonStyles.icon.active : buttonStyles.icon.inactive;
  return `${base} ${state}`.trim();
};

export const getGradientButtonClassName = () => {
  return `${buttonStyles.gradient.base} ${buttonStyles.gradient.style}`.trim();
};

export const getRecipientButtonClassName = (isSelected: boolean = false) => {
  const base = buttonStyles.recipient.base;
  const state = isSelected ? buttonStyles.recipient.active : buttonStyles.recipient.inactive;
  return `${base} ${state}`.trim();
};

export const getCardClassName = (variant: 'default' | 'compact' = 'default') => {
  return cardStyles[variant];
};

export const getInputClassName = () => {
  return inputStyles.default;
};

export const getCCTVIconClassName = (variant: 'default' | 'active' | 'tracking' | 'warning' = 'default') => {
  return cctvIconStyles[variant];
};

export const getCCTVLabelClassName = (variant: 'default' | 'active' | 'tracking' | 'warning' = 'default') => {
  const base = cctvLabelStyles.base;
  const border = cctvLabelStyles[variant];
  return `${base} ${border}`.trim();
};

export const getCCTVBadgeClassName = (variant: 'default' | 'tracking' = 'default') => {
  const base = cctvBadgeStyles.base;
  const color = cctvBadgeStyles[variant];
  return `${base} ${color}`.trim();
};

export const getTimelineTitleClassName = (variant: 'default' | 'active' | 'tracking' | 'warning' = 'default', showCCTVName: boolean = false) => {
  const base = timelineTitleStyles.base;
  const border = timelineTitleStyles[variant];
  const marginClass = showCCTVName ? 'mt-8' : 'mt-1';
  return `${base} ${border} ${marginClass}`.trim();
};

export const getCCTVViewAngleClassName = () => {
  return cctvViewAngleStyles.container;
};

export const getPTZButtonClassName = (isActive: boolean = false) => {
  const base = ptzButtonStyles.base;
  const state = isActive ? ptzButtonStyles.active : ptzButtonStyles.default;
  return `${base} ${state}`.trim();
};

export const getPTZPresetButtonClassName = (isActive: boolean = false) => {
  const base = ptzButtonStyles.preset.base;
  const state = isActive ? ptzButtonStyles.preset.active : ptzButtonStyles.preset.default;
  return `${base} ${state}`.trim();
};
