import React from 'react';
import { GlassSurface } from '../atoms/GlassSurface';
import { Badge } from '../atoms/Badge';
import { ProgressBar } from '../atoms/ProgressBar';
import { PRESET_THEME_COLORS } from '../../utils/colorEngine';
import { useI18n } from '../../hooks/useI18n';

interface UserMetricsCardProps {
  documentData?: any;
  candidateName?: string;
  template?: string;
  activeTemplate?: string;
  primaryColor?: string;
  onSelectColor?: (color: string) => void;
  onOpenATS?: () => void;
  onRunAnalysis?: () => void;
  atsScore?: number;
  estimatedScore?: number;
}

export function calculateFillQuality(doc: any): number {
  let score = 0;
  // Personal Details: Max 15%
  if (doc?.personalDetails?.name && doc.personalDetails.name.length > 2) score += 4;
  if (doc?.personalDetails?.title && doc.personalDetails.title.length > 2) score += 4;
  if (doc?.personalDetails?.contact?.email?.email) score += 4;
  if (doc?.personalDetails?.contact?.phone?.phone) score += 3;

  // Summary: Max 15%
  if (doc?.summaryDetails?.summary && doc.summaryDetails.summary.length > 40) score += 15;

  // Skills: Max 20%
  const skillCount = (doc?.skillsDetails?.skills || []).reduce((acc: number, c: any) => acc + (c.items?.length || 0), 0);
  if (skillCount >= 6) score += 20;
  else if (skillCount >= 3) score += 12;
  else if (skillCount >= 1) score += 5;

  // Experience: Max 25%
  const expCount = doc?.experienceDetails?.experiences?.length || 0;
  if (expCount >= 2) score += 25;
  else if (expCount === 1) score += 15;

  // Education: Max 15%
  const eduCount = doc?.educationDetails?.educations?.length || 0;
  if (eduCount >= 1) score += 15;

  // Projects: Max 10%
  const projCount = doc?.projectDetails?.projects?.length || 0;
  if (projCount >= 1) score += 10;

  return Math.min(100, score);
}

export const UserMetricsCard: React.FC<UserMetricsCardProps> = ({
  documentData,
  template,
  activeTemplate,
  primaryColor = '#06b6d4',
  onSelectColor,
  onOpenATS,
  onRunAnalysis,
  atsScore,
  estimatedScore
}) => {
  const { t } = useI18n();
  const quality = calculateFillQuality(documentData);
  const currentTemplate = template || activeTemplate || 'GlassModern';
  const scoreDisplay = (atsScore || estimatedScore) ? `${atsScore || estimatedScore}/100` : '--';
  const triggerATS = onOpenATS || onRunAnalysis || (() => {});
  const handleColorChange = onSelectColor || (() => {});

  return (
    <GlassSurface glow="cyan" className="bg-slate-950/85 border-white/10 p-4 mb-4 shadow-xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 items-center">
        {/* QUALITY PROGRESS */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('metricCompletion')}
            </span>
            <span className="text-xs md:text-sm font-black text-cyan-400">{quality}%</span>
          </div>
          <ProgressBar progress={quality} color="cyan" />
        </div>

        {/* ATS ESTIMATE */}
        <div
          onClick={triggerATS}
          className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/20 hover:border-cyan-500/50 transition cursor-pointer flex items-center justify-between shadow"
        >
          <div>
            <span className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {t('metricAtsEstimated')}
            </span>
            <span className="text-xs md:text-sm font-black text-cyan-300">⚡ {scoreDisplay}</span>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{t('metricAnalyze')}</span>
        </div>

        {/* ACTIVE TEMPLATE BADGE */}
        <div className="space-y-1">
          <span className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {t('metricActiveTemplate')}
          </span>
          <Badge variant="cyan" className="font-bold text-xs">
            💎 {currentTemplate}
          </Badge>
        </div>

        {/* DYNAMIC COLOR PALETTE PICKER */}
        <div className="space-y-1">
          <span className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {t('metricPrimaryColor')}
          </span>
          <div className="flex items-center gap-2">
            {PRESET_THEME_COLORS.map(c => (
              <button
                key={c.hex}
                type="button"
                onClick={() => handleColorChange(c.hex)}
                className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                  primaryColor === c.hex
                    ? 'border-white scale-125 shadow-[0_0_12px_currentColor]'
                    : 'border-transparent hover:scale-110 opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        </div>
      </div>
    </GlassSurface>
  );
};
