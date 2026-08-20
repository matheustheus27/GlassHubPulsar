import React, { CSSProperties } from 'react';

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const Heading: React.FC<TypographyProps & { level?: 1 | 2 | 3 | 4 }> = ({
  children,
  level = 1,
  className = '',
  style
}) => {
  const baseClasses = "tracking-tight font-extrabold";
  if (level === 1) return <h1 style={style} className={`text-2xl md:text-3xl ${baseClasses} ${className}`}>{children}</h1>;
  if (level === 2) return <h2 style={style} className={`text-lg md:text-xl ${baseClasses} ${className}`}>{children}</h2>;
  if (level === 3) return <h3 style={style} className={`text-base font-bold ${className}`}>{children}</h3>;
  return <h4 style={style} className={`text-sm font-bold ${className}`}>{children}</h4>;
};

export const Subheading: React.FC<TypographyProps> = ({ children, className = '', style }) => (
  <p
    style={style}
    className={`text-xs uppercase tracking-widest font-black ${className}`}
  >
    {children}
  </p>
);

export const Text: React.FC<TypographyProps & { variant?: 'body' | 'caption' | 'meta' }> = ({
  children,
  variant = 'body',
  className = '',
  style
}) => {
  const variantClass = {
    body: 'text-sm leading-relaxed text-slate-300',
    caption: 'text-xs text-slate-400',
    meta: 'text-xs font-semibold text-slate-400'
  }[variant];

  return (
    <div style={style} className={`${variantClass} ${className}`}>
      {children}
    </div>
  );
};

export const GradientText: React.FC<TypographyProps & { from?: string; to?: string }> = ({
  children,
  from = 'from-cyan-400',
  to = 'to-indigo-400',
  className = '',
  style
}) => (
  <span
    style={style}
    className={`bg-gradient-to-r ${from} ${to} bg-clip-text text-transparent font-extrabold ${className}`}
  >
    {children}
  </span>
);
