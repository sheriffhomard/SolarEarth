import React from 'react';

interface SolarLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  version?: string;
  className?: string;
}

export const SolarLogo: React.FC<SolarLogoProps> = ({
  size = 'md',
  showText = false,
  version = 'V0.3',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const iconSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Radiant Sun & Earth Logo Icon */}
      <div
        className={`${iconSize} relative rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 p-1 shadow-md shadow-amber-500/20 shrink-0 flex items-center justify-center overflow-hidden border border-amber-400/40`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full text-slate-950"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Orbital path */}
          <ellipse
            cx="50"
            cy="50"
            rx="40"
            ry="24"
            transform="rotate(-25 50 50)"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeDasharray="4 3"
            opacity="0.85"
          />

          {/* Central Sun body */}
          <circle cx="44" cy="46" r="16" fill="#fef08a" />
          <circle cx="44" cy="46" r="22" fill="#fbbf24" opacity="0.35" />

          {/* Sun solar rays */}
          <g stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.9">
            <line x1="44" y1="16" x2="44" y2="22" />
            <line x1="44" y1="70" x2="44" y2="76" />
            <line x1="14" y1="46" x2="20" y2="46" />
            <line x1="68" y1="46" x2="74" y2="46" />
            <line x1="23" y1="25" x2="27" y2="29" />
            <line x1="61" y1="63" x2="65" y2="67" />
            <line x1="23" y1="67" x2="27" y2="63" />
            <line x1="61" y1="29" x2="65" y2="25" />
          </g>

          {/* Earth planet orbiting */}
          <circle cx="76" cy="34" r="7.5" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
          <path
            d="M 74,32 Q 76,31 78,33 Q 79,35 77,37 Z"
            fill="#4ade80"
            opacity="0.9"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight text-slate-900 dark:text-slate-100 text-base sm:text-lg">
              SOLAR EARTH
            </span>
            {version && (
              <span className="font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800/40">
                {version}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
            Mesure, modélisation & visualisation du rayonnement solaire
          </span>
        </div>
      )}
    </div>
  );
};
