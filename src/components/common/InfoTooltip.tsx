import React, { useState, useRef, useEffect } from 'react';
import { Info, X } from 'lucide-react';

interface InfoTooltipProps {
  title: string;
  description: string;
  formula?: string;
  unit?: string;
  standard?: string;
  children?: React.ReactNode;
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  title,
  description,
  formula,
  unit,
  standard,
  children,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {children}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onMouseEnter={() => setIsOpen(true)}
        aria-label={`En savoir plus sur : ${title}`}
        aria-expanded={isOpen}
        className="ml-1.5 p-0.5 rounded text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 transition-colors"
      >
        <Info className="w-3.5 h-3.5 shrink-0" />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-xl text-left text-xs font-sans text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {title}
              </div>
              {unit && (
                <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                  Unité : {unit}
                </div>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
              aria-label="Fermer l'infobulle"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Description */}
          <p className="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
            {description}
          </p>

          {/* Formula */}
          {formula && (
            <div className="mt-2.5 p-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded font-mono text-[10px] text-amber-700 dark:text-amber-300 break-words">
              {formula}
            </div>
          )}

          {/* Standard */}
          {standard && (
            <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Norme de référence :</span>
              <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{standard}</span>
            </div>
          )}

          {/* Popover arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-white dark:bg-slate-900 border-r border-b border-slate-200 dark:border-slate-700/80 rotate-45" />
        </div>
      )}
    </div>
  );
};
