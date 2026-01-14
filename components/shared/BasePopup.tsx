import React, { useEffect, ReactNode } from 'react';
import { Icon } from '@iconify/react';

interface BasePopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  titleIcon?: ReactNode;
  maxWidth?: string;
  maxHeight?: string;
  children: ReactNode;
  footer?: ReactNode;
  overlayClassName?: string;
  containerClassName?: string;
  onOverlayClick?: () => void;
  ariaLabel?: string;
}

export const BasePopup: React.FC<BasePopupProps> = ({
  isOpen,
  onClose,
  title,
  titleIcon,
  maxWidth = 'max-w-6xl',
  maxHeight = '120vh',
  children,
  footer,
  overlayClassName = 'bg-black/70',
  containerClassName,
  onOverlayClick,
  ariaLabel,
}) => {
  // ESC 키로 팝업 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (onOverlayClick) {
      onOverlayClick();
    } else if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 ${overlayClassName} flex items-center justify-center z-[9999] px-6`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || (typeof title === 'string' ? title : '팝업')}
      onClick={handleOverlayClick}
    >
      <div
        className={`bg-[#101013] border border-[#31353a] w-full ${maxWidth} flex flex-col shadow-lg ${
          containerClassName || ''
        }`}
        style={{ maxHeight, height: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-[#31353a] flex-shrink-0">
          <div className="flex items-center gap-2 text-base font-semibold text-white">
            {titleIcon}
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white focus:outline-none transition-colors"
            aria-label="팝업 닫기"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto min-h-0">{children}</div>

        {/* 푸터 */}
        {footer && (
          <div className="flex-shrink-0 border-t border-[#31353a]">{footer}</div>
        )}
      </div>
    </div>
  );
};
