import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer = null }) {
  const modalRef = useRef(null);

  // 1. Handle Body Scroll & Escape Key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      const handleEsc = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  // 2. Use Portal to render outside the parent DOM hierarchy
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      
      {/* PERFORMANCE FIX: 
         Removed 'backdrop-blur-sm'. Animating blur is the #1 cause of modal lag.
         Increased opacity to 90% to maintain focus.
      */}
      <div 
        className="absolute inset-0 bg-navy-900/90 transition-opacity animate-in fade-in duration-200" 
        onClick={onClose} 
      />

      {/* PERFORMANCE FIX:
         Added 'will-change-transform' to force GPU acceleration.
      */}
      <div 
        ref={modalRef}
        className={`
          relative w-full bg-navy-800 rounded-xl shadow-2xl border border-navy-700 
          flex flex-col 
          animate-in zoom-in-95 fade-in slide-in-from-bottom-2 duration-200 
          will-change-transform
          ${sizeClasses[size]} max-h-[90vh]
        `}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-navy-700 p-5 shrink-0">
            <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-navy-700 p-2 rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar text-slate-300">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-navy-700 bg-navy-900/30 px-6 py-4 flex gap-3 justify-end rounded-b-xl shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body // Target container
  );
}