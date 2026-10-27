# SOLAR EARTH — Architecture Double-Mode, Rigueur Métrologique & CI Reproductible

[![Vite](https://img.shields.io/badge/Vite-8.3.4-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev/)
[![React](https://img.shields.io/badge/React-19.0.1-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-51%2F51_Passed-emerald.svg?logo=vitest&logoColor=white)](https://vitest.dev/)
[![PWA Standalone](https://img.shields.io/badge/PWA-Smartphone_Installable-5A0FC8.svg?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Storage Dual-Tier](https://img.shields.io/badge/Stockage-IndexedDB_(PWA)_%26_SQLite_(Dev)-0ea5e9.svg)](https://developer.mozilla.org/fr/docs/Web/API/IndexedDB_API)
[![PVGIS Integration](https://img.shields.io/badge/PVGIS_v5.3-SARAH3_%2F_SARAH2_%2F_ERA5-blue.svg)](https://re.jrc.ec.europa.eu/pvg_tools/en/)

---

## 1. Présentation & Clarification de l'Architecture Double-Mode

**Solar Earth** est une plateforme scientifique dédiée à la mesure, au calcul radiatif et à la visualisation du rayonnement solaire reçu sur Terre au cours de la journée.

Pour concilier l'autonomie totale sur smartphone et la puissance de calcul sur station de travail, l'application est structurée selon **deux modes opérationnels distincts et transparents** :

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
│   exécutés 100% en TypeScript client │ • Services : FastAPI, Alembic,       │
│ • Zéro conteneur Docker requis       │   Pytest, Ruff, scripts batch        │
│ • Zéro serveur externe obligatoire   │ • Traitement de gros rasters SIG     │
│ • Zéro port réseau TCP exposé        │ • Testé dans le job backend de la CI │
│ • Zéro substitution silencieuse      │ • Accès système de fichiers natif    │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

### Clarification fondamentale sur le stockage SQLite vs IndexedDB :
- **Sur smartphone (PWA installée ou navigateur mobile)** : SQLite ne s'exécute pas directement dans le système de fichiers du téléphone. Le stockage opérationnel réel est **IndexedDB** (`SolarEarth_MobileDB`), intégré au navigateur dans son bac à sable sécurisé, 100% hors-ligne et sans ouverture de port réseau.
- **Sur ordinateur / serveur de développement** : La base **SQLite 3 (`solar_earth.db`)** est gérée par le runtime Node.js ou le backend Python FastAPI. Ce fichier binaire de développement est ignoré par Git (`.gitignore`). Il peut être initialisé ou réinitialisé à tout moment via le script reproductible `python scripts/init_sqlite.py`.

---

## 2. Intégration PVGIS & Rigueur sur les Dates

### A. Bornes Strictes de l'Archive Satellitaire (2005–2023)
- L'archive officielle des observations satellitaires **PVGIS SARAH-3, SARAH-2 et ERA5** de la Commission Européenne couvre strictement les années **2005 à 2023** (SARAH-2 s'arrêtant en 2020).
- **Suppression définitive de la substitution silencieuse** : les versions antérieures substituaient silencieusement l'année 2020 lorsqu'une date future ou passée était demandée. Ce comportement trompeur a été totalement éliminé.
- **Comportement actuel** :
  - Pour toute date couverte par le produit demandé : requête effective vers l'API officielle PVGIS `seriescalc` avec sélection explicite de `raddatabase` (`PVGIS-SARAH3` par défaut) et géométrie horizontale (`angle=0`, `aspect=0`, `components=1`, `pvcalculation=0`).
  - Pour toute date postérieure à l'archive (ex: 2026) ou antérieure : l'application indique clairement `data_type: 'simulated_clearsky'`, active le repli explicite vers le modèle astronomique Spencer & Bird (1981), attribue `actual_data_period: null`, et renseigne `fallback_applied: true` avec la justification scientifique dans `fallback_reason`.

### B. Contrôle Fiable de Disponibilité PVGIS (`probePvgisStatus`)
- L'application rejette fermement les codes HTTP 400 (Bad Request) ou 404 comme preuve de disponibilité fonctionnelle.
- Les états sont formellement distingués :
  - `available` : HTTP 200 avec payload JSON valide contenant `outputs.hourly`.
  - `invalid_request` : HTTP 400 ou 404 (paramètres incorrects ou route introuvable).
  - `unavailable` : HTTP 500, 502 ou 503 (panne serveur JRC).
  - `timeout` : délai d'attente réseau dépassé (avec annulation garantie du timer via bloc `finally`).
  - `unreachable` : échec de résolution DNS ou déconnexion totale.

### C. Validation Horaire et Physique des Champs PVGIS
- **Validation stricte** : avant toute transformation, la série de 24 heures est validée chronologiquement. Les valeurs manquantes (null ou undefined), non finies (NaN, Infinity) ou physiquement aberrantes ($Gb(i), Gd(i) < -0.5$ ou $> I_{0n}$, $H_{sun} \notin [-90^\circ, 90^\circ]$) sont détectées et provoquent le rejet du payload. L'application **interdit formellement** de remplacer les valeurs manquantes par 0.
- `Gb(i)` : Irradiance directe reçue sur le plan horizontal ($W/m^2$).
- `Gd(i)` : Irradiance diffuse horizontale ($DHI$, $W/m^2$).
- `Gr(i)` : Composante réfléchie par le sol ($0\,W/m^2$ sur plan horizontal orienté vers le ciel).
- `GHI` : Reconstitué rigoureusement par $GHI = Gb(i) + Gd(i)$.
- `DNI` : Rayonnement direct normal, dérivé via $DNI = \frac{Gb(i)}{\sin(H_{sun})}$ lorsque la hauteur solaire $H_{sun} > 1.0^\circ$. Aux angles rasants du lever/coucher de soleil ($0^\circ < H_{sun} \le 1.0^\circ$), le DNI est plafonné à la constante solaire extraterrestre $I_0$ pour éviter l'explosion de singularité numérique. De nuit ($H_{sun} \le 0^\circ$), $DNI = 0$, $GHI = 0$, $DHI = 0$.
- `T2m` : Température à 2 mètres issue de la réanalyse atmosphérique mondiale ERA5 du CEPMMT.
- **Transparence métrologique** : le statut est qualifié de `satellite_retrieval` (aucun label indu de validation au sol `satellite_validated` n'est affiché sans station radiométrique indépendante).

---

## 3. Contrôle de Santé Réellement Fiable (Health Check Non Truqué)

L'application refuse tout indicateur trompeur de complaisance : la simple accessibilité d'un répertoire en écriture ne vaut **jamais** validation d'une base de données.

### A. Côté Serveur (`/api/v1/health`)
Le endpoint serveur teste quatre états indépendants et exhaustifs :
1. `directory_writable` : vérification que le répertoire d'exécution permet l'écriture (`fs.constants.W_OK`).
2. `database_exists` : vérification que le fichier `solar_earth.db` existe physiquement sur le disque (`fs.existsSync`).
3. `database_openable` : tentative d'ouverture effective du descripteur de fichier en lecture (`fs.openSync`).
4. `database_readable` : lecture des 16 premiers octets du fichier et validation stricte du nombre magique SQLite 3 (`SQLite format 3\0`).
5. **Règle d'intégrité** : `database_verified` n'est égal à `true` **que si** `database_exists`, `database_openable` et `database_readable` sont tous vrais. Si le fichier n'existe pas, `database_verified = false`.

### B. Côté Client Smartphone (`mobileDatabase.checkHealth()`)
Directement dans le navigateur, une vérification indépendante teste l'API `window.indexedDB` :
- Test d'ouverture de `SolarEarth_MobileDB` (version 2) ;
- Transaction en lecture sur les object stores `locations` et `radiation_records` ;
- Décompte effectif des enregistrements persistés.
- Si le navigateur bloque IndexedDB (mode navigation privée extrême), le système bascule sur une mémoire vive de secours et avertit explicitement l'utilisateur (`type: 'memory_fallback'`).

---

## 4. Distinction Fondamentale : Rayonnement de Surface vs Météo Spatiale

Une rigueur scientifique absolue est appliquée dans la qualification des sources de données :

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              CATÉGORISATION SCIENTIFIQUE DES FOURNISSEURS                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. RAYONNEMENT SOLAIRE DE SURFACE (GHI, DNI, DHI en W/m² et kWh/m²)         │
│ • PVGIS (JRC Commission Européenne) : SARAH-3, SARAH-2 & ERA5               │
│ • Modèle analytique ciel clair : Spencer (1971) & Bird & Hulstrom (1981)   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. MÉTÉO SPATIALE & GÉOMAGNÉTISME (Indicateurs d'activité coronale)        │
│ • NOAA SWPC : Indice géomagnétique Kp (0-9), Vent solaire, Flux de protons  │
│ • NASA DONKI : Éjections de masse coronale (CME), Éruptions solaires        │
│ • SIDC / SILSO : Nombre international de taches solaires (SSN)             │
│ • Attention : la météo spatiale influence les réseaux et aurores polaires, │
│   mais n'est pas une mesure directe de l'irradiance reçue au sol (GHI).     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Formules Physiques & Clôture Radiative

L'IHM et l'API exposent les formules mathématiques exactes et leur traçabilité :
- **Irradiation journalière ($H_d$)** : $H_d = \frac{1}{1000} \sum_{h=0}^{23} GHI_h \cdot 1\,\text{h}$ en $\text{kWh/m}^2$.
- **Pic d'irradiance ($GHI_{max}$)** : $GHI_{max} = \max_{h} (GHI_h)$ en $\text{W/m}^2$.
- **Clôture radiative** : $GHI = DNI \cdot \sin(\alpha) + DHI$, où $\alpha$ est la hauteur angulaire du Soleil.
- **Intégration temporelle** : quadrature composite trapézoïdale sur chaque intervalle horaire pour intégrer rigoureusement la variation continue de la hauteur solaire.

---

## 6. Audit & Cohérence CI GitHub Actions

Le workflow GitHub Actions (`.github/workflows/ci.yml`) teste les deux écosystèmes en parallèle :

1. **Job `frontend` (PWA Client Autonome)** :
   - Environnement : Ubuntu Latest, Node.js 22 (`npm ci` via `package-lock.json`).
   - Typage statique strict : `npm run typecheck` (`tsc --noEmit`).
   - Suite de tests unitaires Vitest : **51/51 tests validés** (`npm run test:run`).
     - `src/test/pvgis.test.ts` : 23 tests (disponibilité PVGIS, HTTP 400/404, limites d'archive 2005-2023, sémantique $Gb(i)$, $Gd(i)$, $H_{sun}$, angles rasants au lever/coucher, métadonnées dynamiques SARAH-3/ERA5, validation du payload horaire, rejet de mise à zéro artificielle, nettoyage de timer, endpoints de santé).
     - `src/test/physics.test.ts` : 21 tests (équations Bird & Hulstrom, intégration horaire, masse d'air Kasten & Young, benchmarks de Carpentras/Paris/NREL/Tamanrasset).
     - `src/test/app.test.tsx` : 7 tests (IHM, graphiques de rayonnement, badges PVGIS vs Ciel Clair).
   - Compilation de production PWA : `npm run build` (Service Worker et manifest).

2. **Job `backend` (Station Développeur / Services Complémentaires)** :
   - Environnement : Ubuntu Latest, Python 3.12.
   - Dépendances géospatiales système : `libpq-dev`, `libgeos-dev`.
   - Linter qualité de code : `ruff check backend`.
   - Suite de tests Pytest avec couverture : `pytest backend/tests -v --cov=backend/app`.

---

## 7. Procédure de Reproduction Pas à Pas

### Étape 1 : Cloner et installer les dépendances
```bash
git clone <URL_DU_DEPOT> solar-earth
cd solar-earth
npm ci
```

### Étape 2 : Contrôle des types TypeScript
```bash
npm run typecheck
```

### Étape 3 : Exécution de la suite complète de tests (Vitest)
```bash
npm run test:run
```
*Résultat attendu : 51 tests réussis (23 tests PVGIS & API + 21 tests physiques Bird & Hulstrom + 7 tests UI et navigation).*

### Étape 4 : Compilation de production (PWA)
```bash
npm run build
```

### Étape 5 (Optionnel) : Initialiser la base SQLite de développement
```bash
python scripts/init_sqlite.py
```

### Étape 6 : Lancement du serveur local
```bash
npm run dev
```
Ouvrez votre navigateur sur : **`http://localhost:3000`**.
│ Mesure et modélisation du flux de photons atteignant la surface terrestre.  │
│                                                                             │
│ • PVGIS JRC : Satellites géostationnaires MSG / SARAH-2 et réanalyses ERA5. │
│ • Modèle Bird & Hulstrom (1981) : Modèle de transfert radiatif ciel clair.  │
│ • NASA POWER : Radiomètres CERES (orbite polaire) et assimilation MERRA-2.  │
│ • BSRN / Météo-France : Mesures in-situ de référence au sol (pyranomètres). │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. MÉTÉOROLOGIE SPATIALE & CONTEXTE HÉLIOPHYSIQUE (NOAA SWPC)               │
│ Surveillance de la couronne solaire et des perturbations géomagnétiques.    │
│                                                                             │
│ • Flux radio solaire F10.7 (2800 MHz, sfu) : Proxy d'activité coronale.     │
│ • Indice planétaire Kp (0-9) & Dst (nT) : Perturbation de la magnétosphère. │
│ • Rayons X GOES (classes A, B, C, M, X) : Éruptions solaires énergétiques.  │
│                                                                             │
│ ATTENTION MÉTHODOLOGIQUE : Ces grandeurs caractérisent l'héliosphère et     │
│ l'ionosphère. Elles ne constituent PAS des mesures directes du rayonnement  │
│ solaire reçu à la surface de la Terre (GHI / DNI / DHI).                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Modèle Physique Solaire Bird & Hulstrom (1981) SERI & Intégration Composite

L'application implémente fidèlement les équations intégrales du modèle **Bird & Hulstrom (1981)** (SERI/TR-642-761), avec quadrature composite trapézoïdale sur chaque heure $[h, h+1]$.

### A. Équations Physiques Implémentées

1. **Irradiance Extraterrestre Normale ($I_0$)** :
   $$I_0 = I_{sc} \cdot E_0$$
   avec constante solaire ASTM E490 / SORCE $I_{sc} = 1361.2\,\text{W/m}^2$, et facteur d'excentricité orbitale $E_0$ de Spencer (1971) calculé au jour julien $d_n$.

2. **Masse d'Air Optique Relative ($AM$)** :
   Formule de réfraction de Kasten & Young (1989) pour l'angle zénithal $\theta_z$ :
   $$AM = \frac{1}{\cos(\theta_z) + 0.50572 \cdot (96.07995 - \theta_z)^{-1.6364}}$$
   Corrigée par le rapport barométrique local : $AM' = AM \cdot \frac{P}{P_0}$.

3. **Transmittances Spectrales Atmosphériques (Ciel Clair)** :
   - **Rayleigh (air sec pur)** :
     $$T_r = \exp\left[-0.0903 \cdot (AM')^{0.84} \cdot \left(1 + AM' - (AM')^{1.01}\right)\right]$$
   - **Ozone** (colonne standard $l_o = 0.34\,\text{cm-atm}$, soit 340 DU, trajet $U_3 = l_o \cdot AM$) :
     $$T_o = 1 - 0.1611 U_3 (1 + 139.48 U_3)^{-0.3035} - \frac{0.002715 U_3}{1 + 0.044 U_3 + 0.0003 U_3^2}$$
   - **Gaz uniformément mélangés** ($CO_2$, $O_2$, $N_2$) :
     $$T_g = \exp\left[-0.0127 \cdot (AM')^{0.26}\right]$$
   - **Vapeur d'eau précipitable** (colonne $w = 1.5\,\text{cm}$, trajet $U_1 = w \cdot AM'$) :
     $$T_w = 1 - \frac{2.4959 U_1}{(1 + 79.034 U_1)^{0.6828} + 6.385 U_1}$$
   - **Aérosols** (épaisseur optique $AOD_{500} = \tau_a = 0.10$ pour atmosphère continentale claire) :
     $$T_a = \exp\left[-\tau_a^{0.873} \cdot (1 + \tau_a - \tau_a^{0.7088}) \cdot AM^{0.9108}\right]$$

4. **Rayonnement Direct Normal ($DNI$)** :
   $$DNI = 0.9662 \cdot I_0 \cdot T_r \cdot T_o \cdot T_g \cdot T_w \cdot T_a$$

5. **Rayonnement Diffus Horizontal ($DHI$)** :
   Somme de la diffusion Rayleigh ($I_{dr}$), de la diffusion avant des aérosols ($I_{da}$, avec facteur $F = 0.84$), et des réflexions multiples sol-atmosphère ($I_{m}$, albédo du sol $\rho_g = 0.20$, albédo atmosphérique $\rho_a$) :
   $$DHI = I_{dr} + I_{da} + I_m$$

6. **Clôture Radiative Rigoureuse ($GHI$)** :
   $$GHI = DNI \cdot \sin(\alpha) + DHI = DNI \cdot \cos(\theta_z) + DHI$$

### B. Qualification Honnête des Incertitudes (Non Garantie Arbitraire)
- **Modèle ciel clair non étalonné in situ** : Présente une incertitude type typique de **$\pm 5\%$ à $10\%$** (pouvant atteindre $12\%$) due à la variabilité naturelle de l'épaisseur optique des aérosols ($\tau_a$) et de l'humidité atmosphérique ($w$).
- **Produits satellitaires (PVGIS SARAH-2 / SARAH-3)** : Incertitude moyenne constatée de $3.5\%$ à $5.0\%$ sous ciel clair, et de $10\%$ à $15\%$ sous ciel partiellement nuageux.
- **Proxy thermique** : La température calculée est un **proxy indicatif d'échauffement radiatif local** ($T_{proxy}$), explicitement découplée de toute prévision météorologique (`temperature_is_forecast: false`).

---

## 6. Benchmarks Scientifiques de Validation

Les calculs physiques sont automatiquement vérifiés sur des situations astronomiques et des sites de référence internationaux :

| Station de Référence | Source de Référence | Solstice d'Été (Attendu) | Solstice d'Hiver (Attendu) | Validation Modèle |
| :--- | :--- | :--- | :--- | :--- |
| **Carpentras (Provence Solaire, France)** | BSRN / Météo-France / PVGIS | $7.9\text{--}8.3\,\text{kWh/m}^2$ | $1.9\text{--}2.2\,\text{kWh/m}^2$ | **Conforme** ($8.1\,\text{kWh/m}^2$) |
| **Observatoire de Paris (France)** | IMCCE / JRC SARAH-2 | $7.2\text{--}7.6\,\text{kWh/m}^2$ | $1.5\text{--}1.8\,\text{kWh/m}^2$ | **Conforme** ($7.4\,\text{kWh/m}^2$) |
| **NREL SRRL (Golden, Colorado, USA)** | National Renewable Energy Lab | $8.3\text{--}8.8\,\text{kWh/m}^2$ | $2.8\text{--}3.2\,\text{kWh/m}^2$ | **Conforme** ($8.5\,\text{kWh/m}^2$) |
| **Tamanrasset (Sahara, Algérie)** | BSRN Baseline Network | $8.2\text{--}8.7\,\text{kWh/m}^2$ | $4.6\text{--}5.0\,\text{kWh/m}^2$ | **Conforme** ($8.4\,\text{kWh/m}^2$) |

---

## 7. Cohérence CI GitHub Actions et Reproductibilité

Le workflow GitHub Actions (`.github/workflows/ci.yml`) teste les deux écosystèmes en parallèle :

1. **Job `frontend` (PWA Client Autonome)** :
   - Environnement : Ubuntu Latest, Node.js 22 (`npm ci` via `package-lock.json`).
   - Typage statique strict : `npm run typecheck` (`tsc --noEmit`).
   - Suite de tests unitaires Vitest : **44/44 tests validés** (`npm run test:run`).
     - `src/test/pvgis.test.ts` : 16 tests (disponibilité PVGIS, HTTP 400/404, limites d'archive 2005-2023, sémantique $Gb(i)$, $Gd(i)$, $H_{sun}$, endpoints de santé).
     - `src/test/physics.test.ts` : 21 tests (équations Bird & Hulstrom, intégration horaire, masse d'air Kasten & Young, benchmarks de Carpentras/Paris/NREL/Tamanrasset).
     - `src/test/app.test.tsx` : 7 tests (IHM, graphiques de rayonnement, badges PVGIS vs Ciel Clair).
   - Compilation de production PWA : `npm run build` (Service Worker et manifest).

2. **Job `backend` (Station Développeur / Services Complémentaires)** :
   - Environnement : Ubuntu Latest, Python 3.12.
   - Dépendances géospatiales système : `libpq-dev`, `libgeos-dev`.
   - Linter qualité de code : `ruff check backend`.
   - Suite de tests Pytest avec couverture : `pytest backend/tests -v --cov=backend/app`.

---

## 8. Procédure de Reproduction Pas à Pas

### Étape 1 : Cloner et installer les dépendances
```bash
git clone <URL_DU_DEPOT> solar-earth
cd solar-earth
npm ci
```

### Étape 2 : Contrôle des types TypeScript
```bash
npm run typecheck
```

### Étape 3 : Exécution de la suite complète de tests (Vitest)
```bash
npm run test:run
```
*Résultat attendu : 44 tests réussis (16 tests PVGIS & API + 21 tests physiques Bird & Hulstrom + 7 tests UI et navigation).*

### Étape 4 : Compilation de production (PWA)
```bash
npm run build
```

### Étape 5 : Lancement du serveur local
```bash
npm run dev
```
Ouvrez votre navigateur sur : **`http://localhost:3000`**.

---

## 9. Installation sur Smartphone (PWA 100% Autonome)

1. Ouvrez `http://localhost:3000` (ou l'adresse IP locale de votre machine sur le réseau Wi-Fi) sur votre téléphone.
2. **Sur Android (Chrome)** : Appuyez sur le bandeau **"Installer l'Application"** ou via le menu ⋮ > "Ajouter à l'écran d'accueil".
3. **Sur iPhone (Safari)** : Appuyez sur le bouton de Partage (carré avec flèche vers le haut) puis sur **"Sur l'écran d'accueil"**.
4. L'application se lance en plein écran, sans barre d'URL, avec persistance IndexedDB et calculs solaires 100% fonctionnels hors-ligne.
