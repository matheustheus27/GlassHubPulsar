import React from 'react';
import { processInHtml } from '../services/tagProcessorService';

interface StyleProps {
  common: React.CSSProperties;
  signature: React.CSSProperties;
}

interface CoverLetterProps {
  greeting: string;
  text: Array<string>;
  signature: string;
  valediction: string;
  style: StyleProps;
}

export function CoverLetterMeta({ greeting, text, signature, valediction, style }: CoverLetterProps) {
  return (
    <div 
      className="text-sm text-justify leading-relaxed mt-4 space-y-4"
      style={style.common}
    >
      <p>{greeting}</p>
      
      <div dangerouslySetInnerHTML={{ __html: text.map((line) => `<p>${processInHtml(line)}</p><br>`).join('') }} />  

      <br></br>

      <div className="signature">
          <p className="valediction" style={{ marginBottom: '5pt' }}>{valediction}</p>
          <p className="author-name" style={style.signature}>{signature}</p>
      </div>
    </div>
  );
}