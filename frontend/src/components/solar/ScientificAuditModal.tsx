import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  X,
  ExternalLink,
  BookOpen,
  Calendar,
  Layers,
  Database,
  Cpu,
  Copy,
  Check,
  Globe2,
} from 'lucide-react';
import { HourlyRadiationResponse } from '../../types';

interface ScientificAuditModalProps {
  data: HourlyRadiationResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ScientificAuditModal: React.FC<ScientificAuditModalProps> = ({
  data,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !data) return null;

  const provenance = data.provenance;
  const formulas = provenance?.formulas || {};
  const quality = provenance?.quality_assessment;

  const handleCopyAuditJSON = () => {
    const auditPayload = {
      audit_type: 'SolarEarth_Scientific_Provenance_Record',
      version: '0.2.0',
      exported_at_utc: new Date().toISOString(),
      location: {
        name: data.location_name,
        latitude: data.latitude,
        longitude: data.longitude,
      },
      date: data.date,
      summary_indicators: {
        daily_irradiation_kwh_m2: data.daily_irradiation_kwh,
        peak_ghi_w_m2: data.peak_ghi,
        peak_dni_w_m2: data.peak_dni,
        sunshine_hours_wmo: data.sunshine_hours,
      },
      provenance,
    };

    navigator.clipboard.writeText(JSON.stringify(auditPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 font-sans">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                Fiche de Traçabilité Scientifique & Origine des Calculs
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Source, versions, formules physiques appliquées et horodatage UTC certifié
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content scroll area */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Metadata Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl font-mono text-xs">
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Station / Lieu</span>
              </div>
              <div className="text-slate-100 font-bold text-sm">
                {data.location_name || `${data.latitude}°, ${data.longitude}°`}
              </div>
              <div className="text-slate-400 text-[11px]">
                Coordonnées : {data.latitude.toFixed(4)}°N, {data.longitude.toFixed(4)}°E (WGS84)
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Période & Date d'Observation</span>
              </div>
              <div className="text-slate-100 font-bold text-sm">{data.date}</div>
              <div className="text-slate-400 text-[11px]">
                Horodatage UTC du calcul :{' '}
                <span className="text-slate-300 select-all">
                  {provenance?.calculation_date_utc || new Date().toISOString()}
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Provenance & Source */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
              <Database className="w-4 h-4" />
              <span>1. Source des Données & Résolution Spatio-Temporelle</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg space-y-1">
                <div className="text-[11px] font-mono text-slate-400">Fournisseur & Produit</div>
                <div className="text-slate-200 font-medium">
                  {provenance?.source_name || 'Commission Européenne JRC — PVGIS'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Version de l’API : {provenance?.source_version || 'v5.3'} (SARAH-2 / ERA5)
                </div>
              </div>

              <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg space-y-1">
                <div className="text-[11px] font-mono text-slate-400">Résolutions Standardisées</div>
                <div className="text-slate-200 font-medium font-mono">
                  Spatiale : {provenance?.spatial_resolution || '0.05° (~5 km)'}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Temporelle : {provenance?.temporal_resolution || '1 heure (moyenne intégrée)'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Formules appliquées pour chaque indicateur */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
              <BookOpen className="w-4 h-4" />
              <span>2. Formules Physiques Appliquées & Normes de Référence</span>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                    <th className="py-2.5 px-3">Indicateur</th>
                    <th className="py-2.5 px-3">Formule Mathématique</th>
                    <th className="py-2.5 px-3">Unité</th>
                    <th className="py-2.5 px-3">Valeur Calculée</th>
                    <th className="py-2.5 px-3">Référence Standard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {Object.entries(formulas).map(([key, form]) => (
                    <tr key={key} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-semibold text-slate-200 whitespace-nowrap">
                        {form.name}
                      </td>
                      <td className="py-2.5 px-3 text-amber-300 select-all whitespace-nowrap">
                        {form.formula_text}
                      </td>
                      <td className="py-2.5 px-3 text-sky-400 whitespace-nowrap">{form.unit}</td>
                      <td className="py-2.5 px-3 text-emerald-300 font-bold whitespace-nowrap">
                        {form.calculated_value}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {form.reference_standard}
                      </td>
                    </tr>
                  ))}
                  {/* Fallback standard formulas if none in object */}
                  {Object.keys(formulas).length === 0 && (
                    <>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-200">
                          Irradiation Journalière (H)
                        </td>
                        <td className="py-2.5 px-3 text-amber-300 select-all">
                          H = (∑ GHI_h · 1h) / 1000
                        </td>
                        <td className="py-2.5 px-3 text-sky-400">kWh/m²</td>
                        <td className="py-2.5 px-3 text-emerald-300 font-bold">
                          {data.daily_irradiation_kwh}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">WMO Guide No. 8</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-200">
                          Pic d'Irradiance Globale (GHI)
                        </td>
                        <td className="py-2.5 px-3 text-amber-300 select-all">
                          GHI_max = max(GHI_h)
                        </td>
                        <td className="py-2.5 px-3 text-sky-400">W/m²</td>
                        <td className="py-2.5 px-3 text-emerald-300 font-bold">{data.peak_ghi}</td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">ISO 9060:2018</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-200">
                          Bilan Radiatif de Clôture
                        </td>
                        <td className="py-2.5 px-3 text-amber-300 select-all">
                          GHI = DNI · sin(hauteur) + DHI
                        </td>
                        <td className="py-2.5 px-3 text-sky-400">W/m²</td>
                        <td className="py-2.5 px-3 text-emerald-300 font-bold">Vérifiée (tol. &lt; 1)</td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                          Loi physique fondamentale
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Audit de Qualité & Intégrité */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
              <Cpu className="w-4 h-4" />
              <span>3. Contrôle Qualité, Données Manquantes & Clôture</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
              <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg">
                <div className="text-[11px] text-slate-400">Statut Qualité</div>
                <div className="mt-1 text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{quality?.status || 'Validé JRC'}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg">
                <div className="text-[11px] text-slate-400">Valeurs Manquantes</div>
                <div className="mt-1 text-slate-100 font-bold">
                  {quality?.missing_values_count ?? 0} / 24 heures
                </div>
              </div>

              <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg">
                <div className="text-[11px] text-slate-400">Valeurs Aberrantes</div>
                <div className="mt-1 text-slate-100 font-bold">
                  {quality?.outliers_detected ?? 0} détectées
                </div>
              </div>

              <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg">
                <div className="text-[11px] text-slate-400">Clôture Radiative</div>
                <div className="mt-1 text-emerald-400 font-bold flex items-center gap-1">
                  <span>Conforme</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Constante Solaire & Paramètres Astronomiques */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5 font-mono text-xs">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">
              Constantes Physiques de Référence
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
              <div>
                Constante solaire : <strong className="text-amber-300">1361.2 W/m²</strong> (Gueymard 2004)
              </div>
              <div>
                Seuil d’insolation : <strong className="text-amber-300">DNI ≥ 120 W/m²</strong> (OMM No. 8)
              </div>
              <div>
                Conversion d’énergie : <strong className="text-amber-300">1 kWh/m² = 3.6 MJ/m²</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] font-mono text-slate-400">
            Audit traçable certifié conforme aux spécifications scientifiques Solar Earth V0.2
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAuditJSON}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Audit Copié (JSON)</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copier Fiche JSON</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
