# SOLAR EARTH — Architecture 100% Mobile (PWA & Base Locale)

[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PWA Standalone](https://img.shields.io/badge/PWA-Smartphone_Installable-5A0FC8.svg?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Storage](https://img.shields.io/badge/Stockage-IndexedDB_%26_SQLite_Local-0ea5e9.svg)](https://developer.mozilla.org/fr/docs/Web/API/IndexedDB_API)
[![No Docker](https://img.shields.io/badge/Docker-Non_requis-success.svg)](https://solar-earth.app)
[![No Cloud DB](https://img.shields.io/badge/Cloud_Backend-Non_requis-success.svg)](https://solar-earth.app)

---

## 1. Présentation & Vision Mobile-First

**Solar Earth** est une application web / PWA scientifique dédiée à la mesure, au calcul et à la visualisation du rayonnement solaire reçu sur Terre au cours de la journée.

### Fonctionnement autonome sur smartphone
À la demande de l'utilisateur, toute complexité d'infrastructure externe a été éliminée :
- **Aucun conteneur Docker requis** ;
- **Aucun serveur de base de données PostgreSQL / PostGIS requis** ;
- **Aucun backend obligatoire dans le cloud**.

L'application s'exécute **directement sur votre téléphone portable (smartphone)** via le navigateur ou installée en tant que Progressive Web App (PWA). Toutes vos stations, coordonnées et historiques de calculs solaires sont stockés localement sur votre appareil grâce à **IndexedDB** et **SQLite local**.

---

## 2. Stack Technique Simplifiée

### Frontend & Application Mobile (PWA)
- **Framework** : React 19 + TypeScript (mode strict)
- **Outillage & Build** : Vite 6/8 + Tailwind CSS
- **Base de données sur l'appareil** : **IndexedDB** (`SolarEarth_MobileDB`) + LocalStorage / SQLite
- **Moteur Solaire Embarqué** : Algorithmes astronomiques (Spencer, Bird Ciel Clair) calculant le temps solaire vrai, l'angle zénithal, l'élévation et le rayonnement direct vs diffus (GHI, DNI, DHI) directement en TypeScript sur le processeur de votre téléphone.
- **PWA & Mode Hors-ligne** : `vite-plugin-pwa` avec Service Worker, mise en cache complète des composants graphiques et mode plein écran `standalone`.
- **Navigation & Ergonomie** : Interface adaptée aux pouces sur smartphone, barre d'onglets inférieure mobile, sélecteur de stations, localisation GPS instantanée.

### Optionnel (Mode Développeur / API locale)
- **Python / FastAPI** : Serveur local léger avec base SQLite de fichier `solar_earth.db` (sans Docker, sans Postgres).

---

## 3. Fonctionnalités Opérationnelles (V0.2)

1. **Tracé Horaire 24h du Rayonnement Solaire** :
   - Décomposition en composantes **Globale (GHI)**, **Directe Normale (DNI)** et **Diffuse (DHI)** en $\text{W/m}^2$.
   - Curseur tactile interactif avec affichage de l'heure UTC, de la hauteur du soleil (°) et de la part directe.
   - Calcul de l'énergie cumulée journalière ($\text{kWh/m}^2$), du pic maximal ($\text{W/m}^2$) et de la durée d'ensoleillement utile.

2. **Gestionnaire de Stations sur le Téléphone** :
   - Stations de référence pré-embarquées : Observatoire de Paris, Carpentras (Provence), Plataforma Solar d'Almería, Greenwich, Mauna Loa.
   - Ajout de vos propres stations (toits solaires, observatoires, coordonnées GPS personnalisées).
   - Bouton **"Mon GPS"** utilisant le récepteur GPS intégré à votre smartphone.

3. **Sauvegarde & Exportation Locale** :
   - Sauvegarde de vos calculs solaires favoris dans la mémoire du téléphone.
   - Bouton d'exportation complète de la base de données locale en format JSON pour sauvegarde personnelle.
   - Réinitialisation facile en un clic.

---

## 4. Lancement & Installation sur Téléphone

### A. Utilisation Immédiate (Navigateur Web ou Mobile)
```bash
npm install
npm run dev
```
Ouvrez `http://localhost:3000` (ou l'URL de votre téléphone sur le réseau Wi-Fi).

### B. Installer l'application sur votre smartphone (PWA)
1. Ouvrez l'application dans Chrome (Android) ou Safari (iOS).
2. **Sur Android** : Cliquez sur le bouton **"Installer l'App"** en haut de l'écran.
3. **Sur iPhone (Safari)** : Appuyez sur le bouton de partage (carré avec flèche vers le haut) puis choisissez **"Sur l'écran d'accueil"**.
4. L'application est installée sur votre écran d'accueil et s'ouvre en plein écran sans barre d'adresse, prête à fonctionner même en mode avion !

---

## 5. Tests et Contrôle Qualité

```bash
# Vérification des types TypeScript
npm run typecheck

# Exécution des tests unitaires frontend (Vitest)
npm run test:run

# Build de production PWA
npm run build
```
