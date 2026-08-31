'use client';

import React, { useState } from 'react';
import { ChildProfile, AuthorProfile, AuthorRelation } from '@/types';
import { Heart, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (child: ChildProfile, author: AuthorProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState(1);
  const [childName, setChildName] = useState('');
  const [birthDate, setBirthDate] = useState('2024-03-15');
  const [authorName, setAuthorName] = useState('');
  const [relation, setRelation] = useState<AuthorRelation>('Pai');

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1) {
      if (!childName.trim()) return;
      setStep(2);
    } else if (step === 2) {
      if (!birthDate) return;
      setStep(3);
    } else {
      onComplete(
        {
          name: childName.trim(),
          birthDate,
          nickname: '',
          notes: '',
        },
        {
          name: authorName.trim() || (relation === 'Pai' ? 'Papai' : 'Mamãe'),
          relation,
        }
      );
    }
  };

  return (
    <div
      id="onboarding-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="bg-[#FDFCF9] border border-[#F0EDE6] rounded-[32px] max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center">
        {/* Seed Graphic */}
        <div className="w-16 h-16 rounded-full bg-[#A3B18A]/20 text-[#4A6741] flex items-center justify-center mx-auto mb-4 border border-[#A3B18A]/30">
          <Heart className="w-8 h-8 fill-[#4A6741]" />
        </div>

        <span className="text-[10px] font-serif uppercase tracking-widest text-[#8C867E] font-bold block mb-1">
          Bem-vindo ao Para Você
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl text-[#3D4B38] font-normal mb-2">
          Comece a sua história
        </h2>
        <p className="font-serif text-xs text-[#8C867E] italic max-w-xs mx-auto mb-6">
          &ldquo;Tudo aquilo que eu não quero esquecer, estou guardando para você.&rdquo;
        </p>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                step === s ? 'w-8 bg-[#4A6741]' : step > s ? 'w-4 bg-[#4A6741]/50' : 'w-4 bg-[#E5E1D8]'
              }`}
            />
          ))}
        </div>

        {/* Steps Content */}
        <div className="min-h-[140px] flex flex-col justify-center">
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-3"
            >
              <label className="block text-sm font-semibold text-[#4A443F]">
                Qual é o nome da sua filha?
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Ex: Olívia, Sofia, Maya..."
                className="w-full px-4 py-3 text-center bg-white border border-[#F0EDE6] rounded-2xl text-base text-[#4A443F] focus:outline-none focus:border-[#A3B18A] shadow-2xs"
                autoFocus
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-3"
            >
              <label className="block text-sm font-semibold text-[#4A443F]">
                Quando ela nasceu?
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-4 py-3 text-center bg-white border border-[#F0EDE6] rounded-2xl text-sm text-[#4A443F] focus:outline-none focus:border-[#A3B18A] shadow-2xs"
                autoFocus
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-3"
            >
              <label className="block text-sm font-semibold text-[#4A443F]">
                Como ela te chama?
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {(['Pai', 'Mãe', 'Avô', 'Avó'] as AuthorRelation[]).map((rel) => (
                  <button
                    key={rel}
                    type="button"
                    onClick={() => {
                      setRelation(rel);
                      if (!authorName) setAuthorName(rel === 'Pai' ? 'Papai' : rel === 'Mãe' ? 'Mamãe' : rel);
                    }}
                    className={`py-2.5 rounded-2xl text-xs font-semibold border transition-all ${
                      relation === rel
                        ? 'bg-[#4A6741] text-white border-[#4A6741] shadow-2xs'
                        : 'bg-white border-[#F0EDE6] text-[#8C867E] hover:bg-[#F8F6F2]'
                    }`}
                  >
                    {rel}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Ex: Papai, Papito..."
                className="w-full px-4 py-2.5 text-center bg-white border border-[#F0EDE6] rounded-2xl text-sm text-[#4A443F] focus:outline-none focus:border-[#A3B18A] shadow-2xs"
              />
            </motion.div>
          )}
        </div>

        {/* Next Button */}
        <div className="mt-8">
          <button
            type="button"
            onClick={handleNext}
            className="w-full py-3.5 bg-[#4A6741] hover:bg-[#3D5235] text-white rounded-2xl text-sm font-semibold transition-all shadow-md shadow-[#4A6741]/20 flex items-center justify-center gap-2 active:scale-95"
          >
            <span>{step === 3 ? 'Começar a guardar memórias' : 'Continuar'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
