'use client';

import React, { useState, useMemo } from 'react';
import { StorageData, Memory, Letter } from '@/types';
import {
  Download,
  Upload,
  AlertCircle,
  X,
  Printer,
  FileText,
  CheckSquare,
  Square,
  Search,
  BookOpen,
  Mail,
  Sparkles,
  ChevronRight,
  Heart,
  Calendar,
  Check,
} from 'lucide-react';
import { formatDatePortuguese } from '@/lib/dateUtils';
import { motion, AnimatePresence } from 'motion/react';

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
  const [activeTab, setActiveTab] = useState<'backup' | 'pdf'>('pdf');
  const [importError, setImportError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const activeMemories = useMemo(
    () => storageData.memories.filter((m) => !m.isDeleted),
    [storageData.memories]
  );
  const activeLetters = useMemo(
    () => storageData.letters.filter((l) => !l.isDeleted),
    [storageData.letters]
  );

  // Selected memory & letter IDs for PDF
  const [selectedMemoryIds, setSelectedMemoryIds] = useState<Set<string>>(() => {
    return new Set(storageData.memories.filter((m) => !m.isDeleted).map((m) => m.id));
  });

  const [selectedLetterIds, setSelectedLetterIds] = useState<Set<string>>(() => {
    return new Set(storageData.letters.filter((l) => !l.isDeleted).map((l) => l.id));
  });

  // PDF Configuration options
  const [includeCover, setIncludeCover] = useState(true);
  const [includeLetters, setIncludeLetters] = useState(true);
  const [includeMilestones, setIncludeMilestones] = useState(false);
  const [customDedication, setCustomDedication] = useState(
    '“Tudo aquilo que eu não quero esquecer, estou guardando com todo amor para você.”'
  );
  const [bookLayout, setBookLayout] = useState<'classic' | 'modern' | 'minimal'>('classic');

  if (!isOpen) return null;

  const filteredMemories = activeMemories.filter((m) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(query) ||
      m.content.toLowerCase().includes(query) ||
      (m.location && m.location.toLowerCase().includes(query)) ||
      (m.firstTimeCategory && m.firstTimeCategory.toLowerCase().includes(query))
    );
  });

  const toggleMemory = (id: string) => {
    setSelectedMemoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleLetter = (id: string) => {
    setSelectedLetterIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllMemories = () => {
    setSelectedMemoryIds(new Set(activeMemories.map((m) => m.id)));
  };

  const deselectAllMemories = () => {
    setSelectedMemoryIds(new Set());
  };

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
      } catch {
        setImportError('Erro ao ler o arquivo JSON de backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleGeneratePdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita popups no navegador para visualizar e salvar o PDF.');
      return;
    }

    const selectedMemoriesList = activeMemories
      .filter((m) => selectedMemoryIds.has(m.id))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const selectedLettersList = includeLetters
      ? activeLetters
          .filter((l) => selectedLetterIds.has(l.id))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      : [];

    const memoriesHtml = selectedMemoriesList
      .map(
        (m, idx) => `
        <article class="memory-card">
          <div class="memory-header">
            <span class="memory-number">#${idx + 1}</span>
            <div class="memory-meta">
              <h2 class="memory-title">${m.title}</h2>
              <div class="memory-date-tag">
                <span>${formatDatePortuguese(m.date)}</span>
                ${m.calculatedAge ? `<span>• ${m.calculatedAge}</span>` : ''}
                ${m.location ? `<span>• 📍 ${m.location}</span>` : ''}
                ${m.authorName ? `<span>• ✍️ ${m.authorName}</span>` : ''}
              </div>
            </div>
          </div>

          ${
            m.photos && m.photos.length > 0 && m.photos[0].url
              ? `<div class="memory-photos-grid">
                  ${m.photos
                    .slice(0, 3)
                    .map(
                      (p) =>
                        `<div class="photo-wrapper"><img src="${p.url}" alt="Foto de memória" class="memory-img" />${
                          p.caption ? `<div class="photo-caption">${p.caption}</div>` : ''
                        }</div>`
                    )
                    .join('')}
                 </div>`
              : ''
          }

          <div class="memory-body">
            <p>${m.content.replace(/\n/g, '<br/>')}</p>
          </div>

          ${
            m.childQuote
              ? `<div class="child-quote-box">
                  <span class="quote-mark">“</span>
                  <p class="quote-text">${m.childQuote}</p>
                  <span class="quote-author">— Palavras de ${storageData.childProfile.name}</span>
                </div>`
              : ''
          }

          ${
            m.tags && m.tags.length > 0
              ? `<div class="memory-tags">${m.tags.map((t) => `<span class="tag">#${t}</span>`).join(' ')}</div>`
              : ''
          }
        </article>
      `
      )
      .join('');

    const lettersHtml = selectedLettersList
      .map(
        (l, idx) => `
        <article class="letter-card">
          <div class="letter-badge">Carta #${idx + 1}</div>
          <h2 class="letter-title">${l.title}</h2>
          <div class="letter-meta">
            <span>Escrita em ${formatDatePortuguese(l.date)}</span>
            ${l.calculatedAge ? `<span>• Idade: ${l.calculatedAge}</span>` : ''}
            ${l.authorName ? `<span>• Por ${l.authorName}</span>` : ''}
            ${l.unlockDate ? `<span>• Para ler em: ${formatDatePortuguese(l.unlockDate)}</span>` : ''}
          </div>
          <div class="letter-body">
            <p>${l.content.replace(/\n/g, '<br/>')}</p>
          </div>
          <div class="letter-signature">
            <p>Com todo meu amor,</p>
            <strong>${l.authorName || storageData.authorProfile.name}</strong>
          </div>
        </article>
      `
      )
      .join('');

    const milestonesHtml =
      includeMilestones && storageData.milestones.length > 0
        ? `
        <section class="milestones-section">
          <h2 class="section-heading">Marcos do Desenvolvimento</h2>
          <div class="milestones-grid">
            ${storageData.milestones
              .map(
                (ms) => `
              <div class="milestone-item ${ms.achievedDate ? 'achieved' : ''}">
                <div class="milestone-icon">${ms.achievedDate ? '✓' : '○'}</div>
                <div class="milestone-info">
                  <strong>${ms.title}</strong>
                  <span>${ms.category}</span>
                  ${ms.achievedDate ? `<time>Alcançado em: ${formatDatePortuguese(ms.achievedDate)}</time>` : ''}
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </section>
      `
        : '';

    const coverHtml = includeCover
      ? `
      <section class="cover-page">
        <div class="cover-border">
          <div class="cover-header">
            <span class="cover-eyebrow">LIVRO DE MEMÓRIAS & CÁPSULA DO TEMPO</span>
            <h1 class="cover-title">Para Você,</h1>
            <h2 class="cover-name">${storageData.childProfile.name}</h2>
          </div>

          ${
            storageData.childProfile.profilePhoto
              ? `<div class="cover-photo-wrapper">
                  <img src="${storageData.childProfile.profilePhoto}" alt="${storageData.childProfile.name}" class="cover-photo" />
                </div>`
              : ''
          }

          <div class="cover-dedication">
            <p class="dedication-text">${customDedication}</p>
          </div>

          <div class="cover-footer">
            <div class="cover-meta">
              ${storageData.childProfile.birthDate ? `<p>Nascimento: <strong>${formatDatePortuguese(storageData.childProfile.birthDate)}</strong></p>` : ''}
              <p>Autoria: <strong>${storageData.authorProfile.name}</strong></p>
              <p>Compilação gerada em: <strong>${formatDatePortuguese(new Date().toISOString().slice(0, 10))}</strong></p>
            </div>
            <div class="cover-counts">
              <span>${selectedMemoriesList.length} memórias registradas</span>
              ${selectedLettersList.length > 0 ? `<span>• ${selectedLettersList.length} cartas de amor</span>` : ''}
            </div>
          </div>
        </div>
      </section>
    `
      : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <title>Livro de Memórias — ${storageData.childProfile.name} (Para Você)</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');

            @page {
              size: A4;
              margin: 18mm 16mm 18mm 16mm;
            }

            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            body {
              font-family: 'Lora', Georgia, serif;
              color: #2C2825;
              background-color: #FFFFFF;
              line-height: 1.7;
              margin: 0;
              padding: 0;
            }

            /* Cover Page */
            .cover-page {
              page-break-after: always;
              height: 96vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
              padding: 20px;
            }

            .cover-border {
              border: 2px solid #D4AF37;
              outline: 1px solid #E5E1D8;
              outline-offset: 4px;
              height: 100%;
              padding: 40px 30px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              text-align: center;
              background: radial-gradient(circle at center, #FFFCF9 0%, #FAF6F0 100%);
              border-radius: 4px;
            }

            .cover-eyebrow {
              font-family: 'Plus Jakarta Sans', sans-serif;
              font-size: 10px;
              letter-spacing: 3px;
              color: #8C6D1F;
              font-weight: 600;
              text-transform: uppercase;
              display: block;
              margin-bottom: 12px;
            }

            .cover-title {
              font-family: 'Cinzel', serif;
              font-size: 32px;
              color: #3D4B38;
              margin: 0 0 4px 0;
              font-weight: 500;
              letter-spacing: 1px;
            }

            .cover-name {
              font-family: 'Cinzel', serif;
              font-size: 42px;
              color: #2A3626;
              margin: 0 0 24px 0;
              font-weight: 700;
              letter-spacing: 2px;
            }

            .cover-photo-wrapper {
              width: 170px;
              height: 170px;
              border-radius: 50%;
              overflow: hidden;
              border: 4px solid #D4AF37;
              box-shadow: 0 8px 24px rgba(0,0,0,0.08);
              margin: 10px auto 20px;
            }

            .cover-photo {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            .cover-dedication {
              max-width: 480px;
              margin: 20px auto;
            }

            .dedication-text {
              font-size: 15px;
              font-style: italic;
              color: #5C554E;
              line-height: 1.8;
            }

            .cover-footer {
              width: 100%;
              border-top: 1px solid #E5E1D8;
              padding-top: 20px;
              font-family: 'Plus Jakarta Sans', sans-serif;
              font-size: 11px;
              color: #7A746E;
            }

            .cover-meta p {
              margin: 3px 0;
            }

            .cover-counts {
              margin-top: 8px;
              font-weight: 600;
              color: #4A6741;
            }

            /* Table of Contents / Heading */
            .section-heading {
              font-family: 'Cinzel', serif;
              font-size: 22px;
              color: #3D4B38;
              border-bottom: 2px solid #A3B18A;
              padding-bottom: 8px;
              margin: 30px 0 24px 0;
              page-break-after: avoid;
            }

            /* Memory Cards */
            .memory-card {
              page-break-inside: avoid;
              border: 1px solid #EFECE6;
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 28px;
              background-color: #FFFFFF;
              box-shadow: 0 2px 6px rgba(0,0,0,0.02);
            }

            .memory-header {
              display: flex;
              align-items: flex-start;
              gap: 14px;
              margin-bottom: 16px;
              border-bottom: 1px solid #F5F2EC;
              padding-bottom: 12px;
            }

            .memory-number {
              font-family: 'Cinzel', serif;
              font-size: 16px;
              font-weight: 700;
              color: #A3B18A;
              background: #F4F6F0;
              padding: 4px 10px;
              border-radius: 6px;
            }

            .memory-meta {
              flex: 1;
            }

            .memory-title {
              font-family: 'Lora', serif;
              font-size: 20px;
              color: #2D3A29;
              margin: 0 0 6px 0;
              font-weight: 600;
            }

            .memory-date-tag {
              font-family: 'Plus Jakarta Sans', sans-serif;
              font-size: 11px;
              color: #8C867E;
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }

            .memory-photos-grid {
              display: flex;
              gap: 12px;
              margin: 16px 0;
            }

            .photo-wrapper {
              flex: 1;
              max-width: 50%;
            }

            .memory-img {
              width: 100%;
              max-height: 220px;
              object-fit: cover;
              border-radius: 8px;
              border: 1px solid #E8E5DF;
            }

            .photo-caption {
              font-family: 'Plus Jakarta Sans', sans-serif;
              font-size: 10px;
              color: #8C867E;
              margin-top: 4px;
              text-align: center;
              font-style: italic;
            }

            .memory-body p {
              font-size: 14.5px;
              line-height: 1.8;
              color: #38332E;
              margin: 0;
            }

            .child-quote-box {
              margin-top: 16px;
              background: #FFF9F2;
              border-left: 3px solid #D4AF37;
              padding: 12px 16px;
              border-radius: 0 8px 8px 0;
            }

            .quote-text {
              font-size: 14px;
              font-style: italic;
              color: #7A5B18;
              margin: 0;
            }

            .quote-author {
              font-family: 'Plus Jakarta Sans', sans-serif;
              font-size: 10px;
              color: #A68032;
              font-weight: 600;
              display: block;
              margin-top: 4px;
            }

            .memory-tags {
              margin-top: 14px;
              font-family: 'Plus Jakarta Sans', sans-serif;
              font-size: 10px;
              color: #8C867E;
            }

            .tag {
              background: #F4F3EF;
              padding: 2px 8px;
              border-radius: 4px;
              margin-right: 4px;
            }

            /* Letters */
            .letter-card {
              page-break-inside: avoid;
              border: 1px solid #EADBCE;
              border-radius: 12px;
              padding: 28px;
              margin-bottom: 32px;
              background: #FDFBF7;
            }

            .letter-badge {
              font-family: 'Plus Jakarta Sans', sans-serif;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              color: #9C6A3B;
              font-weight: 700;
              margin-bottom: 6px;
            }

            .letter-title {
              font-family: 'Lora', serif;
              font-size: 22px;
              color: #3D2D1D;
              margin: 0 0 6px 0;
            }

            .letter-meta {
              font-family: 'Plus Jakarta Sans', sans-serif;
              font-size: 11px;
              color: #8C7B6B;
              margin-bottom: 18px;
              display: flex;
              gap: 8px;
            }

            .letter-body p {
              font-size: 15px;
              line-height: 1.85;
              color: #382C22;
              margin: 0 0 16px 0;
            }

            .letter-signature {
              margin-top: 24px;
              text-align: right;
              font-family: 'Lora', serif;
              font-style: italic;
              color: #5C4A3A;
            }

            /* Milestones */
            .milestones-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
              page-break-inside: avoid;
            }

            .milestone-item {
              border: 1px solid #EFECE6;
              padding: 10px 14px;
              border-radius: 8px;
              display: flex;
              gap: 10px;
              font-family: 'Plus Jakarta Sans', sans-serif;
              font-size: 11px;
            }

            .milestone-item.achieved {
              background: #F4F7F2;
              border-color: #D2E0CC;
            }

            .milestone-icon {
              font-weight: bold;
              color: #4A6741;
            }

            .milestone-info strong {
              display: block;
              color: #2D3A29;
            }

            .milestone-info span {
              color: #8C867E;
              font-size: 10px;
            }

            .milestone-info time {
              display: block;
              color: #4A6741;
              font-size: 10px;
              font-weight: 600;
              margin-top: 2px;
            }

            @media print {
              body {
                background: white;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="background: #2D3A29; color: white; padding: 12px 20px; font-family: sans-serif; font-size: 13px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 1000;">
            <span>📖 Pré-visualização do Livro PDF • Pronto para impressão ou download</span>
            <button onclick="window.print()" style="background: #D4AF37; color: #1E261C; border: none; padding: 8px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">
              🖨️ Salvar como PDF / Imprimir
            </button>
          </div>

          ${coverHtml}

          <div style="padding: 20px 0;">
            ${selectedMemoriesList.length > 0 ? `<h2 class="section-heading">Memórias da Infância (${selectedMemoriesList.length})</h2>${memoriesHtml}` : ''}
            
            ${selectedLettersList.length > 0 ? `<h2 class="section-heading" style="page-break-before: always;">Cartas para o Futuro (${selectedLettersList.length})</h2>${lettersHtml}` : ''}

            ${milestonesHtml}
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();

    // Trigger auto print dialog after styles load
    setTimeout(() => {
      printWindow.print();
    }, 600);
  };

  return (
    <div
      id="export-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto"
    >
      <div className="bg-[#FDFCF9] border border-[#F0EDE6] rounded-[28px] sm:rounded-[32px] max-w-2xl w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header with View Tabs */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#F0EDE6] flex items-center justify-between bg-white/90 shrink-0">
          <div>
            <span className="text-[10px] font-serif uppercase tracking-widest text-[#8C867E] font-bold block mb-0.5">
              Arquivo Físico & Backup
            </span>
            <h3 className="font-serif text-lg text-[#3D4B38] font-normal">
              {activeTab === 'pdf' ? 'Gerador de Livro PDF' : 'Backup & Restauração'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[#F2F0EB] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('pdf')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'pdf'
                    ? 'bg-white text-[#4A6741] shadow-2xs'
                    : 'text-[#8C867E] hover:text-[#4A443F]'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Gerar PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('backup')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'backup'
                    ? 'bg-white text-[#4A6741] shadow-2xs'
                    : 'text-[#8C867E] hover:text-[#4A443F]'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Backup JSON</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#8C867E] hover:text-[#3D4B38] hover:bg-[#F8F6F2] transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'pdf' ? (
            <div className="space-y-5">
              {/* PDF Settings & Customization Card */}
              <div className="bg-white p-4.5 rounded-2xl border border-[#F0EDE6] space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-xs font-semibold text-[#4A443F]">
                      Opções do Livro Impresso
                    </span>
                  </div>
                  <span className="text-[10px] text-[#4A6741] font-bold bg-[#A3B18A]/15 px-2 py-0.5 rounded-full">
                    A4 Editorial
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#F0EDE6] bg-[#FDFCF9] cursor-pointer hover:border-[#A3B18A] transition-all text-xs text-[#4A443F]">
                    <input
                      type="checkbox"
                      checked={includeCover}
                      onChange={(e) => setIncludeCover(e.target.checked)}
                      className="rounded text-[#4A6741] focus:ring-[#4A6741]"
                    />
                    <span className="font-medium">Capa personalizada</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#F0EDE6] bg-[#FDFCF9] cursor-pointer hover:border-[#A3B18A] transition-all text-xs text-[#4A443F]">
                    <input
                      type="checkbox"
                      checked={includeLetters}
                      onChange={(e) => setIncludeLetters(e.target.checked)}
                      className="rounded text-[#4A6741] focus:ring-[#4A6741]"
                    />
                    <span className="font-medium">Incluir cartas ({activeLetters.length})</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#F0EDE6] bg-[#FDFCF9] cursor-pointer hover:border-[#A3B18A] transition-all text-xs text-[#4A443F]">
                    <input
                      type="checkbox"
                      checked={includeMilestones}
                      onChange={(e) => setIncludeMilestones(e.target.checked)}
                      className="rounded text-[#4A6741] focus:ring-[#4A6741]"
                    />
                    <span className="font-medium">Marcos de idade</span>
                  </label>
                </div>

                {includeCover && (
                  <div className="pt-2 border-t border-[#F0EDE6]">
                    <label className="block text-[11px] font-semibold text-[#8C867E] mb-1">
                      Dedicatória da Capa
                    </label>
                    <textarea
                      value={customDedication}
                      onChange={(e) => setCustomDedication(e.target.value)}
                      rows={2}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#E5E1D8] bg-[#FAF9F5] focus:outline-none focus:border-[#4A6741] text-[#4A443F] font-serif resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Memory Selection List */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#4A6741]" />
                    <span className="text-xs font-semibold text-[#4A443F]">
                      Selecione as memórias para o PDF
                    </span>
                    <span className="text-[11px] font-bold text-[#4A6741] bg-[#4A6741]/10 px-2 py-0.5 rounded-full">
                      {selectedMemoryIds.size} de {activeMemories.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={selectAllMemories}
                      className="text-[#4A6741] hover:underline font-medium text-[11px]"
                    >
                      Selecionar todas
                    </button>
                    <span className="text-[#D4AF37]">•</span>
                    <button
                      type="button"
                      onClick={deselectAllMemories}
                      className="text-[#8C867E] hover:underline text-[11px]"
                    >
                      Limpar seleção
                    </button>
                  </div>
                </div>

                {/* Filter / Search input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-[#8C867E] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar por título, texto ou local..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-[#E5E1D8] bg-white focus:outline-none focus:border-[#4A6741]"
                  />
                </div>

                {/* List of memories with selection */}
                <div className="border border-[#F0EDE6] rounded-2xl bg-white max-h-56 overflow-y-auto divide-y divide-[#F0EDE6]">
                  {filteredMemories.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#8C867E]">
                      Nenhuma memória encontrada com os filtros atuais.
                    </div>
                  ) : (
                    filteredMemories.map((m) => {
                      const isSelected = selectedMemoryIds.has(m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => toggleMemory(m.id)}
                          className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#FAF8F5]' : 'hover:bg-[#FAF9F6]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="text-[#4A6741] shrink-0">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 fill-[#4A6741]/20" />
                              ) : (
                                <Square className="w-4 h-4 text-[#C2BEB6]" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4
                                className={`text-xs font-serif truncate ${
                                  isSelected
                                    ? 'text-[#2D3A29] font-medium'
                                    : 'text-[#8C867E]'
                                }`}
                              >
                                {m.title}
                              </h4>
                              <p className="text-[10px] text-[#8C867E] truncate">
                                {formatDatePortuguese(m.date)}{' '}
                                {m.calculatedAge ? `• ${m.calculatedAge}` : ''}
                                {m.photos && m.photos.length > 0
                                  ? ` • 📷 ${m.photos.length} foto(s)`
                                  : ''}
                              </p>
                            </div>
                          </div>

                          {m.isSpecial && (
                            <span className="text-[10px] bg-[#D4AF37]/15 text-[#8C6D1F] px-2 py-0.5 rounded-full font-medium shrink-0">
                              Especial
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Letter Selection if included */}
              {includeLetters && activeLetters.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#F0EDE6]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#8C6D1F]" />
                      <span className="text-xs font-semibold text-[#4A443F]">
                        Cartas do Futuro Selecionadas
                      </span>
                      <span className="text-[10px] font-bold text-[#8C6D1F] bg-[#D4AF37]/15 px-2 py-0.5 rounded-full">
                        {selectedLetterIds.size} de {activeLetters.length}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeLetters.map((l) => {
                      const isSelected = selectedLetterIds.has(l.id);
                      return (
                        <div
                          key={l.id}
                          onClick={() => toggleLetter(l.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center gap-2.5 transition-all ${
                            isSelected
                              ? 'bg-white border-[#D4AF37]/50 shadow-2xs'
                              : 'bg-[#FAF9F5] border-[#F0EDE6] opacity-70'
                          }`}
                        >
                          <div className="text-[#8C6D1F] shrink-0">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4" />
                            ) : (
                              <Square className="w-4 h-4 text-[#C2BEB6]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-serif block truncate font-medium text-[#4A443F]">
                              {l.title}
                            </span>
                            <span className="text-[10px] text-[#8C867E]">
                              {formatDatePortuguese(l.date)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Primary PDF Action Button */}
              <button
                type="button"
                onClick={handleGeneratePdf}
                disabled={selectedMemoryIds.size === 0 && selectedLetterIds.size === 0}
                className="w-full py-4 px-6 rounded-2xl bg-[#4A6741] hover:bg-[#3D5235] disabled:opacity-50 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-3 shadow-lg shadow-[#4A6741]/20 active:scale-[0.99] transition-all cursor-pointer"
              >
                <Printer className="w-5 h-5" />
                <span>
                  Gerar Livro & Salvar em PDF (
                  {selectedMemoryIds.size + (includeLetters ? selectedLetterIds.size : 0)}{' '}
                  itens)
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white p-4.5 rounded-2xl border border-[#F0EDE6] space-y-2 shadow-2xs">
                <span className="text-xs font-semibold text-[#4A443F] block">
                  Resumo dos seus dados salvos
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs text-[#8C867E]">
                  <div>• {activeMemories.length} memórias ativas</div>
                  <div>• {activeLetters.length} cartas escritas</div>
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
                <ChevronRight className="w-4 h-4 text-[#8C867E] group-hover:text-[#4A6741] group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Action 2: Restore JSON */}
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
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJson}
                    className="hidden"
                  />
                </label>

                {importError && (
                  <p className="text-xs text-[#B83A3A] mt-2 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{importError}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

