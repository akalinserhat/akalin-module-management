/**
 * @akalin/module_management - UndoNotificationBar (Geri Al Bildirim Çubuğu)
 * Değişiklik veya sıralama işlemlerinde ekranın altında zarifçe açılan ve süre göstergeli geri al seçeneği sunan bildirim bileşeni.
 */

import React, { useEffect, useState } from 'react';
import { RotateCcw, X, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface UndoNotificationBarProps {
  message: string;
  duration?: number;
  onUndo: () => void;
  onDismiss: () => void;
  icon?: React.ReactNode;
}

export const UndoNotificationBar: React.FC<UndoNotificationBarProps> = ({
  message,
  duration = 4500,
  onUndo,
  onDismiss,
  icon
}) => {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPercent = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remainingPercent);
      if (elapsed >= duration) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, onDismiss]);

  return (
    <div className="undo-delete-bar undo-save-bar" role="status" aria-live="polite">
      <div className="undo-delete-inner">
        <div className="undo-delete-info">
          <div className="undo-delete-icon undo-save-icon">
            {icon || <CheckCircle2 size={16} />}
          </div>
          <span className="undo-delete-text">
            <strong>{message}</strong>
          </span>
        </div>
        <div className="undo-delete-actions">
          <button
            type="button"
            className="undo-delete-btn"
            onClick={onUndo}
            title={t('geri_al', 'Geri Al')}
          >
            <RotateCcw size={14} />
            <span>{t('geri_al', 'Geri Al')}</span>
          </button>
          <button
            type="button"
            className="undo-delete-dismiss-btn"
            onClick={onDismiss}
            title={t('kapat', 'Kapat')}
          >
            <X size={15} />
          </button>
        </div>
      </div>
      <div className="undo-delete-progress-track">
        <div
          className="undo-delete-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default UndoNotificationBar;
