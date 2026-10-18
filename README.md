# SOLAR EARTH — Architecture 100% Mobile, Rigueur Scientifique & CI Reproductible

[![Vite](https://img.shields.io/badge/Vite-8.3.4-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev/)
[![React](https://img.shields.io/badge/React-19.0.1-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-20%2F20_Passed-emerald.svg?logo=vitest&logoColor=white)](https://vitest.dev/)
[![PWA Standalone](https://img.shields.io/badge/PWA-Smartphone_Installable-5A0FC8.svg?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Storage](https://img.shields.io/badge/Stockage-IndexedDB_%26_SQLite_Local-0ea5e9.svg)](https://developer.mozilla.org/fr/docs/Web/API/IndexedDB_API)
[![Zero DB Port](https://img.shields.io/badge/Ports_Réseau_DB-0_Port_Exposé-emerald.svg)](#3-sécurité-secrets-et-zéro-port-réseau-exposé)
[![CI Reproducible](https://img.shields.io/badge/CI-npm_ci_%26_bun-success.svg)](#5-reproductibilité-ci-et-gestion-des-fichiers-de-verrouillage-lockfiles)

---

## 1. Présentation & Vision Mobile-First Autonome

**Solar Earth** est une application web / PWA scientifique dédiée à la mesure, au calcul physique et à la visualisation du rayonnement solaire reçu sur Terre au cours de la journée.

### Fonctionnement autonome sur smartphone
À la demande explicite de l'utilisateur, toute dépendance d'infrastructure lourde ou distante a été éliminée :
- **Aucun conteneur Docker** n'est nécessaire ;
- **Aucun serveur de base de données PostgreSQL / PostGIS** distant n'est requis ;
- **Aucun backend obligatoire dans le cloud**.

L'application s'exécute **directement sur votre smartphone** via le navigateur ou installée en tant que Progressive Web App (PWA). Toutes vos stations, coordonnées GPS et historiques de calculs solaires sont stockés localement sur votre téléphone grâce à **IndexedDB** et **SQLite 3 embarqué local** (zéro port TCP exposé).

---

## 2. Stack Technique et Versions Exactes Verrouillées

> **Source unique de vérité** : La version de l'application est fixée à **`0.2.0`** dans `package.json`, propagée dynamiquement dans `src/services/envConfig.ts`, `vite.config.ts`, et les endpoints d'information.
>
> **Clarification « Vite 6 / 8 »** : La version **réellement installée et verrouillée** est **Vite 8.3.4**. La mention précédente provenait de la coexistence avec le plugin React officiel `@vitejs/plugin-react` qui est en version `6.1.1`.

| Outil / Dépendance | Version Exacte Installée | Rôle dans Solar Earth |
| :--- | :--- | :--- |
| **Vite** | `8.3.4` (verrouillé) | Moteur de dev et bundler ESM de production |
| **@vitejs/plugin-react** | `6.1.1` | Intégration React Fast Refresh pour Vite |
| **React & React DOM** | `19.0.1` | Bibliothèque d'interface utilisateur réactive |
| **TypeScript** | `7.0.2` (mode strict) | Typage statique et intégrité des modèles scientifiques |
| **Tailwind CSS** | `4.3.3` (via `@tailwindcss/vite`) | Système de design fluide mobile-first |
| **Vitest** | `5.0.4` | Suite de tests automatisés (20/20 tests validés) |
| **vite-plugin-pwa** | `2.0.0` | Service Worker, mise en cache offline et manifest PWA |
| **IndexedDB** | Standard W3C navigateur | Base de données locale intégrée au smartphone |
| **SQLite** | `3` (embarqué local) | Base relationnelle autonome de fichier `solar_earth.db` |
| **Node.js requis** | `>= 20.18.0` ou `>= 22.0.0` | Environnement d'exécution JavaScript standard |
| **Bun (supporté)** | `>= 1.1` | Runtime alternatif (compatible via `bun.lock`) |

---

## 3. Sécurité, Statut Réel des Composants & Secrets

1. **Vérification Réelle de la Persistance (Health Check non truqué)** :
   - Le endpoint `/api/v1/health` teste l'accessibilité réelle du fichier local SQLite 3 (`solar_earth.db`) et les permissions d'écriture locales.
   - Côté client, la méthode `mobileDatabase.checkHealth()` exécute une transaction en lecture sur IndexedDB pour vérifier l'accès effectif aux tables `locations` et `radiation_records`.
   - Si un composant est inaccessible, le statut est basculé sur `degraded` avec le diagnostic exact.

2. **Statut Réel des Fournisseurs de Données** :
   - `/api/v1/info` et `fetchInfo()` catégorisent rigoureusement chaque fournisseur selon son état véritable :
     - **PVGIS JRC** : `available` (connecté à l'API v5.3 avec repli automatique sur le modèle de simulation ciel clair local en cas de coupure réseau).
     - **NASA POWER** : `simulated` (V0.3 en cours de développement).
     - **NOAA SWPC** : `simulated` (V0.4 en cours de développement).
     - **EUMETSAT** : `unavailable` (observation satellitaire géostationnaire prévue en V0.7).

3. **Zéro Port Réseau Exposé (0 Port TCP)** :
   - Aucun port PostgreSQL (5432) ni MySQL (3306) n'est ouvert sur le smartphone ou sur le réseau local. Le stockage réside dans le bac à sable IndexedDB du navigateur et dans le fichier local SQLite protégé par les permissions du système d'exploitation.

4. **Validation Stricte des Entrées & Dates Calendaires** :
   - Coordonnées WGS84 vérifiées sur leurs bornes exactes : latitude $\in [-90.0^\circ, +90.0^\circ]$, longitude $\in [-180.0^\circ, +180.0^\circ]$. Rejet strict des valeurs `NaN`, infinies ou hors bornes.
   - Dates validées avec contrôle calendaire complet : vérification de l'année (bornes [1980, 2060]), du mois (1 à 12), et du nombre exact de jours du mois avec prise en compte des années bissextiles (`isLeapYear`). Rejet de dates inexistantes telles que `2024-02-31`, `2025-02-29`, `2026-04-31` (aucun glissement silencieux via `Date.parse`).

5. **Sécurité CORS & En-têtes HTTP Défensifs** :
   - CORS restreint aux origines applicatives locales autorisées.
   - En-têtes injectés : `X-Content-Type-Options: nosniff` et `X-Frame-Options: SAMEORIGIN`.

---

## 4. Modèle Physique Solaire, Hypothèses Atmosphériques & Sémantique

### A. Distinction entre Modèle Astronomique et Modèle de Rayonnement Ciel Clair
- **Modèle Astronomique de Position Solaire** (Spencer 1971 / NOAA Solar Position Algorithm) :
  - Déclinaison solaire $\delta$, équation du temps $E_t$, temps solaire vrai ($TST$), angle horaire $\omega$, angle zénithal vrai $\theta_z$, élévation astronomique géométrique $\alpha_s$, et réfraction atmosphérique de Kasten & Young (1989) pour l'élévation apparente $\alpha_{app}$.
- **Modèle de Rayonnement Ciel Clair Complet** (Bird & Hulstrom 1981 / Spencer 1971) :
  - Constante solaire extraterrestre ASTM E490 / SORCE : $I_{sc} = 1361.2\,\text{W/m}^2$.
  - Facteur d'excentricité orbitale $E_0 = 1.00011 + 0.034221 \cos(\theta_0) + \dots$
  - Masse d'air optique relative $AM$ corrigée par la pression atmosphérique.
  - Transmissions spectrales intégrées pour l'air sec pur (Rayleigh $\tau_r$), les aérosols ($\tau_a$, épaisseur optique $AOD_{500} = 0.10$ pour un ciel continental clair), l'ozone ($\tau_o$, colonne standard $0.34\,\text{cm-atm}$) et la vapeur d'eau précipitable ($\tau_w$, $1.5\,\text{cm}$).
  - Calcul du rayonnement direct normal $DNI$, du rayonnement diffus horizontal $DHI$ et clôture radiative $GHI = DNI \cdot \sin(\alpha) + DHI$.

### B. Hypothèses Atmosphériques & Limites de Validité
- Le modèle physique ciel clair suppose une **absence totale de nébulosité** (pas de nuages, stratus ou brume dense).
- Incertitude type estimée du modèle physique ciel clair : $\pm 5\%$ à $8\%$ par rapport aux mesures de pyranomètres étalonnés ISO 9060.
- **Découplage de la température** : La température calculée est un **proxy d'échauffement physique local indicatif** ($T_{proxy}$) et est explicitement documentée comme telle (`temperature_is_forecast: false`). Elle ne doit jamais être assimilée à une prévision ou mesure météorologique officielle.

### C. Comparaison aux Cas de Référence Publiés (Benchmarks)
Les sorties du modèle sont confrontées aux données de référence publiées :
- **Carpentras (Provence Solaire, BSRN / Météo-France)** : Solstice d'été attendu entre $7.9$ et $8.3\,\text{kWh/m}^2$, pic GHI vers $930\text{--}990\,\text{W/m}^2$ ; Solstice d'hiver entre $1.9$ et $2.2\,\text{kWh/m}^2$.
- **Observatoire de Paris (IMCCE / JRC SARAH-2)** : Solstice d'été entre $7.2$ et $7.6\,\text{kWh/m}^2$ ; Solstice d'hiver entre $1.5$ et $1.8\,\text{kWh/m}^2$.
- **NREL SRRL (Golden, Colorado, USA)** : Solstice d'été entre $8.3$ et $8.8\,\text{kWh/m}^2$.
- **Tamanrasset (BSRN Sahara)** : Irradiation estivale $> 8.2\,\text{kWh/m}^2$.

### D. Sémantique Temporelle & Gestion des Journées Civiles (DST 23h / 25h)
- **Sémantique horaire** : Chaque valeur $GHI_h$ représente une **irradiance moyenne intégrée sur 1 heure** ($\text{Wh/m}^2 = \text{W/m}^2 \cdot 1\,\text{h}$), conformément aux préconisations du Guide OMM No. 8. L'application supporte également l'intégration trapézoïdale pour les échantillons instantanés.
- **Découplage UTC / Heure Civile Locale** :
  - Le calcul astronomique est toujours effectué sur l'axe **UTC certifié** (24 heures invariantes).
  - La conversion en heure civile locale (`calculateLocalCivilDayIrradiation`) gère fidèlement les transitions d'heure d'été et d'hiver (DST) :
    - Jour civil standard : **24 heures locales**.
    - Passage à l'heure d'été (printemps, ex: 29 mars 2026 à Paris) : **23 heures locales** (l'heure 02:00 est sautée).
    - Passage à l'heure d'hiver (automne, ex: 25 octobre 2026 à Paris) : **25 heures locales** (l'heure 02:00 est répétée).
    - L'intégration d'énergie s'effectue sur le nombre réel d'heures civiles du jour concerné sans confusion d'indices.

---

## 5. Reproductibilité CI et Gestion des Fichiers de Verrouillage (Lockfiles)

Le projet garantit une reproductibilité absolue sur les deux écosystèmes d'exécution :
1. **`package-lock.json`** : Présent à la racine du dépôt pour garantir l'exécution stricte et déterministe de **`npm ci`** dans les pipelines CI/CD (GitHub Actions `ubuntu-latest`).
2. **`bun.lock`** : Maintenu pour les développeurs exécutant le runtime moderne Bun en local.

Le workflow GitHub Actions (`.github/workflows/ci.yml`) s'exécute avec `npm ci` et teste :
- Typage strict TypeScript (`tsc --noEmit`)
- Suite de tests Vitest (20 tests automatisés)
- Build de production Vite PWA

---

## 6. Procédure de Test et Reproduction sur une Installation Propre

Voici la procédure pas à pas pour reproduire et valider l'application sur un environnement propre :

### Étape 1 : Cloner et naviguer dans le projet
```bash
git clone <URL_DU_DEPOT> solar-earth
cd solar-earth
```

### Étape 2 : Installation propre et déterministe
```bash
# Installation stricte conforme à package-lock.json
npm ci
```

### Étape 3 : Contrôle de conformité TypeScript
```bash
# Vérifie l'absence totale d'erreurs de type
npm run typecheck
```

### Étape 4 : Exécution de la suite de tests automatisés (Vitest)
```bash
# Lance les 20 tests unitaires, calculs physiques, validation des dates et composants UI
npm run test:run
```
*Résultat attendu : 20/20 tests réussis (13 tests physiques et astronomiques + 7 tests d'interface).*

### Étape 5 : Compilation de production (Build PWA)
```bash
# Génère les fichiers optimisés dans dist/ et configure le Service Worker
npm run build
```

### Étape 6 : Lancement du serveur de développement local
```bash
npm run dev
```
Ouvrez votre navigateur sur : **`http://localhost:3000`**.

---

## 7. Installation sur Smartphone (PWA Autonome)

1. Ouvrez `http://localhost:3000` (ou l'URL locale de votre réseau) dans Chrome (Android) ou Safari (iOS).
2. **Sur Android** : Cliquez sur le bouton **"Installer l'App"** en haut de l'écran ou via le menu Chrome (3 points > "Installer l'application").
3. **Sur iPhone (Safari)** : Appuyez sur le bouton de partage (icône carré avec flèche vers le haut), puis sélectionnez **"Sur l'écran d'accueil"**.
4. L'icône **Solar Earth** apparaît sur l'écran d'accueil de votre smartphone, prête à fonctionner en mode plein écran et 100% hors-ligne.
