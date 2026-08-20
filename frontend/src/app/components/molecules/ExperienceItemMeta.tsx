import React, { CSSProperties } from 'react';
import { processInHtml } from '../../services/tagProcessorService';

interface ExperienceItemMetaProps {
  company: string;
  position: string;
  period: string;
  bullets?: string[];
  style?: {
    company?: CSSProperties;
    role?: CSSProperties;
    meta?: CSSProperties;
    body?: CSSProperties;
  };
}

export const ExperienceItemMeta: React.FC<ExperienceItemMetaProps> = ({
  company,
  position,
  period,
  bullets = [],
  style
}) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-baseline flex-wrap gap-2">
        <h3 style={style?.company} className="text-sm font-bold text-slate-100">
          {company}
        </h3>
        <span style={style?.meta} className="text-xs font-semibold text-slate-400">
          {period}
        </span>
      </div>

      <p style={style?.role} className="text-xs italic text-cyan-400 font-medium mb-1">
        {position}
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
