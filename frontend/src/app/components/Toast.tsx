import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
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
    ? 'bg-emerald-500/20 border-emerald-500/50' 
    : 'bg-red-500/20 border-red-500/50';
  
  const textColor = type === 'success' 
    ? 'text-emerald-300' 
    : 'text-red-300';
  
  const icon = type === 'success' ? '✓' : '✕';

  return (
    <div 
      className={`
        fixed bottom-24 right-6 z-50
        max-w-sm 
        px-6 py-4 
        rounded-xl 
        border 
        backdrop-blur-xl 
        flex items-center gap-3 
        text-sm font-medium 
        animate-in fade-in slide-in-from-bottom-4 
        duration-300
        ${bgColor}
        ${textColor}
        print:hidden
      `.trim()}
    >
      <span className="text-lg font-bold">{icon}</span>
      <span>{message}</span>
    </div>
  );
}
