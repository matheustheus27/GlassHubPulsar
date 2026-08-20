import React, { CSSProperties } from 'react';
import { GlassSurface } from '../atoms/GlassSurface';
import { Heading } from '../atoms/Typography';
import { ProjectItemMeta } from '../molecules/ProjectItemMeta';

interface Project {
  title: string;
  description: string;
  link?: string;
  bullets: string[];
}

interface ProjectsSectionProps {
  title: string;
  projects: Project[];
  cardStyle?: CSSProperties;
  titleStyle?: CSSProperties;
  itemStyles?: {
    title?: CSSProperties;
    description?: CSSProperties;
    body?: CSSProperties;
  };
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  title,
  projects,
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
        {projects.map((proj, idx) => (
          <ProjectItemMeta
            key={idx}
            title={proj.title}
            description={proj.description}
            link={proj.link}
            bullets={proj.bullets}
            style={itemStyles}
          />
        ))}
      </div>
    </GlassSurface>
  );
};
