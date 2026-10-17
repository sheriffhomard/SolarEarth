/**
 * IndexedDB Local Database Engine for 100% on-device mobile storage.
 * Eliminates all Docker, PostgreSQL, and cloud backend dependencies.
 * Runs directly inside the browser / mobile PWA on the user's telephone.
 */

export interface MobileLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  timezone: string;
  is_default?: boolean;
  created_at: string;
  last_visited_at?: string;
}

export interface StoredRadiationRecord {
  id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  date: string;
  daily_irradiation_kwh: number;
  peak_ghi: number;
  peak_dni: number;
  sunshine_hours: number;
  source: string;
  created_at: string;
}

const DB_NAME = 'SolarEarth_MobileDB';
const DB_VERSION = 2;

export const DEFAULT_STATIONS: MobileLocation[] = [
  {
    id: 'sta-paris',
    name: 'Observatoire de Paris',
    latitude: 48.8364,
    longitude: 2.3364,
    country: 'France',
    timezone: 'Europe/Paris',
    is_default: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'sta-carpentras',
    name: 'Carpentras (Provence Solaire)',
    latitude: 44.053,
    longitude: 5.048,
    country: 'France',
    timezone: 'Europe/Paris',
    is_default: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'sta-almeria',
    name: 'Plataforma Solar Almería',
    latitude: 37.091,
    longitude: -2.358,
    country: 'Espagne',
    timezone: 'Europe/Madrid',
    is_default: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'sta-greenwich',
    name: 'Royal Observatory Greenwich',
    latitude: 51.477,
    longitude: 0.0,
    country: 'Royaume-Uni',
    timezone: 'Europe/London',
    is_default: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'sta-maunaloa',
    name: 'Mauna Loa Solar Observatory',
    latitude: 19.536,
    longitude: -155.576,
    country: 'États-Unis',
    timezone: 'Pacific/Honolulu',
    is_default: true,
    created_at: new Date().toISOString(),
  },
];

export const WORLD_CITIES_CATALOG: Omit<MobileLocation, 'id' | 'created_at'>[] = [
  { name: 'Marseille (Vieux-Port)', latitude: 43.296, longitude: 5.37, country: 'France', timezone: 'Europe/Paris' },
  { name: 'Nice (Côte d’Azur)', latitude: 43.71, longitude: 7.262, country: 'France', timezone: 'Europe/Paris' },
  { name: 'Bordeaux', latitude: 44.837, longitude: -0.579, country: 'France', timezone: 'Europe/Paris' },
  { name: 'Lyon', latitude: 45.764, longitude: 4.835, country: 'France', timezone: 'Europe/Paris' },
  { name: 'Toulouse', latitude: 43.604, longitude: 1.444, country: 'France', timezone: 'Europe/Paris' },
  { name: 'Madrid', latitude: 40.416, longitude: -3.703, country: 'Espagne', timezone: 'Europe/Madrid' },
  { name: 'Rome', latitude: 41.902, longitude: 12.496, country: 'Italie', timezone: 'Europe/Rome' },
  { name: 'Athènes', latitude: 37.983, longitude: 23.727, country: 'Grèce', timezone: 'Europe/Athens' },
  { name: 'Le Caire', latitude: 30.044, longitude: 31.235, country: 'Égypte', timezone: 'Africa/Cairo' },
  { name: 'Ouarzazate (Complexe Noor)', latitude: 30.933, longitude: -6.937, country: 'Maroc', timezone: 'Africa/Casablanca' },
  { name: 'Dakar', latitude: 14.716, longitude: -17.467, country: 'Sénégal', timezone: 'Africa/Dakar' },
  { name: 'Dubaï', latitude: 25.204, longitude: 55.27, country: 'Émirats Arabes Unis', timezone: 'Asia/Dubai' },
  { name: 'Tokyo', latitude: 35.676, longitude: 139.65, country: 'Japon', timezone: 'Asia/Tokyo' },
  { name: 'Sydney', latitude: -33.868, longitude: 151.209, country: 'Australie', timezone: 'Australia/Sydney' },
  { name: 'Désert d’Atacama', latitude: -23.863, longitude: -69.132, country: 'Chili', timezone: 'America/Santiago' },
  { name: 'Phoenix (Sonora Desert)', latitude: 33.448, longitude: -112.074, country: 'États-Unis', timezone: 'America/Phoenix' },
  { name: 'Miami', latitude: 25.761, longitude: -80.191, country: 'États-Unis', timezone: 'America/New_York' },
  { name: 'Reykjavik (Haute Latitude)', latitude: 64.146, longitude: -21.942, country: 'Islande', timezone: 'Atlantic/Reykjavik' },
  { name: 'Tromsø (Cercle Polaire)', latitude: 69.649, longitude: 18.955, country: 'Norvège', timezone: 'Europe/Oslo' },
];

class MobileDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private inMemoryLocations: MobileLocation[] = [...DEFAULT_STATIONS];
  private inMemoryRecents: MobileLocation[] = [];
  private inMemoryRecords: StoredRadiationRecord[] = [];

  private isIndexedDBAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.indexedDB;
  }

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (!this.isIndexedDBAvailable()) {
        reject(new Error('IndexedDB non supporté sur ce navigateur'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Locations table
        if (!db.objectStoreNames.contains('locations')) {
          const locStore = db.createObjectStore('locations', { keyPath: 'id' });
          locStore.createIndex('name', 'name', { unique: false });
          locStore.createIndex('created_at', 'created_at', { unique: false });

          // Seed defaults
          for (const station of DEFAULT_STATIONS) {
            locStore.add(station);
          }
        }

        // Recent locations history store
        if (!db.objectStoreNames.contains('recent_locations')) {
          const recStore = db.createObjectStore('recent_locations', { keyPath: 'id' });
          recStore.createIndex('last_visited_at', 'last_visited_at', { unique: false });
        }

        // Solar Radiation history table
        if (!db.objectStoreNames.contains('radiation_records')) {
          const radStore = db.createObjectStore('radiation_records', { keyPath: 'id' });
          radStore.createIndex('date', 'date', { unique: false });
          radStore.createIndex('location_name', 'location_name', { unique: false });
        }

        // App local settings store
        if (!db.objectStoreNames.contains('app_settings')) {
          db.createObjectStore('app_settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // --- Locations Methods ---

  async getLocations(): Promise<MobileLocation[]> {
    if (!this.isIndexedDBAvailable()) {
      return [...this.inMemoryLocations];
    }
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('locations', 'readonly');
        const store = tx.objectStore('locations');
        const req = store.getAll();
        req.onsuccess = () => {
          const res = req.result as MobileLocation[];
          if (!res || res.length === 0) {
            resolve(DEFAULT_STATIONS);
          } else {
            resolve(res);
          }
        };
        req.onerror = () => resolve(this.inMemoryLocations);
      });
    } catch {
      return this.inMemoryLocations;
    }
  }

  async addLocation(loc: Omit<MobileLocation, 'id' | 'created_at'>): Promise<MobileLocation> {
    const newStation: MobileLocation = {
      ...loc,
      id: `loc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      created_at: new Date().toISOString(),
    };

    if (!this.isIndexedDBAvailable()) {
      this.inMemoryLocations.push(newStation);
      return newStation;
    }

    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('locations', 'readwrite');
        const store = tx.objectStore('locations');
        const req = store.add(newStation);
        req.onsuccess = () => resolve(newStation);
        req.onerror = () => {
          this.inMemoryLocations.push(newStation);
          resolve(newStation);
        };
      });
    } catch {
      this.inMemoryLocations.push(newStation);
      return newStation;
    }
  }

  async deleteLocation(id: string): Promise<boolean> {
    if (!this.isIndexedDBAvailable()) {
      this.inMemoryLocations = this.inMemoryLocations.filter((l) => l.id !== id);
      return true;
    }
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('locations', 'readwrite');
        const store = tx.objectStore('locations');
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  // --- Recent Locations (PWA Mobile History) ---

  async recordRecentLocation(loc: MobileLocation): Promise<void> {
    const updated: MobileLocation = {
      ...loc,
      last_visited_at: new Date().toISOString(),
    };

    const existingIdx = this.inMemoryRecents.findIndex((r) => r.name === loc.name);
    if (existingIdx >= 0) {
      this.inMemoryRecents[existingIdx] = updated;
    } else {
      this.inMemoryRecents.unshift(updated);
    }

    if (!this.isIndexedDBAvailable()) return;

    try {
      const db = await this.openDB();
      const tx = db.transaction('recent_locations', 'readwrite');
      const store = tx.objectStore('recent_locations');
      store.put(updated);
    } catch {
      // In-memory already updated
    }
  }

  async getRecentLocations(limit = 6): Promise<MobileLocation[]> {
    if (!this.isIndexedDBAvailable()) {
      return this.inMemoryRecents.slice(0, limit);
    }
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('recent_locations', 'readonly');
        const store = tx.objectStore('recent_locations');
        const req = store.getAll();
        req.onsuccess = () => {
          const all = (req.result as MobileLocation[]) || [];
          if (all.length === 0) {
            resolve(this.inMemoryRecents.slice(0, limit));
          } else {
            all.sort((a, b) => (b.last_visited_at || '').localeCompare(a.last_visited_at || ''));
            resolve(all.slice(0, limit));
          }
        };
        req.onerror = () => resolve(this.inMemoryRecents.slice(0, limit));
      });
    } catch {
      return this.inMemoryRecents.slice(0, limit);
    }
  }

  // --- Solar Radiation History Records ---

  async saveRadiationRecord(record: Omit<StoredRadiationRecord, 'id' | 'created_at'>): Promise<StoredRadiationRecord> {
    const item: StoredRadiationRecord = {
      ...record,
      id: `rec-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    if (!this.isIndexedDBAvailable()) {
      this.inMemoryRecords.push(item);
      return item;
    }

    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('radiation_records', 'readwrite');
        const store = tx.objectStore('radiation_records');
        const req = store.add(item);
        req.onsuccess = () => resolve(item);
        req.onerror = () => {
          this.inMemoryRecords.push(item);
          resolve(item);
        };
      });
    } catch {
      this.inMemoryRecords.push(item);
      return item;
    }
  }

  async getRadiationRecords(): Promise<StoredRadiationRecord[]> {
    if (!this.isIndexedDBAvailable()) {
      return [...this.inMemoryRecords];
    }
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('radiation_records', 'readonly');
        const store = tx.objectStore('radiation_records');
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as StoredRadiationRecord[]) || []);
        req.onerror = () => resolve(this.inMemoryRecords);
      });
    } catch {
      return this.inMemoryRecords;
    }
  }

  // --- Search Catalog ---

  searchCatalog(query: string): Omit<MobileLocation, 'id' | 'created_at'>[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return WORLD_CITIES_CATALOG.filter(
      (c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
    );
  }

  // --- Diagnostics, Export & Reset ---

  async getStats(): Promise<{ locationsCount: number; recordsCount: number; dbName: string }> {
    try {
      const locations = await this.getLocations();
      const records = await this.getRadiationRecords();
      return {
        locationsCount: locations.length,
        recordsCount: records.length,
        dbName: DB_NAME,
      };
    } catch {
      return {
        locationsCount: DEFAULT_STATIONS.length,
        recordsCount: 0,
        dbName: DB_NAME,
      };
    }
  }

  async exportDatabaseJSON(): Promise<string> {
    const locations = await this.getLocations();
    const records = await this.getRadiationRecords();
    return JSON.stringify(
      {
        version: DB_VERSION,
        exported_at: new Date().toISOString(),
        engine: 'IndexedDB / Mobile SQLite',
        locations,
        records,
      },
      null,
      2
    );
  }

  async clearDatabase(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['locations', 'radiation_records'], 'readwrite');
      tx.objectStore('locations').clear();
      tx.objectStore('radiation_records').clear();

      // Reseed default stations
      const locStore = tx.objectStore('locations');
      for (const station of DEFAULT_STATIONS) {
        locStore.add(station);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const mobileDatabase = new MobileDatabase();
