/**
 * IndexedDB helper for robust local client-side storage of memories, letters, photos, and audios.
 * Provides fallback to localStorage if IndexedDB is unavailable.
 */

const DB_NAME = 'ParaVoceAppDB';
const DB_VERSION = 4;
const STORES = ['memories', 'letters', 'profiles', 'milestones', 'settings', 'media_blobs'];

let cachedDB: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (cachedDB) {
    try {
      let hasAll = true;
      for (const s of STORES) {
        if (!cachedDB.objectStoreNames.contains(s)) {
          hasAll = false;
          break;
        }
      }
      if (hasAll) {
        return Promise.resolve(cachedDB);
      }
      cachedDB.close();
      cachedDB = null;
    } catch {
      cachedDB = null;
    }
  }

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    let settled = false;
    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('IndexedDB open timeout'));
      }
    }, 1200);

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        STORES.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };

      request.onblocked = () => {
        console.warn('IndexedDB upgrade blocked by open connection.');
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          reject(new Error('IndexedDB blocked'));
        }
      };

      request.onsuccess = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          cachedDB = null;
        };
        cachedDB = db;
        resolve(db);
      };

      request.onerror = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        reject(request.error || new Error('IndexedDB open error'));
      };
    } catch (e) {
      if (!settled) {
        settled = true;
        clearTimeout(timeoutId);
        reject(e);
      }
    }
  });
}

export async function idbGet<T>(storeName: string, id: string): Promise<T | null> {
  try {
    const dbPromise = openDB();
    const db = await Promise.race([
      dbPromise,
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 1000))
    ]);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback to localStorage
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`pv_${storeName}_${id}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

export async function idbGetAll<T>(storeName: string): Promise<T[]> {
  try {
    const dbPromise = openDB();
    const db = await Promise.race([
      dbPromise,
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 1000))
    ]);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback to localStorage
    if (typeof window === 'undefined') return [];
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(`pv_${storeName}_`));
      return keys.map((k) => {
        try {
          return JSON.parse(localStorage.getItem(k) || '{}');
        } catch {
          return null;
        }
      }).filter(Boolean);
    } catch {
      return [];
    }
  }
}

export async function idbSet<T extends { id: string }>(storeName: string, item: T): Promise<void> {
  try {
    const dbPromise = openDB();
    const db = await Promise.race([
      dbPromise,
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 1000))
    ]);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => {
        // Also keep a lightweight mirror in localStorage for fast sync if needed
        try {
          localStorage.setItem(`pv_${storeName}_${item.id}`, JSON.stringify(item));
        } catch {
          // Ignore localStorage quota exceeded since IndexedDB succeeded
        }
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`pv_${storeName}_${item.id}`, JSON.stringify(item));
      } catch (e) {
        console.error('Storage quota exceeded', e);
      }
    }
  }
}

export async function idbDelete(storeName: string, id: string): Promise<void> {
  try {
    const dbPromise = openDB();
    const db = await Promise.race([
      dbPromise,
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 1000))
    ]);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`pv_${storeName}_${id}`);
        }
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`pv_${storeName}_${id}`);
    }
  }
}

export async function idbClear(storeName: string): Promise<void> {
  try {
    const dbPromise = openDB();
    const db = await Promise.race([
      dbPromise,
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 1000))
    ]);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => {
        if (typeof window !== 'undefined') {
          const keys = Object.keys(localStorage).filter((k) => k.startsWith(`pv_${storeName}_`));
          keys.forEach((k) => localStorage.removeItem(k));
        }
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(`pv_${storeName}_`));
      keys.forEach((k) => localStorage.removeItem(k));
    }
  }
}
