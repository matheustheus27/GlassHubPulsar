import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: 'cyan' | 'emerald' | 'amber' | 'violet';
  className?: string;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = 'cyan',
  className = '',
  showLabel = false
}) => {
  const safeProgress = Math.min(100, Math.max(0, progress));

  const colorClasses = {
    cyan: 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]',
    emerald: 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]',
    amber: 'bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]',
    violet: 'bg-gradient-to-r from-violet-500 to-fuchsia-400 shadow-[0_0_12px_rgba(139,92,246,0.5)]'
  }[color];

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-400 mb-1 font-medium">
          <span>Progresso</span>
          <span>{safeProgress}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden border border-white/5 p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorClasses}`}
          style={{ width: `${safeProgress}%` }}
        />
      </div>
    </div>
  );
};
