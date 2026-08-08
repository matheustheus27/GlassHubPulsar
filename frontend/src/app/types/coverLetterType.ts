import { Locale } from './translationType';

export interface CoverLetterDetails {
  greeting: string;
  text: Array<string>;
  signature: string;
  valediction: string;
}

export interface ResumeExportOptions {
  locale: Locale;
  theme: 'light' | 'dark';
  fileName?: string;
}