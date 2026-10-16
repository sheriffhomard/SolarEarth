import React from 'react';
import { LucideIcon, Clock } from 'lucide-react';

interface ComingSoonCardProps {
  title: string;
  subtitle: string;
  targetVersion: string;
  icon: LucideIcon;
  parameters: string[];
  unit: string;
  source: string;
  description: string;
}

export const ComingSoonCard: React.FC<ComingSoonCardProps> = ({
  title,
  subtitle,
  targetVersion,
  icon: Icon,
  parameters,
  unit,
  source,
  description,
}) => {
  return (
    <div className="relative flex flex-col justify-between p-6 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-slate-700/80 transition-all duration-200">
      <div>
        {/* Top Header: Clean metadata without pills */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100 tracking-tight">{title}</h3>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono font-medium text-amber-400/90 flex items-center gap-1.5 justify-end">
              <Clock className="w-3.5 h-3.5" />
              Coming soon
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Prévu pour {targetVersion}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed mb-4">{description}</p>

        {/* Scientific Parameters List */}
        <div className="mb-4 pt-3 border-t border-slate-800/80">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
            Paramètres prévus
          </div>
          <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-300">
            {parameters.map((param, idx) => (
              <span key={param} className="inline-flex items-center">
                <span className="font-mono text-slate-200">{param}</span>
                {idx < parameters.length - 1 && (
                  <span className="text-slate-600 ml-2" aria-hidden="true">
                    ·
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info: Unit & Source */}
      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>
          Unité standard : <strong className="text-slate-200 font-normal">{unit}</strong>
        </span>
        <span>
          Source : <strong className="text-slate-200 font-normal">{source}</strong>
        </span>
      </div>
    </div>
  );
};
