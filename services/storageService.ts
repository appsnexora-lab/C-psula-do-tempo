import { 
  Memory, 
  Letter, 
  ChildProfile, 
  AuthorProfile, 
  MilestoneItem, 
  SecuritySettings, 
  AppSettings,
  StorageData
} from '@/types';
import { idbGet, idbGetAll, idbSet, idbDelete, idbClear } from '@/lib/idb';
import { 
  defaultChildProfile, 
  defaultAuthorProfile, 
  defaultAuthors,
  defaultSecuritySettings, 
  defaultAppSettings, 
  initialMilestones, 
  initialMemories, 
  initialLetters 
} from '@/data/initialData';
import { FirebaseSyncService } from './firebaseService';

// Keys
const STORE_MEMORIES = 'memories';
const STORE_LETTERS = 'letters';
const STORE_PROFILES = 'profiles';
const STORE_MILESTONES = 'milestones';
const STORE_SETTINGS = 'settings';

export const storageService = {
  getFallbackData(): StorageData {
    let cachedChild = defaultChildProfile;
    let cachedAuthor = defaultAuthorProfile;
    let cachedAuthors = defaultAuthors;

    if (typeof window !== 'undefined') {
      try {
        const rawChild = localStorage.getItem('pv_child_profile_cache');
        if (rawChild) {
          const parsed = JSON.parse(rawChild);
          if (parsed && typeof parsed === 'object') {
            if (parsed.profilePhoto && parsed.profilePhoto.includes('1544126592-807ade215a0b')) {
              parsed.profilePhoto = '';
            }
            cachedChild = { ...defaultChildProfile, ...parsed };
          }
        }
      } catch {
        // ignore JSON parse error
      }

      try {
        const rawAuthor = localStorage.getItem('pv_author_profile_cache');
        if (rawAuthor) {
          const parsed = JSON.parse(rawAuthor);
          if (parsed && typeof parsed === 'object') {
            cachedAuthor = { ...defaultAuthorProfile, ...parsed };
          }
        }
      } catch {
        // ignore JSON parse error
      }

      try {
        const rawAuthors = localStorage.getItem('pv_authors_cache');
        if (rawAuthors) {
          const parsed = JSON.parse(rawAuthors);
          if (Array.isArray(parsed) && parsed.length > 0) {
            cachedAuthors = parsed;
          }
        }
      } catch {
        // ignore JSON parse error
      }
    }

    return {
      childProfile: cachedChild,
      authorProfile: cachedAuthor,
      authors: cachedAuthors,
      memories: initialMemories,
      letters: initialLetters,
      milestones: initialMilestones,
      securitySettings: defaultSecuritySettings,
      appSettings: defaultAppSettings,
      isInitialized: true,
    };
  },

  // Initialization & Seeding
  async initialize(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const initialized = localStorage.getItem('pv_initialized');
      if (!initialized) {
        // Seed default settings and data in parallel
        await Promise.all([
          this.saveChildProfile(defaultChildProfile, false),
          this.saveAuthorProfile(defaultAuthorProfile, false),
          this.saveAuthors(defaultAuthors, false),
          this.saveSecuritySettings(defaultSecuritySettings, false),
          this.saveAppSettings(defaultAppSettings),
          ...initialMilestones.map((m) => idbSet(STORE_MILESTONES, m)),
          ...initialMemories.map((mem) => idbSet(STORE_MEMORIES, mem)),
          ...initialLetters.map((letItem) => idbSet(STORE_LETTERS, letItem)),
        ]);

        localStorage.setItem('pv_initialized', 'true');
      }
    } catch (e) {
      console.warn('Notice during storage initialization:', e);
    }
  },

  async getData(): Promise<StorageData> {
    try {
      await this.initialize();
      const [
        childProfile,
        authorProfile,
        authors,
        securitySettings,
        appSettings,
        memories,
        letters,
        milestones,
      ] = await Promise.all([
        this.getChildProfile(),
        this.getAuthorProfile(),
        this.getAuthors(),
        this.getSecuritySettings(),
        this.getAppSettings(),
        this.getMemories(true),
        this.getLetters(true),
        this.getMilestones(),
      ]);

      const isInitialized = typeof window !== 'undefined' ? localStorage.getItem('pv_initialized') === 'true' : true;

      return {
        childProfile,
        authorProfile,
        authors,
        memories: memories && memories.length > 0 ? memories : initialMemories,
        letters: letters && letters.length > 0 ? letters : initialLetters,
        milestones: milestones && milestones.length > 0 ? milestones : initialMilestones,
        securitySettings,
        appSettings,
        isInitialized,
      };
    } catch (err) {
      console.warn('Using fallback data due to error:', err);
      return this.getFallbackData();
    }
  },

  async setInitialized(value: boolean): Promise<void> {
    if (typeof window !== 'undefined') {
      if (value) localStorage.setItem('pv_initialized', 'true');
      else localStorage.removeItem('pv_initialized');
    }
  },

  // Reset to fresh empty state or reload demo
  async resetToDemo(): Promise<void> {
    await idbClear(STORE_MEMORIES);
    await idbClear(STORE_LETTERS);
    await idbClear(STORE_MILESTONES);
    await idbClear(STORE_PROFILES);
    await idbClear(STORE_SETTINGS);

    if (typeof window !== 'undefined') {
      localStorage.removeItem('pv_initialized');
    }
    await this.initialize();
  },

  async clearAll(): Promise<void> {
    await idbClear(STORE_MEMORIES);
    await idbClear(STORE_LETTERS);
    await idbClear(STORE_MILESTONES);
    await idbClear(STORE_PROFILES);
    await idbClear(STORE_SETTINGS);

    if (typeof window !== 'undefined') {
      localStorage.setItem('pv_initialized', 'false');
    }
    await this.saveChildProfile({ name: '', birthDate: '' });
    await this.saveAuthorProfile({ name: '', relation: 'Pai' });
    await this.saveSecuritySettings(defaultSecuritySettings);
    await this.saveAppSettings({ theme: 'light', hasCompletedOnboarding: false, useDemoData: false });
    for (const m of initialMilestones) {
      await idbSet(STORE_MILESTONES, { ...m, achievedDate: undefined, memoryId: undefined });
    }
  },

  // Child Profile
  async getChildProfile(): Promise<ChildProfile> {
    const res = await idbGet<{ id: string; profile: ChildProfile }>(STORE_PROFILES, 'child');
    let profile = res?.profile;
    if (!profile && typeof window !== 'undefined') {
      const raw = localStorage.getItem('pv_child_profile_cache');
      if (raw) {
        try {
          profile = JSON.parse(raw);
        } catch {
          // ignore
        }
      }
    }
    if (!profile) {
      profile = defaultChildProfile;
    }
    if (profile.profilePhoto && profile.profilePhoto.includes('1544126592-807ade215a0b')) {
      profile.profilePhoto = '';
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pv_child_profile_cache', JSON.stringify(profile));
      } catch {
        // ignore
      }
    }
    return profile;
  },

  async saveChildProfile(profile: ChildProfile, syncRemote: boolean = true): Promise<void> {
    const sanitized = { ...profile };
    if (sanitized.profilePhoto && sanitized.profilePhoto.includes('1544126592-807ade215a0b')) {
      sanitized.profilePhoto = '';
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pv_child_profile_cache', JSON.stringify(sanitized));
      } catch (e) {
        console.warn('LocalStorage save error for child profile:', e);
      }
    }
    await idbSet(STORE_PROFILES, { id: 'child', profile: sanitized });
    if (syncRemote) {
      const vaultId = FirebaseSyncService.getActiveVaultId();
      FirebaseSyncService.syncVaultRoot(vaultId, { childProfile: sanitized }).catch(console.error);
    }
  },

  // Author Profile
  async getAuthorProfile(): Promise<AuthorProfile> {
    const res = await idbGet<{ id: string; profile: AuthorProfile }>(STORE_PROFILES, 'author');
    let profile = res?.profile;
    if (!profile && typeof window !== 'undefined') {
      const raw = localStorage.getItem('pv_author_profile_cache');
      if (raw) {
        try {
          profile = JSON.parse(raw);
        } catch {
          // ignore
        }
      }
    }
    return profile || defaultAuthorProfile;
  },

  async saveAuthorProfile(profile: AuthorProfile, syncRemote: boolean = true): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pv_author_profile_cache', JSON.stringify(profile));
      } catch {
        // ignore
      }
    }
    await idbSet(STORE_PROFILES, { id: 'author', profile });
    if (syncRemote) {
      const authors = await this.getAuthors();
      const idx = authors.findIndex(a => a.id === profile.id || a.isPrimary);
      if (idx >= 0) {
        authors[idx] = { ...authors[idx], ...profile };
      } else {
        authors.unshift(profile);
      }
      await this.saveAuthors(authors, true);
    }
  },

  // Multiple Authors (Papai, Mamãe, etc.)
  async getAuthors(): Promise<AuthorProfile[]> {
    const res = await idbGet<{ id: string; list: AuthorProfile[] }>(STORE_PROFILES, 'authors_list');
    if (res?.list && res.list.length > 0) {
      return res.list;
    }
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('pv_authors_cache');
      if (raw) {
        try {
          const list = JSON.parse(raw);
          if (Array.isArray(list) && list.length > 0) return list;
        } catch {
          // ignore
        }
      }
    }
    const single = await this.getAuthorProfile();
    return [
      single,
      {
        id: 'author-mom',
        name: 'Mamãe',
        relation: 'Mãe',
        isPrimary: false,
      }
    ];
  },

  async saveAuthors(authors: AuthorProfile[], syncRemote: boolean = true): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pv_authors_cache', JSON.stringify(authors));
      } catch {
        // ignore
      }
    }
    await idbSet(STORE_PROFILES, { id: 'authors_list', list: authors });
    if (authors.length > 0) {
      const primary = authors.find((a) => a.isPrimary) || authors[0];
      await this.saveAuthorProfile(primary, false);
    }
    if (syncRemote) {
      const vaultId = FirebaseSyncService.getActiveVaultId();
      FirebaseSyncService.syncVaultRoot(vaultId, { authors }).catch(console.error);
    }
  },

  // Security Settings
  async getSecuritySettings(): Promise<SecuritySettings> {
    const res = await idbGet<{ id: string; settings: SecuritySettings }>(STORE_SETTINGS, 'security');
    return res?.settings || defaultSecuritySettings;
  },

  async saveSecuritySettings(settings: SecuritySettings, syncRemote: boolean = true): Promise<void> {
    await idbSet(STORE_SETTINGS, { id: 'security', settings });
    if (syncRemote) {
      const vaultId = FirebaseSyncService.getActiveVaultId();
      FirebaseSyncService.syncVaultRoot(vaultId, { securitySettings: settings }).catch(console.error);
    }
  },

  // App Settings
  async getAppSettings(): Promise<AppSettings> {
    const res = await idbGet<{ id: string; settings: AppSettings }>(STORE_SETTINGS, 'app');
    return res?.settings || defaultAppSettings;
  },

  async saveAppSettings(settings: AppSettings): Promise<void> {
    await idbSet(STORE_SETTINGS, { id: 'app', settings });
  },

  // Media Blob Cache (keeps heavy media files permanently preserved locally)
  async saveMediaBlob(id: string, url: string, name?: string): Promise<void> {
    if (!id || !url || url.trim() === '') return;
    try {
      await idbSet('media_blobs', { id, url, name, savedAt: new Date().toISOString() });
    } catch {
      // fallback
    }
    await idbSet(STORE_SETTINGS, { id: `media_${id}`, url, name });
  },

  async getMediaBlob(id: string): Promise<string | null> {
    if (!id) return null;
    try {
      const resBlob = await idbGet<{ id: string; url: string }>('media_blobs', id);
      if (resBlob?.url) return resBlob.url;
    } catch {
      // ignore
    }
    const resSetting = await idbGet<{ id: string; url: string }>(STORE_SETTINGS, `media_${id}`);
    if (resSetting?.url) return resSetting.url;

    const resDirect = await idbGet<{ id: string; url: string }>(STORE_SETTINGS, id);
    return resDirect?.url || null;
  },

  // Memories
  async getMemories(includeDeleted: boolean = false): Promise<Memory[]> {
    try {
      const all = await idbGetAll<Memory>(STORE_MEMORIES);
      const filtered = includeDeleted ? all : all.filter((m) => !m.isDeleted);
      return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch {
      return initialMemories;
    }
  },

  async getMemoryById(id: string): Promise<Memory | null> {
    const m = await idbGet<Memory>(STORE_MEMORIES, id);
    if (!m) return null;

    let changed = false;
    const videos = m.videos
      ? await Promise.all(
          m.videos.map(async (v) => {
            if (!v.url || v.url === '') {
              const cachedUrl =
                (await this.getMediaBlob(v.id)) ||
                (v.name ? await this.getMediaBlob(v.name) : null) ||
                (await this.getMediaBlob(`${m.id}_${v.id}`)) ||
                (await this.getMediaBlob(m.id));
              if (cachedUrl) {
                changed = true;
                return { ...v, url: cachedUrl };
              }
            }
            return v;
          })
        )
      : m.videos;

    const audios = m.audios
      ? await Promise.all(
          m.audios.map(async (a) => {
            if (!a.url || a.url === '') {
              const cachedUrl =
                (await this.getMediaBlob(a.id)) ||
                (await this.getMediaBlob(`${m.id}_${a.id}`));
              if (cachedUrl) {
                changed = true;
                return { ...a, url: cachedUrl };
              }
            }
            return a;
          })
        )
      : m.audios;

    if (changed) {
      const updatedMem = { ...m, videos, audios };
      await idbSet(STORE_MEMORIES, updatedMem);
      return updatedMem;
    }
    return m;
  },

  async saveMemory(memory: Memory, syncRemote: boolean = true): Promise<void> {
    // 1. Cache media blobs permanently
    if (memory.videos) {
      for (const v of memory.videos) {
        if (v.url && v.url.trim() !== '') {
          await this.saveMediaBlob(v.id, v.url, v.name);
          if (v.name) await this.saveMediaBlob(v.name, v.url, v.name);
          await this.saveMediaBlob(`${memory.id}_${v.id}`, v.url, v.name);
          await this.saveMediaBlob(memory.id, v.url, v.name);
        }
      }
    }
    if (memory.audios) {
      for (const a of memory.audios) {
        if (a.url && a.url.trim() !== '') {
          await this.saveMediaBlob(a.id, a.url, a.title);
          await this.saveMediaBlob(`${memory.id}_${a.id}`, a.url, a.title);
        }
      }
    }

    await idbSet(STORE_MEMORIES, memory);

    // If milestone achieved, link to milestones store
    if (memory.isFirstTime && memory.firstTimeCategory) {
      const milestones = await this.getMilestones();
      const match = milestones.find((m) => m.category === memory.firstTimeCategory || m.title === memory.firstTimeCategory);
      if (match) {
        match.achievedDate = memory.date;
        match.memoryId = memory.id;
        await idbSet(STORE_MILESTONES, match);
        if (syncRemote) {
          const vaultId = FirebaseSyncService.getActiveVaultId();
          FirebaseSyncService.saveMilestone(vaultId, match).catch(console.error);
        }
      } else {
        const newMilestone: MilestoneItem = {
          id: `custom-m-${Date.now()}`,
          title: memory.firstTimeCategory,
          category: memory.firstTimeCategory,
          achievedDate: memory.date,
          memoryId: memory.id,
          isCustom: true,
        };
        await idbSet(STORE_MILESTONES, newMilestone);
        if (syncRemote) {
          const vaultId = FirebaseSyncService.getActiveVaultId();
          FirebaseSyncService.saveMilestone(vaultId, newMilestone).catch(console.error);
        }
      }
    }

    if (syncRemote) {
      const vaultId = FirebaseSyncService.getActiveVaultId();
      FirebaseSyncService.saveMemory(vaultId, memory).catch(console.error);
    }
  },

  async softDeleteMemory(id: string, syncRemote: boolean = true): Promise<void> {
    const mem = await this.getMemoryById(id);
    if (mem) {
      mem.isDeleted = true;
      mem.deletedAt = new Date().toISOString();
      await idbSet(STORE_MEMORIES, mem);
      if (syncRemote) {
        const vaultId = FirebaseSyncService.getActiveVaultId();
        FirebaseSyncService.saveMemory(vaultId, mem).catch(console.error);
      }
    }
  },

  async restoreMemory(id: string, syncRemote: boolean = true): Promise<void> {
    const mem = await this.getMemoryById(id);
    if (mem) {
      mem.isDeleted = false;
      mem.deletedAt = undefined;
      await idbSet(STORE_MEMORIES, mem);
      if (syncRemote) {
        const vaultId = FirebaseSyncService.getActiveVaultId();
        FirebaseSyncService.saveMemory(vaultId, mem).catch(console.error);
      }
    }
  },

  async permanentDeleteMemory(id: string, syncRemote: boolean = true): Promise<void> {
    await idbDelete(STORE_MEMORIES, id);
    if (syncRemote) {
      const vaultId = FirebaseSyncService.getActiveVaultId();
      FirebaseSyncService.deleteMemory(vaultId, id).catch(console.error);
    }
  },

  // Letters
  async getLetters(includeDeleted: boolean = false): Promise<Letter[]> {
    const all = await idbGetAll<Letter>(STORE_LETTERS);
    const filtered = includeDeleted ? all : all.filter((l) => !l.isDeleted);
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async getLetterById(id: string): Promise<Letter | null> {
    return await idbGet<Letter>(STORE_LETTERS, id);
  },

  async saveLetter(letter: Letter, syncRemote: boolean = true): Promise<void> {
    await idbSet(STORE_LETTERS, letter);
    if (syncRemote) {
      const vaultId = FirebaseSyncService.getActiveVaultId();
      FirebaseSyncService.saveLetter(vaultId, letter).catch(console.error);
    }
  },

  async softDeleteLetter(id: string, syncRemote: boolean = true): Promise<void> {
    const letItem = await this.getLetterById(id);
    if (letItem) {
      letItem.isDeleted = true;
      letItem.deletedAt = new Date().toISOString();
      await idbSet(STORE_LETTERS, letItem);
      if (syncRemote) {
        const vaultId = FirebaseSyncService.getActiveVaultId();
        FirebaseSyncService.saveLetter(vaultId, letItem).catch(console.error);
      }
    }
  },

  async restoreLetter(id: string, syncRemote: boolean = true): Promise<void> {
    const letItem = await this.getLetterById(id);
    if (letItem) {
      letItem.isDeleted = false;
      letItem.deletedAt = undefined;
      await idbSet(STORE_LETTERS, letItem);
      if (syncRemote) {
        const vaultId = FirebaseSyncService.getActiveVaultId();
        FirebaseSyncService.saveLetter(vaultId, letItem).catch(console.error);
      }
    }
  },

  async permanentDeleteLetter(id: string, syncRemote: boolean = true): Promise<void> {
    await idbDelete(STORE_LETTERS, id);
    if (syncRemote) {
      const vaultId = FirebaseSyncService.getActiveVaultId();
      FirebaseSyncService.deleteLetter(vaultId, id).catch(console.error);
    }
  },

  // Milestones
  async getMilestones(): Promise<MilestoneItem[]> {
    const all = await idbGetAll<MilestoneItem>(STORE_MILESTONES);
    if (all.length === 0) return initialMilestones;
    return all;
  },

  async saveMilestone(item: MilestoneItem, syncRemote: boolean = true): Promise<void> {
    await idbSet(STORE_MILESTONES, item);
    if (syncRemote) {
      const vaultId = FirebaseSyncService.getActiveVaultId();
      FirebaseSyncService.saveMilestone(vaultId, item).catch(console.error);
    }
  },

  async addMilestone(item: MilestoneItem, syncRemote: boolean = true): Promise<void> {
    await idbSet(STORE_MILESTONES, item);
    if (syncRemote) {
      const vaultId = FirebaseSyncService.getActiveVaultId();
      FirebaseSyncService.saveMilestone(vaultId, item).catch(console.error);
    }
  },

  async updateMilestone(id: string, achievedDate: string, memoryId?: string, syncRemote: boolean = true): Promise<void> {
    const milestones = await this.getMilestones();
    const found = milestones.find((m) => m.id === id);
    if (found) {
      found.achievedDate = achievedDate;
      found.memoryId = memoryId;
      await idbSet(STORE_MILESTONES, found);
      if (syncRemote) {
        const vaultId = FirebaseSyncService.getActiveVaultId();
        FirebaseSyncService.saveMilestone(vaultId, found).catch(console.error);
      }
    }
  },

  // Trash
  async getTrashItems(): Promise<{
    memories: Memory[];
    letters: Letter[];
  }> {
    const allMemories = await idbGetAll<Memory>(STORE_MEMORIES);
    const allLetters = await idbGetAll<Letter>(STORE_LETTERS);
    return {
      memories: allMemories.filter((m) => m.isDeleted),
      letters: allLetters.filter((l) => l.isDeleted),
    };
  },

  // Bulk save remote items into local IDB cache
  async syncLocalFromRemote(data: {
    childProfile?: ChildProfile;
    authors?: AuthorProfile[];
    securitySettings?: SecuritySettings;
    memories?: Memory[];
    letters?: Letter[];
    milestones?: MilestoneItem[];
  }): Promise<void> {
    if (data.childProfile) {
      const sanitized = { ...data.childProfile };
      if (sanitized.profilePhoto && sanitized.profilePhoto.includes('1544126592-807ade215a0b')) {
        sanitized.profilePhoto = '';
      }
      await idbSet(STORE_PROFILES, { id: 'child', profile: sanitized });
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('pv_child_profile_cache', JSON.stringify(sanitized));
        } catch {
          // ignore
        }
      }
    }
    if (data.authors) {
      await idbSet(STORE_PROFILES, { id: 'authors_list', list: data.authors });
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('pv_authors_cache', JSON.stringify(data.authors));
        } catch {
          // ignore
        }
      }
    }
    if (data.securitySettings) await idbSet(STORE_SETTINGS, { id: 'security', settings: data.securitySettings });

    if (data.memories) {
      const currentLocal = await idbGetAll<Memory>(STORE_MEMORIES);
      const localMap = new Map<string, Memory>();
      currentLocal.forEach((m) => localMap.set(m.id, m));

      for (const m of data.memories) {
        const local = localMap.get(m.id);
        const existingVideos = local?.videos || [];

        const mergedVideos = await Promise.all(
          (m.videos || []).map(async (rv, i) => {
            const lv = existingVideos[i] || existingVideos.find((v) => v.id === rv.id || v.name === rv.name);
            let url = rv.url;
            if (!url || url === '') {
              url =
                lv?.url ||
                (await this.getMediaBlob(rv.id)) ||
                (rv.name ? await this.getMediaBlob(rv.name) : null) ||
                (await this.getMediaBlob(`${m.id}_${rv.id}`)) ||
                (await this.getMediaBlob(m.id)) ||
                '';
            }
            return {
              ...rv,
              url,
            };
          })
        );

        const mergedAudios = await Promise.all(
          (m.audios || []).map(async (ra, i) => {
            const la = local?.audios?.[i] || local?.audios?.find((a) => a.id === ra.id);
            let url = ra.url;
            if (!url || url === '') {
              url =
                la?.url ||
                (await this.getMediaBlob(ra.id)) ||
                (await this.getMediaBlob(`${m.id}_${ra.id}`)) ||
                '';
            }
            return {
              ...ra,
              url,
            };
          })
        );

        const mergedPhotos = (m.photos || []).map((rp, i) => {
          const lp = local?.photos?.[i] || local?.photos?.find((p) => p.id === rp.id);
          return (!rp.url || rp.url === '') && lp?.url ? { ...rp, url: lp.url } : rp;
        });

        await idbSet(STORE_MEMORIES, {
          ...m,
          photos: mergedPhotos.length > 0 ? mergedPhotos : local?.photos || m.photos,
          videos: mergedVideos.length > 0 ? mergedVideos : local?.videos || m.videos,
          audios: mergedAudios.length > 0 ? mergedAudios : local?.audios || m.audios,
        });
      }
    }

    if (data.letters) {
      const currentLocalLetters = await idbGetAll<Letter>(STORE_LETTERS);
      const localLetterMap = new Map<string, Letter>();
      currentLocalLetters.forEach((l) => localLetterMap.set(l.id, l));

      for (const l of data.letters) {
        const local = localLetterMap.get(l.id);
        if (local) {
          const photoUrl = (!l.photoUrl || l.photoUrl === '') && local.photoUrl ? local.photoUrl : l.photoUrl;
          const audio = (!l.audio?.url || l.audio.url === '') && local.audio?.url ? local.audio : l.audio;
          await idbSet(STORE_LETTERS, { ...l, photoUrl, audio });
        } else {
          await idbSet(STORE_LETTERS, l);
        }
      }
    }

    if (data.milestones) {
      for (const ms of data.milestones) {
        await idbSet(STORE_MILESTONES, ms);
      }
    }
  },

  // Import JSON backup
  async importData(data: StorageData): Promise<boolean> {
    try {
      if (!data) throw new Error('Formato inválido');

      if (data.childProfile) await this.saveChildProfile(data.childProfile);
      if (data.authorProfile) await this.saveAuthorProfile(data.authorProfile);
      if (data.authors) await this.saveAuthors(data.authors);
      if (data.securitySettings) await this.saveSecuritySettings(data.securitySettings);

      if (Array.isArray(data.memories)) {
        await idbClear(STORE_MEMORIES);
        for (const m of data.memories) {
          await this.saveMemory(m);
        }
      }
      if (Array.isArray(data.letters)) {
        await idbClear(STORE_LETTERS);
        for (const l of data.letters) {
          await this.saveLetter(l);
        }
      }
      if (Array.isArray(data.milestones)) {
        await idbClear(STORE_MILESTONES);
        for (const ms of data.milestones) {
          await this.saveMilestone(ms);
        }
      }
      return true;
    } catch (e) {
      console.error('Falha ao importar backup:', e);
      return false;
    }
  },
};

export const StorageService = storageService;

