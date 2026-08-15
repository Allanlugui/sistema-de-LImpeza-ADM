import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div 
      id="toast-container" 
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-[#236838] shrink-0 mt-0.5" />,
            error: <AlertCircle className="w-5 h-5 text-[#D9534F] shrink-0 mt-0.5" />,
            warning: <AlertTriangle className="w-5 h-5 text-[#D4A373] shrink-0 mt-0.5" />,
            info: <Info className="w-5 h-5 text-[#5A7D6C] shrink-0 mt-0.5" />
          };

          const borderColors = {
            success: 'border-[#C3E6CC] bg-[#EBF6EE] text-[#16381E]',
            error: 'border-[#F8C8C6] bg-[#FDECEB] text-[#591C1A]',
            warning: 'border-[#FCE2B6] bg-[#FEF6E9] text-[#59390F]',
            info: 'border-[#DFE5DA] bg-[#EEF3ED] text-[#243029]'
          };

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm ${borderColors[toast.type]}`}
            >
              {icons[toast.type]}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm leading-tight mb-1">{toast.title}</h4>
                <p className="text-xs opacity-90 leading-relaxed">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg hover:bg-black/5 transition-colors opacity-70 hover:opacity-100 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
