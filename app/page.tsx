'use client';

import React, { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { 
  Memory, 
  Letter, 
  ChildProfile, 
  AuthorProfile, 
  MilestoneItem, 
  SecuritySettings, 
  StorageData, 
  ActiveTab, 
  SubView 
} from '@/types';
import { StorageService } from '@/services/storageService';
import { Navbar } from '@/components/Navbar';
import { HomeOverview } from '@/components/HomeOverview';
import { HomeWidget } from '@/components/HomeWidget';
import { TodayInHistory } from '@/components/TodayInHistory';
import { TreeOfLife } from '@/components/TreeOfLife';
import { RecentMemories } from '@/components/RecentMemories';
import { MemoryModal } from '@/components/MemoryModal';
import { MemoryDetailModal } from '@/components/MemoryDetailModal';
import { MemoryReaderModal } from '@/components/MemoryReaderModal';
import { MemoriesExplorer } from '@/components/MemoriesExplorer';
import { LettersView } from '@/components/LettersView';
import { TimeCapsuleView } from '@/components/TimeCapsuleView';
import { MilestonesView } from '@/components/MilestonesView';
import { GrowthStagesView } from '@/components/GrowthStagesView';
import { MoreView } from '@/components/MoreView';
import { TrashView } from '@/components/TrashView';
import { ProfileEditModal } from '@/components/ProfileEditModal';
import { SecurityModal } from '@/components/SecurityModal';
import { FamilyLoginScreen } from '@/components/FamilyLoginScreen';
import { ExportModal } from '@/components/ExportModal';
import { OnboardingModal } from '@/components/OnboardingModal';
import { FirebaseSyncService } from '@/services/firebaseService';
import { ChevronLeft, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const emptySubscribe = () => () => {};

export default function Home() {
  const hasMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Core Storage Data - instant initial state avoids white screen freeze
  const [data, setData] = useState<StorageData>(() => StorageService.getFallbackData());

  // App Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('inicio');
  const [activeSubView, setActiveSubView] = useState<SubView | null>(null);

  // Modals & Sheets State
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [detailMemory, setDetailMemory] = useState<Memory | null>(null);
  const [readingMemory, setReadingMemory] = useState<Memory | null>(null);
  const [prefillFirstTime, setPrefillFirstTime] = useState<string | undefined>(undefined);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Authentication & Security Lock State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState(false);

  const handleLoginSuccess = (selectedAuthor?: AuthorProfile, rememberDevice: boolean = true) => {
    if (typeof window !== 'undefined') {
      if (rememberDevice) {
        localStorage.setItem('pv_authenticated', 'true');
      } else {
        sessionStorage.setItem('pv_authenticated', 'true');
      }
    }
    if (selectedAuthor) {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          authorProfile: selectedAuthor,
        };
      });
      StorageService.saveAuthorProfile(selectedAuthor, true).catch(console.error);
    }
    setIsAuthenticated(true);
    setIsLocked(false);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pv_authenticated');
      sessionStorage.removeItem('pv_authenticated');
    }
    setIsAuthenticated(false);
    setIsLocked(true);
  };

  // Load storage on start
  const reloadData = useCallback(async () => {
    try {
      const stored = await StorageService.getData();
      setData(stored);
      if (!stored.isInitialized) {
        setIsOnboardingOpen(true);
      }
    } catch (err) {
      console.error('Error loading initial data', err);
    }
  }, []);

  // Set up local initial data + Real-time Firebase Firestore synchronization
  useEffect(() => {
    let isMounted = true;
    let unsubVault: (() => void) | null = null;
    let unsubMemories: (() => void) | null = null;
    let unsubLetters: (() => void) | null = null;
    let unsubMilestones: (() => void) | null = null;

    (async () => {
      try {
        const auth =
          typeof window !== 'undefined' &&
          (localStorage.getItem('pv_authenticated') === 'true' ||
            sessionStorage.getItem('pv_authenticated') === 'true');

        if (!auth) {
          setIsAuthenticated(false);
        }

        const stored = await StorageService.getData();
        if (!isMounted) return;
        setData(stored);
        if (!stored.isInitialized) {
          setIsOnboardingOpen(true);
        }
        if (!auth && stored.securitySettings.passwordEnabled && (stored.securitySettings.pinEnabled || stored.securitySettings.password)) {
          setIsLocked(true);
        }

        // Test and subscribe to Firebase Firestore shared vault
        const activeVaultId = FirebaseSyncService.getActiveVaultId();

        // 1. Subscribe to Vault Root (Child Profile, Authors, Security)
        unsubVault = FirebaseSyncService.subscribeVaultRoot(activeVaultId, (remoteRoot) => {
          if (!isMounted) return;
          if (remoteRoot.childProfile?.name) {
            setIsOnboardingOpen(false);
          }
          setData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              childProfile: remoteRoot.childProfile || prev.childProfile,
              authors: remoteRoot.authors || prev.authors,
              securitySettings: remoteRoot.securitySettings || prev.securitySettings,
            };
          });
          // Cache locally
          StorageService.syncLocalFromRemote({
            childProfile: remoteRoot.childProfile,
            authors: remoteRoot.authors,
            securitySettings: remoteRoot.securitySettings,
          }).catch(console.error);
        });

        // 2. Subscribe to Memories in Real-Time
        unsubMemories = FirebaseSyncService.subscribeMemories(activeVaultId, async (remoteMemories) => {
          if (!isMounted) return;
          if (remoteMemories.length > 0) {
            await StorageService.syncLocalFromRemote({ memories: remoteMemories });
            const hydratedMemories = await StorageService.getMemories();
            if (isMounted) {
              setData((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  memories: hydratedMemories,
                };
              });
            }
          } else if (stored.memories.length > 0) {
            // Seed cloud if cloud was completely empty
            FirebaseSyncService.seedVaultInitialData(activeVaultId, stored).catch(console.error);
          }
        });

        // 3. Subscribe to Letters in Real-Time
        unsubLetters = FirebaseSyncService.subscribeLetters(activeVaultId, (remoteLetters) => {
          if (!isMounted) return;
          if (remoteLetters.length > 0) {
            setData((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                letters: remoteLetters,
              };
            });
            StorageService.syncLocalFromRemote({ letters: remoteLetters }).catch(console.error);
          }
        });

        // 4. Subscribe to Milestones in Real-Time
        unsubMilestones = FirebaseSyncService.subscribeMilestones(activeVaultId, (remoteMilestones) => {
          if (!isMounted) return;
          if (remoteMilestones.length > 0) {
            setData((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                milestones: remoteMilestones,
              };
            });
            StorageService.syncLocalFromRemote({ milestones: remoteMilestones }).catch(console.error);
          }
        });

      } catch (err) {
        console.error('Error initializing data & sync', err);
      }
    })();

    return () => {
      isMounted = false;
      if (unsubVault) unsubVault();
      if (unsubMemories) unsubMemories();
      if (unsubLetters) unsubLetters();
      if (unsubMilestones) unsubMilestones();
    };
  }, [isAuthenticated]);

  // Handler to open Quick Memory Add
  const handleOpenAddMemory = (firstTimeCat?: string) => {
    setEditingMemory(null);
    setPrefillFirstTime(firstTimeCat);
    setIsMemoryModalOpen(true);
  };

  // Memory Operations
  const handleSaveMemory = async (memory: Memory) => {
    await StorageService.saveMemory(memory);
    // If it was linked to a milestone, mark milestone
    if (memory.isFirstTime && memory.firstTimeCategory && data) {
      const match = data.milestones.find((m) => m.category === memory.firstTimeCategory);
      if (match && !match.achievedDate) {
        await StorageService.updateMilestone(match.id, memory.date, memory.id);
      }
    }
    await reloadData();
  };

  const handleSoftDeleteMemory = async (id: string) => {
    await StorageService.softDeleteMemory(id);
    await reloadData();
  };

  const handlePermanentDeleteMemory = async (id: string) => {
    await StorageService.permanentDeleteMemory(id);
    await reloadData();
  };

  const handleRestoreMemory = async (id: string) => {
    await StorageService.restoreMemory(id);
    await reloadData();
  };

  const handleToggleSpecial = async (memory: Memory) => {
    const updated = { ...memory, isSpecial: !memory.isSpecial };
    await StorageService.saveMemory(updated);
    if (detailMemory && detailMemory.id === memory.id) {
      setDetailMemory(updated);
    }
    await reloadData();
  };

  // Letter Operations
  const handleSaveLetter = async (letter: Letter) => {
    await StorageService.saveLetter(letter);
    await reloadData();
  };

  const handleSoftDeleteLetter = async (id: string) => {
    await StorageService.softDeleteLetter(id);
    await reloadData();
  };

  const handlePermanentDeleteLetter = async (id: string) => {
    await StorageService.permanentDeleteLetter(id);
    await reloadData();
  };

  const handleRestoreLetter = async (id: string) => {
    await StorageService.restoreLetter(id);
    await reloadData();
  };

  // Profile Operations
  const handleSaveProfiles = async (
    child: ChildProfile,
    author: AuthorProfile,
    authors?: AuthorProfile[]
  ) => {
    setData((prev) => ({
      ...prev,
      childProfile: child,
      authorProfile: author,
      authors: authors && authors.length > 0 ? authors : prev.authors,
    }));
    await StorageService.saveChildProfile(child);
    await StorageService.saveAuthorProfile(author);
    if (authors && authors.length > 0) {
      await StorageService.saveAuthors(authors);
    }
    await reloadData();
  };

  // Security Operations
  const handleSaveSecurity = async (sec: SecuritySettings) => {
    await StorageService.saveSecuritySettings(sec);
    await reloadData();
  };

  // Milestone Operations
  const handleAddCustomMilestone = async (title: string) => {
    const newM: MilestoneItem = {
      id: `ms-${Date.now()}`,
      title,
      category: title,
      icon: '⭐',
      isCustom: true,
    };
    await StorageService.addMilestone(newM);
    await reloadData();
  };

  // Reset or Clear Data
  const handleResetData = async (reloadDemo: boolean) => {
    if (reloadDemo) {
      await StorageService.resetToDemo();
    } else {
      await StorageService.clearAll();
      setIsOnboardingOpen(true);
    }
    await reloadData();
    setActiveTab('inicio');
    setActiveSubView(null);
  };

  // Complete Onboarding
  const handleCompleteOnboarding = async (child: ChildProfile, author: AuthorProfile) => {
    await StorageService.saveChildProfile(child);
    await StorageService.saveAuthorProfile(author);
    await StorageService.setInitialized(true);
    setIsOnboardingOpen(false);
    await reloadData();
  };

  // Import Backup
  const handleImportBackup = async (imported: StorageData) => {
    await StorageService.importData(imported);
    await reloadData();
  };

  // Family Login / Security Lock Screen
  const isSecurityRequired = Boolean(data.securitySettings?.passwordEnabled);
  if (hasMounted && (!isAuthenticated || isLocked) && isSecurityRequired) {
    return (
      <FamilyLoginScreen
        childProfile={data.childProfile}
        authors={data.authors}
        currentAuthor={data.authorProfile}
        securitySettings={data.securitySettings}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  const activeMemories = data.memories.filter((m) => !m.isDeleted);
  const activeLetters = data.letters.filter((l) => !l.isDeleted);
  const deletedMemories = data.memories.filter((m) => m.isDeleted);
  const deletedLetters = data.letters.filter((l) => l.isDeleted);
  const trashCount = deletedMemories.length + deletedLetters.length;

  const handleOpenDetailMemory = async (m: Memory) => {
    setDetailMemory(m);
    try {
      const full = await StorageService.getMemoryById(m.id);
      if (full) {
        setDetailMemory(full);
      }
    } catch {
      // ignore
    }
  };

  if (!hasMounted) {
    return (
      <div id="para-voce-loading" className="min-h-screen bg-[#FDFCF9] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-[#A3B18A]/20 border border-[#A3B18A]/40 flex items-center justify-center mb-3 animate-pulse">
          <Heart className="w-7 h-7 text-[#4A6741] fill-[#4A6741]/30" />
        </div>
        <h1 className="text-lg font-serif font-bold text-[#2C2825] tracking-wide">Para Você</h1>
        <p className="text-xs text-[#8C867E] mt-0.5 font-sans">Carregando livro de memórias...</p>
      </div>
    );
  }

  return (
    <div id="para-voce-app" className="min-h-screen bg-[#FDFCF9] text-[#4A443F] flex flex-col selection:bg-[#4A6741]/20" suppressHydrationWarning>
      {/* Main Responsive Header / Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setActiveSubView(null);
        }}
        onOpenAddModal={() => handleOpenAddMemory()}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 pb-24 md:pb-12">
        {/* If user navigated into a subview from 'Mais' or 'Home', show back breadcrumb */}
        {activeSubView && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setActiveSubView(null)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs text-[#8C867E] hover:text-[#3D4B38] bg-white border border-[#F0EDE6] hover:bg-[#F8F6F2] transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>
          </div>
        )}

        {/* View Switcher with smooth Framer-Motion transition based on ActiveTab & SubView */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubView ? `subview-${activeSubView}` : `tab-${activeTab}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full"
          >
            {activeSubView ? (
              /* Subviews */
              activeSubView === 'tree' ? (
                <TreeOfLife
                  memories={data.memories}
                  childProfile={data.childProfile}
                  onSelectMemory={handleOpenDetailMemory}
                  onOpenAddMemory={() => handleOpenAddMemory()}
                  isFullView={true}
                />
              ) : activeSubView === 'capsule' ? (
                <TimeCapsuleView
                  memories={data.memories}
                  letters={data.letters}
                  childProfile={data.childProfile}
                  onSelectMemory={handleOpenDetailMemory}
                />
              ) : activeSubView === 'milestones' ? (
                <MilestonesView
                  milestones={data.milestones}
                  memories={data.memories}
                  onSelectMilestoneMemory={(memId) => {
                    const found = data.memories.find((m) => m.id === memId);
                    if (found) handleOpenDetailMemory(found);
                  }}
                  onRecordMilestone={(cat) => handleOpenAddMemory(cat)}
                  onAddCustomMilestone={handleAddCustomMilestone}
                />
              ) : activeSubView === 'growth' ? (
                <GrowthStagesView
                  memories={data.memories}
                  childProfile={data.childProfile}
                  onSelectMemory={handleOpenDetailMemory}
                  onFilterStage={(stage) => {
                    setActiveTab('memorias');
                    setActiveSubView(null);
                  }}
                />
              ) : activeSubView === 'trash' ? (
                <TrashView
                  deletedMemories={deletedMemories}
                  deletedLetters={deletedLetters}
                  onRestoreMemory={handleRestoreMemory}
                  onPermanentDeleteMemory={handlePermanentDeleteMemory}
                  onRestoreLetter={handleRestoreLetter}
                  onPermanentDeleteLetter={handlePermanentDeleteLetter}
                />
              ) : null
            ) : (
              /* Main Primary Tabs */
              <>
                {activeTab === 'inicio' && (
                  <div className="space-y-8">
                    {/* 1. Header Overview with Age, Counters and 15-Year Countdown */}
                    <HomeOverview
                      childProfile={data.childProfile}
                      authorProfile={data.authorProfile}
                      authors={data.authors}
                      memories={data.memories}
                      letters={data.letters}
                      memoriesCount={activeMemories.length}
                      lettersCount={activeLetters.length}
                      audiosCount={activeMemories.reduce((acc, m) => acc + (m.audios?.length || 0), 0)}
                      lockedCount={activeMemories.filter((m) => m.isFutureLocked).length + activeLetters.filter((l) => l.isFutureLocked).length}
                      onOpenAddModal={() => handleOpenAddMemory()}
                      onEditProfile={() => setIsProfileModalOpen(true)}
                      onOpenLockCapsule={() => {
                        setActiveTab('mais');
                        setActiveSubView('capsule');
                      }}
                      onOpenTimeCapsule={() => {
                        setActiveTab('mais');
                        setActiveSubView('capsule');
                      }}
                      onSelectTab={(tab) => {
                        if (tab === 'memories') setActiveTab('memorias');
                        else if (tab === 'letters') setActiveTab('cartas');
                        else if (tab === 'more') setActiveTab('mais');
                      }}
                    />

                    {/* 2. Interactive Home Widget (Latest Memories / Next Birthday Countdown) */}
                    <HomeWidget
                      childProfile={data.childProfile}
                      authorProfile={data.authorProfile}
                      memories={data.memories}
                      onSelectMemory={handleOpenDetailMemory}
                      onOpenAddMemory={() => handleOpenAddMemory()}
                      onOpenAddLetter={() => setActiveTab('cartas')}
                      onViewAllMemories={() => setActiveTab('memorias')}
                    />

                    {/* 3. Neste Dia — Today In History */}
                    <TodayInHistory
                      memories={data.memories}
                      childProfile={data.childProfile}
                      onSelectMemory={handleOpenDetailMemory}
                      onOpenAddModal={() => handleOpenAddMemory()}
                    />

                    {/* 3. Tree of Life Interactive Garden */}
                    <TreeOfLife
                      memories={data.memories}
                      childProfile={data.childProfile}
                      onSelectMemory={handleOpenDetailMemory}
                      onOpenAddMemory={() => handleOpenAddMemory()}
                      onOpenFullTree={() => {
                        setActiveTab('mais');
                        setActiveSubView('tree');
                      }}
                    />

                    {/* 4. Recent Memories Feed */}
                    <RecentMemories
                      memories={data.memories}
                      onSelectMemory={handleOpenDetailMemory}
                      onViewAll={() => setActiveTab('memorias')}
                    />
                  </div>
                )}

                {activeTab === 'memorias' && (
                  <MemoriesExplorer
                    memories={data.memories}
                    letters={data.letters}
                    onSelectMemory={handleOpenDetailMemory}
                    onOpenAddModal={() => handleOpenAddMemory()}
                    onOpenReader={(mem) => setReadingMemory(mem)}
                  />
                )}

                {activeTab === 'arvore' && (
                  <div className="space-y-6">
                    <TreeOfLife
                      memories={data.memories}
                      childProfile={data.childProfile}
                      onSelectMemory={handleOpenDetailMemory}
                      onOpenAddMemory={() => handleOpenAddMemory()}
                      isFullView={true}
                    />
                    <RecentMemories
                      memories={data.memories}
                      onSelectMemory={handleOpenDetailMemory}
                      onViewAll={() => setActiveTab('memorias')}
                    />
                  </div>
                )}

                {activeTab === 'cartas' && (
                  <LettersView
                    letters={data.letters}
                    childProfile={data.childProfile}
                    onSaveLetter={handleSaveLetter}
                    onDeleteLetter={handleSoftDeleteLetter}
                  />
                )}

                {activeTab === 'mais' && (
                  <MoreView
                    childProfile={data.childProfile}
                    authorProfile={data.authorProfile}
                    authors={data.authors}
                    securitySettings={data.securitySettings}
                    trashCount={trashCount}
                    onNavigateSubView={(sub) => {
                      if (sub === 'profile') setIsProfileModalOpen(true);
                      else if (sub === 'security') setIsSecurityModalOpen(true);
                      else if (sub === 'export') setIsExportModalOpen(true);
                      else setActiveSubView(sub);
                    }}
                    onResetDemoData={handleResetData}
                    onLogout={handleLogout}
                  />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 1. Add / Edit Memory Modal */}
      <MemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => {
          setIsMemoryModalOpen(false);
          setEditingMemory(null);
          setPrefillFirstTime(undefined);
        }}
        onSave={handleSaveMemory}
        childProfile={data.childProfile}
        authors={data.authors}
        editingMemory={editingMemory}
        prefillFirstTimeCategory={prefillFirstTime}
      />

      {/* 2. Full Memory Detail Modal */}
      <MemoryDetailModal
        isOpen={!!detailMemory}
        memory={detailMemory}
        onClose={() => setDetailMemory(null)}
        onOpenReader={(mem) => {
          setDetailMemory(null);
          setReadingMemory(mem);
        }}
        onEdit={(mem) => {
          setEditingMemory(mem);
          setIsMemoryModalOpen(true);
        }}
        onDelete={handleSoftDeleteMemory}
        onToggleSpecial={handleToggleSpecial}
        onUpdateMemory={(updated) => {
          setDetailMemory(updated);
          setData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              memories: prev.memories.map((m) => (m.id === updated.id ? updated : m)),
            };
          });
        }}
      />

      {/* 2.1 Immersive Distraction-Free Memory Reader Modal */}
      <MemoryReaderModal
        isOpen={!!readingMemory}
        memory={readingMemory}
        allMemories={data.memories}
        onClose={() => setReadingMemory(null)}
        onSelectMemory={(mem) => setReadingMemory(mem)}
        onEdit={(mem) => {
          setReadingMemory(null);
          setEditingMemory(mem);
          setIsMemoryModalOpen(true);
        }}
      />

      {/* 3. Profile Setup & Edit Modal */}
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        childProfile={data.childProfile}
        authorProfile={data.authorProfile}
        authors={data.authors}
        onSave={handleSaveProfiles}
      />

      {/* 4. Security & PIN Modal */}
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        settings={data.securitySettings}
        onSave={handleSaveSecurity}
        onLockNow={handleLogout}
      />

      {/* 5. Export & Backup Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        storageData={data}
        onImportBackup={handleImportBackup}
      />

      {/* 6. Onboarding Modal for first launch */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleCompleteOnboarding}
      />
    </div>
  );
}
