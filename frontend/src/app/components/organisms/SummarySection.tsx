import React, { CSSProperties } from 'react';
import { GlassSurface } from '../atoms/GlassSurface';
import { Heading } from '../atoms/Typography';
import { processInHtml } from '../../services/tagProcessorService';

interface SummarySectionProps {
  title: string;
  summary: string;
  cardStyle?: CSSProperties;
  titleStyle?: CSSProperties;
  textStyle?: CSSProperties;
}

export const SummarySection: React.FC<SummarySectionProps> = ({
  title,
  summary,
  cardStyle,
  titleStyle,
  textStyle
}) => {
  return (
    <GlassSurface style={cardStyle} glow="cyan" className="space-y-3">
      <Heading
        level={2}
        style={titleStyle}
        className="text-xs uppercase tracking-wider text-cyan-400 font-bold border-b border-white/10 pb-2"
      >
        {title}
      </Heading>
      <p
        style={textStyle}
        className="text-sm text-justify leading-relaxed text-slate-300"
        dangerouslySetInnerHTML={{ __html: processInHtml(summary) }}
      />
    </GlassSurface>
  );
};
