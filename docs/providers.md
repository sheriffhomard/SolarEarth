# Fournisseurs de Données Solaires & Spatiales — Solar Earth

> **Avertissement V0.1** : L'intégration réelle de ces fournisseurs sera effectuée dans les versions suivantes. En V0.1, les classes de fournisseurs sont des **placeholders architecturaux strictement non-opérationnels**. Aucun appel réseau sortant n'est effectué.

---

## 1. Vue Synthétique des Fournisseurs

| Fournisseur | Organisation | Version Cible | Rôle & Paramètres Principaux |
| :--- | :--- | :--- | :--- |
| **PVGIS** | Commission Européenne JRC | **V0.2** | Rayonnement solaire haute résolution, séries horaires GHI, DNI, DHI, TMY (Typical Meteorological Year). |
| **NASA POWER** | NASA Langley Research Center | **V0.3** | Données solaires mondiales et météorologie de surface (rayonnement toutes conditions de ciel, ciel clair, température, humidité). |
| **NOAA SWPC** | National Oceanic and Atmospheric Admin. | **V0.4** | Météorologie spatiale, activité héliophysique, flux radio solaire F10.7, indices géomagnétiques Kp et Dst, éruptions solaires X-Ray. |
| **EUMETSAT** | Organisation Européenne Satellites Météo | **V0.7** | Climatologie solaire satellitaire SARAH-3, produits MTG/FCI en quasi-temps réel, albédo nuageux, validation croisée sol-satellite. |

---

## 2. États d'un Fournisseur (`ProviderState`)

Chaque fournisseur possède un cycle de vie contrôlé via les variables d'environnement :
1. **`disabled`** : Le fournisseur est désactivé (`ENABLED=false` et URL absente).
2. **`configured`** : L'URL de base et la configuration sont présentes, mais le module n'est pas encore activé en production (`ENABLED=false`).
3. **`enabled`** : Le module est activé pour les requêtes de données (`ENABLED=true`).

---

## 3. Détail des Fournisseurs

### A. PVGIS (Photovoltaic Geographical Information System)
- **Base URL par défaut** : `https://re.jrc.ec.europa.eu/api/v5_3/`
- **Authentification** : Aucune (API publique avec rate limit poli).
- **Format** : JSON / CSV.
- **Paramètres cibles** :
  - `GHI` (Global Horizontal Irradiance) en $\text{W/m}^2$
  - `DNI` (Direct Normal Irradiance) en $\text{W/m}^2$
  - `DHI` (Diffuse Horizontal Irradiance) en $\text{W/m}^2$
  - Angle zénithal et hauteur solaire en degrés.

### B. NASA POWER
- **Base URL par défaut** : `https://power.larc.nasa.gov/api/temporal/`
- **Authentification** : Optionnelle (Clé API pour quotas élevés).
- **Format** : JSON.
- **Paramètres cibles** :
  - `ALLSKY_SFC_SW_DWN` : All Sky Surface Shortwave Downward Irradiance ($\text{W/m}^2$).
  - `CLRSKY_SFC_SW_DWN` : Clear Sky Surface Shortwave Downward Irradiance ($\text{W/m}^2$).
  - `T2M` : Température à 2 mètres ($\text{°C}$).
  - `RH2M` : Humidité relative à 2 mètres ($\%$).

### C. NOAA Space Weather Prediction Center (SWPC)
- **Base URL par défaut** : `https://services.swpc.noaa.gov/`
- **Authentification** : Aucune.
- **Format** : JSON.
- **Paramètres cibles** :
  - `F10.7` : Flux radio solaire à 10.7 cm (sfu).
  - `Planetary Kp Index` : Indice géomagnétique planétaire (0 à 9).
  - `Dst Index` : Disturbance Storm Time en nanotesla ($\text{nT}$).
  - Éruptions solaires (classes C, M, X détectées par satellites GOES).

### D. EUMETSAT Data Store
- **Base URL par défaut** : `https://data.eumetsat.int/`
- **Authentification** : OAuth2 Consumer Key & Consumer Secret.
- **Format** : NetCDF / GeoTIFF / JSON.
- **Paramètres cibles** :
  - `SIS` : Surface Incoming Shortwave Radiation ($\text{W/m}^2$).
  - `SID` : Surface Incoming Direct Radiation ($\text{W/m}^2$).
  - `CAL` : Effective Cloud Albedo.

---

## 4. Politique de Tolérance aux Pannes & Résilience (V0.2+)

L'architecture prépare les mécanismes suivants dans `backend/app/providers/base.py` :
- **Timeout configurable** : `PROVIDER_REQUEST_TIMEOUT_SECONDS` (défaut 15s).
- **Tentatives de rejeu** : `PROVIDER_MAX_RETRIES` (défaut 3) avec backoff exponentiel et jitter.
- **Traçabilité structurée** : Attribution des logs au sous-système exact (`logger = get_logger(code)`).
- **Exceptions typées** : Aucune fuite d'erreur interne non formatée vers l'utilisateur.
