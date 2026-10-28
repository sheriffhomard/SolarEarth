# CONTEXT — Solar Earth : Architecture, Modélisation & Écosystème

Ce document synthétise le contexte complet, les choix d'ingénierie, les fondations physiques et la feuille de route de la plateforme **Solar Earth**.

---

## 1. Vision & Objectif Scientifique

**Solar Earth** est un observatoire et simulateur de rayonnement solaire planétaire fonctionnant de façon **100% autonome sur smartphone (Progressive Web App)** et sur station de développement locale.

L'application permet d'étudier l'énergie solaire reçue au sol en n'importe quel point du globe à n'importe quelle heure de l'année, avec une précision métrologique rigoureuse :
- **Rayonnement Global Horizontal (GHI)** en W/m²
- **Rayonnement Direct Normal (DNI)** en W/m²
- **Rayonnement Diffus Horizontal (DHI)** en W/m²
- **Hauteur / Élévation Solaire apparente** avec correction de réfraction atmosphérique
- **Masse d'Air Optique (AM)**
- **Irradiation cumulée journalière ($H_d$)** en kWh/m²/jour

---

## 2. Architecture Double-Mode (Dual-Tier)

Pour garantir à la fois l'autonomie sur mobile et la flexibilité d'ingestion sur poste de travail, Solar Earth repose sur deux environnements strictement cloisonnés :

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SOLAR EARTH — DOUBLE MODE                             │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ MODE 1 : PWA CLIENT 100% AUTONOME    │ MODE 2 : STATION DEV & INGESTION     │
│ (Navigateur Mobile / Smartphone)     │ (Serveur Local / Desktop / CI)       │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • Moteur d'exécution : Navigateur    │ • Moteur : Node.js (Vite) / Python   │
│ • Stockage : IndexedDB localisé      │ • Stockage : Fichier SQLite 3 local  │
│   (base SolarEarth_MobileDB)         │   (fichier local solar_earth.db)     │
│ • Physique : Spencer & Bird 1981     │ • Script d'init : init_sqlite.py     │
│   exécutés 100% en TypeScript client │ • Services : Express, FastAPI,       │
│ • Zéro conteneur Docker requis       │   Pytest, Ruff, scripts batch        │
│ • Zéro serveur externe obligatoire   │ • Traitement de gros rasters SIG     │
│ • Zéro port réseau TCP exposé        │ • Testé dans le job backend de la CI │
│ • Zéro substitution silencieuse      │ • Accès système de fichiers natif    │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

### Clarification sur le stockage
1. **Sur smartphone (PWA)** : SQLite n'est pas ouvert dans le système de fichiers mobile ; le stockage opérationnel est **IndexedDB** (`SolarEarth_MobileDB`).
2. **Sur station de dev** : `solar_earth.db` est un fichier local géré par Node/Python, ignoré par Git (`.gitignore`) et vérifié par `PRAGMA quick_check;`.

---

## 3. Rigueur Métrologique & Intégration PVGIS v5.3

L'intégration de l'API officielle **PVGIS (Photovoltaic Geographical Information System)** de la Commission Européenne (JRC) applique des règles strictes :
1. **Suppression de la substitution silencieuse des années** : l'archive couvre les années réelles documentées par produit (ex. 2005–2023 pour SARAH-3, 2005–2020 pour SARAH-2). Toute date hors archive bascule de façon explicite et transparente vers le modèle physique local de ciel clair (`data_type: 'simulated_clearsky'`).
2. **Préservation des horodatages sources** : conservation des minutes de balayage satellitaire UTC (ex. 12:10 pour SARAH, 12:00 pour ERA5) sans troncature silencieuse.
3. **Formule physique du DNI et réfraction atmosphérique** :
   Pour éviter la divergence singulière lorsque le soleil est proche de l'horizon, Solar Earth applique la correction de réfraction de Bennett & Saemundsson :
   $$R = \frac{1.02}{\tan\left(H_{sun} + \frac{10.3}{H_{sun} + 5.11}\right) \times 60} \quad (\text{en degrés})$$
   Pour les angles rasants ($0^\circ < H_{sun} \le 1.0^\circ$), le DNI est dérivé sur l'élévation apparente $H_{app} = H_{sun} + R$ et plafonné à la constante solaire extraterrestre $I_0 = 1361.2 \text{ W/m}^2$.
4. **Validation stricte de la série horaire** : format regex `/^\d{8}:\d{4}$/`, ordre chronologique strict, vérification des 24 heures (0..23), détection des doublons, rejet absolu de valeurs non numériques sans substitution abusive de zéros, et validation des régimes polaires (24h de jour permanent ou 24h de nuit permanente).

---

## 4. Système de Paramètres & Mises à Jour Automatiques en Arrière-Plan (v0.3.0)

Solar Earth v0.3.0 intègre un centre de contrôle système complet :
- **Date de sortie officielle** : affichage transparent de la date de version (`28 octobre 2026`).
- **Date de la dernière vérification** : horodatage de la dernière requête de contrôle de version.
- **Bouton « Vérifier les mises à jour »** : interroge l'API Service Worker et `/api/v1/info` pour identifier toute nouvelle version.
- **Bouton « Forcer la mise à jour »** : purge intégrale des caches CacheStorage, envoi de `SKIP_WAITING` au nouveau service worker et rechargement forcé de la page.
- **Mises à jour automatiques en arrière-plan** :
  - Tâche de fond périodique (paramétrable : 5, 15, 30 ou 60 minutes)
  - Détection automatique au retour de focus (`visibilitychange`)
  - Installation transparente en tâche de fond et notification non intrusive.

---

## 5. Thème Clair & Sombre (Light & Dark Mode)

- Système de thèmes adaptatif (`dark`, `light`, `system`).
- Maintien du thème choisi dans `localStorage`.
- Thème sombre conçu pour préserver la vision nocturne lors de l'observation astronomique.
- Thème clair à haut contraste pour une lisibilité optimale en plein soleil sur mobile.

---

## 6. Onboarding, Infobulles & Mentions Légales

- **Décharge de responsabilité formelle** : l'utilisateur valide lors du premier accès que les données et calculs sont fournis à titre scientifique et indicatif, dégageant l'auteur et l'éditeur de toute responsabilité en cas de décisions financières ou d'installation matérielle.
- **Infobulles contextuelles (Tooltips)** : explications scientifiques détaillées et formules accessibles en un clic/survol sur les grandeurs clés ($GHI$, $DNI$, $DHI$, $H_{sun}$, $AM$, $H_d$).
- **Bouton « Installer l'application »** : gestion native du prompt Chromium/Desktop et guide pas-à-pas pour Safari iOS.
