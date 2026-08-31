'use client';

import React, { useState } from 'react';
import { MilestoneItem, Memory } from '@/types';
import { formatDatePortuguese } from '@/lib/dateUtils';
import { Star, Plus, CheckCircle2, ChevronRight, X } from 'lucide-react';

interface MilestonesViewProps {
  milestones: MilestoneItem[];
  memories: Memory[];
  onSelectMilestoneMemory: (memoryId: string) => void;
  onRecordMilestone: (milestoneCategory: string) => void;
  onAddCustomMilestone: (title: string) => void;
}

export const MilestonesView: React.FC<MilestonesViewProps> = ({
  milestones,
  memories,
  onSelectMilestoneMemory,
  onRecordMilestone,
  onAddCustomMilestone,
}) => {
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;
    onAddCustomMilestone(customTitle.trim());
    setCustomTitle('');
    setShowAddCustom(false);
  };

  const achievedCount = milestones.filter((m) => !!m.achievedDate).length;

  return (
    <div id="milestones-view-container" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-serif uppercase tracking-widest text-[#8C867E] font-bold block mb-0.5">
            Marcos do Desenvolvimento
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#3D4B38] font-normal">Primeiras vezes</h1>
        </div>

        <button
          type="button"
          onClick={() => setShowAddCustom(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold bg-white border border-[#F0EDE6] text-[#4A6741] hover:bg-[#F8F6F2] transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Criar marco</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FDFBF7] border border-[#F0EDE6] p-4.5 rounded-[24px]">
        <p className="text-xs text-[#8C867E] font-serif italic">
          &ldquo;Cada primeira vez é um universo que se abre para ela.&rdquo;
        </p>
        <span className="text-xs font-semibold px-3.5 py-1 bg-[#A3B18A]/15 text-[#4A6741] rounded-full whitespace-nowrap border border-[#A3B18A]/20">
          {achievedCount} de {milestones.length} conquistados
        </span>
      </div>

      {/* Add Custom Milestone Form */}
      {showAddCustom && (
        <form onSubmit={handleAddCustom} className="p-4 bg-white border border-[#A3B18A] rounded-2xl flex items-center gap-3 shadow-xs">
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Ex: Primeira viagem de avião, Primeira ida à praia..."
            className="flex-1 px-4 py-2 bg-[#FDFCF9] border border-[#F0EDE6] rounded-xl text-xs text-[#4A443F] focus:outline-none focus:border-[#A3B18A]"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#4A6741] text-white rounded-xl text-xs font-semibold hover:bg-[#3D5235]"
          >
            Adicionar
          </button>
          <button
            type="button"
            onClick={() => setShowAddCustom(false)}
            className="p-2 text-[#8C867E] hover:text-[#3D4B38]"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Milestones Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {milestones.map((m) => {
          const isAchieved = !!m.achievedDate;
          return (
            <div
              key={m.id}
              className={`p-4.5 rounded-2xl border transition-all flex flex-col justify-between ${
                isAchieved
                  ? 'bg-white border-[#F0EDE6] shadow-xs'
                  : 'bg-[#FDFCF9] border-dashed border-[#E5E1D8]'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      isAchieved
                        ? 'bg-[#D4AF37]/15 text-[#D4AF37]'
                        : 'bg-[#F2F0EB] text-[#8C867E]'
                    }`}
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <h3 className="font-serif text-sm font-semibold text-[#4A443F]">
                    {m.title}
                  </h3>
                </div>

                {isAchieved && (
                  <CheckCircle2 className="w-4 h-4 text-[#4A6741] shrink-0" />
                )}
              </div>

              <div className="pt-2.5 border-t border-[#F0EDE6] flex items-center justify-between text-xs">
                {isAchieved ? (
                  <>
                    <span className="text-[11px] text-[#8C867E]">
                      {formatDatePortuguese(m.achievedDate!, { short: true })}
                    </span>
                    {m.memoryId && (
                      <button
                        type="button"
                        onClick={() => onSelectMilestoneMemory(m.memoryId!)}
                        className="text-[#4A6741] font-semibold hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>Ver lembrança</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRecordMilestone(m.category)}
                    className="w-full py-1.5 text-center text-xs font-semibold text-[#4A6741] hover:bg-[#A3B18A]/15 rounded-xl transition-colors"
                  >
                    + Registrar este marco
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
