'use client';

import React from 'react';
import { Memory, ChildProfile } from '@/types';
import { getLifeStage } from '@/lib/dateUtils';
import { Sparkles, ChevronRight } from 'lucide-react';

interface GrowthStagesViewProps {
  memories: Memory[];
  childProfile: ChildProfile;
  onSelectMemory: (memory: Memory) => void;
  onFilterStage: (stageName: string) => void;
}

const STAGES = [
  { name: 'Nascimento', desc: 'Os primeiros dias e a chegada ao mundo' },
  { name: 'Primeiro ano', desc: '1 a 12 meses de descobertas diárias' },
  { name: '1–2 anos', desc: 'Primeiros passos e primeiras palavras' },
  { name: '2–3 anos', desc: 'Curiosidade e as primeiras frases' },
  { name: '3–5 anos', desc: 'Imaginação, brincadeiras e primeiras amizades' },
  { name: '5–10 anos', desc: 'Primeiros anos escolares e infância plena' },
  { name: '10–15 anos', desc: 'Transição, novas paixões e crescimento' },
  { name: 'Adolescência', desc: 'Construindo asas para o futuro' },
  { name: 'Vida adulta', desc: 'A história completa entregue em suas mãos' },
];

export const GrowthStagesView: React.FC<GrowthStagesViewProps> = ({
  memories,
  childProfile,
  onSelectMemory,
}) => {
  const activeMemories = memories.filter((m) => !m.isDeleted);
  const currentStage = getLifeStage(childProfile.birthDate);

  return (
    <div id="growth-stages-view-container" className="space-y-6">
      <div>
        <span className="text-[10px] font-serif uppercase tracking-widest text-[#8C867E] font-bold block mb-0.5">
          Evolução no Tempo
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl text-[#3D4B38] font-normal">Seu crescimento</h1>
        <p className="text-xs text-[#8C867E] mt-1 font-serif italic max-w-lg">
          &ldquo;Como o tempo passa e como você se transforma a cada estação.&rdquo;
        </p>
      </div>

      <div className="space-y-3.5">
        {STAGES.map((stage) => {
          const stageMemories = activeMemories.filter((m) => getLifeStage(childProfile.birthDate, m.date) === stage.name);
          const isCurrent = stage.name === currentStage;

          return (
            <div
              key={stage.name}
              className={`p-5 rounded-2xl border transition-all ${
                isCurrent
                  ? 'bg-[#FDFBF7] border-[#4A6741] shadow-xs'
                  : 'bg-white border-[#F0EDE6]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-base font-semibold text-[#3D4B38]">
                    {stage.name}
                  </h3>
                  {isCurrent && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-[#A3B18A]/15 text-[#4A6741] font-semibold border border-[#A3B18A]/20">
                      Fase atual
                    </span>
                  )}
                </div>

                <span className="text-xs text-[#8C867E] font-medium">
                  {stageMemories.length} {stageMemories.length === 1 ? 'lembrança' : 'lembranças'}
                </span>
              </div>

              <p className="text-xs text-[#8C867E] mb-3">{stage.desc}</p>

              {stageMemories.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pt-2.5 border-t border-[#F0EDE6]">
                  {stageMemories.slice(0, 3).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onSelectMemory(m)}
                      className="px-3.5 py-1.5 bg-white border border-[#F0EDE6] rounded-xl text-xs text-[#4A443F] hover:border-[#A3B18A] hover:text-[#4A6741] transition-colors truncate max-w-[220px] shadow-2xs font-medium"
                    >
                      {m.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
