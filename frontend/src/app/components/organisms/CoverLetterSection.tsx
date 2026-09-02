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
  const paragraphs = Array.isArray(text)
    ? text
    : (typeof text === 'string' && (text as string).trim() ? [text] : []);

  return (
    <GlassSurface style={cardStyle} glow="cyan" className="space-y-4 leading-relaxed">
      {greeting && (
        <p style={{ ...bodyStyle, whiteSpace: 'pre-wrap' }} className="text-sm font-semibold text-slate-200">
          {greeting}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {paragraphs.map((paragraph, idx) => (
          <p
            key={idx}
            style={{ ...bodyStyle, whiteSpace: 'pre-wrap' }}
            className="text-sm text-justify text-slate-300 leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: processInHtml(paragraph).replace(/\n/g, '<br />') }}
          />
        ))}
      </div>

      <div className="pt-4 space-y-1">
        {valediction && (
          <p style={{ ...bodyStyle, whiteSpace: 'pre-wrap' }} className="text-sm text-slate-300">
            {valediction}
          </p>
        )}
        {signature && (
          <p style={signatureStyle} className="text-base font-bold text-cyan-400">
            {signature}
          </p>
        )}
      </div>
    </GlassSurface>
  );
};
