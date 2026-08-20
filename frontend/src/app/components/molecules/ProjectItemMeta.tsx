import React, { CSSProperties } from 'react';
import { processInHtml } from '../../services/tagProcessorService';

interface ProjectItemMetaProps {
  title: string;
  description: string;
  link?: string;
  bullets?: string[];
  style?: {
    title?: CSSProperties;
    description?: CSSProperties;
    body?: CSSProperties;
  };
}

export const ProjectItemMeta: React.FC<ProjectItemMetaProps> = ({
  title,
  description,
  link,
  bullets = [],
  style
}) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-baseline flex-wrap gap-2">
        <h3 style={style?.title} className="text-sm font-bold text-slate-100 flex items-center gap-2">
          {title}
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              🔗 Link
            </a>
          )}
        </h3>
      </div>

      <p style={style?.description} className="text-xs italic text-cyan-400 font-medium mb-1">
        {description}
      </p>

      {bullets.length > 0 && (
        <ul className="list-disc pl-4 flex flex-col gap-1.5 text-sm text-justify text-slate-300">
          {bullets.map((bullet, idx) => (
            <li
              key={idx}
              style={style?.body}
              dangerouslySetInnerHTML={{ __html: processInHtml(bullet) }}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
