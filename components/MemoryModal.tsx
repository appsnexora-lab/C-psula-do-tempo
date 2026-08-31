'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Memory, ChildProfile, AuthorProfile, MoodType, MediaItem, AudioItem, MilestoneCategory } from '@/types';
import { calculateAgePortuguese, getTodayString, getTimeString, calculateUnlockDateFromAge } from '@/lib/dateUtils';
import { StorageService } from '@/services/storageService';
import { fileToDataUrl, formatDuration } from '@/services/mediaService';
import { AudioRecorderService } from '@/services/audioService';
import { CustomVideoPlayer } from '@/components/CustomVideoPlayer';
import { 
  X, 
  Camera, 
  Mic, 
  Video, 
  Lock, 
  Heart, 
  Star, 
  MapPin, 
  Trash2, 
  Play, 
  Pause, 
  Square, 
  Check, 
  Sparkles 
} from 'lucide-react';
import Image from 'next/image';

export interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memory: Memory, isFirstEver?: boolean) => void;
  childProfile: ChildProfile;
  authors?: AuthorProfile[];
  editingMemory?: Memory | null;
  prefillFirstTimeCategory?: string;
  totalActiveMemoriesCount?: number;
}

const MOOD_OPTIONS: MoodType[] = [
  'Feliz',
  'Carinhosa',
  'Engraçada',
  'Sonolenta',
  'Curiosa',
  'Agitada',
  'Chorando',
  'Especial',
  'Outro',
];

const FIRST_TIME_PRESETS: MilestoneCategory[] = [
  'Primeiro sorriso',
  'Primeiro banho',
  'Primeiro passeio',
  'Primeira palavra',
  'Primeiro passo',
  'Primeiro aniversário',
  'Primeiro desenho',
  'Primeiro dia na escola',
  'Primeiro amigo',
  'Outro',
];

const MemoryModalInner: React.FC<{
  onClose: () => void;
  onSave: (memory: Memory, isFirstEver?: boolean) => void;
  childProfile: ChildProfile;
  authors?: AuthorProfile[];
  initialMemory?: Memory | null;
  prefillFirstTimeCategory?: string;
  totalActiveMemoriesCount?: number;
}> = ({
  onClose,
  onSave,
  childProfile,
  authors,
  initialMemory,
  prefillFirstTimeCategory,
  totalActiveMemoriesCount = 0,
}) => {
  // Form State
  const [title, setTitle] = useState(initialMemory?.title || '');
  const [content, setContent] = useState(initialMemory?.content || '');
  const [date, setDate] = useState(initialMemory?.date || getTodayString());
  const [time, setTime] = useState(initialMemory?.time || getTimeString());
  const [location, setLocation] = useState(initialMemory?.location || '');
  const [authorName, setAuthorName] = useState(
    initialMemory?.authorName || (authors && authors.length > 0 ? authors[0].name : 'Papai')
  );
  const [moods, setMoods] = useState<MoodType[]>(initialMemory?.moods || ['Feliz']);
  const [isFirstTime, setIsFirstTime] = useState(
    initialMemory?.isFirstTime || !!prefillFirstTimeCategory
  );
  const [firstTimeCategory, setFirstTimeCategory] = useState<string>(
    initialMemory?.firstTimeCategory || prefillFirstTimeCategory || 'Primeiro sorriso'
  );
  const [customFirstTime, setCustomFirstTime] = useState('');
  const [isSpecial, setIsSpecial] = useState(initialMemory?.isSpecial || false);

  // Photos & Media
  const [photos, setPhotos] = useState<MediaItem[]>(initialMemory?.photos || []);
  const [videos, setVideos] = useState<MediaItem[]>(initialMemory?.videos || []);
  const [audios, setAudios] = useState<AudioItem[]>(initialMemory?.audios || []);

  useEffect(() => {
    if (!initialMemory?.videos || initialMemory.videos.length === 0) return;
    let isMounted = true;
    (async () => {
      const updated = await Promise.all(
        initialMemory.videos.map(async (v) => {
          if (!v.url || v.url === '') {
            const cached =
              (await StorageService.getMediaBlob(v.id)) ||
              (v.name ? await StorageService.getMediaBlob(v.name) : null) ||
              (await StorageService.getMediaBlob(`${initialMemory.id}_${v.id}`)) ||
              (await StorageService.getMediaBlob(initialMemory.id));
            if (cached) return { ...v, url: cached };
          }
          return v;
        })
      );
      if (isMounted) {
        setVideos(updated);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [initialMemory]);

  // Future Vault (Cápsula)
  const [isFutureLocked, setIsFutureLocked] = useState(initialMemory?.isFutureLocked || false);
  const [futureOption, setFutureOption] = useState<'10' | '15' | '18' | 'custom'>(
    initialMemory?.unlockAge ? (String(initialMemory.unlockAge) as any) : '18'
  );
  const [customUnlockDate, setCustomUnlockDate] = useState(initialMemory?.unlockDate || '');

  // Audio Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recorderRef = useRef<AudioRecorderService | null>(null);

  // Audio Playback
  const [audioPlaybackUrl, setAudioPlaybackUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioElemRef = useRef<HTMLAudioElement | null>(null);

  // Celebration state for first ever memory
  const [showCelebration, setShowCelebration] = useState(false);
  const [savedMemoryHolder, setSavedMemoryHolder] = useState<Memory | null>(null);

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  // Age calculation
  const calculatedAge = calculateAgePortuguese(childProfile.birthDate, date);

  // Handle Photos
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    for (const file of files) {
      const base64 = await fileToDataUrl(file, {
        maxDimension: 1200,
        quality: 0.75,
        maxBytes: 200000,
      });
      const newPhoto: MediaItem = {
        id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: 'image',
        url: base64,
        isPrimary: photos.length === 0,
        createdAt: new Date().toISOString(),
      };
      setPhotos((prev) => [...prev, newPhoto]);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Handle Videos
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    for (const file of files) {
      const base64 = await fileToDataUrl(file);
      const vidId = `video-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newVideo: MediaItem = {
        id: vidId,
        type: 'video',
        url: base64,
        name: file.name,
        createdAt: new Date().toISOString(),
      };
      // Immediately cache in local media blobs store
      await StorageService.saveMediaBlob(vidId, base64, file.name);
      if (file.name) {
        await StorageService.saveMediaBlob(file.name, base64, file.name);
      }
      setVideos((prev) => [...prev, newVideo]);
    }
  };

  const removeVideo = (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  // Handle Audio Recording
  const handleStartRecording = async () => {
    recorderRef.current = new AudioRecorderService();
    setRecordSeconds(0);
    const started = await recorderRef.current.startRecording((sec) => setRecordSeconds(sec));
    if (started) {
      setIsRecording(true);
    }
  };

  const handleStopRecording = async () => {
    if (!recorderRef.current) return;
    const res = await recorderRef.current.stopRecording();
    setIsRecording(false);
    const newAudio: AudioItem = {
      id: `audio-${Date.now()}`,
      url: res.base64,
      duration: res.duration,
      title: `Áudio ${audios.length + 1}`,
      recordedAt: new Date().toISOString(),
    };
    setAudios((prev) => [...prev, newAudio]);
  };

  const removeAudio = (id: string) => {
    setAudios((prev) => prev.filter((a) => a.id !== id));
  };

  const handlePlayAudio = (url: string) => {
    if (!audioElemRef.current) return;
    if (audioPlaybackUrl === url && isPlayingAudio) {
      audioElemRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioElemRef.current.src = url;
      audioElemRef.current.play();
      setAudioPlaybackUrl(url);
      setIsPlayingAudio(true);
      audioElemRef.current.onended = () => {
        setIsPlayingAudio(false);
      };
    }
  };

  // Toggle Mood
  const toggleMood = (mood: MoodType) => {
    if (moods.includes(mood)) {
      if (moods.length > 1) {
        setMoods(moods.filter((m) => m !== mood));
      }
    } else {
      setMoods([...moods, mood]);
    }
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    let computedUnlockDate: string | undefined = undefined;
    let computedUnlockAge: number | undefined = undefined;

    if (isFutureLocked) {
      if (futureOption === '10') {
        computedUnlockAge = 10;
        computedUnlockDate = calculateUnlockDateFromAge(childProfile.birthDate, 10);
      } else if (futureOption === '15') {
        computedUnlockAge = 15;
        computedUnlockDate = calculateUnlockDateFromAge(childProfile.birthDate, 15);
      } else if (futureOption === '18') {
        computedUnlockAge = 18;
        computedUnlockDate = calculateUnlockDateFromAge(childProfile.birthDate, 18);
      } else if (futureOption === 'custom' && customUnlockDate) {
        computedUnlockDate = customUnlockDate;
      }
    }

    const payload: Memory = {
      id: initialMemory?.id || `mem-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      date,
      time: time || undefined,
      location: location.trim() || undefined,
      authorName: authorName.trim() || undefined,
      calculatedAge: calculatedAge || 'Momento especial',
      moods,
      isSpecial,
      isFirstTime,
      firstTimeCategory: isFirstTime
        ? firstTimeCategory === 'Outro' && customFirstTime
          ? customFirstTime.trim()
          : firstTimeCategory
        : undefined,
      photos,
      videos,
      audios,
      isFutureLocked,
      unlockDate: computedUnlockDate,
      unlockAge: computedUnlockAge,
      createdAt: initialMemory?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    };

    const isFirstEver = totalActiveMemoriesCount === 0 && !initialMemory;

    if (isFirstEver) {
      setSavedMemoryHolder(payload);
      setShowCelebration(true);
    } else {
      onSave(payload, false);
      onClose();
    }
  };

  const handleFinishCelebration = () => {
    if (savedMemoryHolder) {
      onSave(savedMemoryHolder, true);
    }
    setShowCelebration(false);
    onClose();
  };

  return (
    <div
      id="memory-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 md:p-6 overflow-y-auto"
    >
      <audio ref={audioElemRef} className="hidden" />

      {showCelebration ? (
        <div className="bg-[#FDFCF9] border border-[#F0EDE6] rounded-[32px] p-8 max-w-md w-full text-center shadow-2xl space-y-5 my-auto">
          <div className="w-16 h-16 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>

          <span className="text-[10px] font-serif uppercase tracking-widest text-[#8C867E] font-bold block">
            A semente foi plantada 🌱
          </span>

          <h3 className="font-serif text-2xl text-[#3D4B38] font-normal">
            Sua primeira lembrança foi guardada!
          </h3>

          <p className="font-serif text-xs sm:text-sm text-[#8C867E] leading-relaxed italic">
            &ldquo;Cada detalhe de hoje se tornará um tesouro inestimável no futuro dela.&rdquo;
          </p>

          <button
            type="button"
            onClick={handleFinishCelebration}
            className="w-full py-3 bg-[#4A6741] hover:bg-[#3D5235] text-white rounded-2xl text-xs font-semibold transition-all shadow-md shadow-[#4A6741]/20 active:scale-95"
          >
            Ver no diário
          </button>
        </div>
      ) : (
        <div className="bg-[#FDFCF9] border border-[#F0EDE6] rounded-[32px] max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-[#F0EDE6] flex items-center justify-between bg-white/70 backdrop-blur-xs">
            <div>
              <span className="text-[10px] font-serif uppercase tracking-widest text-[#8C867E] font-bold block mb-0.5">
                {initialMemory ? 'Editar Registro' : 'Novo Registro'}
              </span>
              <h2 className="font-serif text-xl sm:text-2xl text-[#3D4B38] font-normal">
                {initialMemory ? 'Editar Lembrança' : 'Guardar uma Lembrança'}
              </h2>
            </div>

            <button
              id="modal-close-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#8C867E] hover:text-[#3D4B38] hover:bg-[#F8F6F2] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Scrollable Container */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
            {/* Title & Quick Heart Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#4A443F]">
                  Título do momento <span className="text-[#B83A3A]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsSpecial((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border transition-all ${
                    isSpecial
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37]/30 text-[#8C6D1F] font-semibold'
                      : 'bg-white border-[#F0EDE6] text-[#8C867E] hover:bg-[#F8F6F2]'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isSpecial ? 'fill-[#D4AF37] text-[#D4AF37]' : ''}`} />
                  <span>Momento Especial</span>
                </button>
              </div>

              <input
                id="memory-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: O primeiro sorriso banguela pela manhã..."
                className="w-full px-4 py-3 bg-white border border-[#F0EDE6] rounded-2xl text-sm text-[#4A443F] placeholder-[#8C867E] focus:outline-none focus:border-[#A3B18A] shadow-xs"
                required
              />
            </div>

            {/* Date, Age and Time Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#8C867E] mb-1">
                  Data do acontecimento
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#F0EDE6] rounded-xl text-xs text-[#4A443F] focus:outline-none focus:border-[#A3B18A]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#8C867E] mb-1">
                  Idade calculada
                </label>
                <div className="px-3.5 py-2.5 bg-[#A3B18A]/15 border border-[#A3B18A]/25 rounded-xl text-xs font-semibold text-[#4A6741] truncate">
                  {calculatedAge || '—'}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#8C867E] mb-1">
                  Horário (opcional)
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#F0EDE6] rounded-xl text-xs text-[#4A443F] focus:outline-none focus:border-[#A3B18A]"
                />
              </div>
            </div>

            {/* Author and Location Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#8C867E] mb-1">
                  Quem registrou
                </label>
                {authors && authors.length > 1 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {authors.map((auth, idx) => (
                      <button
                        key={auth.id || `author-opt-${idx}-${auth.name}`}
                        type="button"
                        onClick={() => setAuthorName(auth.name)}
                        className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                          authorName === auth.name
                            ? 'bg-[#4A6741] text-white border-[#4A6741] font-semibold shadow-xs'
                            : 'bg-white text-[#4A443F] border-[#F0EDE6] hover:bg-[#F8F6F2]'
                        }`}
                      >
                        {auth.name} ({auth.relation})
                      </button>
                    ))}
                    <button
                      key="author-opt-both-family"
                      type="button"
                      onClick={() => setAuthorName('Família')}
                      className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                        authorName === 'Família'
                          ? 'bg-[#4A6741] text-white border-[#4A6741] font-semibold shadow-xs'
                          : 'bg-white text-[#4A443F] border-[#F0EDE6] hover:bg-[#F8F6F2]'
                      }`}
                    >
                      Ambos / Família
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Ex: Papai, Mamãe..."
                    className="w-full px-3.5 py-2.5 bg-white border border-[#F0EDE6] rounded-xl text-xs text-[#4A443F] focus:outline-none focus:border-[#A3B18A]"
                  />
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-[11px] font-semibold text-[#8C867E] mb-1">
                  Local ou onde aconteceu
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-[#8C867E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Quarto dela, Praia de Santos..."
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#F0EDE6] rounded-xl text-xs text-[#4A443F] placeholder-[#8C867E] focus:outline-none focus:border-[#A3B18A]"
                  />
                </div>
              </div>
            </div>

            {/* Narrative Content */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#4A443F]">
                  A história deste momento <span className="text-[#B83A3A]">*</span>
                </label>
                <span className="text-[11px] font-serif italic text-[#8C867E]">
                  Escreva como se estivesse conversando com ela
                </span>
              </div>
              <textarea
                id="memory-content-input"
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Conte com calma o que aconteceu, o que ela fez, a reação de todos e o sentimento que você guardou..."
                className="w-full px-4 py-3 bg-white border border-[#F0EDE6] rounded-2xl text-sm font-serif leading-relaxed text-[#4A443F] placeholder-[#8C867E] focus:outline-none focus:border-[#A3B18A] shadow-xs"
                required
              />
            </div>

            {/* Photos & Videos Section */}
            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-[#4A443F] block">Fotos e Vídeos</span>

              {/* Thumbnail Gallery */}
              {photos.filter((p) => Boolean(p && p.url && p.url.trim() !== '')).length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {photos.filter((p) => Boolean(p && p.url && p.url.trim() !== '')).map((photo, pIdx) => (
                    <div
                      key={photo.id || `photo-thumb-${pIdx}`}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-[#E5E1D8] border border-[#F0EDE6]"
                    >
                      <Image
                        src={photo.url}
                        alt="Foto da memória"
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Videos list */}
              {videos.length > 0 && (
                <div className="space-y-3">
                  {videos.map((vid, vIdx) => (
                    <div
                      key={vid.id || `video-item-${vIdx}`}
                      className="p-3 bg-white rounded-2xl border border-[#F0EDE6] text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate max-w-[200px] text-[#4A443F] font-medium flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-[#4A6741]" />
                          {vid.name || 'Vídeo anexado'}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeVideo(vid.id)}
                          className="text-[#B83A3A] p-1.5 rounded-lg hover:bg-[#FDECEC] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {vid.url && vid.url.trim() !== '' ? (
                        <CustomVideoPlayer
                          src={vid.url}
                          title={vid.name}
                          className="w-full max-h-56"
                        />
                      ) : (
                        <div className="p-3 bg-[#F8F6F2] rounded-xl text-[11px] text-[#8C867E]">
                          Vídeo salvo localmente no dispositivo.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Media Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={photoInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold bg-white border border-[#F0EDE6] text-[#4A443F] hover:bg-[#F8F6F2] transition-colors shadow-2xs"
                >
                  <Camera className="w-4 h-4 text-[#4A6741]" />
                  <span>Adicionar Fotos</span>
                </button>

                <input
                  type="file"
                  accept="video/*"
                  ref={videoInputRef}
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold bg-white border border-[#F0EDE6] text-[#4A443F] hover:bg-[#F8F6F2] transition-colors shadow-2xs"
                >
                  <Video className="w-4 h-4 text-[#4A6741]" />
                  <span>Adicionar Vídeo</span>
                </button>
              </div>
            </div>

            {/* Audio Voice Recording Section */}
            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-[#4A443F] block">Gravação de Voz</span>

              {/* Recorded Audios List */}
              {audios.length > 0 && (
                <div className="space-y-2">
                  {audios.map((audio, aIdx) => (
                    <div
                      key={audio.id || `audio-item-${aIdx}`}
                      className="p-3 bg-white rounded-2xl border border-[#F0EDE6] flex items-center justify-between shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(audio.url)}
                          className="p-2 rounded-full bg-[#A3B18A]/15 text-[#4A6741] hover:bg-[#A3B18A]/25 transition-colors"
                        >
                          {audioPlaybackUrl === audio.url && isPlayingAudio ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <div>
                          <span className="text-xs font-semibold text-[#4A443F] block">
                            {audio.title}
                          </span>
                          <span className="text-[10px] text-[#8C867E]">
                            Duração: {formatDuration(audio.duration)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeAudio(audio.id)}
                        className="text-[#B83A3A] p-1.5 hover:bg-[#FDECEC] rounded-full"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Record Action */}
              {!isRecording ? (
                <button
                  id="btn-start-audio-record"
                  type="button"
                  onClick={handleStartRecording}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold bg-white border border-[#F0EDE6] text-[#4A443F] hover:bg-[#F8F6F2] transition-colors shadow-2xs"
                >
                  <Mic className="w-4 h-4 text-[#4A6741]" />
                  <span>Gravar mensagem de voz</span>
                </button>
              ) : (
                <div className="flex items-center gap-3 p-3.5 bg-[#FDECEC] rounded-2xl border border-[#F5C2C2]">
                  <div className="w-3 h-3 rounded-full bg-[#B83A3A] animate-ping" />
                  <span className="text-xs font-semibold text-[#B83A3A]">
                    Gravando voz: {formatDuration(recordSeconds)}
                  </span>
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="ml-auto inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#B83A3A] text-white text-xs font-semibold shadow-2xs hover:bg-[#9B2F2F]"
                  >
                    <Square className="w-3 h-3 fill-white" />
                    <span>Concluir</span>
                  </button>
                </div>
              )}
            </div>

            {/* Primeira Vez / Marcos */}
            <div className="p-4.5 bg-white rounded-2xl border border-[#F0EDE6] space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                  <div>
                    <span className="text-xs font-semibold text-[#4A443F] block">
                      É uma Primeira Vez?
                    </span>
                    <span className="text-[10px] text-[#8C867E]">
                      Marque se este momento for um marco importante
                    </span>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={isFirstTime}
                  onChange={(e) => setIsFirstTime(e.target.checked)}
                  className="rounded text-[#4A6741] accent-[#4A6741] w-4 h-4"
                />
              </div>

              {isFirstTime && (
                <div className="pt-3 border-t border-[#F0EDE6] space-y-2">
                  <label className="block text-[11px] font-semibold text-[#8C867E]">
                    Categoria do marco
                  </label>
                  <select
                    value={firstTimeCategory}
                    onChange={(e) => setFirstTimeCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FDFCF9] border border-[#F0EDE6] rounded-xl text-xs text-[#4A443F] focus:outline-none focus:border-[#A3B18A]"
                  >
                    {FIRST_TIME_PRESETS.map((preset, prIdx) => (
                      <option key={`preset-${prIdx}-${preset}`} value={preset}>
                        {preset}
                      </option>
                    ))}
                  </select>

                  {firstTimeCategory === 'Outro' && (
                    <input
                      type="text"
                      value={customFirstTime}
                      onChange={(e) => setCustomFirstTime(e.target.value)}
                      placeholder="Qual foi essa primeira vez?"
                      className="w-full px-3.5 py-2.5 bg-[#FDFCF9] border border-[#F0EDE6] rounded-xl text-xs text-[#4A443F]"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Mood Chips */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#4A443F]">
                Sentimento / Clima do momento
              </label>
              <div className="flex flex-wrap gap-2">
                {MOOD_OPTIONS.map((mood, mIdx) => (
                  <button
                    key={`mood-${mIdx}-${mood}`}
                    type="button"
                    onClick={() => toggleMood(mood)}
                    className={`px-3.5 py-1.5 rounded-full text-xs transition-all ${
                      moods.includes(mood)
                        ? 'bg-[#4A6741] text-white font-semibold shadow-2xs'
                        : 'bg-white border border-[#F0EDE6] text-[#8C867E] hover:bg-[#F8F6F2] hover:text-[#3D4B38]'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Future Lock Vault (Cápsula do tempo) */}
            <div className="p-4.5 bg-white rounded-2xl border border-[#F0EDE6] space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-[#D4AF37]" />
                  <div>
                    <span className="text-xs font-semibold text-[#4A443F] block">
                      Guardar para o Futuro (Cápsula do tempo)
                    </span>
                    <span className="text-[10px] text-[#8C867E]">
                      Esta lembrança ficará no cofre para ser aberta no momento certo
                    </span>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={isFutureLocked}
                  onChange={(e) => setIsFutureLocked(e.target.checked)}
                  className="rounded text-[#4A6741] accent-[#4A6741] w-4 h-4"
                />
              </div>

              {isFutureLocked && (
                <div className="pt-3 border-t border-[#F0EDE6] space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {(['10', '15', '18'] as const).map((ageOpt) => (
                      <button
                        key={`age-opt-${ageOpt}`}
                        type="button"
                        onClick={() => setFutureOption(ageOpt)}
                        className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                          futureOption === ageOpt
                            ? 'bg-[#4A6741] text-white shadow-xs'
                            : 'bg-[#FDFCF9] border border-[#F0EDE6] text-[#8C867E] hover:text-[#3D4B38]'
                        }`}
                      >
                        Aos {ageOpt} anos
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFutureOption('custom')}
                      className={`text-xs px-3.5 py-1.5 rounded-xl border transition-all ${
                        futureOption === 'custom'
                          ? 'bg-[#4A6741] text-white font-semibold'
                          : 'bg-[#FDFCF9] border-[#F0EDE6] text-[#8C867E]'
                      }`}
                    >
                      Data personalizada
                    </button>
                  </div>

                  {futureOption === 'custom' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-[#8C867E] mb-1">
                        Data de desbloqueio
                      </label>
                      <input
                        type="date"
                        value={customUnlockDate}
                        onChange={(e) => setCustomUnlockDate(e.target.value)}
                        className="w-full px-3.5 py-2 bg-[#FDFCF9] border border-[#F0EDE6] rounded-xl text-xs text-[#4A443F]"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl text-xs font-medium text-[#8C867E] hover:bg-[#F8F6F2] transition-colors"
              >
                Cancelar
              </button>
              <button
                id="btn-save-memory-submit"
                type="submit"
                className="px-6 py-2.5 rounded-2xl text-xs font-semibold bg-[#4A6741] hover:bg-[#3D5235] text-white shadow-md shadow-[#4A6741]/20 transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{initialMemory ? 'Salvar alterações' : 'Guardar lembrança'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export const MemoryModal: React.FC<MemoryModalProps> = (props) => {
  if (!props.isOpen) return null;
  return (
    <MemoryModalInner
      onClose={props.onClose}
      onSave={props.onSave}
      childProfile={props.childProfile}
      authors={props.authors}
      initialMemory={props.editingMemory}
      prefillFirstTimeCategory={props.prefillFirstTimeCategory}
      totalActiveMemoriesCount={props.totalActiveMemoriesCount}
    />
  );
};
