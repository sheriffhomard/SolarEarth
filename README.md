# SOLAR EARTH — Architecture 100% Mobile & Traçabilité Scientifique

[![Vite](https://img.shields.io/badge/Vite-8.3.4-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev/)
[![React](https://img.shields.io/badge/React-19.0.1-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PWA Standalone](https://img.shields.io/badge/PWA-Smartphone_Installable-5A0FC8.svg?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Storage](https://img.shields.io/badge/Stockage-IndexedDB_%26_SQLite_Local-0ea5e9.svg)](https://developer.mozilla.org/fr/docs/Web/API/IndexedDB_API)
[![Zero DB Port](https://img.shields.io/badge/Ports_Réseau_DB-0_Port_Exposé-emerald.svg)](#3-sécurité-secrets-et-zéro-port-réseau-exposé)
[![No Docker](https://img.shields.io/badge/Docker-Non_requis-success.svg)](https://solar-earth.app)

---

## 1. Présentation & Vision Mobile-First

**Solar Earth** est une application web / PWA scientifique dédiée à la mesure, au calcul physique et à la visualisation du rayonnement solaire reçu sur Terre au cours de la journée.

### Fonctionnement autonome sur smartphone
À la demande explicite de l'utilisateur, toute dépendance d'infrastructure lourde ou distante a été éliminée :
- **Aucun conteneur Docker** n'est nécessaire ;
- **Aucun serveur de base de données PostgreSQL / PostGIS** n'est requis ;
- **Aucun backend obligatoire dans le cloud**.

L'application s'exécute **directement sur votre smartphone** via le navigateur ou installée en tant que Progressive Web App (PWA). Toutes vos stations, coordonnées GPS et historiques de calculs solaires sont stockés localement sur votre téléphone grâce à **IndexedDB** et **SQLite 3 embarqué**.

---

## 2. Stack Technique et Versions Exactes Verrouillées

> **Clarification de version** : Une mention antérieure du document indiquait « Vite 6 / 8 ». La version **réellement installée et verrouillée** dans `package-lock.json` est **Vite 8.3.4**. L'ambiguïté provenait de la coexistence avec le plugin React officiel `@vitejs/plugin-react` qui est en version `6.1.1`.

| Outil / Dépendance | Version Exacte Installée | Rôle dans Solar Earth |
| :--- | :--- | :--- |
| **Vite** | `8.3.4` (verrouillé) | Moteur de dev ultra-rapide et bundler ESM de production |
| **@vitejs/plugin-react** | `6.1.1` | Intégration React Fast Refresh pour Vite |
| **React & React DOM** | `19.0.1` | Bibliothèque d'interface utilisateur réactive |
| **TypeScript** | `7.0.2` (mode strict) | Typage statique et intégrité des modèles scientifiques |
| **Tailwind CSS** | `4.3.3` (via `@tailwindcss/vite`) | Système de design fluide mobile-first |
| **Vitest** | `5.0.4` | Suite de tests unitaires et physiques automatisés |
| **vite-plugin-pwa** | `2.0.0` | Service Worker, mise en cache offline et manifest PWA |
| **IndexedDB** | Standard W3C navigateur | Base de données locale intégrée au smartphone |
| **SQLite** | `3` (embarqué local) | Base relationnelle autonome de fichier `solar_earth.db` |
| **Node.js requis** | `>= 20.18.0` ou `>= 22.0.0` | Environnement d'exécution JavaScript local |
| **Python (optionnel)** | `>= 3.11` / FastAPI `0.115` | Serveur de développement API optionnel |

---

## 3. Sécurité, Secrets et Zéro Port Réseau Exposé

La sécurité a été renforcée selon les meilleurs standards :

1. **Zéro Port Réseau Exposé pour la Base de Données (0 Port TCP)** :
   - Contrairement aux architectures PostgreSQL (port 5432) ou MySQL (port 3306) exposées aux scans réseau et attaques brute-force, le stockage local par **SQLite 3** et **IndexedDB** n'ouvre **aucun port réseau**.
   - SQLite réside dans un fichier local protégé par les permissions du système d'exploitation.
   - IndexedDB est confiné dans le bac à sable (sandbox) du navigateur mobile et protégé par la *Same-Origin Policy*.

2. **Validation Rigoureuse des Entrées (Input Validation & Sanitization)** :
   - Coordonnées géographiques WGS84 strictement bornées : latitude $\in [-90.0^\circ, +90.0^\circ]$, longitude $\in [-180.0^\circ, +180.0^\circ]$.
   - Dates validées au format calendrier ISO AAAA-MM-JJ dans la plage astronomique [1980, 2060].
   - Noms de stations assainis pour prévenir toute injection XSS.

3. **Protection CORS & En-têtes HTTP Sécurisés** :
   - CORS restreint aux origines applicatives locales autorisées (`localhost:3000`, PWA mobile).
   - En-têtes défensifs appliqués : `X-Content-Type-Options: nosniff` et `X-Frame-Options: SAMEORIGIN`.

4. **Secrets et Clés API** :
   - Aucun secret d'infrastructure n'est présent dans le code source.
   - L'API PVGIS JRC de la Commission Européenne est une API publique ouverte ne nécessitant aucun jeton secret.
   - Les clés de test pour les versions futures (NASA POWER `DEMO_KEY`) sont des clés publiques documentées.

---

## 4. Qualité Scientifique Traçable & Audit des Calculs

Chaque indicateur calculé et chaque point de mesure horaire est relié à une structure de **traçabilité scientifique complète (`ScientificProvenance`)** consultable directement dans l'interface via le bouton **"Traçabilité Scientifique"** :

- **Source & Version** : Commission Européenne JRC — PVGIS v5.3 (produit satellite SARAH-2 et réanalyse ERA5).
- **Résolution Spatio-Temporelle** : $0.05^\circ$ (~5 km au sol) et pas horaire intégré de 1 heure selon le Guide OMM No. 8.
- **Formules Physiques Référencées** :
  - **Irradiation Globale Journalière ($H_d$)** : $H_d = \frac{1}{1000} \sum_{h=0}^{23} GHI_h \cdot 1\,\text{h}$ en $\text{kWh/m}^2$ (WMO Guide No. 8).
  - **Irradiance Globale Horizontale ($GHI$)** : Loi de clôture $GHI = DNI \cdot \sin(\alpha) + DHI$ en $\text{W/m}^2$ (ISO 9060:2018).
  - **Hauteur Solaire ($\alpha$)** : Modèle astronomique de Spencer (1971) & Équation du temps NOAA.
  - **Masse d'Air Optique Relative ($AM$)** : Formule de réfraction atmosphérique Kasten & Young (1989).
  - **Insolation Utile OMM** : Seuil $DNI \ge 120\,\text{W/m}^2$ (Organisation Météorologique Mondiale).
  - **Constante Solaire extraterrestre ($I_{sc}$)** : $1361.2\,\text{W/m}^2$ (Gueymard 2004 / ASTM E490).
- **Contrôle d'Intégrité & Clôture Radiative** :
  - Vérification de l'équation de clôture radiative sur chaque heure.
  - Détection automatique d'aberrations (valeurs négatives ou supérieures à la constante solaire).
  - Horodatage UTC certifié pour chaque requête et calcul.
  - Exportation possible de la fiche de traçabilité complète en JSON.

---

## 5. Procédure de Test et Reproduction sur une Installation Propre

Voici la procédure pas à pas pour reproduire et valider l'application sur un environnement propre :

### Étape 1 : Cloner et naviguer dans le projet
```bash
git clone <URL_DU_DEPOT> solar-earth
cd solar-earth
```

### Étape 2 : Installation propre des dépendances
```bash
# Installation stricte conforme au lockfile
npm ci || npm install
```

### Étape 3 : Contrôle de conformité TypeScript
```bash
# Vérifie l'absence totale d'erreurs de type
npm run typecheck
```

### Étape 4 : Exécution de la suite de tests automatisés (Vitest)
```bash
# Lance les tests unitaires, les calculs physiques et les composants UI
npm run test:run
```
*Résultat attendu : 14/14 tests réussis (tests physiques du rayonnement et tests des composants).*

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

## 6. Installation sur Smartphone (PWA Autonome)

1. Ouvrez `http://localhost:3000` (ou l'URL de votre réseau local) dans Chrome (Android) ou Safari (iOS).
2. **Sur Android** : Cliquez sur le bouton **"Installer l'App"** en haut de l'écran ou via le menu Chrome (3 points > "Installer l'application").
3. **Sur iPhone (Safari)** : Appuyez sur le bouton de partage (icône carré avec flèche vers le haut), puis sélectionnez **"Sur l'écran d'accueil"**.
4. L'icône **Solar Earth** apparaît sur l'écran d'accueil de votre téléphone. L'application démarre en plein écran sans barre d'adresse, prête à fonctionner même en mode avion (100% hors-ligne) !
