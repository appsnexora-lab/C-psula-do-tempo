'use client';

import React from 'react';
import { ChildProfile, AuthorProfile, Memory, Letter } from '@/types';
import {
  calculateAgePortuguese,
  getNextBirthdayCountdown,
  formatDatePortuguese,
  getFifteenYearsCountdown,
} from '@/lib/dateUtils';
import {
  Plus,
  Heart,
  Lock,
  Mail,
  Image as ImageIcon,
  BookOpen,
  Gift,
  Edit3,
  Mic,
  Key,
  Sparkles,
  ChevronRight,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import Image from 'next/image';

export interface HomeOverviewProps {
  childProfile: ChildProfile;
  authorProfile?: AuthorProfile;
  authors?: AuthorProfile[];
  memories?: Memory[];
  letters?: Letter[];
  memoriesCount?: number;
  lettersCount?: number;
  audiosCount?: number;
  lockedCount?: number;
  onOpenAddModal: () => void;
  onOpenProfileModal?: () => void;
  onEditProfile?: () => void;
  onSelectTab?: (tab: 'memories' | 'letters' | 'more') => void;
  onOpenSpecialMoments?: () => void;
  onOpenTimeCapsule?: () => void;
  onOpenLockCapsule?: () => void;
}

export const HomeOverview: React.FC<HomeOverviewProps> = ({
  childProfile,
  authorProfile,
  authors,
  memories = [],
  letters = [],
  memoriesCount,
  lettersCount,
  audiosCount,
  lockedCount,
  onOpenAddModal,
  onOpenProfileModal,
  onEditProfile,
  onSelectTab,
  onOpenSpecialMoments,
  onOpenTimeCapsule,
  onOpenLockCapsule,
}) => {
  const activeMemories = memories.filter((m) => !m.isDeleted);
  const activeLetters = letters.filter((l) => !l.isDeleted);

  const displayMemoriesCount = memoriesCount !== undefined ? memoriesCount : activeMemories.length;
  const displayLettersCount = lettersCount !== undefined ? lettersCount : activeLetters.length;
  const displayAudiosCount =
    audiosCount !== undefined
      ? audiosCount
      : activeMemories.reduce((acc, m) => acc + (m.audios?.length || 0), 0);
  const displayLockedCount =
    lockedCount !== undefined
      ? lockedCount
      : activeMemories.filter((m) => m.isFutureLocked).length +
        activeLetters.filter((l) => l.isFutureLocked).length;

  const totalPhotos = activeMemories.reduce((acc, m) => acc + (m.photos?.length || 0), 0);
  const specialCount = activeMemories.filter((m) => m.isSpecial).length;

  const currentAge = calculateAgePortuguese(childProfile.birthDate);
  const birthdayInfo = getNextBirthdayCountdown(childProfile.birthDate);

  const fifteenCountdown = React.useMemo(() => {
    return getFifteenYearsCountdown(childProfile.birthDate);
  }, [childProfile.birthDate]);

  // Count items specifically locked for 15 years
  const fifteenLockedMemories = activeMemories.filter(
    (m) =>
      m.isFutureLocked &&
      (m.unlockAge === 15 ||
        (fifteenCountdown.targetDateStr && m.unlockDate === fifteenCountdown.targetDateStr))
  );
  const fifteenLockedLetters = activeLetters.filter(
    (l) =>
      l.isFutureLocked &&
      (l.unlockAge === 15 ||
        (fifteenCountdown.targetDateStr && l.unlockDate === fifteenCountdown.targetDateStr))
  );
  const totalFifteenLocked = fifteenLockedMemories.length + fifteenLockedLetters.length;

  const authorsText = React.useMemo(() => {
    if (authors && authors.length > 0) {
      if (authors.length === 1) return `Escrito com amor por ${authors[0].name}`;
      if (authors.length === 2) return `Escrito com amor por ${authors[0].name} e ${authors[1].name}`;
      return `Escrito com amor por ${authors.map((a) => a.name).join(', ')}`;
    }
    if (authorProfile?.name) return `Escrito com amor por ${authorProfile.name}`;
    return 'Uma história sendo escrita todos os dias.';
  }, [authors, authorProfile]);

  const handleProfileClick = () => {
    if (onOpenProfileModal) onOpenProfileModal();
    else if (onEditProfile) onEditProfile();
  };

  const handleCapsuleClick = () => {
    if (onOpenTimeCapsule) onOpenTimeCapsule();
    else if (onOpenLockCapsule) onOpenLockCapsule();
  };

  const childFirstName = childProfile.name ? childProfile.name.trim().split(' ')[0] : 'Você';

  return (
    <div id="home-overview" className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#3D4B38] tracking-tight font-normal">
            Para Você
          </h1>
          <p className="text-[#8C867E] text-sm italic mt-1 font-serif">
            {authorsText}
          </p>
        </div>

        {/* Child Profile Preview Box */}
        <div
          id="btn-child-profile-card"
          onClick={handleProfileClick}
          className="cursor-pointer flex items-center space-x-3 bg-white/70 hover:bg-white p-3 rounded-2xl border border-[#F0EDE6] hover:border-[#A3B18A] shadow-xs self-start sm:self-auto transition-all group"
          title="Clique para alterar nome, idade ou foto"
        >
          <div className="relative w-12 h-12 rounded-full bg-[#E5E1D8] border-2 border-[#D4AF37]/30 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
            {childProfile.profilePhoto && childProfile.profilePhoto.trim() !== '' ? (
              <Image
                src={childProfile.profilePhoto}
                alt={childProfile.name || 'Filha'}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-[#A3B18A]/20 flex items-center justify-center text-[#4A6741] font-bold font-serif text-base">
                {childProfile.name ? childProfile.name[0] : 'O'}
              </div>
            )}
          </div>

          <div className="flex flex-col pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-[#4A443F] group-hover:text-[#4A6741] transition-colors">
                {childProfile.name || 'Olívia'}
              </span>
              <span className="p-1 rounded-full text-[#8C867E] group-hover:text-[#4A6741] group-hover:bg-[#F0EDE6] transition-colors">
                <Edit3 className="w-3.5 h-3.5" />
              </span>
            </div>
            <span className="text-xs text-[#8C867E]" suppressHydrationWarning>
              {currentAge || (childProfile.birthDate ? `Nascida em ${formatDatePortuguese(childProfile.birthDate)}` : 'Defina o nascimento')}
            </span>
          </div>
        </div>
      </div>

      {/* Birthday Banner if applicable */}
      {birthdayInfo.message && (
        <div className="px-4 py-2.5 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-xs text-[#8C6D1F] flex items-center justify-between shadow-xs" suppressHydrationWarning>
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span className="font-medium" suppressHydrationWarning>{birthdayInfo.message}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#D4AF37]">Celebração</span>
        </div>
      )}

      {/* Main CTA: "+ Guardar uma lembrança" */}
      <button
        id="btn-home-add-memory"
        type="button"
        onClick={onOpenAddModal}
        className="w-full py-3.5 px-6 rounded-2xl bg-[#4A6741] hover:bg-[#3D5235] text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-[#4A6741]/20 active:scale-[0.99] transition-all"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span>Guardar uma lembrança</span>
      </button>

      {/* Dashboard Stats Counters Grid */}
      <div id="dashboard-counters-grid" className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 sm:gap-3.5">
        {/* Counter 1: Memórias */}
        <button
          id="stat-memories"
          type="button"
          onClick={() => onSelectTab && onSelectTab('memories')}
          className="bg-white/70 rounded-2xl p-3 sm:p-3.5 border border-[#F0EDE6] shadow-xs text-center hover:border-[#A3B18A] transition-all group cursor-pointer"
        >
          <div className="flex justify-center text-[#4A6741] mb-1.5">
            <BookOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </div>
          <span className="block font-serif text-lg sm:text-xl text-[#3D4B38] font-normal leading-tight">
            {displayMemoriesCount}
          </span>
          <span className="block text-[10px] uppercase font-bold tracking-tight text-[#8C867E] truncate mt-0.5">Memórias</span>
        </button>

        {/* Counter 2: Cartas */}
        <button
          id="stat-letters"
          type="button"
          onClick={() => onSelectTab && onSelectTab('letters')}
          className="bg-white/70 rounded-2xl p-3 sm:p-3.5 border border-[#F0EDE6] shadow-xs text-center hover:border-[#A3B18A] transition-all group cursor-pointer"
        >
          <div className="flex justify-center text-[#4A6741] mb-1.5">
            <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </div>
          <span className="block font-serif text-lg sm:text-xl text-[#3D4B38] font-normal leading-tight">
            {displayLettersCount}
          </span>
          <span className="block text-[10px] uppercase font-bold tracking-tight text-[#8C867E] truncate mt-0.5">Cartas</span>
        </button>

        {/* Counter 3: Áudios */}
        <div className="bg-white/70 rounded-2xl p-3 sm:p-3.5 border border-[#F0EDE6] shadow-xs text-center">
          <div className="flex justify-center text-[#4A6741] mb-1.5">
            <Mic className="w-4 h-4" />
          </div>
          <span className="block font-serif text-lg sm:text-xl text-[#3D4B38] font-normal leading-tight">
            {displayAudiosCount}
          </span>
          <span className="block text-[10px] uppercase font-bold tracking-tight text-[#8C867E] truncate mt-0.5">Voz & Som</span>
        </div>

        {/* Counter 4: Cápsulas */}
        <button
          id="stat-capsules"
          type="button"
          onClick={handleCapsuleClick}
          className="bg-white/70 rounded-2xl p-3 sm:p-3.5 border border-[#F0EDE6] shadow-xs text-center hover:border-[#A3B18A] transition-all group cursor-pointer"
        >
          <div className="flex justify-center text-[#8C867E] mb-1.5">
            <Lock className="w-4 h-4 group-hover:scale-110 transition-transform text-[#D4AF37]" />
          </div>
          <span className="block font-serif text-lg sm:text-xl text-[#3D4B38] font-normal leading-tight">
            {displayLockedCount}
          </span>
          <span className="block text-[10px] uppercase font-bold tracking-tight text-[#8C867E] truncate mt-0.5">Cápsula</span>
        </button>

        {/* Counter 5 (desktop): Fotos */}
        <div className="hidden sm:block bg-white/70 rounded-2xl p-3 sm:p-3.5 border border-[#F0EDE6] shadow-xs text-center">
          <div className="flex justify-center text-[#4A6741] mb-1.5">
            <ImageIcon className="w-4 h-4" />
          </div>
          <span className="block font-serif text-lg sm:text-xl text-[#3D4B38] font-normal leading-tight">
            {totalPhotos}
          </span>
          <span className="block text-[10px] uppercase font-bold tracking-tight text-[#8C867E] truncate mt-0.5">Fotos</span>
        </div>
      </div>

      {/* Elegant 15-Year Time Capsule Countdown Component */}
      <section
        id="fifteen-years-capsule-countdown"
        className="relative overflow-hidden rounded-[32px] bg-gradient-to-b from-[#FAF8F5] to-[#F5F2EB] border border-[#EBE4D5] p-5 sm:p-6 shadow-xs transition-all hover:border-[#D4AF37]/40"
      >
        {/* Subtle Decorative Elements */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#D4AF37]/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-[#4A6741]/5 rounded-full blur-xl pointer-events-none" />

        {/* Header of Countdown Card */}
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#B8932E] shrink-0 shadow-2xs">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#B8932E] block">
                  Cápsula do Tempo
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#4A6741] bg-[#4A6741]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <Sparkles className="w-2.5 h-2.5" />
                  15 Anos
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif text-[#3D4B38] font-normal leading-tight mt-0.5">
                Contagem para os 15 Anos
              </h2>
            </div>
          </div>

          {fifteenCountdown.formattedTargetDate && (
            <div className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-[#EBE7DF] text-[#8C867E] text-[11px] font-medium shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Desbloqueio: <strong className="text-[#4A443F]">{fifteenCountdown.formattedTargetDate}</strong></span>
            </div>
          )}
        </div>

        {/* Countdown Body */}
        {childProfile.birthDate ? (
          fifteenCountdown.isUnlocked ? (
            /* Unlocked State (Child has reached 15 years) */
            <div className="bg-white rounded-2xl p-5 border border-[#D4AF37]/30 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-serif text-[#3D4B38] font-semibold">
                O grande momento chegou!
              </h3>
              <p className="text-xs text-[#8C867E] max-w-md mx-auto">
                {childFirstName} já completou 15 anos. Todas as cartas, áudios e memórias guardadas em segredo estão prontas para serem revividas.
              </p>
              <button
                type="button"
                onClick={handleCapsuleClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#4A6741] text-white text-xs font-semibold hover:bg-[#3D5235] transition-all shadow-sm cursor-pointer"
              >
                <span>Abrir Cápsula de 15 Anos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Active Countdown State */
            <div className="space-y-4">
              {/* 3 Metric Tiles (Years, Months, Days) */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5" suppressHydrationWarning>
                {/* Years Tile */}
                <div className="bg-white/90 rounded-2xl p-3 sm:p-4 border border-[#F0EDE6] shadow-2xs text-center flex flex-col justify-center transition-all hover:border-[#D4AF37]/40" suppressHydrationWarning>
                  <span className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#3D4B38] font-normal leading-none mb-1" suppressHydrationWarning>
                    {fifteenCountdown.yearsRemaining}
                  </span>
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-[#8C867E]" suppressHydrationWarning>
                    {fifteenCountdown.yearsRemaining === 1 ? 'Ano' : 'Anos'}
                  </span>
                </div>

                {/* Months Tile */}
                <div className="bg-white/90 rounded-2xl p-3 sm:p-4 border border-[#F0EDE6] shadow-2xs text-center flex flex-col justify-center transition-all hover:border-[#D4AF37]/40" suppressHydrationWarning>
                  <span className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#3D4B38] font-normal leading-none mb-1" suppressHydrationWarning>
                    {fifteenCountdown.monthsRemaining}
                  </span>
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-[#8C867E]" suppressHydrationWarning>
                    {fifteenCountdown.monthsRemaining === 1 ? 'Mês' : 'Meses'}
                  </span>
                </div>

                {/* Days Tile */}
                <div className="bg-white/90 rounded-2xl p-3 sm:p-4 border border-[#F0EDE6] shadow-2xs text-center flex flex-col justify-center transition-all hover:border-[#D4AF37]/40" suppressHydrationWarning>
                  <span className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#3D4B38] font-normal leading-none mb-1" suppressHydrationWarning>
                    {fifteenCountdown.daysRemaining}
                  </span>
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-[#8C867E]" suppressHydrationWarning>
                    {fifteenCountdown.daysRemaining === 1 ? 'Dia' : 'Dias'}
                  </span>
                </div>
              </div>

              {/* Progress Bar of Journey to 15 */}
              <div className="bg-white/75 rounded-2xl p-3.5 sm:p-4 border border-[#F0EDE6] shadow-2xs space-y-2" suppressHydrationWarning>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6B655D] font-medium flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#4A6741]" />
                    <span>Jornada até o grande marco</span>
                  </span>
                  <span className="font-bold text-[#4A6741] text-xs" suppressHydrationWarning>
                    {fifteenCountdown.progressPercentage}% percorrido
                  </span>
                </div>

                {/* Progress Track */}
                <div className="w-full h-2.5 bg-[#EBE7DF] rounded-full overflow-hidden p-0.5" suppressHydrationWarning>
                  <div
                    className="h-full bg-gradient-to-r from-[#A3B18A] via-[#4A6741] to-[#D4AF37] rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${Math.max(4, fifteenCountdown.progressPercentage)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#8C867E] pt-0.5" suppressHydrationWarning>
                  <span>Nascimento</span>
                  <span className="text-[#B8932E] font-medium" suppressHydrationWarning>
                    {fifteenCountdown.totalDaysRemaining.toLocaleString('pt-BR')} dias restantes
                  </span>
                  <span>15 Anos</span>
                </div>
              </div>

              {/* Bottom Capsule Highlights & CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs text-[#6B655D]">
                  <Lock className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>
                    {totalFifteenLocked > 0 ? (
                      <>
                        <strong className="text-[#3D4B38] font-semibold">{totalFifteenLocked}</strong>{' '}
                        {totalFifteenLocked === 1 ? 'lembrança trancada' : 'lembranças trancadas'}{' '}
                        para os 15 anos.
                      </>
                    ) : (
                      <>Cartas, áudios e fotos trancados para serem revelados neste dia.</>
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  id="btn-ver-capsula-15-anos"
                  onClick={handleCapsuleClick}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#F2F0EB] text-[#3D4B38] border border-[#D5D0C7] text-xs font-semibold transition-all active:scale-95 shadow-2xs cursor-pointer self-start sm:self-auto"
                >
                  <span>Explorar Cápsula</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#4A6741]" />
                </button>
              </div>
            </div>
          )
        ) : (
          /* Missing birth date state */
          <div className="bg-white rounded-2xl p-5 border border-[#F0EDE6] text-center space-y-2 shadow-xs">
            <p className="text-xs text-[#8C867E]">
              Defina a data de nascimento de {childProfile.name || 'sua filha'} para ativar a contagem regressiva e o cofre dos 15 anos.
            </p>
            <button
              type="button"
              onClick={handleProfileClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#A3B18A]/20 text-[#4A6741] hover:bg-[#A3B18A]/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Configurar Data de Nascimento</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

