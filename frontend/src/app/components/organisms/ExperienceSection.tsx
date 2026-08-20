import React, { CSSProperties } from 'react';
import { GlassSurface } from '../atoms/GlassSurface';
import { Heading } from '../atoms/Typography';
import { ExperienceItemMeta } from '../molecules/ExperienceItemMeta';

interface Experience {
  company: string;
  position: string;
  period: string;
  bullets: string[];
}

interface ExperienceSectionProps {
  title: string;
  experiences: Experience[];
  cardStyle?: CSSProperties;
  titleStyle?: CSSProperties;
  itemStyles?: {
    company?: CSSProperties;
    role?: CSSProperties;
    meta?: CSSProperties;
    body?: CSSProperties;
  };
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  title,
  experiences,
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
        {experiences.map((exp, idx) => (
          <ExperienceItemMeta
            key={idx}
            company={exp.company}
            position={exp.position}
            period={exp.period}
            bullets={exp.bullets}
            style={itemStyles}
          />
        ))}
      </div>
    </GlassSurface>
  );
};
