// src/app/services/exportService.ts
import { buildResumePayload } from '../export/buildResumePayload';
import { buildCoverPayload } from '../export/buildCoverPayload';
import { GetResumeLabel, GetCoverLabel } from '../components/LanguageSelector';
import { LanguageCode } from '../data/LanguagesData';
import { Settings } from '../types/settingsType';

interface settingsService {
  activeTab: string;
  lang: LanguageCode;
  isLight: boolean;
  styles: Settings;
  candidateName: string;
}

export async function exportDocumentToPDF({
  activeTab,
  lang,
  isLight,
  styles,
  candidateName
}: ExportParams): Promise<void> {
  // Build payload according to selected tab
  const payload = activeTab === 'resume' 
    ? buildResumePayload(lang, isLight, styles) 
    : buildCoverPayload(lang, isLight, styles);

  const response = await fetch(`http://localhost:3001/pdf/export?type=${activeTab}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Export failed');
  }

  // Process blob response
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  // Format file name
  const formattedName = candidateName
    .trim()
    .toLowerCase()
    .replace(/^(\w+)\s+(?:.*\s+)?(\w+)$/, (_, p1, p2) => {
      const first = p1.charAt(0).toUpperCase() + p1.slice(1);
      const last = p2.charAt(0).toUpperCase() + p2.slice(1);
      return `${first}_${last}`;
    });

  const docType = (activeTab === 'cover' ? GetCoverLabel(lang) : GetResumeLabel(lang));

  // Trigger browser download
  const link = document.createElement("a");
  link.href = url;
  link.download = `${docType.replace(/\s+/g, "_")}_${formattedName}_${lang}.pdf`;
  link.click();
  
  URL.revokeObjectURL(url);
}