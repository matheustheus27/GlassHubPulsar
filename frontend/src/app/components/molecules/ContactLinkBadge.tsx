import React, { CSSProperties } from 'react';
import { GlassIcon } from '../atoms/GlassIcon';

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
  const primaryIconColor = (style as any)?.iconColor || style?.color;
  const iconColorStyle = primaryIconColor ? { color: primaryIconColor, borderColor: `${primaryIconColor}50` } : undefined;

  const content = (
    <span
      style={style}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer border shadow-sm backdrop-blur-md hover:scale-105 ${className}`}
    >
      <GlassIcon name={icon} size={13} className="p-1" style={iconColorStyle} />
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
