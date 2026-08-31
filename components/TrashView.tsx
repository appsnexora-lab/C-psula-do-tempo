'use client';

import React, { useState } from 'react';
import { Memory, Letter } from '@/types';
import { formatDatePortuguese } from '@/lib/dateUtils';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

interface TrashViewProps {
  deletedMemories: Memory[];
  deletedLetters: Letter[];
  onRestoreMemory: (id: string) => void;
  onPermanentDeleteMemory: (id: string) => void;
  onRestoreLetter: (id: string) => void;
  onPermanentDeleteLetter: (id: string) => void;
}

export const TrashView: React.FC<TrashViewProps> = ({
  deletedMemories,
  deletedLetters,
  onRestoreMemory,
  onPermanentDeleteMemory,
  onRestoreLetter,
  onPermanentDeleteLetter,
}) => {
  const [itemToPurge, setItemToPurge] = useState<{ id: string; type: 'memory' | 'letter'; title: string } | null>(null);

  const totalItems = deletedMemories.length + deletedLetters.length;

  const handleConfirmPurge = () => {
    if (!itemToPurge) return;
    if (itemToPurge.type === 'memory') {
      onPermanentDeleteMemory(itemToPurge.id);
    } else {
      onPermanentDeleteLetter(itemToPurge.id);
    }
    setItemToPurge(null);
  };

  return (
    <div id="trash-view-container" className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-[10px] font-serif uppercase tracking-widest text-[#B83A3A] font-bold block mb-0.5">
          Itens Excluídos
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl text-[#3D4B38] font-normal">Lixeira</h1>
        <p className="text-xs text-[#8C867E] mt-1 font-serif italic max-w-lg">
          Lembranças e cartas excluídas ficam guardadas aqui temporariamente antes de serem apagadas permanentemente.
        </p>
      </div>

      {totalItems > 0 ? (
        <div className="space-y-4">
          {/* Deleted Memories */}
          {deletedMemories.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-[#8C867E] uppercase tracking-wider block">
                Memórias ({deletedMemories.length})
              </span>
              <div className="space-y-2">
                {deletedMemories.map((mem) => (
                  <div
                    key={mem.id}
                    className="p-4 bg-white border border-[#F0EDE6] rounded-2xl flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-serif text-sm text-[#4A443F] font-semibold truncate">{mem.title}</h4>
                      <p className="text-xs text-[#8C867E]">{formatDatePortuguese(mem.date, { short: true })} • {mem.calculatedAge}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onRestoreMemory(mem.id)}
                        className="px-3.5 py-1.5 rounded-2xl text-xs font-semibold bg-[#A3B18A]/15 text-[#4A6741] hover:bg-[#A3B18A]/25 inline-flex items-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restaurar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setItemToPurge({ id: mem.id, type: 'memory', title: mem.title })}
                        className="p-2 rounded-xl text-[#B83A3A] hover:bg-[#FDECEC] transition-colors"
                        title="Excluir permanentemente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deleted Letters */}
          {deletedLetters.length > 0 && (
            <div className="space-y-2.5 pt-3">
              <span className="text-[10px] font-bold text-[#8C867E] uppercase tracking-wider block">
                Cartas ({deletedLetters.length})
              </span>
              <div className="space-y-2">
                {deletedLetters.map((letItem) => (
                  <div
                    key={letItem.id}
                    className="p-4 bg-white border border-[#F0EDE6] rounded-2xl flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-serif text-sm text-[#4A443F] font-semibold truncate">{letItem.title}</h4>
                      <p className="text-xs text-[#8C867E]">{formatDatePortuguese(letItem.date, { short: true })}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onRestoreLetter(letItem.id)}
                        className="px-3.5 py-1.5 rounded-2xl text-xs font-semibold bg-[#A3B18A]/15 text-[#4A6741] hover:bg-[#A3B18A]/25 inline-flex items-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restaurar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setItemToPurge({ id: letItem.id, type: 'letter', title: letItem.title })}
                        className="p-2 rounded-xl text-[#B83A3A] hover:bg-[#FDECEC] transition-colors"
                        title="Excluir permanentemente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white border border-[#F0EDE6] rounded-[32px] space-y-2 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-[#FDFCF9] text-[#8C867E] flex items-center justify-center mx-auto mb-2 border border-[#F0EDE6]">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg text-[#3D4B38]">A lixeira está vazia.</h3>
          <p className="text-xs text-[#8C867E]">Nenhuma memória ou carta foi excluída.</p>
        </div>
      )}

      {/* Permanent Delete Modal Confirmation */}
      {itemToPurge && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
          <div className="bg-[#FDFCF9] border border-[#F0EDE6] rounded-[32px] p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-[#B83A3A]/10 text-[#B83A3A] flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h4 className="font-serif text-lg text-[#3D4B38] font-normal mb-1">
              Excluir permanentemente?
            </h4>
            <p className="text-xs text-[#8C867E] mb-5">
              Esta ação não pode ser desfeita. O item &ldquo;{itemToPurge.title}&rdquo; será apagado em definitivo.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setItemToPurge(null)}
                className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-[#8C867E] hover:bg-[#F8F6F2] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPurge}
                className="px-5 py-2.5 rounded-2xl text-xs font-semibold bg-[#B83A3A] text-white hover:bg-[#9B2F2F] transition-colors shadow-md shadow-[#B83A3A]/20"
              >
                Apagar de vez
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
