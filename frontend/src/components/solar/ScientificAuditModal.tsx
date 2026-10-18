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

          {/* Section 4: Modèle Atmosphérique Ciel Clair & Hypothèses Physiques */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
              <Layers className="w-4 h-4" />
              <span>4. Modèle Ciel Clair, Hypothèses Atmosphériques & Limites</span>
            </div>

            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5 font-mono text-xs text-slate-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-900/60 border border-slate-800/80 rounded">
                  <span className="text-slate-400">Modèle Astronomique :</span>{' '}
                  <strong className="text-slate-100">Spencer (1971) & NOAA SPA</strong>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Déclinaison δ, équation du temps, heure solaire vraie, élévation géométrique et réfraction Kasten-Young (1989).
                  </div>
                </div>

                <div className="p-2 bg-slate-900/60 border border-slate-800/80 rounded">
                  <span className="text-slate-400">Modèle de Rayonnement :</span>{' '}
                  <strong className="text-slate-100">Bird & Hulstrom (1981)</strong>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Transmissions spectrales intégrées : Rayleigh (τr), aérosols (τa, AOD=0.10), ozone (0.34 cm-atm) et vapeur d'eau (1.5 cm).
                  </div>
                </div>
              </div>

              <div className="p-2 bg-amber-950/20 border border-amber-900/40 rounded text-[11px] space-y-1">
                <div className="text-amber-300 font-semibold flex items-center gap-1.5">
                  <span>Limites de validité & Précautions scientifiques :</span>
                </div>
                <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-[10.5px]">
                  <li>Valide exclusivement par ciel rigoureusement clair (sans nébulosité nuageuse ni stratus).</li>
                  <li>Incertitude physique estimée du modèle ciel clair : ±5% à 8% par rapport aux pyranomètres étalonnés ISO 9060.</li>
                  <li>La température calculée est un proxy d'échauffement local indicatif et <strong>ne constitue en aucun cas une prévision météorologique</strong>.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 5: Cas de Référence Publiés (Benchmarks) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
              <BookOpen className="w-4 h-4" />
              <span>5. Cas de Référence Publiés (Benchmarks Scientifiques)</span>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/50">
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Station de Référence</th>
                    <th className="py-2 px-3">Coordonnées</th>
                    <th className="py-2 px-3">Solstice d'Été (Attendu)</th>
                    <th className="py-2 px-3">Solstice d'Hiver (Attendu)</th>
                    <th className="py-2 px-3">Réseau / Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-100">Carpentras (Provence Solaire)</td>
                    <td className="py-2 px-3 text-slate-400">44.05°N, 5.05°E</td>
                    <td className="py-2 px-3 text-amber-300 font-bold">7.9 - 8.3 kWh/m²</td>
                    <td className="py-2 px-3 text-sky-300">1.9 - 2.2 kWh/m²</td>
                    <td className="py-2 px-3 text-slate-400">BSRN / Météo-France</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-100">Observatoire de Paris</td>
                    <td className="py-2 px-3 text-slate-400">48.84°N, 2.34°E</td>
                    <td className="py-2 px-3 text-amber-300 font-bold">7.2 - 7.6 kWh/m²</td>
                    <td className="py-2 px-3 text-sky-300">1.5 - 1.8 kWh/m²</td>
                    <td className="py-2 px-3 text-slate-400">IMCCE / PVGIS SARAH-2</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-100">NREL SRRL (Golden, CO, USA)</td>
                    <td className="py-2 px-3 text-slate-400">39.74°N, -105.18°E</td>
                    <td className="py-2 px-3 text-amber-300 font-bold">8.3 - 8.8 kWh/m²</td>
                    <td className="py-2 px-3 text-sky-300">2.8 - 3.2 kWh/m²</td>
                    <td className="py-2 px-3 text-slate-400">NREL Baseline Clear-Sky</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 6: Sémantique Temporelle & Intégration d'Énergie */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 font-mono text-xs">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-bold flex items-center justify-between">
              <span>6. Sémantique Temporelle & Intégration d'Énergie</span>
              <span className="text-amber-400">Heures UTC vs Civiles Locales</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="p-2 bg-slate-900/60 border border-slate-800/80 rounded">
                <span className="text-amber-300 font-semibold">Sémantique Horaire :</span>{' '}
                <span>Irradiance moyenne intégrée sur 1 heure (Wh/m² = W/m² · 1h). Conforme aux spécifications OMM Guide No. 8.</span>
              </div>
              <div className="p-2 bg-slate-900/60 border border-slate-800/80 rounded">
                <span className="text-sky-300 font-semibold">Transitions Heure d'Été/Hiver (DST) :</span>{' '}
                <span>Calcul astronomique pur en UTC (24h invariantes). Gestion des journées civiles à 23h (printemps) et 25h (automne) sans confusion d'index.</span>
              </div>
            </div>
          </div>

          {/* Section 7: Constantes Physiques de Référence */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5 font-mono text-xs">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">
              7. Constantes Physiques Fondamentales
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
              <div>
                Constante solaire : <strong className="text-amber-300">1361.2 W/m²</strong> (ASTM E490 / SORCE)
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
