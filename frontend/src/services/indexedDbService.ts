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
const DB_VERSION = 1;

const DEFAULT_STATIONS: MobileLocation[] = [
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

class MobileDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
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
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
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
        req.onerror = () => resolve(DEFAULT_STATIONS);
      });
    } catch {
      return DEFAULT_STATIONS;
    }
  }

  async addLocation(loc: Omit<MobileLocation, 'id' | 'created_at'>): Promise<MobileLocation> {
    const db = await this.openDB();
    const newStation: MobileLocation = {
      ...loc,
      id: `loc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      created_at: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('locations', 'readwrite');
      const store = tx.objectStore('locations');
      const req = store.add(newStation);
      req.onsuccess = () => resolve(newStation);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteLocation(id: string): Promise<boolean> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('locations', 'readwrite');
      const store = tx.objectStore('locations');
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  // --- Solar Radiation History Records ---

  async saveRadiationRecord(record: Omit<StoredRadiationRecord, 'id' | 'created_at'>): Promise<StoredRadiationRecord> {
    const db = await this.openDB();
    const item: StoredRadiationRecord = {
      ...record,
      id: `rec-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('radiation_records', 'readwrite');
      const store = tx.objectStore('radiation_records');
      const req = store.add(item);
      req.onsuccess = () => resolve(item);
      req.onerror = () => reject(req.error);
    });
  }

  async getRadiationRecords(): Promise<StoredRadiationRecord[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('radiation_records', 'readonly');
        const store = tx.objectStore('radiation_records');
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as StoredRadiationRecord[]) || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
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
        version: 1,
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
