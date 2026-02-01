interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getConfirmButtonClass = () => {
    const baseClass = 'px-5 py-2.5 rounded border border-transparent text-base font-medium cursor-pointer transition-colors';
    switch (variant) {
      case 'danger':
        return `${baseClass} bg-red-500 text-white hover:bg-red-600`;
      case 'warning':
        return `${baseClass} bg-yellow-500 text-white hover:bg-yellow-600`;
      case 'info':
        return `${baseClass} bg-primary text-white hover:bg-primary-hover`;
      default:
        return `${baseClass} bg-primary text-white hover:bg-primary-hover`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-dark-surface rounded-lg shadow-2xl max-w-md w-full mx-4 border border-dark-border animate-[slideIn_0.3s_ease-out]">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">{title}</h2>
          <p className="text-gray-300 mb-6 whitespace-pre-line leading-relaxed">{message}</p>
          <div className="flex gap-3 justify-end">
            {cancelText && (
              <button
                onClick={onCancel}
                className="px-5 py-2.5 rounded border border-dark-border text-base font-medium bg-dark-surface-hover text-white cursor-pointer transition-colors hover:bg-dark-border"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={onConfirm}
              className={getConfirmButtonClass()}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
