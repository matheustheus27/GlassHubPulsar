import React, { CSSProperties } from 'react';

interface ContactLinkBadgeProps {
  title: string;
  link?: string;
  icon?: string;
  style?: CSSProperties;
  className?: string;
}

export const ContactLinkBadge: React.FC<ContactLinkBadgeProps> = ({
  title,
  link,
  icon = '🔗',
  style,
  className = ''
}) => {
  const content = (
    <span
      style={style}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer border shadow-sm ${className}`}
    >
      <span className="text-sm shrink-0">{icon}</span>
      <span className="truncate">{title}</span>
    </span>
  );

  if (link && link !== '#') {
    return (
      <a href={link} target="_blank" rel="noreferrer" className="no-underline">
        {content}
      </a>
    );
  }

  return content;
};
