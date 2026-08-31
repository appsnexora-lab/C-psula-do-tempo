import { ChildProfile, AuthorProfile, Memory, Letter, MilestoneItem, SecuritySettings, AppSettings } from '@/types';
import { calculateAgePortuguese } from '@/lib/dateUtils';

// Let's set a default child profile born ~6 months ago from current simulated time, or configurable
export const defaultChildProfile: ChildProfile = {
  name: 'Olívia',
  birthDate: '2026-02-15',
  nickname: 'Lili',
  notes: 'Nosso maior presente. Os olhos mais curiosos do mundo.',
  profilePhoto: '',
};

export const defaultAuthorProfile: AuthorProfile = {
  id: 'author-1',
  name: 'Papai',
  relation: 'Pai',
  isPrimary: true,
};

export const defaultAuthors: AuthorProfile[] = [
  {
    id: 'author-1',
    name: 'Papai',
    relation: 'Pai',
    isPrimary: true,
  },
  {
    id: 'author-2',
    name: 'Mamãe',
    relation: 'Mãe',
    isPrimary: false,
  },
];

export const defaultSecuritySettings: SecuritySettings = {
  pinEnabled: false,
  pinCode: '1234',
  passwordEnabled: false,
  password: '1234',
  passwordHint: 'Senha padrão: 1234 (alterável nas configurações)',
  hideSensitivePreview: false,
};

export const defaultAppSettings: AppSettings = {
  theme: 'light',
  hasCompletedOnboarding: true,
  useDemoData: true,
};

export const initialMilestones: MilestoneItem[] = [
  { id: 'm-1', title: 'Primeiro sorriso', category: 'Primeiro sorriso', isCustom: false, achievedDate: '2026-03-10' },
  { id: 'm-2', title: 'Primeiro banho', category: 'Primeiro banho', isCustom: false, achievedDate: '2026-02-16' },
  { id: 'm-3', title: 'Primeiro passeio', category: 'Primeiro passeio', isCustom: false, achievedDate: '2026-03-25' },
  { id: 'm-4', title: 'Primeira palavra', category: 'Primeira palavra', isCustom: false },
  { id: 'm-5', title: 'Primeiro passo', category: 'Primeiro passo', isCustom: false },
  { id: 'm-6', title: 'Primeiro aniversário', category: 'Primeiro aniversário', isCustom: false },
  { id: 'm-7', title: 'Primeiro desenho', category: 'Primeiro desenho', isCustom: false },
  { id: 'm-8', title: 'Primeiro dia na escola', category: 'Primeiro dia na escola', isCustom: false },
  { id: 'm-9', title: 'Primeiro amigo', category: 'Primeiro amigo', isCustom: false },
];

export const initialMemories: Memory[] = [
  {
    id: 'mem-1',
    title: 'O seu primeiro sorriso espontâneo',
    content: 'Hoje pela manhã, enquanto eu cantava aquela cantiga baixinho perto do seu berço, você abriu os olhinhos, olhou bem fundo nos meus e deu o sorriso mais puro e luminoso que já vi na minha vida. Eu fiquei sem ar de tanta emoção. Quero que você saiba que esse momento mudou a minha vida para sempre.',
    date: '2026-03-10',
    time: '08:45',
    location: 'Em casa, no quarto da Olívia',
    calculatedAge: calculateAgePortuguese('2026-02-15', '2026-03-10'),
    moods: ['Feliz', 'Especial', 'Carinhosa'],
    isFirstTime: true,
    firstTimeCategory: 'Primeiro sorriso',
    isSpecial: true,
    photos: [
      {
        id: 'p-1',
        url: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1200&q=80',
        caption: 'Olhando para a luz da janela pela manhã',
        isPrimary: true,
        type: 'image',
      },
      {
        id: 'p-2',
        url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
        caption: 'Mãozinha segurando meu polegar',
        isPrimary: false,
        type: 'image',
      }
    ],
    videos: [],
    audios: [
      {
        id: 'a-1',
        url: '', // Simulated audio or local recorded
        duration: 24,
        title: 'Respiração e risinhos suaves',
        recordedAt: '2026-03-10T08:50:00Z',
      }
    ],
    isFutureLocked: false,
    createdAt: '2026-03-10T09:00:00Z',
    updatedAt: '2026-03-10T09:00:00Z',
    isDeleted: false,
  },
  {
    id: 'mem-2',
    title: 'O primeiro banho com o papai',
    content: 'Você estava com um pouco de medo da água morna no início, mas quando sentiu o calorzinho e a minha mão firme segurando suas costinhas, você relaxou e ficou olhando para o teto fascinada. A toalha amarela com orelhas de urso parecia grande demais para você.',
    date: '2026-02-18',
    time: '19:15',
    location: 'Banheiro de casa',
    calculatedAge: calculateAgePortuguese('2026-02-15', '2026-02-18'),
    moods: ['Curiosa', 'Sonolenta'],
    isFirstTime: true,
    firstTimeCategory: 'Primeiro banho',
    isSpecial: true,
    photos: [
      {
        id: 'p-3',
        url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1200&q=80',
        caption: 'Enroladinha na toalhinha quentinha',
        isPrimary: true,
        type: 'image',
      }
    ],
    videos: [],
    audios: [],
    isFutureLocked: false,
    createdAt: '2026-02-18T20:00:00Z',
    updatedAt: '2026-02-18T20:00:00Z',
    isDeleted: false,
  },
  {
    id: 'mem-3',
    title: 'O dia em que você chegou ao mundo',
    content: 'Às 14h32 do dia 15 de fevereiro de 2026, você respirou pela primeira vez. A sala de parto se encheu de uma paz inexplicável. Quando a enfermeira colocou você no colo da sua mãe, o tempo simplesmente parou. Eu prometi em silêncio que protegeria a sua felicidade com tudo o que sou.',
    date: '2026-02-15',
    time: '14:32',
    location: 'Maternidade Santa Joana',
    calculatedAge: 'Dia do nascimento',
    moods: ['Especial', 'Carinhosa'],
    isFirstTime: false,
    isSpecial: true,
    photos: [
      {
        id: 'p-4',
        url: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=1200&q=80',
        caption: 'Primeiros minutos de vida',
        isPrimary: true,
        type: 'image',
      }
    ],
    videos: [],
    audios: [],
    isFutureLocked: true,
    unlockAge: 18,
    unlockDate: '2044-02-15',
    isUnlocked: false,
    createdAt: '2026-02-15T18:00:00Z',
    updatedAt: '2026-02-15T18:00:00Z',
    isDeleted: false,
  },
  {
    id: 'mem-4',
    title: 'Primeiro passeio sob a sombra dos ipês',
    content: 'Colocamos você no carrinho pela primeira vez e fomos até a praça. As folhas dos ipês balançavam com o vento suave e você não tirava os olhos do céu. Dormiu no caminho de volta segurando a ponta da mantinha.',
    date: '2026-03-25',
    time: '16:00',
    location: 'Praça das Flores',
    calculatedAge: calculateAgePortuguese('2026-02-15', '2026-03-25'),
    moods: ['Curiosa', 'Feliz'],
    isFirstTime: true,
    firstTimeCategory: 'Primeiro passeio',
    isSpecial: false,
    photos: [
      {
        id: 'p-5',
        url: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=1200&q=80',
        caption: 'A brisa no parque',
        isPrimary: true,
        type: 'image',
      }
    ],
    videos: [],
    audios: [],
    isFutureLocked: false,
    createdAt: '2026-03-25T17:30:00Z',
    updatedAt: '2026-03-25T17:30:00Z',
    isDeleted: false,
  }
];

export const initialLetters: Letter[] = [
  {
    id: 'let-1',
    title: 'Para você quando tiver 18 anos',
    content: `Minha querida filha,\n\nSe você está lendo esta carta, significa que o tempo passou tão depressa quanto todo mundo sempre me disse que passaria.\n\nHoje, enquanto escrevo estas palavras, você tem apenas alguns meses de vida e dorme no meu colo com uma tranquilidade que me ensina o verdadeiro sentido da vida.\n\nQuero que você saiba que cada escolha, cada sacrifício e cada memória registrada neste aplicativo foi feita com um amor infinito. Nunca se esqueça de quem você é, da bondade do seu coração e da coragem que você carrega nos olhos.\n\nO mundo é grande e você é livre para voar tão longe quanto sonhar.\n\nCom todo o meu amor para sempre,\nSeu Pai.`,
    date: '2026-02-15',
    calculatedAge: 'Dia do nascimento',
    photoUrl: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=1200&q=80',
    isFutureLocked: true,
    unlockAge: 18,
    unlockDate: '2044-02-15',
    isUnlocked: false,
    createdAt: '2026-02-15T20:00:00Z',
    updatedAt: '2026-02-15T20:00:00Z',
    isDeleted: false,
  },
  {
    id: 'let-2',
    title: 'O que eu aprendi nos seus primeiros 100 dias',
    content: `Filha,\n\nHoje completamos 100 dias da sua presença nas nossas vidas. Antes de você nascer, eu achava que sabia o que era paciência, amor e dedicação. Estava redondamente enganado.\n\nVocê me ensinou a desacelerar, a prestar atenção nas pequenas coisas: o barulhinho da chuva lá fora, a textura do seu pezinho, o jeito que você suspira quando pega no sono pesado.\n\nObrigado por me fazer uma pessoa melhor todos os dias.`,
    date: '2026-05-26',
    calculatedAge: calculateAgePortuguese('2026-02-15', '2026-05-26'),
    isFutureLocked: false,
    isUnlocked: true,
    createdAt: '2026-05-26T21:00:00Z',
    updatedAt: '2026-05-26T21:00:00Z',
    isDeleted: false,
  }
];
