import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { useToast } from '../hooks/useToast';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  const getStyles = (type) => {
    const styles = {
      success: {
        bg: 'bg-navy-800 border-accent-mint/30 shadow-[0_0_15px_rgba(52,211,153,0.1)]',
        text: 'text-slate-200',
        icon: CheckCircle,
        iconColor: 'text-accent-mint',
        borderLeft: 'border-l-4 border-l-accent-mint'
      },
      error: {
        bg: 'bg-navy-800 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
        text: 'text-slate-200',
        icon: AlertCircle,
        iconColor: 'text-red-500',
        borderLeft: 'border-l-4 border-l-red-500'
      },
      warning: {
        bg: 'bg-navy-800 border-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.1)]',
        text: 'text-slate-200',
        icon: AlertTriangle,
        iconColor: 'text-amber-400',
        borderLeft: 'border-l-4 border-l-amber-400'
      },
      info: {
        bg: 'bg-navy-800 border-primary/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]',
        text: 'text-slate-200',
        icon: Info,
        iconColor: 'text-primary',
        borderLeft: 'border-l-4 border-l-primary'
      },
    };
    return styles[type] || styles.info;
  };

  return (
    <div className="fixed top-20 right-4 z-[100] space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const style = getStyles(toast.type);
        const Icon = style.icon;

        return (
          <div
            key={toast.id}
            className={`${style.bg} ${style.borderLeft} border-y border-r rounded-r-lg p-4 flex items-start gap-3 pointer-events-auto animate-in slide-in-from-right-full fade-in duration-300 shadow-lg`}
          >
            <Icon className={`${style.iconColor} shrink-0 mt-0.5`} size={20} />
            <p className={`${style.text} flex-1 text-sm font-medium leading-relaxed`}>
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-500 hover:text-white transition-colors shrink-0 p-1 hover:bg-white/10 rounded"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}