# Architecture Générale — Solar Earth (V0.1)

## 1. Vue d'ensemble

Solar Earth est une plateforme scientifique web/PWA dédiée à la mesure, au calcul et à la visualisation du rayonnement solaire reçu sur Terre au cours de la journée.

Le système couple :
- **Un Frontend React / Vite / TypeScript (PWA)** axé sur la visualisation de données scientifiques, l'ergonomie mobile-first et le mode autonome (standalone).
- **Un Backend FastAPI (Python 3.12+)** structuré selon une architecture modulaire en couches (API, Services, Providers, Database).
- **Une base de données PostgreSQL 16 enrichie de l'extension PostGIS 3.4**, garantissant la gestion native des coordonnées géographiques mondiales et des requêtes spatiales.

```
+-------------------------------------------------------------------+
|                  Client Web / PWA (Port 3000)                     |
|           React 19 + TypeScript + Vite + Tailwind CSS             |
|   Pages: Dashboard | World Map | History | Activity | Settings     |
+---------------------------------+---------------------------------+
                                  | HTTP / JSON REST (/api/v1)
                                  v
+-------------------------------------------------------------------+
|                  Backend API FastAPI (Port 8000)                  |
|                      Python 3.12+ / Pydantic v2                   |
|  +--------------------+---------------------+------------------+  |
|  | /health & /info    |  Provider Service   | Locations Engine |  |
|  +--------------------+---------------------+------------------+  |
|  | Architecture Providers (PVGIS, NASA, NOAA, EUMETSAT)        |  |
|  +-------------------------------------------------------------+  |
|  | SQLAlchemy 2.0 ORM + Alembic Migrations                      |  |
+---------------------------------+---------------------------------+
                                  | TCP 5432
                                  v
+-------------------------------------------------------------------+
|             PostgreSQL 16 + PostGIS 3.4 (Port 5432)               |
|  - Extension spatiale PostGIS (SRID 4326 WGS84)                   |
|  - Table 'locations' avec index spatial GIST                      |
|  - Préparé pour intégration future de TimescaleDB                 |
+-------------------------------------------------------------------+
```

---

## 2. Principes fondamentaux des données scientifiques

### Règle d'intégrité scientifique
Ne jamais mélanger silencieusement :
- **mesure** (capteur au sol in-situ / pyranomètre)
- **modèle** (réanalyse atmosphérique / ECMWF / ERA5)
- **satellite** (imagerie géostationnaire / SARAH / MTG)
- **prévision** (modèle numérique de prévision météorologique)
- **donnée historique** (série climatologique)
- **donnée calculée** (indice applicatif dérivé)

Chaque observation future enregistrera obligatoirement :
```json
{
  "source": "PVGIS",
  "type": "model",
  "timestamp": "2026-10-06T12:00:00Z",
  "parameter": "GHI",
  "value": 742.5,
  "unit": "W/m²",
  "resolution": "hourly",
  "quality_flag": "validated"
}
```

### Standards d'unités physiques
- **Irradiance instantanée** : $\text{W/m}^2$ (GHI, DNI, DHI)
- **Irradiation cumulée** : $\text{Wh/m}^2$ ou $\text{kWh/m}^2$
- **Température** : $\text{°C}$
- **Activité géomagnétique Kp** : Indice planétaire Kp (0 à 9)
- **Activité géomagnétique Dst** : $\text{nT}$ (nanotesla)
- **Flux radio solaire F10.7** : $\text{sfu}$ ($10^{-22}\,\text{W}\cdot\text{m}^{-2}\cdot\text{Hz}^{-1}$)

---

## 3. Modélisation de données future (Post-V0.1)

Pour garantir l'évolutivité sans surcharger prématurément la V0.1, les tables suivantes sont documentées et réservées :

### `locations` (Implémentée en V0.1)
Référentiel des stations de mesure, observatoires et points géographiques d'intérêt.
- `id`: UUID (Clé primaire)
- `name`: VARCHAR(255)
- `latitude`: FLOAT
- `longitude`: FLOAT
- `geom`: GEOMETRY(Point, 4326) avec index spatial GIST
- `country`: VARCHAR(100)
- `timezone`: VARCHAR(50)
- `created_at`, `updated_at`: TIMESTAMPTZ

### `radiation_observations` (Prévue V0.2 / V0.3)
Stockage des séries temporelles d'irradiance solaire (GHI, DNI, DHI) :
- `id`: BIGSERIAL
- `location_id`: UUID (FK locations)
- `timestamp`: TIMESTAMPTZ
- `source`: VARCHAR(50) ('pvgis', 'nasa_power', 'in_situ')
- `observation_type`: VARCHAR(30) ('measurement', 'model', 'satellite')
- `ghi`: FLOAT (W/m²)
- `dni`: FLOAT (W/m²)
- `dhi`: FLOAT (W/m²)
- `zenith_angle`: FLOAT (degrés)
- `azimuth_angle`: FLOAT (degrés)
- `quality`: VARCHAR(20)

### `solar_activity` (Prévue V0.4)
Indicateurs d'activité héliophysique :
- `timestamp`: TIMESTAMPTZ
- `source`: VARCHAR(50) ('noaa_swpc')
- `f10_7`: FLOAT (sfu)
- `sunspot_number`: INTEGER
- `kp_index`: FLOAT
- `dst_index`: FLOAT (nT)
- `xray_flux`: FLOAT (W/m²)

### `satellite_observations` (Prévue V0.7)
Produits satellitaires géostationnaires EUMETSAT (SARAH-3 / FCI) :
- `timestamp`: TIMESTAMPTZ
- `satellite`: VARCHAR(50) ('METEOSAT-11', 'MTG-I1')
- `sis`: FLOAT (Surface Incoming Shortwave Radiation W/m²)
- `sid`: FLOAT (Surface Incoming Direct Radiation W/m²)
- `cloud_albedo`: FLOAT

### `solar_events` (Prévue V0.4)
Catalogue d'événements solaires singuliers (éruptions solaires classe C/M/X, éjections de masse coronale CME, orages géomagnétiques).

---

## 4. Indices Applicatifs (Prévus en V0.5)

Les indicateurs calculés par Solar Earth seront explicitement signalés comme **indices applicatifs** :
1. **Clear Sky Index (CSI)** : Ratio entre le rayonnement mesuré ou modélisé et le rayonnement théorique par ciel parfaitement dégagé ($K_t = \frac{\text{GHI}}{\text{GHI}_{\text{clearsky}}}$).
2. **Solar Radiation Index (SRI)** : Normalisation composite du rayonnement local en fonction du maximum climatologique de la latitude.
3. **Solar Activity Index (SAI)** : Score synthétique 0–100 basé sur le flux F10.7 et les éruptions récentes.
4. **Geomagnetic Activity Index (GAI)** : Niveau d'agitation du champ magnétique terrestre dérivé de Kp et Dst.
