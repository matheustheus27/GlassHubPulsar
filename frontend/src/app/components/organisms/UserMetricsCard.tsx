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
  if (doc?.personalDetails?.name) score += 15;
  if (doc?.personalDetails?.title) score += 15;
  if (doc?.personalDetails?.contact?.email?.email) score += 10;
  if (doc?.personalDetails?.contact?.phone?.phone) score += 10;
  if (doc?.summaryDetails?.summary?.length > 40) score += 15;
  if (doc?.skillsDetails?.skills?.length >= 2) score += 15;
  if (doc?.experienceDetails?.experiences?.length >= 1) score += 10;
  if (doc?.educationDetails?.educations?.length >= 1) score += 10;
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
  const score = atsScore ?? estimatedScore ?? 88;
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
            <span className="text-xs md:text-sm font-black text-cyan-300">⚡ {score}/100</span>
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
