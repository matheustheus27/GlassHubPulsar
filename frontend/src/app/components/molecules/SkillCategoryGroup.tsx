import React, { CSSProperties } from 'react';
import { Badge } from '../atoms/Badge';

interface SkillCategoryGroupProps {
  name: string;
  items: string[];
  isLast?: boolean;
  borderColor?: string;
  titleStyle?: CSSProperties;
  badgeStyle?: CSSProperties;
}

export const SkillCategoryGroup: React.FC<SkillCategoryGroupProps> = ({
  name,
  items,
  isLast = false,
  borderColor = 'rgba(255, 255, 255, 0.1)',
  titleStyle,
  badgeStyle
}) => {
  return (
    <div
      className="pb-3"
      style={{ borderBottom: !isLast ? `1px solid ${borderColor}` : 'none' }}
    >
      <h4
        style={titleStyle}
        className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2"
      >
        {name}
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {items.map(skill => (
          <Badge key={skill} style={badgeStyle} variant="glass">
            {skill}
          </Badge>
        ))}
      </div>
    </div>
  );
};
