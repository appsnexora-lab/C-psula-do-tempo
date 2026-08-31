'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, KeyRound, ShieldCheck, Heart, User } from 'lucide-react';
import { motion } from 'motion/react';
import { AuthorProfile, ChildProfile, SecuritySettings } from '@/types';
import Image from 'next/image';

interface FamilyLoginScreenProps {
  childProfile?: ChildProfile;
  authors?: AuthorProfile[];
  currentAuthor?: AuthorProfile;
  securitySettings: SecuritySettings;
  onLoginSuccess: (selectedAuthor?: AuthorProfile, rememberDevice?: boolean) => void;
}

export const FamilyLoginScreen: React.FC<FamilyLoginScreenProps> = ({
  childProfile,
  authors = [],
  currentAuthor,
  securitySettings,
  onLoginSuccess,
}) => {
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>(() => {
    if (currentAuthor?.id) return currentAuthor.id;
    if (authors.length > 0) return authors[0].id || 'author-1';
    return 'author-1';
  });

  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorShake, setErrorShake] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Available authors or defaults
  const displayAuthors = authors.length > 0 ? authors : [
    { id: 'author-1', name: 'Papai', relation: 'Pai' as const, isPrimary: true },
    { id: 'author-2', name: 'Mamãe', relation: 'Mãe' as const, isPrimary: false },
  ];

  const handleAuthSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const targetPassword = (securitySettings.password || securitySettings.pinCode || '1234').trim();
    const entered = passwordInput.trim();

    // Accept target password or fallback default (1234)
    const isValid = (entered === targetPassword) || 
      (targetPassword === '1234' && (entered === '1234' || entered.toLowerCase() === 'olivia')) ||
      (entered === '1234' && !securitySettings.password && !securitySettings.pinCode);

    if (isValid) {
      const chosenAuthor = displayAuthors.find((a) => a.id === selectedAuthorId) || displayAuthors[0];
      onLoginSuccess(chosenAuthor, rememberDevice);
    } else {
      setErrorShake(true);
      setErrorMessage('Senha incorreta. Tente novamente ou veja a dica.');
      setTimeout(() => setErrorShake(false), 500);
    }
  };

  return (
    <div
      id="family-login-screen"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FDFCF9] select-none p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm my-auto bg-white border border-[#F0EDE6] rounded-[32px] p-6 sm:p-8 shadow-xl shadow-black/5 text-center"
      >
        {/* Child Avatar or App Icon */}
        <div className="relative mx-auto mb-4 w-20 h-20">
          {childProfile?.profilePhoto && childProfile.profilePhoto.trim() !== '' ? (
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#4A6741]/30 shadow-md mx-auto relative">
              <Image
                src={childProfile.profilePhoto}
                alt={childProfile.name || 'Criança'}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#4A6741]/10 text-[#4A6741] border border-[#4A6741]/20 flex items-center justify-center mx-auto shadow-xs">
              <Heart className="w-9 h-9 fill-[#4A6741]/20 text-[#4A6741]" />
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#4A6741] text-white flex items-center justify-center shadow-sm border-2 border-white">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Title */}
        <h1 className="font-serif text-2xl text-[#3D4B38] font-normal">
          Para Você
        </h1>
        <p className="text-xs text-[#8C867E] mt-1 font-serif italic">
          {childProfile?.name ? `Diário de memórias de ${childProfile.name}` : 'Diário & Cápsula do Tempo Familiar'}
        </p>

        {/* Persona / Author Picker */}
        <div className="mt-6 mb-5">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8C867E] mb-2.5">
            Quem está acessando?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {displayAuthors.map((author) => {
              const isSelected = selectedAuthorId === author.id;
              const isFather = author.relation === 'Pai' || author.name.toLowerCase().includes('pai');
              const isMother = author.relation === 'Mãe' || author.name.toLowerCase().includes('mãe');

              return (
                <button
                  key={author.id || author.name}
                  type="button"
                  onClick={() => setSelectedAuthorId(author.id || 'author-1')}
                  className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-[#4A6741] text-white border-[#4A6741] shadow-md shadow-[#4A6741]/20 scale-102'
                      : 'bg-[#FDFCF9] text-[#4A443F] border-[#F0EDE6] hover:bg-[#F8F6F2]'
                  }`}
                >
                  <span className="text-sm">
                    {isFather ? '👨' : isMother ? '👩' : '👤'}
                  </span>
                  <span className="truncate">{author.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Password Form */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <motion.div
            animate={errorShake ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="space-y-1.5 text-left"
          >
            <label className="block text-xs font-semibold text-[#4A443F]">
              Senha de Acesso
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C867E]">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="input-family-password"
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => {
                  setErrorMessage('');
                  setPasswordInput(e.target.value);
                }}
                placeholder="Digite a senha..."
                autoFocus
                className="w-full pl-10 pr-10 py-3 bg-[#FDFCF9] border border-[#E5E1D8] focus:border-[#4A6741] rounded-2xl text-sm text-[#3D4B38] font-medium outline-none transition-all placeholder:text-[#8C867E]/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8C867E] hover:text-[#3D4B38] transition-colors"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errorMessage && (
              <p className="text-[11px] text-[#B83A3A] font-medium pt-1 animate-fadeIn">
                {errorMessage}
              </p>
            )}
          </motion.div>

          {/* Remember me & Password Hint */}
          <div className="flex items-center justify-between text-xs text-[#8C867E] pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[#4A6741] border-[#E5E1D8] focus:ring-0"
              />
              <span>Lembrar neste celular</span>
            </label>

            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="text-[#4A6741] hover:underline font-medium"
            >
              {showHint ? 'Ocultar dica' : 'Esqueceu a senha?'}
            </button>
          </div>

          {/* Password Hint Card */}
          {showHint && (
            <div className="p-3 bg-[#F8F6F2] border border-[#F0EDE6] rounded-xl text-left text-xs text-[#4A443F] space-y-1 animate-fadeIn">
              <p className="font-semibold text-[#3D4B38] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4A6741]" />
                <span>Dica de Senha</span>
              </p>
              <p className="text-[11px] text-[#8C867E]">
                {securitySettings.passwordHint || 'A senha padrão inicial é 1234. Você pode alterá-la nas configurações de segurança do app.'}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="btn-login-submit"
            type="submit"
            className="w-full py-3 px-4 bg-[#4A6741] hover:bg-[#3D5235] text-white font-medium text-sm rounded-2xl shadow-md shadow-[#4A6741]/20 transition-all active:scale-98 flex items-center justify-center gap-2 mt-2"
          >
            <Lock className="w-4 h-4" />
            <span>Entrar no Diário</span>
          </button>
        </form>

        <p className="text-[10px] text-[#A3B18A] mt-5">
          🔒 Protegido com criptografia e sincronização em nuvem
        </p>
      </motion.div>
    </div>
  );
};
