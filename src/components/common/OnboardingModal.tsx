import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Sun,
  Globe,
  Zap,
  CheckCircle2,
  HardDrive,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  X,
  FileText,
} from 'lucide-react';
import { SolarLogo } from './SolarLogo';

interface OnboardingModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  forceShow?: boolean;
}

const ONBOARDING_ACCEPTED_KEY = 'solar_earth_onboarding_accepted';

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  forceShow = false,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  useEffect(() => {
    if (forceShow) {
      setInternalIsOpen(true);
      return;
    }
    if (typeof window !== 'undefined') {
      try {
        const accepted = localStorage.getItem(ONBOARDING_ACCEPTED_KEY);
        if (!accepted) {
          setInternalIsOpen(true);
        }
      } catch {
        setInternalIsOpen(true);
      }
    }
  }, [forceShow]);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleAcceptAndFinish = () => {
    try {
      localStorage.setItem(ONBOARDING_ACCEPTED_KEY, new Date().toISOString());
    } catch {
      // Storage restricted
    }
    handleClose();
  };

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Bienvenue sur Solar Earth',
      subtitle: 'Observatoire & Modélisation Solaire Scientifique',
      icon: Sun,
      content: (
        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
          <p className="leading-relaxed">
            <strong className="text-slate-900 dark:text-slate-100">Solar Earth</strong> est une application scientifique conçue pour mesurer, modéliser et visualiser le rayonnement solaire reçu sur Terre tout au long de la journée, avec une résolution horaire rigoureuse.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                <Sun className="w-4 h-4" />
                Physique Solaire Éprouvée
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Modèles de Spencer (1971) et Bird & Hulstrom (1981) avec correction de réfraction atmosphérique (Saemundsson).
              </p>
            </div>

            <div className="p-3 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-bold text-sky-700 dark:text-sky-400">
                <Globe className="w-4 h-4" />
                Données Satellites PVGIS
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Connexion directe à l’API officielle PVGIS v5.3 du Centre Commun de Recherche (JRC / SARAH-3 / ERA5).
              </p>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-start gap-2.5">
            <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-normal">
              <strong>100% Autonome sur Mobile (PWA) :</strong> Données conservées localement dans IndexedDB sur votre smartphone. Aucune obligation de serveur externe, zéro Docker pour les calculs courants.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Comprendre les Composantes Radiatives',
      subtitle: 'Guide Contextuel & Définitions Clés',
      icon: BookOpen,
      content: (
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <p className="leading-relaxed text-[11px]">
            Pour exploiter pleinement les graphiques et simulations, voici les trois flux fondamentaux du bilan radiatif :
          </p>

          <div className="space-y-2">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-lg">
              <span className="font-bold text-amber-600 dark:text-amber-400">GHI (Global Horizontal Irradiance) :</span> Rayonnement global reçu sur le sol horizontal (W/m²). Somme directe du flux direct projeté et du flux diffus :
              <div className="font-mono text-[10px] text-amber-700 dark:text-amber-300 mt-1">GHI = DNI · sin(hauteur_solaire) + DHI</div>
            </div>

            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-lg">
              <span className="font-bold text-sky-600 dark:text-sky-400">DNI (Direct Normal Irradiance) :</span> Puissance reçue sur un plan perpendiculaire aux rayons venant directement du disque solaire. Élément clé pour les concentrateurs et panneaux solaires inclinés.
            </div>

            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-lg">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">DHI (Diffuse Horizontal Irradiance) :</span> Rayonnement diffus dispersé par les molécules de l'air, aérosols et nuages.
            </div>
          </div>

          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded-lg flex items-center justify-between text-[11px]">
            <span>💡 <strong>Astuce :</strong> Survolez ou cliquez sur les icônes</span>
            <span className="inline-flex items-center gap-1 font-semibold text-purple-700 dark:text-purple-300">
              (i) Infobulles
            </span>
            <span>dans toute l'application pour afficher les explications et formules.</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Mentions Légales & Avertissement',
      subtitle: 'Décharge de Responsabilité & Cadre d’Utilisation',
      icon: ShieldAlert,
      content: (
        <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/60 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300 text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
              NON-RESPONSABILITÉ SUR LES DONNÉES & CALCULS FOURNIS
            </div>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>L’éditeur et auteur de cette application décline expressément toute responsabilité</strong> quant à l'exactitude absolue, l'exhaustivité, la fraîcheur ou l'adéquation à un usage particulier des données, estimations, trajectoires solaires et prévisions photovoltaïques présentées.
            </p>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
              Les calculs proviennent de modèles théoriques physiques simplifiés (Spencer 1971, Bird & Hulstrom 1981) et d’observations satellitaires tiers (PVGIS / Commission Européenne JRC). Ils ne sauraient en aucun cas remplacer une étude d’ingénierie professionnelle certifiée in situ ni une expertise financière dédiée.
            </p>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
              Toute décision d’installation de matériel (panneaux, onduleurs, batteries), tout investissement financier ou tout dimensionnement technique réalisé sur la base des données de Solar Earth relève de la seule et unique responsabilité de l’utilisateur.
            </p>
          </div>

          <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-[11px]">
            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-sky-500" />
              Données Tiers et Droits de Propriété
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              PVGIS® et les données SARAH-3 / ERA5 sont la propriété du Centre Commun de Recherche (JRC) de la Commission Européenne et du CEPMMT. Solar Earth n'est ni affilié ni mandaté par ces organismes.
            </p>
          </div>

          {/* Mandatory acceptance checkbox */}
          <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={disclaimerAccepted}
              onChange={(e) => setDisclaimerAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-400 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
              J’ai lu et j'accepte expressément les mentions légales et la décharge de responsabilité ci-dessus.
            </span>
          </label>
        </div>
      ),
    },
  ];

  const currentStep = steps[activeStep];
  const isLastStep = activeStep === steps.length - 1;
  const StepIcon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <SolarLogo size="md" showText={true} version="V0.3" />
          <button
            onClick={handleClose}
            aria-label="Fermer la présentation"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-4 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              {activeStep + 1}
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                {currentStep.title}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {currentStep.subtitle}
              </div>
            </div>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            {activeStep + 1} / {steps.length}
          </span>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {currentStep.content}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between gap-3">
          {activeStep > 0 ? (
            <button
              onClick={() => setActiveStep((prev) => prev - 1)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Précédent
            </button>
          ) : (
            <div />
          )}

          {!isLastStep ? (
            <button
              onClick={() => setActiveStep((prev) => prev + 1)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            >
              Suivant
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleAcceptAndFinish}
              disabled={!disclaimerAccepted}
              className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all ${
                disclaimerAccepted
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-emerald-500/20'
                  : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed opacity-70'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Accepter & Commencer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
