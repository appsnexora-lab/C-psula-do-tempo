'use client';

import React from 'react';
import { Memory, ChildProfile } from '@/types';
import { Sparkles, Plus, Video, Calendar, Mic, Image as ImageIcon, Heart, ArrowRight } from 'lucide-react';
import { formatDatePortuguese, getTodayString, parseDate, calculateAgePortuguese } from '@/lib/dateUtils';
import Image from 'next/image';

interface TodayInHistoryProps {
  memories: Memory[];
  childProfile: ChildProfile;
  onSelectMemory: (memory: Memory) => void;
  onOpenAddModal: () => void;
}

/**
 * Calculates the exact highlight phrase:
 * "Há 1 ano, você tinha X dias." / "Há 2 anos, você tinha 1 ano e 3 meses."
 */
function getMemoryHistoryHeadline(memoryDateStr: string, birthDateStr?: string): { headline: string; yearsAgo: number } {
  const today = new Date();
  const currentYear = today.getFullYear();
  const memDate = parseDate(memoryDateStr);
  const memYear = memDate.getFullYear();
  const yearsAgo = currentYear - memYear;

  const yearsAgoText = yearsAgo === 1 ? 'Há 1 ano' : `Há ${yearsAgo} anos`;

  if (!birthDateStr) {
    return {
      headline: `${yearsAgoText}`,
      yearsAgo,
    };
  }

  const birthDate = parseDate(birthDateStr);
  const diffTime = memDate.getTime() - birthDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let agePart = '';
  if (diffDays < 0) {
    agePart = 'você ainda estava a caminho';
  } else if (diffDays === 0) {
    agePart = 'era o dia do seu nascimento';
  } else if (diffDays === 1) {
    agePart = 'você tinha 1 dia';
  } else if (diffDays < 60) {
    agePart = `você tinha ${diffDays} dias`;
  } else {
    const ageDesc = calculateAgePortuguese(birthDateStr, memoryDateStr);
    agePart = `você tinha ${ageDesc.replace(/ de vida$/i, '')}`;
  }

  return {
    headline: `${yearsAgoText}, ${agePart}.`,
    yearsAgo,
  };
}

export const TodayInHistory: React.FC<TodayInHistoryProps> = ({
  memories,
  childProfile,
  onSelectMemory,
  onOpenAddModal,
}) => {
  const today = new Date();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();
  const currentYear = today.getFullYear();

  // Find all memories registered on this same day/month in past years
  const activeMemories = memories.filter((m) => !m.isDeleted);
  const pastAnniversaryMemories = activeMemories
    .filter((m) => {
      const d = parseDate(m.date);
      return d.getMonth() === todayMonth && d.getDate() === todayDate && d.getFullYear() < currentYear;
    })
    .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());

  const currentTodayFormatted = formatDatePortuguese(getTodayString());

  return (
    <section
      id="today-in-history-card"
      className="bg-[#F8F6F2] rounded-[32px] border border-[#EBE7DF] p-6 sm:p-7 flex flex-col shadow-xs transition-all"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#4A6741]/10 flex items-center justify-center text-[#4A6741] shrink-0">
            <Calendar className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C867E] block" suppressHydrationWarning>
              {currentTodayFormatted}
            </span>
            <h2 className="text-xl font-serif text-[#3D4B38] font-normal leading-tight">
              Hoje na sua história
            </h2>
          </div>
        </div>

        {pastAnniversaryMemories.length > 0 && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <span className="text-[10px] font-bold text-[#4A6741] bg-[#4A6741]/10 border border-[#4A6741]/20 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>
                {pastAnniversaryMemories.length === 1
                  ? '1 memória neste dia'
                  : `${pastAnniversaryMemories.length} memórias neste dia`}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      {pastAnniversaryMemories.length > 0 ? (
        <div className="space-y-4">
          {pastAnniversaryMemories.map((mem) => {
            const { headline } = getMemoryHistoryHeadline(mem.date, childProfile.birthDate);
            const firstPhoto = mem.photos?.find((p) => Boolean(p && p.url && p.url.trim() !== ''));
            const hasVideos = mem.videos && mem.videos.length > 0;
            const hasAudios = mem.audios && mem.audios.length > 0;

            return (
              <div
                key={mem.id}
                id={`today-history-item-${mem.id}`}
                onClick={() => onSelectMemory(mem)}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F0EDE6] shadow-sm hover:border-[#A3B18A] hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
              >
                {/* Headline Badge */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3D4B38] bg-[#4A6741]/10 border border-[#4A6741]/20 px-3 py-1 rounded-full font-serif" suppressHydrationWarning>
                    <Heart className="w-3 h-3 text-[#4A6741] fill-[#4A6741]" />
                    <span suppressHydrationWarning>{headline}</span>
                  </span>

                  <span className="text-[11px] text-[#8C867E] font-medium">
                    {formatDatePortuguese(mem.date)}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Photo / Media Box */}
                  <div className="w-full sm:w-28 h-36 sm:h-28 bg-[#E5E1D8] rounded-xl shrink-0 flex items-center justify-center overflow-hidden relative shadow-2xs">
                    {firstPhoto && firstPhoto.url ? (
                      <Image
                        src={firstPhoto.url}
                        alt={mem.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : hasVideos ? (
                      <div className="w-full h-full bg-[#3D4B38] flex flex-col items-center justify-center text-white group-hover:bg-[#4A6741] transition-colors p-2 text-center">
                        <Video className="w-7 h-7 text-white mb-1" />
                        <span className="text-[10px] text-white/80 font-medium">Vídeo gravado</span>
                      </div>
                    ) : hasAudios ? (
                      <div className="w-full h-full bg-[#8C867E]/20 flex flex-col items-center justify-center text-[#4A6741] p-2 text-center">
                        <Mic className="w-6 h-6 mb-1 text-[#4A6741]" />
                        <span className="text-[10px] text-[#4A443F] font-medium">Áudio gravado</span>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#A3B18A]/25 to-[#4A6741]/20 flex flex-col items-center justify-center text-[#4A6741]">
                        <ImageIcon className="w-6 h-6 text-[#4A6741]/80 mb-1" />
                        <span className="text-[9px] uppercase tracking-wider text-[#8C867E] font-bold">Registro</span>
                      </div>
                    )}
                  </div>

                  {/* Content Details */}
                  <div className="flex flex-col justify-between flex-1 min-w-0 h-full">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {mem.moods && mem.moods.length > 0 && (
                          <span className="text-xs bg-[#F2F0EB] text-[#4A443F] px-2 py-0.5 rounded-full font-medium">
                            {mem.moods[0]}
                          </span>
                        )}
                        <h3 className="text-base font-semibold text-[#4A443F] truncate group-hover:text-[#4A6741] transition-colors">
                          {mem.title}
                        </h3>
                      </div>

                      <p className="text-xs text-[#6B655D] line-clamp-2 italic font-serif leading-relaxed mt-1">
                        &ldquo;{mem.content || mem.title}&rdquo;
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#F5F2EB] text-[11px] text-[#8C867E]">
                      <span>Por {mem.authorName || 'Família'}</span>
                      <span className="font-medium text-[#4A6741] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Ver memória completa
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty state with inviting message and button */
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#F0EDE6] shadow-sm text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[#A3B18A]/15 text-[#4A6741] flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>

          <h3 className="text-base font-serif text-[#3D4B38] font-semibold mb-1">
            Nenhuma memória anterior nesta data
          </h3>

          <p className="text-xs text-[#8C867E] max-w-md leading-relaxed mb-5">
            Cada dia guarda momentos únicos e pequenas descobertas na infância que merecem ser lembradas no futuro. Que tal eternizar uma foto, áudio ou pensamento de hoje?
          </p>

          <button
            type="button"
            id="btn-guardar-este-momento"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#4A6741] hover:bg-[#3D4B38] text-white text-xs font-semibold tracking-wide transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Guardar este momento</span>
          </button>
        </div>
      )}
    </section>
  );
};

