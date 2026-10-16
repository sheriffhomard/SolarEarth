# Guide de Développement — Solar Earth (V0.1)

Ce guide décrit comment installer, développer, exécuter et tester les composants de Solar Earth en local et avec Docker.

---

## 1. Démarrage Rapide avec Docker Compose

C'est la méthode recommandée pour démarrer l'ensemble de la pile technique (Frontend PWA, Backend FastAPI, PostgreSQL/PostGIS) :

```bash
# 1. Cloner et configurer l'environnement
cp .env.example .env

# 2. Démarrer tous les conteneurs avec build
docker compose up --build

# 3. Arrêter la stack
docker compose down
```

### URLs d'accès local :
- **Frontend PWA** : [http://localhost:3000](http://localhost:3000)
- **Backend API Docs (Swagger UI)** : [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- **Backend Health Check** : [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
- **Backend App Info** : [http://localhost:8000/api/v1/info](http://localhost:8000/api/v1/info)
- **PostgreSQL / PostGIS** : `localhost:5432` (`postgres` / `postgres`)

---

## 2. Développement Backend (Python / FastAPI)

### Prérequis
- Python 3.12+
- PostgreSQL avec extension PostGIS active

### Installation
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Lancement du serveur de développement
```bash
uvicorn backend.app.main:app --reload --port 8000
```

### Exécution des tests et du linter
```bash
# Linter Ruff
ruff check backend

# Suite de tests Pytest
pytest backend/tests -v
```

### Exécution des migrations de base de données
```bash
alembic -c backend/alembic.ini upgrade head
```

---

## 3. Développement Frontend (React / Vite / TypeScript)

### Prérequis
- Node.js 20+ ou 22+
- npm

### Installation
```bash
npm install
```

### Lancement du serveur de dev
```bash
npm run dev
```

### Exécution des contrôles qualité Frontend
```bash
# Vérification des types TypeScript
npm run typecheck

# Tests unitaires Vitest
npm run test:run

# Build de production PWA
npm run build
```
