import React, { useEffect, ReactNode } from 'react';
import { Icon } from '@iconify/react';

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  titleIcon?: ReactNode;
  width?: string;
  position?: 'bottom-right' | 'center';
  children: ReactNode;
  footer?: ReactNode;
  overlayClassName?: string;
  containerClassName?: string;
  onOverlayClick?: () => void;
  ariaLabel?: string;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({
  isOpen,
  onClose,
  title,
  titleIcon,
  width = 'w-[420px]',
  position = 'bottom-right',
  children,
  footer,
  overlayClassName = 'bg-black/50',
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

  const positionClasses =
    position === 'bottom-right'
      ? 'absolute bottom-6 right-6'
      : 'fixed inset-0 flex items-center justify-center';

  return (
    <div
      className={`${positionClasses} ${overlayClassName} z-[9999]`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title}
      onClick={handleOverlayClick}
    >
      <div
        className={`bg-[#101013] border border-[#31353a] shadow-xl ${width} flex flex-col ${
          containerClassName || ''
        }`}
        style={{ borderWidth: '1px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          className="flex items-center justify-between p-4 border-b border-[#31353a]"
          style={{ borderBottomWidth: '1px' }}
        >
          <div className="flex items-center gap-2 text-base font-semibold text-white">
            {titleIcon}
            <h3>{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors focus:outline-none"
            aria-label="닫기"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1">{children}</div>

        {/* 푸터 */}
        {footer && (
          <div
            className="border-t border-[#31353a]"
            style={{ borderTopWidth: '1px' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
