import React, { CSSProperties } from 'react';

interface GlassSurfaceProps {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  glow?: 'cyan' | 'violet' | 'emerald' | 'none';
  onClick?: () => void;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  className = '',
  style,
  glow = 'none',
  onClick
}) => {
  const glowClass = {
    cyan: 'hover:shadow-[0_0_25px_-5px_rgba(6,182,212,0.4)]',
    violet: 'hover:shadow-[0_0_25px_-5px_rgba(139,92,246,0.4)]',
    emerald: 'hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.4)]',
    none: ''
  }[glow];

  return (
    <div
      onClick={onClick}
      style={style}
      className={`rounded-xl p-5 md:p-6 backdrop-blur-xl border border-white/10 transition-all duration-300 ${glowClass} ${className}`}
    >
      {children}
    </div>
  );
};
