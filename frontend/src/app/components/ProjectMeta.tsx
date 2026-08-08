import React from 'react';

interface ProjectMetaProps {
  title: string;
  role: string;
  link?: string;
  children?: React.ReactNode;
}

export function ProjectMeta({ title, role, link, children }: ProjectMetaProps) {
  return (
    <div className="flex flex-col gap-1.5 text-inherit">
      {/* Header Row */}
      <div className="flex items-center justify-between w-full">
        <a href={link} target="_blank" rel="noopener noreferrer">
          <h3 className="text-[11pt] font-bold text-inherit">{title}</h3>
        </a>
      </div>
      
      {/* Role */}
      <p className="text-[10pt] font-semibold italic text-cyan-600 dark:text-cyan-400">{role}</p>

      {/* Optional Description */}
      {children && <div className="mt-2 text-inherit">{children}</div>}
    </div>
  );
}