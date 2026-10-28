/**
 * Solar Earth — System Update & Background Auto-Update Service
 * Manages release dates, last check timestamps, PWA Service Worker updates,
 * background auto-update checks, and forced hard cache invalidation.
 */

export const APP_VERSION = '0.3.0';
export const RELEASE_DATE = '28 octobre 2026';

const LAST_CHECK_KEY = 'solar_earth_last_update_check';
const AUTO_UPDATE_KEY = 'solar_earth_auto_update_enabled';
const AUTO_UPDATE_INTERVAL_KEY = 'solar_earth_auto_update_interval_min';

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  checkedAtIso: string;
  message: string;
}

export class UpdateService {
  /**
   * Retrieves the ISO timestamp of the last update verification.
   */
  static getLastCheckDate(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(LAST_CHECK_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Records a new update check timestamp.
   */
  static setLastCheckDate(isoString: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LAST_CHECK_KEY, isoString);
    } catch {
      // Storage restricted
    }
  }

  /**
   * Checks if automatic background updates are enabled (default: true).
   */
  static isAutoUpdateEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    try {
      const val = localStorage.getItem(AUTO_UPDATE_KEY);
      return val === null ? true : val === 'true';
    } catch {
      return true;
    }
  }

  /**
   * Enables or disables automatic background updates.
   */
  static setAutoUpdateEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(AUTO_UPDATE_KEY, String(enabled));
    } catch {
      // Storage restricted
    }
  }

  /**
   * Returns interval in minutes for periodic background checks (default: 15 min).
   */
  static getAutoUpdateIntervalMinutes(): number {
    if (typeof window === 'undefined') return 15;
    try {
      const val = localStorage.getItem(AUTO_UPDATE_INTERVAL_KEY);
      const parsed = parseInt(val || '15', 10);
      return isNaN(parsed) || parsed < 1 ? 15 : parsed;
    } catch {
      return 15;
    }
  }

  /**
   * Sets interval in minutes for periodic background checks.
   */
  static setAutoUpdateIntervalMinutes(minutes: number): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(AUTO_UPDATE_INTERVAL_KEY, String(Math.max(1, minutes)));
    } catch {
      // Storage restricted
    }
  }

  /**
   * Explicitly checks for available updates via Service Worker and server metadata.
   */
  static async checkForUpdates(): Promise<UpdateCheckResult> {
    const nowIso = new Date().toISOString();
    this.setLastCheckDate(nowIso);

    let hasUpdate = false;
    let latestVersion = APP_VERSION;

    // 1. Probe server endpoint for version increment
    try {
      const res = await fetch(`/api/v1/info?_t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const info = await res.json();
        if (info.version && typeof info.version === 'string') {
          latestVersion = info.version;
          if (info.version !== APP_VERSION) {
            hasUpdate = true;
          }
        }
      }
    } catch {
      // Server probe failed or offline
    }

    // 2. Check Service Worker registration update
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          if (registration.waiting) {
            hasUpdate = true;
          }
        }
      } catch {
        // SW update failure
      }
    }

    const message = hasUpdate
      ? `Nouvelle version disponible (${latestVersion}). Prête pour installation.`
      : `Application à jour (v${APP_VERSION}). Dernière vérification effectuée avec succès.`;

    return {
      hasUpdate,
      currentVersion: APP_VERSION,
      latestVersion,
      checkedAtIso: nowIso,
      message,
    };
  }

  /**
   * Forces complete update: clears CacheStorage, invalidates old service workers,
   * skips waiting on new workers, and triggers a hard reload.
   */
  static async forceUpdate(): Promise<void> {
    // 1. Clear CacheStorage
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      } catch (err) {
        console.warn('Error clearing caches:', err);
      }
    }

    // 2. Inform waiting Service Worker to skipWaiting
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        await registration?.update();
      } catch (err) {
        console.warn('Error updating Service Worker:', err);
      }
    }

    // 3. Clear session storage
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.clear();
      } catch {
        // Ignore
      }
    }

    // Record last check
    this.setLastCheckDate(new Date().toISOString());

    // 4. Force hard reload from server
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  /**
   * Starts background monitoring loop and visibilitychange listener.
   * If auto-update is enabled and a new ServiceWorker is waiting, it auto-installs it.
   */
  static startBackgroundUpdateWatcher(
    onUpdateInstalled?: (version: string) => void
  ): () => void {
    if (typeof window === 'undefined') return () => {};

    const checkAndAutoInstall = async () => {
      if (!this.isAutoUpdateEnabled()) return;

      try {
        // Check for updates
        const result = await this.checkForUpdates();
        if (result.hasUpdate) {
          // If a new SW is waiting, automatically activate it
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration?.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
          }
          if (onUpdateInstalled) {
            onUpdateInstalled(result.latestVersion);
          }
        }
      } catch (err) {
        // Background check silent fail
      }
    };

    // Run initial check after 5 seconds
    const initialTimer = setTimeout(checkAndAutoInstall, 5000);

    // Setup interval
    const intervalMinutes = this.getAutoUpdateIntervalMinutes();
    const intervalMs = intervalMinutes * 60 * 1000;
    const intervalId = setInterval(checkAndAutoInstall, intervalMs);

    // Also check when document becomes visible again
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndAutoInstall();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }
}
