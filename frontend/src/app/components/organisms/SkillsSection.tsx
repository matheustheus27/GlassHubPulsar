import React, { CSSProperties } from 'react';
import { GlassSurface } from '../atoms/GlassSurface';
import { Heading } from '../atoms/Typography';
import { SkillCategoryGroup } from '../molecules/SkillCategoryGroup';

interface SkillItem {
  name: string;
  items: string[];
}

interface SkillsSectionProps {
  title: string;
  skills: SkillItem[];
  cardStyle?: CSSProperties;
  titleStyle?: CSSProperties;
  categoryTitleStyle?: CSSProperties;
  badgeStyle?: CSSProperties;
  borderColor?: string;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({
  title,
  skills,
  cardStyle,
  titleStyle,
  categoryTitleStyle,
  badgeStyle,
  borderColor
}) => {
  return (
    <GlassSurface style={cardStyle} glow="cyan" className="space-y-4">
      <Heading
        level={2}
        style={titleStyle}
        className="text-xs uppercase tracking-wider text-cyan-400 font-bold border-b border-white/10 pb-2"
      >
        {title}
      </Heading>

      <div className="flex flex-col gap-3">
        {skills.map((cat, idx) => (
          <SkillCategoryGroup
            key={cat.name}
            name={cat.name}
            items={cat.items}
            isLast={idx === skills.length - 1}
            borderColor={borderColor}
            titleStyle={categoryTitleStyle}
            badgeStyle={badgeStyle}
          />
        ))}
      </div>
    </GlassSurface>
  );
};
