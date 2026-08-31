import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  Firestore,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { ChildProfile, AuthorProfile, Memory, Letter, MilestoneItem, SecuritySettings, StorageData, MediaItem } from '@/types';
import { compressDataUrl } from '@/services/mediaService';

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!appInstance) {
    if (getApps().length > 0) {
      appInstance = getApp();
    } else {
      appInstance = initializeApp({
        apiKey: firebaseConfig.apiKey,
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId,
        appId: firebaseConfig.appId,
      });
    }
  }
  return appInstance;
}

export function getDb(): Firestore {
  if (!dbInstance) {
    const app = getFirebaseApp();
    // Connect with custom firestoreDatabaseId if specified
    const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
      ? firebaseConfig.firestoreDatabaseId
      : undefined;

    try {
      dbInstance = dbId
        ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true }, dbId)
        : initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
    } catch {
      dbInstance = dbId ? getFirestore(app, dbId) : getFirestore(app);
    }
  }
  return dbInstance;
}

// Helper function to recursively remove `undefined` fields which Firestore rejects
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => cleanFirestoreData(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    if (obj instanceof Date) {
      return obj as unknown as T;
    }
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirestoreData(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

// Helper functions to prepare and optimize payloads for Firestore (1MB document limit)
export async function prepareMemoryForFirestore(memory: Memory): Promise<Memory> {
  const prepared: Memory = { ...memory };

  // 1. Optimize Photos
  if (prepared.photos && prepared.photos.length > 0) {
    const optimizedPhotos: MediaItem[] = [];
    const totalPhotos = prepared.photos.length;

    for (const photo of prepared.photos) {
      if (photo.url && photo.url.startsWith('data:image/')) {
        // Dynamic target size depending on photo count
        const maxDim = totalPhotos > 6 ? 600 : totalPhotos > 3 ? 800 : 1000;
        const quality = totalPhotos > 6 ? 0.55 : totalPhotos > 3 ? 0.65 : 0.72;
        const maxBytes = Math.floor(400000 / Math.max(1, totalPhotos));

        try {
          const compressedUrl = await compressDataUrl(photo.url, {
            maxDimension: maxDim,
            quality,
            maxBytes,
          });
          optimizedPhotos.push({ ...photo, url: compressedUrl });
        } catch {
          optimizedPhotos.push(photo);
        }
      } else {
        optimizedPhotos.push(photo);
      }
    }
    prepared.photos = optimizedPhotos;
  }

  // 2. Protect Videos: Never send heavy base64 video payloads directly in the Firestore document
  if (prepared.videos && prepared.videos.length > 0) {
    prepared.videos = prepared.videos.map((vid) => {
      // If video URL is a large base64 data URI (> 50KB), strip the payload from Firestore doc
      if (vid.url && (vid.url.startsWith('data:') || vid.url.length > 50000)) {
        return {
          ...vid,
          url: '', // Video stream is preserved locally in IndexedDB
        };
      }
      return vid;
    });
  }

  // 3. Protect Voice Audio Recordings: If voice notes exceed 80KB in base64, strip huge payload from Firestore doc
  if (prepared.audios && prepared.audios.length > 0) {
    prepared.audios = prepared.audios.map((aud) => {
      if (aud.url && (aud.url.startsWith('data:') || aud.url.length > 80000)) {
        return {
          ...aud,
          url: '', // Preserved locally in IndexedDB
        };
      }
      return aud;
    });
  }

  // 4. Hard safety check: Calculate JSON byte size
  let jsonSize = JSON.stringify(prepared).length;
  // Firestore hard limit is 1,048,576 bytes. We enforce safe max of 650,000 bytes.
  if (jsonSize > 650000 && prepared.photos && prepared.photos.length > 0) {
    const emergencyPhotos: MediaItem[] = [];
    for (const p of prepared.photos) {
      if (p.url && p.url.startsWith('data:image/')) {
        try {
          const comp = await compressDataUrl(p.url, {
            maxDimension: 480,
            quality: 0.5,
            maxBytes: 40000,
          });
          emergencyPhotos.push({ ...p, url: comp });
        } catch {
          emergencyPhotos.push(p);
        }
      } else {
        emergencyPhotos.push(p);
      }
    }
    prepared.photos = emergencyPhotos;
  }

  // Final emergency check: if still over 750KB, slice photos to ensure document is accepted
  if (JSON.stringify(prepared).length > 750000 && prepared.photos) {
    prepared.photos = prepared.photos.slice(0, 2);
  }

  return prepared;
}

export async function prepareLetterForFirestore(letter: Letter): Promise<Letter> {
  const prepared: Letter = { ...letter };
  if (prepared.photoUrl && prepared.photoUrl.startsWith('data:image/')) {
    try {
      prepared.photoUrl = await compressDataUrl(prepared.photoUrl, {
        maxDimension: 1000,
        quality: 0.7,
        maxBytes: 150000,
      });
    } catch {
      // Keep existing if error
    }
  }
  return prepared;
}

export async function prepareVaultRootForFirestore(data: {
  childProfile?: ChildProfile;
  authors?: AuthorProfile[];
  securitySettings?: SecuritySettings;
}) {
  const prepared = { ...data };
  if (prepared.childProfile?.profilePhoto && prepared.childProfile.profilePhoto.startsWith('data:image/')) {
    try {
      prepared.childProfile = {
        ...prepared.childProfile,
        profilePhoto: await compressDataUrl(prepared.childProfile.profilePhoto, {
          maxDimension: 700,
          quality: 0.75,
          maxBytes: 150000,
        }),
      };
    } catch {
      // Keep existing if compression fails
    }
  }

  if (prepared.authors && prepared.authors.length > 0) {
    const updatedAuthors: AuthorProfile[] = [];
    for (const a of prepared.authors) {
      if (a.photo && a.photo.startsWith('data:image/')) {
        try {
          const compressed = await compressDataUrl(a.photo, {
            maxDimension: 500,
            quality: 0.75,
            maxBytes: 100000,
          });
          updatedAuthors.push({ ...a, photo: compressed });
        } catch {
          updatedAuthors.push(a);
        }
      } else {
        updatedAuthors.push(a);
      }
    }
    prepared.authors = updatedAuthors;
  }

  return prepared;
}

// Default Vault ID for the couple / family
export const DEFAULT_VAULT_ID = 'OLIVIA-PAIS';
const VAULT_STORAGE_KEY = 'pv_active_vault_id';
const DEVICE_ROLE_KEY = 'pv_device_role'; // 'papai' | 'mamae'
const CUSTOM_PUBLIC_URL_KEY = 'pv_custom_public_url';

export const FirebaseSyncService = {
  // Public base URL detection
  getPublicBaseUrl(): string {
    const defaultPublicUrl = 'https://ais-pre-c5wymvut6hzyb6diqtjxq2-257036603091.us-east1.run.app';
    if (typeof window === 'undefined') {
      return defaultPublicUrl;
    }

    // 1. Check custom saved public URL
    const custom = localStorage.getItem(CUSTOM_PUBLIC_URL_KEY);
    if (custom && custom.trim().startsWith('http')) {
      return custom.trim().replace(/\/+$/, '');
    }

    const { origin, hostname } = window.location;

    // 2. If running inside AI Studio development container (ais-dev-*),
    // we MUST convert it to the public shareable preview URL (ais-pre-*),
    // because ais-dev-* requires the creator's Google Account and causes
    // "Google 403: Você não tem acesso a esta página" on the mother's phone.
    if (origin.includes('ais-dev-')) {
      return origin.replace('ais-dev-', 'ais-pre-').replace(/\/+$/, '');
    }

    // 3. If running on standard public domain (e.g. Vercel, Firebase Hosting, Custom Domain, Cloud Run)
    if (
      hostname !== 'localhost' &&
      !hostname.startsWith('127.0.0.1') &&
      !hostname.startsWith('192.168.') &&
      !hostname.startsWith('10.') &&
      !hostname.includes('internal')
    ) {
      return origin.replace(/\/+$/, '');
    }

    // 4. Default fallback
    return defaultPublicUrl;
  },

  setCustomPublicUrl(url: string): void {
    if (typeof window === 'undefined') return;
    if (!url || !url.trim()) {
      localStorage.removeItem(CUSTOM_PUBLIC_URL_KEY);
    } else {
      localStorage.setItem(CUSTOM_PUBLIC_URL_KEY, url.trim());
    }
  },

  // Test connection to Firestore
  async testConnection(): Promise<boolean> {
    try {
      const db = getDb();
      await getDocFromServer(doc(db, 'vaults', 'test-connection'));
      return true;
    } catch (err) {
      console.warn('Firestore connection check note:', err);
      return false;
    }
  },

  // Get current active Vault ID (checks URL query params first, then localStorage)
  getActiveVaultId(): string {
    if (typeof window === 'undefined') return DEFAULT_VAULT_ID;
    
    // Check URL param ?vault=XXX or ?codigo=XXX or ?familia=XXX
    const params = new URLSearchParams(window.location.search);
    const paramVault = params.get('vault') || params.get('codigo') || params.get('familia') || params.get('pair');
    if (paramVault && paramVault.trim()) {
      const clean = paramVault.trim().toUpperCase();
      localStorage.setItem(VAULT_STORAGE_KEY, clean);
      return clean;
    }

    const saved = localStorage.getItem(VAULT_STORAGE_KEY);
    if (saved && saved.trim()) {
      return saved.trim().toUpperCase();
    }

    localStorage.setItem(VAULT_STORAGE_KEY, DEFAULT_VAULT_ID);
    return DEFAULT_VAULT_ID;
  },

  // Set new active vault ID (e.g. when connecting with code)
  setActiveVaultId(vaultId: string): void {
    if (typeof window === 'undefined') return;
    const clean = (vaultId || DEFAULT_VAULT_ID).trim().toUpperCase();
    localStorage.setItem(VAULT_STORAGE_KEY, clean);
  },

  // Get device persona ('papai' or 'mamae')
  getDeviceRole(): 'papai' | 'mamae' {
    if (typeof window === 'undefined') return 'papai';
    
    // Check if passed via URL ?role=mamae
    const params = new URLSearchParams(window.location.search);
    const paramRole = params.get('role');
    if (paramRole === 'mamae' || paramRole === 'papai') {
      localStorage.setItem(DEVICE_ROLE_KEY, paramRole);
      return paramRole;
    }

    const saved = localStorage.getItem(DEVICE_ROLE_KEY);
    if (saved === 'mamae') return 'mamae';
    return 'papai';
  },

  setDeviceRole(role: 'papai' | 'mamae'): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DEVICE_ROLE_KEY, role);
  },

  // Generate shareable link specifically for Mamãe (or Papai)
  getShareableLink(vaultId?: string, targetRole: 'mamae' | 'papai' = 'mamae'): string {
    const id = vaultId || this.getActiveVaultId();
    const baseUrl = this.getPublicBaseUrl();
    try {
      const url = new URL(baseUrl);
      url.searchParams.set('vault', id);
      url.searchParams.set('role', targetRole);
      return url.toString();
    } catch {
      return `${baseUrl}?vault=${encodeURIComponent(id)}&role=${encodeURIComponent(targetRole)}`;
    }
  },

  // Universal parser for scanned QR code or pasted input
  parsePairingInput(input: string): { vaultId: string; role?: 'papai' | 'mamae' } | null {
    if (!input || !input.trim()) return null;
    const raw = input.trim();

    try {
      // 1. Try URL parsing
      if (raw.startsWith('http://') || raw.startsWith('https://') || raw.includes('?')) {
        const url = new URL(raw.startsWith('http') ? raw : `https://dummy.app/${raw}`);
        const vault = url.searchParams.get('vault') || url.searchParams.get('codigo') || url.searchParams.get('familia') || url.searchParams.get('pair');
        const role = url.searchParams.get('role');
        if (vault && vault.trim()) {
          return {
            vaultId: vault.trim().toUpperCase(),
            role: role === 'mamae' || role === 'papai' ? role : undefined,
          };
        }
      }
    } catch {
      // Not a valid URL, fall through to text parsing
    }

    // 2. Try JSON parsing
    try {
      if (raw.startsWith('{') && raw.endsWith('}')) {
        const parsed = JSON.parse(raw);
        if (parsed.vaultId || parsed.vault || parsed.codigo) {
          return {
            vaultId: (parsed.vaultId || parsed.vault || parsed.codigo).trim().toUpperCase(),
            role: parsed.role === 'mamae' || parsed.role === 'papai' ? parsed.role : undefined,
          };
        }
      }
    } catch {
      // Ignore
    }

    // 3. Fallback: treat raw string as Vault Code (e.g. "OLIVIA-PAIS" or "FAMILIA-123")
    const cleanCode = raw.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();
    if (cleanCode.length >= 3) {
      return { vaultId: cleanCode };
    }

    return null;
  },

  // Initialize or save root Vault document
  async syncVaultRoot(
    vaultId: string,
    data: {
      childProfile?: ChildProfile;
      authors?: AuthorProfile[];
      securitySettings?: SecuritySettings;
    }
  ): Promise<void> {
    try {
      const db = getDb();
      const vaultRef = doc(db, 'vaults', vaultId);

      const optimizedData = await prepareVaultRootForFirestore(data);

      const updatePayload: Record<string, any> = {
        id: vaultId,
        updatedAt: new Date().toISOString(),
      };

      if (optimizedData.childProfile) {
        updatePayload.childProfile = optimizedData.childProfile;
        updatePayload.name = `Família de ${optimizedData.childProfile.name || 'Olívia'}`;
      }
      if (optimizedData.authors) updatePayload.authors = optimizedData.authors;
      if (optimizedData.securitySettings) updatePayload.securitySettings = optimizedData.securitySettings;

      await setDoc(vaultRef, cleanFirestoreData(updatePayload), { merge: true });
    } catch (error) {
      console.warn('Notice syncing vault root to Firestore (operating offline/cached):', error);
    }
  },

  // Subscribe to Vault metadata in real-time
  subscribeVaultRoot(
    vaultId: string,
    onData: (data: {
      childProfile?: ChildProfile;
      authors?: AuthorProfile[];
      securitySettings?: SecuritySettings;
    }) => void
  ): () => void {
    const db = getDb();
    const vaultRef = doc(db, 'vaults', vaultId);

    const unsubscribe = onSnapshot(
      vaultRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const d = snapshot.data();
          onData({
            childProfile: d.childProfile,
            authors: d.authors,
            securitySettings: d.securitySettings,
          });
        }
      },
      (error) => {
        console.warn('Vault onSnapshot warning:', error);
      }
    );

    return unsubscribe;
  },

  // Real-time listener for Memories
  subscribeMemories(vaultId: string, onUpdate: (memories: Memory[]) => void): () => void {
    const db = getDb();
    const memoriesRef = collection(db, 'vaults', vaultId, 'memories');
    const q = query(memoriesRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Memory[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as Memory;
          list.push(data);
        });
        // Sort descending by date
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('Memories onSnapshot warning:', error);
      }
    );

    return unsubscribe;
  },

  // Real-time listener for Letters
  subscribeLetters(vaultId: string, onUpdate: (letters: Letter[]) => void): () => void {
    const db = getDb();
    const lettersRef = collection(db, 'vaults', vaultId, 'letters');
    const q = query(lettersRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Letter[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as Letter;
          list.push(data);
        });
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('Letters onSnapshot warning:', error);
      }
    );

    return unsubscribe;
  },

  // Real-time listener for Milestones
  subscribeMilestones(vaultId: string, onUpdate: (milestones: MilestoneItem[]) => void): () => void {
    const db = getDb();
    const milestonesRef = collection(db, 'vaults', vaultId, 'milestones');

    const unsubscribe = onSnapshot(
      milestonesRef,
      (snapshot) => {
        const list: MilestoneItem[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as MilestoneItem);
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('Milestones onSnapshot warning:', error);
      }
    );

    return unsubscribe;
  },

  // Save single memory to Firestore
  async saveMemory(vaultId: string, memory: Memory): Promise<void> {
    try {
      const db = getDb();
      const memRef = doc(db, 'vaults', vaultId, 'memories', memory.id);
      const optimized = await prepareMemoryForFirestore(memory);
      const cleaned = cleanFirestoreData({
        ...optimized,
        vaultId,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(memRef, cleaned, { merge: true });
    } catch (error: any) {
      console.warn('Initial Firestore write notice for memory:', error?.message);
      // Emergency Fallback: If document was oversized or had complex payload, retry with minimal cloud payload
      try {
        const db = getDb();
        const memRef = doc(db, 'vaults', vaultId, 'memories', memory.id);
        const fallbackMemory: Memory = {
          ...memory,
          photos: memory.photos?.map((p, idx) => (idx === 0 ? p : { ...p, url: '' })),
          videos: memory.videos?.map((v) => ({ ...v, url: '' })),
          audios: memory.audios?.map((a) => ({ ...a, url: '' })),
        };
        const optimizedFallback = await prepareMemoryForFirestore(fallbackMemory);
        const cleanedFallback = cleanFirestoreData({
          ...optimizedFallback,
          vaultId,
          updatedAt: new Date().toISOString(),
        });
        await setDoc(memRef, cleanedFallback, { merge: true });
      } catch (fallbackError) {
        console.error('Error saving memory fallback to Firestore:', fallbackError);
      }
    }
  },

  // Delete memory in Firestore
  async deleteMemory(vaultId: string, memoryId: string): Promise<void> {
    try {
      const db = getDb();
      const memRef = doc(db, 'vaults', vaultId, 'memories', memoryId);
      await deleteDoc(memRef);
    } catch (error) {
      console.error('Error deleting memory in Firestore:', error);
    }
  },

  // Save single letter to Firestore
  async saveLetter(vaultId: string, letter: Letter): Promise<void> {
    try {
      const db = getDb();
      const letterRef = doc(db, 'vaults', vaultId, 'letters', letter.id);
      const optimized = await prepareLetterForFirestore(letter);
      const cleaned = cleanFirestoreData({
        ...optimized,
        vaultId,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(letterRef, cleaned, { merge: true });
    } catch (error) {
      console.error('Error saving letter to Firestore:', error);
    }
  },

  // Delete letter in Firestore
  async deleteLetter(vaultId: string, letterId: string): Promise<void> {
    try {
      const db = getDb();
      const letterRef = doc(db, 'vaults', vaultId, 'letters', letterId);
      await deleteDoc(letterRef);
    } catch (error) {
      console.error('Error deleting letter in Firestore:', error);
    }
  },

  // Save milestone to Firestore
  async saveMilestone(vaultId: string, milestone: MilestoneItem): Promise<void> {
    try {
      const db = getDb();
      const mRef = doc(db, 'vaults', vaultId, 'milestones', milestone.id);
      const cleaned = cleanFirestoreData({
        ...milestone,
        vaultId,
      });
      await setDoc(mRef, cleaned, { merge: true });
    } catch (error) {
      console.error('Error saving milestone to Firestore:', error);
    }
  },

  // Seed full initial dataset into cloud if vault is newly created
  async seedVaultInitialData(vaultId: string, data: StorageData): Promise<void> {
    try {
      await this.syncVaultRoot(vaultId, {
        childProfile: data.childProfile,
        authors: data.authors,
        securitySettings: data.securitySettings,
      });

      // Save initial memories
      for (const m of data.memories) {
        await this.saveMemory(vaultId, m);
      }

      // Save initial letters
      for (const l of data.letters) {
        await this.saveLetter(vaultId, l);
      }

      // Save initial milestones
      for (const ms of data.milestones) {
        await this.saveMilestone(vaultId, ms);
      }
    } catch (err) {
      console.error('Error seeding initial data to Firestore:', err);
    }
  }
};
