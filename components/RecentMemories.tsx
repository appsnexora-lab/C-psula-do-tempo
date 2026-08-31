'use client';

import React from 'react';
import { Memory } from '@/types';
import { formatDatePortuguese } from '@/lib/dateUtils';
import { Lock, Heart, Star, ChevronRight, Mic, Video, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface RecentMemoriesProps {
  memories: Memory[];
  onSelectMemory: (memory: Memory) => void;
  onViewAll: () => void;
}

export const RecentMemories: React.FC<RecentMemoriesProps> = ({
  memories,
  onSelectMemory,
  onViewAll,
}) => {
  const activeMemories = memories.filter((m) => !m.isDeleted).slice(0, 4);

  if (activeMemories.length === 0) {
    return null;
  }

  return (
    <section id="recent-memories-section" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-serif uppercase tracking-wider text-[#8C867E] font-bold block mb-0.5">
            Registros Recentes
          </span>
          <h2 className="font-serif text-xl text-[#3D4B38] font-normal">Últimas memórias</h2>
        </div>

        <button
          id="btn-view-all-memories"
          type="button"
          onClick={onViewAll}
          className="text-xs text-[#4A6741] hover:text-[#3D5235] font-semibold inline-flex items-center gap-1 hover:underline"
        >
          <span>Ver todas</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Memories Grid / List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {activeMemories.map((mem) => {
          const firstPhoto = mem.photos?.find((p) => Boolean(p && p.url && p.url.trim() !== ''));
          const hasPhoto = Boolean(firstPhoto && firstPhoto.url);
          const hasAudio = mem.audios && mem.audios.length > 0;
          const hasVideo = mem.videos && mem.videos.length > 0;

          return (
            <div
              key={mem.id}
              id={`recent-memory-${mem.id}`}
              onClick={() => onSelectMemory(mem)}
              className="bg-white rounded-2xl p-4 border border-[#F0EDE6] shadow-xs hover:border-[#A3B18A] hover:shadow-sm transition-all cursor-pointer flex gap-3.5 items-start group"
            >
              {/* Media Thumbnail or Graphic */}
              <div className="w-16 h-16 rounded-xl bg-[#E5E1D8] shrink-0 overflow-hidden relative border border-[#F0EDE6] flex items-center justify-center">
                {hasPhoto && firstPhoto ? (
                  <Image
                    src={firstPhoto.url}
                    alt={mem.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                ) : hasVideo ? (
                  <div className="w-full h-full bg-[#3D4B38] flex flex-col items-center justify-center text-white group-hover:bg-[#4A6741] transition-colors">
                    <Video className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#A3B18A]/20 to-[#4A6741]/20 flex items-center justify-center text-[#4A6741]">
                    {hasAudio ? (
                      <Mic className="w-5 h-5" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                  </div>
                )}

                {/* Locked Indicator Badge */}
                {mem.isFutureLocked && (
                  <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-xs text-[#D4AF37] p-1 rounded-md">
                    <Lock className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>

              {/* Memory Summary Text */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[11px] text-[#8C867E]">
                  <span>{formatDatePortuguese(mem.date, { short: true })}</span>
                  <span>•</span>
                  <span className="truncate">{mem.calculatedAge}</span>
                  {mem.isSpecial && <Heart className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37] shrink-0" />}
                  {mem.isFirstTime && <Star className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37] shrink-0" />}
                </div>

                <h3 className="font-serif text-sm font-semibold text-[#4A443F] truncate mt-0.5 group-hover:text-[#4A6741] transition-colors">
                  {mem.title}
                </h3>

                <p className="text-xs text-[#8C867E] line-clamp-2 mt-1 font-serif leading-relaxed">
                  {mem.content || 'Sem descrição.'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
