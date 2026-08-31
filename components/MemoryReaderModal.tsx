'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Memory } from '@/types';
import { formatDatePortuguese } from '@/lib/dateUtils';
import { formatDuration } from '@/services/mediaService';
import {
  X,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Type,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Copy,
  Check,
  Edit3,
  Calendar,
  Heart,
  Star,
  Lock,
  MapPin,
  Clock,
  Sparkles,
  Sliders,
  Image as ImageIcon,
  Minimize2,
  Maximize2
} from 'lucide-react';
import Image from 'next/image';

interface MemoryReaderModalProps {
  memory: Memory | null;
  allMemories?: Memory[];
  isOpen: boolean;
  onClose: () => void;
  onSelectMemory?: (memory: Memory) => void;
  onEdit?: (memory: Memory) => void;
}

type ReaderTheme = 'paper' | 'ivory' | 'sage' | 'night' | 'amber';
type ReaderFont = 'serif' | 'sans' | 'poetic' | 'mono';
type ReaderSize = 'sm' | 'md' | 'lg' | 'xl';
type ReaderSpacing = 'normal' | 'relaxed' | 'spacious';
type ReaderWidth = 'narrow' | 'medium' | 'wide';

export const MemoryReaderModal: React.FC<MemoryReaderModalProps> = ({
  memory,
  allMemories = [],
  isOpen,
  onClose,
  onSelectMemory,
  onEdit,
}) => {
  // Reading preferences stored in state / localStorage
  const [theme, setTheme] = useState<ReaderTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pv_reader_theme') as ReaderTheme;
      if (saved) return saved;
    }
    return 'paper';
  });
  const [font, setFont] = useState<ReaderFont>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pv_reader_font') as ReaderFont;
      if (saved) return saved;
    }
    return 'serif';
  });
  const [size, setSize] = useState<ReaderSize>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pv_reader_size') as ReaderSize;
      if (saved) return saved;
    }
    return 'md';
  });
  const [spacing, setSpacing] = useState<ReaderSpacing>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pv_reader_spacing') as ReaderSpacing;
      if (saved) return saved;
    }
    return 'relaxed';
  });
  const [width, setWidth] = useState<ReaderWidth>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pv_reader_width') as ReaderWidth;
      if (saved) return saved;
    }
    return 'medium';
  });
  const [showDropCap, setShowDropCap] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pv_reader_dropcap');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });
  const [showPhoto, setShowPhoto] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pv_reader_photo');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });
  const [showControls, setShowControls] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Audio Ambient sound state
  const [isAmbientPlaying, setIsAmbientPlaying] = useState<boolean>(false);
  const [ambientVolume] = useState<number>(0.2);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ambientNodeRef = useRef<AudioNode | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Save preferences
  const updateTheme = (newTheme: ReaderTheme) => {
    setTheme(newTheme);
    if (typeof window !== 'undefined') localStorage.setItem('pv_reader_theme', newTheme);
  };

  const updateFont = (newFont: ReaderFont) => {
    setFont(newFont);
    if (typeof window !== 'undefined') localStorage.setItem('pv_reader_font', newFont);
  };

  const updateSize = (newSize: ReaderSize) => {
    setSize(newSize);
    if (typeof window !== 'undefined') localStorage.setItem('pv_reader_size', newSize);
  };

  const updateSpacing = (newSpacing: ReaderSpacing) => {
    setSpacing(newSpacing);
    if (typeof window !== 'undefined') localStorage.setItem('pv_reader_spacing', newSpacing);
  };

  const updateWidth = (newWidth: ReaderWidth) => {
    setWidth(newWidth);
    if (typeof window !== 'undefined') localStorage.setItem('pv_reader_width', newWidth);
  };

  const toggleDropCap = () => {
    setShowDropCap((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') localStorage.setItem('pv_reader_dropcap', String(next));
      return next;
    });
  };

  const togglePhoto = () => {
    setShowPhoto((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') localStorage.setItem('pv_reader_photo', String(next));
      return next;
    });
  };

  // Filter active memories in chronological order for next/previous navigation
  const sortedMemories = useMemo(() => {
    return allMemories
      .filter((m) => !m.isDeleted)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allMemories]);

  const currentIndex = useMemo(() => {
    if (!memory) return -1;
    return sortedMemories.findIndex((m) => m.id === memory.id);
  }, [sortedMemories, memory]);

  const previousMemory = useMemo(() => {
    if (currentIndex > 0) return sortedMemories[currentIndex - 1];
    return null;
  }, [sortedMemories, currentIndex]);

  const nextMemory = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < sortedMemories.length - 1) {
      return sortedMemories[currentIndex + 1];
    }
    return null;
  }, [sortedMemories, currentIndex]);

  // Ambient sound synthesizer (gentle warm rain/stream via Web Audio noise)
  const stopAmbient = useCallback(() => {
    try {
      if (ambientNodeRef.current) {
        // @ts-expect-error disconnect Web Audio node
        ambientNodeRef.current.stop?.();
        ambientNodeRef.current.disconnect();
        ambientNodeRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    } catch (e) {
      console.warn('Error stopping ambient sound', e);
    }
    setIsAmbientPlaying(false);
  }, []);

  const startAmbient = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // Generate soft pink/brown noise
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Soft lowpass filter for gentle rain/wind sensation
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 650;

      const gain = ctx.createGain();
      gain.gain.value = ambientVolume;

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start(0);
      ambientNodeRef.current = whiteNoise;
      setIsAmbientPlaying(true);
    } catch (e) {
      console.warn('Web Audio Ambient not supported', e);
    }
  }, [ambientVolume]);

  const toggleAmbient = () => {
    if (isAmbientPlaying) {
      stopAmbient();
    } else {
      startAmbient();
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      try {
        if (ambientNodeRef.current) {
          // @ts-expect-error disconnect Web Audio node
          ambientNodeRef.current.stop?.();
          ambientNodeRef.current.disconnect();
          ambientNodeRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
      } catch (e) {
        console.warn('Error cleaning up audio on unmount', e);
      }
    };
  }, []);

  const handleCloseModal = useCallback(() => {
    stopAmbient();
    onClose();
  }, [stopAmbient, onClose]);

  // Handle scroll progress
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollHeight <= clientHeight) {
      setScrollProgress(100);
      return;
    }
    const progress = Math.min(100, Math.max(0, (scrollTop / (scrollHeight - clientHeight)) * 100));
    setScrollProgress(progress);
  };

  // Scroll to top when memory changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
      setScrollProgress(0);
    }
  }, [memory?.id]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      } else if (e.key === 'ArrowLeft' && previousMemory && onSelectMemory) {
        onSelectMemory(previousMemory);
      } else if (e.key === 'ArrowRight' && nextMemory && onSelectMemory) {
        onSelectMemory(nextMemory);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, previousMemory, nextMemory, handleCloseModal, onSelectMemory]);

  if (!isOpen || !memory) return null;

  // Copy text to clipboard
  const handleCopy = () => {
    const text = `"${memory.title}"\n${formatDatePortuguese(memory.date)} (${memory.calculatedAge})\n\n${memory.content}\n\n— Guardado com amor no Para Você.`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  // Word count and reading time
  const wordCount = memory.content ? memory.content.trim().split(/\s+/).length : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));

  // Theme styling definitions
  const themeClasses: Record<
    ReaderTheme,
    {
      bg: string;
      text: string;
      secondaryText: string;
      mutedText: string;
      border: string;
      cardBg: string;
      accent: string;
      progressBg: string;
    }
  > = {
    paper: {
      bg: 'bg-[#F9F6F0]',
      text: 'text-[#3E342B]',
      secondaryText: 'text-[#6D6257]',
      mutedText: 'text-[#968A7D]',
      border: 'border-[#EAE2D5]',
      cardBg: 'bg-[#F2ECE0]',
      accent: 'text-[#4A6741]',
      progressBg: 'bg-[#8F9F76]',
    },
    ivory: {
      bg: 'bg-[#FFFFFF]',
      text: 'text-[#242823]',
      secondaryText: 'text-[#5C665A]',
      mutedText: 'text-[#8A9687]',
      border: 'border-[#EDEBE6]',
      cardBg: 'bg-[#F7F6F2]',
      accent: 'text-[#3D5235]',
      progressBg: 'bg-[#4A6741]',
    },
    sage: {
      bg: 'bg-[#F2F5F0]',
      text: 'text-[#263525]',
      secondaryText: 'text-[#536652]',
      mutedText: 'text-[#7D947B]',
      border: 'border-[#DFE7DD]',
      cardBg: 'bg-[#E5ECE3]',
      accent: 'text-[#34532E]',
      progressBg: 'bg-[#52774C]',
    },
    night: {
      bg: 'bg-[#181A18]',
      text: 'text-[#E2DFD7]',
      secondaryText: 'text-[#A9A59C]',
      mutedText: 'text-[#726E65]',
      border: 'border-[#2C2F2B]',
      cardBg: 'bg-[#232622]',
      accent: 'text-[#A3B18A]',
      progressBg: 'bg-[#A3B18A]',
    },
    amber: {
      bg: 'bg-[#221C18]',
      text: 'text-[#EADCC8]',
      secondaryText: 'text-[#B8A793]',
      mutedText: 'text-[#7D6E5D]',
      border: 'border-[#39312B]',
      cardBg: 'bg-[#2D2621]',
      accent: 'text-[#E3BE48]',
      progressBg: 'bg-[#D4AF37]',
    },
  };

  const currentTheme = themeClasses[theme];

  // Font family classes
  const fontClass =
    font === 'serif'
      ? 'font-serif'
      : font === 'sans'
      ? 'font-sans'
      : font === 'poetic'
      ? 'font-serif italic'
      : 'font-mono';

  // Size classes
  const sizeClass =
    size === 'sm'
      ? 'text-base sm:text-lg'
      : size === 'md'
      ? 'text-lg sm:text-xl'
      : size === 'lg'
      ? 'text-xl sm:text-2xl'
      : 'text-2xl sm:text-3xl';

  // Spacing classes
  const spacingClass =
    spacing === 'normal'
      ? 'leading-relaxed space-y-4'
      : spacing === 'relaxed'
      ? 'leading-loose space-y-6'
      : 'leading-[2.3] space-y-8';

  // Width classes
  const widthClass =
    width === 'narrow'
      ? 'max-w-xl'
      : width === 'medium'
      ? 'max-w-2xl'
      : 'max-w-3xl';

  // Extract first photo if available
  const firstPhoto = memory.photos?.find((p) => Boolean(p && p.url && p.url.trim() !== ''));

  // Split narrative content into paragraphs
  const paragraphs = (memory.content || '').split('\n').filter((p) => p.trim() !== '');

  return (
    <div
      id="memory-reader-overlay"
      className={`fixed inset-0 z-50 flex flex-col ${currentTheme.bg} transition-colors duration-300 select-text overflow-hidden`}
    >
      {/* Scroll Progress Bar at very top */}
      <div className="w-full h-1 bg-black/5 overflow-hidden fixed top-0 left-0 right-0 z-60">
        <div
          className={`h-full ${currentTheme.progressBg} transition-all duration-150`}
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Top Header / Bar */}
      <header
        className={`px-4 sm:px-8 py-3.5 border-b ${currentTheme.border} flex items-center justify-between z-50 backdrop-blur-xs transition-colors shrink-0`}
      >
        {/* Left: Close & Book Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            id="reader-close-btn"
            type="button"
            onClick={handleCloseModal}
            className={`p-2 rounded-2xl ${currentTheme.cardBg} ${currentTheme.secondaryText} hover:${currentTheme.text} transition-transform active:scale-95 cursor-pointer shadow-2xs`}
            title="Sair do Modo Leitura (Esc)"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-[#4A6741]/10 text-[#4A6741] flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className={`text-[10px] font-serif uppercase tracking-widest ${currentTheme.mutedText} font-bold block truncate`}>
                Modo Leitura • Diário
              </span>
              <h2 className={`text-xs sm:text-sm font-serif font-medium ${currentTheme.text} truncate`}>
                {memory.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Center / Right: Quick Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Ambient Sound Generator Button */}
          <button
            id="reader-ambient-sound-btn"
            type="button"
            onClick={toggleAmbient}
            className={`px-2.5 sm:px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              isAmbientPlaying
                ? 'bg-[#4A6741] text-white shadow-xs'
                : `${currentTheme.cardBg} ${currentTheme.secondaryText} hover:${currentTheme.text}`
            }`}
            title={isAmbientPlaying ? 'Desativar som ambiente de chuva calma' : 'Ouvir som ambiente para foco'}
          >
            {isAmbientPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden md:inline text-[11px] font-medium">
              {isAmbientPlaying ? 'Chuva Calma' : 'Som Foco'}
            </span>
          </button>

          {/* Copy Text Button */}
          <button
            id="reader-copy-text-btn"
            type="button"
            onClick={handleCopy}
            className={`p-2 rounded-2xl ${currentTheme.cardBg} ${currentTheme.secondaryText} hover:${currentTheme.text} transition-colors cursor-pointer`}
            title="Copiar texto da lembrança"
          >
            {copied ? <Check className="w-4 h-4 text-[#4A6741]" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Edit Memory Button (if provided) */}
          {onEdit && (
            <button
              id="reader-edit-btn"
              type="button"
              onClick={() => {
                onClose();
                onEdit(memory);
              }}
              className={`p-2 rounded-2xl ${currentTheme.cardBg} ${currentTheme.secondaryText} hover:${currentTheme.text} transition-colors cursor-pointer`}
              title="Editar esta memória"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}

          {/* Typography Controls Toggle Button */}
          <button
            id="reader-toggle-controls-btn"
            type="button"
            onClick={() => setShowControls(!showControls)}
            className={`px-3 py-1.5 rounded-2xl flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
              showControls
                ? 'bg-[#4A6741] text-white shadow-xs'
                : `${currentTheme.cardBg} ${currentTheme.secondaryText} hover:${currentTheme.text}`
            }`}
            title="Ajustar tipografia e temas"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Aparência</span>
          </button>
        </div>
      </header>

      {/* Floating / Collapsible Typography Settings Drawer */}
      {showControls && (
        <div
          id="reader-controls-panel"
          className={`border-b ${currentTheme.border} ${currentTheme.cardBg} px-4 sm:px-8 py-4 z-40 transition-all shadow-xs`}
        >
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* 1. Theme Selection */}
            <div>
              <span className={`block font-semibold uppercase tracking-wider text-[10px] ${currentTheme.mutedText} mb-2`}>
                Ambiente de Leitura
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => updateTheme('paper')}
                  className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-all ${
                    theme === 'paper'
                      ? 'bg-[#FAF6EE] text-[#3E342B] border-[#D4C7B4] font-bold shadow-xs'
                      : 'bg-white/60 text-[#6D6257] border-transparent hover:bg-white'
                  }`}
                >
                  📜 Sépia
                </button>
                <button
                  type="button"
                  onClick={() => updateTheme('ivory')}
                  className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-all ${
                    theme === 'ivory'
                      ? 'bg-white text-[#242823] border-[#D0D4CE] font-bold shadow-xs'
                      : 'bg-white/60 text-[#5C665A] border-transparent hover:bg-white'
                  }`}
                >
                  📖 Branco
                </button>
                <button
                  type="button"
                  onClick={() => updateTheme('sage')}
                  className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-all ${
                    theme === 'sage'
                      ? 'bg-[#F2F5F0] text-[#263525] border-[#BDD0BA] font-bold shadow-xs'
                      : 'bg-white/60 text-[#536652] border-transparent hover:bg-white'
                  }`}
                >
                  🌿 Sálvia
                </button>
                <button
                  type="button"
                  onClick={() => updateTheme('night')}
                  className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-all ${
                    theme === 'night'
                      ? 'bg-[#181A18] text-[#E2DFD7] border-[#424740] font-bold shadow-xs'
                      : 'bg-black/20 text-[#A9A59C] border-transparent hover:bg-black/40'
                  }`}
                >
                  🌙 Noite
                </button>
              </div>
            </div>

            {/* 2. Font Style */}
            <div>
              <span className={`block font-semibold uppercase tracking-wider text-[10px] ${currentTheme.mutedText} mb-2`}>
                Fonte
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => updateFont('serif')}
                  className={`px-2.5 py-1 rounded-xl text-left font-serif transition-all ${
                    font === 'serif'
                      ? 'bg-white/90 text-[#3D4B38] font-bold shadow-xs'
                      : `${currentTheme.secondaryText} hover:bg-white/40`
                  }`}
                >
                  Serifada
                </button>
                <button
                  type="button"
                  onClick={() => updateFont('sans')}
                  className={`px-2.5 py-1 rounded-xl text-left font-sans transition-all ${
                    font === 'sans'
                      ? 'bg-white/90 text-[#3D4B38] font-bold shadow-xs'
                      : `${currentTheme.secondaryText} hover:bg-white/40`
                  }`}
                >
                  Moderna
                </button>
                <button
                  type="button"
                  onClick={() => updateFont('poetic')}
                  className={`px-2.5 py-1 rounded-xl text-left font-serif italic transition-all ${
                    font === 'poetic'
                      ? 'bg-white/90 text-[#3D4B38] font-bold shadow-xs'
                      : `${currentTheme.secondaryText} hover:bg-white/40`
                  }`}
                >
                  Poética
                </button>
                <button
                  type="button"
                  onClick={() => updateFont('mono')}
                  className={`px-2.5 py-1 rounded-xl text-left font-mono transition-all ${
                    font === 'mono'
                      ? 'bg-white/90 text-[#3D4B38] font-bold shadow-xs'
                      : `${currentTheme.secondaryText} hover:bg-white/40`
                  }`}
                >
                  Máquina
                </button>
              </div>
            </div>

            {/* 3. Text Size & Line Spacing */}
            <div>
              <span className={`block font-semibold uppercase tracking-wider text-[10px] ${currentTheme.mutedText} mb-2`}>
                Tamanho & Entrelinha
              </span>
              <div className="flex items-center gap-1 mb-2">
                <button
                  type="button"
                  onClick={() => updateSize('sm')}
                  className={`flex-1 py-1 rounded-xl text-center text-xs transition-all ${
                    size === 'sm' ? 'bg-white text-[#3D4B38] font-bold shadow-xs' : currentTheme.secondaryText
                  }`}
                >
                  P
                </button>
                <button
                  type="button"
                  onClick={() => updateSize('md')}
                  className={`flex-1 py-1 rounded-xl text-center text-xs transition-all ${
                    size === 'md' ? 'bg-white text-[#3D4B38] font-bold shadow-xs' : currentTheme.secondaryText
                  }`}
                >
                  M
                </button>
                <button
                  type="button"
                  onClick={() => updateSize('lg')}
                  className={`flex-1 py-1 rounded-xl text-center text-xs transition-all ${
                    size === 'lg' ? 'bg-white text-[#3D4B38] font-bold shadow-xs' : currentTheme.secondaryText
                  }`}
                >
                  G
                </button>
                <button
                  type="button"
                  onClick={() => updateSize('xl')}
                  className={`flex-1 py-1 rounded-xl text-center text-xs transition-all ${
                    size === 'xl' ? 'bg-white text-[#3D4B38] font-bold shadow-xs' : currentTheme.secondaryText
                  }`}
                >
                  GG
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => updateSpacing('normal')}
                  className={`flex-1 py-1 rounded-xl text-center text-[10px] transition-all ${
                    spacing === 'normal' ? 'bg-white text-[#3D4B38] font-bold shadow-xs' : currentTheme.secondaryText
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => updateSpacing('relaxed')}
                  className={`flex-1 py-1 rounded-xl text-center text-[10px] transition-all ${
                    spacing === 'relaxed' ? 'bg-white text-[#3D4B38] font-bold shadow-xs' : currentTheme.secondaryText
                  }`}
                >
                  Ampla
                </button>
                <button
                  type="button"
                  onClick={() => updateSpacing('spacious')}
                  className={`flex-1 py-1 rounded-xl text-center text-[10px] transition-all ${
                    spacing === 'spacious' ? 'bg-white text-[#3D4B38] font-bold shadow-xs' : currentTheme.secondaryText
                  }`}
                >
                  Espaçosa
                </button>
              </div>
            </div>

            {/* 4. Reading Layout Toggles */}
            <div>
              <span className={`block font-semibold uppercase tracking-wider text-[10px] ${currentTheme.mutedText} mb-2`}>
                Opções Adicionais
              </span>
              <div className="space-y-1.5">
                <label className="flex items-center justify-between cursor-pointer p-1 rounded-lg hover:bg-white/30">
                  <span className={`${currentTheme.secondaryText} text-[11px]`}>Letra Capitular</span>
                  <input
                    type="checkbox"
                    checked={showDropCap}
                    onChange={toggleDropCap}
                    className="accent-[#4A6741] rounded cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer p-1 rounded-lg hover:bg-white/30">
                  <span className={`${currentTheme.secondaryText} text-[11px]`}>Exibir Fotografia</span>
                  <input
                    type="checkbox"
                    checked={showPhoto}
                    onChange={togglePhoto}
                    className="accent-[#4A6741] rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Immersive Reader Canvas */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 sm:py-16 flex flex-col items-center"
      >
        <article className={`w-full ${widthClass} mx-auto transition-all duration-300 pb-20`}>
          {/* Top Metadata Header */}
          <div className="mb-8 sm:mb-12 text-center space-y-3">
            {/* Badges / Moods / Milestone */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${currentTheme.cardBg} ${currentTheme.accent} border ${currentTheme.border}`}>
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDatePortuguese(memory.date)}</span>
              </span>

              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${currentTheme.cardBg} ${currentTheme.secondaryText} border ${currentTheme.border}`}>
                {memory.calculatedAge}
              </span>

              {memory.isSpecial && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-[#D4AF37]/15 text-[#B8932E] border border-[#D4AF37]/30 font-semibold">
                  <Heart className="w-3.5 h-3.5 fill-[#D4AF37]" />
                  <span>Momento Especial</span>
                </span>
              )}

              {memory.isFirstTime && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-[#D4AF37]/15 text-[#B8932E] border border-[#D4AF37]/30 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
                  <span>{memory.firstTimeCategory || 'Primeira Vez'}</span>
                </span>
              )}

              {memory.isFutureLocked && (
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${currentTheme.cardBg} ${currentTheme.mutedText} border ${currentTheme.border}`}>
                  <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Cápsula do Futuro {memory.unlockAge ? `(${memory.unlockAge} anos)` : ''}</span>
                </span>
              )}
            </div>

            {/* Story Title */}
            <h1
              className={`font-serif text-3xl sm:text-4xl md:text-5xl ${currentTheme.text} font-normal leading-tight tracking-tight mt-3 mb-2`}
            >
              {memory.title}
            </h1>

            {/* Sub-header details (location, author, reading stats) */}
            <div className={`flex flex-wrap items-center justify-center gap-3 text-xs ${currentTheme.mutedText} font-serif italic`}>
              {memory.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{memory.location}</span>
                </span>
              )}
              {memory.time && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{memory.time}</span>
                </span>
              )}
              <span>•</span>
              <span>{readingTimeMinutes} min de leitura ({wordCount} palavras)</span>
            </div>

            {/* Subtle Divider Ornament */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <span className={`w-8 h-px ${currentTheme.border}`} />
              <span className={`text-[10px] ${currentTheme.mutedText}`}>❦</span>
              <span className={`w-8 h-px ${currentTheme.border}`} />
            </div>
          </div>

          {/* Optional Editorial Photo Vignette */}
          {showPhoto && firstPhoto && firstPhoto.url && (
            <div className="mb-10 text-center">
              <div className="relative inline-block w-full max-w-lg aspect-4/3 sm:aspect-16/10 rounded-2xl overflow-hidden shadow-md border border-black/10 bg-black/5 mx-auto">
                <Image
                  src={firstPhoto.url}
                  alt={memory.title}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              {firstPhoto.caption && (
                <p className={`text-xs ${currentTheme.mutedText} font-serif italic mt-2 text-center`}>
                  {firstPhoto.caption}
                </p>
              )}
            </div>
          )}

          {/* Audio Voice Memo Player in Reader Mode */}
          {memory.audios && memory.audios.length > 0 && (
            <div className={`mb-8 p-4 rounded-2xl ${currentTheme.cardBg} border ${currentTheme.border} shadow-2xs`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-serif uppercase tracking-widest ${currentTheme.mutedText} font-bold flex items-center gap-1.5`}>
                  <Volume2 className="w-3.5 h-3.5 text-[#4A6741]" />
                  <span>Gravação de Voz da Lembrança</span>
                </span>
                <span className={`text-[11px] ${currentTheme.secondaryText}`}>
                  {formatDuration(memory.audios[0].duration)}
                </span>
              </div>
              <audio
                controls
                src={memory.audios[0].url}
                className="w-full h-8"
              />
            </div>
          )}

          {/* Main Story Narrative Typography */}
          <div className={`${fontClass} ${sizeClass} ${spacingClass} ${currentTheme.text} antialiased`}>
            {paragraphs.map((para, index) => {
              // Apply Drop Cap to first paragraph if enabled
              if (index === 0 && showDropCap && para.length > 0) {
                const firstChar = para.charAt(0);
                const restOfPara = para.slice(1);
                return (
                  <p key={index} className="text-justify sm:text-left">
                    <span
                      className={`float-left text-4xl sm:text-5xl md:text-6xl leading-[0.8] font-serif font-bold mr-3 mt-1 ${currentTheme.accent} select-none`}
                    >
                      {firstChar}
                    </span>
                    {restOfPara}
                  </p>
                );
              }

              return (
                <p key={index} className="text-justify sm:text-left">
                  {para}
                </p>
              );
            })}
          </div>

          {/* Author Footnote Signature */}
          <div className={`mt-12 sm:mt-16 pt-6 border-t ${currentTheme.border} flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${currentTheme.mutedText}`}>
            <div className="font-serif italic">
              {memory.authorName ? (
                <span>
                  Registrado com carinho por{' '}
                  <strong className={`${currentTheme.text} font-semibold not-italic`}>
                    {memory.authorName}
                  </strong>
                </span>
              ) : (
                <span>Registrado com carinho no diário da vida</span>
              )}
            </div>
            <span className="text-[11px] tracking-wide">
              {currentIndex >= 0 && sortedMemories.length > 0
                ? `Memória ${currentIndex + 1} de ${sortedMemories.length}`
                : 'Para Você'}
            </span>
          </div>

          {/* Bottom Flip / Pagination Controls */}
          <div className={`mt-8 p-4 rounded-3xl ${currentTheme.cardBg} border ${currentTheme.border} flex items-center justify-between gap-4 shadow-2xs`}>
            {/* Previous Memory */}
            {previousMemory && onSelectMemory ? (
              <button
                id="reader-prev-memory-btn"
                type="button"
                onClick={() => onSelectMemory(previousMemory)}
                className={`flex-1 text-left p-2 sm:p-3 rounded-2xl hover:bg-black/5 transition-colors cursor-pointer flex items-center gap-2 sm:gap-3 group`}
              >
                <div className={`w-8 h-8 rounded-full ${currentTheme.bg} flex items-center justify-center ${currentTheme.secondaryText} group-hover:${currentTheme.accent} transition-colors shrink-0 shadow-2xs`}>
                  <ChevronLeft className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className={`text-[10px] uppercase font-serif tracking-wider ${currentTheme.mutedText} block`}>
                    Anterior
                  </span>
                  <span className={`text-xs font-serif font-medium ${currentTheme.text} truncate block group-hover:${currentTheme.accent}`}>
                    {previousMemory.title}
                  </span>
                </div>
              </button>
            ) : (
              <div className="flex-1" />
            )}

            {/* Center Book Counter */}
            <div className="text-center px-2 shrink-0">
              <span className={`text-[10px] uppercase font-serif tracking-widest ${currentTheme.mutedText} font-semibold block`}>
                Diário
              </span>
              <span className={`text-xs font-serif ${currentTheme.secondaryText}`}>
                {currentIndex + 1} / {sortedMemories.length}
              </span>
            </div>

            {/* Next Memory */}
            {nextMemory && onSelectMemory ? (
              <button
                id="reader-next-memory-btn"
                type="button"
                onClick={() => onSelectMemory(nextMemory)}
                className={`flex-1 text-right p-2 sm:p-3 rounded-2xl hover:bg-black/5 transition-colors cursor-pointer flex items-center justify-end gap-2 sm:gap-3 group`}
              >
                <div className="min-w-0">
                  <span className={`text-[10px] uppercase font-serif tracking-wider ${currentTheme.mutedText} block`}>
                    Próxima
                  </span>
                  <span className={`text-xs font-serif font-medium ${currentTheme.text} truncate block group-hover:${currentTheme.accent}`}>
                    {nextMemory.title}
                  </span>
                </div>
                <div className={`w-8 h-8 rounded-full ${currentTheme.bg} flex items-center justify-center ${currentTheme.secondaryText} group-hover:${currentTheme.accent} transition-colors shrink-0 shadow-2xs`}>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </article>
      </div>
    </div>
  );
};
