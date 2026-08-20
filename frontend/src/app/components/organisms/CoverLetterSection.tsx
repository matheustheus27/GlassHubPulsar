import React, { CSSProperties } from 'react';
import { GlassSurface } from '../atoms/GlassSurface';
import { processInHtml } from '../../services/tagProcessorService';

interface CoverLetterSectionProps {
  greeting: string;
  text: string[];
  valediction: string;
  signature: string;
  cardStyle?: CSSProperties;
  bodyStyle?: CSSProperties;
  signatureStyle?: CSSProperties;
}

export const CoverLetterSection: React.FC<CoverLetterSectionProps> = ({
  greeting,
  text = [],
  valediction,
  signature,
  cardStyle,
  bodyStyle,
  signatureStyle
}) => {
  return (
    <GlassSurface style={cardStyle} glow="cyan" className="space-y-4 leading-relaxed">
      <p style={bodyStyle} className="text-sm font-medium text-slate-200">
        {greeting}
      </p>

      <div className="flex flex-col gap-3">
        {text.map((paragraph, idx) => (
          <p
            key={idx}
            style={bodyStyle}
            className="text-sm text-justify text-slate-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: processInHtml(paragraph) }}
          />
        ))}
      </div>

      <div className="pt-4 space-y-1">
        <p style={bodyStyle} className="text-sm text-slate-300">
          {valediction}
        </p>
        <p style={signatureStyle} className="text-base font-bold text-cyan-400">
          {signature}
        </p>
      </div>
    </GlassSurface>
  );
};
