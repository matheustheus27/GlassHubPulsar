import React, { CSSProperties } from 'react';
import { processInHtml } from '../../services/tagProcessorService';
import { GlassIcon } from '../atoms/GlassIcon';

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
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 style={style?.title} className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>{title}</span>
            {link && link !== '#' && (
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all no-underline shadow-sm backdrop-blur-md"
              >
                <GlassIcon name="🔗" size={10} className="p-0.5" />
                <span>Link</span>
              </a>
            )}
          </h3>
        </div>
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
