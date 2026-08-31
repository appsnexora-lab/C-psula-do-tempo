'use client';

import React, { useState } from 'react';
import { Letter, ChildProfile, AudioItem } from '@/types';
import { formatDatePortuguese, calculateAgePortuguese, getTodayString, calculateUnlockDateFromAge } from '@/lib/dateUtils';
import { AudioRecorderService } from '@/services/audioService';
import { fileToDataUrl, formatDuration } from '@/services/mediaService';
import { 
  Mail, 
  Plus, 
  Lock, 
  Calendar, 
  Trash2, 
  Edit3, 
  Camera, 
  Mic, 
  X, 
  Square,
  ChevronRight
} from 'lucide-react';
import Image from 'next/image';

interface LettersViewProps {
  letters: Letter[];
  childProfile: ChildProfile;
  onSaveLetter: (letter: Letter) => void;
  onDeleteLetter: (id: string) => void;
}

export const LettersView: React.FC<LettersViewProps> = ({
  letters,
  childProfile,
  onSaveLetter,
  onDeleteLetter,
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingLetter, setEditingLetter] = useState<Letter | null>(null);
  const [readingLetter, setReadingLetter] = useState<Letter | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [isFutureLocked, setIsFutureLocked] = useState(false);
  const [unlockAge, setUnlockAge] = useState<number>(18);
  const [customUnlockDate, setCustomUnlockDate] = useState('');

  // Audio Recording in Letter
  const [audioItem, setAudioItem] = useState<AudioItem | undefined>(undefined);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recorderRef = React.useRef<AudioRecorderService | null>(null);

  const activeLetters = letters.filter((l) => !l.isDeleted);

  const handleOpenCreate = () => {
    setEditingLetter(null);
    setTitle('');
    setContent('');
    setDate(getTodayString());
    setPhotoUrl(undefined);
    setAudioItem(undefined);
    setIsFutureLocked(true);
    setUnlockAge(18);
    setCustomUnlockDate('');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (letter: Letter) => {
    setEditingLetter(letter);
    setTitle(letter.title);
    setContent(letter.content);
    setDate(letter.date);
    setPhotoUrl(letter.photoUrl);
    setAudioItem(letter.audio);
    setIsFutureLocked(letter.isFutureLocked);
    setUnlockAge(letter.unlockAge || 18);
    setCustomUnlockDate(letter.unlockDate || '');
    setIsEditorOpen(true);
  };

  const handleStartAudio = async () => {
    recorderRef.current = new AudioRecorderService();
    setRecordSeconds(0);
    const ok = await recorderRef.current.startRecording((sec) => setRecordSeconds(sec));
    if (ok) setIsRecording(true);
  };

  const handleStopAudio = async () => {
    if (!recorderRef.current) return;
    const res = await recorderRef.current.stopRecording();
    setIsRecording(false);
    setAudioItem({
      id: `audio-let-${Date.now()}`,
      url: res.base64,
      duration: res.duration,
      title: 'Mensagem de voz na carta',
      recordedAt: new Date().toISOString(),
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const url = await fileToDataUrl(e.target.files[0]);
    setPhotoUrl(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    let computedUnlockDate: string | undefined = undefined;
    if (isFutureLocked) {
      if (customUnlockDate) {
        computedUnlockDate = customUnlockDate;
      } else if (unlockAge) {
        computedUnlockDate = calculateUnlockDateFromAge(childProfile.birthDate, unlockAge);
      }
    }

    const calculatedAge = calculateAgePortuguese(childProfile.birthDate, date);

    const payload: Letter = {
      id: editingLetter?.id || `letter-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      date,
      calculatedAge: calculatedAge || 'Momento especial',
      photoUrl,
      audio: audioItem,
      isFutureLocked,
      unlockAge: isFutureLocked ? unlockAge : undefined,
      unlockDate: isFutureLocked ? computedUnlockDate : undefined,
      isUnlocked: false,
      createdAt: editingLetter?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    };

    onSaveLetter(payload);
    setIsEditorOpen(false);
  };

  return (
    <div id="letters-view-container" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-serif uppercase tracking-widest text-[#8C867E] font-bold block mb-0.5">
            Mensagens do Coração
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#3D4B38] font-normal">Cartas para você</h1>
        </div>

        <button
          id="btn-write-letter"
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold bg-[#4A6741] hover:bg-[#3D5235] text-white shadow-md shadow-[#4A6741]/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Escrever carta</span>
        </button>
      </div>

      <p className="text-xs text-[#8C867E] leading-relaxed max-w-xl font-serif italic">
        &ldquo;Palavras que ultrapassam o tempo. Escreva hoje aquilo que você deseja que ela leia no futuro.&rdquo;
      </p>

      {/* Letters List */}
      {activeLetters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeLetters.map((letter) => (
            <div
              key={letter.id}
              id={`letter-card-${letter.id}`}
              onClick={() => setReadingLetter(letter)}
              className="cursor-pointer bg-white border border-[#F0EDE6] rounded-[28px] p-6 hover:border-[#A3B18A] hover:shadow-xs transition-all flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Ribbon Header */}
              <div className="flex items-center justify-between text-xs text-[#8C867E] mb-3">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#4A6741]" />
                  <span>{formatDatePortuguese(letter.date, { short: true })}</span>
                </span>

                {letter.isFutureLocked ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F2F0EB] text-[#8C6D1F] border border-[#F0EDE6] text-[10px] font-medium">
                    <Lock className="w-3 h-3" />
                    <span>Para {letter.unlockAge ? `aos ${letter.unlockAge} anos` : 'o futuro'}</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-[#4A6741] uppercase tracking-wider">Carta aberta</span>
                )}
              </div>

              {/* Title & Preview */}
              <div>
                <h3 className="font-serif text-lg text-[#3D4B38] font-normal group-hover:text-[#4A6741] transition-colors mb-2 line-clamp-1">
                  {letter.title}
                </h3>

                <p className="font-serif text-xs text-[#8C867E] line-clamp-3 leading-relaxed italic">
                  &ldquo;{letter.content}&rdquo;
                </p>
              </div>

              {/* Bottom footer */}
              <div className="flex items-center justify-between mt-5 pt-3 border-t border-[#F0EDE6] text-[11px] text-[#8C867E]">
                <span>Idade dela: {letter.calculatedAge}</span>
                <span className="text-[#4A6741] font-semibold inline-flex items-center gap-1 group-hover:underline">
                  Ler carta <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12 px-4 bg-white border border-[#F0EDE6] rounded-3xl space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#A3B18A]/15 text-[#4A6741] flex items-center justify-center mx-auto mb-2">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg text-[#3D4B38]">Ainda não existe nenhuma carta aqui.</h3>
          <p className="text-xs text-[#8C867E] max-w-xs mx-auto">
            Que tal escrever a primeira carta para contar como foi o nascimento dela ou seus primeiros passos?
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-xs font-semibold bg-[#4A6741] text-white hover:bg-[#3D5235] shadow-md shadow-[#4A6741]/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Escrever primeira carta</span>
          </button>
        </div>
      )}

      {/* Letter Reading Modal */}
      {readingLetter && (
        <div
          id="letter-reading-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
        >
          <div className="bg-[#FDFCF9] border border-[#F0EDE6] rounded-[32px] max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto relative">
            {/* Header controls */}
            <div className="px-6 py-4 border-b border-[#F0EDE6] flex items-center justify-between bg-white/60">
              <div className="text-xs text-[#8C867E]">
                <span>Escrita em {formatDatePortuguese(readingLetter.date)}</span>
                <span className="mx-1.5">•</span>
                <span className="text-[#4A6741] font-medium">{readingLetter.calculatedAge}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEdit(readingLetter);
                    setReadingLetter(null);
                  }}
                  className="p-2 rounded-xl text-[#8C867E] hover:text-[#4A6741] hover:bg-[#F8F6F2] transition-colors"
                  title="Editar carta"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteLetter(readingLetter.id);
                    setReadingLetter(null);
                  }}
                  className="p-2 rounded-xl text-[#8C867E] hover:text-[#B83A3A] hover:bg-[#FDECEC] transition-colors"
                  title="Mover para a lixeira"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setReadingLetter(null)}
                  className="p-2 rounded-xl text-[#8C867E] hover:text-[#3D4B38] hover:bg-[#F8F6F2] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Letter Body Parchment */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              {readingLetter.isFutureLocked && (
                <div className="px-4 py-2.5 bg-[#F2F0EB] border border-[#F0EDE6] rounded-2xl text-xs text-[#8C6D1F] flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>
                    Carta guardada para o futuro
                    {readingLetter.unlockAge ? ` — Para ser lida aos ${readingLetter.unlockAge} anos.` : '.'}
                  </span>
                </div>
              )}

              <h2 className="font-serif text-2xl sm:text-3xl text-[#3D4B38] font-normal leading-snug">
                {readingLetter.title}
              </h2>

              {readingLetter.photoUrl && readingLetter.photoUrl.trim() !== '' && (
                <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-[#E5E1D8] border border-[#F0EDE6]">
                  <Image
                    src={readingLetter.photoUrl}
                    alt={readingLetter.title}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div className="font-serif text-base sm:text-lg text-[#4A443F] leading-relaxed whitespace-pre-line bg-white/80 p-6 rounded-2xl border border-[#F0EDE6] shadow-xs">
                {readingLetter.content}
              </div>

              {readingLetter.audio && readingLetter.audio.url && readingLetter.audio.url.trim() !== '' && (
                <div className="p-4 bg-white rounded-2xl border border-[#F0EDE6] flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-[#4A6741]" />
                    <span className="text-xs text-[#4A443F] font-semibold">Mensagem de voz na carta</span>
                  </div>
                  <audio controls className="h-8 max-w-[200px]" src={readingLetter.audio.url} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Letter Editor Modal */}
      {isEditorOpen && (
        <div
          id="letter-editor-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
        >
          <div className="bg-[#FDFCF9] border border-[#F0EDE6] rounded-[32px] max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-[#F0EDE6] flex items-center justify-between bg-white/70">
              <h3 className="font-serif text-xl text-[#3D4B38] font-normal">
                {editingLetter ? 'Editar Carta' : 'Escrever Carta para Você'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-2 rounded-xl text-[#8C867E] hover:bg-[#F8F6F2] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A443F] mb-1">Título da carta</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Para você quando fizer 18 anos..."
                  className="w-full px-4 py-3 bg-white border border-[#F0EDE6] rounded-2xl text-sm text-[#4A443F] focus:outline-none focus:border-[#A3B18A]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A443F] mb-1">Mensagem</label>
                <textarea
                  rows={7}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Minha filha querida, hoje eu quero te dizer que..."
                  className="w-full px-4 py-3 bg-white border border-[#F0EDE6] rounded-2xl text-sm font-serif leading-relaxed text-[#4A443F] focus:outline-none focus:border-[#A3B18A]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#8C867E] mb-1">Data</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-[#F0EDE6] rounded-xl text-xs text-[#4A443F]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#8C867E] mb-1">Idade dela</label>
                  <div className="px-3.5 py-2 bg-[#A3B18A]/15 border border-[#A3B18A]/25 rounded-xl text-xs font-semibold text-[#4A6741] truncate">
                    {calculateAgePortuguese(childProfile.birthDate, date) || '—'}
                  </div>
                </div>
              </div>

              {/* Future Lock options */}
              <div className="bg-white p-4 rounded-2xl border border-[#F0EDE6] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#4A443F] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#4A6741]" />
                    <span>Bloquear para o futuro</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={isFutureLocked}
                    onChange={(e) => setIsFutureLocked(e.target.checked)}
                    className="rounded text-[#4A6741] accent-[#4A6741] w-4 h-4"
                  />
                </div>

                {isFutureLocked && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {[10, 15, 18].map((age) => (
                      <button
                        key={age}
                        type="button"
                        onClick={() => setUnlockAge(age)}
                        className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                          unlockAge === age
                            ? 'bg-[#4A6741] text-white shadow-xs'
                            : 'bg-[#FDFCF9] border border-[#F0EDE6] text-[#8C867E] hover:text-[#3D4B38]'
                        }`}
                      >
                        Aos {age} anos
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Photo & Audio Attachments */}
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs bg-white border border-[#F0EDE6] text-[#8C867E] hover:text-[#3D4B38] hover:bg-[#F8F6F2] transition-colors">
                  <Camera className="w-3.5 h-3.5 text-[#4A6741]" />
                  <span>{photoUrl ? 'Foto anexada' : 'Adicionar foto'}</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>

                {!isRecording ? (
                  <button
                    type="button"
                    onClick={handleStartAudio}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs bg-white border border-[#F0EDE6] text-[#8C867E] hover:text-[#3D4B38] hover:bg-[#F8F6F2] transition-colors"
                  >
                    <Mic className="w-3.5 h-3.5 text-[#4A6741]" />
                    <span>{audioItem ? 'Áudio gravado' : 'Gravar áudio'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopAudio}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs bg-[#B83A3A] text-white animate-pulse"
                  >
                    <Square className="w-3 h-3 fill-white" />
                    <span>Parar ({formatDuration(recordSeconds)})</span>
                  </button>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2.5 text-xs text-[#8C867E] hover:text-[#3D4B38] font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#4A6741] hover:bg-[#3D5235] text-white rounded-2xl text-xs font-semibold shadow-md shadow-[#4A6741]/20 active:scale-95 transition-all"
                >
                  Guardar carta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
