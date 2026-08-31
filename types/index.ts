export type MoodType =
  | 'Feliz'
  | 'Carinhosa'
  | 'Engraçada'
  | 'Sonolenta'
  | 'Curiosa'
  | 'Agitada'
  | 'Chorando'
  | 'Especial'
  | 'Outro';

export type AuthorRelation = 'Pai' | 'Mãe' | 'Avô' | 'Avó' | 'Madrinha' | 'Padrinho' | 'Outro';

export interface ChildProfile {
  name: string;
  birthDate: string; // YYYY-MM-DD
  profilePhoto?: string;
  nickname?: string;
  notes?: string;
}

export interface AuthorProfile {
  id?: string;
  name: string;
  photo?: string;
  relation: AuthorRelation;
  isPrimary?: boolean;
}

export interface MediaItem {
  id: string;
  url: string;
  name?: string;
  caption?: string;
  isPrimary?: boolean;
  type: 'image' | 'video';
  duration?: number;
  thumbnail?: string;
  createdAt?: string;
}

export interface AudioItem {
  id: string;
  url: string; // base64 or blob URL
  duration: number; // in seconds
  title?: string;
  recordedAt: string;
}

export interface Memory {
  id: string;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD
  time?: string;
  location?: string;
  calculatedAge: string;
  moods: MoodType[];
  isFirstTime: boolean;
  firstTimeCategory?: string;
  isSpecial: boolean;
  photos: MediaItem[];
  videos: MediaItem[];
  audios: AudioItem[];
  authorName?: string;
  authorRelation?: AuthorRelation;
  isFutureLocked: boolean;
  unlockAge?: number; // e.g. 10, 15, 18
  unlockDate?: string; // YYYY-MM-DD
  isUnlocked?: boolean;
  tags?: string[];
  childQuote?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface Letter {
  id: string;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD
  calculatedAge: string;
  photoUrl?: string;
  audio?: AudioItem;
  authorName?: string;
  authorRelation?: AuthorRelation;
  isFutureLocked: boolean;
  unlockAge?: number;
  unlockDate?: string;
  isUnlocked?: boolean;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface SecuritySettings {
  pinEnabled: boolean;
  pinCode?: string; // 4-digit pin or fallback
  passwordEnabled?: boolean;
  password?: string; // Master family password (alphanumeric or numeric)
  passwordHint?: string;
  hideSensitivePreview: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  hasCompletedOnboarding: boolean;
  useDemoData: boolean;
}

export type MilestoneCategory =
  | 'Primeiro sorriso'
  | 'Primeiro banho'
  | 'Primeiro passeio'
  | 'Primeira palavra'
  | 'Primeiro passo'
  | 'Primeiro aniversário'
  | 'Primeiro desenho'
  | 'Primeiro dia na escola'
  | 'Primeiro amigo'
  | 'Outro';

export interface MilestoneItem {
  id: string;
  title: string;
  description?: string;
  category: MilestoneCategory | string;
  icon?: string;
  achievedDate?: string;
  memoryId?: string;
  isCustom?: boolean;
}

export interface StorageData {
  childProfile: ChildProfile;
  authorProfile: AuthorProfile;
  authors?: AuthorProfile[];
  memories: Memory[];
  letters: Letter[];
  milestones: MilestoneItem[];
  securitySettings: SecuritySettings;
  appSettings: AppSettings;
  isInitialized: boolean;
}

export type ActiveTab = 'inicio' | 'memorias' | 'arvore' | 'cartas' | 'mais';
export type ViewTab = ActiveTab | 'home' | 'add';
export type SubView =
  | 'tree'
  | 'milestones'
  | 'growth'
  | 'capsule'
  | 'profile'
  | 'security'
  | 'trash'
  | 'export'
  | 'about';
