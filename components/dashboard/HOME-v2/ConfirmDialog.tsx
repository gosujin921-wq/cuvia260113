import React from 'react';
import { Icon } from '@iconify/react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  hideCancel?: boolean;
  showDim?: boolean;
  zIndex?: number;
  variant?: 'glass' | 'dark';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  hideCancel = false,
  showDim = false,
  zIndex = 10000,
  variant = 'glass',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isDark = variant === 'dark';

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center ${showDim ? 'bg-black/40' : ''}`}
      style={{ zIndex }}
      onClick={onCancel}
    >
      <div
        className={`rounded-lg overflow-hidden ${isDark ? '' : 'gradient-border-right-bottom'}`}
        style={isDark ? {
          background: 'rgba(30, 30, 30, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 24px 0 rgba(0, 0, 0, 0.5)',
          width: '400px',
        } : {
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 4px 24px 0 rgba(31, 38, 135, 0.15)',
          width: '400px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-2 flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-blue-500/20' : 'bg-blue-500/15'}`}>
            <Icon icon="mdi:information" className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        </div>

        <div className="px-6 py-3">
          <p
            className={`leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            style={{ fontSize: '16px' }}
            dangerouslySetInnerHTML={{ __html: message }}
          />
        </div>

        <div className="flex items-center justify-center gap-3 px-6 pb-5 pt-1">
          {!hideCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'text-gray-300 bg-white/10 border border-white/10 hover:bg-white/20' : 'text-gray-700 bg-white/60 border border-gray-300/50 hover:bg-white/80'}`}
            >
              {cancelText}
            </button>
          )}
          <button
            id="object-tracking-confirm-button"
            type="button"
            onClick={onConfirm}
            className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
