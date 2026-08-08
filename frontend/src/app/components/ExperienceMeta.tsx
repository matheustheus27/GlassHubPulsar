import React from 'react';

interface ExperienceMetaProps {
  company: string;
  date: string;
  role: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function ExperienceMeta({ company, date, role, children, style }: ExperienceMetaProps) {
  return (
    <div className="flex flex-col gap-1.5 text-inherit">
      {/* Header Row */}
      <div className="flex items-center justify-between w-full">
        <h3 className="text-[11pt] font-bold text-inherit">{company}</h3>
        <span style={style} className="text-[10pt] opacity-90">{date}</span>
      </div>
      
      {/* Role */}
      <p className="text-[10pt] font-semibold italic text-cyan-600 dark:text-cyan-400">{role}</p>
      
      {/* Optional Description */}
      {children && <div className="mt-2 text-inherit">{children}</div>}
    </div>
  );
}