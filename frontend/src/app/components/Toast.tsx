import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  duration?: number;
  onClose?: () => void;
  className?: string;
}

export function Toast({ message, type, duration = 5000, onClose, className = '' }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const bgColor = type === 'success' 
    ? 'bg-emerald-950/90 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.25)]' 
    : 'bg-rose-950/90 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.25)]';
  
  const textColor = type === 'success' 
    ? 'text-emerald-200' 
    : 'text-rose-200';
  
  const icon = type === 'success' ? '✓' : '✕';

  return (
    <div 
      className={`
        w-full
        px-5 py-3.5 
        rounded-xl 
        border 
        backdrop-blur-2xl 
        flex items-center gap-3 
        text-xs font-semibold 
        shadow-2xl
        pointer-events-auto
        transition-all duration-300
        animate-in fade-in slide-in-from-bottom-2
        ${bgColor}
        ${textColor}
        ${className}
        print:hidden
      `.trim()}
    >
      <span className="text-base font-black flex-shrink-0">{icon}</span>
      <span className="flex-1 leading-snug">{message}</span>
      {onClose && (
        <button
          onClick={() => {
            setIsVisible(false);
            onClose();
          }}
          className="text-slate-400 hover:text-white text-xs p-1 rounded hover:bg-white/10 transition cursor-pointer flex-shrink-0 ml-1"
          aria-label="Fechar notificação"
        >
          ✕
        </button>
      )}
    </div>
  );
}
