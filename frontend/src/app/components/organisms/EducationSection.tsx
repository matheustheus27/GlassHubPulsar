import React, { CSSProperties } from 'react';
import { GlassSurface } from '../atoms/GlassSurface';
import { Heading } from '../atoms/Typography';
import { EducationItemMeta } from '../molecules/EducationItemMeta';

interface Education {
  organization: string;
  degree: string;
  period: string;
  description: string;
}

interface EducationSectionProps {
  title: string;
  educations: Education[];
  cardStyle?: CSSProperties;
  titleStyle?: CSSProperties;
  itemStyles?: {
    org?: CSSProperties;
    degree?: CSSProperties;
    meta?: CSSProperties;
    body?: CSSProperties;
  };
}

export const EducationSection: React.FC<EducationSectionProps> = ({
  title,
  educations,
  cardStyle,
  titleStyle,
  itemStyles
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

      <div className="flex flex-col gap-6 mt-2">
        {educations.map((edu, idx) => (
          <EducationItemMeta
            key={idx}
            organization={edu.organization}
            degree={edu.degree}
            period={edu.period}
            description={edu.description}
            style={itemStyles}
          />
        ))}
      </div>
    </GlassSurface>
  );
};
