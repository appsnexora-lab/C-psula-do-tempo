'use client';

import React, { useState, useMemo } from 'react';
import { Memory, Letter } from '@/types';
import { formatDatePortuguese, parseDate } from '@/lib/dateUtils';
import { 
  Search, 
  Grid, 
  List, 
  Calendar, 
  Heart, 
  Star, 
  Lock, 
  Mic, 
  Video, 
  Image as ImageIcon,
  Sparkles,
  Plus,
  BookOpen
} from 'lucide-react';
import Image from 'next/image';

interface MemoriesExplorerProps {
  memories: Memory[];
  letters: Letter[];
  onSelectMemory: (memory: Memory) => void;
  onOpenAddModal: () => void;
  onOpenReader?: (memory: Memory) => void;
  initialFilter?: string;
}

type FilterType =
  | 'Todas'
  | 'Fotos'
  | 'Vídeos'
  | 'Áudios'
  | 'Primeiras vezes'
  | 'Especiais'
  | 'Guardadas para o futuro';

export const MemoriesExplorer: React.FC<MemoriesExplorerProps> = ({
  memories,
  letters,
  onSelectMemory,
  onOpenAddModal,
  onOpenReader,
  initialFilter = 'Todas',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>(initialFilter as FilterType);
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');

  const activeMemories = useMemo(() => memories.filter((m) => !m.isDeleted), [memories]);

  // Filter and Search Pipeline
  const filteredMemories = useMemo(() => {
    let result = [...activeMemories];

    // Filter by type
    if (activeFilter === 'Fotos') {
      result = result.filter((m) => m.photos && m.photos.length > 0);
    } else if (activeFilter === 'Vídeos') {
      result = result.filter((m) => m.videos && m.videos.length > 0);
    } else if (activeFilter === 'Áudios') {
      result = result.filter((m) => m.audios && m.audios.length > 0);
    } else if (activeFilter === 'Primeiras vezes') {
      result = result.filter((m) => m.isFirstTime);
    } else if (activeFilter === 'Especiais') {
      result = result.filter((m) => m.isSpecial);
    } else if (activeFilter === 'Guardadas para o futuro') {
      result = result.filter((m) => m.isFutureLocked);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.content.toLowerCase().includes(q) ||
          m.date.includes(q) ||
          (m.authorName && m.authorName.toLowerCase().includes(q)) ||
          (m.location && m.location.toLowerCase().includes(q)) ||
          (m.firstTimeCategory && m.firstTimeCategory.toLowerCase().includes(q)) ||
          (m.moods && m.moods.some((mood) => mood.toLowerCase().includes(q)))
      );
    }

    // Sort descending by date
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeMemories, activeFilter, searchQuery]);

  // Group by Year and Month for Timeline
  const groupedTimeline = useMemo(() => {
    const groups: { [year: string]: { [month: string]: Memory[] } } = {};
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    filteredMemories.forEach((mem) => {
      const date = parseDate(mem.date);
      const year = date.getFullYear().toString();
      const month = months[date.getMonth()];

      if (!groups[year]) groups[year] = {};
      if (!groups[year][month]) groups[year][month] = [];
      groups[year][month].push(mem);
    });

    return groups;
  }, [filteredMemories]);

  const filterOptions: FilterType[] = [
    'Todas',
    'Fotos',
    'Vídeos',
    'Áudios',
    'Primeiras vezes',
    'Especiais',
    'Guardadas para o futuro',
  ];

  return (
    <div id="memories-explorer-container" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-serif uppercase tracking-widest text-[#8C867E] font-bold block mb-0.5">
            Linha do Tempo
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#3D4B38] font-normal">Memórias</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="bg-[#F2F0EB] p-1 rounded-2xl flex items-center gap-1 border border-[#F0EDE6]">
            <button
              id="btn-timeline-view-mode"
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`p-2 rounded-xl transition-all ${
                viewMode === 'timeline'
                  ? 'bg-white text-[#4A6741] shadow-2xs font-semibold'
                  : 'text-[#8C867E] hover:text-[#3D4B38]'
              }`}
              title="Visualização em Linha do Tempo"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              id="btn-grid-view-mode"
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-[#4A6741] shadow-2xs font-semibold'
                  : 'text-[#8C867E] hover:text-[#3D4B38]'
              }`}
              title="Visualização em Grade de Fotos"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          <button
            id="btn-add-memory-explorer"
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold bg-[#4A6741] hover:bg-[#3D5235] text-white shadow-md shadow-[#4A6741]/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Guardar</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#8C867E] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id="search-memories-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por sorriso, primeiro banho, praia, data, palavras..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-[#F0EDE6] rounded-2xl text-xs sm:text-sm text-[#4A443F] placeholder-[#8C867E] focus:outline-none focus:border-[#A3B18A] focus:ring-1 focus:ring-[#A3B18A] shadow-xs transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#8C867E] hover:text-[#3D4B38] font-medium"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterOptions.map((filter) => (
          <button
            key={filter}
            id={`filter-chip-${filter}`}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
              activeFilter === filter
                ? 'bg-[#4A6741] text-white font-semibold shadow-xs'
                : 'bg-white border border-[#F0EDE6] text-[#8C867E] hover:text-[#3D4B38] hover:bg-[#F8F6F2]'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Results View */}
      {filteredMemories.length > 0 ? (
        viewMode === 'timeline' ? (
          /* Chronological Timeline View */
          <div className="space-y-8 pt-2">
            {Object.keys(groupedTimeline).map((year) => (
              <div key={year} className="space-y-6">
                {/* Year Badge */}
                <div className="sticky top-20 z-10 py-1 bg-[#FDFCF9]/90 backdrop-blur-xs inline-block">
                  <span className="font-serif text-lg font-normal text-[#3D4B38] px-3.5 py-1.5 bg-[#F2F0EB] rounded-2xl border border-[#F0EDE6] shadow-xs">
                    {year}
                  </span>
                </div>

                {Object.keys(groupedTimeline[year]).map((month) => (
                  <div key={`${year}-${month}`} className="space-y-4 pl-2 sm:pl-4 border-l-2 border-[#F0EDE6] ml-4">
                    {/* Month header */}
                    <h3 className="font-serif text-xs font-semibold text-[#8C867E] uppercase tracking-wider pl-4">
                      {month}
                    </h3>

                    {/* Memories in this month */}
                    <div className="space-y-4">
                      {groupedTimeline[year][month].map((mem) => {
                        const firstPhoto = mem.photos?.find((p) => Boolean(p && p.url && p.url.trim() !== ''));
                        const hasPhoto = Boolean(firstPhoto && firstPhoto.url);
                        const hasVideo = mem.videos && mem.videos.length > 0;
                        return (
                          <article
                            key={mem.id}
                            id={`timeline-card-${mem.id}`}
                            onClick={() => onSelectMemory(mem)}
                            className="cursor-pointer relative pl-6 group"
                          >
                            {/* Connected timeline node circle */}
                            <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-[#FDFCF9] border-3 border-[#4A6741] group-hover:scale-125 transition-transform" />

                            <div className="bg-white border border-[#F0EDE6] rounded-2xl p-4 sm:p-5 hover:border-[#A3B18A] hover:shadow-xs transition-all flex flex-col sm:flex-row gap-4">
                              {hasPhoto && firstPhoto ? (
                                <div className="relative w-full sm:w-36 h-36 rounded-xl overflow-hidden shrink-0 bg-[#E5E1D8] border border-[#F0EDE6]">
                                  <Image
                                    src={firstPhoto.url}
                                    alt={mem.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              ) : hasVideo ? (
                                <div className="relative w-full sm:w-36 h-36 rounded-xl overflow-hidden shrink-0 bg-[#3D4B38] border border-[#F0EDE6] flex flex-col items-center justify-center text-white shadow-xs group-hover:bg-[#4A6741] transition-colors">
                                  <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                                    <Video className="w-5 h-5 text-white" />
                                  </div>
                                  <span className="text-[11px] font-semibold tracking-tight">Reproduzir Vídeo</span>
                                </div>
                              ) : null}

                              <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center gap-2 text-[11px] text-[#8C867E] mb-1">
                                    <span>{formatDatePortuguese(mem.date, { short: true })}</span>
                                    <span>•</span>
                                    <span className="text-[#4A6741] font-semibold">{mem.calculatedAge}</span>
                                    {mem.isSpecial && <Heart className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />}
                                    {mem.isFirstTime && <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />}
                                    {mem.isFutureLocked && <Lock className="w-3.5 h-3.5 text-[#8C867E]" />}
                                  </div>

                                  <h4 className="font-serif text-base text-[#4A443F] font-semibold leading-snug group-hover:text-[#4A6741] transition-colors">
                                    {mem.title}
                                  </h4>

                                  <p className="font-serif text-xs text-[#8C867E] mt-1.5 leading-relaxed line-clamp-3 italic">
                                    &ldquo;{mem.content}&rdquo;
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#F0EDE6] text-[10px] text-[#8C867E]">
                                  <div className="flex items-center gap-3">
                                    {mem.photos && mem.photos.length > 0 && (
                                      <span className="inline-flex items-center gap-1">
                                        <ImageIcon className="w-3 h-3 text-[#4A6741]" />
                                        <span>{mem.photos.length} foto(s)</span>
                                      </span>
                                    )}
                                    {mem.videos && mem.videos.length > 0 && (
                                      <span className="inline-flex items-center gap-1 text-[#4A6741] font-medium">
                                        <Video className="w-3 h-3" />
                                        <span>{mem.videos.length} vídeo(s)</span>
                                      </span>
                                    )}
                                    {mem.audios && mem.audios.length > 0 && (
                                      <span className="inline-flex items-center gap-1 text-[#4A6741] font-medium">
                                        <Mic className="w-3 h-3" />
                                        <span>Áudio gravado</span>
                                      </span>
                                    )}
                                    {mem.location && <span>📍 {mem.location}</span>}
                                  </div>

                                  {onOpenReader && (
                                    <button
                                      type="button"
                                      id={`btn-reader-${mem.id}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenReader(mem);
                                      }}
                                      className="inline-flex items-center gap-1 text-[#4A6741] hover:text-[#3D5235] font-semibold hover:underline bg-[#4A6741]/8 hover:bg-[#4A6741]/15 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                                      title="Ler história no Modo Leitura imersivo"
                                    >
                                      <BookOpen className="w-3 h-3" />
                                      <span>Modo Leitura</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          /* Photo & Media Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 pt-2">
            {filteredMemories.map((mem) => {
              const firstPhoto = mem.photos?.find((p) => Boolean(p && p.url && p.url.trim() !== ''));
              const hasPhoto = Boolean(firstPhoto && firstPhoto.url);
              const hasVideo = mem.videos && mem.videos.length > 0;
              return (
                <div
                  key={mem.id}
                  onClick={() => onSelectMemory(mem)}
                  className="cursor-pointer group relative aspect-square rounded-2xl overflow-hidden border border-[#F0EDE6] bg-[#E5E1D8]"
                >
                  {hasPhoto && firstPhoto ? (
                    <Image
                      src={firstPhoto.url}
                      alt={mem.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : hasVideo ? (
                    <div className="w-full h-full bg-[#3D4B38] flex flex-col items-center justify-center p-3 text-white text-center group-hover:bg-[#4A6741] transition-colors">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <Video className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[10px] font-semibold tracking-tight">Vídeo</span>
                    </div>
                  ) : (
                    <div className="w-full h-full p-4 flex flex-col justify-between bg-white">
                      <span className="text-[10px] text-[#8C867E]">{formatDatePortuguese(mem.date, { short: true })}</span>
                      <p className="font-serif text-xs text-[#4A443F] line-clamp-3 leading-snug font-medium">
                        {mem.title}
                      </p>
                      <span className="text-[10px] text-[#4A6741] font-semibold">{mem.calculatedAge}</span>
                    </div>
                  )}

                  {/* Gradient Overlay with title on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end text-white">
                    <span className="text-[10px] text-white/80">{mem.calculatedAge}</span>
                    <h4 className="font-serif text-xs font-medium line-clamp-2">{mem.title}</h4>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Empty Filter State */
        <div className="text-center py-12 px-4 bg-white border border-[#F0EDE6] rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FDFCF9] text-[#8C867E] flex items-center justify-center mx-auto mb-2 border border-[#F0EDE6]">
            <Sparkles className="w-6 h-6 text-[#A3B18A]" />
          </div>
          <h3 className="font-serif text-lg text-[#3D4B38]">Ainda não existe nenhuma lembrança aqui.</h3>
          <p className="text-xs text-[#8C867E] max-w-xs mx-auto">
            {searchQuery
              ? 'Nenhuma lembrança encontrada para esta busca. Tente outras palavras.'
              : 'Vamos guardar a primeira lembrança para começar a escrever esta história?'}
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-xs font-semibold bg-[#4A6741] hover:bg-[#3D5235] text-white shadow-md shadow-[#4A6741]/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Guardar uma lembrança</span>
          </button>
        </div>
      )}
    </div>
  );
};
