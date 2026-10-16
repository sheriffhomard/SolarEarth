# SOLAR EARTH — V0.1 Fondation Technique

[![Solar Earth CI](https://github.com/solar-earth/solar-earth/actions/workflows/ci.yml/badge.svg)](https://github.com/solar-earth/solar-earth/actions)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![PostGIS](https://img.shields.io/badge/PostGIS-3.4-336791.svg)](https://postgis.net/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-5A0FC8.svg?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

---

## 1. Présentation & Objectifs

**Solar Earth** est une application web/PWA dédiée à la mesure, au calcul et à la visualisation du rayonnement solaire reçu sur Terre au cours de la journée.

L'objectif final de la plateforme est de combiner :
- Données de rayonnement solaire (GHI, DNI, DHI) ;
- Imagerie et observations satellitaires (EUMETSAT SARAH-3 / MTG) ;
- Activité solaire et radioélectrique (F10.7, taches solaires, éruptions) ;
- Activité géomagnétique (indices Kp et Dst) ;
- Séries temporelles historiques et normales climatologiques (TMY) ;
- Cartographie mondiale interactive avec curseur temporel horaire ;
- Comparaison croisée entre plusieurs sources de référence (PVGIS, NASA POWER, NOAA SWPC, EUMETSAT) ;
- Calcul d'indices applicatifs spécialisés (*Solar Radiation Index*, *Solar Activity Index*, *Geomagnetic Activity Index*, *Clear Sky Index*).

> **Périmètre V0.1 :** Cette version pose exclusivement la **fondation technique** : orchestration Docker Compose, base de données PostgreSQL/PostGIS avec migrations Alembic, architecture modulaire de fournisseurs de données (providers), API FastAPI `/health` et `/info`, et interface React PWA responsive. **Aucune fausse donnée scientifique n'est inventée ou affichée.**

---

## 2. Stack Technique

### Frontend
- **Framework** : React 19 + TypeScript (mode strict)
- **Outillage & Build** : Vite 6 / 8 + `@tailwindcss/vite`
- **PWA** : `vite-plugin-pwa`, Web App Manifest, Service Worker auto-update, icônes 192/512/SVG, mode `standalone`
- **Navigation** : React Router DOM 7
- **Icônes** : Lucide React
- **Tests** : Vitest + React Testing Library + jsdom

### Backend
- **Langage** : Python 3.12+ (entièrement typé)
- **Framework API** : FastAPI + Pydantic v2 + Pydantic Settings
- **ORM & Persistance** : SQLAlchemy 2.0 + GeoAlchemy2 + psycopg 3
- **Migrations** : Alembic
- **Client HTTP & Résilience** : httpx (préparé pour les futures requêtes avec timeout et retries)
- **Tests & Qualité** : Pytest + Pytest-asyncio + Ruff

### Base de Données
- **Moteur** : PostgreSQL 16
- **Extension Spatiale** : PostGIS 3.4 (SRID 4326 WGS84)
- **Table V0.1** : `locations` (avec géométrie PostGIS `geom` et index spatial GIST)

### Infrastructure & Déploiement
- **Conteneurs** : Docker & Docker Compose (`postgres`, `backend`, `frontend`)
- **CI/CD** : GitHub Actions (`.github/workflows/ci.yml`)

---

## 3. Architecture du Projet

```text
solar-earth/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Intégration continue Backend + Frontend
├── backend/
│   ├── alembic/
│   │   ├── versions/
│   │   │   └── 001_initial_postgis_locations.py
│   │   ├── env.py
│   │   └── script.py.mako
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── health.py      # GET /api/v1/health
│   │   │   │   ├── info.py        # GET /api/v1/info
│   │   │   │   ├── locations.py   # GET & POST /api/v1/locations (PostGIS)
│   │   │   │   └── providers.py   # GET /api/v1/providers
│   │   │   └── router.py
│   │   ├── core/
│   │   │   ├── config.py          # Pydantic BaseSettings
│   │   │   └── logging.py         # Logging JSON structuré
│   │   ├── database/
│   │   │   ├── models/
│   │   │   │   └── location.py    # Modèle Location avec champ PostGIS
│   │   │   ├── base.py
│   │   │   └── session.py         # SQLAlchemy engine & sessionmaker
│   │   ├── providers/
│   │   │   ├── base.py            # Classe abstraite SolarDataProvider
│   │   │   ├── pvgis.py           # Placeholder PVGIS (V0.2)
│   │   │   ├── nasa_power.py      # Placeholder NASA POWER (V0.3)
│   │   │   ├── noaa.py            # Placeholder NOAA SWPC (V0.4)
│   │   │   └── eumetsat.py        # Placeholder EUMETSAT (V0.7)
│   │   ├── schemas/               # Modèles de validation Pydantic
│   │   ├── services/
│   │   │   └── provider_service.py
│   │   └── main.py                # Application FastAPI & middlewares
│   ├── tests/                     # Suite de tests Pytest
│   ├── alembic.ini
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── requirements.txt
├── docker/
│   ├── backend/
│   │   └── Dockerfile
│   └── frontend/
│       ├── Dockerfile
│       └── nginx.conf
├── docs/
│   ├── architecture.md            # Vision globale & modélisation future
│   ├── database.md                # PostGIS, SRID 4326 & migrations
│   ├── development.md             # Guide pas-à-pas local & conteneur
│   └── providers.md               # Spécification détaillée des 4 fournisseurs
├── public/
│   ├── icons/                     # Icônes SVG, 192x192 et 512x512
│   └── manifest.webmanifest       # Web App Manifest PWA
├── src/
│   ├── components/                # Layout, Navbar, Sidebar, Cards, PWA
│   ├── pages/                     # Dashboard, Map, History, Activity, Settings
│   ├── services/                  # Client API REST
│   ├── test/                      # Tests Vitest / React Testing Library
│   ├── types/                     # Définitions TypeScript
│   ├── App.tsx                    # Routes React Router
│   └── main.tsx
├── docker-compose.yml             # Orchestration locale multi-services
├── .env.example                   # Gabarit de configuration sans secrets
└── README.md
```

---

## 4. Démarrage Rapide

### Option A — Avec Docker Compose (Recommandé)

```bash
# 1. Préparer les variables d'environnement
cp .env.example .env

# 2. Démarrer toute l'application (PostGIS, Backend FastAPI, Frontend Nginx)
docker compose up --build

# 3. Arrêter la pile
docker compose down
```

### URLs disponibles :
- **Frontend PWA** : [http://localhost:3000](http://localhost:3000)
- **Documentation API (Swagger UI)** : [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- **Health Check API** : [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
- **Info Application & Providers** : [http://localhost:8000/api/v1/info](http://localhost:8000/api/v1/info)
- **PostgreSQL / PostGIS** : `localhost:5432` (`user: postgres`, `db: solar_earth`)

---

### Option B — En Développement Local

#### 1. Backend FastAPI
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Lancer les migrations PostGIS
alembic -c alembic.ini upgrade head

# Démarrer le serveur
uvicorn backend.app.main:app --reload --port 8000
```

#### 2. Frontend React / Vite
```bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement
npm run dev
```

---

## 5. Exécution des Tests & Contrôles Qualité

### Backend
```bash
# Linter Ruff
ruff check backend

# Tests unitaires Pytest
pytest backend/tests -v
```

### Frontend
```bash
# Vérification des types TypeScript
npm run typecheck

# Tests unitaires Vitest
npm run test:run

# Build de production Vite
npm run build
```

---

## 6. Architecture des Fournisseurs (Providers)

L'interface abstraite `SolarDataProvider` (`backend/app/providers/base.py`) formalise les interactions :
- `get_current(latitude, longitude)`
- `get_hourly(latitude, longitude, date)`
- `get_daily(latitude, longitude, start_date, end_date)`
- `get_historical(latitude, longitude, start_year, end_year)`

### Statut V0.1 des Fournisseurs :
| Fournisseur | Cible | Statut V0.1 | Rôle |
| :--- | :--- | :--- | :--- |
| **PVGIS** | V0.2 | Placeholder scaffoldé | Rayonnement solaire GHI/DNI/DHI, irradiance horaire |
| **NASA POWER** | V0.3 | Placeholder scaffoldé | Surface solaire mondiale, composantes ciel clair/couvert |
| **NOAA SWPC** | V0.4 | Placeholder scaffoldé | Flux radio F10.7, indices géomagnétiques Kp et Dst, éruptions |
| **EUMETSAT** | V0.7 | Placeholder scaffoldé | Satellites géostationnaires SARAH-3, albédo nuageux |

> En V0.1, toute tentative d'appel déclenche une exception explicite `ProviderNotImplementedError` (code HTTP 501) pour empêcher toute simulation frauduleuse.

---

## 7. Règle Fondamentale sur les Données & Unités

- **Traçabilité stricte** : Chaque donnée future comportera obligatoirement : `source`, `timestamp`, `type`, `unité`, `résolution`, `qualité`.
- **Unités internationales** :
  - Irradiance : $\text{W/m}^2$
  - Irradiation : $\text{Wh/m}^2$ / $\text{kWh/m}^2$
  - Température : $\text{°C}$
  - Flux radioélectrique solaire : $\text{sfu}$ ($10^{-22}\,\text{W}\cdot\text{m}^{-2}\cdot\text{Hz}^{-1}$)
  - Indice d'orage géomagnétique : $\text{nT}$ (nanotesla)
  - Indice géomagnétique planétaire : Kp (0 à 9)
