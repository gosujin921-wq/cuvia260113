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
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center ${showDim ? 'bg-black/40' : ''}`}
      style={{ zIndex }}
      onClick={onCancel}
    >
      <div
        className="gradient-border-right-bottom rounded-lg overflow-hidden"
        style={{
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
          <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
            <Icon icon="mdi:information" className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-gray-900 font-semibold text-sm">{title}</h3>
        </div>

        <div className="px-6 py-3">
          <p
            className="text-gray-700 leading-relaxed"
            style={{ fontSize: '16px' }}
            dangerouslySetInnerHTML={{ __html: message }}
          />
        </div>

        <div className="flex items-center justify-center gap-3 px-6 pb-5 pt-1">
          {!hideCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white/60 border border-gray-300/50 hover:bg-white/80 transition-colors"
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
