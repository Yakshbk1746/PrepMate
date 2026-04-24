import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { APP_TOAST_EVENT } from '../../utils/toast';

const iconByType = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const styleByType = {
  success: 'border-emerald-200 dark:border-emerald-500/30',
  error: 'border-red-200 dark:border-red-500/30',
  info: 'border-blue-200 dark:border-blue-500/30',
};

const ToastHost = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const onToast = (event) => {
      const detail = event.detail || {};
      const id = Date.now() + Math.random();
      const duration = Number(detail.duration) > 0 ? Number(detail.duration) : 2600;

      setToasts((prev) => [...prev, { id, ...detail }]);

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    };

    window.addEventListener(APP_TOAST_EVENT, onToast);
    return () => window.removeEventListener(APP_TOAST_EVENT, onToast);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[70] space-y-2 pointer-events-none">
      {toasts.map((toast) => {
        const Icon = iconByType[toast.type] || Info;
        const styleClass = styleByType[toast.type] || styleByType.info;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto min-w-[280px] max-w-sm bg-white dark:bg-[#111827] border ${styleClass} shadow-lg rounded-xl p-3`}
          >
            <div className="flex items-start gap-2">
              <Icon size={18} className="mt-0.5 text-slate-600 dark:text-slate-300" />
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{toast.title || 'Notice'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{toast.message}</p>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== toast.id))}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ToastHost;
