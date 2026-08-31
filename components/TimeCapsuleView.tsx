'use client';

import React, { useState } from 'react';
import { Memory, Letter, ChildProfile } from '@/types';
import { formatDatePortuguese } from '@/lib/dateUtils';
import { Lock, Unlock, Gift, Sparkles, Image as ImageIcon, Video, Mic, Mail, ChevronRight, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TimeCapsuleViewProps {
  memories: Memory[];
  letters: Letter[];
  childProfile: ChildProfile;
  onSelectMemory: (memory: Memory) => void;
}

export const TimeCapsuleView: React.FC<TimeCapsuleViewProps> = ({
  memories,
  letters,
  childProfile,
  onSelectMemory,
}) => {
  const [openedCapsuleId, setOpenedCapsuleId] = useState<string | null>(null);

  // Group locked items by target age or custom
  const lockedMemories = memories.filter((m) => !m.isDeleted && m.isFutureLocked);
  const lockedLetters = letters.filter((l) => !l.isDeleted && l.isFutureLocked);

  // Pre-configured capsules
  const capsules = [
    {
      id: 'cap-18',
      title: 'Para você aos 18 anos',
      targetAge: 18,
      quote: '“Eu guardei algumas coisas para você descobrir quando estiver pronta para voar.”',
      memories: lockedMemories.filter((m) => m.unlockAge === 18),
      letters: lockedLetters.filter((l) => l.unlockAge === 18),
    },
    {
      id: 'cap-15',
      title: 'Para você aos 15 anos',
      targetAge: 15,
      quote: '“Momentos da sua infância para iluminar a sua juventude.”',
      memories: lockedMemories.filter((m) => m.unlockAge === 15),
      letters: lockedLetters.filter((l) => l.unlockAge === 15),
    },
    {
      id: 'cap-10',
      title: 'Para você aos 10 anos',
      targetAge: 10,
      quote: '“Lembranças de quando você cabia no meu colo.”',
      memories: lockedMemories.filter((m) => m.unlockAge === 10),
      letters: lockedLetters.filter((l) => l.unlockAge === 10),
    },
  ];

  return (
    <div id="time-capsule-view-container" className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-[10px] font-serif uppercase tracking-widest text-[#8C867E] font-bold block mb-0.5">
          Cofre Digital de Memórias
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl text-[#3D4B38] font-normal">Cápsula do Tempo</h1>
        <p className="text-xs text-[#8C867E] mt-1 font-serif italic max-w-lg">
          &ldquo;Tudo aquilo que eu não quero esquecer, estou guardando para você.&rdquo;
        </p>
      </div>

      {/* Capsules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {capsules.map((capsule) => {
          const totalPhotos = capsule.memories.reduce((acc, m) => acc + (m.photos?.length || 0), 0);
          const totalVideos = capsule.memories.reduce((acc, m) => acc + (m.videos?.length || 0), 0);
          const totalAudios = capsule.memories.reduce((acc, m) => acc + (m.audios?.length || 0), 0);
          const totalLetters = capsule.letters.length;
          const totalItems = capsule.memories.length + capsule.letters.length;

          const isOpened = openedCapsuleId === capsule.id;

          return (
            <div
              key={capsule.id}
              id={`capsule-card-${capsule.id}`}
              className="bg-white rounded-[32px] border border-[#F0EDE6] p-6 flex flex-col justify-between shadow-xs hover:border-[#A3B18A] transition-all relative overflow-hidden group"
            >
              {/* Vault Header */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#F2F0EB] flex items-center justify-center text-[#D4AF37] shadow-2xs">
                    {isOpened ? (
                      <Unlock className="w-6 h-6 text-[#4A6741]" />
                    ) : (
                      <Lock className="w-6 h-6 text-[#D4AF37]" />
                    )}
                  </div>

                  <span className="text-[10px] font-bold text-[#A3B18A] uppercase px-2.5 py-1 bg-[#A3B18A]/10 border border-[#A3B18A]/20 rounded-full">
                    {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                <h2 className="font-serif text-lg text-[#3D4B38] font-normal mb-1">
                  {capsule.title}
                </h2>

                <p className="font-serif text-xs text-[#8C867E] italic leading-relaxed mb-4">
                  {capsule.quote}
                </p>

                {/* Items Counters inside vault */}
                <div className="grid grid-cols-4 gap-1.5 py-3 px-2 bg-[#FDFBF7] rounded-2xl border border-[#F0EDE6] text-center mb-4">
                  <div>
                    <ImageIcon className="w-3.5 h-3.5 text-[#4A6741] mx-auto mb-0.5" />
                    <span className="block text-xs font-semibold text-[#4A443F]">{totalPhotos}</span>
                    <span className="block text-[9px] text-[#8C867E]">Fotos</span>
                  </div>
                  <div>
                    <Mail className="w-3.5 h-3.5 text-[#4A6741] mx-auto mb-0.5" />
                    <span className="block text-xs font-semibold text-[#4A443F]">{totalLetters}</span>
                    <span className="block text-[9px] text-[#8C867E]">Cartas</span>
                  </div>
                  <div>
                    <Mic className="w-3.5 h-3.5 text-[#4A6741] mx-auto mb-0.5" />
                    <span className="block text-xs font-semibold text-[#4A443F]">{totalAudios}</span>
                    <span className="block text-[9px] text-[#8C867E]">Áudios</span>
                  </div>
                  <div>
                    <Video className="w-3.5 h-3.5 text-[#4A6741] mx-auto mb-0.5" />
                    <span className="block text-xs font-semibold text-[#4A443F]">{totalVideos}</span>
                    <span className="block text-[9px] text-[#8C867E]">Vídeos</span>
                  </div>
                </div>
              </div>

              {/* Status / Open Action */}
              <div className="pt-2 border-t border-[#F0EDE6]">
                {!isOpened ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-[#8C867E] text-center">
                      Esta cápsula está selada para o futuro.
                    </p>
                    <button
                      id={`btn-open-capsule-${capsule.id}`}
                      type="button"
                      onClick={() => setOpenedCapsuleId(capsule.id)}
                      className="w-full py-2.5 rounded-2xl text-xs font-semibold bg-[#4A6741] hover:bg-[#3D5235] text-white transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#4A6741]/20 active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visualizar conteúdo</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpenedCapsuleId(null)}
                    className="w-full py-2 rounded-2xl text-xs text-[#8C867E] hover:bg-[#F8F6F2] transition-colors"
                  >
                    Fechar cofre
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Opened Vault Contents Drawer */}
      <AnimatePresence>
        {openedCapsuleId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-6 bg-white border border-[#F0EDE6] rounded-[32px] space-y-4 shadow-sm"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EDE6]">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="font-serif text-lg text-[#3D4B38]">
                  Itens guardados nesta cápsula
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setOpenedCapsuleId(null)}
                className="text-xs text-[#8C867E] hover:text-[#3D4B38] font-medium"
              >
                Ocultar
              </button>
            </div>

            {/* List memories in this capsule */}
            {(() => {
              const cap = capsules.find((c) => c.id === openedCapsuleId);
              if (!cap || (cap.memories.length === 0 && cap.letters.length === 0)) {
                return (
                  <p className="text-xs text-[#8C867E] py-4 text-center">
                    Ainda não há lembranças vinculadas a esta idade. Ao criar uma memória ou carta, ative &ldquo;Guardar para o futuro&rdquo;.
                  </p>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cap.memories.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => onSelectMemory(m)}
                      className="p-3.5 bg-[#FDFBF7] border border-[#F0EDE6] rounded-2xl cursor-pointer hover:border-[#A3B18A] transition-all flex items-center justify-between group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#4A6741] font-semibold uppercase tracking-wider">Memória</span>
                          {m.videos && m.videos.length > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] bg-[#4A6741]/10 text-[#4A6741] px-1.5 py-0.5 rounded font-medium">
                              <Video className="w-2.5 h-2.5" />
                              <span>{m.videos.length} vídeo</span>
                            </span>
                          )}
                        </div>
                        <h4 className="font-serif text-sm text-[#4A443F] truncate group-hover:text-[#4A6741] transition-colors">{m.title}</h4>
                        <span className="text-[10px] text-[#8C867E]">{m.calculatedAge}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8C867E] shrink-0" />
                    </div>
                  ))}

                  {cap.letters.map((l) => (
                    <div
                      key={l.id}
                      className="p-3.5 bg-[#FDFBF7] border border-[#F0EDE6] rounded-2xl flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] text-[#8C6D1F] font-semibold uppercase tracking-wider">Carta</span>
                        <h4 className="font-serif text-sm text-[#4A443F] truncate">{l.title}</h4>
                        <span className="text-[10px] text-[#8C867E]">{l.calculatedAge}</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
