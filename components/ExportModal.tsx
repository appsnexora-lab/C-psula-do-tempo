'use client';

import React, { useState } from 'react';
import { StorageData } from '@/types';
import { Download, Upload, AlertCircle, X, Printer } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  storageData: StorageData;
  onImportBackup: (data: StorageData) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  storageData,
  onImportBackup,
}) => {
  const [importError, setImportError] = useState('');

  if (!isOpen) return null;

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(storageData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `para-voce-backup-${storageData.childProfile.name.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.childProfile && parsed.memories) {
          onImportBackup(parsed);
          alert('Backup restaurado com sucesso!');
          onClose();
        } else {
          setImportError('O arquivo selecionado não é um backup válido do Para Você.');
        }
      } catch (err) {
        setImportError('Erro ao ler o arquivo JSON de backup.');
      }
    };
    reader.readAsText(file);
  };

  const handlePrintStoryBook = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const memoriesHtml = storageData.memories
      .filter((m) => !m.isDeleted)
      .map(
        (m) => `
        <div style="margin-bottom: 40px; page-break-inside: avoid; border-bottom: 1px solid #E5E1D8; padding-bottom: 20px;">
          <h2 style="font-family: Georgia, serif; font-size: 20px; color: #3D4B38; margin-bottom: 4px;">${m.title}</h2>
          <p style="font-size: 12px; color: #8C867E; margin-bottom: 16px;">${m.date} • ${m.calculatedAge} ${m.location ? '• ' + m.location : ''}</p>
          ${
            m.photos && m.photos[0] && m.photos[0].url && m.photos[0].url.trim() !== ''
              ? `<img src="${m.photos[0].url}" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 16px;" />`
              : ''
          }
          <p style="font-family: Georgia, serif; font-size: 15px; line-height: 1.7; color: #4A443F; white-space: pre-line;">${m.content}</p>
        </div>
      `
      )
      .join('');

    const lettersHtml = storageData.letters
      .filter((l) => !l.isDeleted)
      .map(
        (l) => `
        <div style="margin-bottom: 40px; page-break-inside: avoid; border: 1px solid #F0EDE6; border-radius: 12px; padding: 24px; background: #FDFCF9;">
          <span style="font-size: 11px; text-transform: uppercase; color: #8C6D1F; letter-spacing: 1px;">Carta para Você</span>
          <h2 style="font-family: Georgia, serif; font-size: 20px; color: #3D4B38; margin-top: 6px; margin-bottom: 4px;">${l.title}</h2>
          <p style="font-size: 12px; color: #8C867E; margin-bottom: 16px;">Escrita em ${l.date} (${l.calculatedAge})</p>
          <p style="font-family: Georgia, serif; font-size: 15px; line-height: 1.7; color: #4A443F; white-space: pre-line;">${l.content}</p>
        </div>
      `
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Para Você — Diário de Memórias de ${storageData.childProfile.name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #4A443F; background: #FDFCF9; }
            h1 { font-family: Georgia, serif; font-size: 28px; text-align: center; margin-bottom: 4px; color: #3D4B38; }
            .subtitle { text-align: center; color: #8C867E; font-size: 14px; font-style: italic; margin-bottom: 40px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Para Você, ${storageData.childProfile.name}</h1>
          <p class="subtitle">“Tudo aquilo que eu não quero esquecer, estou guardando para você.”<br/>Escrito por ${storageData.authorProfile.name}</p>
          <h3 style="font-family: Georgia, serif; border-bottom: 2px solid #4A6741; padding-bottom: 8px; margin-bottom: 24px; color: #3D4B38;">Memórias Registradas</h3>
          ${memoriesHtml}
          <h3 style="font-family: Georgia, serif; border-bottom: 2px solid #4A6741; padding-bottom: 8px; margin-top: 40px; margin-bottom: 24px; color: #3D4B38;">Cartas do Futuro</h3>
          ${lettersHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const totalActiveMemories = storageData.memories.filter((m) => !m.isDeleted).length;
  const totalActiveLetters = storageData.letters.filter((l) => !l.isDeleted).length;

  return (
    <div
      id="export-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
    >
      <div className="bg-[#FDFCF9] border border-[#F0EDE6] rounded-[32px] max-w-md w-full shadow-2xl overflow-hidden my-auto">
        <div className="px-6 py-4 border-b border-[#F0EDE6] flex items-center justify-between bg-white/80">
          <div>
            <span className="text-[10px] font-serif uppercase tracking-widest text-[#8C867E] font-bold block mb-0.5">Backup & Exportação</span>
            <h3 className="font-serif text-lg text-[#3D4B38] font-normal">Exportar minha história</h3>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-[#8C867E] hover:text-[#3D4B38] hover:bg-[#F8F6F2] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-white p-4.5 rounded-2xl border border-[#F0EDE6] space-y-2 shadow-2xs">
            <span className="text-xs font-semibold text-[#4A443F] block">Resumo dos seus dados salvos</span>
            <div className="grid grid-cols-2 gap-2 text-xs text-[#8C867E]">
              <div>• {totalActiveMemories} memórias ativas</div>
              <div>• {totalActiveLetters} cartas escritas</div>
              <div>• Perfil de {storageData.childProfile.name}</div>
              <div>• {storageData.milestones.length} marcos listados</div>
            </div>
          </div>

          {/* Action 1: Download JSON */}
          <button
            type="button"
            onClick={handleDownloadJson}
            className="w-full p-4.5 rounded-2xl bg-white border border-[#F0EDE6] hover:border-[#A3B18A] hover:shadow-xs transition-all flex items-center justify-between group text-left shadow-2xs"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#A3B18A]/15 text-[#4A6741] flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#4A443F] block group-hover:text-[#4A6741]">
                  Baixar arquivo de backup (.json)
                </span>
                <span className="text-[10px] text-[#8C867E]">
                  Guarde com segurança em seu computador ou nuvem
                </span>
              </div>
            </div>
          </button>

          {/* Action 2: Print Book */}
          <button
            type="button"
            onClick={handlePrintStoryBook}
            className="w-full p-4.5 rounded-2xl bg-white border border-[#F0EDE6] hover:border-[#A3B18A] hover:shadow-xs transition-all flex items-center justify-between group text-left shadow-2xs"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#4A443F] block group-hover:text-[#4A6741]">
                  Gerar livro impresso / PDF
                </span>
                <span className="text-[10px] text-[#8C867E]">
                  Formatação editorial pronta para impressão
                </span>
              </div>
            </div>
          </button>

          {/* Action 3: Restore JSON */}
          <div className="pt-2 border-t border-[#F0EDE6]">
            <label className="cursor-pointer w-full p-4.5 rounded-2xl bg-white border border-dashed border-[#E5E1D8] hover:border-[#4A6741] transition-all flex items-center justify-between group shadow-2xs">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#F2F0EB] text-[#4A443F] flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#4A443F] block group-hover:text-[#4A6741]">
                    Restaurar backup JSON
                  </span>
                  <span className="text-[10px] text-[#8C867E]">
                    Importar arquivo criado anteriormente
                  </span>
                </div>
              </div>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>

            {importError && (
              <p className="text-xs text-[#B83A3A] mt-2 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{importError}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
