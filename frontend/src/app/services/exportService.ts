// src/app/services/exportService.ts
import { LanguageCode } from '../utils/defaultSettings';
import { Settings } from '../types/settingsType';

interface ExportParams {
  activeTab: string;
  lang: LanguageCode;
  isLight: boolean;
  styles: Settings;
  candidateName: string;
  documentPayload?: any;
}

export async function exportDocumentToPDF({
  activeTab,
  lang,
  isLight,
  styles,
  candidateName,
  documentPayload
}: ExportParams): Promise<void> {
  const payload = documentPayload || {
    language: lang,
    styles,
    type: activeTab
  };

  const response = await fetch(`/api/pdf/export?type=${activeTab}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errorMsg = 'Export failed';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  // Process blob response
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  // Format file name: NAME_LASTNAME-pt-BR.pdf
  const clean = String(candidateName || 'CURRICULO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-zA-Z0-9\s_-]/g, '');

  const toTitleCase = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  const parts = clean.split(/\s+/).filter(Boolean);
  let namePart = 'Candidato';
  if (parts.length === 1) {
    namePart = toTitleCase(parts[0]);
  } else if (parts.length >= 2) {
    const firstName = toTitleCase(parts[0]);
    const lastName = toTitleCase(parts[parts.length - 1]);
    namePart = `${firstName}_${lastName}`;
  }

  const cleanLang = (lang || 'pt-BR').trim();
  const isEn = cleanLang.toLowerCase().startsWith("en");
  const isEs = cleanLang.toLowerCase().startsWith("es");
  const prefix = isEn ? "Resume" : (isEs ? "Curriculum" : "Curriculo");

  const fileName = `${prefix}_${namePart}_${cleanLang}.pdf`;

  // Trigger browser download
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  
  URL.revokeObjectURL(url);
}