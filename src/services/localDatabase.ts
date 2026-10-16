/**
 * Local offline database engine for mobile / smartphone use without cloud or Docker.
 * Emulates SQLite table operations in browser local storage / IndexedDB.
 */

export interface LocalLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  timezone?: string;
  created_at: string;
}

const STORAGE_KEY = 'solar_earth_local_locations_v1';

const DEFAULT_LOCATIONS: LocalLocation[] = [
  {
    id: 'loc-1',
    name: 'Observatoire de Paris (France)',
    latitude: 48.8364,
    longitude: 2.3364,
    country: 'France',
    timezone: 'Europe/Paris',
    created_at: new Date().toISOString(),
  },
  {
    id: 'loc-2',
    name: 'Greenwich Royal Observatory (UK)',
    latitude: 51.4769,
    longitude: 0.0,
    country: 'United Kingdom',
    timezone: 'Europe/London',
    created_at: new Date().toISOString(),
  },
  {
    id: 'loc-3',
    name: 'Mauna Loa Solar Observatory (Hawaii)',
    latitude: 19.5362,
    longitude: -155.5763,
    country: 'United States',
    timezone: 'Pacific/Honolulu',
    created_at: new Date().toISOString(),
  },
];

export const localDatabase = {
  getLocations(): LocalLocation[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LOCATIONS));
        return DEFAULT_LOCATIONS;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_LOCATIONS;
    }
  },

  addLocation(location: Omit<LocalLocation, 'id' | 'created_at'>): LocalLocation {
    const locations = this.getLocations();
    const newLoc: LocalLocation = {
      ...location,
      id: `loc-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    locations.push(newLoc);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
    } catch (e) {
      console.warn('Local storage write error:', e);
    }
    return newLoc;
  },

  count(): number {
    return this.getLocations().length;
  },

  isOfflineCapable(): boolean {
    return typeof window !== 'undefined' && 'localStorage' in window;
  },
};
