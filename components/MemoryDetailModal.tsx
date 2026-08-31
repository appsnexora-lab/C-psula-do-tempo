'use client';

import React, { useState, useEffect } from 'react';
import { Memory } from '@/types';
import { formatDatePortuguese } from '@/lib/dateUtils';
import { formatDuration, fileToDataUrl } from '@/services/mediaService';
import { StorageService } from '@/services/storageService';
import { CustomVideoPlayer } from '@/components/CustomVideoPlayer';
import { 
  X, 
  Edit3, 
  Trash2, 
  Share2, 
  Heart, 
  Star, 
  Lock, 
  MapPin, 
  Calendar, 
  Clock, 
  Mic, 
  Video, 
  Upload,
  Play,
  ChevronLeft, 
  ChevronRight,
  Check,
  Loader2,
  BookOpen
} from 'lucide-react';
import Image from 'next/image';

interface MemoryDetailModalProps {
  memory: Memory | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (memory: Memory) => void;
  onDelete: (id: string) => void;
  onToggleSpecial: (memory: Memory) => void;
  onUpdateMemory?: (updated: Memory) => void;
  onOpenReader?: (memory: Memory) => void;
}

export const MemoryDetailModal: React.FC<MemoryDetailModalProps> = ({
  memory: initialMemory,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleSpecial,
  onUpdateMemory,
  onOpenReader,
}) => {
  const [customVideoUrls, setCustomVideoUrls] = useState<Record<string, { url: string; name?: string }>>({});
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [loadingVideoId, setLoadingVideoId] = useState<string | null>(null);
  const [isResolvingMedia, setIsResolvingMedia] = useState(false);

  useEffect(() => {
    if (!initialMemory?.videos || initialMemory.videos.length === 0) return;
    let isMounted = true;

    const loadCachedMedia = async () => {
      const needsLookup = initialMemory.videos?.some((v) => !v.url || v.url.trim() === '');
      if (needsLookup) {
        setIsResolvingMedia(true);
      }

      for (const v of initialMemory.videos || []) {
        if (!v.url || v.url.trim() === '') {
          const cached =
            (await StorageService.getMediaBlob(v.id)) ||
            (v.name ? await StorageService.getMediaBlob(v.name) : null) ||
            (await StorageService.getMediaBlob(`${initialMemory.id}_${v.id}`)) ||
            (await StorageService.getMediaBlob(initialMemory.id));
          if (cached && isMounted) {
            setCustomVideoUrls((prev) => ({
              ...prev,
              [v.id]: { url: cached, name: v.name },
            }));
          }
        }
      }
      if (isMounted) {
        setIsResolvingMedia(false);
      }
    };

    loadCachedMedia();

    return () => {
      isMounted = false;
    };
  }, [initialMemory]);

  if (!isOpen || !initialMemory) return null;

  const memory: Memory = {
    ...initialMemory,
    videos: initialMemory.videos?.map((v) => {
      const custom = customVideoUrls[v.id];
      const resolvedUrl = v.url && v.url.trim() !== '' ? v.url : custom?.url || '';
      return {
        ...v,
        url: resolvedUrl,
        name: custom?.name || v.name,
      };
    }),
  };

  const photos = (memory.photos || []).filter((p) => Boolean(p && p.url && p.url.trim() !== ''));
  const activePhoto = photos[activePhotoIndex] || photos[0];

  const handleShare = () => {
    const textToShare = `“${memory.title}”\n${formatDatePortuguese(memory.date)} (${memory.calculatedAge})\n\n${memory.content}\n\n— Guardado com amor no Para Você.`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToShare);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    }
  };

  const handleConfirmDelete = () => {
    onDelete(memory.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleAttachVideo = async (file: File, vidId: string) => {
    try {
      setLoadingVideoId(vidId);
      const base64Url = await fileToDataUrl(file);

      // Save into multiple media cache keys
      await StorageService.saveMediaBlob(vidId, base64Url, file.name);
      if (file.name) await StorageService.saveMediaBlob(file.name, base64Url, file.name);
      await StorageService.saveMediaBlob(`${initialMemory.id}_${vidId}`, base64Url, file.name);
      await StorageService.saveMediaBlob(initialMemory.id, base64Url, file.name);

      setCustomVideoUrls((prev) => ({
        ...prev,
        [vidId]: { url: base64Url, name: file.name },
      }));

      const updatedVideos = (initialMemory.videos || []).map((v) => {
        if (v.id === vidId) {
          return {
            ...v,
            url: base64Url,
            name: file.name || v.name,
          };
        }
        return v;
      });

      const updatedMemory: Memory = {
        ...initialMemory,
        videos: updatedVideos,
      };

      await StorageService.saveMemory(updatedMemory);
      if (onUpdateMemory) onUpdateMemory(updatedMemory);
    } catch (err) {
      console.error('Erro ao anexar arquivo de vídeo:', err);
    } finally {
      setLoadingVideoId(null);
    }
  };

  return (
    <div
      id="memory-detail-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 md:p-6 overflow-y-auto"
    >
      <div className="bg-[#FDFCF9] border border-[#F0EDE6] rounded-[32px] max-w-2xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Top Control Bar */}
        <div className="px-6 py-3.5 border-b border-[#F0EDE6] flex items-center justify-between bg-white/80 backdrop-blur-xs">
          <div className="flex items-center gap-1.5">
            {onOpenReader && (
              <button
                id="detail-open-reader-btn"
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReader(memory);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4A6741]/10 text-[#4A6741] hover:bg-[#4A6741]/20 font-semibold text-xs transition-colors cursor-pointer"
                title="Abrir no Modo Leitura Imersivo"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Modo Leitura</span>
              </button>
            )}

            <button
              id="detail-toggle-special-btn"
              type="button"
              onClick={() => onToggleSpecial(memory)}
              className={`p-2 rounded-xl transition-colors ${
                memory.isSpecial
                  ? 'text-[#D4AF37] bg-[#D4AF37]/15'
                  : 'text-[#8C867E] hover:bg-[#F8F6F2]'
              }`}
              title={memory.isSpecial ? 'Remover dos especiais' : 'Marcar como especial'}
            >
              <Heart className={`w-4 h-4 ${memory.isSpecial ? 'fill-[#D4AF37]' : ''}`} />
            </button>

            <button
              id="detail-share-btn"
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl text-[#8C867E] hover:text-[#4A6741] hover:bg-[#F8F6F2] transition-colors"
              title="Copiar texto da lembrança"
            >
              {copiedNotification ? <Check className="w-4 h-4 text-[#4A6741]" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              id="detail-edit-btn"
              type="button"
              onClick={() => {
                onEdit(memory);
                onClose();
              }}
              className="p-2 rounded-xl text-[#8C867E] hover:text-[#4A6741] hover:bg-[#F8F6F2] transition-colors"
              title="Editar"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              id="detail-delete-btn"
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-xl text-[#8C867E] hover:text-[#B83A3A] hover:bg-[#FDECEC] transition-colors"
              title="Mover para lixeira"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <button
            id="detail-close-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#8C867E] hover:text-[#3D4B38] hover:bg-[#F8F6F2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Top Media Showcase (Photos and/or Videos) */}
          {((photos.length > 0 && activePhoto) || (memory.videos && memory.videos.length > 0)) && (
            <div className="space-y-3">
              {/* Primary Video Player if memory has videos and no photos */}
              {memory.videos && memory.videos.length > 0 && photos.length === 0 ? (
                <div className="space-y-3">
                  {memory.videos.map((vid) => (
                    <div key={vid.id} className="w-full">
                      {vid.url && vid.url.trim() !== '' ? (
                        <CustomVideoPlayer
                          src={vid.url}
                          title={vid.name || memory.title}
                          className="w-full max-h-[420px]"
                        />
                      ) : isResolvingMedia ? (
                        <div className="w-full h-48 bg-[#3D4B38] rounded-2xl flex flex-col items-center justify-center text-white space-y-2 border border-[#F0EDE6]">
                          <Loader2 className="w-6 h-6 animate-spin text-[#A3B18A]" />
                          <span className="text-xs text-white/80 font-medium">Carregando vídeo...</span>
                        </div>
                      ) : (
                        <div className="p-6 text-center bg-[#F8F6F2] rounded-2xl text-[#4A443F] space-y-3 border border-[#F0EDE6]">
                          <div className="w-12 h-12 rounded-full bg-[#E5E1D8] flex items-center justify-center mx-auto text-[#4A6741]">
                            <Video className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#4A443F] tracking-wide truncate max-w-sm mx-auto">
                              {vid.name || 'Vídeo registrado'}
                            </p>
                            <p className="text-[11px] text-[#8C867E] mt-0.5 max-w-xs mx-auto">
                              Arquivo de vídeo armazenado localmente no dispositivo de origem.
                            </p>
                          </div>
                          <div>
                            <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#D5D0C7] hover:bg-[#F2F0EB] text-[#4A443F] text-xs font-medium cursor-pointer transition-all active:scale-95">
                              {loadingVideoId === vid.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4A6741]" />
                                  <span>Carregando arquivo...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3.5 h-3.5 text-[#4A6741]" />
                                  <span>Vincular arquivo de vídeo</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="video/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleAttachVideo(e.target.files[0], vid.id);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : photos.length > 0 && activePhoto ? (
                <div className="space-y-2.5">
                  <div className="relative w-full aspect-4/3 sm:aspect-16/10 rounded-2xl overflow-hidden bg-[#E5E1D8] border border-[#F0EDE6]">
                    <Image
                      src={activePhoto.url}
                      alt={memory.title}
                      fill
                      className="object-contain sm:object-cover"
                      referrerPolicy="no-referrer"
                    />

                    {photos.length > 1 && (
                      <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none">
                        <button
                          type="button"
                          onClick={() =>
                            setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
                          }
                          className="p-2 rounded-full bg-black/40 text-white backdrop-blur-xs hover:bg-black/60 pointer-events-auto transition-transform active:scale-90"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActivePhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
                          }
                          className="p-2 rounded-full bg-black/40 text-white backdrop-blur-xs hover:bg-black/60 pointer-events-auto transition-transform active:scale-90"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Thumbnails list if multiple */}
                  {photos.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {photos.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActivePhotoIndex(idx)}
                          className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                            activePhotoIndex === idx ? 'border-[#4A6741] scale-105' : 'border-transparent opacity-70'
                          }`}
                        >
                          <Image
                            src={p.url}
                            alt="Miniatura"
                            fill
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Header Metadata */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#8C867E]">
              <span className="inline-flex items-center gap-1.5 bg-[#A3B18A]/15 text-[#4A6741] px-3 py-1 rounded-full font-semibold border border-[#A3B18A]/20">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDatePortuguese(memory.date)}</span>
              </span>

              <span className="px-3 py-1 rounded-full bg-[#F2F0EB] text-[#4A443F] font-semibold border border-[#F0EDE6]">
                {memory.calculatedAge}
              </span>

              {memory.time && (
                <span className="inline-flex items-center gap-1 text-[#8C867E]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{memory.time}</span>
                </span>
              )}

              {memory.location && (
                <span className="inline-flex items-center gap-1 text-[#8C867E]">
                  <MapPin className="w-3.5 h-3.5 text-[#4A6741]" />
                  <span>{memory.location}</span>
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-serif text-2xl sm:text-3xl text-[#3D4B38] font-normal leading-tight">
              {memory.title}
            </h1>
          </div>

          {/* Badges / Moods / First Times */}
          <div className="flex flex-wrap items-center gap-2">
            {memory.isFirstTime && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#8C6D1F] font-semibold">
                <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                <span>Primeira vez: {memory.firstTimeCategory || 'Momento especial'}</span>
              </span>
            )}

            {memory.isFutureLocked && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs bg-[#F2F0EB] border border-[#F0EDE6] text-[#8C6D1F] font-medium">
                <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>
                  Guardada para o futuro
                  {memory.unlockAge ? ` (Aos ${memory.unlockAge} anos)` : ''}
                </span>
              </span>
            )}

            {memory.moods?.map((mood) => (
              <span
                key={mood}
                className="px-3 py-1 rounded-full text-xs bg-white border border-[#F0EDE6] text-[#8C867E]"
              >
                {mood}
              </span>
            ))}
          </div>

          {/* Narrative Story Content */}
          <div className="bg-white border border-[#F0EDE6] rounded-2xl p-6 shadow-2xs space-y-4">
            <p className="font-serif text-base sm:text-lg text-[#4A443F] leading-relaxed whitespace-pre-line">
              {memory.content}
            </p>
            <div className="pt-3 border-t border-[#F0EDE6] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#8C867E]">
              {memory.authorName ? (
                <span className="font-serif italic">
                  Registrado com amor por <strong className="text-[#4A6741] font-medium">{memory.authorName}</strong>
                </span>
              ) : (
                <span className="font-serif italic">Guardado com amor</span>
              )}

              {onOpenReader && (
                <button
                  type="button"
                  id="detail-card-open-reader-btn"
                  onClick={() => {
                    onClose();
                    onOpenReader(memory);
                  }}
                  className="inline-flex items-center gap-1 text-[#4A6741] hover:text-[#3D5235] font-semibold hover:underline cursor-pointer self-start sm:self-auto"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Ler sem distrações</span>
                </button>
              )}
            </div>
          </div>

          {/* Audio Clips */}
          {memory.audios && memory.audios.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[10px] font-serif uppercase tracking-widest text-[#8C867E] font-bold flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-[#4A6741]" />
                <span>Gravações de Voz</span>
              </span>
              <div className="space-y-2">
                {memory.audios.map((audio) => (
                  <div
                    key={audio.id}
                    className="p-3.5 bg-white border border-[#F0EDE6] rounded-2xl flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <span className="text-xs font-semibold text-[#4A443F] block">
                        {audio.title || 'Áudio gravado'}
                      </span>
                      <span className="text-[10px] text-[#8C867E]">
                        Duração: {formatDuration(audio.duration)}
                      </span>
                    </div>
                    {audio.url && audio.url.trim() !== '' && (
                      <audio controls className="h-8 max-w-[200px]" src={audio.url} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos (rendered below if photos occupied the top media showcase) */}
          {memory.videos && memory.videos.length > 0 && photos.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[10px] font-serif uppercase tracking-widest text-[#8C867E] font-bold flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-[#4A6741]" />
                <span>Vídeos da Memória</span>
              </span>
              <div className="space-y-3">
                {memory.videos.map((vid) => (
                  <div key={vid.id} className="w-full">
                    {vid.url && vid.url.trim() !== '' ? (
                      <CustomVideoPlayer
                        src={vid.url}
                        title={vid.name || memory.title}
                        className="w-full max-h-[360px]"
                      />
                    ) : isResolvingMedia ? (
                      <div className="w-full h-36 bg-[#3D4B38] rounded-2xl flex flex-col items-center justify-center text-white space-y-2 border border-[#F0EDE6]">
                        <Loader2 className="w-5 h-5 animate-spin text-[#A3B18A]" />
                        <span className="text-xs text-white/80 font-medium">Carregando vídeo...</span>
                      </div>
                    ) : (
                      <div className="p-4 bg-[#F8F6F2] rounded-2xl text-xs text-[#4A443F] flex flex-col sm:flex-row items-center justify-between gap-3 border border-[#F0EDE6]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#E5E1D8] flex items-center justify-center text-[#4A6741]">
                            <Video className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium block truncate max-w-[200px]">{vid.name || 'Vídeo registrado'}</span>
                            <span className="text-[10px] text-[#8C867E]">Salvo no dispositivo de origem</span>
                          </div>
                        </div>
                        <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#D5D0C7] hover:bg-[#F2F0EB] text-[#4A443F] text-xs font-medium cursor-pointer transition-all active:scale-95">
                          {loadingVideoId === vid.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4A6741]" />
                          ) : (
                            <Upload className="w-3.5 h-3.5 text-[#4A6741]" />
                          )}
                          <span>Vincular arquivo</span>
                          <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleAttachVideo(e.target.files[0], vid.id);
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-[#FDFCF9] border border-[#F0EDE6] rounded-[32px] p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-[#B83A3A]/10 text-[#B83A3A] flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>

            <h4 className="font-serif text-lg text-[#3D4B38] font-normal mb-1">
              Tem certeza que deseja apagar esta lembrança?
            </h4>
            <p className="text-xs text-[#8C867E] mb-5">
              Ela será movida para a lixeira e você poderá restaurá-la a qualquer momento.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-[#8C867E] hover:bg-[#F8F6F2] transition-colors"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-move-trash"
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-2xl text-xs font-semibold bg-[#B83A3A] text-white hover:bg-[#9B2F2F] transition-colors shadow-md shadow-[#B83A3A]/20"
              >
                Mover para a lixeira
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
