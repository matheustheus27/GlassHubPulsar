import React, { CSSProperties } from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'glass' | 'cyan' | 'emerald' | 'amber' | 'violet';
  className?: string;
  style?: CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'glass',
  className = '',
  style
}) => {
  const variantClasses = {
    glass: 'bg-slate-800/60 text-slate-200 border-slate-700/60 hover:border-cyan-500/40',
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    violet: 'bg-violet-500/10 text-violet-300 border-violet-500/30'
  }[variant];

  return (
    <span
      style={style}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border backdrop-blur-sm transition-all duration-200 select-none ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};
