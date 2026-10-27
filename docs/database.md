# Base de Données Locale — IndexedDB sur Smartphone & SQLite

## 1. Choix Technologique : Stockage 100% sur l'Appareil

Afin de permettre une exécution fluide sur un **téléphone portable / smartphone (PWA)** en mode autonome, **sans nécessiter de serveur de base de données externe dans le cloud ni de conteneur Docker complexe**, Solar Earth utilise une architecture de stockage entièrement locale :

- **Moteur Principal Smartphone** : **IndexedDB** (`SolarEarth_MobileDB`), l'API de base de données transactionnelle native des smartphones (Android, iOS Safari, Chrome, Firefox).
- **Moteur Fichier Local Développeur** : **SQLite 3** (`sqlite:///./solar_earth.db`) si exécuté en environnement local sans serveur. Le fichier binaire `solar_earth.db` est exclu de Git (`.gitignore`) et peut être initialisé via `python scripts/init_sqlite.py`.
- **Zéro Cloud** : Aucune dépendance réseau pour lire ou écrire des stations, des observations ou des réglages.
- **Zéro Docker** : Aucun conteneur à compiler ou démarrer.

---

## 2. Structure des Données Locales (IndexedDB)

### Table `locations` (Stations et Observatoires)
- `id` : Identifiant unique de la station (`loc-timestamp-hash`)
- `name` : Nom de la station (ex: "Observatoire de Paris")
- `latitude` : Latitude décimale WGS84 (-90.0 à +90.0)
- `longitude` : Longitude décimale WGS84 (-180.0 à +180.0)
- `country` : Pays / Région
- `timezone` : Fuseau horaire
- `is_default` : Booléen (station de référence ou personnalisée)
- `created_at` : Timestamp ISO

### Table `radiation_records` (Historique des Calculs Solaires)
- `id` : Identifiant unique de l'enregistrement (`rec-timestamp`)
- `location_name` : Nom de la station associée
- `latitude` & `longitude` : Coordonnées
- `date` : Date calculée (YYYY-MM-DD)
- `daily_irradiation_kwh` : Énergie cumulée journalière (kWh/m²)
- `peak_ghi` : Pic maximal d'irradiance globale (W/m²)
- `peak_dni` : Pic maximal de rayonnement direct (W/m²)
- `sunshine_hours` : Nombre d'heures d'ensoleillement utile
- `source` : Source (`pvgis_jrc` ou `model_clearsky`)
- `created_at` : Date d'enregistrement

---

## 3. Avantages pour l'Utilisation sur Smartphone & Mobile

1. **Aucune dépendance cloud** : L'application fonctionne en circuit fermé hors-ligne.
2. **Aucune dépendance Docker** : Pas besoin de déployer ou maintenir des conteneurs complexes.
3. **Persistance instantanée** : Les stations et données sont écrites immédiatement dans la mémoire flash du smartphone.
4. **Export & Sauvegarde** : Sauvegarde exportable en format JSON en un clic.
