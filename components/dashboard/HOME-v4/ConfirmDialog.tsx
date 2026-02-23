import React from 'react';
import { Icon } from '@iconify/react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  hideCancel?: boolean;
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
  zIndex = 10000,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center"
      style={{ zIndex }}
      onClick={onCancel}
    >
      <div
        className="bg-[#1a1a1a] border border-[#31353a] rounded-lg shadow-2xl overflow-hidden"
        style={{
          width: '420px',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#31353a]">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Icon icon="mdi:information" className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-white font-semibold text-base flex-1">{title}</h3>
        </div>

        {/* 메시지 */}
        <div className="px-5 py-5">
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* 버튼 */}
        <div className={`flex gap-2 px-5 py-4 bg-[#0f0f0f]/50 border-t border-[#31353a] ${hideCancel ? 'justify-end' : ''}`}>
          {!hideCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 bg-[#2a2a2a] hover:bg-[#323232] border border-[#3a3a3a] transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            id="object-tracking-confirm-button"
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors ${hideCancel ? 'flex-1' : 'flex-1'}`}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
