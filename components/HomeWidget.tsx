'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Memory, ChildProfile, AuthorProfile } from '@/types';
import { formatDatePortuguese, getNextBirthdayCountdown, parseDate } from '@/lib/dateUtils';
import {
  Sparkles,
  Gift,
  Heart,
  ChevronLeft,
  ChevronRight,
  Plus,
  Mic,
  Calendar,
  Lock,
  Star,
  BookOpen,
  ArrowRight,
  PenTool,
  Clock,
  Cake,
} from 'lucide-react';
import Image from 'next/image';

interface HomeWidgetProps {
  childProfile: ChildProfile;
  authorProfile?: AuthorProfile;
  memories: Memory[];
  onSelectMemory: (memory: Memory) => void;
  onOpenAddMemory: () => void;
  onOpenAddLetter?: () => void;
  onViewAllMemories?: () => void;
}

type WidgetMode = 'memories' | 'birthday';

export const HomeWidget: React.FC<HomeWidgetProps> = ({
  childProfile,
  memories = [],
  onSelectMemory,
  onOpenAddMemory,
  onOpenAddLetter,
  onViewAllMemories,
}) => {
  const [userSelectedMode, setUserSelectedMode] = useState<WidgetMode | null>(null);
  const [memoryIndex, setMemoryIndex] = useState(0);

  const activeMemories = useMemo(() => {
    return memories
      .filter((m) => !m.isDeleted)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [memories]);

  // Birthday Calculations
  const birthdayInfo = useMemo(() => {
    return getNextBirthdayCountdown(childProfile.birthDate);
  }, [childProfile.birthDate]);

  // Active mode is user selected or auto-derived (if birthday is within 14 days)
  const activeMode: WidgetMode =
    userSelectedMode ??
    (birthdayInfo.daysRemaining <= 14 && birthdayInfo.daysRemaining >= 0 && Boolean(childProfile.birthDate)
      ? 'birthday'
      : 'memories');

  // Calculate birthday date string in Portuguese
  const nextBirthdayFormatted = useMemo(() => {
    if (!childProfile.birthDate) return '';
    try {
      const birth = parseDate(childProfile.birthDate);
      const today = new Date();
      const nextYear =
        today.getMonth() > birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() > birth.getDate())
          ? today.getFullYear() + 1
          : today.getFullYear();
      const nextDate = new Date(nextYear, birth.getMonth(), birth.getDate());
      return formatDatePortuguese(
        `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(
          nextDate.getDate()
        ).padStart(2, '0')}`,
        { short: false }
      );
    } catch {
      return '';
    }
  }, [childProfile.birthDate]);

  // Progress of current age year (0 to 100%)
  const yearProgress = useMemo(() => {
    if (!childProfile.birthDate) return 0;
    try {
      const totalYearDays = 365.25;
      const daysPassed = Math.max(0, totalYearDays - birthdayInfo.daysRemaining);
      return Math.min(100, Math.max(5, Math.round((daysPassed / totalYearDays) * 100)));
    } catch {
      return 50;
    }
  }, [childProfile.birthDate, birthdayInfo.daysRemaining]);

  // Handle Carousel navigation
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMemoryIndex((prev) => (prev > 0 ? prev - 1 : activeMemories.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMemoryIndex((prev) => (prev < activeMemories.length - 1 ? prev + 1 : 0));
  };

  const currentMem = activeMemories[memoryIndex] || activeMemories[0];
  const firstPhoto = currentMem?.photos?.find((p) => Boolean(p && p.url && p.url.trim() !== ''));
  const childFirstName = childProfile.name ? childProfile.name.trim().split(' ')[0] : 'sua filha';

  return (
    <section
      id="home-interactive-widget"
      className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#FAF8F5] via-[#F7F4EE] to-[#EFEAE1] border border-[#E6DFC9] p-4 sm:p-6 shadow-sm transition-all hover:border-[#D4AF37]/50"
      suppressHydrationWarning
    >
      {/* Decorative ambient gradients */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#4A6741]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Widget Header & Mode Switcher */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#EBE4D5]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#4A6741]/10 border border-[#4A6741]/20 flex items-center justify-center text-[#4A6741] shrink-0">
            {activeMode === 'memories' ? (
              <Sparkles className="w-4 h-4" />
            ) : (
              <Gift className="w-4 h-4 text-[#D4AF37]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C867E]">
                Widget Interativo
              </span>
              {birthdayInfo.daysRemaining <= 30 && birthdayInfo.daysRemaining > 0 && (
                <span
                  className="inline-flex items-center gap-1 text-[9px] font-bold text-[#B8932E] bg-[#D4AF37]/15 px-2 py-0.2 rounded-full uppercase tracking-wider"
                  suppressHydrationWarning
                >
                  <Cake className="w-2.5 h-2.5" />
                  Aniversário Próximo
                </span>
              )}
            </div>
            <h3 className="font-serif text-lg text-[#3D4B38] font-normal leading-tight">
              {activeMode === 'memories' ? 'Destaques Recentes' : `Celebração de ${childFirstName}`}
            </h3>
          </div>
        </div>

        {/* Tab switcher buttons */}
        <div className="flex items-center bg-white/80 p-1 rounded-full border border-[#EBE4D5] shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            id="widget-tab-memories"
            onClick={() => setUserSelectedMode('memories')}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'memories'
                ? 'bg-[#4A6741] text-white shadow-xs'
                : 'text-[#6B655D] hover:text-[#3D4B38] hover:bg-[#F2EFE8]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Últimas Memórias</span>
            {activeMemories.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeMode === 'memories' ? 'bg-white/20 text-white' : 'bg-[#EAE5DC] text-[#6B655D]'
                }`}
              >
                {activeMemories.length}
              </span>
            )}
          </button>

          <button
            type="button"
            id="widget-tab-birthday"
            onClick={() => setUserSelectedMode('birthday')}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'birthday'
                ? 'bg-[#B8932E] text-white shadow-xs'
                : 'text-[#6B655D] hover:text-[#3D4B38] hover:bg-[#F2EFE8]'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Próximo Aniversário</span>
            {birthdayInfo.isToday && (
              <span className="animate-pulse text-[10px] bg-red-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                Hoje!
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Widget Content Body */}
      <div className="relative">
        {/* =========================================================================
            MODE 1: ÚLTIMAS MEMÓRIAS REGISTRADAS
           ========================================================================= */}
        {activeMode === 'memories' && (
          <div>
            {activeMemories.length === 0 ? (
              /* Empty state */
              <div className="bg-white/80 rounded-2xl p-6 border border-[#EBE4D5] text-center space-y-3 shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-[#4A6741]/10 text-[#4A6741] flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-serif text-base font-medium text-[#3D4B38]">
                    Nenhuma memória registrada ainda
                  </h4>
                  <p className="text-xs text-[#8C867E] max-w-sm mx-auto mt-1">
                    Guarde o primeiro sorriso, palavra ou momento especial de {childFirstName} para
                    vê-lo destacado aqui todos os dias.
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-widget-add-first-memory"
                  onClick={onOpenAddMemory}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#4A6741] text-white text-xs font-semibold shadow-xs hover:bg-[#3D5235] transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Guardar Primeira Memória</span>
                </button>
              </div>
            ) : (
              /* Active Memory Card Carousel */
              <div className="space-y-3">
                <div
                  id={`widget-memory-card-${currentMem.id}`}
                  onClick={() => onSelectMemory(currentMem)}
                  className="group relative bg-white/90 hover:bg-white rounded-2xl p-4 sm:p-5 border border-[#EBE4D5] hover:border-[#A3B18A] shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row gap-4 items-start"
                >
                  {/* Thumbnail / Media Icon */}
                  <div className="relative w-full sm:w-28 h-36 sm:h-28 rounded-xl bg-[#EBE7DF] overflow-hidden shrink-0 border border-[#E5E0D4] flex items-center justify-center group-hover:shadow-xs transition-all">
                    {firstPhoto ? (
                      <Image
                        src={firstPhoto.url}
                        alt={currentMem.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#A3B18A]/20 via-[#FAF8F5] to-[#4A6741]/15 flex flex-col items-center justify-center text-[#4A6741] p-3 text-center">
                        <Sparkles className="w-6 h-6 mb-1 text-[#4A6741]" />
                        <span className="text-[10px] font-serif uppercase tracking-wider text-[#6B655D]">
                          Lembrança
                        </span>
                      </div>
                    )}

                    {/* Quick Badges inside photo */}
                    {currentMem.isFutureLocked && (
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-[#D4AF37] px-1.5 py-0.5 rounded-md text-[10px] flex items-center gap-1 font-bold">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Cápsula</span>
                      </div>
                    )}

                    {currentMem.audios && currentMem.audios.length > 0 && (
                      <div className="absolute bottom-2 left-2 bg-[#3D4B38]/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1">
                        <Mic className="w-3 h-3 text-[#A3B18A]" />
                        <span>Voz</span>
                      </div>
                    )}
                  </div>

                  {/* Content Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                    <div>
                      {/* Meta Tags */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#8C867E] mb-1.5">
                        <span className="font-medium text-[#4A6741] bg-[#4A6741]/10 px-2 py-0.5 rounded-full" suppressHydrationWarning>
                          {formatDatePortuguese(currentMem.date, { short: true })}
                        </span>
                        {currentMem.calculatedAge && (
                          <span className="text-[#6B655D]" suppressHydrationWarning>
                            • {currentMem.calculatedAge}
                          </span>
                        )}
                        {currentMem.isSpecial && (
                          <span className="inline-flex items-center gap-1 text-[#B8932E] font-medium">
                            <Heart className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                            Especial
                          </span>
                        )}
                        {currentMem.isFirstTime && (
                          <span className="inline-flex items-center gap-1 text-[#B8932E] font-medium">
                            <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                            1ª Vez
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="font-serif text-base sm:text-lg font-semibold text-[#3D4B38] group-hover:text-[#4A6741] transition-colors leading-snug line-clamp-1">
                        {currentMem.title}
                      </h4>

                      {/* Snippet */}
                      <p className="text-xs sm:text-sm text-[#6B655D] font-serif leading-relaxed line-clamp-2 mt-1.5">
                        {currentMem.content || 'Uma lembrança preciosa guardada no coração.'}
                      </p>
                    </div>

                    {/* Footer / Read link */}
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#F2ECE1]">
                      <span className="text-[11px] text-[#8C867E]">
                        Registrado por <strong className="text-[#4A443F]">{currentMem.authorName || 'Família'}</strong>
                      </span>

                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#4A6741] group-hover:translate-x-0.5 transition-transform">
                        <span>Ler memória</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Carousel Controls & Pagination */}
                <div className="flex items-center justify-between pt-1 px-1">
                  <div className="flex items-center gap-1.5">
                    {activeMemories.map((mem, idx) => (
                      <button
                        key={mem.id}
                        type="button"
                        onClick={() => setMemoryIndex(idx)}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          idx === memoryIndex ? 'w-6 bg-[#4A6741]' : 'w-2 bg-[#D9D3C7] hover:bg-[#A3B18A]'
                        }`}
                        title={mem.title}
                      />
                    ))}
                    <span className="text-[11px] text-[#8C867E] ml-2">
                      {memoryIndex + 1} de {activeMemories.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="btn-widget-prev-memory"
                      onClick={handlePrev}
                      className="w-7 h-7 rounded-full bg-white border border-[#E0DACF] hover:bg-[#F2EFE8] flex items-center justify-center text-[#4A443F] transition-colors cursor-pointer shadow-2xs"
                      title="Memória anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      id="btn-widget-next-memory"
                      onClick={handleNext}
                      className="w-7 h-7 rounded-full bg-white border border-[#E0DACF] hover:bg-[#F2EFE8] flex items-center justify-center text-[#4A443F] transition-colors cursor-pointer shadow-2xs"
                      title="Próxima memória"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    {onViewAllMemories && (
                      <button
                        type="button"
                        id="btn-widget-view-all"
                        onClick={onViewAllMemories}
                        className="text-xs text-[#4A6741] hover:underline font-semibold ml-2 cursor-pointer"
                      >
                        Ver todas
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            MODE 2: LEMBRETE DO PRÓXIMO ANIVERSÁRIO
           ========================================================================= */}
        {activeMode === 'birthday' && (
          <div>
            {!childProfile.birthDate ? (
              /* Missing Birthday State */
              <div className="bg-white/80 rounded-2xl p-6 border border-[#EBE4D5] text-center space-y-3 shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-[#D4AF37]/15 text-[#B8932E] flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-serif text-base font-medium text-[#3D4B38]">
                    Data de nascimento não configurada
                  </h4>
                  <p className="text-xs text-[#8C867E] max-w-sm mx-auto mt-1">
                    Cadastre a data em que {childFirstName} nasceu para ativar a contagem viva do
                    próximo aniversário e os marcos de cada idade.
                  </p>
                </div>
              </div>
            ) : birthdayInfo.isToday ? (
              /* IS TODAY CELEBRATION CARD */
              <div className="bg-gradient-to-r from-[#D4AF37]/20 via-[#FAF6ED] to-[#4A6741]/20 rounded-2xl p-5 sm:p-6 border-2 border-[#D4AF37] shadow-md text-center space-y-3">
                <div className="inline-flex p-3 rounded-full bg-[#D4AF37] text-white shadow-sm animate-bounce">
                  <Cake className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold tracking-widest text-[#B8932E] block">
                    Hoje é o grande dia! 🎉
                  </span>
                  <h4 className="font-serif text-2xl sm:text-3xl text-[#3D4B38] font-semibold">
                    Parabéns, {childFirstName}!
                  </h4>
                  <p className="text-sm text-[#6B655D] font-serif max-w-md mx-auto" suppressHydrationWarning>
                    {childFirstName} completa {birthdayInfo.nextAge}{' '}
                    {birthdayInfo.nextAge === 1 ? 'aninho' : 'anos'} de pura luz e amor!
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={onOpenAddMemory}
                    className="px-4 py-2 rounded-full bg-[#4A6741] text-white text-xs font-semibold shadow-xs hover:bg-[#3D5235] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Registrar Foto da Festa</span>
                  </button>
                  {onOpenAddLetter && (
                    <button
                      type="button"
                      onClick={onOpenAddLetter}
                      className="px-4 py-2 rounded-full bg-white text-[#3D4B38] border border-[#D5D0C7] text-xs font-semibold shadow-2xs hover:bg-[#F8F6F2] transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <PenTool className="w-3.5 h-3.5 text-[#B8932E]" />
                      <span>Escrever Carta de Aniversário</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* REGULAR BIRTHDAY COUNTDOWN CARD */
              <div className="bg-white/90 rounded-2xl p-5 border border-[#EBE4D5] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left Counter Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#B8932E]/30 border border-[#D4AF37]/40 flex flex-col items-center justify-center text-center shrink-0 shadow-2xs">
                      <span className="font-serif text-2xl font-bold text-[#8C6D1F] leading-none" suppressHydrationWarning>
                        {birthdayInfo.daysRemaining}
                      </span>
                      <span className="text-[9px] uppercase font-bold tracking-wider text-[#8C6D1F] mt-0.5" suppressHydrationWarning>
                        {birthdayInfo.daysRemaining === 1 ? 'Dia' : 'Dias'}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-[#8C867E]" suppressHydrationWarning>
                        <Clock className="w-3.5 h-3.5 text-[#B8932E]" />
                        <span>Próximo aniversário: <strong className="text-[#4A443F] font-semibold">{nextBirthdayFormatted}</strong></span>
                      </div>

                      <h4 className="font-serif text-lg sm:text-xl text-[#3D4B38] font-medium mt-0.5 leading-snug" suppressHydrationWarning>
                        Rumo aos {birthdayInfo.nextAge} {birthdayInfo.nextAge === 1 ? 'aninho' : 'anos'} de {childFirstName}
                      </h4>

                      <p className="text-xs text-[#8C867E] mt-0.5" suppressHydrationWarning>
                        {birthdayInfo.message}
                      </p>
                    </div>
                  </div>

                  {/* Right Action buttons */}
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      id="btn-widget-birthday-add-memory"
                      onClick={onOpenAddMemory}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#4A6741] hover:bg-[#3D5235] text-white text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Guardar Momento</span>
                    </button>
                    {onOpenAddLetter && (
                      <button
                        type="button"
                        id="btn-widget-birthday-add-letter"
                        onClick={onOpenAddLetter}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F5F2EB] text-[#3D4B38] border border-[#D5D0C7] text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                      >
                        <PenTool className="w-3.5 h-3.5 text-[#B8932E]" />
                        <span>Carta p/ Aniversário</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Growth Year Progress Track */}
                <div className="pt-2 border-t border-[#F2ECE1] space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-[#8C867E]">
                    <span>Ciclo de crescimento do ano atual</span>
                    <span className="font-bold text-[#4A6741]" suppressHydrationWarning>
                      {yearProgress}% percorrido
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#EBE7DF] rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[#A3B18A] via-[#4A6741] to-[#D4AF37] rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${yearProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
