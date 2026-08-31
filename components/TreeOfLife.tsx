'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Memory, ChildProfile } from '@/types';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Calendar,
  Heart,
  ChevronRight,
  Plus,
  Video,
  Mic,
  Trees,
  Leaf,
  Info,
  ArrowRight,
} from 'lucide-react';
import { formatDatePortuguese, getLifeStage, calculateAgePortuguese } from '@/lib/dateUtils';
import Image from 'next/image';

interface TreeOfLifeProps {
  memories: Memory[];
  childProfile: ChildProfile;
  onSelectMemory: (memory: Memory) => void;
  onOpenAddMemory?: () => void;
  onOpenFullTree?: () => void;
  isFullView?: boolean;
}

// Stage classification for branches
interface StageBranchDef {
  id: string;
  name: string;
  shortName: string;
  ageRange: string;
  desc: string;
  color: string;
}

const STAGE_BRANCHES: StageBranchDef[] = [
  {
    id: 'baby',
    name: 'Primeiros Dias & Bebê',
    shortName: '0 a 1 ano',
    ageRange: '0–12 meses',
    desc: 'O nascimento, os primeiros sorrisos e o acolhimento no mundo.',
    color: '#8F9F76',
  },
  {
    id: 'toddler',
    name: 'Primeiros Passos',
    shortName: '1 a 3 anos',
    ageRange: '1–3 anos',
    desc: 'Primeiras palavras, passos corajosos e explorações pelo chão.',
    color: '#4A6741',
  },
  {
    id: 'early_childhood',
    name: 'Primeira Infância',
    shortName: '3 a 6 anos',
    ageRange: '3–6 anos',
    desc: 'Imaginação fértil, perguntas sem fim, brincadeiras e amigos.',
    color: '#588157',
  },
  {
    id: 'school_childhood',
    name: 'Infância & Escola',
    shortName: '6 a 12 anos',
    ageRange: '6–12 anos',
    desc: 'Descobertas na escola, autonomia, livros e primeiras paixões.',
    color: '#3A5A40',
  },
  {
    id: 'adolescence_future',
    name: 'Copa dos Sonhos & 15 Anos',
    shortName: '15 anos & Futuro',
    ageRange: '15+ anos',
    desc: 'Lembranças trancadas e desejos para a vida inteira.',
    color: '#D4AF37',
  },
];

interface LeafNode {
  memory: Memory;
  x: number;
  y: number;
  angle: number;
  stageId: string;
  color: string;
  isGold: boolean;
  size: number;
  branchIndex: number;
}

export const TreeOfLife: React.FC<TreeOfLifeProps> = ({
  memories,
  childProfile,
  onSelectMemory,
  onOpenAddMemory,
  onOpenFullTree,
  isFullView = false,
}) => {
  const [selectedLeafId, setSelectedLeafId] = useState<string | null>(null);
  const [activeStageFilter, setActiveStageFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'tree' | 'gallery'>('tree');
  const [showStageInfo, setShowStageInfo] = useState<boolean>(false);

  // Active (non-deleted) memories
  const activeMemories = useMemo(() => {
    return memories.filter((m) => !m.isDeleted);
  }, [memories]);

  const memoryCount = activeMemories.length;

  // Determine tree maturity level
  const treeLevel = useMemo(() => {
    if (memoryCount === 0) return 0;
    if (memoryCount <= 5) return 1;
    if (memoryCount <= 15) return 2;
    if (memoryCount <= 30) return 3;
    return 4;
  }, [memoryCount]);

  const treeLevelLabel = useMemo(() => {
    switch (treeLevel) {
      case 0:
        return 'Sementeira Pronta';
      case 1:
        return 'Broto Inicial';
      case 2:
        return 'Árvore Jovem';
      case 3:
        return 'Árvore Florescente';
      case 4:
      default:
        return 'Grande Árvore da Vida';
    }
  }, [treeLevel]);

  // Map each memory to a life stage
  const getStageForMemory = useCallback((memory: Memory): string => {
    if (memory.isFutureLocked && (memory.unlockAge === 15 || memory.unlockAge === 18)) {
      return 'adolescence_future';
    }
    if (!childProfile.birthDate) return 'baby';

    const stageName = getLifeStage(childProfile.birthDate, memory.date);
    if (stageName === 'Nascimento' || stageName === 'Primeiro ano') return 'baby';
    if (stageName === '1–2 anos' || stageName === '2–3 anos') return 'toddler';
    if (stageName === '3–5 anos') return 'early_childhood';
    if (stageName === '5–10 anos' || stageName === '10–15 anos') return 'school_childhood';
    return 'adolescence_future';
  }, [childProfile.birthDate]);

  // Pre-calculate leaf positions along tree branches
  const leafNodes: LeafNode[] = useMemo(() => {
    const stageAnchors: Record<string, { x: number; y: number; angle: number }[]> = {
      baby: [
        { x: 140, y: 255, angle: -35 },
        { x: 260, y: 250, angle: 35 },
        { x: 115, y: 270, angle: -45 },
        { x: 285, y: 265, angle: 45 },
        { x: 165, y: 240, angle: -20 },
        { x: 235, y: 240, angle: 20 },
      ],
      toddler: [
        { x: 110, y: 205, angle: -40 },
        { x: 290, y: 200, angle: 40 },
        { x: 80, y: 190, angle: -55 },
        { x: 320, y: 185, angle: 55 },
        { x: 145, y: 195, angle: -25 },
        { x: 255, y: 190, angle: 25 },
        { x: 125, y: 175, angle: -30 },
        { x: 275, y: 170, angle: 30 },
      ],
      early_childhood: [
        { x: 120, y: 140, angle: -30 },
        { x: 280, y: 135, angle: 30 },
        { x: 90, y: 125, angle: -50 },
        { x: 310, y: 120, angle: 50 },
        { x: 155, y: 130, angle: -15 },
        { x: 245, y: 125, angle: 15 },
        { x: 70, y: 110, angle: -65 },
        { x: 330, y: 105, angle: 65 },
      ],
      school_childhood: [
        { x: 140, y: 85, angle: -25 },
        { x: 260, y: 80, angle: 25 },
        { x: 170, y: 65, angle: -10 },
        { x: 230, y: 60, angle: 10 },
        { x: 110, y: 70, angle: -45 },
        { x: 290, y: 65, angle: 45 },
      ],
      adolescence_future: [
        { x: 200, y: 35, angle: 0 },
        { x: 175, y: 45, angle: -15 },
        { x: 225, y: 40, angle: 15 },
        { x: 150, y: 50, angle: -30 },
        { x: 250, y: 45, angle: 30 },
      ],
    };

    const stageCounts: Record<string, number> = {
      baby: 0,
      toddler: 0,
      early_childhood: 0,
      school_childhood: 0,
      adolescence_future: 0,
    };

    return activeMemories.map((mem, idx) => {
      const stageId = getStageForMemory(mem);
      const anchors = stageAnchors[stageId] || stageAnchors.baby;
      const count = stageCounts[stageId] || 0;
      stageCounts[stageId] = count + 1;

      const baseAnchor = anchors[count % anchors.length];
      const jitterX = ((idx * 17) % 18) - 9;
      const jitterY = ((idx * 13) % 14) - 7;
      const jitterAngle = ((idx * 23) % 20) - 10;

      const isGold = Boolean(mem.isSpecial || mem.isFirstTime || mem.isFutureLocked);
      const baseColor = isGold
        ? '#D4AF37'
        : stageId === 'baby'
        ? '#8F9F76'
        : stageId === 'toddler'
        ? '#4A6741'
        : stageId === 'early_childhood'
        ? '#588157'
        : '#3A5A40';

      return {
        memory: mem,
        x: Math.max(40, Math.min(360, baseAnchor.x + jitterX)),
        y: Math.max(30, Math.min(330, baseAnchor.y + jitterY)),
        angle: baseAnchor.angle + jitterAngle,
        stageId,
        color: baseColor,
        isGold,
        size: isGold ? 12 : 10,
        branchIndex: count,
      };
    });
  }, [activeMemories, getStageForMemory]);

  const selectedNode = useMemo(() => {
    if (!selectedLeafId) return null;
    return leafNodes.find((n) => n.memory.id === selectedLeafId) || null;
  }, [selectedLeafId, leafNodes]);

  const visibleLeafNodes = useMemo(() => {
    if (activeStageFilter === 'all') return leafNodes;
    if (activeStageFilter === 'gold') return leafNodes.filter((n) => n.isGold);
    return leafNodes.filter((n) => n.stageId === activeStageFilter);
  }, [leafNodes, activeStageFilter]);

  const goldenCount = useMemo(() => leafNodes.filter((n) => n.isGold).length, [leafNodes]);
  const childName = childProfile.name ? childProfile.name.trim().split(' ')[0] : 'Sua filha';
  const childAgeFormatted = calculateAgePortuguese(childProfile.birthDate);

  return (
    <section
      id="minha-arvore-section"
      className="bg-[#FAF8F5] rounded-[32px] border border-[#EBE4D5] p-4 sm:p-7 relative overflow-hidden transition-all shadow-xs"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#4A6741]/10 border border-[#4A6741]/20 flex items-center justify-center text-[#4A6741] shrink-0 shadow-2xs">
            <Trees className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-[#8C867E] font-bold block">
                Árvore da Vida
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#4A6741] bg-[#4A6741]/10 border border-[#4A6741]/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5 text-[#D4AF37]" />
                {treeLevelLabel}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif text-[#3D4B38] font-normal leading-tight mt-0.5">
              Minha Árvore
            </h2>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View Mode Toggle */}
          <div className="inline-flex items-center bg-white p-0.5 rounded-full border border-[#E5DFD5] shadow-2xs text-xs">
            <button
              type="button"
              id="tree-view-toggle-visual"
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                viewMode === 'tree'
                  ? 'bg-[#4A6741] text-white shadow-2xs font-semibold'
                  : 'text-[#8C867E] hover:text-[#4A6741]'
              }`}
            >
              Árvore
            </button>
            <button
              type="button"
              id="tree-view-toggle-gallery"
              onClick={() => setViewMode('gallery')}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                viewMode === 'gallery'
                  ? 'bg-[#4A6741] text-white shadow-2xs font-semibold'
                  : 'text-[#8C867E] hover:text-[#4A6741]'
              }`}
            >
              Galeria ({memoryCount})
            </button>
          </div>

          {/* Info Toggle */}
          <button
            type="button"
            id="tree-info-btn"
            onClick={() => setShowStageInfo(!showStageInfo)}
            title="Sobre a metáfora da árvore"
            className="w-8 h-8 rounded-full bg-white border border-[#E5DFD5] text-[#8C867E] hover:text-[#4A6741] flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Quick Add Memory */}
          {onOpenAddMemory && (
            <button
              type="button"
              id="tree-add-leaf-btn"
              onClick={onOpenAddMemory}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#4A6741] text-white hover:bg-[#3D5436] text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nova Folha</span>
            </button>
          )}
        </div>
      </div>

      {/* Narrative Subtitle */}
      <p className="text-xs sm:text-sm text-[#6B655D] mb-4 leading-relaxed font-serif italic">
        &ldquo;As raízes representam suas origens e o amor da sua família; o tronco sustenta seu crescimento; e cada folha viva é um momento especial guardado para você florescer.&rdquo;
      </p>

      {/* Stage Info Box */}
      <AnimatePresence>
        {showStageInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="p-4 bg-white rounded-2xl border border-[#E8E2D5] space-y-2 text-xs text-[#6B655D] shadow-xs">
              <div className="flex items-center justify-between font-semibold text-[#3D4B38]">
                <span className="flex items-center gap-1.5">
                  <Leaf className="w-4 h-4 text-[#4A6741]" />
                  Como a sua árvore cresce:
                </span>
                <span className="text-[11px] text-[#8C867E]" suppressHydrationWarning>{childAgeFormatted}</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[#F2EDE4]">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#5D4037] mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-[#4A443F]">Raízes:</strong> A base da vida — laços de família e amor.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#8F9F76] mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-[#4A443F]">Galhos Inferiores:</strong> 0 a 1 ano (primeiro banho, sorrisos, mamadas).
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#4A6741] mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-[#4A443F]">Galhos Médios:</strong> 1 a 6 anos (primeiros passos, palavras, escolinha).
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-[#4A443F]">Folhas Douradas:</strong> Primeiras vezes e cápsula dos 15 anos.
                  </div>
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveStageFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeStageFilter === 'all'
              ? 'bg-[#4A6741] text-white shadow-2xs'
              : 'bg-white text-[#8C867E] hover:text-[#4A6741] border border-[#E5DFD5]'
          }`}
        >
          Todas as Folhas ({leafNodes.length})
        </button>

        {STAGE_BRANCHES.map((stage) => {
          const count = leafNodes.filter((n) => n.stageId === stage.id).length;
          const isActive = activeStageFilter === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setActiveStageFilter(isActive ? 'all' : stage.id)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-[#3D4B38] text-white shadow-2xs font-semibold'
                  : 'bg-white text-[#6B655D] hover:text-[#3D4B38] border border-[#E5DFD5]'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: stage.color }}
              />
              <span>{stage.shortName}</span>
              <span className={`text-[10px] ${isActive ? 'text-white/80' : 'text-[#8C867E]'}`}>
                ({count})
              </span>
            </button>
          );
        })}

        {goldenCount > 0 && (
          <button
            type="button"
            onClick={() => setActiveStageFilter(activeStageFilter === 'gold' ? 'all' : 'gold')}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeStageFilter === 'gold'
                ? 'bg-[#D4AF37] text-white shadow-2xs font-semibold'
                : 'bg-[#D4AF37]/15 text-[#B8932E] hover:bg-[#D4AF37]/25 border border-[#D4AF37]/30 font-medium'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Douradas ({goldenCount})</span>
          </button>
        )}
      </div>

      {/* Main View Area */}
      {viewMode === 'tree' ? (
        <div className="relative flex flex-col items-center">
          {/* Lightweight Vector Tree Canvas */}
          <div
            id="tree-svg-viewport"
            className="w-full max-w-[480px] h-[320px] sm:h-[380px] relative flex items-center justify-center select-none"
          >
            <svg
              viewBox="0 0 400 380"
              className="w-full h-full overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="trunkGrad" x1="200" y1="360" x2="200" y2="120" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#4E342E" />
                  <stop offset="50%" stopColor="#5D4037" />
                  <stop offset="100%" stopColor="#795548" />
                </linearGradient>

                <radialGradient id="rootsSoilGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#5D4037" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#8D6E63" stopOpacity="0.2" />
                </radialGradient>
              </defs>

              {/* 1. Fertile Soil & Roots Foundation */}
              <g id="tree-roots-foundation">
                <ellipse cx="200" cy="352" rx="140" ry="16" fill="url(#rootsSoilGrad)" />

                {/* Primary Roots */}
                <path d="M175 335 C150 348, 120 355, 80 365" stroke="#4E342E" strokeWidth="4" strokeLinecap="round" />
                <path d="M185 340 C165 355, 140 365, 120 375" stroke="#5D4037" strokeWidth="3" strokeLinecap="round" />
                <path d="M200 342 C200 358, 195 368, 190 376" stroke="#5D4037" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M215 340 C235 355, 260 365, 280 375" stroke="#5D4037" strokeWidth="3" strokeLinecap="round" />
                <path d="M225 335 C250 348, 280 355, 320 365" stroke="#4E342E" strokeWidth="4" strokeLinecap="round" />

                {/* Fine root fibers */}
                <path d="M100 358 C85 365, 65 368, 50 372" stroke="#8D6E63" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                <path d="M300 358 C315 365, 335 368, 350 372" stroke="#8D6E63" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

                {/* Root Foundation Heart Badge */}
                <circle cx="200" cy="350" r="9" fill="#FDFBF7" stroke="#8D6E63" strokeWidth="1.2" />
                <g transform="translate(195.5, 345.5)">
                  <Heart className="w-2.5 h-2.5 text-[#8F9F76] fill-[#8F9F76]" />
                </g>
              </g>

              {/* 2. Trunk Structure */}
              <g id="tree-trunk-core">
                <path
                  d="M180 342 C184 280, 186 230, 192 180 C194 150, 196 120, 200 90 C204 120, 206 150, 208 180 C214 230, 216 280, 220 342 Z"
                  fill="url(#trunkGrad)"
                  stroke="#3E2723"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />

                {/* Trunk Bark Lines */}
                <path d="M192 320 C195 290, 194 250, 197 210" stroke="#3E2723" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
                <path d="M200 330 C202 280, 201 230, 202 170" stroke="#3E2723" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
                <path d="M208 320 C205 290, 206 250, 203 210" stroke="#3E2723" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />

                {/* Initial Badge on Trunk */}
                <circle cx="200" cy="275" r="9" fill="#4E342E" stroke="#8D6E63" strokeWidth="1" />
                <text
                  x="200"
                  y="279"
                  textAnchor="middle"
                  fill="#EFEBE9"
                  fontSize="9"
                  fontFamily="serif"
                  fontWeight="bold"
                >
                  {childName[0] || '♥'}
                </text>
              </g>

              {/* 3. Branching Systems */}
              <g id="tree-branches">
                {/* 0-1 Year (Lower) */}
                <path d="M190 280 C165 270, 130 270, 100 280" stroke="#5D4037" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M210 275 C235 265, 270 265, 300 275" stroke="#5D4037" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M140 273 C120 260, 100 255, 80 265" stroke="#795548" strokeWidth="2" strokeLinecap="round" />
                <path d="M260 268 C280 255, 300 250, 320 260" stroke="#795548" strokeWidth="2" strokeLinecap="round" />

                {/* 1-3 Years */}
                <path d="M192 230 C155 210, 110 210, 70 200" stroke="#5D4037" strokeWidth="3.8" strokeLinecap="round" />
                <path d="M208 225 C245 205, 290 205, 330 195" stroke="#5D4037" strokeWidth="3.8" strokeLinecap="round" />
                <path d="M130 215 C110 190, 85 180, 60 185" stroke="#795548" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M270 210 C290 185, 315 175, 340 180" stroke="#795548" strokeWidth="2.2" strokeLinecap="round" />

                {/* 3-6 Years */}
                <path d="M194 175 C160 150, 120 140, 80 130" stroke="#5D4037" strokeWidth="3.2" strokeLinecap="round" />
                <path d="M206 170 C240 145, 280 135, 320 125" stroke="#5D4037" strokeWidth="3.2" strokeLinecap="round" />
                <path d="M140 155 C120 130, 95 115, 70 115" stroke="#795548" strokeWidth="2" strokeLinecap="round" />
                <path d="M260 150 C280 125, 305 110, 330 110" stroke="#795548" strokeWidth="2" strokeLinecap="round" />

                {/* 6-12 Years */}
                <path d="M196 130 C175 95, 140 85, 110 80" stroke="#5D4037" strokeWidth="2.8" strokeLinecap="round" />
                <path d="M204 125 C225 90, 260 80, 290 75" stroke="#5D4037" strokeWidth="2.8" strokeLinecap="round" />

                {/* 15 Years & Top Crown */}
                <path d="M198 90 C190 60, 175 45, 160 35" stroke="#795548" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M202 90 C210 60, 225 45, 240 35" stroke="#795548" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M200 80 C200 50, 200 35, 200 25" stroke="#795548" strokeWidth="2" strokeLinecap="round" />
              </g>

              {/* 4. Fallback Buds if 0 memories */}
              {memoryCount === 0 && (
                <g id="seedling-buds" opacity="0.6">
                  <circle cx="200" cy="25" r="6" fill="#D4AF37" />
                  <ellipse cx="160" cy="35" rx="7" ry="4" fill="#8F9F76" transform="rotate(-30 160 35)" />
                  <ellipse cx="240" cy="35" rx="7" ry="4" fill="#4A6741" transform="rotate(30 240 35)" />
                  <ellipse cx="110" cy="80" rx="8" ry="5" fill="#8F9F76" transform="rotate(-40 110 80)" />
                  <ellipse cx="290" cy="75" rx="8" ry="5" fill="#4A6741" transform="rotate(40 290 75)" />
                  <ellipse cx="80" cy="130" rx="8" ry="5" fill="#588157" transform="rotate(-50 80 130)" />
                  <ellipse cx="320" cy="125" rx="8" ry="5" fill="#588157" transform="rotate(50 320 125)" />
                </g>
              )}

              {/* 5. Memory Leaves */}
              <g id="tree-memory-leaves">
                {leafNodes.map((leaf) => {
                  const isSelected = selectedLeafId === leaf.memory.id;
                  const isDimmed =
                    activeStageFilter !== 'all' &&
                    (activeStageFilter === 'gold'
                      ? !leaf.isGold
                      : leaf.stageId !== activeStageFilter);

                  return (
                    <g
                      key={leaf.memory.id}
                      id={`tree-leaf-${leaf.memory.id}`}
                      onClick={() => setSelectedLeafId(isSelected ? null : leaf.memory.id)}
                      className={`cursor-pointer transition-opacity duration-200 ${
                        isDimmed ? 'opacity-20 pointer-events-none' : 'opacity-100'
                      }`}
                    >
                      {/* Selection Ring */}
                      {isSelected && (
                        <circle
                          cx={leaf.x}
                          cy={leaf.y}
                          r={leaf.size + 4}
                          fill="none"
                          stroke="#2C3E26"
                          strokeWidth="1.5"
                        />
                      )}

                      {/* Leaf Vector */}
                      <path
                        d={`M ${leaf.x} ${leaf.y - leaf.size} 
                           C ${leaf.x + leaf.size * 0.85} ${leaf.y - leaf.size * 0.4}, 
                             ${leaf.x + leaf.size * 0.85} ${leaf.y + leaf.size * 0.6}, 
                             ${leaf.x} ${leaf.y + leaf.size} 
                           C ${leaf.x - leaf.size * 0.85} ${leaf.y + leaf.size * 0.6}, 
                             ${leaf.x - leaf.size * 0.85} ${leaf.y - leaf.size * 0.4}, 
                             ${leaf.x} ${leaf.y - leaf.size} Z`}
                        transform={`rotate(${leaf.angle}, ${leaf.x}, ${leaf.y})`}
                        fill={leaf.isGold ? '#E3BE48' : leaf.color}
                        stroke={isSelected ? '#2C3E26' : leaf.isGold ? '#B88F1E' : '#2D4426'}
                        strokeWidth={isSelected ? '1.8' : '0.8'}
                      />

                      {/* Small center pip */}
                      {leaf.isGold ? (
                        <circle cx={leaf.x} cy={leaf.y} r={2} fill="#FFF9E6" />
                      ) : leaf.memory.videos && leaf.memory.videos.length > 0 ? (
                        <circle cx={leaf.x} cy={leaf.y} r={1.8} fill="#FFFFFF" />
                      ) : null}
                    </g>
                  );
                })}
              </g>
            </svg>

            {memoryCount === 0 && (
              <div className="absolute bottom-6 text-center bg-white px-4 py-2 rounded-2xl border border-[#E8E2D5] text-xs text-[#6B655D] shadow-xs max-w-[280px]">
                <p className="font-semibold text-[#3D4B38]">🌱 Plante a primeira memória</p>
                <p className="text-[11px] text-[#8C867E]">
                  Cada momento registrado florescerá como uma folha viva.
                </p>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="w-full mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-[#8C867E]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8F9F76]" />
              <span>0–1 ano</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4A6741]" />
              <span>1–3 anos</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#588157]" />
              <span>3–6 anos</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
              <span>Marcos / 15 anos</span>
            </span>
          </div>
        </div>
      ) : (
        /* Gallery List Mode */
        <div className="space-y-3">
          {visibleLeafNodes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {visibleLeafNodes.map((node) => {
                const mem = node.memory;
                const firstPhoto = mem.photos?.find((p) => Boolean(p && p.url && p.url.trim() !== ''));
                const stageDef = STAGE_BRANCHES.find((s) => s.id === node.stageId);

                return (
                  <div
                    key={mem.id}
                    id={`tree-card-${mem.id}`}
                    onClick={() => {
                      setSelectedLeafId(mem.id);
                      onSelectMemory(mem);
                    }}
                    className="bg-white rounded-2xl p-3 border border-[#F0EDE6] shadow-2xs hover:border-[#A3B18A] transition-all cursor-pointer flex items-center gap-3 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#E5E1D8] shrink-0 overflow-hidden relative flex items-center justify-center">
                      {firstPhoto && firstPhoto.url ? (
                        <Image
                          src={firstPhoto.url}
                          alt={mem.title}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : mem.videos && mem.videos.length > 0 ? (
                        <div className="w-full h-full bg-[#3D4B38] flex items-center justify-center text-white">
                          <Video className="w-4 h-4" />
                        </div>
                      ) : mem.audios && mem.audios.length > 0 ? (
                        <div className="w-full h-full bg-[#A3B18A]/20 flex items-center justify-center text-[#4A6741]">
                          <Mic className="w-4 h-4" />
                        </div>
                      ) : (
                        <Leaf className="w-5 h-5 text-[#4A6741]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-[#8C867E]">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: node.color }}
                        />
                        <span className="font-semibold">{stageDef?.shortName || 'Bebê'}</span>
                        <span>•</span>
                        <span>{formatDatePortuguese(mem.date, { short: true })}</span>
                      </div>
                      <h4 className="font-semibold text-xs text-[#4A443F] truncate group-hover:text-[#4A6741] transition-colors mt-0.5">
                        {mem.title}
                      </h4>
                      <p className="text-[11px] text-[#8C867E] truncate italic font-serif">
                        {mem.content || mem.title}
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-[#8C867E]" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-5 text-center border border-[#F0EDE6] text-xs text-[#8C867E]">
              Nenhuma memória nesta fase da árvore ainda.
            </div>
          )}
        </div>
      )}

      {/* Selected Leaf Modal/Card */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="mt-4 p-4 bg-white rounded-2xl border border-[#D5CFBF] shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#4A6741]" />

            <div className="flex items-start gap-3 min-w-0 flex-1 pl-2">
              <div className="w-11 h-11 rounded-xl bg-[#EBE7DF] overflow-hidden relative shrink-0 flex items-center justify-center">
                {selectedNode.memory.photos && selectedNode.memory.photos[0]?.url ? (
                  <Image
                    src={selectedNode.memory.photos[0].url}
                    alt={selectedNode.memory.title}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : selectedNode.memory.videos && selectedNode.memory.videos.length > 0 ? (
                  <Video className="w-4 h-4 text-[#4A6741]" />
                ) : selectedNode.memory.audios && selectedNode.memory.audios.length > 0 ? (
                  <Mic className="w-4 h-4 text-[#4A6741]" />
                ) : (
                  <Leaf className="w-4 h-4 text-[#4A6741]" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#8C867E] mb-0.5">
                  <span className="font-semibold text-[#4A6741] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDatePortuguese(selectedNode.memory.date)}
                  </span>
                  <span>•</span>
                  <span>{selectedNode.memory.calculatedAge}</span>
                </div>

                <h3 className="font-serif text-sm sm:text-base text-[#3D4B38] font-bold truncate">
                  {selectedNode.memory.title}
                </h3>
                <p className="text-xs text-[#6B655D] line-clamp-1 italic font-serif mt-0.5">
                  &ldquo;{selectedNode.memory.content || selectedNode.memory.title}&rdquo;
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center pl-2">
              <button
                type="button"
                onClick={() => setSelectedLeafId(null)}
                className="px-3 py-1.5 rounded-full text-xs text-[#8C867E] hover:text-[#4A443F] hover:bg-[#F5F2EB] transition-colors cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                id={`btn-open-detail-${selectedNode.memory.id}`}
                onClick={() => onSelectMemory(selectedNode.memory)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#4A6741] hover:bg-[#3D5436] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <span>Ver Completa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-[#EBE4D5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#8C867E]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-[#4A6741]" />
            <span>
              <strong className="text-[#3D4B38] font-semibold">{memoryCount}</strong> {memoryCount === 1 ? 'folha viva' : 'folhas vivas'}
            </span>
          </div>
          {goldenCount > 0 && (
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              <span>
                <strong className="text-[#B8932E] font-semibold">{goldenCount}</strong> {goldenCount === 1 ? 'marco dourado' : 'marcos dourados'}
              </span>
            </div>
          )}
        </div>

        {onOpenFullTree && !isFullView && (
          <button
            type="button"
            id="btn-expand-full-tree"
            onClick={onOpenFullTree}
            className="text-[#4A6741] font-semibold hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>Explorar árvore em tela cheia</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </section>
  );
};
