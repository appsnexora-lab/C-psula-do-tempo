'use client';

import React, { useState, useMemo } from 'react';
import { ChildProfile, AuthorProfile, AuthorRelation } from '@/types';
import { fileToDataUrl } from '@/services/mediaService';
import { calculateAgePortuguese, getTodayString, parseDate, formatDatePortuguese } from '@/lib/dateUtils';
import { 
  X, 
  Camera, 
  Check, 
  Calendar, 
  Sparkles, 
  Heart, 
  User, 
  Plus, 
  Trash2, 
  Users,
  Star
} from 'lucide-react';
import Image from 'next/image';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  childProfile: ChildProfile;
  authorProfile: AuthorProfile;
  authors?: AuthorProfile[];
  onSave: (child: ChildProfile, author: AuthorProfile, authors?: AuthorProfile[]) => void;
}

const RELATIONS: AuthorRelation[] = ['Pai', 'Mãe', 'Avô', 'Avó', 'Madrinha', 'Padrinho', 'Outro'];

const AGE_PRESETS = [
  { label: 'Recém-nascida (0m)', years: 0, months: 0 },
  { label: '6 meses', years: 0, months: 6 },
  { label: '1 ano', years: 1, months: 0 },
  { label: '2 anos', years: 2, months: 0 },
  { label: '3 anos', years: 3, months: 0 },
  { label: '4 anos', years: 4, months: 0 },
  { label: '5 anos', years: 5, months: 0 },
  { label: '6 anos', years: 6, months: 0 },
  { label: '7 anos', years: 7, months: 0 },
  { label: '8 anos', years: 8, months: 0 },
  { label: '10 anos', years: 10, months: 0 },
  { label: '12 anos', years: 12, months: 0 },
  { label: '15 anos', years: 15, months: 0 },
];

function calculateBirthDateFromAge(years: number, months: number): string {
  const today = new Date();
  const targetDate = new Date(today.getFullYear() - years, today.getMonth() - months, today.getDate());
  const y = targetDate.getFullYear();
  const m = String(targetDate.getMonth() + 1).padStart(2, '0');
  const d = String(targetDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const ProfileEditForm: React.FC<{
  childProfile: ChildProfile;
  authorProfile: AuthorProfile;
  authors?: AuthorProfile[];
  onClose: () => void;
  onSave: (child: ChildProfile, author: AuthorProfile, authors?: AuthorProfile[]) => void;
}> = ({ childProfile, authorProfile, authors: initialAuthorsList, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState<'child' | 'parents'>('child');

  // Child State
  const [childName, setChildName] = useState(childProfile.name || 'Olívia');
  const [birthDate, setBirthDate] = useState(childProfile.birthDate || '2023-05-14');
  const [childPhoto, setChildPhoto] = useState(childProfile.profilePhoto || '');
  const [nickname, setNickname] = useState(childProfile.nickname || '');
  const [notes, setNotes] = useState(childProfile.notes || '');
  const [ageMode, setAgeMode] = useState<'date' | 'quick'>('date');

  // Authors List State (Papai, Mamãe, etc.)
  const [authorsList, setAuthorsList] = useState<AuthorProfile[]>(() => {
    if (initialAuthorsList && initialAuthorsList.length > 0) {
      return initialAuthorsList;
    }
    return [
      {
        id: authorProfile.id || 'author-1',
        name: authorProfile.name || 'Papai',
        relation: authorProfile.relation || 'Pai',
        photo: authorProfile.photo,
        isPrimary: true,
      },
      {
        id: 'author-2',
        name: 'Mamãe',
        relation: 'Mãe',
        photo: undefined,
        isPrimary: false,
      },
    ];
  });

  // Parse current child age
  const currentAgeDetails = useMemo(() => {
    if (!birthDate) return { years: 0, months: 0, formatted: '' };
    const birth = parseDate(birthDate);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    if (today.getDate() < birth.getDate()) {
      months -= 1;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    years = Math.max(0, years);
    months = Math.max(0, months);
    return {
      years,
      months,
      formatted: calculateAgePortuguese(birthDate),
    };
  }, [birthDate]);

  const [selectedYears, setSelectedYears] = useState(currentAgeDetails.years);
  const [selectedMonths, setSelectedMonths] = useState(currentAgeDetails.months);

  const handleChildPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const url = await fileToDataUrl(e.target.files[0]);
    setChildPhoto(url);
  };

  const handleAuthorPhotoUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const url = await fileToDataUrl(e.target.files[0]);
    setAuthorsList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], photo: url };
      return updated;
    });
  };

  const handleApplyQuickAge = (years: number, months: number) => {
    setSelectedYears(years);
    setSelectedMonths(months);
    const newBirthDate = calculateBirthDateFromAge(years, months);
    setBirthDate(newBirthDate);
  };

  const handleAddAuthor = (defaultRelation: AuthorRelation = 'Mãe', defaultName = 'Mamãe') => {
    const newAuthor: AuthorProfile = {
      id: `author-${Date.now()}`,
      name: defaultName,
      relation: defaultRelation,
      isPrimary: false,
    };
    setAuthorsList((prev) => [...prev, newAuthor]);
  };

  const handleRemoveAuthor = (index: number) => {
    if (authorsList.length <= 1) return; // Keep at least one author
    setAuthorsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateAuthor = (index: number, field: keyof AuthorProfile, value: any) => {
    setAuthorsList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSetPrimaryAuthor = (index: number) => {
    setAuthorsList((prev) =>
      prev.map((a, i) => ({
        ...a,
        isPrimary: i === index,
      }))
    );
  };

  const hasMomProfile = authorsList.some((a) => a.relation === 'Mãe' || a.name.toLowerCase().includes('mãe') || a.name.toLowerCase().includes('mamãe'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const primaryAuthor = authorsList.find((a) => a.isPrimary) || authorsList[0] || authorProfile;

    onSave(
      {
        name: childName.trim() || 'Olívia',
        birthDate: birthDate || getTodayString(),
        profilePhoto: childPhoto || undefined,
        nickname: nickname.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      primaryAuthor,
      authorsList
    );
    onClose();
  };

  return (
    <div
      id="profile-edit-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
    >
      <div className="bg-[#FDFCF9] border border-[#F0EDE6] rounded-[32px] max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#F0EDE6] flex items-center justify-between bg-white/80 backdrop-blur-xs">
          <div>
            <span className="text-[10px] font-serif uppercase tracking-widest text-[#8C867E] font-bold block mb-0.5">
              Configurações de Perfis
            </span>
            <h2 className="font-serif text-xl text-[#3D4B38] font-normal">
              Olívia, Papai & Mamãe
            </h2>
          </div>

          <button
            id="btn-close-profile-modal"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#8C867E] hover:text-[#3D4B38] hover:bg-[#F8F6F2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#F0EDE6] bg-[#F8F6F2] px-6 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('child')}
            className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'child'
                ? 'border-[#4A6741] text-[#3D4B38]'
                : 'border-transparent text-[#8C867E] hover:text-[#4A443F]'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-[#4A6741]" />
            <span>Perfil da Criança ({childName || 'Olívia'})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('parents')}
            className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'parents'
                ? 'border-[#4A6741] text-[#3D4B38]'
                : 'border-transparent text-[#8C867E] hover:text-[#4A443F]'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#4A6741]" />
            <span>Pais & Autores ({authorsList.length})</span>
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: CHILD PROFILE (Name, Age, Photo, Notes) */}
          {activeTab === 'child' && (
            <div className="space-y-5">
              {/* Photo Avatar & Upload */}
              <div className="flex items-center gap-4 bg-white p-3.5 rounded-2xl border border-[#F0EDE6]">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-[#E5E1D8] border-2 border-[#D4AF37]/30 shrink-0">
                  {childPhoto && childPhoto.trim() !== '' ? (
                    <Image
                      src={childPhoto}
                      alt={childName}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-serif text-[#4A6741] bg-[#A3B18A]/20 font-bold">
                      {childName ? childName[0] : 'O'}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs bg-[#4A6741] text-white hover:bg-[#3D5235] font-semibold transition-colors shadow-2xs">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{childPhoto ? 'Alterar foto' : 'Adicionar foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleChildPhotoUpload}
                        className="hidden"
                      />
                    </label>

                    {childPhoto && (
                      <button
                        type="button"
                        onClick={() => setChildPhoto('')}
                        className="p-1.5 rounded-xl text-[#8C867E] hover:text-[#B83A3A] hover:bg-[#FDECEC] transition-colors"
                        title="Remover foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#8C867E]">
                    Aparece no topo da página e na árvore da vida.
                  </p>
                </div>
              </div>

              {/* Child Name Field */}
              <div>
                <label
                  htmlFor="input-child-name"
                  className="block text-xs font-semibold text-[#4A443F] mb-1"
                >
                  Nome da Criança <span className="text-[#B83A3A]">*</span>
                </label>
                <input
                  id="input-child-name"
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="Ex: Olívia"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#F0EDE6] rounded-xl text-sm font-medium text-[#4A443F] focus:outline-none focus:border-[#4A6741] transition-colors"
                  required
                />
              </div>

              {/* Nickname */}
              <div>
                <label
                  htmlFor="input-child-nickname"
                  className="block text-xs font-semibold text-[#4A443F] mb-1"
                >
                  Apelido carinhoso <span className="text-[#8C867E] font-normal">(opcional)</span>
                </label>
                <input
                  id="input-child-nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Ex: Lili, Princesa, Pequena..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#F0EDE6] rounded-xl text-xs text-[#4A443F] focus:outline-none focus:border-[#4A6741] transition-colors"
                />
              </div>

              {/* AGE & BIRTH DATE SECTION */}
              <div className="bg-[#F8F6F2] border border-[#EBE7DF] rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-[#3D4B38] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#4A6741]" />
                      <span>Idade e Data de Nascimento</span>
                    </label>
                    <p className="text-[10px] text-[#8C867E]">
                      Usada para calcular a idade automática em todas as memórias.
                    </p>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex items-center bg-white border border-[#F0EDE6] rounded-xl p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setAgeMode('date')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                        ageMode === 'date'
                          ? 'bg-[#4A6741] text-white shadow-2xs'
                          : 'text-[#8C867E] hover:text-[#3D4B38]'
                      }`}
                    >
                      Por Data
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgeMode('quick')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                        ageMode === 'quick'
                          ? 'bg-[#4A6741] text-white shadow-2xs'
                          : 'text-[#8C867E] hover:text-[#3D4B38]'
                      }`}
                    >
                      Por Idade
                    </button>
                  </div>
                </div>

                {/* Real-time Age Banner */}
                <div className="bg-white border border-[#F0EDE6] rounded-xl p-3 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/15 text-[#8C6D1F] flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#8C867E] font-bold block">
                        Idade atual de {childName || 'sua filha'}
                      </span>
                      <span className="font-serif text-sm font-semibold text-[#3D4B38]">
                        {currentAgeDetails.formatted || 'Calculando...'}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-[#8C867E] text-right font-mono">
                    {birthDate ? formatDatePortuguese(birthDate, { short: true }) : ''}
                  </span>
                </div>

                {/* Mode A: Exact Date Picker */}
                {ageMode === 'date' ? (
                  <div>
                    <label
                      htmlFor="input-birth-date"
                      className="block text-xs font-medium text-[#4A443F] mb-1"
                    >
                      Selecione a data de nascimento exata:
                    </label>
                    <input
                      id="input-birth-date"
                      type="date"
                      value={birthDate}
                      max={getTodayString()}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#F0EDE6] rounded-xl text-xs font-medium text-[#4A443F] focus:outline-none focus:border-[#4A6741] shadow-2xs"
                      required
                    />
                  </div>
                ) : (
                  /* Mode B: Direct Age (Years & Months Steppers / Presets) */
                  <div className="space-y-3">
                    <label className="block text-xs font-medium text-[#4A443F]">
                      Definir idade atual aproximada:
                    </label>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <span className="text-[10px] text-[#8C867E] font-semibold block mb-1">
                          Anos
                        </span>
                        <select
                          value={selectedYears}
                          onChange={(e) => {
                            const y = Number(e.target.value);
                            handleApplyQuickAge(y, selectedMonths);
                          }}
                          className="w-full px-3 py-2 bg-white border border-[#F0EDE6] rounded-xl text-xs text-[#4A443F] font-semibold focus:outline-none focus:border-[#4A6741]"
                        >
                          {Array.from({ length: 19 }, (_, i) => (
                            <option key={i} value={i}>
                              {i === 0 ? '0 anos' : i === 1 ? '1 ano' : `${i} anos`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#8C867E] font-semibold block mb-1">
                          Meses adicionais
                        </span>
                        <select
                          value={selectedMonths}
                          onChange={(e) => {
                            const m = Number(e.target.value);
                            handleApplyQuickAge(selectedYears, m);
                          }}
                          className="w-full px-3 py-2 bg-white border border-[#F0EDE6] rounded-xl text-xs text-[#4A443F] font-semibold focus:outline-none focus:border-[#4A6741]"
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i}>
                              {i === 0 ? '0 meses' : i === 1 ? '1 mês' : `${i} meses`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-wider text-[#8C867E] font-bold block">
                        Atalhos rápidos de idade:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {AGE_PRESETS.map((preset) => {
                          const isSelected =
                            selectedYears === preset.years && selectedMonths === preset.months;
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => handleApplyQuickAge(preset.years, preset.months)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                                isSelected
                                  ? 'bg-[#4A6741] text-white shadow-2xs font-semibold'
                                  : 'bg-white text-[#4A443F] border border-[#F0EDE6] hover:border-[#A3B18A]'
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dedication / Story Notes */}
              <div>
                <label
                  htmlFor="input-child-notes"
                  className="block text-xs font-semibold text-[#4A443F] mb-1"
                >
                  Dedicatória / Frase inicial
                </label>
                <textarea
                  id="input-child-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Nosso maior presente. Tudo aquilo que não quero esquecer, estou guardando para você..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#F0EDE6] rounded-xl text-xs text-[#4A443F] font-serif focus:outline-none focus:border-[#4A6741] transition-colors leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 2: PARENTS & AUTHORS MANAGEMENT (Papai, Mamãe, etc.) */}
          {activeTab === 'parents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#F0EDE6] pb-2">
                <div>
                  <h3 className="font-serif text-base text-[#3D4B38] font-medium flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#4A6741]" />
                    <span>Quem registra as memórias</span>
                  </h3>
                  <p className="text-[11px] text-[#8C867E]">
                    Adicione perfis para o Papai, Mamãe ou outros familiares que guardam momentos.
                  </p>
                </div>
              </div>

              {/* Action: Quick add Mamãe banner if missing */}
              {!hasMomProfile && (
                <div className="bg-[#A3B18A]/15 border border-[#A3B18A]/30 p-3 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#4A6741] text-white flex items-center justify-center font-bold text-xs">
                      M
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#3D4B38] block">
                        Adicionar perfil da Mamãe
                      </span>
                      <span className="text-[10px] text-[#8C867E]">
                        Permite que a mamãe também assine cartas e memórias
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddAuthor('Mãe', 'Mamãe')}
                    className="px-3 py-1.5 bg-[#4A6741] text-white rounded-xl text-xs font-semibold hover:bg-[#3D5235] transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>
              )}

              {/* List of Authors Cards */}
              <div className="space-y-3">
                {authorsList.map((author, index) => {
                  const isPrimary = author.isPrimary;
                  return (
                    <div
                      key={author.id || `profile-author-${index}-${author.name}`}
                      className={`p-4 rounded-2xl border transition-all ${
                        isPrimary
                          ? 'bg-white border-[#4A6741]/40 shadow-xs'
                          : 'bg-white/80 border-[#F0EDE6] hover:border-[#A3B18A]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        {/* Author Avatar & Photo Upload */}
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[#E5E1D8] border border-[#F0EDE6] shrink-0">
                            {author.photo && author.photo.trim() !== '' ? (
                              <Image
                                src={author.photo}
                                alt={author.name}
                                fill
                                className="object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-serif font-bold text-base text-[#4A6741] bg-[#A3B18A]/20">
                                {author.name ? author.name[0] : 'P'}
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-[#3D4B38]">
                                {author.name || 'Autor'}
                              </span>
                              {isPrimary ? (
                                <span className="inline-flex items-center gap-0.5 text-[9px] bg-[#4A6741]/15 text-[#3D5235] px-1.5 py-0.5 rounded-full font-bold">
                                  <Star className="w-2.5 h-2.5 fill-[#3D5235]" />
                                  Principal
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryAuthor(index)}
                                  className="text-[9px] text-[#8C867E] hover:text-[#4A6741] underline"
                                  title="Tornar autor padrão"
                                >
                                  Tornar padrão
                                </button>
                              )}
                            </div>
                            <span className="text-[11px] text-[#8C867E] block">
                              {author.relation}
                            </span>
                          </div>
                        </div>

                        {/* Actions: Photo and Delete */}
                        <div className="flex items-center gap-1">
                          <label className="cursor-pointer p-1.5 rounded-xl text-[#8C867E] hover:text-[#3D4B38] hover:bg-[#F8F6F2] transition-colors" title="Alterar foto">
                            <Camera className="w-4 h-4" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleAuthorPhotoUpload(index, e)}
                              className="hidden"
                            />
                          </label>

                          {authorsList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAuthor(index)}
                              className="p-1.5 rounded-xl text-[#8C867E] hover:text-[#B83A3A] hover:bg-[#FDECEC] transition-colors"
                              title="Remover este perfil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Fields: Name and Relation */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-semibold text-[#8C867E] mb-1 uppercase tracking-wider">
                            Como a filha te chama
                          </label>
                          <input
                            type="text"
                            value={author.name}
                            onChange={(e) => handleUpdateAuthor(index, 'name', e.target.value)}
                            placeholder="Ex: Mamãe, Papai, Vovó..."
                            className="w-full px-3 py-2 bg-[#FDFCF9] border border-[#F0EDE6] rounded-xl text-xs text-[#4A443F] font-medium focus:outline-none focus:border-[#4A6741]"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-[#8C867E] mb-1 uppercase tracking-wider">
                            Parentesco / Papel
                          </label>
                          <select
                            value={author.relation}
                            onChange={(e) =>
                              handleUpdateAuthor(index, 'relation', e.target.value as AuthorRelation)
                            }
                            className="w-full px-3 py-2 bg-[#FDFCF9] border border-[#F0EDE6] rounded-xl text-xs text-[#4A443F] font-medium focus:outline-none focus:border-[#4A6741]"
                          >
                            {RELATIONS.map((rel) => (
                              <option key={rel} value={rel}>
                                {rel}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Button to add another author */}
              <button
                type="button"
                onClick={() => handleAddAuthor('Outro', 'Outro Familiar')}
                className="w-full py-2.5 border-2 border-dashed border-[#E5E1D8] hover:border-[#A3B18A] hover:bg-[#F8F6F2] text-[#8C867E] hover:text-[#3D4B38] rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Acrescentar mais um perfil (Vovó, Vovô, Madrinha...)</span>
              </button>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-[#F0EDE6]">
            {activeTab === 'child' ? (
              <button
                type="button"
                onClick={() => setActiveTab('parents')}
                className="text-xs text-[#4A6741] font-semibold hover:underline flex items-center gap-1"
              >
                <span>Ver perfis de Pais & Autores</span>
                <Users className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('child')}
                className="text-xs text-[#4A6741] font-semibold hover:underline flex items-center gap-1"
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Voltar para perfil de {childName || 'Olívia'}</span>
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <button
                id="btn-cancel-profile-edit"
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl text-xs text-[#8C867E] hover:bg-[#F8F6F2] font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                id="btn-save-profile"
                type="submit"
                className="px-5 py-2.5 bg-[#4A6741] text-white rounded-2xl text-xs font-semibold hover:bg-[#3D5235] shadow-md shadow-[#4A6741]/20 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Salvar alterações</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ProfileEditModal: React.FC<ProfileEditModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <ProfileEditForm {...props} />;
};
