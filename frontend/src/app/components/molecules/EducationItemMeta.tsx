import React, { CSSProperties } from 'react';
import { processInHtml } from '../../services/tagProcessorService';

interface EducationItemMetaProps {
  organization: string;
  degree: string;
  period: string;
  description?: string;
  style?: {
    org?: CSSProperties;
    degree?: CSSProperties;
    meta?: CSSProperties;
    body?: CSSProperties;
  };
}

export const EducationItemMeta: React.FC<EducationItemMetaProps> = ({
  organization,
  degree,
  period,
  description,
  style
}) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-baseline flex-wrap gap-2">
        <h3 style={style?.org} className="text-sm font-bold text-slate-100">
          {organization}
        </h3>
        <span style={style?.meta} className="text-xs font-semibold text-slate-400">
          {period}
        </span>
      </div>

      <p style={style?.degree} className="text-xs italic text-cyan-400 font-medium mb-1">
        {degree}
      </p>

      {description && (
        <p
          style={style?.body}
          className="text-sm text-justify text-slate-300"
          dangerouslySetInnerHTML={{ __html: processInHtml(description) }}
        />
      )}
    </div>
  );
};
