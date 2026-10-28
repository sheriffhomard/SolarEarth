# Journal des Modifications (CHANGELOG) — Solar Earth

Toutes les modifications notables apportées au projet **Solar Earth** sont consignées dans ce document. Le format est inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/) et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

---

## [v0.3.0] — 2026-10-28 : Paramètres Système, Mises à Jour Automatiques & Thème Clair

### 🚀 Nouveautés & Fonctionnalités Majeures
- **Menu Paramètres Système Complet** :
  - Affichage de la **Date de sortie officielle** (`28 octobre 2026`) et de la version `v0.3.0`.
  - Affichage de la **Date et heure de la dernière vérification** d'intégrité et de version.
  - Bouton **« Vérifier les mises à jour »** : contrôle actif auprès de l'API et du Service Worker PWA avec retour utilisateur immédiat.
  - Bouton **« Forcer la mise à jour »** : purge complète des caches `CacheStorage`, transmission de `SKIP_WAITING` au nouveau Service Worker et rechargement propre.
- **Système de Mises à Jour Automatiques en Arrière-Plan** :
  - Détection automatique et transparente des nouvelles versions serveur sans perturber la session active.
  - Fréquence de contrôle paramétrable dans les réglages (5 min, 15 min, 30 min, 60 min).
  - Écoute des reprises de focus (`visibilitychange`).
  - Bannière de notification non intrusive dès qu'une mise à jour est prête ou installée en tâche de fond.
- **Thème Clair Intégral (Light Mode)** :
  - Implémentation d'un thème clair élégant, scientifique et contrasté pour consultation en plein soleil.
  - Sélecteur de thème tri-mode (**Sombre / Clair / Système**) accessible via un bouton rapide dans la barre de navigation et le panneau de paramètres.
  - Persistance du choix dans `localStorage`.
- **Onboarding & Mentions Légales Obligatoires** :
  - Modal d'accueil en 3 étapes guidées pour les nouveaux utilisateurs.
  - **Avertissement de non-responsabilité formel** : l'éditeur et l'auteur dégagent toute responsabilité quant à l'exactitude des calculs, aux aléas des modèles ou aux décisions techniques/financières prises par les utilisateurs.
  - Case à cocher d'acceptation obligatoire avant premier accès.
  - Bouton permettant de réouvrir les mentions légales et le guide à tout moment.
- **Onboarding Contextuel & Infobulles Interactives (Tooltips)** :
  - Composant `InfoTooltip` accessible au survol et au toucher sur chaque grandeur clé ($GHI$, $DNI$, $DHI$, Hauteur solaire, Insolation OMM, Bilan radiatif).
  - Affichage des formules mathématiques de référence et normes internationales (Spencer 1971, Bird & Hulstrom 1981, WMO No. 8).
- **Bouton « Installer l'application » PWA** :
  - Détection automatique des environnements d'installation (bureau, mobile Android, iOS Safari).
  - Déclenchement natif de l'événement `beforeinstallprompt` sur Chromium/Edge/Android.
  - Guide pas-à-pas illustré pour Safari iOS (*Bouton Partager* > *Sur l'écran d'accueil*).
  - Badge de confirmation lorsque l'application s'exécute déjà en mode autonome (*Standalone*).
- **Logo Vectoriel Officiel Solar Earth** :
  - Création du logo combinant Soleil rayonnant, orbite elliptique et globe terrestre.
  - Intégration dans la barre de navigation, le volet latéral, l'onboarding et les métadonnées PWA.
- **Capture d'écran & Documentation Enrichie** :
  - Ajout du visuel complet `public/screenshots/solar-earth-preview.svg` dans le `README.md`.
  - Création de `CONTEXT.md` et mise à jour complète de la documentation avec icônes et markdowns attrayants.

---

## [v0.2.0] — 2026-10-28 : Rigueur PVGIS v5.3, Horodatages & Intégrité SQLite

### 🔬 Rigueur Scientifique & Corrections Critiques
- **Suppression définitive de la substitution silencieuse des années** : rejet des dates hors archive (2005–2023) sans fausse réattribution et bascule explicite vers le modèle astronomique Spencer & Bird.
- **Préservation intégrale des horodatages sources PVGIS** : conservation des minutes réelles UTC (ex. `:10` pour SARAH, `:00` pour ERA5).
- **Physique du DNI aux faibles élévations solaires** : intégration de la réfraction atmosphérique de Saemundsson ($H_{app} = H_{sun} + R$) et seuillage évitant la singularité $1/\sin(H_{sun})$.
- **Validation horaire stricte** : contrôle regex, vérification chronologique, absence de doublons, présence des 24 heures (0..23), rejet sans remplacement abusif par zéro, et validation des régimes polaires.
- **Contrôle de santé SQLite exhaustif** : diagnostic distinct de `directory_writable`, `database_exists`, `database_openable`, `database_readable` (header `SQLite format 3\0`) et `PRAGMA quick_check;`.
- **Serveur de production Express** : ajout du script `"start": "tsx server.ts"` et gestion du fallback PWA.

---

## [v0.1.0] — 2026-10-27 : Fondation Technique Double-Mode & Modèle Local

### ☀️ Fondation Initiale
- Architecture double-mode : Client PWA 100% autonome sur mobile (IndexedDB) et station locale de développement (SQLite 3).
- Implémentation TypeScript des algorithmes astronomiques de Spencer (1971) et du modèle de ciel clair SERI Bird & Hulstrom (1981).
- Tracé interactif du cycle solaire horaire (GHI, DNI, DHI).
- Simulateur photovoltaïque avec orientation, inclinaison et pertes système.
- Recherche de stations mondiales et géolocalisation GPS.
