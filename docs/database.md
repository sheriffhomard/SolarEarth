# Base de Données Locale — SQLite 3 & Migrations (V0.1)

## 1. Choix Technologique : SQLite Local & Embarqué

Afin de permettre une exécution fluide sur un **téléphone portable / smartphone (PWA)** en mode autonome, **sans nécessiter de serveur de base de données externe dans le cloud ni de conteneur Docker complexe**, Solar Earth utilise une base de données locale **SQLite 3** :

- **Moteur** : SQLite 3 (`sqlite:///./solar_earth.db` ou stockage local IndexedDB dans le navigateur mobile)
- **Fichier de base** : Fichier local unique stocké sur l'appareil
- **ORM** : SQLAlchemy 2.0 (sans extension externe C lourde)
- **Migrations** : Alembic

---

## 2. Schéma Initial V0.1 — Table `locations`

```sql
CREATE TABLE locations (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    geom_wkt VARCHAR(100),
    country VARCHAR(100),
    timezone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index pour les recherches textuelles et les filtres géographiques
CREATE INDEX ix_locations_name ON locations (name);
CREATE INDEX ix_locations_latitude ON locations (latitude);
CREATE INDEX ix_locations_longitude ON locations (longitude);
CREATE INDEX idx_locations_lat_lon ON locations (latitude, longitude);
```

---

## 3. Avantages pour l'Utilisation sur Smartphone & Mobile

1. **Aucune dépendance cloud** : L'application fonctionne en circuit fermé hors-ligne.
2. **Aucune dépendance Docker** : Pas besoin de déployer ou maintenir des conteneurs complexes.
3. **Persistance instantanée** : Les stations et données sont écrites immédiatement dans le fichier local ou le stockage de l'appareil.
4. **Zéro configuration** : SQLite est directement intégré à Python et les navigateurs modernes disposent de capacités de stockage PWA intégrées.
